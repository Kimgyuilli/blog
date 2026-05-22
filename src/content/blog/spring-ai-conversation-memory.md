---
title: "Spring AI로 멀티 턴 대화(Conversation Memory) 구현하기"
description: "이 프로젝트는 Spring AI를 학습하기 위한 프로젝트다. 고객센터 같은 상황에서 문서 기반으로 질문에 답변하면서, 동시에 이전 대화 맥락도 이어갈 수 있는 챗봇을 만드는 것이 목표다. 즉, 멀티 턴 대화와 RAG 기능을 모두 갖춘 프로그램을 완성하는 것이다. 이전 글에서"
image: "/images/blog/spring-ai-conversation-memory/image-01.png"
pubDate: 2026-02-22
category: "ai"
tags: ["spring"]
draft: false
slug: "spring-ai-conversation-memory"
---
![Spring AI로 멀티 턴 대화(Conversation Memory) 구현하기](/images/blog/spring-ai-conversation-memory/image-01.png)

## 들어가며

이 프로젝트는 Spring AI를 학습하기 위한 프로젝트다. 고객센터 같은 상황에서 문서 기반으로 질문에 답변하면서, 동시에 이전 대화 맥락도 이어갈 수 있는 챗봇을 만드는 것이 목표다. 즉, **멀티 턴 대화**와 **RAG** 기능을 모두 갖춘 프로그램을 완성하는 것이다.

이전 글에서 RAG 기능까지 구현했지만, 한 가지 아쉬운 점이 있었다. "아까 말한 거 자세히 알려줘" 같은 **맥락을 이어가는 대화가 불가능**하다는 것이다. 매 요청이 독립적(stateless)이기 때문이다.

이 글에서는 Spring AI의 `MessageChatMemoryAdvisor`를 활용해 세션 기반 대화 이력을 관리하는 과정과, 그 과정에서 겪은 삽질들을 정리한다.

\---

## 목표

-   같은 세션 내에서 이전 대화 내용을 기억
-   문서 컨텍스트(RAG)와 대화 이력을 **동시에** 활용하여 답변
-   세션(탭)이 다르면 별도 대화로 분리

## 기술 스택

-   Java 21, Spring Boot 3.5, Spring AI 1.1.2
-   PostgreSQL + pgvector (RAG용 벡터 저장소)
-   OpenAI API

\---

## 구현

### 1\. ChatMemory 빈 등록

Spring AI는 `ChatMemory` 인터페이스로 대화 이력을 추상화한다. `MessageWindowChatMemory`는 최근 N개 메시지만 유지하는 슬라이딩 윈도우 방식이다.

```java
@Bean
ChatMemory chatMemory() {
    return MessageWindowChatMemory.builder()
            .chatMemoryRepository(new InMemoryChatMemoryRepository())
            .maxMessages(20)
            .build();
}
```

`InMemoryChatMemoryRepository`를 사용하므로 서버 재시작 시 이력이 초기화된다. 영속화가 필요하면 `JdbcChatMemoryRepository` 등으로 교체하면 된다.

### 2\. ChatClient에 Advisor 등록

핵심은 `MessageChatMemoryAdvisor`와 `QuestionAnswerAdvisor`를 **ChatClient의 defaultAdvisors로 함께 등록**하는 것이다.

```java
@Bean
ChatClient chatClient(ChatClient.Builder builder, ChatMemory chatMemory, VectorStore vectorStore) {
    return builder
            .defaultSystem(SYSTEM_PROMPT)
            .defaultAdvisors(
                    MessageChatMemoryAdvisor.builder(chatMemory).build(),
                    QuestionAnswerAdvisor.builder(vectorStore)
                            .searchRequest(SearchRequest.builder().topK(5).build())
                            .build())
            .build();
}
```

### 3\. ChatService에서 conversationId 전달

호출 시 `ChatMemory.CONVERSATION_ID` 파라미터로 세션별 이력을 구분한다.

```java
public String ask(String question, String conversationId) {
    return chatClient.prompt()
            .user(question)
            .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
            .call()
            .content();
}
```

### 4\. Controller에서 conversationId 관리

요청에 `conversationId`가 없으면 서버에서 UUID를 생성하고, 응답에 포함시킨다.

```java
record ChatRequest(@NotBlank String question, String conversationId) {}
record ChatResponse(String answer, String conversationId) {}

@PostMapping
ChatResponse chat(@Valid @RequestBody ChatRequest request) {
    String conversationId = (request.conversationId() != null && !request.conversationId().isBlank())
            ? request.conversationId()
            : UUID.randomUUID().toString();
    return new ChatResponse(chatService.ask(request.question(), conversationId), conversationId);
}
```

스트림 응답의 경우, SSE 마지막에 `conversationId` 이벤트를 별도로 전송한다.

