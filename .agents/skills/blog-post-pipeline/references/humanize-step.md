# Humanize step

Every post goes through the `humanize-korean` plugin skill (`/humanize-korean:humanize`). It is the base prose check: it finds AI-tell patterns no word list can, such as uniform rhythm, paragraph-closing summary sentences, enumeration previews, symmetric pairs, and commas after connective endings. It rewrites the text, so it is fenced by the checks that follow it.

## What humanize does not verify, and what does

| Gap | Check |
|---|---|
| Numbers, inline code, code blocks, tables, headings, component lines, captions, links, and range markers ("(추정)", "로컬 재현", "재지 않았습니다") survive the rewrite | `npm run guard:rewrite -- check` (before applying) |
| This author's rules: no `·` or icon symbols, original English terms, no internal or episode numbers, document-citing phrasing, metaphor verbs, particle spacing after English, "당시에" | `npm run lint:post` (after applying). Humanize can introduce these; on the PeekCart 28 post it introduced "당시". |
| Demo text in `.astro` components | `lint:post`; humanize never sees it. Read demo notes yourself for tone. |
| Claims match the primary source | Fact auditor |
| A reader without context can follow | Cold reader |
| Structure, universality, honesty of scope | `checklist.md` |

## Procedure

Run it after demos are built and before the independent reviews, so both reviewers read the final prose. Work in the scratchpad: humanize writes `_workspace/` under the current directory.

1. Extract the body (everything after frontmatter, imports, and the header comment):

   ```bash
   cd <scratchpad> && node <repo>/scripts/rewrite-guard.mjs extract <repo>/<post> _workspace/<run_id>/01_input.txt
   ```

   Then follow the `humanize-korean` SKILL.md from Phase 1 on with that `01_input.txt` and `--genre blog`. A series post is long enough that `route_hint` is almost always `heavy`. Run the diagnosis, then a single monolith call on `01_input_with_metrics.txt`: do not pass `--chunk`, because the shim splits a post into dozens of chunks by heading and the seams change the voice. Later passes after edits use the light route on the whole post.

2. Pass the author conditions below, verbatim, in every subagent prompt: diagnostician, monolith, and finalizer. Without them humanize treats English terms as "excessive English quotation" and suggests translating them, and may change the formal ending.

3. Run the plugin's own gates (`restore_modality.py`, `strip_injected_commas.py`, `verify_gates.py`). Do not pass `--all` to `strip_injected_commas.py`, even when the diagnosis names C-11: it also strips commas inside table cells, and the guard then rejects every changed table row. Then run the guard:

   ```bash
   node <repo>/scripts/rewrite-guard.mjs check _workspace/<run_id>/01_input.txt _workspace/<run_id>/final.md
   ```

   An error means a number, code span, protected line, or explicit range marker changed. Restore that span from `01_input.txt` in `final.md`, or send it to the finalizer as a named issue. A warn needs a look: a number repeated after a sentence split can also mean a claim got stronger (on PeekCart 28, a split sentence turned "the two measurements pointed to the same place" into "the ceiling was the MySQL CPU limit in both").

4. Read the diff paragraph by paragraph. Reject changes that alter a claim's strength or scope, or that conflict with an earlier decision by the user. Keep a list of rejected changes with a reason for the report. Changes seen on earlier posts that need rejecting: a connective made causal ("찾는데" to "찾으므로"), a deleted sentence that carried a scope or a distinction, an inline code span dropped while merging sentences, a phrase that no longer parses ("기록에는 V5 로 썼지만"). The guard catches the dropped code span; the others need reading.

5. Apply. The command refuses if the post changed since extraction or the guard still fails:

   ```bash
   node <repo>/scripts/rewrite-guard.mjs apply <repo>/<post> _workspace/<run_id>/01_input.txt _workspace/<run_id>/final.md
   ```

6. Run `npm run lint:post <post>` and `npm run build` in the repository.

Report: route, change rate, grade, the gate results, counts by pattern before and after, the guard result, and the changes you rejected.

If the plugin is not installed (for example, in Codex), say so at gate B and continue with `lint:post` and the checklist.

## Author conditions

```
필자 고정 조건(이 조건과 충돌하는 진단이나 윤문은 하지 않습니다):
1. 합쇼체 "-습니다" 를 유지합니다. 종결어미 다양성이 낮게 나와도 해요체, 한다체, "-죠"로 바꾸지 않고, 같은 격식체 안에서 리듬만 조정합니다.
2. 기술 용어는 원어 그대로 둡니다(cache hit, miss, period, quota, jitter, buffer pool, side effect, contract test, starvation, wall-clock, task, millicore 등). 한국어로 번역하지 않고, "영어 인용 과다"로 진단하지 않습니다.
3. 가운뎃점(·), em dash, ✓ ✕ → ① ▶ … 같은 기호를 새로 넣지 않습니다.
4. 표(| 로 시작하는 줄), 코드 블록, 인라인 코드, <Component /> 줄, 헤딩, "(측정 기록에서 발췌)" 같은 캡션, 모든 수치, 따옴표 안 인용, 굵은 글씨 위치는 그대로 둡니다. 문단 순서와 문단 구분도 유지합니다.
5. "A가 아니라 B" 대비, "문서/주석/기록에 ~라고 적혀 있었다"류 인용투, 번역투 조어(판단, 관측, 성립, 수렴, 모양 등), 비유 동사(닫다, 접다, 틈, 삼키다 등), "당시에" 같은 서술 시점 표지를 새로 만들지 않습니다. 원문에 남아 있다면 지배 패턴으로 지목합니다.
6. 측정 범위와 확신 정도의 표지("(로컬 재현)", "(추정)", "재지 않았습니다", "확인하지 않았습니다", "~했을 것입니다")는 내용입니다. 지우거나, 덮는 범위를 바꾸거나, 단정으로 바꾸지 않습니다.
7. 문장을 나누거나 합칠 때 주장의 강도를 바꾸지 않습니다. "같은 곳을 가리켰다"를 "원인은 X였다"로 바꾸는 식의 변경은 하지 않습니다.
8. 연결어미를 바꿀 때 인과나 확신을 더 강하게 만들지 않습니다("-는데"를 "-으므로"로 바꾸지 않음). 문장을 지우지 않습니다. 문단마다 인라인 코드의 개수와 내용을 그대로 둡니다.
```
