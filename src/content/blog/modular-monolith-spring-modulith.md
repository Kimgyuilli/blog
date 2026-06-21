---
title: "모듈러 모놀리스와 Spring Modulith 학습 기록"
description: "Spring Boot 기반 WAS에서 모듈러 모놀리스를 선택하는 이유와 Spring Modulith로 모듈 경계, public API/internal 규칙, 이벤트, 검증 테스트를 어떻게 다룰지 정리합니다."
image: "/images/blog/modular-monolith-spring-modulith/image-01.webp"
pubDate: 2026-06-22
category: "backend"
tags: ["spring", "spring-boot", "architecture", "modulith"]
draft: false
slug: "modular-monolith-spring-modulith"
---
![모듈러 모놀리스와 Spring Modulith 학습 기록](/images/blog/modular-monolith-spring-modulith/image-01.webp)

## 들어가며

새 프로젝트를 시작하면서 아키텍처를 어떻게 가져갈지 고민하게 됐다. 이번 서버는 Spring Boot 기반의 WAS이고, 초기에 빠르게 개발해야 하지만 이후 성능 개선과 구조 확장도 고려해야 한다. 처음부터 마이크로서비스로 쪼개기에는 운영 복잡도가 크고, 그렇다고 일반적인 모놀리스로만 가기에는 시간이 지나면서 코드 경계가 흐려질 위험이 있다.

그래서 이번에는 **모듈러 모놀리스**를 기본 방향으로 검토하고 있다. 배포 단위는 하나로 유지하되, 내부 코드는 비즈니스 모듈 단위로 나누고, 모듈 간 의존을 명시적으로 통제하는 방식이다. 여기에 Spring 생태계에서 이 구조를 검증하고 문서화할 수 있는 **Spring Modulith**를 함께 사용해보려 한다.

이 글은 최종 정답을 선언하는 글이 아니다. 모듈러 모놀리스와 Spring Modulith를 학습하면서, 우리 프로젝트에서 어떤 선택을 할지 정리해가는 기록이다. 동시에 팀원이 회의 전에 읽고 논의에 참여할 수 있도록 온보딩 자료 역할도 하도록 작성한다.

## 왜 모듈러 모놀리스인가

일반적인 모놀리스는 시작하기 쉽다. 하나의 애플리케이션, 하나의 배포 단위, 하나의 코드베이스로 빠르게 기능을 만들 수 있다. 문제는 시간이 지나면서 코드가 점점 엉키기 쉽다는 점이다.

예를 들어 주문 기능을 만들다가 회원 repository를 직접 가져다 쓰고, 결제 기능이 주문 entity를 직접 수정하고, 알림 기능이 여러 도메인의 내부 service를 알고 있게 되는 식이다.

```text
order -> member.internal.MemberRepository
payment -> order.internal.OrderService
notification -> order.internal.OrderJpaEntity
```

이런 구조는 초반에는 빠르다. 하지만 점점 변경 영향 범위가 커진다. `member` 내부 구현을 바꿨는데 `order` 테스트가 깨지고, `order` entity 필드를 바꿨는데 `notification`까지 수정해야 하는 상황이 생긴다. 모듈 경계가 없기 때문에 사실상 모든 코드가 서로를 알고 있는 상태가 된다.

반대로 마이크로서비스는 경계를 강하게 나눌 수 있다. 하지만 운영 복잡도가 바로 따라온다.

```text
서비스 간 네트워크 호출
분산 트랜잭션
장애 전파
배포 순서
관측성
API contract 관리
데이터 정합성
```

아직 도메인 경계가 완전히 안정되지 않았고, 팀이 빠르게 기능을 만들어야 하는 상황이라면 마이크로서비스는 너무 이른 선택일 수 있다. 그래서 중간 지점으로 모듈러 모놀리스를 검토한다.

모듈러 모놀리스의 목표는 다음 문장으로 정리할 수 있다.

> 배포는 하나로 단순하게 유지하되, 코드의 변경 경계는 모듈 단위로 통제한다.

