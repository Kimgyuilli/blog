---
title: "서버는 멀쩡한데 왜 503이 났을까"
description: "GKE Autopilot의 노드 축소 중 Ready Pod가 0개가 되며 발생한 간헐적 503을 추적하고, replica·PDB·topology spread로 요청 경로를 지킨 과정을 정리합니다."
image: "/images/blog/gke-autopilot-transient-503/thumbnail.png"
pubDate: 2026-07-18
category: "infra"
tags: ["kubernetes", "gke", "gke-autopilot", "ingress-nginx", "pdb", "topology-spread"]
draft: false
slug: "gke-autopilot-transient-503"
---

개발 환경에서 API 서버가 간헐적으로 HTTP 503을 반환했다. 계속 장애가 난 것은
아니었다. 평소에는 정상인데 가끔 1분 남짓 요청이 실패하고, 잠시 뒤 아무 일도
없었다는 듯 다시 살아났다.

처음에는 애플리케이션 예외나 DB 연결 문제를 의심했다. 하지만 로그를 따라가 보니
문제는 코드 안이 아니라 **요청을 받을 Ready Pod가 잠시 0개가 되는 구간**에
있었다. GKE Autopilot이 노드를 축소하면서 유일한 서버 Pod를 옮겼고, 대체 Pod가
이미지를 내려받아 Spring Boot를 시작하는 동안 Service에서 backend가 사라졌다.
ingress-nginx는 연결할 upstream이 없으니 503을 반환했다.

이 글은 그 503을 다음 순서로 좁혀간 기록이다.

1. 503을 누가 반환했는가?
2. 왜 Service endpoint가 0개가 됐는가?
3. readiness probe와 RollingUpdate가 있는데도 왜 요청이 끊겼는가?
4. 비용을 과도하게 늘리지 않으면서 한 번의 노드 축소를 견디려면 무엇이 필요한가?
5. 수정 뒤 실제 배포에서는 같은 조건을 버텼는가?

핵심을 먼저 적으면 이렇다.

> 단일 Pod는 상태가 건강한가와 무관하게 교체 순간 가용성이 0이 될 수 있다.
> 이번 503은 서버가 잘못된 응답을 만든 문제가 아니라, 응답할 서버가 없었던
> 문제였다.

---

## 용어

| 용어               | 이 글에서의 의미                                                               |
| ---------------- | ----------------------------------------------------------------------- |
| Pod              | 애플리케이션 컨테이너가 실행되는 Kubernetes의 기본 단위. 죽으면 같은 IP로 살아나는 것이 아니라 새 Pod로 대체된다 |
| Ready Pod        | readiness probe를 통과해 Service가 요청을 보내도 된다고 판단한 Pod                       |
| Service endpoint | Service가 현재 트래픽을 전달할 수 있는 Ready Pod의 IP 목록                              |
| ingress-nginx    | 외부 HTTP 요청을 받아 Kubernetes Service로 전달하는 ingress controller              |
| RollingUpdate    | 새 버전 Pod를 준비한 뒤 기존 버전 Pod를 줄여가는 Deployment의 기본 교체 전략                    |
| PDB              | PodDisruptionBudget. 노드 drain·축소 같은 자발적 중단에서 최소 몇 개의 Pod를 남길지 선언한다      |
| topology spread  | 같은 종류의 Pod가 한 노드나 zone에 몰리지 않도록 topology domain별 배치를 제한하는 규칙            |
| GKE Autopilot    | 노드 프로비저닝·축소와 Pod 자원 정책을 GKE가 관리하는 운영 모드                                 |

---

## 문제 발생: 서버가 가끔 503이 된다

구성은 단순했다.

```text
Client
  ↓
GCP Load Balancer
  ↓
ingress-nginx (1 replica)
  ↓
momens-server Service
  ↓
momens-server Pod (1 replica)
```

개발·QA용 단기 환경이라 비용을 줄이기 위해 API 서버를 1 replica로 운영하고
있었다. Spring Boot Actuator 기반의 startup/readiness/liveness probe도 있었고,
Deployment는 기본 RollingUpdate 전략을 사용했다.

