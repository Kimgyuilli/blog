---
title: "Spring WebSocket + Google STT 구조 설계: 실시간 음성 인식 피드백 시스템 만들기 (1)"
description: "실시간 음성 인식 서비스를 만든다고 했을 때, 가장 먼저 떠오르는 건 \"STT API\"일지도 모른다.하지만 정말 중요한 건 API를 언제 어떻게 호출하고,사용자 음성을 실시간으로 전달하고,그 결과를 사용자에게 다시 어떻게 돌려주는가 하는 데이터 흐름의 구조다. 이 글은 내가"
pubDate: 2025-07-07
tags: ["spring"]
draft: false
slug: "spring-websocket-google-stt-1"
---
### 1\. 들어가며

**실시간 음성 인식 서비스**를 만든다고 했을 때, 가장 먼저 떠오르는 건 "STT API"일지도 모른다.
하지만 정말 중요한 건 **API를 언제 어떻게 호출하고**,
**사용자 음성을 실시간으로 전달하고**,
**그 결과를 사용자에게 다시 어떻게 돌려주는가** 하는 **데이터 흐름의 구조**다.

이 글은 내가 발음 교정 서비스 SpeekSee에서
**Google Streaming STT API를 Spring WebSocket으로 연결**하면서
설계한 구조를 정리한 것이다.

특히 **WebSocket 세션 관리**, **STT 비동기 응답 처리**, **세션 context 구조화**,
그리고 실제 서비스에서 발생할 수 있는 **문제 해결 전략**까지 기록해두었다.

나중에 비슷한 시스템을 다시 만들거나 확장할 때,
**스스로에게 명확한 레퍼런스를 남기기 위한 글**이기도 하다.


## 2\. 전체 구조 개요: WebSocket + Google STT Streaming 연동 흐름

### 🧩 기본 아이디어

사용자의 음성을 실시간으로 인식하려면,

1.  **클라이언트가 오디오 스트림을 서버에 전송하고**,
2.  서버는 이를 **Google STT의 스트리밍 API**로 전달한 뒤,
3.  **실시간 인식 결과**를 다시 클라이언트에게 **WebSocket으로 전송**해야 한다.

이건 단순한 API 호출이 아니라,
**상태가 유지되는 양방향 데이터 흐름 구조**가 필요하다는 뜻이다.

\---

### 🔄 전체 흐름도

```
[Client Mic Input]
      ↓
[WebSocket 연결 (STT 전용)]
      ↓
[Spring WebSocket Server]
 ┌────────────────────────────┐
 │ SttSessionContext (세션별) │
 └────────────────────────────┘
      ↓
[Google STT Streaming API (gRPC)]
      ↓
[비동기 응답 수신 (ResponseObserver)]
      ↓
[WebSocketSession.sendMessage()]
      ↓
[Client 실시간 피드백 렌더링]
```

\---

### 📦 각 구성요소 설명

구성 요소설명

|     |     |
| --- | --- |
| WebSocketSession | 사용자의 브라우저에서 연결된 WebSocket 객체. 음성 chunk 수신 및 피드백 전송 담당 |
| SttSessionContext | 사용자별 세션 상태를 담는 객체. scriptId, memberId, streamController 등을 포함 |
| GoogleStreamingSttClient | Google Cloud Speech-to-Text API와의 스트리밍 통신을 담당하는 클래스 |
| ResponseObserver | STT 결과를 비동기로 수신하여, WebSocketSession에 전송하는 콜백 객체 |
| SttSessionManager | 전체 WebSocket 세션을 관리하는 매니저. 세션 생성/조회/삭제 책임 |

\---

### 💬 구조 설계 시 고려했던 점

-   WebSocket은 상태 기반 → **사용자별 context 분리** 필수
-   Google STT API는 비동기 → **응답과 WebSocket 간 스레드 동기화 고려**
-   예외/오류 상황에서 **Stream 및 세션 정리 필요**
-   동시에 여러 사용자가 접속할 수 있으므로 **동시성 안전성** 확보 (e.g. ConcurrentHashMap)

\---

### 🔐 인증은 어떻게?

