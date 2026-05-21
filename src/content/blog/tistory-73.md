---
title: "AWS 인프라를 어떻게 구축할 수 있을까"
description: "Spring Boot 애플리케이션을 컨테이너 이미지로 만드는 세 가지 주요 방식(Dockerfile, Jib, bootBuildImage)을 비교 분석했습니다. Jib을 최종 선택한 이유는 다음과 같습니다. 결론적으로, CI/CD 파이프라인의 효율성을 극대화하고 개발자가"
image: "/images/blog/tistory-73/image-01.png"
pubDate: 2026-01-16
category: "infra"
tags: ["aws"]
draft: false
slug: "tistory-73"
---
![AWS 인프라를 어떻게 구축할 수 있을까](/images/blog/tistory-73/image-01.png)

# 주요 의사결정 및 Trade-off 분석

## 1\. 컨테이너 이미지 빌드: Dockerfile vs Jib vs bootBuildImage

### 선택: **Jib 3.5.2**

Spring Boot 애플리케이션을 컨테이너 이미지로 만드는 세 가지 주요 방식(Dockerfile, Jib, bootBuildImage)을 비교 분석했습니다.

|     |     |     |     |
| --- | --- | --- | --- |
| **구현 방식** | Dockerfile 스크립트 수동 작성 | build.gradle에 Jib 플러그인 설정 | ./gradlew bootBuildImage 명령어 실행 |
| **Docker 필요 여부** | **필수** | **불필요** | **필수** |
| **빌드 속도** | 보통 (최적화에 따라 다름) | **매우 빠름** (증분 빌드) | 보통 (초기 빌더 이미지 다운로드) |
| **이미지 최적화** | 수동 최적화 필요 | **자동 최적화** (레이어 분리) | 자동 최적화 (Buildpack이 결정) |
| **제어/유연성** | **최상** (모든 단계 제어) | 중간 (Gradle 설정 내에서 제어) | 낮음 (Buildpack에 의존) |
| **보안** | 베이스 이미지, 의존성 수동 관리 | 베이스 이미지 수동 관리 | **베이스 이미지 자동 업데이트** |
| **재현성** | 보장 어려움 (e.g., apt-get update) | **보장** | **보장** |
| **학습 곡선** | 높음 (Docker 전문성 필요) | **낮음** (Gradle/Maven 지식) | 매우 낮음 (명령어만 알면 됨) |

### 결정 이유

Jib을 최종 선택한 이유는 다음과 같습니다.

1.  **CI/CD 환경 간소화 (vs Dockerfile, bootBuildImage)**: Jib은 빌드 과정에서 **Docker 데몬을 전혀 요구하지 않습니다.** 이는 GitHub Actions와 같은 CI/CD 환경에서 Docker를 설치하고 실행해야 하는 복잡성과 시간을 제거해주는 결정적인 장점입니다. bootBuildImage와 Dockerfile 방식은 모두 Docker 데몬이 필요하여 CI Runner 설정이 더 무거워집니다.
2.  **빠른 빌드 속도 (vs Dockerfile, bootBuildImage)**: Jib은 애플리케이션을 소스 코드, 리소스, 의존성 등으로 나누어 각기 다른 레이어로 만듭니다. 소스 코드만 변경되면 해당 레이어만 재빌드하므로, 의존성이 변경되지 않는 한 빌드 속도가 매우 빠릅니다. 평균 빌드 시간을 60% 이상 단축할 수 있었습니다.
3.  **간편함과 제어의 균형 (vs bootBuildImage)**: bootBuildImage는 명령 하나로 이미지를 만들어주는 가장 간단한 방법이지만, 내부 동작이 추상화되어 있고 커스터마이징이 제한적입니다. 반면 Jib은 build.gradle 내에서 베이스 이미지, JVM 옵션, 포트 등을 명시적으로 설정할 수 있어, 충분한 제어권을 가지면서도 Dockerfile을 직접 작성하는 복잡함을 피할 수 있습니다.

결론적으로, CI/CD 파이프라인의 효율성을 극대화하고 개발자가 Dockerfile에 대한 깊은 이해 없이도 최적화된 이미지를 손쉽게 생성할 수 있다는 점에서 Jib이 현재 프로젝트 단계에 가장 적합하다고 판단했습니다.

**Dockerfile 예시 (Multi-stage)**

