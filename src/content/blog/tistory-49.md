---
title: "JWT 인증의 보안 고도화 전략 – 단순 토큰에서 실전 대응까지"
description: "최근 백엔드 개발에서는 JWT(Json Web Token)를 활용한 인증 방식이 일반화되고 있습니다. RESTful API, SPA(Single Page Application), 모바일 앱 등 다양한 아키텍처에서 세션 기반 인증보다 JWT가 선호되는 이유는 분명합니다. 하지만"
pubDate: 2025-05-20
tags: []
draft: false
slug: "tistory-49"
---
최근 백엔드 개발에서는 JWT(Json Web Token)를 활용한 인증 방식이 일반화되고 있습니다. RESTful API, SPA(Single Page Application), 모바일 앱 등 다양한 아키텍처에서 세션 기반 인증보다 JWT가 선호되는 이유는 분명합니다. 하지만 **단순한 JWT 인증만으로는 보안 위협에 충분히 대응할 수 없습니다.** 이 글에서는 기본적인 JWT 인증 방식부터, 실무에서 자주 사용되는 고급 보안 기법까지 체계적으로 정리해 보겠습니다.

\---

## 1\. 기본적인 JWT 인증 구조

JWT는 크게 두 종류의 토큰으로 구성됩니다.

-   **Access Token**: 사용자 인증 및 권한 부여 시 사용, 만료 시간 짧음 (예: 1시간)
-   **Refresh Token**: Access Token 만료 시 새로운 Access Token을 발급받는 용도, 만료 시간 길음 (예: 7일~14일)

> 기본 구조만으로도 stateless한 인증이 가능하지만, 공격자가 토큰을 탈취하는 경우 이를 막기 어렵다는 취약점이 존재합니다.

\---

## 2\. 보안을 강화하는 JWT 인증 전략

### 2-1. Refresh Token과 Access Token 분리

-   Access Token은 클라이언트(LocalStorage/Memory)에서 관리
-   Refresh Token은 **HttpOnly 쿠키**로 저장해 XSS 방어
-   토큰 재발급 시 Refresh Token으로 새로운 Access Token을 요청

> Refresh Token의 **저장 위치**가 보안성에 큰 영향을 미칩니다. 가능한 쿠키(HttpOnly, Secure)로 관리해야 합니다.

\---

### 2-2. Refresh Token 1회성 사용 (Refresh Token Rotation)

-   Refresh Token을 **한 번 사용하면 폐기**
-   재발급 시 새로운 Refresh Token과 Access Token을 함께 발급
-   이전 Refresh Token이 재사용되면 **토큰 탈취 공격**으로 간주하고 즉시 차단

> Redis 등을 이용해 Refresh Token을 서버 측에서 저장·검증해야 구현 가능

\---

### 2-3. Token Blacklist (Access Token 무효화)

JWT의 단점 중 하나는 **중간에서 토큰을 무효화할 수 없다는 점**입니다. 이를 보완하기 위해:

-   로그아웃 시 Access Token을 **Redis 등의 캐시 DB에 Blacklist 등록**
-   필터나 인터셉터에서 토큰이 Blacklist에 포함돼 있는지 체크

java

복사편집

if (redisService.exists("blacklist:" + accessToken)) { throw new InvalidTokenException("블랙리스트에 등록된 토큰입니다."); }

\---

### 2-4. IP 기반의 사용자 인증 보강

-   Refresh Token 요청 시 **요청자의 IP 주소**를 함께 저장
-   이후 재발급 요청이 들어올 때, **IP 주소가 일치하지 않으면 거부**

> 주로 금융권, 보안 민감 서비스에서 사용됨
> 단점: 사용자의 네트워크 환경 변화(모바일, VPN 등)로 인한 정상 요청 오탐 가능

이러한 방식은 네이버, 구글 등에서도 사용되고있다.

![JWT 인증의 보안 고도화 전략 – 단순 토큰에서 실전 대응까지](/images/blog/tistory-49/image-01.png)

\[네이버\] 새로운 ip에서 접속했을 때 전송되는 확인 메세지

\---

### 2-5. 로그아웃 시 토큰 폐기

-   클라이언트에서 Access Token 삭제만으로는 충분하지 않음
-   **서버 측에서 Refresh Token을 삭제**하거나 Redis에서 제거
-   Access Token도 Blacklist에 등록 (단기 토큰이라도 여전히 유효하기 때문)

\---

## 3\. 실무에서 고려해야 할 추가 보안 요소

보안 요소설명도구/기술

|     |     |     |
| --- | --- | --- |
| 토큰 서명 비밀키 관리 | 서명 키 노출 시 위조 가능 | .env, Vault, AWS Secrets |
| HTTPS 통신 필수 | 중간자 공격 방지 | HTTPS 인증서 적용 |
| Scope / 권한 분리 | 최소 권한 원칙 적용 | claims, roles |
| 토큰 페이로드 암호화 | 민감 정보 숨김 (기본 JWT는 암호화되지 않음) | JWE (Encrypted JWT) |
| 만료 시간 설정 | 짧게 설정해 탈취 리스크 감소 | Access: 1h, Refresh: 7d |
| CORS 및 CSRF 대응 | 프론트엔드 도메인 제한, 쿠키 보호 | CORS 설정, SameSite 정책 |

\---

## 4\. 결론 – “JWT는 보안이 아닌 구조일 뿐, 보안은 우리가 책임진다”

JWT는 인증 방식일 뿐, 보안을 완성해주는 **마법의 열쇠가 아닙니다.** 오히려 적절한 보안 전략 없이 JWT를 도입하면 공격 표면만 넓어질 수 있습니다. 실무에서는 다음과 같은 마인드셋이 필요합니다.

> **"토큰을 어떻게 저장하고, 어떻게 재발급하며, 어떻게 폐기할 것인가?"**

이러한 질문에 체계적으로 답변할 수 있을 때, 우리는 JWT를 안전하게 사용할 수 있습니다.
