---
title: "PeekCart 학습 기록 19: 모놀리스를 서비스로 떼기 전에 동기 호출부터 끊었습니다"
description: "PeekCart를 다섯 실행 모듈로 분리하며 Product 분리 순서를 바꾼 이유와 Order가 Product·Payment를 직접 호출하던 경계를 이벤트와 로컬 상태로 옮긴 과정을 정리합니다."
pubDate: 2026-10-01
category: "backend"
tags: ["peekcart", "spring-boot", "gradle", "microservices", "kafka", "saga"]
draft: false
slug: "peekcart-monolith-peel-order"
---

Order가 주문 트랜잭션 안에서 Product의 재고를 차감하고 단가를 읽고 있었습니다. 이 상태에서 Product 코드를 `product-service` 모듈로 옮기면 서비스 하나가 생길까요? 당시 Order는 `ProductPort` 인터페이스를 통해 같은 애플리케이션 안의 Product 구현 빈을 호출했습니다. 모듈만 분리하면 그 빈을 더는 주입받을 수 없는 구조였습니다.

PeekCart의 Phase 4에서는 User·Product·Order·Payment·Notification을 각각 실행 가능한 서비스로 분리하기로 했습니다. 처음에는 Notification 다음에 Product를 떼려고 했지만, 코드에서 확인한 동기 호출 때문에 순서를 바꿨습니다. 이 글은 **서비스 간 컴파일 의존을 막는 일과 실행 중 필요한 동기 호출을 없애는 일이 어떻게 달랐는지**를 구현 ①의 순서에 따라 기록합니다.

## 다섯 경계를 정해도 곧바로 다섯 서비스를 실행할 수는 없었습니다

출발점부터 설계 문서가 일치하지 않았습니다. 분리 대상 목록에는 Order·Payment·Notification 세 개가 있었지만, 같은 문서의 Phase 4 그림에는 User와 Product까지 포함한 다섯 서비스와 각자의 DB가 있었습니다. ADR-0010은 다섯 서비스 경계를 확정했습니다. Notification의 영속 DB를 명시하고, 재고의 소유자를 Product로 정했습니다.

재고 소유권은 기존 주문 코드와 충돌했습니다. 당시에는 Order의 주문 트랜잭션이 재고 차감까지 처리했기 때문입니다. Product가 독립 서비스가 되면 Order의 트랜잭션에서 Product 재고를 직접 수정할 수 없습니다. ADR-0010은 이 충돌을 기록했고, 후속 예약 Saga와 로컬 캐시 설계가 이를 풀도록 했습니다.

ADR-0011은 각 서비스의 Gradle 모듈과 `bootJar`를 정하고, 서비스 모듈끼리 직접 `project()` 의존을 추가하지 못하게 했습니다. 하지만 이 규칙만으로 기존 호출이 사라지지는 않았습니다. `ProductPort`처럼 인터페이스 뒤에 감춘 호출은 패키지 경계가 깔끔해 보여도 실행 시 Product 빈이 필요했습니다. **모듈의 의존 그래프와 주문 처리의 호출 그래프를 따로 확인해야 했습니다.**

첫 분리 대상은 Notification이었습니다. 독립 모듈과 부팅 경로를 만들면서 기존 root 애플리케이션도 계속 실행되게 했습니다. 이때 `SlackPort`를 Notification 전속으로 분류한 계획도 수정했습니다. 실제로는 root의 Outbox와 Kafka DLQ 알림에서도 사용하고 있어 공유 `common`으로 옮겼습니다. 코드를 옮길 경계는 이름보다 실제 사용처가 결정했습니다.

인증 배치도 전환기 조건에 맞춰 고쳤습니다. 처음에는 인증 코드를 User 전속으로 두었지만, Gateway가 아직 없는 동안에는 Product의 관리자 API를 포함해 다섯 서비스가 각각 JWT를 검증해야 했습니다. ADR-0014에 따라 검증 코드를 `peekcart-common-auth`로 분리하고 발급과 블랙리스트 기록은 User에 남겼습니다. 공유한 것은 검증 코드입니다. 당시 요청 검증은 각 서비스 프로세스에서 실행됐고, HS256 키와 Redis 블랙리스트 조회도 공유하는 상태였습니다.