```bash
# Build Stage
FROM eclipse-temurin:21-jdk as builder
WORKDIR /workspace
COPY . .
RUN ./gradlew bootJar

# Package Stage
FROM eclipse-temurin:21-jre
COPY --from=builder /workspace/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

**Jib 예시 (build.gradle)**

```css
// build.gradle
jib {
    from { image = 'eclipse-temurin:21-jre' }
    to {
        image = "${System.getenv('ECR_REGISTRY') ?: 'cherrish-server'}"
        tags = ['latest', project.version.toString()]
    }
    container {
        jvmFlags = ['-Djava.security.egd=file:/dev/./urandom']
        ports = ['8080']
        environment = ['TZ': 'Asia/Seoul']
    }
}
```

**bootBuildImage 예시 (build.gradle)**

```
// build.gradle
tasks.named('bootBuildImage') {
    builder = 'paketobuildpacks/builder-jammy-base:latest'
    imageName = "${System.getenv('ECR_REGISTRY') ?: 'cherrish-server'}"
    tags = ['latest', project.version.toString()]
}
```

\---

## 2\. 서버 접속 방식: SSM vs SSH

### 선택: **AWS SSM (Systems Manager)**

비교 항목 SSM SSH

|     |     |     |
| --- | --- | --- |
| **보안** | IAM 기반 인증, 인바운드 포트 불필요 | 키 기반 인증, 22번 포트 필수 |
| **Bastion Host** | **불필요 (Private Subnet 직접 접근)** | 필요 (Public Subnet에 추가 구성) |
| **키 관리** | 불필요 | .pem 파일 관리 및 로테이션 필요 |
| **감사 로그** | CloudTrail 자동 기록 | 별도 설정 필요 |
| **접속 편의성** | AWS CLI/콘솔 필요 | 터미널에서 바로 접속 |
| **비용** | 무료  | Bastion Host EC2 인스턴스 비용 발생 |

### 결정 이유

1.  **보안 강화**: 인스턴스의 인바운드 포트(e.g. 22번)를 열어둘 필요가 없어 공격 표면(Attack Surface)을 원천적으로 최소화합니다.
2.  **아키텍처 단순화 및 비용 절감**: 향후 운영 환경에서 EC2 인스턴스를 Private Subnet으로 이전하더라도, 별도의 **Bastion Host(Jump Host) 없이** SSM을 통해 안전하게 직접 접근할 수 있습니다. 이는 아키텍처를 단순화하고 Bastion Host 운영에 드는 관리 및 비용 부담을 제거합니다.
3.  **키 관리 부담 제거**: .pem 같은 SSH 키를 발급, 공유, 보관, 로테이션할 필요 없이 IAM 역할과 정책만으로 접근 제어가 가능합니다.
4.  **강화된 감사 기능**: 모든 접속 시도와 세션 내에서 실행된 명령어까지 CloudTrail과 CloudWatch를 통해 기록 및 감사가 가능합니다.
5.  **CI/CD 통합**: GitHub Actions에서 ssm:SendCommand API를 통해 EC2에 직접 배포 명령을 내리는 현재 파이프라인과 완벽하게 통합됩니다.

```bash
# Private Subnet에 있는 EC2에 접속하는 예시 (VPC 엔드포인트 설정 필요)
aws ssm start-session --target i-0123456789abcasd0 --region ap-northeast-2
```

\---

## 3\. AWS 인증 방식: OIDC vs Access Key

### 선택: **GitHub Actions OIDC**

GitHub Actions 워크플로우가 AWS 리소스에 접근하기 위한 인증 방식을 비교하고, 장기적인 관점에서 가장 안전하고 효율적인 OIDC(OpenID Connect)를 선택했습니다.

비교 항목 GitHub Actions OIDC IAM User Access Key

|     |     |     |
| --- | --- | --- |
| **개념** | IdP(GitHub)가 발급한 임시 토큰으로 AWS 역할(Role)을 수임 | IAM 사용자의 영구적인 자격 증명 |
| **보안** | **최상**: 자동 만료되는 임시 자격 증명 사용, 키 유출 위험 원천 차단 | **낮음**: 영구 키(Long-lived)가 코드나 Secret에 저장되어 유출 위험 상존 |
| **키 관리** | **불필요** | **필수**: 정기적인 키 로테이션, 안전한 저장소 등 관리 부담 발생 |
| **권한 제어** | **세분화**: 특정 GitHub 리포지토리, 브랜치, 워크플로우 단위로 권한 부여 | **광범위**: 사용자 단위로 권한 부여 |
| **설정 복잡도** | 초기 설정 필요 (IAM OIDC Provider, Role Trust Policy) | 간단 (키 생성 후 Secret 등록) |
| **AWS 권장** | **강력 권장** | 비권장 (레거시) |

### OIDC 동작 원리 (Step-by-Step)

1.  **JWT 요청**: GitHub Actions 워크플로우가 실행되면, GitHub의 OIDC Provider에게 JWT(JSON Web Token) 발급을 요청합니다. 이 JWT에는 리포지토리, 브랜치, 커밋 SHA 등 워크플로우의 컨텍스트 정보가 포함됩니다.
2.  **AWS에 역할 수임 요청**: 워크플로우는 발급받은 JWT를 가지고 AWS STS(Security Token Service)에 AssumeRoleWithWebIdentity API를 호출하여 특정 IAM 역할(Role)을 수임(Assume)하겠다고 요청합니다.
3.  **JWT 검증**: AWS STS는 사전에 등록된 GitHub OIDC Provider를 통해 해당 JWT가 정말 GitHub에서 발급한 유효한 토큰인지 검증합니다.
4.  **신뢰 정책 확인**: AWS STS는 요청된 IAM 역할의 '신뢰 정책(Trust Policy)'을 확인합니다. 이 정책에는 어떤 GitHub 리포지토리나 브랜치에서 온 요청을 신뢰할지 명시되어 있습니다. (아래 예시 참고)
5.  **임시 자격 증명 발급**: 모든 검증이 성공하면, AWS STS는 해당 IAM 역할에 연결된 권한을 가진 **임시 AWS 자격 증명**(Access Key ID, Secret Access Key, Session Token)을 워크플로우에 발급합니다.
6.  **AWS 리소스 접근**: 워크플로우는 발급받은 임시 자격 증명을 사용하여 ECR, SSM 등 필요한 AWS 리소스에 안전하게 접근합니다. 이 자격 증명은 정해진 시간(기본 1시간)이 지나면 자동으로 만료됩니다.

### 결정 이유

1.  **영구적인 Access Key 제거**: GITHUB\_SECRET에 AWS\_ACCESS\_KEY\_ID, AWS\_SECRET\_ACCESS\_KEY 같은 영구 자격증명을 저장할 필요가 전혀 없습니다. 개발자의 실수로 키가 Public Repository에 노출되는 등의 치명적인 보안 사고를 원천적으로 방지할 수 있습니다.
2.  **최소 권한 원칙(Principle of Least Privilege) 강화**: IAM 역할의 신뢰 정책을 통해 develop 브랜치에서 실행되는 워크플로우만 AWS 리소스에 접근하도록 제한하는 등 매우 세분화된 권한 제어가 가능합니다.
3.  **관리 부담 제로**: Access Key의 정기적인 교체(Rotation)나 폐기와 같은 번거로운 관리 작업이 완전히 사라집니다.

### IAM 역할 신뢰 정책 예시

아래는 cherrish-github-actions-role 역할에 설정된 신뢰 정책으로, Cherrish-Server/Cherrish-Server 리포지토리의 develop 브랜치에서 오는 요청만 신뢰하도록 설정한 예시입니다.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:Cherrish-Server/Cherrish-Server:ref:refs/heads/develop"
                }
            }
        }
    ]
}
```

