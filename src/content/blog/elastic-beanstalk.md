---
title: "엘라스틱 빈스톡(Elastic Beanstalk)이 뭘까"
description: "이번에 AWS를 공부하면서 ECS랑 Elastic Beanstalk에 대해 처음 알게 됐는데요. 이번 글에서는 Elastic Beanstalk에 대해 공부해봤습니다. AWS (Amazon Web Services)는 웹사이트를 배포할 수 있는 다양한 환경을 제공합니다. 하지만"
pubDate: 2025-12-05
tags: []
draft: false
slug: "elastic-beanstalk"
---
이번에 AWS를 공부하면서 ECS랑 Elastic Beanstalk에 대해 처음 알게 됐는데요.

이번 글에서는 Elastic Beanstalk에 대해 공부해봤습니다.

![엘라스틱 빈스톡(Elastic Beanstalk)이 뭘까](/images/blog/elastic-beanstalk/image-01.png)

AWS (Amazon Web Services)는 웹사이트를 배포할 수 있는 다양한 환경을 제공합니다. 하지만 너무 다양해서 처음 접하면 어떤 서비스를 선택해야 할지 혼란스러울 수 있습니다.

개인적으로 느끼기에 EC2가 가장 많이 사용되는 서비스이지만 EC2의 복잡한 설정을 간소화해주는 Elastic Beanstalk이라는 서비스도 존재합니다.

이 글에서는 Elastic Beanstalk의 개념과 배포 방법에 대해 알아보려 합니다. 전문적인 글이라기보다는 초보자의 관점에서 어떻게 배포할 수 있는지에 초점을 맞추었습니다.

## Elastic Beanstalk이란?

**Elastic Beanstalk**은 이름이 다소 낯설게 느껴질 수 있습니다.

-   \*\*"Elastic"\*\*은 확장성과 유연성을 의미합니다
-   \*\*"Beanstalk"\*\*은 식물의 줄기와 잎을 지지하는 구조물을 의미합니다

이름에서 알 수 있듯이, Elastic Beanstalk는 애플리케이션을 지탱하고 성장시키는 기반 구조를 제공하는 **PaaS(Platform as a Service)** 서비스입니다.

### 핵심 특징

개발자가 애플리케이션 코드를 업로드하면 Elastic Beanstalk가 다음을 자동으로 처리합니다.

-   배포(Deployment)
-   프로비저닝(Provisioning)
-   로드 밸런싱(Load Balancing)
-   자동 확장(Auto Scaling)
-   애플리케이션 모니터링
-   운영 체제 업데이트

결과적으로 **개발자는 인프라 관리가 아닌 애플리케이션 개발에만 집중**할 수 있습니다.

## EC2와의 차이점

### EC2 (Elastic Compute Cloud)

-   **IaaS(Infrastructure as a Service)** 서비스
-   가상 서버를 직접 생성하고 관리해야 함
-   인스턴스 생성, 시작, 정지, 삭제 등 모든 작업을 직접 수행
-   세밀한 제어가 가능하지만 관리 부담이 큼
-   서버 설정, 보안 그룹, 네트워크 구성 등을 직접 설정

### Elastic Beanstalk

-   **PaaS(Platform as a Service)** 서비스
-   코드만 업로드하면 AWS가 배포 및 관리를 자동화
-   인프라 설정이 자동으로 완료
-   빠른 배포가 가능하지만 세밀한 제어는 제한적

간단히 말하면 **EC2는 집을 짓기 위한 땅과 자재를 제공**하고 **Elastic Beanstalk는 이미 지어진 집을 제공**하는 것과 같습니다.

## Elastic Beanstalk의 주요 장점

### 1\. 생산성 향상

-   몇 번의 클릭만으로 인프라 환경 생성
-   인프라에 대한 고민 없이 개발에만 집중 가능

### 2\. 자동화된 인프라 관리

-   부하 분산, 모니터링을 AWS가 자동으로 수행
-   운영 체제 업데이트가 자동으로 이루어져 항상 최신 버전 유지

### 3\. 완전한 환경 제공

EC2 인스턴스가 다음과 같이 설정된 상태로 제공됩니다:

-   운영 체제(OS)
-   웹 서버 소프트웨어 (Apache, Nginx 등)
-   애플리케이션 실행 환경

### 4\. 다양한 플랫폼 지원

-   **언어**: Java, .NET, PHP, Node.js, Python, Ruby, Go
-   **컨테이너**: Docker
-   **OS**: Amazon Linux AMI, Windows Server AMI

### 5\. 유연한 구성