Product는 다음 차례에서 미뤘습니다. Order의 동기 `ProductPort` 의존을 먼저 해체해야 했기 때문입니다. 다른 도메인과 이런 직접 결합이 없던 User를 두 번째로 분리했습니다. 이 순서 변경은 다섯 서비스라는 목표를 바꾼 것이 아니라, 목표에 도달할 수 있도록 선행 작업을 재배치한 것입니다.

| 단계 | 분리하거나 바꾼 경계 | 그때 남은 결합 |
| --- | --- | --- |
| Notification → User | 독립 실행 모듈을 먼저 확보 | Order의 `ProductPort` |
| Strangler 1~4 → Product | 재고 변경·단가 조회·상품 존재 확인을 순서대로 이벤트와 캐시로 전환 | Payment의 `OrderPort` |
| Strangler 5 → Order → Payment | 결제의 Order 동기 호출을 로컬 상태와 이벤트로 전환 | 공유 DB와 배포 구성 |
| 이미지·Kubernetes·관측성 정리 | 다섯 서비스의 배포 표면 마련 | DB 물리 분리 |

여기서 *peel*은 모놀리스의 도메인을 독립 실행 모듈로 떼는 작업이고, *strangler*는 기존 호출을 조금씩 새 경로로 교체한 단계입니다. 표는 작업 순서와 호출 경계만 요약합니다. DB가 독립된 시점이나 실제 트래픽의 경로를 뜻하지는 않습니다.

## Order → Product 호출을 세 가지 용도로 나눠 끊었습니다

Order가 Product에 기대던 것은 재고 변경, 주문 단가 조회, 장바구니의 상품 존재 확인이었습니다. 세 호출을 한 번에 없애지 않고 주문 흐름이 유지되는지 확인하며 바꿨습니다.

먼저 strangler-1에서 주문 트랜잭션의 재고 차감을 제거했습니다. Order는 주문과 `order.created` Outbox 이벤트를 기록하고, Product는 이벤트를 받아 재고를 예약하거나 취소 이벤트에 따라 복구합니다. 이 단계의 `reserved=true`는 최종 예약 확정이 아니라 이미 차감됐다는 임시 의미였습니다. 단가 조회와 상품 존재 확인은 여전히 동기 호출이었습니다.

strangler-2에서는 Product가 발행하는 `product.updated`를 Order가 소비해 로컬 가격 캐시를 갱신했습니다. Order는 주문 항목의 단가를 그 캐시에서 읽어 스냅샷으로 저장합니다. 소비자는 `eventId`로 중복 적용을 막고, 상품 버전을 비교해 오래된 이벤트가 새 가격을 덮어쓰지 않도록 했습니다. 캐시에 단가가 없으면 주문 생성은 `ORD-007`로 실패합니다. Product로 다시 동기 조회하는 경로는 두지 않았습니다.

strangler-3에서 예약 확정·해제와 결제 진행 조건을 보강했지만, 장바구니의 `verifyProductExists`는 남아 있었습니다. 따라서 이 시점에도 Product를 분리할 선행조건이 완성되지는 않았습니다. strangler-4에서 장바구니 추가가 Order의 로컬 가격 캐시에 상품이 있는지 검사하도록 바꿨습니다. 캐시에 없으면 `ORD-009`와 HTTP 409를 반환합니다. 상품이 실제로 없는 경우와 `product.updated`가 아직 도착하지 않은 경우를 이 검사만으로 구분할 수 없으므로, 이는 외부 응답 계약의 변경이기도 했습니다.

```java
if (!priceCacheRepository.existsByProductId(command.productId())) {
    throw new OrderException(ErrorCode.ORD_009);
}
```

이후 `ProductPort`와 어댑터를 삭제하고 Product를 독립 모듈로 옮겼습니다. 검증에서는 실제 Kafka에 `product.updated`를 발행해 캐시를 채운 뒤 장바구니 추가와 주문 단가 스냅샷을 확인했습니다. 이벤트를 받지 못해 캐시가 비어 있으면 장바구니 추가 단계에서 `ORD-009`가 발생하는 경우도 확인했습니다. 빌드에는 `src/main`의 Order↔Product 패키지 참조를 찾는 가드를 연결했습니다. 이 가드는 해당 소스 참조의 재유입을 막지만 이벤트 지연이나 런타임 장애까지 검증하지는 않습니다.