겉으로 보면 다음과 같은 기대를 하게 된다.

- 서버가 준비되기 전에는 readiness probe가 트래픽을 막아준다.
- 새 버전을 배포하면 RollingUpdate가 기존 Pod를 유지한 채 새 Pod를 띄운다.
- Pod가 죽어도 Deployment가 다시 만들어준다.

셋 다 맞는 설명이다. 그런데 셋 중 어느 것도 **항상 요청을 받을 Pod가 최소
1개는 존재한다**는 보장은 아니었다.

실제 장애 구간 중 하나는 2026년 7월 17일 22시 47분경이었다. 모바일 요청과
Swagger 요청이 약 1분 동안 503을 받았고 이후 정상화됐다. 애플리케이션은 별도의
500 예외를 남기지 않았다.

더 헷갈린 점은 장애가 **배포 버튼을 누른 순간이 아니라, 배포가 정상 완료된 것처럼
보인 뒤 몇 분 지나서** 발생했다는 것이다. 배포 중 새 Pod가 실패했다면 원인
연결이 쉬웠겠지만, GitHub Actions의 rollout은 성공했고 새 버전도 정상 응답했다.
그 뒤 약 5~10분 후 갑자기 503이 나타났기 때문에 처음에는 배포와 별개의
애플리케이션 오류처럼 보였다.

---

## 원인 탐색: 503을 누가 만들었는가

### 1. 애플리케이션이 반환한 503인가?

먼저 ingress-nginx access log에서 같은 시각의 요청을 확인했다.

```text
"GET /api/mobile/... HTTP/2.0" 503 ... [momens-dev-momens-server-80] [] - - - -
```

여기서 중요한 부분은 뒤쪽의 upstream 정보다.

- upstream 주소: `-`
- upstream 응답 시간: 없음
- ingress 처리 시간: 사실상 `0.000`

요청이 Spring Boot까지 전달됐다면 upstream에 `10.x.x.x:8080` 같은 Pod IP와
애플리케이션 응답 코드가 남아야 한다. 그런데 주소 자체가 없었다. 즉 이 503은
애플리케이션이 만든 응답이 아니라 **ingress-nginx가 전달할 backend를 찾지
못해 즉시 반환한 응답**이었다.

이 단계에서 애플리케이션 예외와 DB 장애는 1차 원인 후보에서 빠졌다. DB가
느리거나 쿼리가 실패했다면 적어도 요청은 Pod에 도달해야 한다.

### 2. ingress controller가 죽었는가?

같은 시각 ingress-nginx controller는 `1/1 Ready`, 재시작 0회였다. 외부
LoadBalancer와 TLS 인증서도 정상이었다.

ingress까지 요청이 들어와 access log가 남았다는 사실 자체가 외부 진입 경로는
살아 있었다는 뜻이기도 하다. 문제 범위는 ingress 뒤쪽의 Service와 Pod로
좁혀졌다.

### 3. Service에 Ready endpoint가 있었는가?

Kubernetes 이벤트를 ingress 로그와 맞춰 보니 시각이 정확히 겹쳤다.

| 시각 (KST) | 이벤트 |
| --- | --- |
| 22:47:37 | Autopilot `ScaleDown`이 유일한 `momens-server` Pod 삭제 |
| 22:47:37 | 대체 Pod 스케줄링 |
| 22:47:38 | 이미지 pull 시작 |
| 22:47:54 | 이미지 pull 완료 |
| 22:47:55 | 컨테이너 시작 |
| 22:48:53 | Tomcat 및 Spring Boot 시작 완료 |
| 22:48:58 | 새 Pod `Ready=True` |

기존 Pod가 내려간 시점부터 새 Pod가 Ready가 될 때까지 약 **81초**가 걸렸다.
그 사이 `momens-server` Service의 endpoint는 0개였다.

흐름을 한 줄로 쓰면 다음과 같다.

