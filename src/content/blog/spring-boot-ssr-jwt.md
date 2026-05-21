---
title: "Spring Boot SSR 환경에서 JWT 사용의 적절성에 대한 고찰"
description: "Spring Boot 기반의 SSR(Server-Side Rendering) 웹 애플리케이션에서 인증 및 인가 기능을 구현할 때, JWT(Json Web Token)를 사용할 것인지, 혹은 세션(Session) 기반 인증을 사용할 것인지에 대한 선택은 매우 중요하다. 최근"
pubDate: 2025-04-24
tags: ["spring", "spring-boot"]
draft: false
slug: "spring-boot-ssr-jwt"
---
Spring Boot 기반의 SSR(Server-Side Rendering) 웹 애플리케이션에서 인증 및 인가 기능을 구현할 때, JWT(Json Web Token)를 사용할 것인지, 혹은 세션(Session) 기반 인증을 사용할 것인지에 대한 선택은 매우 중요하다. 최근 REST API 기반 구조에서는 JWT의 활용이 활발하지만, SSR 환경에서는 여전히 세션 방식이 주로 사용되고 있다. 본 글은 관련 구조의 차이, 기술적 고려사항, 그리고 Spring Security와의 관계를 중심으로 정리한 학습 내용이다.

## **SSR 환경과 세션 기반 인증의 구조**

SSR 방식은 서버가 직접 HTML을 렌더링해서 클라이언트에 전달하며, 인증된 사용자의 상태를 **서버 세션에 저장**한다. 클라이언트는 이후 요청마다 세션 ID가 담긴 쿠키(`JSESSIONID`)를 서버에 자동으로 전달하고, 서버는 이 ID로 사용자 인증 여부를 확인한다.

이 방식은 **상태를 서버에서 관리하는 stateful 구조**로, Spring Security에서 기본적으로 지원되며, `formLogin()`, `logout()`, `sessionManagement()` 등의 설정만으로 로그인/로그아웃/인가 처리를 구현할 수 있다.

## **Spring Security와 JWT의 관계**

Spring Security는 인증/인가 전반을 다루는 **보안 프레임워크**이다.
기본적으로 세션 기반 인증을 제공하지만, 필요할 경우 JWT 기반 인증도 설정 가능하다.

| 구성  | 설명  |
| --- | --- |
| **Spring Security 단독 사용** | 보통 SSR에서 사용. 세션 기반. JSESSIONID 쿠키 사용. |
| **Spring Security + JWT** | 주로 SPA, 모바일 환경 등 API 서버에서 사용. Stateless 구조. |

즉, **Spring Security는 세션이든 JWT든 인증 전략을 선택할 수 있는 프레임워크**이며, JWT는 인증 정보를 저장하고 전달하는 **한 방식**일 뿐이다.

## **SSR 환경에서 JWT 사용이 어려운 이유**

SSR 기반에서 JWT를 사용하려는 시도는 아래와 같은 문제점과 한계에 부딪힌다:

### 1\. Stateless 구조와의 부조화

SSR은 서버에서 상태를 유지하면서 렌더링을 수행하는 구조인데, JWT는 상태를 클라이언트에 저장하는 stateless 구조다. 이 둘은 기본적으로 지향점이 다르며, SSR에서 JWT를 사용하면 상태 관리가 이중화되거나 구조가 꼬일 수 있다.

### 2\. 보안 취약성

JWT는 Base64 인코딩이 되어 있을 뿐 암호화되어 있지 않다. 토큰이 유출되면 복호화가 가능하며, 저장 방식에 따라 XSS에 취약하다. 또한 서버는 발급한 JWT를 무효화할 수단이 없기 때문에 통제력이 약하다.

### 3\. 연산 오버헤드

JWT는 요청마다 서버에서 서명 검증을 수행해야 하므로, SSR에서의 HTML 렌더링과 겹칠 경우 **성능 저하**가 발생할 수 있다.

### 4\. 클라이언트 측 저장 이슈

JWT를 클라이언트에 저장하려면 보통 JavaScript로 `localStorage` 혹은 `cookie`에 저장해야 한다. 하지만 SSR에서는 JS 사용이 제한되거나 불편하며, 쿠키 저장 시 CSRF 대응도 고려해야 한다.

