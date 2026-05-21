---
title: "SpringBoot 애플리케이션에 .env 통합하는 방법 세가지"
description: "안녕하세요. 저는 요즘에 합세랑 솦커톤, 과제로 인해서 프로젝트를 새로 세팅해야 하는 상황이 많았는데요! 특히 환경 설정을 하면서 환경 변수를 분리하게 되는데 저는 분리하는 방법이 다양하다고만 알고 있지 어떤 장단점이 있는지 모르고 그냥 익숙한 방법을 쓰고 있었습니다."
pubDate: 2025-11-25
tags: ["spring", "springboot"]
draft: false
slug: "springboot-env"
---
안녕하세요. 저는 요즘에 합세랑 솦커톤, 과제로 인해서 프로젝트를 새로 세팅해야 하는 상황이 많았는데요!

특히 환경 설정을 하면서 환경 변수를 분리하게 되는데 저는 분리하는 방법이 **다양하다고만 알고 있지 어떤 장단점이 있는지 모르고** 그냥 익숙한 방법을 쓰고 있었습니다. (개발하면서 이런게 한두개가 아님)

이렇게 여러번 프로젝트를 동일하게 세팅하면서 무심코 지나쳤던 **.env 통합 방법에 대해서 제대로 알아보자**는 마음에 한번 찾아보게 되었습니다.

### 환경변수란..?

보통 프로젝트를 하게 되면 github에는 올라가면 안되는 크리티컬한 정보들이 있습니다. (Password, API Key, JWT Secret 등)

이를 안전하게 관리하기 위해 **보안적으로 노출되면 안되는 것들을 환경변수로 분리**하는 것이 일반적입니다.

이번 아티클에서는 환경변수를 SpringBoot 애플리케이션에 통합하는 세가지 주요 방법을 비교해보려고 합니다.

## 1\. Spring Boot Native Config Import

Spring Boot 2.4.0 이상에서 제공하는 네이티브 기능으로 spring.config.import 속성을 사용하여 .env 파일을 직접 로딩합니다.

### 설정 방법

**application.yml**

```
spring:
  config:
    import:
      - optional:file:.env[.properties]
```

**사용 예시**