```text
Autopilot node scale-down
  → 유일한 Pod 종료
  → Deployment가 대체 Pod 생성
  → 이미지 pull + Spring Boot 기동
  → 약 81초 동안 Ready endpoint 0개
  → ingress-nginx가 503 반환
```

비슷한 `ScaleDown → Pod 재생성 → startup probe 대기` 패턴은 같은 날 앞선
시각에도 반복됐다. 한 번의 우연한 재시작이 아니라, 단일 replica와 Autopilot의
노드 최적화가 만날 때 재현 가능한 구조적 빈틈이었다.

### 4. readiness probe가 너무 느려서 생긴 문제인가?

readiness probe는 오히려 제 역할을 했다.

새 Pod는 컨테이너가 시작됐다는 이유만으로 바로 트래픽을 받지 않았다. Spring
ApplicationContext와 Tomcat이 준비된 뒤 `/actuator/health/readiness`가 성공했을
때만 endpoint에 들어왔다. 준비되지 않은 서버에 요청을 보내 500이나 connection
reset을 만드는 일을 막았다.

문제는 readiness가 늦은 것이 아니라, **readiness를 기다려줄 다른 Ready Pod가
없었다는 것**이다. probe 주기를 줄이면 endpoint가 생기는 시점을 몇 초 앞당길
수는 있어도, 이미지 pull과 애플리케이션 기동 시간 전체를 없앨 수는 없다.

### 5. RollingUpdate인데 왜 무중단이 아니었는가?

정상적인 이미지 배포에서는 기본 RollingUpdate가 어느 정도 보호해준다.
replica가 1개여도 `maxUnavailable: 25%`는 반올림 결과 0이 되고,
`maxSurge: 25%`는 1이 된다. 새 Pod가 Ready가 된 뒤 기존 Pod를 내리는 흐름이
가능하다.

하지만 이번 사건은 Deployment가 계획한 버전 교체가 아니었다. Autopilot이
노드를 줄이기 위해 실행한 **자발적 Pod 중단**이었다. 당시에는 이를 제한할
PDB가 없었다. 유일한 Pod를 먼저 삭제해도 Kubernetes 정책상 막을 것이 없었고,
Deployment는 삭제 후에야 replica 수를 맞추기 위해 대체 Pod를 만들었다.

여기서 구분해야 할 것이 생겼다.

```text
Deployment RollingUpdate
  = 애플리케이션 버전을 어떻게 교체할 것인가

PodDisruptionBudget
  = 노드 drain 같은 자발적 중단에서 몇 개를 남길 것인가
```

RollingUpdate 설정만으로는 노드 축소를 통제할 수 없다.

### 6. 배포 스크립트도 불필요한 Pod churn을 만들고 있었다

직접적인 503 원인은 단일 Pod의 node scale-down이었지만, 배포 경로에도
개선할 부분이 있었다.

기존 스크립트는 먼저 새 이미지 태그를 Kustomize로 적용했다. 이미지가 바뀌면
이 단계에서 이미 새 ReplicaSet이 생성된다. 그런데 Secret 값을 새 Pod에
반영한다는 이유로 바로 뒤에서 `kubectl rollout restart`를 한 번 더 실행했다.

```text
kubectl apply -k ...      # 이미지 변경 → ReplicaSet A 생성
kubectl rollout restart  # Pod template 변경 → ReplicaSet B 생성
```

한 번의 배포가 ReplicaSet 두 개를 연달아 만들었다. 당시 클러스터에는 여유
메모리가 부족해 새 Pod가 Pending 상태가 됐고, Autopilot이 임시 노드를
확장했다가 다시 축소하는 churn도 커졌다.

이중 rollout이 그날의 503을 직접 만든 것은 아니다. 하지만 노드 확장·축소가
빈번한 환경에서 불필요한 Pod 교체를 늘리는 증폭 요인이었다.

### 7. 왜 배포 직후가 아니라 약 10분 뒤에 503이 발생했는가?

이 사건을 이해하는 데 가장 헷갈렸던 지점이다. 503은 rollout 도중이 아니라
rollout이 끝난 뒤에 나타났다.

