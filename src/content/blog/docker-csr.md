---
title: "Docker 기반 CSR 프로젝트, 결국 이렇게 구조 바꿨다"
description: "앞선 글에서 나는 CSR 기반 프로젝트(React + Spring Boot + PostgreSQL)를 Docker로 통합 관리하려다 겪은 시행착오와 고민들을 공유했다. 그때는 Info 리포지토리에서 FE, BE를 서브모듈처럼 두고, 하나의 docker-compose.yml로"
pubDate: 2025-05-20
tags: ["docker"]
draft: false
slug: "docker-csr"
---
앞선 글에서 나는 CSR 기반 프로젝트(React + Spring Boot + PostgreSQL)를 **Docker로 통합 관리**하려다 겪은 시행착오와 고민들을 공유했다. 그때는 Info 리포지토리에서 FE, BE를 서브모듈처럼 두고, 하나의 docker-compose.yml로 전부 제어하려는 구조를 실험 중이었다.

하지만 실제 배포, 특히 **CI/CD 자동화**까지 고려하면서 **생각보다 번거롭고 비효율적인 구조**라는 결론을 내렸다.

그래서 **과감하게 구조를 바꿨다.**

\---

## 바뀐 구조: FE/BE 리포 분리, BE만 Docker 운영

### 구조 요약

-   Jeonse-ive-FE (프론트엔드)
    -   React + Vite
    -   정적 파일로 npm run build 후 S3 + CloudFront 혹은 EC2 + Nginx에 배포
    -   **Docker 사용하지 않음**
-   Jeonse-ive-BE (백엔드)
    -   Spring Boot + PostgreSQL
    -   Docker + docker-compose로 컨테이너화
    -   **Docker로 운영 / 배포 자동화 구성**

### 배포 방식

구성도구

|     |     |
| --- | --- |
| 프론트엔드 | 정적 빌드 → Nginx 서빙 |
| 백엔드 | Docker 이미지 → EC2에서 docker-compose.prod.yml 실행 |
| CI/CD | GitHub Actions → EC2 SSH 접속 + git pull + docker-compose up --build -d |

\---

## 왜 이렇게 바꿨나?

### **0\. 구조에 대한 고민**

가장 먼저 내가 했던 고민의 문제는 한 인스턴스 안에서 BE, FE를 동시에 운영하려고 했던 것이었다. 한 인스턴스에서 둘 다 운영하게 되면 결국 서버에 가는 부하가 늘어 성능에 영향을 주기 때문에 BE, FE를 나누어 배포하는 것이 더 나은 선택이다. 즉 FE, BE를 하나의 도커 파일에서 관리하려 했던 시도 자체가 좋지 않았다.

### 1\. **프론트는 굳이 Docker로 운영하지 않아도 된다**

프론트엔드는 npm run build만 해주면 끝이다. 어차피 정적 파일을 Nginx에서 서빙하면 되기 때문에, Docker로 감싸는 게 오히려 복잡한 과정을 늘릴 뿐이었다. 오히려 Docker 이미지 빌드 → push → pull 과정이 낭비처럼 느껴졌다.

> 프론트는 정적 빌드 결과물만 배포하면 끝!

### 2\. **백엔드는 Docker가 더 유리하다**

Spring Boot는 여러 설정, DB 연결, 의존성 문제 등이 있고, 무엇보다 **환경에 민감하다.** Docker로 감싸서 배포하면 **환경 간 일관성**을 유지할 수 있고, Redis나 PostgreSQL 같은 다른 서비스와 연결도 편하다.

> 백엔드는 Docker로 감싸야 안전하고 관리도 수월함.

### 3\. **리포지토리 단일화보다 유지보수가 더 중요했다**

처음에는 "FE/BE를 하나로 묶으면 관리가 쉽지 않을까?"라고 생각했지만,

-   **CI/CD 분리**
-   **커밋 히스토리 분리**
-   **의존성 완전 분리**

이 점들이 너무 매력적이었다. 특히 GitHub Actions 같은 자동화 구성에서는 FE와 BE가 서로 영향을 주지 않는다는 게 안정성 면에서도 좋았다.

\---

## 지금은 이렇게 한다

-   **BE**는 Jeonse-ive-BE에서만 관리하고,
    -   EC2에 배포되는 .jar는 docker-compose.prod.yml로 감싸서 돌림
    -   CI/CD는 GitHub Actions + SSH로 자동화 완료
-   **FE**는 Jeonse-ive-FE에서 npm run build 후
    -   dist/ 디렉터리만 따로 올려서 Nginx가 서빙하게끔 설정

> FE/BE는 완전히 분리, 각각에 맞는 배포 방식을 선택했다.

\---

## 결론: **분리된 구조가 오히려 운영에 강하다**

개발 초기에는 Docker 하나로 통합해서 관리하는 게 좋아보였지만, 실제 배포와 운영에서는 **FE/BE를 나눠서 각자에 맞는 방식을 택하는 것**이 더 유리했다. 특히 Docker는 만능 도구가 아니다. **정적 파일과는 안 맞을 수 있다.**
