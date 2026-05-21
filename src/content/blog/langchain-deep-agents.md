---
title: "LangChain이 공개한 에이전트 하네스, Deep Agents 뜯어보기"
description: "요즘 AI 에이전트 하네스를 직접 만들어보려는 시도가 많다. 나도 그중 하나였다. 프롬프트 짜고, 도구 몇 개 붙이고, 루프 돌리면 되겠지 싶었는데 막상 만들어보면 금방 벽에 부딪힌다. 대화가 길어지면 컨텍스트가 넘치고, 도구 호출 결과가 거대해지면 토큰 비용이 폭발하고,"
image: "/images/blog/langchain-deep-agents/image-01.png"
pubDate: 2026-03-16
category: "ai"
tags: []
draft: false
slug: "langchain-deep-agents"
---
## 왜 이 코드를 읽게 됐나

요즘 AI 에이전트 하네스를 직접 만들어보려는 시도가 많다. 나도 그중 하나였다. 프롬프트 짜고, 도구 몇 개 붙이고, 루프 돌리면 되겠지 싶었는데 막상 만들어보면 금방 벽에 부딪힌다.

대화가 길어지면 컨텍스트가 넘치고, 도구 호출 결과가 거대해지면 토큰 비용이 폭발하고, 작업이 복잡해지면 에이전트가 갈피를 못 잡는다. "에이전트를 만드는 건 쉽지만, 쓸 만한 에이전트를 만드는 건 어렵다"는 걸 몸으로 느꼈다.

그러던 중 LangChain 팀이 **Deep Agents**라는 오픈소스를 공개했다. Claude Code에서 영감을 받은 "배터리 포함형 에이전트 하네스"라고 한다. 엔터프라이즈급 에이전트가 실전에서 살아남으려면 어떤 구조가 필요한지, 이 코드베이스를 직접 뜯어보면서 정리해봤다.

\---

## 1\. 생각보다 단순한 진입점

코드를 처음 열었을 때 놀란 건 핵심 진입점이 함수 하나라는 점이었다.

```
from deepagents import create_deep_agent

agent = create_deep_agent()
result = agent.invoke({"messages": [{"role": "user", "content": "Hello"}]})
```

이 세 줄이면 파일 읽기/쓰기, 쉘 실행, 작업 계획, 서브에이전트 위임까지 가능한 에이전트가 만들어진다. 그런데 이 간결함 뒤에 어떤 구조가 숨어 있는지를 알아보려 한다.

`create_deep_agent()` 내부를 열어보면 크게 세 단계로 에이전트를 조립한다.

![LangChain이 공개한 에이전트 하네스, Deep Agents 뜯어보기](/images/blog/langchain-deep-agents/image-01.png)

모델을 고르고, 백엔드(파일을 어디에 저장할지)를 정하고, 미들웨어를 순서대로 쌓은 다음, LangGraph 그래프로 컴파일해서 내보낸다. Deep Agents는 별도의 런타임을 만들지 않고 **LangGraph 위에 올라가는 설정 레이어**로 정의되어 있다. 밑바닥부터 만드는 게 아니라, 검증된 런타임 위에 올리는 접근이다.

\---

## 미들웨어 패턴 기능을 "레이어"로 쌓는 구조

이 프로젝트에서 가장 눈에 띄는 설계 결정은 미들웨어 패턴이다. 에이전트의 모든 능력 계획, 메모리, 파일 조작, 서브에이전트, 컨텍스트 관리를 각각 독립적인 미들웨어로 정의하고, 순서대로 요청/응답 파이프라인에 끼워넣는 방식을 택했다.

![LangChain이 공개한 에이전트 하네스, Deep Agents 뜯어보기](/images/blog/langchain-deep-agents/image-02.png)

처음엔 "하나의 클래스에 다 넣어도 되지 않나?" 싶었다. 그런데 실제 코드를 보면 이 분리의 이점이 확실하다.

`graph.py`의 미들웨어 조립 부분을 보면

