---
title: "Spring Boot 4 Java WAS 서버 학습 정리"
description: "Java 기반 Greenfield WAS 서버를 Spring Boot 4로 구축할 때 우선 확인할 starter 구성, MVC API 설계, HTTP Service Clients, API Versioning, 관측성, RestTestClient, Jackson 3, Virtual Threads를 정리합니다."
image: "/images/blog/spring-boot-4-java-was/image-01.webp"
pubDate: 2026-06-22
category: "backend"
tags: ["spring", "spring-boot", "java"]
draft: false
slug: "spring-boot-4-java-was"
---
![Spring Boot 4 Java WAS 서버 학습 정리](/images/blog/spring-boot-4-java-was/image-01.webp)

## 학습 관점

이번 학습의 대상은 범용 Spring Boot 4 기능 전체가 아니라, 새로 구축할 WAS 서버에 직접 연결되는 기능이다. 

따라서 기본 방향은 Spring MVC 기반 API 서버다. WebFlux는 기본 선택지가 아니라 streaming 요구사항이 있을 때 별도 검토한다. Spring Boot 4에서 우선 봐야 할 것은 starter 모듈화, MVC 서버 구성, API 버전 정책, 관측성, 로깅 상관관계, 테스트 표준화, virtual threads 적용 가능성이다.

우선 학습할 축은 다음과 같다.

- WAS 기본 starter 구성
- Spring MVC 기반 API 설계
- HTTP Service Clients를 통한 outbound API 호출
- API Versioning
- OpenTelemetry starter와 로그 상관관계
- RestTestClient 기반 API 테스트
- Jackson 3 기반 request/response JSON 처리
- Virtual threads 적용 가능성
- Redis, DB, 비동기 작업의 관측성 및 context 전파
- WebFlux streaming 적용 여부

## 기본 기준선

Spring Boot 4 WAS 서버를 새로 시작할 때 확인할 baseline은 다음이다.

- Java 17 이상
- Java 21 LTS 권장 검토
- Spring Framework 7.x
- Jakarta EE 11
- Servlet 6.1
- GraalVM native-image 사용 시 GraalVM 25 이상
- Gradle 9 지원, Gradle 8.14 이상도 지원

Greenfield WAS라면 Java 21 LTS를 기본값으로 검토한다. Virtual threads를 함께 실험할 수 있고, MVC + blocking I/O 기반 서버에서도 동시성 선택지가 넓어진다.

## Spring Boot 3 vs 4 코드 비교

아래 예시는 기존 Spring Boot 3 방식과 Spring Boot 4에서 우선 검토할 방식을 나란히 보기 위한 학습용 비교다. 모든 프로젝트가 반드시 같은 방식으로 바뀌어야 한다는 뜻은 아니고, Greenfield WAS에서 어떤 기본값을 선택할지 판단하기 위한 기준으로 본다.

### 1. WAS Starter 구성

Spring Boot 3에서는 MVC API 서버를 만들 때 보통 `spring-boot-starter-web`을 사용했다.

```gradle
// Spring Boot 3
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

Spring Boot 4에서는 WAS가 MVC 기반인지, WebFlux 기반인지, HTTP client만 필요한지 더 명확하게 선택한다. MVC WAS라면 `webmvc` starter를 우선 검토한다.

```gradle
// Spring Boot 4
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
}
```

학습 포인트는 `web`이라는 넓은 선택에서 `webmvc`라는 명확한 WAS 실행 모델로 이동한다는 점이다.

### 2. 외부 API 호출

Spring Boot 3에서도 Spring Framework의 HTTP interface 기능을 사용할 수 있었지만, 보통 proxy factory를 직접 구성하는 코드가 필요했다.

```java
// Spring Boot 3
@Configuration
public class HttpClientConfig {

    @Bean
    PostClient postClient(RestClient.Builder builder) {
        RestClient restClient = builder
                .baseUrl("https://api.example.com")
                .build();

        RestClientAdapter adapter = RestClientAdapter.create(restClient);
        HttpServiceProxyFactory factory = HttpServiceProxyFactory
                .builderFor(adapter)
                .build();

        return factory.createClient(PostClient.class);
    }
}
```

client interface 자체는 다음처럼 둘 수 있다.

```java
@HttpExchange
public interface PostClient {