```java
@PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<ServerSentEvent<String>> chatStream(@Valid @RequestBody ChatRequest request) {
    String conversationId = resolveConversationId(request.conversationId());
    return chatService.askStream(request.question(), conversationId)
            .map(token -> ServerSentEvent.builder(token).build())
            .concatWith(Flux.just(ServerSentEvent.<String>builder()
                    .event("conversationId")
                    .data(conversationId)
                    .build()));
}
```

## 트러블슈팅

### 문제 1: Advisor를 per-request로 추가하면 Memory가 동작하지 않는다

처음에는 `MessageChatMemoryAdvisor`와 `QuestionAnswerAdvisor`를 ChatService에서 요청마다 생성해서 넘겼다.

```java
// 이렇게 하면 Memory가 동작하지 않았다
chatClient.prompt()
        .user(question)
        .advisors(
                MessageChatMemoryAdvisor.builder(chatMemory).build(),
                QuestionAnswerAdvisor.builder(vectorStore)...build())
        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
        .call()
        .content();
```

`.advisors(Advisor...)` 호출과 `.advisors(Consumer<AdvisorSpec>)` 호출을 함께 사용할 때, param이 Advisor에 제대로 전달되지 않는 것으로 보였다.

**단독 테스트로 원인 분리:**

-   `MessageChatMemoryAdvisor`만 사용 → 이름 기억 성공
-   `QuestionAnswerAdvisor`를 함께 추가 → 이름 기억 실패

**해결:** 두 Advisor를 모두 ChatClient의 `defaultAdvisors`로 등록하고, 호출 시에는 `param`만 전달한다.

```java
// AiConfig에서 defaultAdvisors로 등록
ChatClient chatClient = builder
        .defaultAdvisors(
                MessageChatMemoryAdvisor.builder(chatMemory).build(),
                QuestionAnswerAdvisor.builder(vectorStore)...build())
        .build();

// 호출 시에는 param만 전달
chatClient.prompt()
        .user(question)
        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
        .call()
        .content();
```

### 문제 2: 이름을 기억하면서도 "정보를 찾을 수 없습니다"라고 답한다

Memory 문제를 해결한 뒤, 이상한 현상이 발생했다.

```java
사용자: Hello, my name is John.
챗봇: 안녕하세요, John님. (정상)

사용자: What is my name?
챗봇: 죄송합니다, John님. 해당 내용에 대한 정보를 찾을 수 없습니다.
```

"John님"이라고 부르면서 "정보를 찾을 수 없습니다"? 대화 이력에서 이름을 가져왔지만, RAG 문서에 "이름"에 관한 내용이 없으니 시스템 프롬프트의 안내 멘트가 발동된 것이다.

기존 시스템 프롬프트는 이랬다:

```
2. 제공된 컨텍스트 정보를 기반으로 정확하게 답변하세요.
3. 컨텍스트에 관련 정보가 없으면 "해당 내용에 대한 정보를 찾을 수 없습니다..."
```

"컨텍스트"가 RAG 문서만을 의미하다 보니, 대화 이력에 답이 있어도 무조건 "정보 없음" 처리가 된다.

**해결:** 시스템 프롬프트에 **대화 이력도 답변 소스**임을 명시하고, 대화 이력만으로 답할 수 있으면 문서 없이도 답변하라고 지시한다.

```java
2. 답변 시 다음 두 가지를 모두 활용하세요:
   - 이전 대화 내용 (사용자가 언급한 이름, 요청 사항 등)
   - 제공된 문서 컨텍스트 (상품, 정책 등 참고 자료)
3. 이전 대화 내용만으로 답변할 수 있으면 문서 컨텍스트 없이도 답변하세요.
4. 이전 대화에도 문서 컨텍스트에도 관련 정보가 없을 때만 "해당 내용에 대한 정보를 찾을 수 없습니다..."
```

\---

## 최종 검증

| 테스트 | 결과  |
| --- | --- |
| 같은 세션에서 이름 기억 | "귀하의 이름은 John입니다" |
| RAG 문서 참조 | 환불 정책 정상 답변 |
| 다른 세션에서 이름 질문 | "정보를 찾을 수 없습니다" (세션 분리) |
| follow-up 질문 | 이전 대화 맥락을 이어서 답변 |

\---

## 정리

-   Spring AI의 `MessageChatMemoryAdvisor`는 대화 이력을 메시지 목록으로 주입해주는 Advisor다.
-   `QuestionAnswerAdvisor`(RAG)와 함께 쓸 때는 **둘 다 `defaultAdvisors`로 등록**해야 안정적으로 동작한다.
-   시스템 프롬프트가 "문서 기반으로만 답변하라"고 되어 있으면, 대화 이력을 기억해도 활용하지 못한다. **프롬프트에서 대화 이력도 답변 소스로 명시**해야 한다.

[https://github.com/Kimgyuilli/rag-template](https://github.com/Kimgyuilli/rag-template)

