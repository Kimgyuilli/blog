---
title: "소셜 로그인 OAuth 플로우를 이해해보자"
description: "현재의 소셜 로그인의 대부분은 OAuth2.0 인증 방식을 기반으로 동작한다 OAuth는 유저가 다른 서비스에 내 비밀번호를 주지 않고 다른 곳이 이미 있는 자신에 정보에 대해 그 사이트가 접근할 수 있도록 허용하는 절차이다. OAuth2.0 인증 방식은 위와 같은 흐름을"
image: "/images/blog/oauth/image-01.png"
pubDate: 2025-03-22
category: "backend"
tags: []
draft: false
slug: "oauth"
---
현재의 소셜 로그인의 대부분은 OAuth2.0 인증 방식을 기반으로 동작한다

OAuth는 유저가 다른 서비스에 내 비밀번호를 주지 않고 다른 곳이 이미 있는 자신에 정보에 대해 그 사이트가 접근할 수 있도록 허용하는 절차이다.

![소셜 로그인 OAuth 플로우를 이해해보자](/images/blog/oauth/image-01.png)

OAuth2.0 인증 방식은 위와 같은 흐름을 가졌는데

간단하게 4개의 롤과 6개의 절차로 이루어져있다.

4개의 롤은 다음과 같은데

\- 리소스 오너(유저)

\- 리소스 서버

\- 인가 서버

\- 클라이언트 (어플리케이션)

현실적으로는 OAuthProvider 라는 플레이어가 리소스서버와 인가 서버의 역할을 동시에 하기도 한다.

예를 들어서 유저(리소스 오너)가 자신의 정보를 사이트(로그인 하려는 사이트)에 직접 제공하지 않고 다른 곳(Resource Server, ex) Google)에 이미 저장돼있는 자신의 정보에 대해 그 사이트가 접근할 수 있게 허용하는 절차를 거치는 것이다.

## **6개의 절차**

### **1\. Auth Request**

![소셜 로그인 OAuth 플로우를 이해해보자](/images/blog/oauth/image-02.png)

유저가 애플리게이션에서 네이버로 로그인 버튼을 누르면 인가 절차가 시작되게 된다.

이때 애플리케이션은 유저를 OAuth Provider(Naver)의 인증 페이지로 Client ID, Redirect URL, 권한 요청 범위와 같은 정보를 전송하며 랜딩시킨다.

### **2\. Auth Grant**

![소셜 로그인 OAuth 플로우를 이해해보자](/images/blog/oauth/image-03.png)

유저는 인증 페이지에서 로그인 한 후 인가 페이지에서 애플리케이션이 요청한 권한을 확인하고 승인한다.

승인시 OAuth Provider(Naver) 는 인가 코드를 발급하여 어플리케이션의 Redirect URL로 보낸다. 

### **3\. Access Token 요청**

발급받은 인가코드는 Access Token을 얻기 위한 일회성 코드이다. 이제 인가코드를 이용해 OAuth Provider(Naver)에게  Access Token을 요청하게 된다.

### **4\. Access Token 발급**

OAuth Provider(Naver)는 요청을 검증한 후 리소스 서버에 접근할 때 사용되는 Access Token을 발급한다.
이때 Refresh Token이 같이 발급되기도 하는데 Refresh Token은 일반적으로 유효기간이 짧은 Access Token이 만료됐을 때 새로운 토큰을 받기 위해 사용되는 Token이다.

### **5\. Access Token으로 리소스 요청**

![소셜 로그인 OAuth 플로우를 이해해보자](/images/blog/oauth/image-04.png)

### **6\. 리소스 제공**

Access Token이 유효하다면 Resource Server(NAVER)는 요청된 데이터를 제공한다.

이렇게 4개의 롤과 6개의 절차를 통해 소셜 로그인 인증을 마치게 된다.