당시 서버는 1 replica였고 기본 RollingUpdate의 `maxSurge: 25%`가 적용되고
있었다. replica가 1개일 때 `maxSurge`는 반올림되어 1개가 된다. 따라서 배포
중에는 기존 Pod 1개를 유지한 채 새 Pod 1개를 추가로 띄운다.

```text
평상시: 기존 Pod 1개
배포 중: 기존 Pod 1개 + 신규 Pod 1개 = 최대 2개
배포 완료: 신규 Pod 1개
```

클러스터에는 이 추가 Pod를 놓을 CPU·메모리 여유가 없었다. Autopilot은 rollout을
진행하기 위해 임시 노드를 확장하고 새 Pod를 그곳에 배치했다. 새 Pod가 Ready가
되자 Deployment는 기존 Pod를 종료했고 rollout은 성공으로 끝났다.

하지만 인프라 관점에서는 일이 아직 끝난 것이 아니었다. 기존 Pod가 사라지며
원래 노드에 다시 여유가 생겼고, 조금 전 추가한 임시 노드는 상대적으로
비효율적인 배치가 됐다. Autopilot의 optimize-utilization/cluster autoscaler는
rollout 명령과 별개로 클러스터 상태를 관찰하다가, 즉시가 아니라 **안정화 시간을
둔 뒤** 여유 노드를 축소하고 Pod를 다시 옮겼다.

실제 시각을 맞추면 다음과 같다.

| 시각 (KST) | 상태 |
| --- | --- |
| 22:39:00 | 새 서버 이미지 배포 시작 |
| 22:40경 | 용량 부족으로 Autopilot이 임시 노드 확장 |
| 22:42:03경 | 새 Pod가 준비되어 기존 Pod 종료, rollout 마무리 |
| 22:47:37 | Autopilot이 여유 노드를 축소하며 유일한 새 Pod 삭제 |
| 22:48:58 | 대체 Pod Ready, 503 구간 종료 |

배포 시작부터 보면 약 8분 30초, rollout 마무리부터 보면 약 5분 30초 뒤에
ScaleDown이 발생했다. 체감상 "배포하고 10분쯤 뒤"였던 이유다.

중요한 것은 **Kubernetes가 배포 후 정확히 10분을 기다리도록 설정돼 있었다는
뜻은 아니라는 점**이다. 이 시간은 고정된 애플리케이션 타이머가 아니라,
Autopilot이 노드 사용률·스케줄 가능 여부·축소 안정화 조건을 다시 평가한 뒤
내린 비동기 인프라 결정의 결과다. 클러스터 상황에 따라 더 빠르거나 늦을 수
있다.

그래서 GitHub Actions의 `rollout status`가 성공했다고 해서 그 직후의 노드
재배치까지 끝났다고 볼 수는 없다. Deployment rollout과 cluster autoscaling은
서로 다른 reconciliation loop에서 움직인다.

---

## 원인 정리: 네 조건이 동시에 만났다

이번 장애는 한 설정의 단독 실패라기보다 네 조건의 조합이었다.

```text
서버 replica = 1
  +
PDB 없음
  +
Autopilot node scale-down
  +
이미지 pull + Spring Boot 시작에 1분 이상
  =
Ready endpoint 0개 → ingress 503
```

이 식에서 startup 시간은 장애 지속 시간을 결정하지만, 장애의 존재 자체를
결정한 것은 `replica=1`과 `PDB 없음`이었다.

---

## 해결 방안들: 무엇을 바꾸면 되는가

가능한 해법을 먼저 펼쳐놓고 각각이 무엇을 해결하고 무엇을 남기는지 비교했다.

