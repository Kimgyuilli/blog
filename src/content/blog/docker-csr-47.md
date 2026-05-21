---
title: "Docker 환경에서 CSR 프로젝트를 배포하면서 겪은 구조적 고민"
description: "최근에 CSR 기반의 프로젝트를 Docker 환경에서 배포하면서 고민거리를 만났다. 처음엔 명확했다고 생각한 구조가 배포단계에서 복잡함으로 되돌아오면서 리포지토리 구성과 Docker 기반 운영 방식에 대해 다시 한번 생각하게 되었다. 나는 백엔드(Spring Boot) +"
pubDate: 2025-05-03
category: "infra"
tags: ["docker"]
draft: false
slug: "docker-csr-47"
---
최근에 CSR 기반의 프로젝트를 Docker 환경에서 배포하면서 고민거리를 만났다. 처음엔 명확했다고 생각한 구조가 배포단계에서 복잡함으로 되돌아오면서 **리포지토리 구성과 Docker 기반 운영 방식**에 대해 다시 한번 생각하게 되었다.

## 처음 설계한 구조

나는 백엔드(Spring Boot) + 프론트엔드(Vite 기반 React) + PostgreSQL DB를 Docker로 함께 묶어서 실행하고 관리하려고 했다. 그래서 다음과 같은 디렉터리 구조를 잡았다:


Jeonse-ive-INFO는 전체를 통합 관리하는 루트 디렉터리

-   Jeonse-ive-BE: 백엔드 프로젝트
-   Jeonse-ive-FE: 프론트엔드 프로젝트
-   .env, docker-compose.yml, restart.sh: 통합 제어용 설정

그리고 실행 스크립트도 만들었다:

```
#!/bin/bash

case "$1" in
  -f)
    echo "기존 프론트엔드 컨테이너 정리"
    docker rm -f realty-react-app 2>/dev/null || true

    echo "프론트엔드 빌드 및 실행"
    docker compose -p realty-project up --build frontend
    ;;
  -b)
    echo "기존 백엔드 컨테이너 정리 중"
    docker compose rm -sf backend db

    echo "백엔드 빌드 및 실행"
    docker compose up backend db
    ;;
  *)
    echo "기존 전체 컨테이너 정리 중"
    docker compose down -v

    echo "전체 빌드 및 실행"
    docker compose up
    ;;
esac
```

이렇게 하면 FE, BE, DB를 각각 또는 동시에 실행할 수 있어서 편하다고 생각했다.

\---

## 리포지토리 구조의 문제

배포 전까진 괜찮았다. 그런데 막상 **배포를 위한 CI/CD 구성**을 고민하니 몇 가지 문제가 드러났다.

###   현재 리포지토리 구조

-   Info: 전체 관리용 (Docker, 설정 파일 등)
-   FE: 프론트엔드 리포지토리
-   BE: 백엔드 리포지토리

Info에 .gitignore로 FE/, BE/를 제외시켜놓았다. 이유는 **하나의 리포지토리 안에 또 다른 Git 리포지토리가 들어가는 건 추천되지 않기 때문**이다.

이 말은 곧, Info를 clone한 뒤 FE, BE 디렉터리를 각각 한 번 더 clone 해야 한다는 것이다.

> 초기 세팅이 너무 번거롭다.

\---

## 배포 단계에서의 고민

-   FE는 npm run build 후 nginx로 서빙
-   BE는 Spring Boot + PostgreSQL
-   FE, BE, DB는 각각 Docker 컨테이너로 실행

그런데 CI/CD로 배포를 자동화하려 하니 다음과 같은 문제가 생겼다:

-   FE, BE의 Dockerfile은 각 리포지토리에 있고,
-   컨테이너 실행은 Info에 있는 docker-compose.yml이 담당

즉, **리포지토리가 나뉘어 있어 통합 빌드/배포가 어렵다.**

\---

## 그래서 내가 생각한 구조는

### 1번: FE는 정적 파일로 빌드, BE만 Docker 관리

-   👍 배포가 간단해짐
-   👍 CI/CD는 FE와 BE 각각 설정 가능
-   😡  FE와 BE를 함께 실행하거나 통합 관리할 수 없게 된다..?

### 2번: 단일 리포지토리에서 FE, BE 모두 Docker 관리

-   👍 docker-compose.yml 하나로 FE, BE, DB 관리
-   👍 통합 배포가 가능하고 유지보수가 쉬움
-   😡  FE와 BE의 히스토리를 각각 분리해서 관리하긴 어려움..

\---

## 💬 마무리 고민

현재 나는 이 두 가지 옵션 사이에서 고민 중이다. 특히 도커 기반 운영이라면 **배포를 하나의 도커 환경에서 관리하는게 좋을지 백엔드만 도커 환경에서 관리하는게 좋을지**

> **(GPT피셜)개발 초기에는 분리된 구조가 유리하고, 운영 환경에선 통합 구조가 유리하다.**

라고 한다.

근데 진짜 어떡하지..