구조는 대략 이렇게 볼 수 있다.

```text
one Spring Boot application
├─ member
├─ order
├─ payment
├─ notification
└─ settlement
```

여기서 중요한 것은 단순히 패키지를 나누는 것이 아니다. **다른 모듈의 내부 구현을 직접 참조하지 않고, 모듈 간 협력 방식을 명확히 정하는 것**이 핵심이다.

## 모듈을 무엇 기준으로 나눌 것인가

모듈러 모놀리스에서 가장 먼저 결정해야 하는 것은 모듈 경계다. 우리는 모듈의 1차 기준을 **비즈니스 capability**로 두기로 했다.

예를 들면 다음과 같다.

```text
member
order
payment
notification
settlement
```

기술 계층 기준으로 나누는 방식은 사용하지 않는다.

```text
controller
service
repository
domain
```

이런 구조는 layered architecture에는 익숙하지만, 모듈러 모놀리스의 모듈 경계로는 적합하지 않다. 주문 기능 하나를 고치려면 controller, service, repository, domain 패키지를 가로질러 찾아다녀야 한다. 모듈 단위의 변경 경계를 만들기 어렵다.

우리가 정한 기본 룰은 다음과 같다.

```text
application module은 기본적으로 비즈니스 capability 기준으로 나눈다.
기술 계층은 모듈 경계가 될 수 없다.
```

다만 capability 기준만으로 모든 상황이 해결되지는 않는다. 두 가지 보조 관점을 함께 둔다.

첫 번째는 **bounded context** 관점이다. 같은 용어가 영역마다 다른 의미를 갖거나, 하나의 모델이 너무 많은 책임을 떠안기 시작하면 bounded context 관점으로 경계를 다시 본다.

예를 들어 `member`라는 말이 인증 영역에서는 로그인 가능한 계정을 뜻하고, 주문 영역에서는 구매자를 뜻하며, 정산 영역에서는 정산 대상자를 뜻할 수 있다. 이 경우 하나의 `Member` 모델로 모든 요구를 덮으려고 하면 모델이 비대해진다.

```text
identity
ordering
billing
```

처럼 언어와 모델의 경계가 달라지는 지점을 다시 볼 수 있다.

두 번째는 **workflow** 관점이다. `checkout`, `refund`, `settlement-run`처럼 사용자 흐름이나 업무 프로세스 기준으로도 모듈을 생각할 수 있다. 하지만 workflow를 루트 모듈로 많이 만들면 orchestration hub가 비대해질 위험이 있다.

예를 들어 `checkout`이 다음 모든 정책을 직접 소유하기 시작하면 위험하다.

```text
회원 검증
쿠폰 정책
재고 차감
결제 승인
주문 생성
알림 발송
```

이렇게 되면 각 capability 모듈의 책임이 checkout으로 새어 나간다. 그래서 우리는 workflow를 1차 모듈 경계로 삼지 않기로 했다. 필요하다면 각 capability의 public API를 조합하는 얇은 orchestration module로만 둔다.

현재 결정은 다음과 같다.

```text
기본은 비즈니스 capability 기준.
모델과 언어가 달라지면 bounded context 관점으로 재검토.
workflow는 1차 모듈 경계가 아니라 얇은 orchestration 후보.
```

## 모듈 내부는 어떻게 구성할 것인가

모듈 경계를 나눴다면 다음 질문은 각 모듈 내부를 어떻게 구성할 것인가다. 우리는 모든 모듈에 같은 구조를 강제하지 않기로 했다. 모듈마다 복잡도가 다르기 때문이다.

예를 들어 `notification`은 알림 발송 중심의 단순 모듈일 수 있다. 반면 `order`, `payment`, `settlement`는 상태 전이, 실패 처리, 정책 판단이 복잡할 수 있다. 이 둘에 같은 수준의 hexagonal architecture를 강제하면 작은 모듈에는 과한 구조가 된다.

그래서 기본값은 **모듈 내부 layered architecture**로 둔다.