| 방안                                          | 얻는 것                             | 남는 문제                                       |
| ------------------------------------------- | -------------------------------- | ------------------------------------------- |
| 이미지 크기·Spring 시작 시간 단축                      | 장애 구간과 배포 시간을 줄임                 | endpoint가 0개가 되는 구조는 그대로                    |
| startup/readiness probe 조정                  | 느린 부팅에 대한 오판·불필요한 재시작 감소         | 다른 Ready Pod를 만들어주지는 않음                     |
| 1 replica + PDB `minAvailable: 1`           | 자발적 노드 drain이 유일한 Pod를 바로 지우지 못함 | 단일 노드 장애에 취약하고, 유지보수가 막힐 수 있음               |
| 2 replicas만 적용                              | 하나가 교체될 때 다른 하나가 남을 가능성 증가       | 같은 노드에 몰릴 수 있고, 자발적 중단의 최소 가용 수를 명시하지 않음    |
| 2 replicas + required pod anti-affinity     | 두 Pod를 서로 다른 노드에 강제              | GKE Autopilot에서 Pod당 CPU request 최소 500m 요구 |
| 2 replicas + preferred anti-affinity        | 추가 CPU 비용 없이 다른 노드를 선호           | 실제 스케줄링 결과 두 Pod가 같은 노드에 배치됨                |
| 2 replicas + PDB + required topology spread | 자발적 중단 보호와 노드 분산을 함께 달성          | replica 증가 비용과 추가 노드 프로비저닝 시간               |

### 시작 시간을 줄이는 것만으로는 부족하다

이미지 pull 16초와 Spring 시작 약 55초를 최적화하면 분명 도움이 된다. 하지만
아무리 줄여도 `기존 Pod 종료 → 새 Pod Ready` 사이의 시간은 0이 아니다.
가용성 문제를 성능 최적화만으로 해결하면 "짧은 장애"가 될 뿐 "무중단"이 되지는
않는다.

시작 시간 최적화는 **복구 시간 개선**, 다중 replica와 PDB는 **가용성 구조
개선**이다. 서로 대체 관계가 아니다.

### PDB만 추가하면 충분한가

1 replica에 `minAvailable: 1` PDB를 추가하면 cluster autoscaler가 그 Pod를
자발적으로 축출하기 어려워진다. 이번 사건만 좁게 보면 효과가 있다.

하지만 이 구성은 여전히 단일 실패 지점이다. 노드가 갑자기 사라지는 비자발적
장애에는 PDB가 적용되지 않는다. 또한 새 노드나 대체 Pod를 준비할 여지 없이
기존 노드 drain을 계속 막을 수 있다.

PDB는 replica를 대신하는 장치가 아니다. **여러 replica 중 자발적으로 몇 개까지
동시에 내릴 수 있는지 정하는 장치**에 가깝다.

### required pod anti-affinity는 왜 선택하지 않았나

처음에는 같은 앱 Pod를 서로 다른 hostname에 강제하는 required pod
anti-affinity가 가장 직관적이었다. 그런데 실제 GKE server-side dry-run에서
Autopilot admission이 이를 거부했다.

```text
workload 'momens-server' cpu requests '250m' is lower than
the Autopilot minimum required of '500m' for using pod anti affinity
```

서버뿐 아니라 ingress controller에도 같은 정책을 적용하면 네 Pod의 CPU
request를 모두 500m 이상으로 올려야 했다. 짧게 운영하는 개발 환경에서
가용성을 위해 필요한 비용보다 큰 자원 상향이었다.

preferred anti-affinity도 시험했다. admission은 통과했지만 Autopilot은 선호
조건을 만족시키려고 새 노드를 만들지는 않았다. 결과적으로 두 서버 Pod와 두
ingress Pod가 모두 같은 노드에 배치됐다. "선호"는 보장이 아니었다.

---

## 선택한 해결법: 2 replicas + PDB + ReplicaSet별 topology spread

최종적으로 외부 요청 경로의 두 계층을 함께 이중화했다.

```text
GCP Load Balancer
  ↓
ingress-nginx controller × 2
  - 서로 다른 node
  - PDB minAvailable: 1
  ↓
momens-server × 2
  - 서로 다른 node
  - PDB minAvailable: 1
```