### 5\. Spring Security 기능과의 단절

SSR에서 Spring Security는 권한에 따라 UI 요소를 제어하는 `sec:authorize` 같은 기능을 제공하는데, JWT 기반 구조에서는 이와 같은 연동이 어렵거나 우회적 처리만 가능하다.

## **세션 방식의 장점**

-   서버에서 상태를 직접 제어할 수 있음 (로그아웃/강제 로그아웃 등)
-   Spring Security 및 Thymeleaf와의 자연스러운 통합
-   CSRF 대응 자동 적용
-   JSESSIONID 쿠키를 통한 자동 인증

## **JWT 방식의 장점 (SPA/API 구조에 적합)**

-   서버 확장성 및 무상태 구조에 유리
-   다양한 클라이언트(모바일/SPA)에서 동일 인증 처리 가능
-   세션 공유 없이 API 호출만으로 인증 가능

\---

## **결론**

Spring Boot SSR 구조에서는 여전히 세션 기반 인증 방식이 현실적이고 효과적인 선택이다. Spring Security는 이 구조에 최적화된 기능을 제공하며, 인증/인가, CSRF 방어, UI 렌더링 제어까지 포괄적으로 지원한다.

반면, JWT는 API 서버, SPA 프론트엔드, 모바일 앱 등 **프론트-백엔드 분리형 구조**에서 유용하게 사용되며, 이러한 환경에서는 Spring Security와 함께 사용하여 토큰 기반 인증을 구현할 수 있다.

**요약하자면** SSR 프로젝트에서는 세션 기반 인증이 유지관리성, 보안, 개발 편의성 측면에서 더 적합하며, JWT는 구조적으로 필요할 때만 도입하는 것이 바람직하다.

## **Referane**

[https://zks145.tistory.com/106](https://zks145.tistory.com/106)

 [\[Spring\] SSR에서 JWT를 이용한 인증/인가 처리 고민

SSR과 JWT에 대한 고찰여기저기 글을 찾아보면 LocalStorage, Cookie를 이용해 JWT 관리하게 되는데 Spring Boot에서 JSP, thymeleaf 같이 SSR 기반 방식의 경우 JWT를 사용하는 경우는 거의 없습니다. SSR 경우 대

zks145.tistory.com](https://zks145.tistory.com/106)

[https://velog.io/@suragaryen/SSR-%EB%B0%A9%EC%8B%9D%EA%B3%BC-Spring-Security-jwt](https://velog.io/@suragaryen/SSR-%EB%B0%A9%EC%8B%9D%EA%B3%BC-Spring-Security-jwt)

 [SSR 방식과 Spring Security + jwt

최근 내 프로젝트 (spring boot + thymeleaf)에 spring boot와 jwt 토큰을 발급해서 로그인을 구현하려는 시도를 했었다. 그러나 여기저기 구글링을 해보고 많이 찾아봐도 Api로 로그인 테스트만 하고 막상

velog.io](https://velog.io/@suragaryen/SSR-%EB%B0%A9%EC%8B%9D%EA%B3%BC-Spring-Security-jwt)

[https://velog.io/@suragaryen/SSR-%EB%B0%A9%EC%8B%9D%EA%B3%BC-Spring-Security-jwt](https://velog.io/@suragaryen/SSR-%EB%B0%A9%EC%8B%9D%EA%B3%BC-Spring-Security-jwt))

[https://velog.io/@suragaryen/SSR-%EB%B0%A9%EC%8B%9D%EA%B3%BC-Spring-Security-jwt](https://velog.io/@suragaryen/SSR-%EB%B0%A9%EC%8B%9D%EA%B3%BC-Spring-Security-jwt))

[https://dev-rootable.tistory.com/160](https://dev-rootable.tistory.com/160)

 [SSR에 JWT 적용이 부적합한 이유

세션 방식으로 구현했던 SSR 서버에 JWT를 적용하면서 느낀 점을 정리하고자 한다. 💥 문제점 🚨 Stateless 하지 않다. SSR 서버는 매 요청마다 비즈니스 로직을 수행하고 컨트롤러를 통해 렌더링

dev-rootable.tistory.com](https://dev-rootable.tistory.com/160)
