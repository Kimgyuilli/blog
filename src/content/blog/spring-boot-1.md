---
title: "Spring Boot로 로그인을 구현해보기 1"
description: "스프링 공부를 시작한지 어언 1달 지금 나는 그동안 따로 유튜브 강의를 보거나 선배님들의 대면 세션 및 과제를 수행하면서 자신감과 스프링에 대한 애정이 오를대로 오른 상태이다. 그래서 이번에 스프링 프로젝트의 첫 걸음으로 스프링 로그인 기능을 만들어보기로 했다. 그 여정을"
pubDate: 2025-04-16
tags: ["spring", "spring-boot"]
draft: false
slug: "spring-boot-1"
---
스프링 공부를 시작한지 어언 1달

지금 나는 그동안 따로 유튜브 강의를 보거나 선배님들의 대면 세션 및 과제를 수행하면서 자신감과 스프링에 대한 애정이 오를대로 오른 상태이다.

그래서 이번에 스프링 프로젝트의 첫 걸음으로 스프링 로그인 기능을 만들어보기로 했다.

그 여정을 기록할 repository이다

[https://github.com/Kimgyuilli/Spring\_login](https://github.com/Kimgyuilli/Spring_login)

 [GitHub - Kimgyuilli/Spring\_login: 스프링으로 로그인 기능 고도화 해보기

스프링으로 로그인 기능 고도화 해보기. Contribute to Kimgyuilli/Spring\_login development by creating an account on GitHub.

github.com](https://github.com/Kimgyuilli/Spring_login)

먼저 이 프로젝트의 기능적 목표와 구조적 목표를 정했다.

기능적 목표

1\. email or 전화번호 기반 카톡 인증 구현

2\. 소셜로그인(naver, google, kakao) 구현

기술적 목표

1\. ddd 원칙에 맞는 코드 구조 유지하기

2\. redis 사용

3\. doker 써보기

4\. jwt 써보기

프로젝트의 시작은 코딩레시피 유튜브 회원 프로젝트 완성본이다.

[https://www.youtube.com/watch?v=RhM1bQ76Tv0&list=PLV9zd3otBRt5ANIjawvd-el3QU594wyx7](https://www.youtube.com/watch?v=RhM1bQ76Tv0&list=PLV9zd3otBRt5ANIjawvd-el3QU594wyx7)

오늘 한 것은 프로젝트 리팩토링이다.

-   디렉터리 구조 변경(Home, login, 공용 로직)
-   DTO request, resopnse 별로 분리
-   커스텀 예외처리 전역으로 분리
-   validation 적용

이것들을 하는데도 하루종일이 걸렸다..

다음 목표는 이걸 redis를 사용하는 프로젝트로 만들기!

4월은 그나마 내가 시간이 좀 남는 기간이니까 알차게 보내보자