```text
order
├─ OrderManagement.java
├─ OrderCompleted.java
└─ internal
   ├─ presentation
   ├─ application
   ├─ domain
   └─ infrastructure
```

각 레이어의 역할은 다음처럼 본다.

```text
presentation
 -> HTTP 요청/응답, Controller, Request/Response DTO, 예외 응답 매핑

application
 -> use case orchestration, transaction boundary, 모듈 간 협력

domain
 -> 핵심 비즈니스 규칙, entity, value object, domain service

infrastructure
 -> JPA, Redis, 외부 API client, messaging adapter 등 기술 의존 구현
```

`presentation`과 `api`라는 이름 중 무엇이 더 정석적인지도 고민했다. layered architecture에서 더 일반적인 용어는 `presentation layer`다. REST API 서버에서는 `api`라는 이름이 더 직관적일 수 있지만, 아키텍처 설명과 확장성을 고려하면 `presentation`이 더 넓은 표현이다. 그래서 기본 레이어 이름은 `presentation`으로 두는 쪽이 적절해 보인다.

다만 작은 모듈은 단순 구조를 허용한다.

```text
notification
├─ NotificationPort.java
└─ internal
   └─ NotificationService.java
```

알림, 감사 로그, 단순 reference data처럼 정책이 작고 흐름이 단순한 모듈까지 `presentation/application/domain/infrastructure`를 모두 강제할 필요는 없다.

반대로 복잡한 의존이 있는 모듈에는 hexagonal/clean architecture의 port/adapter 개념을 부분 적용한다.

```text
order.application -> PaymentPort
order.adapter.out -> payment.PaymentManagement
```

이렇게 하면 `order.application`은 `payment` 모듈의 구체 API를 직접 알지 않고, `PaymentPort`라는 내부 추상화에 의존할 수 있다. 테스트에서 대체하기도 쉽고, 나중에 결제가 외부 시스템이나 메시지 기반 흐름으로 바뀌더라도 변경 지점을 adapter에 가둘 수 있다.

현재 결정은 다음과 같다.

```text
기본은 layered architecture.
작은 모듈은 단순 package-private 구조 허용.
복잡한 의존에는 port/adapter 부분 적용.
모든 모듈에 hexagonal/clean을 일괄 강제하지 않는다.
```

## 모듈 간 의존은 어떻게 정의할 것인가

모듈러 모놀리스라고 해서 모듈 간 의존이 없어지는 것은 아니다. 오히려 중요한 것은 **어떤 의존을 어떤 방식으로 허용할지** 정하는 것이다.

우리가 검토한 방식은 세 가지다.

첫 번째는 **public API 직접 호출**이다.

```text
order -> member.MemberReader
```

예를 들어 주문 생성 전에 회원 상태를 확인해야 한다면 `order`가 `member`의 공개 API를 호출할 수 있다.

```java
package com.example.order.internal.application;

import com.example.member.MemberReader;

@Service
class CreateOrderService {

    private final MemberReader memberReader;

    CreateOrderService(MemberReader memberReader) {
        this.memberReader = memberReader;
    }

    void createOrder(Long memberId) {
        var member = memberReader.getMember(memberId);
        // 주문 생성
    }
}
```

이때 중요한 것은 `member.internal.MemberRepository` 같은 내부 구현을 직접 참조하지 않는 것이다.

두 번째는 **application event**다.

```text
order publishes OrderCompleted
notification listens OrderCompleted
```

주문 완료 후 알림 발송은 주문 성공 여부와 강하게 묶이지 않아도 된다. 이 경우 `order`가 `notification`을 직접 호출하지 않고 `OrderCompleted` 이벤트만 발행한다.

```java
package com.example.order;

public record OrderCompleted(Long orderId, Long memberId) {
}
```

```java
package com.example.notification.internal.adapter.in;

@Component
class OrderCompletedEventListener {

    private final SendOrderNotificationService notificationService;

    OrderCompletedEventListener(SendOrderNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @ApplicationModuleListener
    void on(OrderCompleted event) {
        notificationService.send(event.orderId(), event.memberId());
    }
}
```