WebSocket은 기본적으로 HTTP 필터를 타지 않기 때문에,
**Sec-WebSocket-Protocol 헤더**를 사용해 JWT 토큰을 전달하고,
HandshakeInterceptor에서 직접 토큰을 검증한다.

java

복사편집

String jwt \= request.getHeader("Sec-WebSocket-Protocol"); // 검증 후 사용자 정보 세션 context에 저장

이 방식은 **WebSocket 표준을 지키면서도 보안을 유지**할 수 있는 방법이다


## 3\. WebSocket 서버 구성 및 주요 클래스 설계

Spring Boot에서 WebSocket 서버를 구성하는 일 자체는 어렵지 않다.
중요한 건 **“단순한 연결”이 아닌**,
**실시간 STT를 위한 세션 관리, 인증, 에러 복구 등을 설계하는 것**이다.

\---

### 🧱 구성 클래스 개요

```
com._ithon.speeksee.domain.voicefeedback.streaming
├── controller
│   └── VoiceFeedbackWebSocketHandler.java       ← WebSocket 진입점
├── infra.session
│   └── SttSessionManager.java                   ← 세션 등록/삭제/조회 관리
├── model
│   └── SttSessionContext.java                   ← 사용자별 세션 상태 (context) 저장
├── infra
│   └── GoogleStreamingSttClient.java            ← Google STT 연결 및 스트리밍 처리
│   └── GoogleSttResponseObserver.java           ← STT 결과 수신 및 피드백 전송
```

\---

### 1️⃣ VoiceFeedbackWebSocketHandler

Spring WebSocket에서 TextWebSocketHandler 혹은 BinaryWebSocketHandler를 상속받아 사용한다.
우리는 실시간 오디오 스트림을 처리해야 하므로 **BinaryMessage 기반 처리**가 필요했다.

```
public class VoiceFeedbackWebSocketHandler extends BinaryWebSocketHandler {
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        // 세션 context 생성 및 STT stream 시작
    }

    @Override
    public void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        // 수신된 음성 chunk → Google STT API로 전송
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // 세션 및 stream 정리
    }
}
```

이 핸들러는 실제 오디오 스트림과 Google STT API를 연결하는 **관문(Gateway)** 역할을 한다.

\---

### 2️⃣ SttSessionContext

사용자마다 서로 다른 script를 읽고, 다른 타이밍에 말하며, 다른 세션 상태를 가진다.
따라서 아래와 같은 정보들을 담는 Context 객체를 따로 관리해야 했다:

```
public class SttSessionContext {
    private final Long memberId;
    private final Long scriptId;
    private final WebSocketSession session;
    private final GoogleStreamingSttClient sttClient;
    private StreamController streamController;
    private boolean finished;
    ...
}
```

> ✅ 이 context는 WebSocketSession ID를 기준으로 SttSessionManager가 관리한다.

\---

### 3️⃣ SttSessionManager

모든 WebSocket 연결을 추적하고 관리하는 중앙 관리자.

```
@Component
public class SttSessionManager {
    private final Map<String, SttSessionContext> sessionMap = new ConcurrentHashMap<>();

    public SttSessionContext startSession(WebSocketSession session, Long memberId, Long scriptId) {
        ...
    }

    public void removeSession(WebSocketSession session) {
        ...
    }

    public SttSessionContext getSession(WebSocketSession session) {
        ...
    }
}
```

이 구조는 세 가지 중요한 문제를 해결한다:

-   **여러 사용자 동시 접속** → ConcurrentHashMap 기반 격리
-   **세션 유실 or 연결 종료** → afterConnectionClosed에서 안전 정리
-   **Context 불일치 문제** → WebSocketSession ID 기반 식별

\---

### 4️⃣ GoogleStreamingSttClient & GoogleSttResponseObserver

-   GoogleStreamingSttClient: Google Cloud의 StreamingRecognizeRequest를 보내는 역할
-   GoogleSttResponseObserver: Google에서 보내주는 인식 결과(STT)를 받아 FE에 보내는 역할

```
class GoogleSttResponseObserver implements ResponseObserver<StreamingRecognizeResponse> {
    @Override
    public void onResponse(StreamingRecognizeResponse response) {
        // transcript → 분석 → 피드백 전송
    }

    @Override
    public void onError(Throwable t) {
        // WebSocket 오류 메시지 전송, 세션 종료
    }

    @Override
    public void onComplete() {
        // 학습 종료 알림 전송
    }
}
```