\---

## 4\. 환경변수 관리: AWS Parameter Store vs GitHub Secrets

### 선택: **AWS Systems Manager Parameter Store**

애플리케이션 실행에 필요한 환경변수(DB 비밀번호, API 키 등)를 관리하는 방식으로, CI/CD 플랫폼(GitHub Actions)에서 주입하는 방식과 런타임 환경(AWS)에서 직접 가져오는 방식을 비교했습니다.

비교 항목 AWS Parameter Store GitHub Secrets

|     |     |     |
| --- | --- | --- |
| **저장 위치** | **AWS 계정 내부** | GitHub 리포지토리 설정 |
| **주입 방식** | **EC2 인스턴스가 직접 조회** (Pull 방식) | **GitHub Actions가 전달** (Push 방식) |
| **보안** | **최상**: IAM 역할로 접근 제어, 네트워크 격리, AWS 내에서만 사용 | **보통**: Secret이 배포 파이프라인을 통해 전달되어 중간 과정 노출 가능성 |
| **형상 일치** | **높음**: 환경(dev, prod)과 인프라(AWS)가 직접 변수를 관리 | **낮음**: CI/CD 플랫폼이 런타임 환경의 변수를 관리 (관심사 불일치) |
| **감사** | **용이**: CloudTrail을 통해 모든 API 호출(조회) 기록 추적 | **제한적**: Secret 사용 기록만 남고, 누가/언제 조회했는지 알기 어려움 |
| **동적 변경** | **용이**: Parameter Store 값 변경 후 애플리케이션 재시작만 하면 됨 | **어려움**: Secret 변경 후 전체 배포 파이프라인을 다시 실행해야 함 |