```bash
deepagent_middleware = [
    # [필수] 작업 계획/추적 — write_todos 도구를 제공
    # 에이전트가 복잡한 작업을 단계별로 분해하고 진행 상황을 추적할 수 있게 한다.
    TodoListMiddleware(),
]

# [선택] 메모리 — AGENTS.md 파일의 내용을 시스템 프롬프트에 주입
if memory is not None:
    deepagent_middleware.append(MemoryMiddleware(backend=backend, sources=memory))

# [선택] 스킬 — SKILL.md 파일에서 재사용 가능한 워크플로우를 로딩
if skills is not None:
    deepagent_middleware.append(SkillsMiddleware(backend=backend, sources=skills))
# [필수] 나머지 핵심 미들웨어들은 항상 포함
deepagent_middleware.extend([
    # 파일 조작 도구 일체 — ls, read_file, write_file, edit_file, glob, grep
    FilesystemMiddleware(backend=backend),
    # 서브에이전트 위임 — task 도구를 통해 격리된 컨텍스트에서 작업 수행
    SubAgentMiddleware(backend=backend, subagents=all_subagents),
    # 컨텍스트 자동 관리 — 토큰 사용량이 임계치에 도달하면
    # 오래된 메시지를 요약하고, 원본은 파일로 오프로딩
    create_summarization_middleware(model, backend),
    # Anthropic 모델 전용 프롬프트 캐싱 — 비용 절감
    # Claude가 아닌 모델이 들어오면 무시(ignore)하고 넘어감
    AnthropicPromptCachingMiddleware(unsupported_model_behavior="ignore"),
    # 도구 호출 포맷 정규화 — 모델마다 다른 도구 호출 형식을 통일
    PatchToolCallsMiddleware(),
])
```

메모리가 필요 없으면 빼고, 스킬이 필요 없으면 빼고. **기능 추가/제거가 조건문 하나**로 끝난다. 하나의 거대한 클래스였다면 메모리 기능만 끄려 해도 내부 분기가 복잡해졌을 것이다.

여기서 주목할 점이 하나 더 있다. **서브에이전트도 같은 미들웨어 세트를 공유**한다:

```
gp_middleware = [
    TodoListMiddleware(),
    FilesystemMiddleware(backend=backend),
    create_summarization_middleware(model, backend),
    AnthropicPromptCachingMiddleware(...),
    PatchToolCallsMiddleware(),
]
```

메인 에이전트든 서브에이전트든 동일한 레고 블록으로 조립하는 셈이다. 미들웨어 하나를 개선하면 메인과 서브 모두에 반영된다. 각 미들웨어는 `before_agent`(실행 전 초기화), `modify_request`(요청 수정), `wrap_model_call`(호출 감싸기) 세 가지 훅을 통해 파이프라인에 개입하도록 설계되어 있는데, 이건 웹 프레임워크의 미들웨어 패턴과 거의 같은 구조다.

\---

## 2\. 백엔드 추상화 - 실행 환경과 에이전트 코드를 분리하는 방법

두 번째로 눈에 들어온 건 `BackendProtocol`이라는 추상화다. 에이전트가 파일을 읽고 쓰는 모든 동작이 이 프로토콜 위에서 이루어진다.

![LangChain이 공개한 에이전트 하네스, Deep Agents 뜯어보기](/images/blog/langchain-deep-agents/image-03.png)

"그냥 `os.path`랑 `open()` 쓰면 안 되나?" 싶을 수 있다. 하지만 실제 에이전트를 다양한 환경에서 운영하는 상황을 놓고 보면, 이 추상화가 있어야 같은 에이전트 코드가 환경을 가리지 않고 동작한다.

-   **테스트**: `StateBackend` — 파일이 메모리에만 존재, 부작용 없이 테스트 가능
-   **로컬 개발**: `FilesystemBackend` — 실제 디스크에 읽기/쓰기
-   **프로덕션**: `CompositeBackend` — 경로에 따라 저장소를 다르게 라우팅
-   **보안 격리**: `SandboxBackend` — 원격 컨테이너 안에서만 실행

특히 `CompositeBackend`는 경로별 라우팅이라는 실용적인 아이디어를 사용한다.