서버만 두 개로 늘리고 ingress controller를 하나로 남기면 외부 진입점이 새로운
단일 실패 지점이 된다. 이번 문제는 "서버 Pod가 하나"여서 드러났지만, 해결
범위는 **클라이언트에서 서버까지의 전체 요청 경로**로 잡았다.

### 1. 서버는 항상 Ready replica를 하나 이상 유지한다

Deployment의 핵심 설정은 다음과 같다.

```yaml
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  minReadySeconds: 10
```

- `replicas: 2`: 한 Pod가 이동하거나 시작 중이어도 다른 Pod가 요청을 받는다.
- `maxUnavailable: 0`: 배포 속도를 위해 Ready Pod 수를 희생하지 않는다.
- `maxSurge: 1`: 새 버전 Pod를 하나 더 띄울 수 있게 한다.
- `minReadySeconds: 10`: readiness가 순간적으로 성공한 직후 기존 Pod를 바로
  내리지 않고, 새 Pod가 10초간 안정적으로 Ready인지 본다.

따라서 현재 2 replica 구성에서 배포 중 Pod가 3개 보이는 것은 의도된 동작이다.

```text
평상시
  신규/현재 Pod 2개

배포 중
  기존 Pod 2개 + 신규 Pod 1개 = 최대 3개
  또는 기존 Pod 1개 + 신규 Pod 2개 = 최대 3개

배포 완료
  신규 Pod 2개
```

세 번째 Pod는 상시 replica가 아니라 무중단 교체를 위한 임시 surge다. 새 Pod가
Ready가 되고 `minReadySeconds: 10`을 통과하면 기존 Pod가 줄어 최종적으로 다시
2개가 된다. 종료 중인 Pod가 `Terminating` 상태로 잠시 남아 있으면
`kubectl get pods`에서는 순간적으로 더 많아 보일 수 있지만, Deployment가
제어하는 비종료 Pod 상한은 `replicas 2 + maxSurge 1 = 3`이다.

이 임시 세 번째 Pod가 추가 노드 프로비저닝을 유발할 수 있다는 점은 과거와
같다. 달라진 것은 이후 Autopilot이 그 노드를 축소하더라도 2 replicas와 PDB가
다른 Ready endpoint를 남긴다는 점이다. 즉 surge를 없앤 것이 아니라,
**surge 이후의 비동기 node scale-down까지 안전하게 만든 것**이다.

### 2. PDB로 자발적 중단의 하한을 선언한다

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: momens-server
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: momens-server
      app.kubernetes.io/component: api
```

Autopilot이 노드를 줄이려면 Pod를 축출해야 한다. PDB는 첫 Pod가 이동하는 동안
두 번째 Ready Pod까지 함께 축출하지 못하게 한다. 대체 Pod가 Ready가 되면 다시
허용 중단 수가 1이 된다.

PDB 상태에서 확인할 값은 `ALLOWED DISRUPTIONS`다.

```text
NAME            MIN AVAILABLE   ALLOWED DISRUPTIONS
momens-server   1               1
```

### 3. `topologySpreadConstraints`로 같은 ReplicaSet의 두 Pod를 분산한다

노드 분산에는 Kubernetes 1.35 클러스터에서 기본 활성화된 beta 필드인
`matchLabelKeys`를 사용했다.

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    minDomains: 2
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app.kubernetes.io/name: momens-server
        app.kubernetes.io/component: api
    matchLabelKeys:
      - pod-template-hash
```

각 필드의 역할은 다음과 같다.

| 필드 | 역할 |
| --- | --- |
| `topologyKey: kubernetes.io/hostname` | 노드를 하나의 배치 domain으로 본다 |
| `minDomains: 2` | 최소 두 노드 domain이 없으면 두 번째 같은 세대 Pod를 같은 노드에 넣지 않는다 |
| `maxSkew: 1` | domain 사이 Pod 수 차이를 최대 1로 제한한다 |
| `DoNotSchedule` | 조건을 못 맞추면 선호로 끝내지 않고 스케줄링을 보류한다 |
| `matchLabelKeys: [pod-template-hash]` | 같은 ReplicaSet, 즉 같은 배포 세대끼리 분산을 계산한다 |

