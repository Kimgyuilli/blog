---
title: "Spring WebSocket + Google STT 구조 설계: 실시간 음성 인식 피드백 시스템 만들기 (2)"
description: "이전 글 요약:1편에서는 WebSocket 기반 구조 설계, SttSessionContext, SttSessionManager를 통해사용자 세션을 어떻게 분리하고 안전하게 유지할 수 있는지에 대해 다뤘다. 이번 글에서는 **Google Cloud Speech-to-Text"
pubDate: 2025-07-07
category: "backend"
tags: ["spring"]
draft: false
slug: "spring-websocket-google-stt-2"
---
> **이전 글 요약:**
> 1편에서는 WebSocket 기반 구조 설계, SttSessionContext, SttSessionManager를 통해
> 사용자 세션을 어떻게 분리하고 안전하게 유지할 수 있는지에 대해 다뤘다.

이번 글에서는 \*\*Google Cloud Speech-to-Text API (Streaming)\*\*를
**WebSocket 기반 서비스와 어떻게 연결했는지**,
그리고 **실시간 트랜잭션을 어떻게 안정적으로 처리했는지**에 대해 중점적으로 설명한다.

\---

## 5\. Google STT Streaming API 연동 구조

### ☁️ API 방식 개요

Google STT에는 두 가지 주요 방식이 있다:

방식설명

|     |     |
| --- | --- |
| Recognize | 정적인 음성 파일 전체를 분석 (비동기 파일 업로드에 적합) |
| StreamingRecognize | 실시간 오디오 chunk를 스트리밍하면서 인식 결과를 비동기로 반환 |

> 우리는 실시간 피드백이 필요하므로 **StreamingRecognize API**를 사용한다.

\---

### 🔄 STT 흐름 요약

```
WebSocket BinaryMessage (100ms마다 chunk 수신)
     ↓
StreamingRecognizeRequest.build(audioContent)
     ↓
GoogleStreamingSttClient.requestObserver.onNext()
     ↓
Google 서버로 전송 → 실시간 분석
     ↓
ResponseObserver.onResponse() 호출됨
     ↓
WebSocketSession.sendMessage() → 클라이언트 피드백 전송
```

\---

### 📦 핵심 클래스: GoogleStreamingSttClient

```
@Slf4j
public class GoogleStreamingSttClient {

    private final ResponseObserver<StreamingRecognizeResponse> responseObserver;
    private final ClientStream<StreamingRecognizeRequest> requestObserver;
    private final StreamController controller;

    public void send(byte[] audioChunk) {
        StreamingRecognizeRequest request = StreamingRecognizeRequest.newBuilder()
            .setAudioContent(ByteString.copyFrom(audioChunk))
            .build();
        requestObserver.onNext(request);
    }

    public void close() {
        requestObserver.onCompleted();
        controller.cancel(); // 종료 안전장치
    }
}
```

-   requestObserver: 오디오 chunk 전송용
-   responseObserver: 인식 결과 수신용
-   controller: 중간 중단 및 종료 제어

이 객체는 SttSessionContext 안에 포함되어 세션 단위로 관리된다.

\---

### 👂 ResponseObserver: 응답을 어떻게 수신할 것인가

```
public class GoogleSttResponseObserver implements ResponseObserver<StreamingRecognizeResponse> {

    @Override
    public void onStart(StreamController controller) {
        context.setController(controller);
    }

    @Override
    public void onResponse(StreamingRecognizeResponse response) {
        if (response.getResultsList().isEmpty()) return;

        StreamingRecognitionResult result = response.getResults(0);
        String transcript = result.getAlternatives(0).getTranscript();
        boolean isFinal = result.getIsFinal();

        if (isFinal) {
            // 정확도 분석 + 피드백 생성
            WebSocketSession session = context.getSession();
            session.sendMessage(new TextMessage(...));
        }
    }

    @Override
    public void onError(Throwable t) {
        log.error("STT 오류: {}", t.getMessage());
        session.sendMessage(new TextMessage(errorJson("음성 인식 중 오류가 발생했습니다")));
        session.close();
    }

    @Override
    public void onComplete() {
        // 마지막 피드백, 세션 종료 메시지 전송
    }
}
```

#### ✅ 포인트