```
composite = CompositeBackend(
    default=StateBackend(runtime),
    routes={"/memories/": StoreBackend(runtime)}
)
composite.write("/tmp/scratch.txt", "ephemeral")    # → StateBackend
composite.write("/memories/note.md", "persistent")  # → StoreBackend
```

같은 `write()` 호출인데, 경로에 따라 임시 저장과 영구 저장이 갈린다. 에이전트 코드 쪽에서는 이 분기를 전혀 알 필요가 없다.

\---

## 컨텍스트 관리 - 에이전트가 오래 살아남기 위한 전략

이 프로젝트에서 가장 공들여 설계된 부분이 여기다. Deep Agents는 컨텍스트 윈도우 한계를 "에러"가 아니라 **"언젠가 반드시 오는 일상"**으로 취급한다. 복잡한 작업을 하면 컨텍스트는 무조건 찬다. 그래서 3단계 방어 전략을 사용한다.

![LangChain이 공개한 에이전트 하네스, Deep Agents 뜯어보기](/images/blog/langchain-deep-agents/image-04.png)

여기서 핵심은 **가벼운 조치부터 시도한다**는 점이다. 1단계는 오래된 도구 호출의 긴 인자값만 잘라내는 것으로 LLM 호출 없이 처리된다. 그래도 안 되면 2단계로 넘어가서 LLM 기반 요약을 돌린다.

이 전략의 트리거 설정도 모델 사양에 맞게 자동 조절되도록 구현되어 있다.

```bash
# 모델이 자신의 max_input_tokens를 알려주는 경우 → 비율 기반
{
    "trigger": ("fraction", 0.85),   # 용량의 85%에서 트리거
    "keep": ("fraction", 0.10),      # 최근 10%는 절대 건드리지 않음
}

# 모델 정보가 없는 경우 → 고정값으로 보수적 설정
{
    "trigger": ("tokens", 170000),
    "keep": ("messages", 6),
}
```

"keep window"라는 개념이 여기서 등장한다. 아무리 요약해도 **최근 대화는 원본 그대로 유지**하는 것이다. 방금 한 말까지 요약해버리면 에이전트가 당장의 맥락을 잃기 때문이다.

추가로, 에이전트 스스로 컨텍스트를 정리할 수 있는 `compact_conversation` 도구도 제공한다. 이건 자동 트리거가 아니라 에이전트가 판단해서 호출하는 도구인데, 프롬프트에 사용 기준이 이렇게 안내되어 있다:

> "사용자가 완전히 새로운 작업으로 넘어갈 때, 이전 작업의 컨텍스트가 더 이상 관련 없다면 이 도구를 써서 정리하세요."

자동 요약이 "위기 대응"이라면, `compact_conversation`은 "예방 차원의 정리"인 셈이다.

\---

## 서브에이전트 - 핵심 가치는 "병렬 처리"가 아니라 "컨텍스트 격리"

서브에이전트를 처음 보면 "작업을 병렬로 돌려서 속도를 높이는 건가" 싶다. 그런데 이 프로젝트에서 서브에이전트가 풀려는 문제는 속도가 아니라 **컨텍스트 오염 방지**다.

"LeBron James와 Michael Jordan을 비교 분석해줘"라는 요청을 예로 들면,

![LangChain이 공개한 에이전트 하네스, Deep Agents 뜯어보기](/images/blog/langchain-deep-agents/image-05.png)

서브에이전트 없이 이걸 메인에서 다 처리했다면, 웹 검색 20회의 결과가 전부 메인 컨텍스트에 쌓인다. 비교 분석을 시작하기도 전에 컨텍스트가 넘칠 수 있다. 서브에이전트는 이 무거운 작업을 격리된 공간에서 수행하고, **결과 요약만** 돌려준다.

이 격리를 가능하게 하는 구조도 코드에 명시되어 있다. 서브에이전트에 부모 상태를 넘길 때, 특정 키들은 의도적으로 차단한다.

```
_EXCLUDED_STATE_KEYS = {
    "messages",           # 각자 독립된 대화 이력
    "todos",              # 각자의 할 일 목록
    "structured_response",
    "skills_metadata",    # 각자의 스킬
    "memory_contents",    # 각자의 메모리
}
```