`pod-template-hash`가 중요한 이유는 RollingUpdate 중에는 이전 세대와 새 세대가
잠시 함께 존재하기 때문이다. 모든 세대를 한꺼번에 세면 `maxSurge: 1` 때문에
일시적으로 세 번째 노드를 요구하거나 스케줄링이 꼬일 수 있다.

세대별로 계산하면 이전 ReplicaSet의 두 Pod와 새 ReplicaSet의 두 Pod가 각각
자기 세대 안에서 두 노드에 나뉜다. 새 버전 첫 Pod는 기존 Pod와 같은 노드에
잠시 공존할 수 있지만, 같은 새 ReplicaSet의 두 번째 Pod는 다른 노드가 준비될
때까지 스케줄되지 않는다.

이 방식은 required pod anti-affinity의 500m CPU 제한을 피하면서 실제 노드
분산은 강제했다.

### 4. ingress-nginx도 같은 기준으로 이중화한다

Helm values에 controller replica와 같은 topology spread를 적용했다.

```yaml
controller:
  replicaCount: 2
  minAvailable: 1
  topologySpreadConstraints:
    - maxSkew: 1
      minDomains: 2
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app.kubernetes.io/name: ingress-nginx
          app.kubernetes.io/instance: ingress-nginx
          app.kubernetes.io/component: controller
      matchLabelKeys:
        - pod-template-hash
```

ingress-nginx chart는 controller replica가 2개일 때 `minAvailable: 1` PDB를
렌더링한다. chart 버전은 기존 운영 버전 `4.15.1`로 명시해, 가용성 설정을
적용하는 작업이 의도치 않은 chart 업그레이드까지 포함하지 않도록 했다.

### 5. 배포는 이미지 변경과 restart annotation을 한 번에 적용한다

Secret 값은 환경변수로 주입되므로 같은 이미지를 재배포할 때도 Pod restart가
필요하다. 그렇다고 이미지 apply 뒤에 `rollout restart`를 따로 할 필요는 없다.

배포 시각 annotation을 임시 Kustomize patch로 만들고, 이미지 태그와 함께 한
번의 `kubectl apply`에 넣었다.

```text
[기존]
image apply → ReplicaSet A
rollout restart → ReplicaSet B

[변경]
image + restarted-at annotation을 한 번에 apply
→ ReplicaSet A 하나
```

Secret-only 재배포 동작은 유지하면서 불필요한 두 번째 ReplicaSet과 Pod churn을
없앴다.

---

## 적용과 검증: "설정상 안전"에서 "실제 배포 중 안전"으로

먼저 Kustomize와 Helm 렌더링, GKE server-side dry-run으로 admission을
검증했다. 그 뒤 라이브 클러스터에 적용해 다음 상태를 확인했다.

```text
momens-server
  replicas: 2/2 Ready
  endpoints: 2
  nodes: 2
  PDB allowed disruptions: 1

ingress-nginx-controller
  replicas: 2/2 Ready
  endpoints: 2
  nodes: 2
  PDB allowed disruptions: 1
```

외부 Actuator health를 50회 연속 호출했을 때 모두 200이었고, 적용 구간의 두
ingress controller 로그에는 502/503/504가 없었다.

더 의미 있는 검증은 다음 서버 버전을 실제로 배포할 때 나왔다.

새 이미지의 두 번째 Pod를 위한 Autopilot scale-up이 한 차례 GCE quota 초과로
실패했고, 다른 노드가 준비되기까지 배포가 지연됐다. 게다가 Spring Boot 시작은
첫 새 Pod가 약 89초, 두 번째가 약 123초 걸렸다. 이전 구조였다면 충분히 503
구간이 생길 조건이었다.

하지만 배포 중에는 다음 두 endpoint가 유지됐다.

```text
이전 이미지 Ready Pod 1개
새 이미지 Ready Pod 1개
```