    @GetExchange("/posts/{id}")
    PostResponse getPost(@PathVariable Long id);
}
```

Spring Boot 4에서는 HTTP Service Clients 자동 설정과 관련 starter를 우선 검토한다. WAS에서 외부 HTTP API를 호출한다면 `restclient` starter를 명시하고, interface 기반 client를 기본 패턴으로 실험한다.

```gradle
// Spring Boot 4
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-restclient'
    testImplementation 'org.springframework.boot:spring-boot-starter-restclient-test'
}
```

```java
// Spring Boot 4
@HttpExchange(url = "https://api.example.com")
public interface PostClient {

    @GetExchange("/posts/{id}")
    PostResponse getPost(@PathVariable Long id);

    @PostExchange("/posts")
    PostResponse createPost(@RequestBody CreatePostRequest request);
}
```

학습 포인트는 외부 API 호출 경계를 `RestClient` 호출 코드가 아니라 Java interface로 드러내는 것이다.

### 3. API Versioning

Spring Boot 3에서는 API version을 path나 header에서 직접 관리하는 방식이 흔했다.

```java
// Spring Boot 3
@RestController
@RequestMapping("/api/v1/posts")
public class PostV1Controller {

    @GetMapping("/{id}")
    public PostV1Response getPost(@PathVariable Long id) {
        return new PostV1Response(id, "title");
    }
}
```

또는 header를 직접 확인하는 코드를 둘 수도 있었다.

```java
// Spring Boot 3
@GetMapping("/posts/{id}")
public ResponseEntity<?> getPost(
        @PathVariable Long id,
        @RequestHeader("X-API-Version") String version
) {
    if ("1".equals(version)) {
        return ResponseEntity.ok(new PostV1Response(id, "title"));
    }

    return ResponseEntity.ok(new PostV2Response(id, "title", "author"));
}
```

Spring Boot 4에서는 Spring MVC API Versioning 자동 설정을 학습한다. 버전 문자열을 controller 내부에서 직접 분기하기보다 request mapping과 version resolver 쪽으로 올리는 방향을 검토한다.

```java
// Spring Boot 4
@RestController
@RequestMapping("/posts")
public class PostController {

    @GetMapping(path = "/{id}", version = "1")
    public PostV1Response getPostV1(@PathVariable Long id) {
        return new PostV1Response(id, "title");
    }

    @GetMapping(path = "/{id}", version = "2")
    public PostV2Response getPostV2(@PathVariable Long id) {
        return new PostV2Response(id, "title", "author");
    }
}
```

학습 포인트는 API version을 단순 문자열 분기가 아니라 프레임워크의 요청 매핑 정책으로 다루는 것이다.

### 4. 관측성과 Trace 전파

Spring Boot 3에서는 tracing 구성을 위해 Micrometer tracing bridge와 exporter 의존성을 조합하는 경우가 많았다.

```gradle
// Spring Boot 3 예시
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'io.micrometer:micrometer-tracing-bridge-otel'
    implementation 'io.opentelemetry:opentelemetry-exporter-otlp'
}
```

Spring Boot 4에서는 OpenTelemetry starter를 우선 검토한다.

```gradle
// Spring Boot 4
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'org.springframework.boot:spring-boot-starter-opentelemetry'
}
```

Logback pattern은 `traceId`, `spanId`를 기준으로 잡는다.

```xml
<pattern>
    %d{yyyy-MM-dd HH:mm:ss.SSS} %-5level [%X{traceId:-},%X{spanId:-}] %logger - %msg%n
