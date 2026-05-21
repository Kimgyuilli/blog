---
title: "Spring AI + pgvector RAG 검색 품질 개선기: 쿼리 리라이팅부터 Re-ranking까지"
description: "이전 글에서 MessageChatMemoryAdvisor를 적용해 멀티 턴 대화까지 구현했다. 그런데 실제로 다양한 질문을 던져보니, 검색 자체가 잘 안 되는 문제가 있었다. 이 글에서는 기존 QuestionAnswerAdvisor를 커스텀 Advisor 체인으로 교체하여"
image: "/images/blog/spring-ai-pgvector-rag-re-ranking/image-01.png"
pubDate: 2026-02-25
category: "ai"
tags: ["spring", "rag"]
draft: false
slug: "spring-ai-pgvector-rag-re-ranking"
---
![Spring AI + pgvector RAG 검색 품질 개선기: 쿼리 리라이팅부터 Re-ranking까지](/images/blog/spring-ai-pgvector-rag-re-ranking/image-01.png)

## 들어가며

[이전 글](https://imdeepskyblue.tistory.com/83)에서 `MessageChatMemoryAdvisor`를 적용해 멀티 턴 대화까지 구현했다. 

그런데 실제로 다양한 질문을 던져보니, **검색 자체가 잘 안 되는 문제**가 있었다.

-   "환불 ㄱㄴ?" 같은 구어체 질문은 벡터 검색에서 관련 문서를 못 찾는다
-   유사도 점수가 낮은 문서도 무조건 포함되어 답변 품질이 떨어진다
-   검색 결과의 순서를 조정할 방법이 없다

이 글에서는 기존 `QuestionAnswerAdvisor`를 커스텀 Advisor 체인으로 교체하여 검색 품질을 개선한 과정을 정리한다

\---

## 기존 구조의 한계

이전 글에서 구성한 Advisor 체인은 이랬다.

```java
MessageChatMemoryAdvisor → QuestionAnswerAdvisor (벡터 top-5 검색)
```

실제로 테스트해보면 이런 문제가 발생한다.

| 질문  | 검색 결과 | 문제  |
| --- | --- | --- |
| 회원 탈퇴하면 개인정보 얼마나 보관돼? | 1개 문서 | 정상  |
| 환불은 언제까지 가능해? | 0개 문서 | 문서가 있는데도 못 찾음 |
| 배송 얼마나 걸려? | 0개 문서 | 문서가 있는데도 못 찾음 |
| 환불 ㄱㄴ? | 0개 문서 | 구어체라 매칭 실패 |
| 포인트 어떻게 쌓여? | 0개 문서 | 문서가 있는데도 못 찾음 |

5개 문서가 DB에 있는데 **1개만 검색된다.** 나머지는 유사도 임계값이 너무 높거나, 질문 표현과 문서 표현의 차이 때문에 벡터 매칭이 안 됐다.

\---

## 개선된 파이프라인

```java
사용자 질문
  → MessageChatMemoryAdvisor (대화 이력 추가)
  → QueryRewriteAdvisor (쿼리 리라이팅)
  → RetrievalRerankAdvisor (벡터 검색 + 재순위화)
  → LLM 응답
```

Spring AI의 `BaseAdvisor` 인터페이스를 구현하면 `before()`/`after()` 훅으로 요청·응답을 가로챌 수 있다. `getOrder()`로 실행 순서를 제어한다.

\---

## Step 1. 유사도 임계값 조정

가장 간단하면서 효과가 큰 변경이다.

```java
SearchRequest.builder()
    .query(query)
    .topK(10)
    .similarityThreshold(0.3)  // 핵심
    .build();
```

처음에는 0.7로 설정했는데, **테스트 결과 5개 문서 중 1개만 통과**했다. pgvector의 코사인 유사도에서 0.7은 상당히 엄격한 값이다. 한국어 텍스트는 표현 변형이 다양해서 같은 주제여도 0.5~0.6 정도가 나오는 경우가 많았다.

0.3으로 낮추자 관련 문서는 모두 검색되면서, "퀵소트 구현해줘" 같은 완전히 무관한 질문은 여전히 0개로 걸러졌다.

\---

## Step 2. 메타데이터 카테고리 필터링

문서 등록 시 메타데이터에 `category`를 넣었다면, 검색 시 특정 카테고리만 필터링할 수 있다.

```java
// ChatService.java
private Consumer<AdvisorSpec> advisorParams(String conversationId, String category) {
    return a -> {
        a.param(ChatMemory.CONVERSATION_ID, conversationId);
        if (category != null && !category.isBlank()) {
            a.param(FILTER_EXPRESSION, "category == '" + category + "'");
        }
    };
}
```

API 요청 시 `category`를 보내면 해당 카테고리 문서만 검색 대상이 된다.

```json
{
  "question": "환불 정책 알려줘",
  "category": "policy"
}
```

생략하면 전체 문서에서 검색하므로 하위 호환성이 유지된다.

\---

## Step 3. 쿼리 리라이팅

여기서부터 흥미로워진다. 사용자는 "환불 ㄱㄴ?"이라고 쓰지만, 벡터 DB에는 "환불 요청은 상품 수령 후 7일 이내에 가능합니다"라는 문장이 임베딩되어 있다. 이 간극을 줄이기 위해 LLM으로 질문을 재작성한다.

```java
public class QueryRewriteAdvisor implements BaseAdvisor {

    static final String REWRITTEN_QUERY_KEY = "rewrittenQuery";

    private static final String REWRITE_PROMPT = """
        사용자의 질문을 벡터 검색에 적합한 형태로 재작성하세요.

        규칙:
        1. 원본 질문의 핵심 단어를 반드시 포함하세요.
        2. 구어체, 줄임말, 감탄사를 자연스러운 문장으로 바꾸세요.
        3. 짧은 키워드가 아닌, 완전한 문장으로 작성하세요.
        4. 재작성된 쿼리만 출력하세요.

        예시:
        - "환불 ㄱㄴ?" → "환불은 언제까지 가능한가요?"
        - "탈퇴하면 내 정보 어떻게 됨?" → "회원 탈퇴 시 개인정보는 어떻게 처리되나요?"

        사용자 질문: %s
        """;

    @Override
    public ChatClientRequest before(ChatClientRequest request, AdvisorChain chain) {
        String originalQuery = request.prompt().getUserMessage().getText();
        String rewrittenQuery = chatModel.call(
            String.format(REWRITE_PROMPT, originalQuery)).trim();

        return request.mutate()
                .context(REWRITTEN_QUERY_KEY, rewrittenQuery)
                .build();
    }
}
```

### 핵심: context에만 저장하고 prompt는 건드리지 않는다

처음 구현할 때 재작성한 쿼리로 user message를 교체했다. **이것 때문에 대화 기억이 완전히 깨졌다.**

원인은 Advisor 실행 순서에 있다.

```java
MessageChatMemoryAdvisor(order=0) → QueryRewriteAdvisor(order=10)
```

`MessageChatMemoryAdvisor`가 먼저 실행되어 대화 이력을 prompt에 추가한다. 그런데 `QueryRewriteAdvisor`가 user message를 교체하면, 이력이 포함된 메시지가 통째로 날아간다.

해결책은 **prompt를 건드리지 않고 context에만 재작성 쿼리를 저장**하는 것이다. 후속 `RetrievalRerankAdvisor`가 context에서 꺼내 벡터 검색에만 사용한다.

### 프롬프트도 중요하다

처음 프롬프트는 "핵심 키워드와 의미를 보존하세요"였다. 결과:

```
"환불은 언제까지 가능해?" → "환불 가능 기간"
"배송 얼마나 걸려?" → "배송 시간"
```

짧은 키워드로 변환되어 오히려 임베딩 매칭이 나빠졌다. **"완전한 문장으로 작성하세요"**와 구체적인 예시를 추가하자 결과가 달라졌다:

```
"환불은 언제까지 가능해?" → "환불은 언제까지 가능한가요?"
"환불 ㄱㄴ?" → "환불은 가능한가요?"
"탈퇴하면 내 정보 어떻게 됨?" → "회원 탈퇴 시 제 정보는 어떻게 되나요?"
```

\---

## Step 4. LLM 기반 Re-ranking

벡터 유사도 순위가 항상 정확하지는 않다. topK=10으로 넉넉하게 가져온 뒤, LLM이 관련성을 재평가하여 상위 5개만 선택한다.

```java
public class RetrievalRerankAdvisor implements BaseAdvisor {

    @Override
    public ChatClientRequest before(ChatClientRequest request, AdvisorChain chain) {
        Map<String, Object> context = request.context();

        // 리라이팅된 쿼리가 있으면 사용
        String query = context.containsKey(QueryRewriteAdvisor.REWRITTEN_QUERY_KEY)
                ? context.get(QueryRewriteAdvisor.REWRITTEN_QUERY_KEY).toString()
                : request.prompt().getUserMessage().getText();

        // 벡터 검색
        List<Document> candidates = vectorStore.similaritySearch(
            SearchRequest.builder()
                .query(query)
                .topK(10)
                .similarityThreshold(0.3)
                .build());

        if (candidates.isEmpty()) return request;

        // 5개 이하면 재순위화 스킵 (LLM 호출 절약)
        List<Document> selected;
        if (candidates.size() <= RERANK_TOP_N) {
            selected = candidates;
        } else {
            selected = rerank(query, candidates);
        }

        // 시스템 메시지에 문서 컨텍스트 추가
        String documentContext = selected.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n\n"));

        return request.mutate()
                .prompt(request.prompt().augmentSystemMessage(
                    String.format(CONTEXT_TEMPLATE, documentContext)))
                .context(RETRIEVED_DOCUMENTS, selected)
                .build();
    }
}
```

### 재순위화 최적화

검색 결과가 5개 이하이면 재순위화 LLM 호출을 스킵한다. 어차피 전부 선택할 건데 순서만 바꾸려고 API를 호출할 이유가 없다.

```java
if (candidates.size() <= RERANK_TOP_N) {
    selected = candidates;  // 스킵
} else {
    selected = rerank(query, candidates);  // LLM으로 재순위화
}
```

재순위화 실패 시에는 원본 벡터 검색 순서로 fallback하여 안정성을 확보했다.

\---

## 최종 테스트 결과

개선 전후를 비교하면:

### Before (QuestionAnswerAdvisor + threshold 0.7)

| 질문  | 검색 결과 | 답변 근거 |
| --- | --- | --- |
| 환불은 언제까지 가능해? | 0개  | LLM 자체 지식 (부정확) |
| 배송 얼마나 걸려? | 0개  | LLM 자체 지식 (부정확) |
| 환불 ㄱㄴ? | 0개  | LLM 자체 지식 (부정확) |
| 포인트 어떻게 쌓여? | 0개  | LLM 자체 지식 (부정확) |
| 탈퇴하면 내 정보 어떻게 됨? | 0개  | "관련 법령에 따라" (일반론) |

### After (QueryRewrite + Rerank + threshold 0.3)

| 질문  | 검색 결과 | 답변 근거 |
| --- | --- | --- |
| 환불은 언제까지 가능해? | 2개  | 문서 기반 정확한 답변 |
| 배송 얼마나 걸려? | 2개  | 문서 기반 정확한 답변 |
| 환불 ㄱㄴ? | 2개  | 문서 기반 정확한 답변 |
| 포인트 어떻게 쌓여? | 1개  | 문서 기반 정확한 답변 |
| 탈퇴하면 내 정보 어떻게 됨? | 1개  | "30일간 보관" (문서 내용 정확 반영) |

그 외:

-   "파이썬으로 퀵소트 구현해줘" → 0개 문서, "고객센터 문의" 응답 (정상 차단)
-   대화 기억: 이름을 말한 뒤 "내 이름이 뭐였지?" → 정상 기억

\---

## 삽질 기록

### 1\. similarity threshold 0.7은 너무 높다

직감적으로 "0.7이면 적당히 관련 있는 문서만 나오겠지"라고 생각했다. 실제로는 한국어 텍스트에서 같은 주제라도 코사인 유사도가 0.5~0.6 수준인 경우가 흔했다. **실제 데이터로 테스트하지 않고 임계값을 정하면 안 된다.**

### 2\. 쿼리 리라이팅이 오히려 검색을 망칠 수 있다

"검색에 유리한 명확하고 간결한 문장으로 바꾸세요"라고 프롬프트를 쓰면, LLM이 "환불 가능 기간"처럼 2~3단어 키워드로 압축한다. 임베딩 모델은 완전한 문장일 때 성능이 좋기 때문에 오히려 매칭이 나빠진다. **"완전한 문장으로 작성하세요"와 구체적인 예시가 필수다.**

### 3\. Advisor에서 prompt를 수정하면 대화 이력이 깨진다

`MessageChatMemoryAdvisor`가 추가한 대화 이력이 prompt에 있는 상태에서, 후속 Advisor가 user message를 교체하면 이력이 날아간다. **Advisor 간 데이터 전달은 context를 사용**해야 한다.

\---

기술 스택: Java 21, Spring Boot 4.0, Spring AI 1.1.2, PostgreSQL + pgvector, OpenAI API (gpt-4o-mini, text-embedding-3-small)
