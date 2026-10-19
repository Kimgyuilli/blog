# Shared voice

Use one recognizable voice across all seven article types. This voice is a synthesis of observed Korean blog patterns, not an imitation of any author or publication.

## Register and point of view

- Write explanatory and narrative prose consistently in Korean `-습니다` style. Use `-습니다`, `-ㅂ니다`, and `-입니다` according to the verb; avoid `-해요`, `-죠`, casual speech, and switching whole sections to plain `-다` prose. Questions in headings may use natural question forms.
- Sound like a developer explaining a real piece of work to another developer: approachable, specific, and willing to state limits. Let technical evidence carry confidence.
- Use `저` for the author's own experience only when the source supports it. Use `우리` or `팀` only when the source identifies a group. Do not manufacture personal scenes to make a concept article lively.
- An opening question is useful when the article genuinely resolves it. Otherwise begin with the situation, observation, or result. Avoid routine greetings and announcements of what the article will cover.

## Words and rhythm

- Prefer concrete verbs and nouns: `요청이 두 번 처리됐습니다`, `응답 시간이 줄었습니다`, `측정 조건을 맞췄습니다`. Name the exact component, failure, metric, and condition when known.
- Keep standard technical names and code identifiers intact. Explain a less familiar term at first use, then use it consistently. Prefer a familiar Korean word to unnecessary English business jargon, but keep the English term for technical concepts developers actually say in English (see "Prose the author has rejected").
- Use one main claim per sentence, but vary sentence length. Break paragraphs when the reasoning moves to a new step, not at a fixed sentence count.
- Prefer qualified findings (`이 조건에서는`, `측정한 범위에서는`) to grand claims (`완벽한`, `압도적인`, `무조건`). Avoid sales language, forced excitement, and habitual exclamation marks or emoji.
- End with what the evidence permits: a result, a decision, a remaining limit, or a next question. Do not add a generic moral or invitation to follow the blog.

## Prose the author has rejected

The author has corrected these patterns in post after post. Apply them while drafting, not as a cleanup pass. `npm run lint:post <file>` checks the mechanical part; the rest needs judgment. Quoted source code, command output excerpts, and external citations stay verbatim.

**Constructions**
- Contrast slogans: `A가 아니라 B`, `A가 아니고 B`, `A라기보다 B`, rhetorical `X보다 Y`, paired negations, symmetric slogan pairs. State the finding directly.
- Stock phrases: `질문은 하나입니다`, `더 근본적인 문제는`, `확실하게 말할 수 있는 것은`, `~인 셈입니다`, `~에는 의미가 있습니다`, `남은 것도 분명합니다`, `먼저 밝혀 둘 것이 있습니다`, `X에서 끝나지 않습니다`, `~편이 안전합니다`, section-ending aphorisms that restate the paragraph.
- Document citing: `기록은 ~라고 결론 냈다`, `측정 기록에 아래 표가 있습니다`, `주석/문서/runbook 에 이렇게 적혀 있었다`, `매뉴얼은 ~라고 설명합니다`, `한계로 적어 두었다`, `~한 기록은 없다`. For context write `기존 계획은 ~였습니다`; for unverified scope write `따로 검토하지 않았습니다`; for an external fact state it with a link.
- Reviewer attribution: `리뷰가 짚었다`, `계획 리뷰가 반박했다`. State the problem itself.
- Narrative time anchors: specific dates, `당시에는`, `지금 돌아보며`, `글을 쓰면서 확인했다`, `이 글을 쓰기 전까지`. Durations that are configuration or behavior (TTL 5초, 15일 유효) are fine. `당시 분석은` may refer to an earlier analysis by content.

**Words**
- Metaphor verbs: 닫다, 접다, 삼키다, 새다, 넘나들다, 끼어들다, 닿다, 집다, 잡다(fence 를 잡다), 꺼내다, 줄을 세우다, 약속한 순서, 테스트를 뒤집다, 결함을 거두다, 지연을 흡수하다. Use concrete verbs: 해결하다, 확정하다, 합치다, 막다, 순서대로 처리하다, 보장하려던.
- Translationese nouns: 판단, 관측, 성립, 수렴, 모양, 좌표, 표적, 선점, 표면, 표식, 단언, 판독, 처분, 결부, 공허한, 빈틈, 구멍, 이음매. Prefer the plain verb or the English term (claim, sentinel, assert, window).
- Keep the English term when developers say it in English: cache hit/miss/hit rate, period (CFS), quota, buffer pool, wait event, row lock wait, jitter, backoff, saga, side effect, contract test, starvation, wall-clock, task, millicore, load generator, consumer, `concurrency`, TTL, clock skew, replay, canary, fingerprint, opaque token, size class, off-heap, threshold, RSS, anonymous memory.
- Do not count copies of code, files, or documents with `벌` (`네 벌`, `한 벌씩`). Write `네 서비스의 사본`, `사본 네 개`, `공유 모듈 하나`.
- Do not add `출처:` caption paragraphs under code or output blocks. The author removes them. When an excerpt was shortened or edited in a way that matters, say so in the surrounding prose.
- Put a space between an English word or code span and the following particle, matching the rest of the post: `hit 이어도`, `miss 는`, `contract test 가`.

**Symbols**
- No em dash in prose. No `·` separators, no icon-like symbols (✓ ✕ ▶ ①②③ → ↔ … ÷ ′) in prose, tables, demo labels, or demo notes. Write words: `에서 ~으로`, `와`, `1, 2, 3`.
- Multipliers as `2.31배`, not `×2.31`. A missing value in a demo counter is `미측정`, not `—`.
- `±` and every symbol inside code or output excerpts stay.

## Reference patterns behind this synthesis

- [Toss product experiment](https://toss.tech/article/23819): an accessible progression from a concrete problem through action to outcome. Borrow its reader focus, not its sentence endings.
- [KakaoBank concept explainer](https://blog.kakaobank.com/posts/gold-safe-haven-guide): plain-language explanation, examples, and a clear statement of limitations.
- [Naver D2 engineering case](https://d2.naver.com/helloworld/5799075): technical context, structural cause, and measured evidence.
- [Velog troubleshooting record](https://velog.io/@hyodongg/CLUSTAR-S3-%EC%82%AD%EC%A0%9C%EC%99%80-DB-%EC%82%AD%EC%A0%9C-%EC%88%9C%EC%84%9C%EB%A1%9C-%EC%9D%B8%ED%95%9C-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%9D%BC%EA%B4%80%EC%84%B1-%EB%AC%B8%EC%A0%9C): explicit symptom, cause, options, and resolution.

These links inform the style decisions above. Do not reproduce their wording or impose their section layouts on unrelated articles.