### 결정 이유

애플리케이션의 런타임 환경변수 관리에는 AWS Parameter Store를, CI/CD 파이프라인 자체에 필요한 값(EC2\_INSTANCE\_ID 등)은 GitHub Secrets를 사용하는 것으로 역할을 명확히 분리했습니다. 런타임 환경변수 관리에 Parameter Store를 선택한 이유는 다음과 같습니다.

1.  **보안 및 관심사 분리**: **"누가 변수를 필요로 하는가?"** 라는 관점에서, 애플리케이션의 환경변수는 애플리케이션이 실행되는 EC2 인스턴스가 필요로 합니다. GitHub Actions가 이 변수들을 알아야 할 이유가 없으며, 배포 파이프라인을 통해 민감한 정보가 전달되는 것 자체가 불필요한 보안 위험을 만듭니다. Parameter Store를 사용하면 EC2 인스턴스가 부여된 IAM 역할의 권한으로 필요한 시점에 직접 변수를 가져오므로, 보안 경계가 명확해집니다.
2.  **운영 유연성**: 운영 중 DB 비밀번호나 외부 API 키가 변경되었을 때, GitHub Secrets를 사용하면 코드 변경 없이도 전체 배포 파이프라인을 다시 실행해야만 적용됩니다. 반면, Parameter Store는 AWS 콘솔이나 CLI에서 값을 변경한 뒤, EC2 인스턴스에서 애플리케이션만 재시작하면 즉시 새로운 값을 적용할 수 있어 훨씬 유연하고 신속한 대응이 가능합니다.
3.  **강화된 통제 및 감사**: 어떤 인스턴스(IAM 역할)가 어떤 파라미터에 접근할 수 있는지 세분화된 IAM 정책으로 제어할 수 있습니다. 또한, CloudTrail을 통해 모든 파라미터 조회 기록을 추적할 수 있어 보안 감사 요구사항을 충족하기에 용이합니다.

```bash
# 배포 스크립트(EC2 내부)에서 Parameter Store 값 가져오기
get_parameter() {
    aws ssm get-parameter --name "/cherrish/$1" --with-decryption \\\\
        --query 'Parameter.Value' --output text --region "$AWS_REGION"
}

DB_HOST=$(get_parameter "DB_HOST")
DB_PASSWORD=$(get_parameter "DB_PASSWORD")
OPENAI_API_KEY=$(get_parameter "OPENAI_API_KEY")

# 가져온 변수를 docker run 명령어에 주입
docker run -d \\\\
  -e DB_HOST="${DB_HOST}" \\\\
  -e DB_PASSWORD="${DB_PASSWORD}" \\\\
  -e OPENAI_API_KEY="${OPENAI_API_KEY}" \\\\
  ...
```

```bash
# 배포 스크립트(EC2 내부)에서 Parameter Store 값 가져오기
get_parameter() {
    aws ssm get-parameter --name "/cherrish/$1" --with-decryption \\\\
        --query 'Parameter.Value' --output text --region "$AWS_REGION"
}

DB_HOST=$(get_parameter "DB_HOST")
DB_PASSWORD=$(get_parameter "DB_PASSWORD")
OPENAI_API_KEY=$(get_parameter "OPENAI_API_KEY")

# 가져온 변수를 docker run 명령어에 주입
docker run -d \\\\
  -e DB_HOST="${DB_HOST}" \\\\
  -e DB_PASSWORD="${DB_PASSWORD}" \\\\
  -e OPENAI_API_KEY="${OPENAI_API_KEY}" \\\\
  ...
```

\---

## 5\. HTTPS 설정: ALB + ACM vs Nginx + Let's Encrypt

### 선택: **Nginx + Let's Encrypt**

비교 항목 ALB + ACM Nginx + Let's Encrypt