부모의 대화 이력이 자식에게 넘어가지 않는다. 자식은 백지 상태에서 시작해서, 자기 임무만 수행하고, 결과만 돌려주는 구조다.

그리고 프롬프트에서 **"서브에이전트를 쓰지 말아야 할 때"**도 명시적으로 정의하고 있다.

```
쓰지 말 것:
- 사소한 작업 (도구 호출 몇 번이면 끝나는 것)
- 중간 추론 과정을 직접 봐야 할 때
- 위임해도 지연만 늘고 이점이 없을 때
```

"피자 주문해줘" 같은 단순 작업에 서브에이전트를 띄우면, 격리 오버헤드만 생기고 이점은 없다. "쓰지 말 때"를 정의하는 것이 "쓸 때"를 정의하는 것만큼 중요하다는 판단이 깔려 있다.

\---

## 메모리 - 단순한 구현, 정교한 가이드라인

에이전트 메모리라고 하면 벡터 DB, 임베딩, RAG 파이프라인 같은 것들이 떠오른다. 그런데 Deep Agents의 메모리 구현은 **마크다운 파일 하나**다.

```
AGENTS.md (마크다운 파일)
    │
    ▼
에이전트 시작 시 MemoryMiddleware가 파일을 읽음
    │
    ▼
시스템 프롬프트에 내용 주입
    │
    ▼
에이전트가 학습할 게 생기면 edit_file로 AGENTS.md를 직접 수정
    │
    ▼
다음 턴부터 업데이트된 내용이 반영됨
```

벡터 DB도 없고, 임베딩도 없다. 에이전트가 기억할 게 생기면 파일에 적고, 다음에 그 파일을 읽는 것이 전부다.

하지만 이 단순한 구조 위에 올라간 **가이드라인**이 세밀하게 설계되어 있다. `memory.py`에 정의된 지침을 보면,

```
기억해야 할 때:
- 사용자가 "이거 기억해"라고 명시적으로 요청할 때
- 사용자의 피드백에서 개선 포인트가 드러날 때
- 도구 사용에 필요한 정보가 나올 때 (Slack 채널 ID, 이메일 등)
- 사용자의 선호가 암시적으로 드러날 때

기억하지 말아야 할 때
- "지금 늦고 있어" 같은 일시적 정보
- "25 곱하기 4는?" 같은 일회성 질문
- "고마워", "좋아" 같은 단순 응답
- API 키, 비밀번호 — 절대 저장 금지
```

여기서 "암시적 선호"에 대한 지침이 흥미롭다:

> "사용자가 파이썬으로 예제를 요청했는데, '자바스크립트로 해줘'라고 수정을 요청하면 — 바로 메모리에 저장하세요. 이 사용자는 자바스크립트를 선호합니다."

사용자가 "이거 기억해"라고 말하지 않아도, 행동에서 선호를 추론해서 저장하라는 것이다. 반대로, 저장하면 안 되는 것의 기준도 명확하다 - 일시적인 것, 일회성인 것, 민감한 것.

이 구조에서 가져갈 포인트는, 메모리 시스템에서 핵심 문제는 저장 기술(벡터 DB냐 파일이냐)이 아니라 **"무엇을 기억하고 무엇을 기억하지 말아야 하는지"에 대한 기준 정의**라는 점이다. 기준 없이 벡터 DB를 달아봐야 노이즈만 쌓인다.

\---

## 프롬프트 설계 — 도구를 만드는 것과 "가르치는 것"

Deep Agents의 기본 프롬프트(`base_prompt.md`)를 보면, 도구를 제공하는 것 이상으로 **모델이 도구를 올바르게 사용하도록 행동 지침을 정의하는 데** 상당한 공을 들이고 있다.

### "행동 지향" — 말하지 말고 실행하라

```
Don't say "I'll now do X" — just do it.
작업이 완전히 끝날 때까지 계속 진행하라.
중간에 멈추고 설명하지 마라 — 그냥 해라.
```

