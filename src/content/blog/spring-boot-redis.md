---
title: "Spring Boot 프로젝트에 Redis를 도입하며"
description: "현재 Spring Boot를 기반으로 웹 애플리케이션을 개발하고 있는 학생으로서, 이번 프로젝트를 진행하면서 Redis를 처음으로 도입하게 되었다. 그간 이름만 익숙했을 뿐, 실제로 사용해 본 경험은 없었기에 Redis가 무엇인지, 왜 필요한지, 그리고 Spring"
image: "/images/blog/spring-boot-redis/image-01.png"
pubDate: 2025-04-16
category: "backend"
tags: ["spring", "spring-boot", "redis"]
draft: false
slug: "spring-boot-redis"
---
현재 Spring Boot를 기반으로 웹 애플리케이션을 개발하고 있는 학생으로서, 이번 프로젝트를 진행하면서 **Redis**를 처음으로 도입하게 되었다. 그간 이름만 익숙했을 뿐, 실제로 사용해 본 경험은 없었기에 Redis가 무엇인지, 왜 필요한지, 그리고 Spring Boot에서는 어떻게 사용하는지 등을 정리해보고자 한다.

![Spring Boot 프로젝트에 Redis를 도입하며](/images/blog/spring-boot-redis/image-01.png)

## 1\. Redis란 무엇인가?

**Redis**(REmote DIctionary Server)는 **오픈소스 인메모리 데이터 저장소**로, 주로 **Key-Value 구조의 데이터를 저장**하는 데 사용된다. 일반적인 데이터베이스와는 달리 디스크가 아닌 \*\*메모리(RAM)\*\*를 활용하기 때문에, 매우 빠른 속도로 데이터를 읽고 쓸 수 있다는 것이 가장 큰 특징이다.

또한, 단순한 캐시 역할에 그치지 않고 다음과 같은 다양한 기능도 지원한다.

-   List, Set, Sorted Set, Hash 등의 자료구조 지원
-   데이터 만료 기능 (TTL: Time-To-Live)
-   Pub/Sub 메시징 시스템
-   분산 잠금(Distributed Lock)
-   영속성 옵션 (RDB, AOF)

## 2\. Redis는 왜 사용하는가?

### (1) 속도 향상 (캐싱)

Redis의 가장 일반적인 사용 목적은 **속도 향상**이다. 서버에서 동일한 요청이 반복적으로 들어올 때, 이를 매번 데이터베이스에서 조회하는 것은 비효율적이다. 이때 자주 조회되는 데이터를 Redis에 **캐시**해두면, 빠른 응답 속도를 보장할 수 있다.

### (2) 세션 저장소

HTTP는 본질적으로 상태를 가지지 않기 때문에, 로그인 정보와 같은 사용자 세션은 별도의 저장소에 유지해야 한다. 이때 Redis를 세션 저장소로 활용하면, **분산 서버 환경에서도 세션을 일관되게 유지**할 수 있다.

### (3) 실시간 처리

Redis는 Pub/Sub, 큐 등 실시간성이 중요한 처리에도 적합하다. 예를 들어, 채팅 서비스의 메시지 전달, 실시간 알림, 이벤트 스트리밍 등에서 활용할 수 있다.

## 3\. Spring Boot에서 Redis는 어떻게 활용되는가?

Spring Boot에서는 다음과 같은 주요 영역에서 Redis를 활용할 수 있다.

-   **Spring Cache**를 이용한 캐싱 처리
-   **Spring Session**을 이용한 세션 클러스터링
-   직접 RedisTemplate이나 StringRedisTemplate을 이용한 데이터 처리
-   실시간 메시징 기능 (예: 채팅 서버)

## 4\. Redis 개발 환경 설정

Spring Boot 프로젝트에서 Redis를 사용하기 위해서는 몇 가지 기본 설정이 필요하다.

### (1) Redis 설치 (로컬 테스트용)

로컬에서 Redis를 실행하기 위해 아래와 같은 방법 중 하나를 사용할 수 있다.

#### Windows (WSL 또는 Redis Windows 포트 사용)

```
sudo apt update
sudo apt install redis
sudo service redis-server start
```

#### Docker 사용 시

```bash
docker run --name redis -p 6379:6379 -d redis
```

### (2) Spring Boot 의존성 추가

```
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
implementation 'org.springframework.boot:spring-boot-starter-cache'
```

### (3) application.yml 설정

```yaml
spring:
  redis:
    host: localhost
    port: 6379
  cache:
    type: redis
```

## 5\. 마무리하며

Redis는 처음 사용해보는 입장에서 그 개념이 다소 어렵게 느껴질 수 있으나, 실제로는 매우 직관적인 구조를 가지고 있다. 특히 속도와 실시간성이 중요한 웹 서비스에서는 Redis의 도입이 큰 도움이 된다. 이번 기회를 통해 캐시, 세션 관리, 실시간 처리 등 다양한 분야에서 Redis를 더 깊이 활용해볼 수 있을 것으로 기대된다. 추후 스프링 로그인 프로젝트에 한번 적용해보도록 하겠다.