두 번째 새 Pod가 준비될 때까지 이전 Pod가 종료되지 않았고, 외부 health 20회가
모두 200이었다. 마지막에는 새 이미지 Pod 두 개가 서로 다른 노드에서
`2/2 Ready`가 됐고 이전 ReplicaSet은 0개로 줄었다.

이 검증으로 확인한 것은 "Pod가 빨리 떴다"가 아니다. 오히려 quota와 느린 시작이
있어도 **그 기다림을 사용자가 503으로 떠안지 않았다**는 것이다.

---

## 정리: 이번 변경이 보장한 것과 아직 남은 것

### 보장한 것

- Autopilot이 한 노드를 자발적으로 축소해도 Ready 서버 endpoint가 최소 1개
  남는다.
- 같은 ReplicaSet의 서버 Pod 두 개와 ingress controller 두 개는 각각 서로
  다른 노드에 배치된다.
- 새 버전 rollout 중 새 Pod 시작이 느려도 기존 Ready Pod를 먼저 내리지 않는다.
- 배포 한 번이 불필요한 ReplicaSet 두 개를 연속 생성하지 않는다.

### 보장하지 못한 것

- **두 노드나 클러스터 전체 장애**까지 견디는 것은 아니다. PDB는 자발적
  중단에만 적용되며 control plane 밖의 모든 장애를 막지 않는다.
- **zone 장애 대응**은 별도 문제다. 현재 분산 기준은 hostname이며 zone 단위
  `topology.kubernetes.io/zone` 분산은 추가로 검토해야 한다.
- **비용은 증가한다.** 서버와 ingress controller가 각각 1개에서 2개가 됐다.
  이번에는 개발 환경 비용보다 API 가용성을 우선했다.
- **시작 시간 문제는 남았다.** 실제 후속 배포에서 Spring Boot 시작이
  123초까지 늘어 startup probe 허용치 150초에 가까워졌다. 이미지 크기와
  애플리케이션 초기화 경로는 별도의 성능 과제다.
- **클라우드 quota는 배포 시간을 늘릴 수 있다.** 가용성은 유지했지만 새 노드
  scale-up이 quota 때문에 지연됐다. 필요한 quota와 Autopilot 용량 정책을
  관찰해야 한다.
- **503 관측도 보강할 필요가 있다.** 기존 알림은 애플리케이션 HTTP 500에
  집중돼 있어 upstream이 없는 503은 Slack 알림 대상이 아니었다.

이번 일에서 가장 크게 배운 것은 probe나 RollingUpdate 같은 개별 기능의 존재가
곧 가용성을 뜻하지는 않는다는 점이다.

1. readiness probe는 준비되지 않은 Pod를 트래픽에서 빼준다.
2. RollingUpdate는 Deployment가 수행하는 버전 교체를 안전하게 만든다.
3. PDB는 자발적 인프라 중단에서 최소 가용 수를 지킨다.
4. topology spread는 그 replica들이 같은 실패 domain에 몰리지 않게 한다.

네 장치는 서로 대체하지 않는다. 각자 막는 실패가 다르고, 함께 있을 때 비로소
"한 Pod가 이동해도 요청 경로는 남는다"는 성질이 만들어진다.

## 가져가는 한 문장

> 간헐적 503을 줄이는 가장 확실한 방법은 서버를 더 빨리 다시 띄우는 것이
> 아니라, 서버 하나가 다시 뜨는 동안에도 요청을 받을 다른 서버를 남겨두는
> 것이다.

## 참고 문서

- [Kubernetes Deployment의 RollingUpdate와 `minReadySeconds`](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes PodDisruptionBudget과 자발적 중단](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
- [Kubernetes Pod topology spread constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/)
- [GKE cluster autoscaler의 PDB 관련 scale-down 제한](https://cloud.google.com/kubernetes-engine/docs/troubleshooting/cluster-autoscaler-scale-down)
- [ingress-nginx Helm chart 4.15.1 설정](https://github.com/kubernetes/ingress-nginx/tree/helm-chart-4.15.1/charts/ingress-nginx)