에이전트가 "이제 파일을 읽어보겠습니다"라고 말하고 멈추는 건 토큰 낭비다. 행동을 예고하지 말고 바로 실행하라는 지침이다.

### "도구 선택 기준" - 전용 도구 우선

```
read_file > cat, edit_file > sed
독립 작업은 병렬로 도구 호출하라
```

`cat`으로 파일을 읽으면 쉘 실행 오버헤드가 생기고 출력 포맷이 불규칙하다. 전용 `read_file`은 줄 번호가 붙고, offset/limit으로 페이지네이션이 된다.

### "컨텍스트 절약" - 파일을 통째로 읽지 마라

```
먼저 read_file(path, limit=100)으로 구조 파악
필요한 부분만 offset/limit으로 읽기
편집 전에 반드시 먼저 읽기
```

사소해 보이지만, 5000줄 파일을 통째로 읽는 것과 처음 100줄만 읽는 것의 토큰 차이는 크다.

### "하드 리밋" - 끝없이 반복하지 마라

리서치 에이전트의 프롬프트에서는 이 원칙을 더 구체적으로 적용하고 있다:

```
Hard Limits:
- 단순 질문: 검색 2-3회 최대
- 복잡한 질문: 검색 5회 최대
- 마지막 2번의 검색이 비슷한 결과를 반환하면 즉시 멈춰라
```

"하드 리밋"이라는 표현 자체가 의미심장하다. 에이전트에게 끝없이 검색할 수 있는 자유를 주면, 실제로 끝없이 검색한다. 반복 실패 시에도 같은 접근을 재시도하지 말고 **왜 실패하는지 분석하라**고 명시되어 있다.

결국 도구를 프롬프트에서 정의할 때 세 가지가 필요하다는 걸 보여주는 구조다.

1.  **언제 쓰는지** (사용 조건)
2.  **언제 쓰지 말아야 하는지** (안티패턴)
3.  **얼마나 쓸 수 있는지** (하드 리밋)

\---

## 실전 예제로 보는 조립 패턴

이론적인 구조만으로는 감이 안 잡힌다. `examples/` 디렉토리에 있는 두 가지 실전 예제를 보면, 앞서 살펴본 구조들이 어떻게 조립되는지 확인할 수 있다.

### 리서치 에이전트 - 오케스트레이터와 리서처의 역할 분리

```bash
# 서브에이전트: 주제 하나만 깊이 리서치하는 역할
research_sub_agent = {
    "name": "research-agent",
    "description": "한 번에 하나의 주제만 리서치",
    "system_prompt": RESEARCHER_INSTRUCTIONS,
    "tools": [tavily_search, think_tool],
}

# 메인 에이전트: 계획을 세우고, 서브에이전트에 위임하고, 결과를 종합
agent = create_deep_agent(
    model=init_chat_model("anthropic:claude-sonnet-4-5"),
    tools=[tavily_search, think_tool],
    system_prompt=INSTRUCTIONS,
    subagents=[research_sub_agent],
)
```

여기서 몇 가지 설계 결정이 보인다.

**오케스트레이터는 직접 리서치하지 않도록 정의되어 있다.** 프롬프트에 "ALWAYS use sub-agents for research, never conduct research yourself"라고 적혀 있다. 메인 에이전트의 역할은 계획, 위임, 종합이지, 실행이 아니다.

**`think_tool`이라는 "아무것도 안 하는 도구"가 있다.** 실제 동작이 없는 생각 전용 도구다. 검색 결과를 받은 후 바로 다음 검색으로 넘어가지 않고, think\_tool을 호출해서 "지금까지 뭘 찾았고, 뭐가 부족한지" 성찰하게 만드는 장치다.

**위임 전략이 프롬프트에 구체적으로 정의되어 있다.**

```
기본: 1개 서브에이전트로 시작하라
병렬화는 "명시적 비교"가 요청될 때만.
  - "OpenAI vs Anthropic 비교" → 2개 병렬
  - "유럽, 아시아, 북미의 재생에너지" → 3개 병렬
하나의 포괄적 리서치가 여러 개의 좁은 리서치보다 토큰 효율적이다
```