여기서 listener는 얇게 유지한다. 이벤트를 받아 application service를 호출하는 adapter 역할만 한다. 복잡한 비즈니스 로직이 listener 안에 들어가기 시작하면 구조가 흐려진다.

세 번째는 **port/adapter**다.

```text
order.application -> PaymentPort
order.adapter.out -> payment.PaymentManagement
```

결제 승인처럼 실패 처리, 재시도, 외부 시스템 전환 가능성이 있는 의존은 직접 호출보다 port/adapter로 감싸는 편이 나을 수 있다.

```java
package com.example.order.internal.port.out;

public interface PaymentPort {

    PaymentResult authorize(PaymentCommand command);
}
```

```java
package com.example.order.internal.adapter.out;

import com.example.payment.PaymentManagement;

@Component
class PaymentAdapter implements PaymentPort {

    private final PaymentManagement paymentManagement;

    PaymentAdapter(PaymentManagement paymentManagement) {
        this.paymentManagement = paymentManagement;
    }

    @Override
    public PaymentResult authorize(PaymentCommand command) {
        return paymentManagement.authorize(command);
    }
}
```

이벤트와 port/adapter는 서로 대체 관계가 아니다. 이벤트 발행은 outbound port로 볼 수 있고, 이벤트 수신 listener는 inbound adapter로 볼 수 있다. 다만 모든 이벤트 발행을 port로 감싸면 과할 수 있다.

현재는 최종 확정 전 잠정안으로 다음 기준을 잡았다.

```text
단순 조회는 public API 직접 호출 허용.
복잡한 동기 의존은 port/adapter로 감싼다.
단순 side effect는 application event로 분리.
중요한 event 흐름이거나 외부 브로커 확장 가능성이 있으면 event publisher port 검토.
```

이 부분은 회의에서 더 구체화할 필요가 있다. 특히 "단순 조회"와 "복잡한 동기 의존"의 기준을 팀이 함께 정해야 한다.

## Spring Modulith는 무엇을 해주는가

Spring Modulith는 모듈러 모놀리스 구조를 Spring Boot 애플리케이션 안에서 구현하고 검증하기 위한 도구다. 공식 문서에서는 Spring Modulith를 도메인 주도적인 모듈식 애플리케이션을 만들기 위한 opinionated toolkit으로 설명한다.

중요한 점은 Spring Modulith가 모듈 경계를 대신 설계해주지는 않는다는 것이다.

```text
member를 모듈로 할지
order를 모듈로 할지
payment와 order를 직접 연결할지
event로 분리할지
```

이런 판단은 우리가 해야 한다. Spring Modulith는 그 다음을 돕는다.

```text
패키지 구조를 application module로 인식
모듈 간 의존 검증
internal package 참조 금지 검증
순환 의존 검증
application event 지원
모듈 단위 테스트 지원
모듈 구조 문서화
runtime insight 제공
```

Spring Modulith는 기본적으로 Spring Boot main class가 있는 root package 바로 아래 direct sub-package를 application module로 인식한다.

```text
com.example.app
├─ member
├─ order
├─ payment
└─ notification
```

이 경우 `member`, `order`, `payment`, `notification`이 application module이 된다.

## public API와 internal

Spring Modulith의 핵심 감각은 public API와 internal 구현을 나누는 것이다.

```text
order
├─ OrderManagement.java
├─ OrderCompleted.java
└─ internal
   ├─ OrderService.java
   ├─ OrderRepository.java
   └─ OrderJpaEntity.java
```

외부 모듈이 참조할 수 있는 것은 root package에 둔다.

```text
order.OrderManagement
order.OrderCompleted
```

반대로 구현체, repository, JPA entity는 `internal` 아래에 둔다.

```text
order.internal.OrderService
order.internal.OrderRepository
order.internal.OrderJpaEntity
```

다른 모듈은 이 내부 구현을 참조하면 안 된다. 이 규칙을 사람이 리뷰로만 지키는 것은 어렵다. Spring Modulith의 `ApplicationModules.verify()`는 이런 구조 위반을 테스트로 검증할 수 있게 해준다.

