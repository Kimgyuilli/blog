---
title: "Spring AI가 제공하는 주요 기능 정리"
description: "Spring AI는 Java/Spring 생태계에서 AI 애플리케이션을 구축하기 위한 프레임워크다. LLM 호출, 문서 임베딩, 벡터 검색, 대화 이력 관리 등 AI 앱에 필요한 기능들을 Spring 스타일의 추상화로 제공한다. 이 글에서는 Spring AI가 제공하는 주요"
image: "/images/blog/spring-ai/image-01.png"
pubDate: 2026-02-22
category: "ai"
tags: ["spring"]
draft: false
slug: "spring-ai"
---
![Spring AI가 제공하는 주요 기능 정리](/images/blog/spring-ai/image-01.png)

## 들어가며

Spring AI는 Java/Spring 생태계에서 AI 애플리케이션을 구축하기 위한 프레임워크다. LLM 호출, 문서 임베딩, 벡터 검색, 대화 이력 관리 등 AI 앱에 필요한 기능들을 Spring 스타일의 추상화로 제공한다.

이 글에서는 Spring AI가 제공하는 주요 기능들을 **지원하는 기능 → 원리 → 사용 방법** 순서로 정리한다.

#### 예시 구현 프로젝트

[https://github.com/Kimgyuilli/rag-template](https://github.com/Kimgyuilli/rag-template)

 [GitHub - Kimgyuilli/rag-template: rag 템플릿

rag 템플릿. Contribute to Kimgyuilli/rag-template development by creating an account on GitHub.

github.com](https://github.com/Kimgyuilli/rag-template)

\---

## 1\. ChatClient — LLM 호출 API

### 기능

AI 모델과 대화하기 위한 진입점이다. `RestTemplate`이 HTTP 호출을 추상화하듯, `ChatClient`는 LLM 호출을 추상화한다. 동기/스트리밍 호출, 시스템 프롬프트 설정, Advisor 체인 등을 지원한다.

### 원리

`ChatClient.Builder`에 시스템 프롬프트와 Advisor를 설정해두면, 매 요청마다 이 설정이 자동으로 적용된다. 내부적으로 프롬프트를 구성하고, Advisor 체인을 거친 뒤, 설정된 AI 모델(OpenAI, Anthropic 등)의 API를 호출한다.

### 사용 방법

**Bean 등록:**

```java
@Bean
ChatClient chatClient(ChatClient.Builder builder) {
    return builder
            .defaultSystem("당신은 고객센터 상담 챗봇입니다.")
            .defaultAdvisors(new SimpleLoggerAdvisor())
            .build();
}
```

**동기 호출:**

```java
String answer = chatClient.prompt()
        .user("환불 정책이 어떻게 되나요?")
        .call()
        .content();
```

**스트리밍 호출:**

```java
Flux<String> stream = chatClient.prompt()
        .user("환불 정책이 어떻게 되나요?")
        .stream()
        .content();
```

**Structured Output — AI 응답을 Java 객체로 변환:**

```java
record ActorFilms(String actor, List<String> movies) {}

ActorFilms result = chatClient.prompt()
        .user("톰 행크스의 대표 영화 5편을 알려줘.")
        .call()
        .entity(ActorFilms.class);
```

\---

## 2\. Advisor — 요청/응답 미들웨어

### 기능

LLM 호출 전후에 끼어들어 프롬프트를 수정하거나 컨텍스트를 주입하는 확장 포인트다. 서블릿 필터나 Spring AOP와 비슷한 개념이다. RAG, 대화 이력, 로깅 등을 Advisor로 구현한다.

### 원리

Advisor는 **before advice**와 **after advice**로 나뉜다. before에서는 LLM에 전달할 프롬프트를 수정하고(문서 주입, 이력 추가 등), after에서는 응답을 후처리한다(이력 저장 등). 여러 Advisor를 체인으로 연결할 수 있으며, 우선순위에 따라 순서대로 실행된다.

```java
요청 → [Advisor A: before] → [Advisor B: before] → LLM 호출
                                                       ↓
응답 ← [Advisor A: after]  ← [Advisor B: after]  ← LLM 응답
```

### 사용 방법

Spring AI는 여러 내장 Advisor를 제공한다.

**QuestionAnswerAdvisor (RAG):**

사용자 질문으로 벡터 저장소를 검색하고, 검색된 문서를 프롬프트에 자동 추가한다.

```java
QuestionAnswerAdvisor.builder(vectorStore)
        .searchRequest(SearchRequest.builder().topK(5).build())
        .build()
```

**MessageChatMemoryAdvisor (대화 이력):**

이전 대화 내용을 `ChatMemory`에서 가져와 프롬프트에 추가하고, 새 대화를 저장한다.

```java
MessageChatMemoryAdvisor.builder(chatMemory).build()
```

**SimpleLoggerAdvisor (로깅):**

요청/응답을 로깅한다. 디버깅에 유용하다.

```java
new SimpleLoggerAdvisor()
```

**ChatClient에 Advisor 등록:**

```java
ChatClient chatClient = builder
        .defaultAdvisors(
                MessageChatMemoryAdvisor.builder(chatMemory).build(),
                QuestionAnswerAdvisor.builder(vectorStore)
                        .searchRequest(SearchRequest.builder().topK(5).build())
                        .build())
        .build();
```

\---

## 3\. ChatMemory — 대화 이력 관리

### 기능

세션별로 대화 이력을 저장하고 조회하는 저장소다. `conversationId`로 세션을 구분하여 독립적인 대화 이력을 관리한다.

### 원리

`ChatMemory`는 저장소 인터페이스이고, 실제 저장은 `ChatMemoryRepository` 구현체가 담당한다. `MessageWindowChatMemory`는 슬라이딩 윈도우 방식으로 최근 N개 메시지만 유지하여 토큰 제한을 관리한다.

```java
MessageChatMemoryAdvisor
    └─ ChatMemory (MessageWindowChatMemory)
          └─ ChatMemoryRepository (InMemory / JDBC / ...)
```

`MessageChatMemoryAdvisor`가 매 요청마다 ChatMemory를 통해 이전 메시지를 가져와 프롬프트에 추가하고, 응답 후 새 메시지를 저장한다.

### 사용 방법

**InMemory (서버 재시작 시 초기화):**

```java
@Bean
ChatMemory chatMemory() {
    return MessageWindowChatMemory.builder()
            .chatMemoryRepository(new InMemoryChatMemoryRepository())
            .maxMessages(20)
            .build();
}
```

**JDBC (영속화):**

```java
@Bean
ChatMemory chatMemory(JdbcChatMemoryRepository repository) {
    return MessageWindowChatMemory.builder()
            .chatMemoryRepository(repository)
            .maxMessages(20)
            .build();
}
```

**호출 시 conversationId 전달:**

```java
chatClient.prompt()
        .user(question)
        .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
        .call()
        .content();
```

\---

## 4\. VectorStore — 벡터 저장소

### 기능

문서를 벡터(임베딩)로 저장하고, 유사도 기반 검색을 수행한다. RAG의 핵심 인프라다. pgvector, Pinecone, Weaviate, MongoDB Atlas, Redis, Elasticsearch 등 20개 이상의 벡터 DB를 지원한다.

### 원리

문서를 저장할 때 Embedding Model이 텍스트를 고차원 벡터로 변환한다. 검색 시에는 쿼리도 벡터로 변환한 뒤, 코사인 유사도 등으로 가장 가까운 벡터를 찾는다. Spring AI는 이 과정을 `VectorStore` 인터페이스로 추상화하여 벡터 DB에 관계없이 동일한 코드를 사용할 수 있게 한다.

```java
문서 텍스트 → [Embedding Model] → 벡터 → [VectorStore에 저장]
검색 쿼리 → [Embedding Model] → 벡터 → [VectorStore에서 유사도 검색] → 관련 문서
```

### 사용 방법

**의존성 추가 (pgvector 예시):**

```
implementation 'org.springframework.ai:spring-ai-starter-vector-store-pgvector'
```

**설정:**

```java
spring.ai.vectorstore.pgvector:
  index-type: hnsw                # HNSW 인덱스 (근사 최근접 이웃 검색)
  distance-type: cosine_distance  # 코사인 유사도
  dimensions: 1536                # 임베딩 모델의 출력 차원
  initialize-schema: true         # 테이블 자동 생성
```

**문서 저장:**

```java
vectorStore.add(List.of(
        new Document("환불은 구매일로부터 7일 이내에 가능합니다.", Map.of("category", "policy")),
        new Document("배송은 주문 후 2-3일 소요됩니다.", Map.of("category", "shipping"))
));
```

**검색:**

```java
List<Document> results = vectorStore.similaritySearch(
        SearchRequest.builder()
                .query("환불 어떻게 하나요?")
                .topK(5)
                .build());
```

보통은 직접 검색하지 않고, `QuestionAnswerAdvisor`가 자동으로 검색하고 프롬프트에 주입한다.

\---

## 5\. ETL Pipeline — 문서 처리 파이프라인

### 기능

원본 문서(PDF, HTML, JSON, Markdown 등)를 읽어서 청크로 분할하고, 벡터 저장소에 적재하는 ETL(Extract-Transform-Load) 파이프라인이다.

### 원리

3가지 인터페이스의 조합으로 파이프라인을 구성한다:

-   **DocumentReader**: 다양한 형식의 원본 문서를 `Document` 객체로 변환
-   **DocumentTransformer**: 문서를 청크로 분할하거나 메타데이터를 추가
-   **DocumentWriter**: 처리된 문서를 벡터 저장소 등에 저장

```java
원본 문서 (PDF, HTML, JSON, ...)
    ↓
DocumentReader (추출)
    ↓
DocumentTransformer (분할, 메타데이터 추가)
    ↓
DocumentWriter (벡터 저장소에 적재)
```

### 사용 방법

**지원하는 DocumentReader:**

| Reader | 대상  |
| --- | --- |
| `PagePdfDocumentReader` | PDF (페이지 단위) |
| `ParagraphPdfDocumentReader` | PDF (목차 기반) |
| `JsonReader` | JSON |
| `TextReader` | 텍스트 |
| `JsoupDocumentReader` | HTML |
| `MarkdownDocumentReader` | Markdown |
| `TikaDocumentReader` | DOCX, PPTX, DOC 등 |

**지원하는 DocumentTransformer:**

| Transformer | 역할  |
| --- | --- |
| `TokenTextSplitter` | 토큰 단위로 청크 분할 |
| `KeywordMetadataEnricher` | AI로 키워드 추출하여 메타데이터에 추가 |
| `SummaryMetadataEnricher` | AI로 요약을 생성하여 메타데이터에 추가 |

**파이프라인 예시:**

```java
// 1. PDF 읽기
PagePdfDocumentReader reader = new PagePdfDocumentReader("classpath:/manual.pdf",
        PdfDocumentReaderConfig.builder().withPagesPerDocument(1).build());

// 2. 토큰 단위로 분할
TokenTextSplitter splitter = new TokenTextSplitter(512, 50, 5, 1000, true);

// 3. 벡터 저장소에 적재
vectorStore.write(splitter.split(reader.read()));
```

\---

## 6\. Tool Calling — 외부 도구 호출

### 기능

AI 모델이 답변 생성 중에 외부 API 호출이나 함수 실행을 요청할 수 있게 하는 기능이다. 실시간 날씨 조회, DB 검색, 이메일 발송 같은 작업을 AI가 능동적으로 수행할 수 있게 된다.

### 원리

모델이 직접 API를 호출하는 것이 아니다. 모델은 "이 함수를 이 파라미터로 호출해달라"고 요청하고, 애플리케이션이 실행한 뒤 결과를 모델에 다시 전달한다.

```java
1. 애플리케이션 → 모델: 사용 가능한 도구 목록(이름, 설명, 파라미터) 전달
2. 모델 → 애플리케이션: "getCurrentDateTime 함수를 호출해줘"
3. 애플리케이션: 함수 실행 후 결과 반환
4. 모델: 결과를 참고하여 최종 답변 생성
```

### 사용 방법

**도구 정의 (`@Tool` 어노테이션):**

```java
class DateTimeTools {

    @Tool(description = "현재 날짜와 시간을 조회합니다")
    String getCurrentDateTime() {
        return LocalDateTime.now().toString();
    }

    @Tool(description = "지정된 시간에 알람을 설정합니다")
    void setAlarm(@ToolParam(description = "ISO-8601 형식의 시간") String time) {
        System.out.println("알람 설정: " + LocalDateTime.parse(time));
    }
}
```

**ChatClient에 도구 등록:**

```java
// 요청마다 등록
String response = chatClient.prompt()
        .user("10분 후에 알람 설정해줘")
        .tools(new DateTimeTools())
        .call()
        .content();

// 기본 도구로 등록
ChatClient chatClient = builder
        .defaultTools(new DateTimeTools())
        .build();
```

**ToolContext로 추가 정보 전달:**

```java
class CustomerTools {
    @Tool(description = "고객 정보를 조회합니다")
    Customer getCustomer(Long id, ToolContext context) {
        String tenantId = (String) context.getContext().get("tenantId");
        return customerRepository.findById(id, tenantId);
    }
}

chatClient.prompt()
        .user("42번 고객 정보 알려줘")
        .tools(new CustomerTools())
        .toolContext(Map.of("tenantId", "acme"))
        .call()
        .content();
```

\---

## 7\. Structured Output — 구조화된 응답 변환

### 기능

LLM의 텍스트 응답을 Java 객체(POJO), List, Map 등 구조화된 데이터로 변환한다. "영화 목록을 알려줘"라고 물으면 문자열이 아닌 `List<Movie>` 객체로 받을 수 있다.

### 원리

2단계로 동작한다:

1.  **호출 전**: 프롬프트에 "응답을 이 JSON 스키마에 맞춰서 생성해줘"라는 포맷 지시를 추가
2.  **호출 후**: 모델의 텍스트 응답을 파싱하여 지정된 Java 타입으로 변환

최신 모델(GPT-4o, Claude 3.5+)은 **Native Structured Output**을 지원하여, 포맷 지시 없이도 스키마를 보장한다.

### 사용 방법

**Java 객체로 변환:**

```java
record ActorFilms(String actor, List<String> movies) {}

ActorFilms result = chatClient.prompt()
        .user("톰 행크스의 대표 영화 5편")
        .call()
        .entity(ActorFilms.class);
```

**List로 변환:**

```java
List<ActorFilms> results = chatClient.prompt()
        .user("배우 3명의 대표작")
        .call()
        .entity(new ParameterizedTypeReference<List<ActorFilms>>() {});
```

**Native Structured Output 사용:**

```java
ActorFilms result = chatClient.prompt()
        .advisors(AdvisorParams.ENABLE_NATIVE_STRUCTURED_OUTPUT)
        .user("톰 행크스의 대표 영화 5편")
        .call()
        .entity(ActorFilms.class);
```

\---

## 8\. Embedding Model — 텍스트 벡터화

### 기능

텍스트를 고차원 벡터(숫자 배열)로 변환한다. 의미가 비슷한 텍스트는 가까운 벡터를 가지므로, 유사도 검색의 기반이 된다. OpenAI, Azure OpenAI, Google, Mistral 등 다양한 임베딩 모델을 지원한다.

### 원리

임베딩 모델은 텍스트의 의미를 수백~수천 차원의 벡터 공간에 매핑한다. "환불"과 "반품"은 가까운 벡터를, "환불"과 "날씨"는 먼 벡터를 가진다. 이 벡터를 VectorStore에 저장하면 의미 기반 검색이 가능해진다.

### 사용 방법

**설정 (application.yaml):**

```java
spring.ai.openai:
  api-key: ${OPENAI_API_KEY}
  embedding:
    options:
      model: text-embedding-3-small  # 1536차원
```

의존성을 추가하면 `EmbeddingModel` 빈이 자동 구성된다. 보통 직접 호출하지 않고 `VectorStore`가 문서 저장/검색 시 내부적으로 사용한다.

**직접 호출이 필요한 경우:**

```java
@Autowired
EmbeddingModel embeddingModel;

float[] vector = embeddingModel.embed("환불 정책이 궁금합니다");
```

\---

## 9\. MCP (Model Context Protocol)

### 기능

Anthropic이 제안한 오픈 프로토콜로, AI 모델이 외부 데이터 소스와 도구에 표준화된 방식으로 접근할 수 있게 한다. Spring AI는 MCP Client와 Server Boot Starter를 제공하여 MCP 서버를 쉽게 구축하거나 연동할 수 있다.

### 원리

MCP는 클라이언트-서버 구조로, AI 모델(클라이언트)이 표준 프로토콜을 통해 외부 리소스(서버)에 접근한다. Tool Calling이 "함수 하나"를 호출하는 것이라면, MCP는 "서비스 전체"를 연결하는 것이다. STDIO, SSE, HTTP 기반 통신을 지원한다.

### 사용 방법

**MCP Client (외부 MCP 서버 연동):**

```
spring.ai.mcp.client:
  stdio:
    servers-configuration: classpath:mcp-servers.json
```

**MCP Server (MCP 서버 구축):**

```java
@Tool(description = "고객 주문 내역을 조회합니다")
List<Order> getOrders(@ToolParam(description = "고객 ID") String customerId) {
    return orderRepository.findByCustomerId(customerId);
}
```

\---

## 10\. Model Evaluation — 모델 평가

### 기능

AI 모델의 응답 품질을 평가하는 유틸리티를 제공한다. 생성된 답변이 사실에 기반하는지, 환각(hallucination)이 포함되어 있지 않은지 등을 검증할 수 있다.

### 원리

평가용 AI 모델을 사용하여 생성된 응답을 사실 데이터와 비교한다. "이 응답이 주어진 컨텍스트와 일치하는가?"를 AI가 판단하는 방식이다.

\---

## 지원 모델 프로바이더

Spring AI는 다양한 AI 프로바이더를 추상화하여, 설정만 바꾸면 모델을 교체할 수 있다.

| 카테고리 | 지원 프로바이더 |
| --- | --- |
| **Chat Model** | OpenAI, Anthropic, Google GenAI, Azure OpenAI, Amazon Bedrock, Ollama, Mistral 등 |
| **Embedding Model** | OpenAI, Azure OpenAI, Google GenAI, Mistral, Ollama 등 |
| **Image Model** | OpenAI (DALL-E), Stability AI, Azure OpenAI |
| **Audio Model** | OpenAI (Whisper, TTS), ElevenLabs |
| **Vector Store** | pgvector, Pinecone, Weaviate, MongoDB Atlas, Redis, Elasticsearch 등 20개+ |

\---

## 정리

| 기능  | 한 줄 요약 |
| --- | --- |
| **ChatClient** | LLM 호출을 위한 Fluent API. 동기/스트리밍 지원 |
| **Advisor** | LLM 호출 전후에 끼어드는 미들웨어. RAG, 대화 이력, 로깅 등 구현 |
| **ChatMemory** | 세션별 대화 이력 저장/조회. 슬라이딩 윈도우로 토큰 관리 |
| **VectorStore** | 문서를 벡터로 저장하고 유사도 검색. 20개+ 벡터 DB 지원 |
| **ETL Pipeline** | PDF, HTML 등 원본 문서를 읽고, 청크 분할하고, 벡터 저장소에 적재 |
| **Tool Calling** | AI 모델이 외부 함수/API를 호출하도록 연결 |
| **Structured Output** | AI 응답을 Java 객체로 변환 |
| **Embedding Model** | 텍스트를 벡터로 변환. VectorStore의 기반 |
| **MCP** | 외부 데이터 소스와 표준 프로토콜로 연동 |
| **Model Evaluation** | AI 응답 품질 평가 및 환각 검증 |

Spring AI의 핵심 가치는 **추상화**에 있다. 모델이나 벡터 DB를 교체해도 코드 변경 없이 설정만 바꾸면 되고, 복잡한 RAG나 대화 이력 관리를 Advisor 등록만으로 처리할 수 있다.