-   Google은 여러 번의 중간 결과 + 한 번의 final 결과를 보냄 → isFinal이 핵심
-   우리는 isFinal == true일 때만 분석하고 피드백을 생성
-   session이 닫힌 뒤 응답이 도착할 수 있으므로 예외 안전성 중요

\---

### 🧨 실전에서 만난 이슈

#### 💥 1. 응답 도착 시 세션이 이미 닫힘

-   **증상**: sendMessage() 호출 시 IllegalStateException
-   **원인**: STT 응답이 비동기 스레드에서 오며, 그 순간 WebSocket이 이미 종료됨
-   **해결**:
    -   SttSessionContext.isFinished() 등으로 세션 상태 체크
    -   또는 session.isOpen() 체크 후 메시지 전송

#### 💥 2. 스트림이 끊기고 예외 발생 (UNAVAILABLE)

-   **증상**: StatusRuntimeException: UNAVAILABLE: Channel shutdown invoked
-   **원인**: requestObserver나 controller가 명시적으로 close되지 않음
-   **해결**: finally 블록에서 onCompleted()와 controller.cancel() 명시 호출

\---

### 📊 정리: STT Streaming의 핵심은 상태 흐름을 따라가는 것

```
start() → onResponse() → onResponse() ... → onComplete()
                              ↘ onError() (비정상 종료)
```

이 흐름을 잘 파악하고 WebSocket의 생명주기와 연동하는 것이 가장 중요하다.
구현보다도 **스트림의 생명주기를 언제 시작하고, 언제 종료하며,
중간 결과를 어떻게 다룰 것인지 설계하는 것이 더 어려웠다.

**

## 6\. 전체 메시지 흐름: WebSocket ↔ STT ↔ Client

### 📐 시퀀스 다이어그램

```
Client             WebSocketHandler       GoogleSTTClient         STT Server
  │                       │                      │                     │
  │ ---connect----------> │                      │                     │
  │                       │ --startSession()-->  │                     │
  │                       │                      │ ---streamStart---> │
  │                       │                      │                     │
  │ --send(audioChunk1)-> │                      │                     │
  │                       │ --sendToSTT(chunk)-> │                     │
  │                       │                      │                     │
  │                       │                      │ <---onResponse()---│
  │                       │ <-----STT_RESULT-----│                     │
  │ <---STT_RESULT--------│                      │                     │
  │                       │                      │                     │
  │ --send(audioChunk2)-> │                      │                     │
  │        ...            │          ...         │         ...         │
  │                       │                      │ <---finalResponse--│
  │                       │ <---STT_RESULT(final)│                     │
  │ <---STT_RESULT(final)-│                      │                     │
  │                       │                      │                     │
  │                       │                      │ <----onComplete----│
  │                       │ --send end flag----> │                     │
  │ <---"finished"--------│                      │                     │
  │                       │                      │                     │
```

\---

### 📦 주요 메시지 포맷

1.  **클라이언트 → 서버 (오디오 chunk)**
    -   BinaryMessage (byte\[\])
    -   일정 주기로 전송 (ex. 100ms)
2.  **서버 → 클라이언트 (중간 결과)**

```
{
  "type": "STT_RESULT",
  "isFinal": false,
  "transcript": "안녕하세요 오늘 날",
  "wordAnalysis": [],
  "highlightedHtml": "",
  "finished": false
}
```

**3\. 서버 → 클라이언트 (최종 결과)**

```
{
  "type": "STT_RESULT",
  "isFinal": true,
  "transcript": "안녕하세요 오늘 날시는 맑습니다",
  "wordAnalysis": [...],
  "feedback": "...",
  "finished": false
}
```

**4\. 서버 → 클라이언트 (전체 종료)**

```
{
  "type": "STT_RESULT",
  "isFinal": true,
  "finished": true,
  "sessionId": 123
}
```

\---

## ⚙️ 메시지 트랜잭션 설계 시 고려사항

### 1️⃣ isFinal 플래그

-   Google STT는 여러 번의 중간 결과 (isFinal: false)와
-   마지막에 한 번의 확정 결과 (isFinal: true)를 보낸다.
-   우리는 isFinal: true일 때만 분석과 피드백을 수행한다.

### 2️⃣ finished 플래그

-   한 문장 단위의 분석이 완료되었는지 여부
-   true가 되면 FE는 다음 문장으로 넘어갈 준비를 한다

### 3️⃣ sessionId와 context tracking