## build.gradle 설정

Spring Boot 4와 Spring Modulith 2.1.0 기준으로는 BOM을 가져오고 필요한 starter를 선택한다.

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.1.0'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencyManagement {
    imports {
        mavenBom 'org.springframework.modulith:spring-modulith-bom:2.1.0'
    }
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'

    implementation 'org.springframework.modulith:spring-modulith-starter-core'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.modulith:spring-modulith-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

초기에는 강제 적용 범위를 최소화한다. `spring-modulith-starter-core`와 `spring-modulith-starter-test`를 중심으로 시작하고, event publication registry나 runtime insight는 필요해질 때 검토한다.

## 가장 먼저 넣을 검증 테스트

초기 강제 룰로 선택한 것은 `ApplicationModules.verify()`다.

```java
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTests {

    @Test
    void verifiesModularStructure() {
        ApplicationModules.of(Application.class).verify();
    }
}
```

이 테스트는 간단하지만 중요하다. 모듈 간 순환 의존이나 다른 모듈의 internal package 참조 같은 문제를 잡을 수 있다.

즉 아키텍처 규칙을 "리뷰어가 기억해야 하는 것"에서 "테스트가 깨지는 것"으로 옮긴다.

초기 강제 룰은 다음과 같다.

```text
ApplicationModules.verify() 테스트를 추가한다.
해당 테스트는 CI에 포함한다.
다른 모듈의 internal package 참조는 금지한다.
모듈 root package를 public API 영역으로 본다.
```

다만 처음부터 모든 Spring Modulith 기능을 강제하지는 않는다. 팀이 처음 도입하는 상황에서 `allowedDependencies`, `NamedInterface`, `@ApplicationModuleTest`, Documenter, event publication registry를 모두 한 번에 적용하면 학습 비용이 커질 수 있다.

대신 이후 룰 강화 비용을 낮추기 위한 예방 규칙을 둔다.

```text
root package 외 하위 package를 외부 모듈에 공개하지 않는다.
하위 package 공개가 필요하면 NamedInterface 도입을 검토한다.
핵심 모듈의 의존 그래프는 주기적으로 확인한다.
핵심 모듈의 의존이 안정되면 allowedDependencies를 점진 적용한다.
모듈별 테스트 전략이 필요해지면 @ApplicationModuleTest를 도입한다.
문서화가 필요하면 Documenter로 모듈 다이어그램을 생성한다.
application event가 비즈니스 후속 처리에 사용되기 시작하면 event publication registry를 검토한다.
```

## 왜 별도 PoC를 하지 않기로 했나

처음에는 별도 PoC를 만들지 고민했다. 하지만 일정이 넉넉하지 않다. 2주 안에 프로젝트 세팅, 학습, 데모 개발까지 해야 하고 이후에는 성능 개선까지 이어져야 한다.

현재 검토 중인 구조는 완전히 미지의 기술 검증이라기보다 이미 레퍼런스가 있는 조합이다.

```text
Spring Boot
모듈러 모놀리스
Spring Modulith
layered architecture
public API / internal package 규칙
application event
ApplicationModules.verify()
```

그래서 별도 PoC는 하지 않기로 했다. 대신 본 프로젝트의 첫 기능 구현을 **Architecture Spike**로 사용한다.

```text
별도 PoC는 진행하지 않는다.
본 프로젝트의 첫 기능 구현을 Architecture Spike로 사용한다.
```

첫 기능에서 확인할 것은 다음이다.

```text
capability 기준 패키지 구조가 자연스러운가
public API / internal package 분리가 가능한가
ApplicationModules.verify()가 통과하는가
다른 모듈 internal package 참조가 발생하지 않는가
layered 기본 구조가 과하지 않은가
직접 호출, event, port/adapter 기준이 실제로 적용 가능한가
```