### 콘텐츠 빌더 - 메모리, 스킬, 서브에이전트의 조합

```
agent = create_deep_agent(
    memory=["./AGENTS.md"],              # 브랜드 보이스, 스타일 가이드
    skills=["./skills/"],                # 블로그, 소셜미디어 워크플로우
    tools=[generate_cover, generate_social_image],
    subagents=load_subagents("subagents.yaml"),
    backend=FilesystemBackend(root_dir=EXAMPLE_DIR),
)
```

여기서 주목할 건 **설정의 외부화**다:

-   브랜드 가이드는 `AGENTS.md` 파일에
-   글쓰기 워크플로우는 `skills/blog-post/SKILL.md`에
-   서브에이전트 정의는 `subagents.yaml`에

코드를 한 줄도 고치지 않고, 파일만 수정해서 에이전트의 행동을 바꿀 수 있다. 프롬프트가 코드에 하드코딩되어 있으면 수정할 때마다 배포 사이클을 돌아야 하지만, 파일로 외부화하면 즉시 반영이 가능하다.

\---

## 정리: 이 코드베이스에서 눈여겨볼 설계 원칙들

Deep Agents를 뜯어보면서 정리한, 에이전트 하네스 설계 시 참고할 만한 구조적 결정들이다.

### 구조 설계

-   **미들웨어 패턴** — 기능 하나가 레이어 하나. 추가/제거가 조건문 한 줄.
-   **백엔드 프로토콜** — 테스트/개발/프로덕션에서 같은 에이전트 코드, 다른 저장소.
-   **검증된 런타임 위에 올리기** — LangGraph 같은 런타임 위에 설정 레이어를 얹는 접근.

### 컨텍스트 관리

-   **다단계 축소** — 인자 축약 → 자동 요약 → 이력 오프로딩. 가벼운 것부터 시도.
-   **서브에이전트 = 컨텍스트 격리** — 무거운 작업을 격리해서 메인 컨텍스트 보존.
-   **keep window** — 아무리 요약해도 최근 대화는 원본 유지.

### 프롬프트

-   **안티패턴 정의** — "하지 말 것"이 "할 것"만큼 중요하게 다뤄짐.
-   **하드 리밋** — 검색 횟수, 반복 횟수에 명시적 상한.
-   **설정 외부화** — 프롬프트를 코드가 아니라 파일([AGENTS.md](http://agents.md/), [SKILL.md](http://skill.md/))로 관리.

### 메모리

-   **단순하게 시작** — 벡터 DB 전에 마크다운 파일로도 충분한지 먼저 확인.
-   **저장 기준 정의** — "무엇을 기억하지 말아야 하는지"부터 정하는 접근.

\---

## 마치며

이 코드를 읽기 전에는 "에이전트 = 프롬프트 + 도구 + 루프"라고 생각했다. 읽고 나서는 그 공식에 한 항이 추가됐다.

> **에이전트 = 프롬프트 + 도구 + 루프 + "오래 살아남기 위한 인프라"**

컨텍스트를 관리하고, 작업을 격리하고, 기억을 정리하고, 실패에 대응하는 — 이 인프라 부분이 PoC와 프로덕션의 차이를 만든다. Deep Agents는 그 인프라가 어떤 모양이어야 하는지를 코드로 보여주는 참고 자료다.

직접 쓰든, 구조만 참고하든, **"에이전트가 실전에서 살아남으려면 어떤 뼈대가 필요한가?"**라는 질문에 대한 하나의 답이 이 코드베이스에 있다.

\---

-   Deep Agents GitHub: [https://github.com/langchain-ai/deepagents](https://github.com/langchain-ai/deepagents)

 [GitHub - langchain-ai/deepagents: Agent harness built with LangChain and LangGraph. Equipped with a planning tool, a filesystem

Agent harness built with LangChain and LangGraph. Equipped with a planning tool, a filesystem backend, and the ability to spawn subagents - well-equipped to handle complex agentic tasks. - langchai...

github.com](https://github.com/langchain-ai/deepagents)