-   WebSocket 세션 ID는 서버 내부에서 context 식별용
-   클라이언트에는 STT 분석 세션을 명확히 구분하기 위한 sessionId 별도 제공

\---

## 🧨 트랜잭션 장애 시 대응 전략

상황원인대응 방법

|     |     |     |
| --- | --- | --- |
| onResponse() 도중 WebSocket 끊김 | 클라이언트 종료, 타임아웃 | 세션 존재 여부 확인 후 무시 |
| STT 서버에서 onError() | 네트워크/용량 오류 | 오류 메시지 전송 + 세션 종료 |
| 음성 전송 없음 (무음) | 마이크 이상 or 입력 없음 | 일정 시간 무음시 onComplete() 유도 |

\---

## 📌 요약: 실시간 음성 인식에서 중요한 건 "상태 흐름"이다

WebSocket은 상태 기반이다.
Google STT도 스트림 기반이다.
**두 스트림이 만나면, 상태 흐름이 설계의 핵심이 된다.**

-   chunk가 들어오면 바로 STT로 전달
-   결과는 onResponse()로 비동기 수신
-   isFinal일 때만 분석
-   최종 결과가 도착하면 finished: true로 마무리

## 7\. STT 결과 → 피드백 생성: 분석 알고리즘과 응답 구조 설계

Google STT는 문자열을 돌려줄 뿐이다.
하지만 사용자가 기대하는 것은 **단어별 정확도 피드백, 틀린 부분 강조, 경험치 부여**다.

우리는 onResponse()에서 수신한 transcript와 script를 비교해
클라이언트에게 아래와 같은 피드백 메시지를 실시간으로 전달한다:

```
{
  "type": "STT_RESULT",
  "isFinal": true,
  "transcript": "안녕하세요 오늘 날시는 맑습니다",
  "originalText": "안녕하세요 오늘 날씨는 맑습니다",
  "wordAnalysis": [
    {
      "originalWord": "날씨는",
      "userPronunciation": "날시는",
      "accuracy": 70.0,
      "isCorrect": false
    }
  ],
  "highlightedHtml": "안녕하세요 오늘 <span class='error'>날시는</span> 맑습니다",
  "feedback": "‘날씨’의 발음을 다시 연습해보세요.",
  "expGained": 25,
  "finished": true
}
```

\---

### 📐 문자 매칭 알고리즘: LCS 기반 비교

#### 문제

STT 결과는 완벽하지 않다. 띄어쓰기나 조사, 발음에 따라 단어 순서나 내용이 달라질 수 있다.
우리는 단순한 split(" ") 비교 대신, **Longest Common Subsequence (LCS)** 알고리즘을 적용했다.

```
대본:       안녕하세요 오늘 날씨는 맑습니다
사용자:     안녕하세요 오늘 날시는 맑습니다

→ "안녕하세요", "오늘", "맑습니다" = 일치
→ "날씨는" vs "날시는" = 불일치
```

#### 장점

-   정확한 위치 기반 비교 가능
-   오탈자, 누락, 추가에 유연하게 대응
-   단어별 position 값을 통해 시각적 강조에 활용 가능

\---

### 🔄 전체 구조 요약

```
Google STT 응답 (transcript)
    ↓
LCS 기반 원문 대조
    ↓
WordAnalysis[] + HTML
    ↓
JSON 응답 생성
    ↓
WebSocket 전송
```

\---

### 💬 회고: 피드백은 “보여주는 방식”이 반이다

단순히 "틀렸습니다"라고 알려주는 건 충분하지 않다.
“어디가, 어떻게 틀렸는지”를 시각적으로 알려주고,
“왜 다시 시도해볼 가치가 있는지”를 짧은 문장으로 응원해주는 것이 중요했다.

\---

## 🏁 마무리하며

이제 실시간 음성 인식 시스템이 다음 구조를 갖췄다:

-   **WebSocket 세션 관리**
-   **Google STT 실시간 연동**
-   **트랜잭션 흐름 설계**
-   **정확도 기반 피드백 응답 생성**

이 시스템은 나중에 다음과 같은 방향으로 확장할 수 있다:

-   WebRTC 기반 브라우저 오디오 송출 (MediaStream → WebSocket)
-   TTS 연동으로 대본 읽어주기
-   LLM 기반 맞춤 피드백 생성
