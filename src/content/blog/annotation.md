---
title: "스프링 annotation, 의존성 정리"
description: "어노테이션 설명 어노테이션 설명 어노테이션 설명 어노테이션 설명 어노테이션 설명 어노테이션"
pubDate: 2025-04-12
tags: []
draft: false
slug: "annotation"
---
## **1\. 어노테이션**

### **1\. 클래스 선언에 사용하는 어노테이션**

어노테이션 설명

|     |     |
| --- | --- |
| @Component | 스프링이 관리하는 일반적인 빈(bean)으로 등록 |
| @Controller | MVC의 컨트롤러 역할. 뷰를 반환함 |
| @RestController | @Controller + @ResponseBody, JSON 형태 응답 |
| @Service | 비즈니스 로직을 담당하는 서비스 클래스 |
| @Repository | 데이터 액세스 계층, 예외 처리에 특화됨 |
| @Configuration | 설정 클래스로 사용 |
| @EnableAutoConfiguration | 자동 설정 활성화 (Spring Boot) |
| @SpringBootApplication | @Configuration, @EnableAutoConfiguration, @ComponentScan의 조합 |

### **2\. DI(의존성 주입) 관련 어노테이션**

어노테이션 설명

|     |     |
| --- | --- |
| @Autowired | 타입 기반으로 의존성 주입 |
| @Qualifier | 같은 타입의 빈이 여러 개일 때 이름으로 구분 |
| @Inject | @Autowired와 비슷 (JSR-330) |
| @Value | application.properties 값 주입 |
| @Bean | 개발자가 직접 빈 등록할 때 사용 |

### **3\. 요청 처리 관련 (Controller에서 주로 사용)**

어노테이션 설명

|     |     |
| --- | --- |
| @RequestMapping | URL과 메서드 매핑 (다양한 방식 지원) |
| @GetMapping, @PostMapping, @PutMapping, @DeleteMapping | HTTP 메서드별 요청 매핑 |
| @PathVariable | URI 경로 변수 매핑 |
| @RequestParam | 쿼리 파라미터 매핑 |
| @RequestBody | 요청 본문(JSON 등)을 객체로 변환 |
| @ResponseBody | 객체를 JSON으로 응답 |
| @ModelAttribute | 폼 데이터 바인딩 |
| @CrossOrigin | CORS 허용 |

### **4\. AOP, 트랜잭션, 기타 기능**

어노테이션 설명

|     |     |
| --- | --- |
| @Transactional | 트랜잭션 관리 |
| @Aspect | AOP 구현 시 사용 |
| @Before, @After, @Around | AOP 조인 포인트 설정 |
| @Slf4j | 로그 사용 가능하게 해줌 (Lombok) |
| @Scheduled | 스케줄링 기능 수행 |
| @Async | 비동기 실행 |

### **5\. 검증/유효성 관련**

어노테이션 설명

|     |     |
| --- | --- |
| @Valid | 유효성 검증 (javax.validation) |
| @Validated | 스프링이 제공하는 검증 |
| @NotNull, @NotBlank, @Size 등 | 유효성 제약 설정 |

### **6\. Lombok 관련**

어노테이션 설명

|     |     |
| --- | --- |
| @Getter, @Setter | getter/setter 자동 생성 |
| @ToString, @EqualsAndHashCode | 메서드 자동 생성 |
| @NoArgsConstructor, @AllArgsConstructor, @RequiredArgsConstructor | 생성자 자동 생성 |
| @Builder | 빌더 패턴 제공 |

## **2\. dependency**

## 핵심 스타터

|     |     |
| --- | --- |
| spring-boot-starter | 스프링 부트의 기본 스타터. 로깅, 자동 설정 포함 |
| spring-boot-starter-web | 웹 애플리케이션 및 REST API 개발용. 내장 Tomcat 포함 |
| spring-boot-starter-data-jpa | JPA와 Hibernate 기반의 ORM 데이터베이스 연동 |
| spring-boot-starter-validation | Bean Validation API (@Valid, @Validated) 지원 |
| spring-boot-starter-test | 테스트 관련 의존성 모음 (JUnit, Mockito 등) |

## 데이터베이스 관련

|     |     |
| --- | --- |
| spring-boot-starter-data-jdbc | JPA 대신 단순 JDBC 기반 데이터 연동 |
| com.h2database:h2 | 인메모리 DB. 테스트 환경에 적합 |
| mysql:mysql-connector-java | MySQL 드라이버 |
| org.postgresql:postgresql | PostgreSQL 드라이버 |
| spring-boot-devtools | 개발 편의 기능 (Hot Reload 등) 제공 |

## JSON 및 웹 개발

|     |     |
| --- | --- |
| com.fasterxml.jackson.core:jackson-databind | JSON ↔ Java 객체 매핑 |
| spring-boot-starter-thymeleaf | Thymeleaf 템플릿 엔진 (SSR 기반 웹 페이지 개발) |
| spring-boot-starter-webflux | 비동기, 리액티브 웹 애플리케이션 개발 (WebClient 등 사용 시) |

## 보안 및 인증

|     |     |
| --- | --- |
| spring-boot-starter-security | 인증/인가 및 보안 설정 |
| spring-boot-starter-oauth2-client | 소셜 로그인 (Google, Kakao 등) OAuth2 클라이언트 지원 |
| io.jsonwebtoken:jjwt 또는 com.auth0:java-jwt | JWT 토큰 발급 및 검증 기능 |

\---

## API 문서화

|     |     |
| --- | --- |
| org.springdoc:springdoc-openapi-starter-webmvc-ui | OpenAPI 3 기반 Swagger UI 문서 자동 생성 (최신 추천) |
| io.springfox:springfox-boot-starter | Swagger 2 기반 문서 생성 (구버전 프로젝트에 사용) |

## 기타 라이브러리

|     |     |
| --- | --- |
| org.projectlombok:lombok | 반복되는 코드 생략 (@Getter, @Builder 등) |
| org.modelmapper:modelmapper | 객체 간 변환 (DTO ↔ Entity) |
| org.mapstruct:mapstruct | 타입 매핑 자동화 (컴파일 타임 매핑) |
| org.apache.commons:commons-lang3 | 문자열, 날짜 등 다양한 유틸 기능 |
| org.springframework.boot:spring-boot-configuration-processor | @ConfigurationProperties 자동 완성 지원 |

참고 

-   implementation : 실제 코드에 사용되는 라이브러리
-   runtimeOnly : 실행 시에만 필요한 의존성 (DB 드라이버 등)
-   testImplementation : 테스트 코드에만 필요한 의존성