> 🔒 이 두 클래스는 STT와 WebSocket을 **느슨하게 분리**해, 테스트와 디버깅을 용이하게 만든다.

## 4\. 세션 관리의 핵심 – SttSessionContext와 SttSessionManager 설계 원칙

WebSocket은 본질적으로 **상태가 있는 프로토콜**이다.
STT 스트리밍처럼 사용자의 컨텍스트를 유지해야 하는 기능에서는
**세션별로 정확한 상태를 보존하고, 동시에 충돌 없이 처리**하는 게 핵심 과제였다.

\---

### 🎯 목표

-   사용자마다 독립적인 세션 컨텍스트 유지
-   중복 연결 방지 및 세션 중복 사용 방지
-   세션 종료 시 리소스 누수 없이 정리
-   Google STT와의 연결 상태를 WebSocket 세션과 동기화

\---

### 🧱 SttSessionContext: 세션의 모든 상태를 캡슐화

```
public class SttSessionContext {
    private final Long memberId;
    private final Long scriptId;
    private final WebSocketSession session;
    private final GoogleStreamingSttClient sttClient;
    private final Long sessionStartTime;
    private StreamController streamController;
    private boolean finished;

    // 기타 분석 상태들, 타이밍 정보 등
}
```

#### 🔑 설계 원칙

원칙설명

|     |     |
| --- | --- |
| 단일 책임 | STT 한 세션의 상태를 추상화 (scriptId, memberId, 진행상태 등) |
| 쓰레드 안정성 | streamController나 finished는 동시 접근 고려해 volatile 또는 동기화 필요 |
| 외부 의존 최소화 | 오직 하나의 WebSocketSession과 하나의 GoogleStreamingSttClient만 포함 |

\---

### 📦 SttSessionManager: 모든 세션의 생명주기 총괄

```
@Component
public class SttSessionManager {
    private final Map<String, SttSessionContext> sessionMap = new ConcurrentHashMap<>();

    public SttSessionContext startSession(WebSocketSession session, Long memberId, Long scriptId) {
        // 세션 중복 여부 확인
        // context 생성 및 등록
    }

    public void removeSession(WebSocketSession session) {
        // streamController 정리 + context 제거
    }

    public Optional<SttSessionContext> getSession(WebSocketSession session) {
        return Optional.ofNullable(sessionMap.get(session.getId()));
    }
}
```

#### ✅ 유의한 구현 디테일

-   ConcurrentHashMap으로 동시성 제어
-   세션 ID는 session.getId() 기준
-   Google STT 연결 종료 시 → removeSession() 내부에서 onComplete() 또는 onError() 호출
-   비정상 종료 감지: afterConnectionClosed 또는 WebSocketHandlerDecorator 활용 가능

\---

### 🧨 트러블슈팅: 세션 충돌 / 중복 문제

#### 사례 1. 브라우저 새로고침 시 세션 중복

-   **증상**: 이전 세션이 정리되지 않아 stream already open 오류 발생
-   **해결**: afterConnectionClosed()에서 removeSession() 강제 호출

#### 사례 2. 응답 스레드에서 session.sendMessage() 시 예외

-   **증상**: IllegalStateException: TextMessage is not allowed in this state
-   **원인**: Google STT 응답이 비동기 스레드에서 발생 → WebSocketSession이 이미 닫힘
-   **해결**: SttSessionContext에 finished 플래그 추가 → 상태 체크 후 전송 시도

\---

### 🧠 회고

이 구조는 마치 “**WebSocket 기반 STT 세션 가상머신**”을 하나씩 띄우는 것과 같다.
세션 하나는 음성 데이터를 Google STT로 중계하고, 결과를 클라이언트로 리턴하며,
정해진 흐름 안에서 시작되고 종료되어야 한다.

결국 핵심은 \*\*상태 관리(State Management)\*\*였다.
**언제 시작하고, 언제 종료되며, 언제 예외로 종료되는지를 명확하게 설계**해야만
실시간 STT 시스템은 안정적으로 동작할 수 있다.