-   단일(Single) 인스턴스 구성
-   Multi-AZ 고가용성 구성
-   Auto Scaling을 통한 자동 확장

### 6\. 통합 AWS 서비스

관련 AWS 서비스가 자동으로 설정됩니다:

-   ELB (Elastic Load Balancer)
-   S3 (Simple Storage Service)
-   Auto Scaling 그룹
-   CloudWatch 모니터링

## Java Spring 애플리케이션 배포하기

Spring Boot 애플리케이션을 배포하는 기본 흐름은 다음과 같습니다:

### 1\. 애플리케이션 빌드

bash

./gradlew clean build \*# 또는\* mvn clean package

### 2\. JAR/WAR 파일 생성 확인

-   Spring Boot는 기본적으로 실행 가능한 JAR 파일을 생성합니다
-   build/libs/ 또는 target/ 디렉토리에서 확인

### 3\. Elastic Beanstalk 환경 생성

-   AWS 콘솔에서 Elastic Beanstalk 선택
-   "Create Application" 클릭
-   플랫폼으로 "Java" 선택
-   빌드된 JAR/WAR 파일 업로드

### 4\. 배포 완료

-   AWS가 자동으로 환경을 구성하고 애플리케이션을 배포
-   제공되는 URL로 애플리케이션 접속 가능

## Elastic Beanstalk의 배포 워크플로우

![엘라스틱 빈스톡(Elastic Beanstalk)이 뭘까](/images/blog/elastic-beanstalk/image-02.png)

1.  **코드 업로드**: JAR/WAR 파일 또는 소스 코드를 업로드
2.  **자동 배포**: AWS가 자동으로 환경을 구성하고 애플리케이션을 배포
3.  **모니터링**: 대시보드에서 애플리케이션 상태 확인
4.  **업데이트**: 새 버전 업로드 시 무중단 또는 블루-그린 배포 가능
5.  **자동 관리**: OS 업데이트, 보안 패치 등이 자동으로 적용

## 주의사항

-   기본 설정으로도 충분히 사용 가능하지만 프로덕션 환경에서는 세부 설정 검토 필요
-   비용: Elastic Beanstalk 자체는 무료이지만 사용하는 EC2, S3 등의 리소스에 대한 비용 발생
-   복잡한 커스터마이징이 필요한 경우 EC2를 직접 사용하는 것이 더 적합할 수 있음

## 마치며

Elastic Beanstalk는 인프라 관리 부담 없이 빠르게 애플리케이션을 배포하고 싶은 개발자에게 훌륭한 선택입니다. 특히 Spring Boot 애플리케이션의 경우 빌드된 JAR 파일만 업로드하면 되므로 배포가 매우 간편합니다.

처음에는 다소 낯설 수 있지만 몇 번 사용해보면 그 편리함을 체감할 수 있을 것입니다.

Ref

[https://jibinary.tistory.com/342](https://jibinary.tistory.com/342)

 [\[AWS\] Elastic Beanstalk란? 쉽게 개념 정리 \[Deploy Policy: All at One, Rolling, Immutable, Traffic Splitting\]

◇  공부 기록용으로 작성하였으니 틀린점, 피드백 주시면 감사하겠습니다 ◇   AWS Elastic BeanstalkAWS Elastic Beanstalk는 개발자가 인프라에 대한 고민 없이 애플리케이션의 개발에만 집중하여, 쉽

jibinary.tistory.com](https://jibinary.tistory.com/342)

[https://docs.aws.amazon.com/ko\_kr/elasticbeanstalk/latest/dg/Welcome.html](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/Welcome.html)

 [AWS Elastic Beanstalk란 무엇인가요? - AWS Elastic Beanstalk

이 페이지에 작업이 필요하다는 점을 알려 주셔서 감사합니다. 실망시켜 드려 죄송합니다. 잠깐 시간을 내어 설명서를 향상시킬 수 있는 방법에 대해 말씀해 주십시오.

docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/elasticbeanstalk/latest/dg/Welcome.html)

[https://velog.io/@bcl0206/AWS-Elastic-Beanstalk-배포-방법-DB-연결](https://velog.io/@bcl0206/AWS-Elastic-Beanstalk-배포-방법-DB-연결)

 [AWS Elastic Beanstalk으로 배포하기

IAM 인스턴스? 생성 방법 그 링크키페어 생성방법생활코딩 AWS Elastic Beanstalkhttps://www.youtube.com/watch?v=g7W5LK1DM8o&t=498sDB연동 방법 및 워크벤치 연결 오류 디버깅https://yout

velog.io](https://velog.io/@bcl0206/AWS-Elastic-Beanstalk-배포-방법-DB-연결)