이렇게 하면 버려지는 샘플 코드를 만들지 않고 실제 프로젝트 코드 안에서 아키텍처 룰을 검증할 수 있다.

## 현재까지의 결정 요약

현재까지의 결정을 요약하면 다음과 같다.

```text
아키텍처:
 -> 단일 Spring Boot WAS 기반 모듈러 모놀리스

모듈 경계:
 -> 비즈니스 capability 기준

보조 기준:
 -> bounded context는 모델/언어가 갈라질 때 재검토
 -> workflow는 얇은 orchestration 후보로만 사용

모듈 내부 구조:
 -> layered architecture 기본
 -> 작은 모듈은 단순 구조 허용
 -> 복잡한 의존은 port/adapter 부분 적용

모듈 간 협력:
 -> 단순 조회는 public API 직접 호출
 -> side effect는 application event
 -> 복잡한 동기 의존은 port/adapter
 -> 중요한 event 흐름은 event publisher port 검토

Spring Modulith:
 -> 초기 강제는 ApplicationModules.verify()
 -> allowedDependencies, NamedInterface, @ApplicationModuleTest, Documenter는 점진 도입

PoC 전략:
 -> 별도 PoC 없음
 -> 첫 기능을 Architecture Spike로 사용
```

## 팀과 함께 더 논의해야 할 것

아직 모든 결정이 끝난 것은 아니다. 특히 모듈 간 의존 방식은 회의에서 더 구체화해야 한다.

남은 질문은 다음과 같다.

```text
단순 조회의 기준은 무엇인가?
복잡한 동기 의존의 기준은 무엇인가?
event publisher를 port로 감싸야 하는 기준은 무엇인가?
event listener는 application service 외의 로직을 가져도 되는가?
event publication registry는 언제 도입할 것인가?
allowedDependencies는 어떤 모듈부터 적용할 것인가?
@ApplicationModuleTest는 언제 기본 테스트 전략으로 볼 것인가?
Documenter 결과물은 어디에 저장하고 관리할 것인가?
```

이 질문들은 문서만으로 바로 결정하기보다 첫 기능을 구현하면서 실제 코드로 확인하는 편이 좋다.

## 마무리

모듈러 모놀리스는 "마이크로서비스로 가기 전 단계"라기보다, 모놀리스 안에서 변경 경계를 의식적으로 설계하는 방법에 가깝다. 중요한 것은 배포 단위를 쪼개는 것이 아니라, 코드 안에서 어떤 모듈이 어떤 책임을 갖고 어떤 방식으로 협력하는지 명확히 하는 것이다.

Spring Modulith는 이 과정에서 모듈 경계를 검증하고, 이벤트 기반 협력을 지원하고, 모듈별 테스트와 문서화를 도와준다. 하지만 모듈 경계 자체를 대신 결정해주지는 않는다. 결국 중요한 것은 팀이 어떤 경계를 선택하고, 그 경계를 지킬 수 있는 규칙을 얼마나 현실적으로 운영하느냐다.

이번 프로젝트에서는 처음부터 모든 규칙을 강하게 적용하지 않는다. 대신 capability 기준 모듈 경계, layered 기본 구조, internal 참조 금지, `ApplicationModules.verify()`를 출발점으로 삼는다. 그리고 첫 기능을 Architecture Spike로 사용해 실제 코드에서 룰이 유지 가능한지 확인한다.

## 참고 자료

- [Spring Modulith 프로젝트 페이지](https://spring.io/projects/spring-modulith/)
- [Spring Modulith Reference Documentation](https://docs.spring.io/spring-modulith/reference/)
- [Spring Modulith Fundamentals](https://docs.spring.io/spring-modulith/reference/fundamentals.html)
- [Verifying Application Module Structure](https://docs.spring.io/spring-modulith/reference/verification.html)
- [Working with Application Events](https://docs.spring.io/spring-modulith/reference/events.html)
- [Integration Testing Application Modules](https://docs.spring.io/spring-modulith/reference/testing.html)
- [Documenting Application Modules](https://docs.spring.io/spring-modulith/reference/documentation.html)