</pattern>
```

학습 포인트는 새 WAS에서 별도 requestId를 기본으로 만들기보다 `traceId`를 로그 상관관계의 기본 ID로 사용할 수 있는지 확인하는 것이다.

### 5. API 테스트

Spring Boot 3에서는 MVC controller 테스트에 `MockMvc`를 직접 사용하는 경우가 많았다.

```java
// Spring Boot 3
@SpringBootTest
@AutoConfigureMockMvc
class PostControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void getPost() throws Exception {
        mockMvc.perform(get("/posts/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }
}
```

Spring Boot 4에서는 `RestTestClient`를 API 테스트 표준 후보로 검토한다. MockMvc 기반 테스트와 실제 서버 통합 테스트의 클라이언트 경험을 맞추는 것이 목적이다.

```java
// Spring Boot 4
@SpringBootTest
@AutoConfigureMockMvc
class PostControllerTest {

    private final RestTestClient restTestClient;

    PostControllerTest(RestTestClient restTestClient) {
        this.restTestClient = restTestClient;
    }

    @Test
    void getPost() {
        restTestClient.get()
                .uri("/posts/{id}", 1L)
                .exchange()
                .expectStatus().isOk()
                .expectBody(PostResponse.class);
    }
}
```

학습 포인트는 WAS API 테스트를 `MockMvc`, `RANDOM_PORT` 통합 테스트에서 비슷한 방식으로 작성할 수 있는지 확인하는 것이다.

## 1. WAS 기본 Starter 구성

Spring Boot 4에서는 starter 구조가 더 명확해졌다. WAS 서버라면 기본 starter는 `spring-boot-starter-webmvc`다. 기존의 넓은 `web` starter 감각보다, "이 서버는 MVC 기반 Servlet WAS다"라는 선택을 의존성에서 명확히 표현한다.

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
}
```

테스트 starter도 WAS 모델에 맞춰 고른다.

```gradle
dependencies {
    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
}
```

이 섹션에서 학습할 것은 starter 이름 자체보다 "서버 역할에 필요한 의존성만 고르는 방식"이다. WAS 서버라면 `webmvc`, `validation`, `actuator`, 관측성, DB, 보안 starter가 기본 후보가 된다. 반대로 `webflux`, `webclient`, `batch`, `grpc`는 요구사항이 있을 때 추가로 검토한다.

## 2. Spring MVC 기반 API 설계

이번 서버의 기본 실행 모델은 Spring MVC다. Controller가 HTTP 요청을 받고, Service가 비즈니스 로직을 처리하고, Repository 또는 외부 client가 인프라와 통신하는 구조를 우선 기준으로 둔다.

예시 request DTO는 Java record로 시작할 수 있다.

```java
import jakarta.validation.constraints.NotBlank;

public record CreatePostRequest(
        @NotBlank String title,
        @NotBlank String content
) {
}
```

Controller에서는 request body validation과 response DTO 분리를 함께 학습한다.

```java
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/posts")
public class PostController {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse createPost(@Valid @RequestBody CreatePostRequest request) {
        return new PostResponse(1L, request.title(), request.content());
    }
}
```

Greenfield에서는 Entity를 바로 JSON으로 노출하지 않고 request DTO, response DTO를 분리한다. WAS의 API 계약이 DB 모델과 강하게 묶이지 않도록 초기에 경계를 잡는 것이 중요하다.

## 3. HTTP Service Clients

WAS는 inbound 요청만 처리하지 않는다. 외부 인증 서버, 결제 서버, 알림 서버, 다른 내부 서비스와 HTTP로 통신할 수 있다. Spring Boot 4에서는 이런 outbound HTTP 호출을 HTTP Service Clients로 선언적으로 표현할 수 있다.

```java
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

@HttpExchange(url = "https://api.example.com")
public interface PostClient {

    @GetExchange("/posts/{id}")
    PostResponse getPost(@PathVariable Long id);

    @PostExchange("/posts")
    PostResponse createPost(@RequestBody CreatePostRequest request);
}
```

WAS 관점에서 이 기능은 외부 API adapter를 정리하는 데 유용하다. 비즈니스 서비스가 `RestClient` 호출 세부사항을 직접 알지 않게 하고, 외부 API 계약을 interface로 드러낼 수 있다.

OpenFeign과의 관계도 함께 봐야 한다. 단순 외부 REST API 호출은 HTTP Service Clients로 상당 부분 대체할 수 있다. 다만 Spring Cloud OpenFeign이 제공하는 service discovery, load balancing, fallback, circuit breaker 연동까지 자동 대체되는 것은 아니다.

선택 기준은 다음처럼 잡는다.

```text
단순 외부 API 호출
 -> HTTP Service Clients 우선 검토

Spring Cloud service discovery/load balancing 필요
 -> OpenFeign 또는 Spring Cloud 조합 검토

복잡한 resilience 정책 필요
 -> retry, timeout, circuit breaker 구성을 별도 설계
```

WAS에서 특히 확인할 것은 timeout, error handling, 인증 header, trace propagation이다. 외부 API 지연이 WAS thread와 응답 시간에 직접 영향을 주기 때문이다.

## 4. API Versioning

WAS 서버는 클라이언트와 API 계약을 맺는다. Greenfield라도 API 버전 정책은 초기에 정해야 한다. Spring Boot 4는 Spring MVC의 API Versioning 자동 설정을 지원한다.

MVC 기준 설정은 다음 계열을 본다.

- `spring.mvc.apiversion.*`

확장 포인트는 다음이다.

- `ApiVersionResolver`
- `ApiVersionParser`
- `ApiVersionDeprecationHandler`

학습할 때는 version을 어디에 둘지 먼저 비교한다.

```text
URL path
 -> /api/v1/posts

Header
 -> X-API-Version: 1

Media type
 -> Accept: application/vnd.example.v1+json
```

내부 서비스나 단순 API 서버라면 path 기반이 가장 이해하기 쉽다. 외부 공개 API, gateway, 모바일 앱과 연결되는 경우에는 header나 media type 기반도 검토한다.

중요한 것은 controller 내부에서 version 문자열을 직접 파싱하지 않는 것이다. 버전 정책을 Spring MVC request mapping과 설정으로 올리는 방향을 학습한다.

## 5. OpenTelemetry Starter와 로그 상관관계

WAS는 운영 중 요청 흐름을 추적할 수 있어야 한다. Spring Boot 4의 `spring-boot-starter-opentelemetry`는 OTLP 기반 metrics와 traces export에 필요한 의존성과 OpenTelemetry SDK 자동 설정을 제공한다.

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'org.springframework.boot:spring-boot-starter-opentelemetry'
}
```

WAS에서 먼저 구분할 관측성 데이터는 다음이다.

- metrics: 요청 수, 응답 시간, JVM 메모리, DB connection pool, 에러율
- traces: 하나의 요청이 controller, service, DB, Redis, 외부 API를 지나가는 흐름
- logs: 개별 이벤트 기록

실습 목표는 "HTTP 요청 하나가 WAS 내부 처리와 외부 API 호출까지 하나의 trace로 이어져 보이는가"로 잡는다.

Spring Boot 4.1에서는 다음 설정도 함께 볼 수 있다.

- `management.opentelemetry.enabled`
- sampler 설정
- span/log limit 설정
- OTLP exporter SSL bundle 지원

### Logback, MDC, requestId

OpenTelemetry starter가 Logback을 대체하는 것은 아니다. Spring Boot 기본 로깅은 여전히 Logback이고, 기존 MDC filter도 유지할 수 있다. 달라지는 부분은 trace context를 로그와 연결할 수 있다는 점이다.

예시 로그 패턴:

```xml
<pattern>
    %d{yyyy-MM-dd HH:mm:ss.SSS} %-5level [%X{traceId:-},%X{spanId:-}] %logger - %msg%n
</pattern>
```

새 WAS에서는 내부 요청 추적 목적으로 별도 `requestId`를 직접 생성하기보다 `traceId`를 우선 사용하는 방향을 검토한다. `traceId`는 서비스 간 호출까지 이어지는 분산 추적 ID로 사용할 수 있기 때문이다.

다만 외부에서 `X-Request-Id`가 들어오거나 gateway, partner API, 감사 로그 요구사항이 있다면 `requestId`를 별도로 보존한다.

```text
로그 상관관계
 -> traceId/spanId

외부 요청 ID 보존
 -> requestId

서비스 간 분산 추적
 -> OpenTelemetry trace context
```

MDC filter를 작성할 때는 `MDC.clear()`가 trace 관련 key까지 지우지 않는지 확인한다. 가능하면 내가 넣은 key만 제거하는 방식이 안전하다.

## 6. RestTestClient

WAS 서버에서는 API 테스트 표준이 중요하다. Spring Boot 4의 `RestTestClient`는 MockMvc 기반 테스트와 실제 서버를 띄운 통합 테스트에서 비슷한 방식으로 API를 호출하고 검증할 수 있게 해준다.

사용 가능한 환경은 다음과 같다.

- `@SpringBootTest`
- `@AutoConfigureMockMvc`
- random port 또는 defined port 통합 테스트

학습할 때는 단순 성공 응답보다 WAS의 경계 조건을 함께 검증한다.

- request body validation 실패
- 인증/인가 실패
- 존재하지 않는 리소스
- 외부 API 실패
- 예외 응답 포맷
- API version별 응답

RestTestClient를 표준 테스트 클라이언트 후보로 두면, controller 테스트와 통합 테스트의 작성 스타일을 맞추기 쉽다.

## 7. Jackson 3 기반 JSON 처리

WAS는 JSON request/response 계약을 제공한다. Spring Boot 4는 Jackson 3 계열을 기준으로 하므로, 새 Java 프로젝트에서는 Jackson 3 기준으로 DTO, 직렬화 정책, `ObjectMapper` custom 설정을 잡는다.

Greenfield에서 먼저 정할 JSON 정책은 다음이다.

- Java record DTO 직렬화/역직렬화
- 날짜/시간 타입 처리
- enum 직렬화 정책
- null field 포함 여부
- camelCase 또는 snake_case 네이밍 정책
- validation error 응답 포맷

처음부터 많은 custom 설정을 넣기보다, API 계약상 필요한 규칙부터 하나씩 명시한다. 특히 날짜/시간과 enum은 클라이언트와 계약이 되기 쉬우므로 초기에 기준을 정한다.

## 8. Virtual Threads

Java 21을 기준 런타임으로 잡는다면 virtual threads는 WAS에서 꼭 실험할 만하다. Spring Boot에서는 다음 설정으로 virtual threads 사용을 켤 수 있다.

```properties
spring.threads.virtual.enabled=true
```

Spring Boot 4에서는 JDK `HttpClient` 기반 자동 설정 HTTP client도 이 설정이 켜져 있으면 virtual threading을 사용하도록 구성된다.

Virtual threads는 blocking I/O가 많은 MVC WAS에서 특히 의미가 있다. DB 조회나 외부 HTTP API 호출처럼 thread가 기다리는 시간이 많은 작업에서 platform thread보다 가볍게 동시성을 다룰 수 있다.

다만 DB connection pool, 외부 API rate limit, timeout 같은 병목은 그대로 남는다. virtual thread가 많아져도 DB connection pool이 10개라면 동시에 DB 작업을 수행할 수 있는 수는 제한된다.

학습할 때는 다음을 함께 본다.

- MVC + virtual threads 조합
- blocking I/O와 CPU-bound 작업 구분
- DB connection pool과 외부 API timeout 설정
- thread dump와 metrics에서 동작 확인
- Java 21 runtime baseline

일반적인 JPA/JDBC 기반 WAS라면 WebFlux를 바로 선택하기보다 MVC + virtual threads를 먼저 실험하는 것이 단순할 수 있다.

## 9. DB, Redis, 비동기 작업 관측성

WAS는 DB, Redis, 메시징, 비동기 작업과 자주 연결된다. Spring Boot 4의 인프라 자동 설정 개선은 프로젝트에서 사용하는 기술만 골라 학습한다.

Redis를 쓴다면 Lettuce 기반 Static Master/Replica 자동 설정과 Redis observability를 확인한다.

- `spring.data.redis.masterreplica.nodes`
- Observation API 기반 Redis metrics/traces

MongoDB를 사용한다면 Actuator health에서 장애 상태가 어떻게 표현되는지 확인한다. Spring Data MongoDB 없이 MongoDB Java Driver만 사용하는 경우에도 health indicator를 제공할 수 있게 개선됐다.

JMS를 사용한다면 새 `JmsClient` API 자동 설정을 검토한다. 기존 `JmsTemplate`과 어떤 차이가 있는지, queue/topic, transaction, retry, dead letter queue 전략을 함께 본다.

비동기 처리에서는 TaskDecorator가 중요하다. `@Async`, scheduler, custom executor를 사용할 때 MDC, trace context, security context가 thread를 넘어 잘 전파되는지 확인해야 한다. Spring Boot 4에서는 여러 `TaskDecorator` 빈을 `CompositeTaskDecorator`로 구성할 수 있다.

```text
Redis 사용
 -> Redis observability 실험

비동기 처리 사용
 -> TaskDecorator와 context propagation 실험

MongoDB 사용
 -> health indicator 확인

JMS 사용
 -> JmsClient 검토
```

## 10. WebFlux와 Streaming

이번 서버의 기본 방향은 Spring MVC WAS다. 따라서 WebFlux는 기본 실행 모델이 아니라 streaming 요구사항이 있을 때 검토하는 선택지로 둔다.

WebFlux는 Spring의 reactive web stack이다. Servlet 기반 MVC와 달리 non-blocking I/O와 reactive stream을 전제로 한다. "더 최신 MVC"가 아니라 별도의 프로그래밍 모델이다.

WebFlux가 강한 영역은 다음과 같다.

- Server-Sent Events
- 실시간 알림
- 채팅 이벤트
- 진행률 업데이트
- 로그 tailing
- AI 응답 streaming
- 대량 데이터 chunk 응답
- 외부 streaming API proxy

서버 전체를 WebFlux로 가져갈 경우 starter는 다음이다.

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
}
```

서버는 MVC로 유지하고 reactive HTTP client만 필요하다면 `webclient` starter만 검토한다.

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webclient'
}
```

선택 기준은 다음처럼 잡는다.

```text
JPA/JDBC 기반 일반 WAS
 -> MVC + virtual threads 우선 검토

