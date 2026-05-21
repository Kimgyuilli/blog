---
title: "[Spring] MVC와 REST API 차이"
description: "MVC와 REST API에 대해 알아보려고 한다. 개념 공통점 1. 역할 분리 (Separation of Concerns) 두 아키텍처 모두 기능별로 역할을 나누어 구조화한다. 2. 클라이언트-서버 구조 MVC든 REST API든 기본적으로 클라이언트-서버 구조이다. 3."
pubDate: 2025-04-05
category: "backend"
tags: ["spring"]
draft: false
slug: "spring-mvc-rest-api"
---
MVC와 REST API에 대해 알아보려고 한다.

**개념**

-   **REST API**: REST는 웹 아키텍처 스타일 중 하나로 리소스를 나타내는 URI(Uniform Resource Identifier)에 HTTP 메서드(GET, POST, PUT, DELETE 등)를 사용하여 상태를 전송하고 조작하는 웹 서비스 디자인 원칙이다. REST API는 이러한 RESTful 웹 서비스의 인터페이스를 제공하는 것이 목적이다.
-   **Spring MVC**: Spring MVC는 Java 기반의 웹 애플리케이션을 개발하기 위한 프레임워크로 Model-View-Controller 아키텍처 패턴을 기반으로 한다. 웹 애플리케이션을 개발할 때 사용되며, HTTP 요청을 처리하고 응답을 생성하는 데 중점을 둔다.

**공통점**

**1\. 역할 분리 (Separation of Concerns)**

두 아키텍처 모두 **기능별로 역할을 나누어** 구조화한다.

-   MVC는 **Model(데이터), View(화면), Controller(비즈니스 로직)**로 나뉜다.
-   REST API는 **리소스, URI, HTTP 메서드**로 역할을 나눠 각 구성 요소가 하나의 책임만 갖도록 하여 유지보수성과 확장성을 높여준다.

**2\. 클라이언트-서버 구조**

MVC든 REST API든 기본적으로 **클라이언트-서버 구조**이다.

-   클라이언트는 데이터를 요청하고, 서버는 이를 처리해 응답을 준다.
-   덕분에 웹, 모바일, 데스크톱 등 다양한 플랫폼과 연동이 가능하다.

**3\. HTTP 기반 통신**

둘 다 **HTTP 요청과 응답**을 기반으로 동작한다.

-   MVC에서도 사용자가 브라우저에서 요청을 보내고 HTML 응답을 받는다.
-   REST API는 주로 JSON 형식의 데이터를 주고받지만 기본 구조는 같다.

**4\. 재사용성과 확장성**

각각의 컴포넌트가 분리되어 있으므로 **유지보수와 테스트가 쉽고** 기능 추가나 수정도 유연하게 할 수 있다.

**아키텍처**

-   **REST API**: RESTful 서비스의 아키텍처는 자원(Resource), 표현(Representation), 상태(State), 그리고 행위(Verbs)로 구성된다. 자원은 고유한 URI로 식별되며 HTTP 메서드를 사용하여 조작된다.
-   **Spring MVC**: Spring MVC는 전통적인 웹 애플리케이션의 아키텍처를 따르며 모델(Model), 뷰(View), 컨트롤러(Controller)로 구성된 MVC 패턴을 사용다.

차이점

|     |     |     |
| --- | --- | --- |
| 항목  | MVC | REST API |
| 목적  | 웹 페이지 렌더링 (HTML 반환) | 데이터 제공 (JSON 반환) |
| View 역할 | 직접 HTML View 생성 | View가 없음 (프론트에서 처리) |
| 사용 대상 | 서버 렌더링 웹앱 | 프론트엔드 앱, 모바일 앱, 외부 시스템 |
| URI 설계 | 기능 중심 (예: /createUser) | 리소스 중심 (예: /users) |
| HTTP 메서드 | 보통 GET과 POST 사용 | GET, POST, PUT, DELETE 등 다양하게 사용 |
| 상태관리 | 세션, 쿠키를 활용하는 경우 많음 | 일반적으로 Stateless (상태 저장하지 않음) |

사용하는 방식의 차이도 구분해보자면

#### **Controller - Data (****Spring 3.x MVC Restful Web Service Work Flow)**

Spring MVC 컨트롤러도 Data를 반환해야 하는 경우도 있다. 이럴 땐 **@ResponseBody 어노테이션을 활용**하여 Controller도 JSON 형태로 데이터를 반환할 수 있다.

![[Spring] MVC와 REST API 차이](/images/blog/spring-mvc-rest-api/image-01.png)

1\. Client는 URI로 웹 서비스에 요청

2\. Mapping되는 Handler와 그 Type을 DispatcherServlet이 요청 인터셉트

3\. @ResponseBody 어노테이션을 사용하여 Client에게 JSON 형태로 데이터 반환

### **@RestController (Spring 4.x MVC Restful Web Service Work Flow)**

Json 형태로 객체 데이터를 반환, **RestController = Spring MVC Controller + @ResponseBody**

![[Spring] MVC와 REST API 차이](/images/blog/spring-mvc-rest-api/image-02.png)

1\. Client는 URI로 웹 서비스에 요청

2\. Mapping되는 Handler와 그 Type을 찾는 DispatcherServlet이 요청 인터셉트

3\. RestController는 해당 요청을 처리하여 데이터 반환

**Reperance**

[https://diddl.tistory.com/m/74](https://diddl.tistory.com/m/74)

 [\[Spring\] @Controller와 @RestController 차이점

스프링에서 컨트롤러로 지정해주기 위한 어노테이션에는 @Controller와 @RestController가 있다. 전통적인 Spring MVC의 컨트롤러인 @Controller와 Restful 웹 서비스의 컨트롤러인 @RestController의 주요 차이점은

diddl.tistory.com](https://diddl.tistory.com/m/74)

아직은 구조가 좀 어렵지만 사용하다보면 익숙해지겠지!