```
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

### 주요 특징

-   **optional:** 접두사를 사용하면 파일이 없어도 애플리케이션이 정상 실행됨
-   **\[.properties\]** 힌트로 파일 형식을 명시 (확장자가 없는 경우)
-   여러 파일을 임포트할 수 있으며, 마지막 파일이 우선순위를 가짐

### 장단점

**장점**

-   ✅ **Zero Dependency**: 추가 라이브러리 불필요
-   ✅ **표준 방식**: Spring Boot 공식 지원
-   ✅ **명시적 관리**: 설정 파일에서 직접 확인 가능
-   ✅ **유연한 경로**: 상대/절대 경로 지정 가능
-   ✅ **환경별 대응**: optional: 사용으로 프로덕션 환경 대응

**단점**

-   ❌ **버전 제약**: Spring Boot 2.4.0 미만에서는 사용 불가
-   ❌ **형식 제약**: Properties 형식만 지원 (KEY=VALUE)
-   ❌ **수동 설정 필요**: application.yml에 명시적으로 추가해야 함

\---

## 2\. IntelliJ IDEA 환경변수 설정

IntelliJ IDEA의 Run/Debug Configuration에서 환경변수를 직접 설정하는 방법입니다.

### 설정 방법

1.  **Run Configuration 열기**
    -   Run → Edit Configurations
2.  **환경변수 추가**
    -   Modify Options → Environment Variables 선택
    -   Environment variables 필드에 직접 입력:
    -   DB\_URL=jdbc:mysql://localhost:3306/mydb;DB\_USERNAME=root;DB\_PASSWORD=secret
    -   또는 Edit environment variables 버튼으로 테이블 형식 편집
3.  **Configuration Template 사용** (선택사항)
    -   Run → Edit Configurations → Edit Configuration templates
    -   Spring Boot 템플릿에 환경변수 추가
    -   이후 생성되는 모든 Run Configuration에 자동 적용

### 주요 특징

-   개발자별 독립 설정 가능 (.idea/runConfigurations/에 저장)
-   참조 문법 지원: $VAR$ 형식으로 기존 변수 참조
-   Configuration 파일 링크로 외부 파일 관리 가능

### 장단점

**장점**

-   ✅ **IDE 통합**: IntelliJ 내 완벽한 통합
-   ✅ **즉시 적용**: 코드 변경 없이 즉시 테스트
-   ✅ **개발자별 설정**: 팀원마다 다른 환경 가능
-   ✅ **템플릿 지원**: JUnit 등 모든 Run Configuration에 일괄 적용
-   ✅ **GUI 편집**: 테이블 형식으로 쉽게 관리

**단점**

-   ❌ **IDE 종속**: IntelliJ IDEA 전용 (Eclipse, VS Code 불가)
-   ❌ **공유 어려움**: 팀원 간 설정 공유 복잡
-   ❌ **버전 관리 문제**: .idea/ 디렉토리는 gitignore 대상
-   ❌ **프로덕션 미적용**: 개발 환경에서만 유효
-   ❌ **CLI 실행 불가**: ./gradlew bootRun으로는 환경변수 로딩 안됨

### 사용 시나리오

-   ✅ 개발 환경에서만 사용
-   ✅ 팀원마다 다른 로컬 DB 사용
-   ✅ 빠른 프로토타이핑 및 테스트
-   ❌ 프로덕션 배포
-   ❌ CI/CD 파이프라인

\---

## 3\. spring-dotenv 라이브러리

[spring-dotenv](https://github.com/paulschwarz/spring-dotenv) 라이브러리를 사용하여 .env 파일을 자동으로 로딩하는 방법입니다. [dotenv-java](https://github.com/cdimascio/dotenv-java)를 기반으로 작동합니다.

### 설정 방법

**1\. 의존성 추가 (build.gradle)**

```
dependencies {
    implementation 'me.paulschwarz:spring-dotenv:4.0.0'
}
```

**2\. .env 파일 생성**

```
DB_URL=jdbc:mysql://localhost:3306/mydb
DB_USERNAME=root
DB_PASSWORD=secret
```

**3\. application.yml에서 사용**

```
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

추가 설정 없이 자동으로 .env 파일을 읽습니다.

### 주요 특징

-   **자동 PropertySource 등록**: Spring의 PropertySource로 자동 통합
-   **우선순위 규칙**: 시스템 환경변수 > .env 파일
-   **JDK 요구사항**:
    -   버전 4.0.0: JDK 11+ 필요
    -   버전 3.0.0: 구버전 JDK 지원

### 장단점

**장점**

-   ✅ **완전 자동화**: 설정 파일 수정 불필요
-   ✅ **코드 독립성**: 애플리케이션 코드가 .env에 대해 무관
-   ✅ **명확한 우선순위**: 환경변수 > .env
-   ✅ **dotenv 표준**: 여러 언어/프레임워크와 동일한 형식

**단점**

-   ❌ **외부 의존성**: 추가 라이브러리 필요
-   ❌ **버전 관리**: 라이브러리 업데이트 관리 필요
-   ❌ **JDK 제약**: 최신 버전은 JDK 11+ 필요
-   ❌ **암묵적 동작**: 설정 파일에 명시되지 않아 파악이 어려울 수 있음

### 사용 시나리오

-   ✅ 여러 프로젝트에서 동일한 .env 패턴 사용
-   ✅ Node.js, Python 등과 일관된 환경변수 관리
-   ✅ 복잡한 우선순위 규칙이 필요한 경우

\---

## 종합 비교

### 기능 비교표

기준 Spring Config Import IntelliJ 환경변수 spring-dotenv