Product 분리에는 호출 외의 주의점도 있었습니다. 당시는 아직 공유 DB를 사용했으므로 Product와 root의 Outbox poller가 같은 테이블을 볼 수 있었습니다. poller마다 처리할 aggregate type을 나누고 잠금 이름을 분리해 자기 도메인의 이벤트만 발행하도록 했습니다. 코드의 서비스 경계와 DB의 물리 경계가 다른 전환기였기 때문에 필요한 조치였습니다.

## Payment → Order 호출도 peel 전에 없앴습니다

Product 다음에는 Payment가 Order의 `OrderPort`를 동기로 호출하는 경계가 드러났습니다. 결제 요청에서 주문 소유자를 확인하고 Order를 결제 요청 상태로 바꾸는 데 쓰던 호출입니다. 이를 둔 채 Order와 Payment를 서로 다른 실행 모듈로 떼기는 어려웠습니다.

strangler-5에서는 결제에 필요한 사용자 ID와 진행 조건을 Payment의 로컬 상태에 두었습니다. 소유권 검증도 Payment 안에서 처리하고, 결제 시작은 `payment.requested` 이벤트로 Order에 알렸습니다. 비동기 전환에는 이벤트 도착 순서가 바뀌는 경우도 따라왔습니다. 예약 결과보다 `payment.requested`가 먼저 오면 Order는 대기 marker를 저장하고, 취소 이벤트가 Payment 생성보다 먼저 오면 Payment 쪽에서 취소 marker를 남겨 나중에 도착한 생성 흐름에 적용하게 했습니다. 단순 재시도만으로는 선도착 상태를 잃을 수 있어, 이 marker를 영속 상태로 만들었습니다.

`OrderPort`와 어댑터를 삭제한 뒤 Order↔Payment의 `src/main` 패키지 참조도 빌드에서 검사했습니다. 이어 Order를 분리하고, 마지막으로 Payment를 분리하면서 root 애플리케이션의 `src`를 제거했습니다. root는 더 이상 실행 앱이 아니라 다섯 서비스의 빌드와 경계 검사를 묶는 Gradle aggregator가 됐습니다.

## 실행 모듈 다음에는 배포 단위를 맞췄습니다

root 앱이 사라지자 단일 앱을 전제로 한 Docker 이미지, CI, Kubernetes 구성을 바꿔야 했습니다. 하나의 Dockerfile에서 `SERVICE` 인자로 서비스별 `bootJar`를 선택하고, CI는 다섯 이미지의 빌드와 발행을 다뤘습니다. 다음 단계에서 다섯 서비스 각각의 Deployment·Service·ConfigMap·Secret·ServiceMonitor를 마련했습니다. 마지막으로 `application=peekcart`를 전제로 하던 메트릭과 대시보드·알림 계약도 서비스별 식별자로 고쳤습니다.

이 단계의 완료 범위는 **다섯 실행 모듈과 각 서비스의 이미지·배포 표면**입니다. DB는 여전히 공유 스키마였고, Order가 맡은 Flyway 마이그레이션을 다른 서비스가 기다리는 시작 순서도 남았습니다. 당시 전환기 인증 역시 각 서비스가 공유 검증 코드와 Redis 블랙리스트 조회를 사용했습니다. 서비스 간 `project()` 의존 금지 검사가 통과해도 공유 DB나 Redis 같은 결합은 그 검사에 나타나지 않습니다.

따라서 구현 ①의 결과를 DB까지 독립된 다섯 서비스로 읽어서는 안 됩니다. 이 작업에서 확인한 것은 동기 빈 호출을 해체한 뒤 각 도메인을 실행·배포 단위로 떼어낼 수 있었다는 점입니다. 서비스별 DB와 교차 FK를 정리하는 작업은 다음 구현 단계의 과제로 남겼습니다.