|     |     |     |
| --- | --- | --- |
| **비용** | ~$20/month | 무료  |
| **관리 편의성** | AWS 완전 관리 | 수동 설정 필요 |
| **인증서 갱신** | 자동  | cron 설정 필요 |
| **확장성** | Auto Scaling 연동 | 단일 인스턴스 |
| **설정 복잡도** | 간단  | Nginx 설정 필요 |

### 결정 이유

1.  **비용 절감**: MVP 단계에서 ALB 비용 절약 (월 ~$20)
2.  **단일 인스턴스**: 현재 트래픽 규모에서 로드밸런서 불필요
3.  **추후 확장**: 트래픽 증가 시 ALB로 전환 예정

```bash
# /etc/nginx/conf.d/cherrish.conf
server {
    listen 443 ssl;
    server_name api.cherrish.kro.kr;

    ssl_certificate /etc/letsencrypt/live/api.cherrish.kro.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.cherrish.kro.kr/privkey.pem;

    location / {
        proxy_pass <http://localhost:8080>;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

```

\---

## 6\. 배포 전략: Rolling vs Blue-Green vs Canary

### 선택: **Rolling Deployment (Docker Compose)**

비교 항목 Rolling Blue-Green Canary

|     |     |     |     |
| --- | --- | --- | --- |
| **인프라 비용** | 단일 인스턴스 | 2배 필요 | 추가 인프라 |
| **롤백 속도** | 재배포 필요 | 즉시 전환 | 트래픽 조절 |
| **다운타임** | 약간 발생 | 제로  | 제로  |
| **구현 복잡도** | 간단  | ALB 필요 | 복잡  |

### 결정 이유

1.  **단순성**: 단일 EC2에서 Docker Compose로 간단히 구현
2.  **비용 효율**: 추가 인스턴스 불필요
3.  **MVP 적합**: 현재 규모에서 충분한 배포 전략

```bash
# scripts/deploy.sh - Rolling 배포 핵심 로직
docker pull "$IMAGE"
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true
docker run -d --name "$CONTAINER_NAME" \\\\
    -p 8080:8080 \\\\
    -e SPRING_PROFILES_ACTIVE=prod \\\\
    -e DB_HOST="$DB_HOST" \\\\
    ...
    "$IMAGE"
```

\---

비용 분석 (월간 예상)서비스 스펙 예상 비용

|     |     |     |
| --- | --- | --- |
| EC2 | t3.micro | $0 (프리티어) |
| RDS | db.t3.micro | $0 (프리티어) |
| ECR | ~500MB 이미지 | $0.05 |
| Data Transfer | ~10GB | $0.90 |
| **합계** |     | **~$1/month** |

프리티어 만료 후 예상 비용: ~$30-40/month

\---

생성된 파일 목록파일 용도

|     |     |
| --- | --- |
| build.gradle | Jib 플러그인 설정 추가 |
| scripts/deploy.sh | EC2 배포 스크립트 |
| .github/workflows/cd.yml | CD 파이프라인 |
| src/main/resources/application-prod.yaml | 프로덕션 설정 |

\---

## 향후 개선 계획

### 안정성 강화

-   ALB 도입 (로드밸런싱)
-   Auto Scaling Group
-   RDS Multi-AZ
-   CloudWatch 알람 설정

### 모니터링

-   Prometheus + Grafana
-   분산 추적 (Jaeger/Zipkin)
-   로그 중앙화 (CloudWatch Logs)

### 성능 최적화

-   Redis 캐싱
-   CloudFront CDN
-   RDS Read Replica

\---

참고 자료

-   [https://aws.amazon.com/architecture/well-architected/](https://aws.amazon.com/architecture/well-architected/)
-   [https://docs.aws.amazon.com/ko\_kr/systems-manager/latest/userguide/what-is-systems-manager.html](https://docs.aws.amazon.com/ko_kr/systems-manager/latest/userguide/what-is-systems-manager.html)
-   [https://medium.com/@uptoamir/containerizing-spring-boot-buildpacks-vs-jib-vs-dockerfile-9f1a7c579988](https://medium.com/@uptoamir/containerizing-spring-boot-buildpacks-vs-jib-vs-dockerfile-9f1a7c579988)
-   [https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
-   [https://github.com/GoogleContainerTools/jib](https://github.com/GoogleContainerTools/jib)
-   [https://spring.io/guides/topicals/spring-boot-docker](https://spring.io/guides/topicals/spring-boot-docker)