|     |     |     |     |
| --- | --- | --- | --- |
| **의존성** | ✅ 불필요 | ✅ 불필요 | ❌ 라이브러리 필요 |
| **설정 복잡도** | 🟡 중간 (yml 수정) | 🟢 쉬움 (GUI) | 🟢 쉬움 (자동) |
| **팀 공유** | 🟢 쉬움 | ❌ 어려움 | 🟢 쉬움 |
| **IDE 독립성** | 🟢 독립적 | ❌ IntelliJ 전용 | 🟢 독립적 |
| **프로덕션 적용** | 🟢 가능 | ❌ 불가능 | 🟢 가능 |
| **CLI 실행** | 🟢 지원 | ❌ 미지원 | 🟢 지원 |
| **우선순위 관리** | 🟡 제한적 | 🟢 유연 | 🟢 명확 |
| **버전 요구사항** | Spring Boot 2.4+ | 없음  | JDK 11+ (v4.0) |

### 성능 비교

방법 시작 시간 메모리 오버헤드 런타임 성능

|     |     |     |     |
| --- | --- | --- | --- |
| Spring Config Import | 빠름  | 없음  | 네이티브 |
| IntelliJ 환경변수 | 빠름  | 없음  | 네이티브 |
| spring-dotenv | 약간 느림 | 최소 (~1-2MB) | 네이티브 |

### 보안 측면

세 가지 방법 모두 민감한 정보를 평문으로 저장하므로 **프로덕션 환경에서는 AWS Secrets Manager, HashiCorp Vault 등의 비밀 관리 도구 사용을 권장**하고 있습니다.

\---

## 시나리오별 선택

### 1️⃣ 토이/신규 프로젝트 (Spring Boot 2.4+)

**Spring Boot Native Config Import**

```
spring:
  config:
    import:
      - optional:file:.env[.properties]
```

**선택 이유:**

-   추가 의존성 없음
-   Spring Boot 표준 방식
-   팀 전체가 동일한 환경
-   CI/CD 파이프라인 통합 용이

### 2️⃣ 다양한 언어/프레임워크 사용 팀

**spring-dotenv**

**선택 이유:**

-   Node.js, Python 등과 동일한 .env 형식
-   dotenv 표준 준수
-   일관된 개발 경험

### 3️⃣ 개발 환경에서만 빠른 테스트

**IntelliJ 환경변수**

**선택 이유:**

-   GUI로 쉽게 설정
-   즉시 적용
-   개발자별 독립 환경

⚠️ 프로덕션 배포는 다른 방법 사용 필요

### 4️⃣ 레거시 프로젝트 (Spring Boot < 2.4)

**spring-dotenv**

**선택 이유:**

-   Spring Boot 버전 제약 없음
-   최소한의 코드 변경

### 프로덕션 환경 전략

**개발 환경:**

-   .env 파일 사용 (위 세 가지 방법 중 선택)

**프로덕션 환경:**

-   실제 시스템 환경변수 사용
-   AWS Secrets Manager / HashiCorp Vault
-   Docker secrets

**하이브리드 접근:**

```
spring:
  config:
    import:
      - optional:file:.env[.properties]  # 개발 환경
  datasource:
    url: ${DB_URL}  # 프로덕션에서는 실제 환경변수 사용
```

\---

## 참고 자료

### Spring Boot Native Config Import

-   [https://www.baeldung.com/spring-boot-properties-env-variables](https://www.baeldung.com/spring-boot-properties-env-variables)
-   [https://docs.spring.io/spring-boot/reference/features/external-config.html](https://docs.spring.io/spring-boot/reference/features/external-config.html)

### spring-dotenv Library

-   [https://github.com/paulschwarz/spring-dotenv](https://github.com/paulschwarz/spring-dotenv)
-   [https://bjoernkw.com/2023/01/08/spring-dotenv-using-env-files-with-spring-applications/](https://bjoernkw.com/2023/01/08/spring-dotenv-using-env-files-with-spring-applications/)

### IntelliJ IDEA Configuration

-   [https://www.jetbrains.com/help/idea/program-arguments-and-environment-variables.html](https://www.jetbrains.com/help/idea/program-arguments-and-environment-variables.html)
-   [https://www.baeldung.com/intellij-idea-environment-variables](https://www.baeldung.com/intellij-idea-environment-variables)