지속 연결, 이벤트 흐름, AI streaming
 -> WebFlux 검토

외부 HTTP reactive client만 필요
 -> WebFlux 서버 대신 WebClient starter 검토
```

## 11. Spring Boot 4.1에서 WAS 기준으로 함께 볼 기능

Spring Boot 4.0을 학습하더라도 새 WAS라면 4.1에서 이어진 기능도 함께 확인한다. 모든 기능을 볼 필요는 없고 WAS 운영과 보안에 연결되는 항목부터 본다.

WAS 관점에서 우선순위가 높은 기능은 다음이다.

- `InetAddressFilter` 기반 SSRF 완화
- `@Async` context propagation
- HTTP client cookie handling 설정
- `spring.datasource.connection-fetch=lazy`
- actuator info endpoint process 정보 추가
- `@RedisListener` 자동 설정

외부 URL을 받아 서버가 호출하는 기능이 있다면 SSRF 완화를 먼저 본다. 비동기 작업이 많다면 `@Async` context propagation을 확인한다. DB connection pool 효율을 보고 싶다면 lazy JDBC connection fetching을 실험한다.

gRPC, RabbitMQ Streams, Spring Batch MongoDB, Log4j file rotation은 해당 기술을 실제로 쓸 때 별도 학습한다.

## 기본 `build.gradle` 예시

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

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'org.springframework.boot:spring-boot-starter-opentelemetry'
    implementation 'org.springframework.boot:spring-boot-starter-restclient'

    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
    testImplementation 'org.springframework.boot:spring-boot-starter-restclient-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

## 참고 자료

- [Spring Boot 프로젝트 페이지](https://spring.io/projects/spring-boot/)
- [Spring Boot 4.0 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes)
- [Spring Boot 4.1 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.1-Release-Notes)
- [Modularizing Spring Boot](https://spring.io/blog/2025/10/28/modularizing-spring-boot/)
