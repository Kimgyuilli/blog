---
name: blog-post-pipeline
description: Take a series post in this blog from a source draft to a published article in one pass, with three user approval gates. Use when the user pastes a post brief ("다음 편 최종본을 작성해 주세요", 초안 경로, 출력 경로, 보편성 조건, 반드시 지킬 것) or asks to write, review, or publish a post end to end. Orchestrates developer-blog-writer, blog-interactive-demo, the humanize-korean pass fenced by the rewrite guard and lint:post, two independent review subagents (fact auditor and cold reader), and the publish:post script.
---

<!-- 생성된 파일: .agents/skills/blog-post-pipeline/ 에서 복사됩니다. 직접 고치지 말고 원본을 고친 뒤 `npm run sync:skills`를 실행하세요. -->

# Blog post pipeline

Every series post used to go through the same eleven rounds: draft, universality pass, restructure, demo additions, AI-tone cleanup, symbol and term cleanup, humanize pass, outside review, fact check against the source repository, then publishing. Most rounds were the user repeating corrections that never change. This skill moves those corrections to the front and leaves the user three decisions.

Writing rules live in `developer-blog-writer` (read `references/voice.md` before drafting). Demo rules live in `blog-interactive-demo` and `docs/animation-standards.md`. This skill only orders the work.

The prose check is layered. The `humanize-korean` plugin is the base: every post goes through it. The repository's own checks cover what it cannot verify, listed in `references/humanize-step.md`: that the rewrite kept every number, code span, and range marker (`guard:rewrite`), this author's rules (`lint:post`), demo text, the primary sources (fact auditor), and a reader's comprehension (cold reader).

## Phases

| Phase | Work | Gate |
|---|---|---|
| 1 Draft | Read the brief, the source draft, and voice rules. Draft. | |
| 2 Self-check | `npm run lint:post`, checklist, coverage table | **A: structure and demo plan** |
| 3 Demos | Build and verify in the browser | |
| 4 Humanize | `humanize-korean` pass, `guard:rewrite`, `lint:post` | |
| 5 Review | Fact auditor and cold reader, in parallel | |
| 6 Triage | One table of findings | **B: what to apply** |
| 7 Apply | Fix, re-run lint and build | |
| 8 Publish | Thumbnail candidates, `npm run publish:post` | **C: thumbnail and push** |

Keep the post in `draft: true` until phase 8. Never commit or push before gate C.

### 1. Draft

- Read the brief fully. `references/brief-template.md` lists its fields and the defaults for missing ones. Ask only for a missing fact the conclusion depends on, once, at the start.
- Read `developer-blog-writer`'s SKILL.md, `references/voice.md` (all of it, including "Prose the author has rejected"), the matching type guides, and `references/repository.md`.
- Read the source draft. Build a coverage table: every [핵심] item, every number with its condition, every limit, every demo spec. Keep it in the scratchpad; it is a working aid, not part of the post.
- Write the post following the voice rules from the first sentence. Humanize runs later as a check, not as a cleanup for rules you already know.

### 2. Self-check, then gate A

- Run `npm run lint:post <post>`. Fix every error. For each warn, either fix it or leave it on purpose (a quoted term, a legitimate contrast). The script also lints the demo components the post imports, and lists the external links to compare with the brief's allowlist.
- Answer `references/checklist.md`. Compare the post with the coverage table; restore any missing [핵심] item.
- **Gate A.** Show the user, in one message: the outline (part and section headings with one line each), which demo specs you will build or skip and why, any visual you propose beyond the specs, and any departure from the brief. Wait for approval. Restructuring after demos exist costs far more than here.

### 3. Demos

Follow `blog-interactive-demo` completely, including browser verification at wide and narrow widths, light and dark modes, and the `tsc --strict` check. Run `lint:post` again afterwards, because demo labels and disclaimers are linted too.

### 4. Humanize

Follow `references/humanize-step.md`: extract the body, run `humanize-korean` with the author conditions in every subagent prompt, check the result with `npm run guard:rewrite -- check`, review the diff, apply with `guard:rewrite -- apply`, then run `lint:post` and `npm run build`. Keep the list of changes you rejected; it goes in the gate B report.

Humanize is one layer, not the whole check. If its diagnosis names a pattern that `voice.md`, `lint:post`, or `checklist.md` does not cover yet, add it there (a lint rule when it is mechanical, a checklist line when it needs judgment) and mention it at gate B, so the next post catches it before humanize. If the plugin is unavailable, the checklist's prose rhythm section is the only judgment check; say so at gate B.

### 5. Independent review

Spawn two subagents in parallel, in the background, with the prompts in `references/`:

- **Fact auditor** (`fact-auditor-prompt.md`): reads the post, the demos, the brief, the source repository, and session logs if the brief names them. Traces each number to the primary source and recomputes ratios. It found the errors the author missed on the PeekCart 28 post: a throughput taken from a different run than claimed, a structural cap valid for only one of two conditions, a reserved-CPU calculation from the wrong base.
- **Cold reader** (`cold-reader-prompt.md`): reads only the post and the demos, as the reader named in the post's header comment. Fill `{{DO_NOT_SUGGEST}}` with the brief's approved wording and any other settled policies so it does not argue with them.

Do not give the cold reader the brief or the repository: its value is not knowing them. Do not ask either reviewer to edit files. While they run, re-read the post yourself for the checklist items that need judgment.

### 6. Triage, then gate B

Merge both reports into one table, deduplicated, each row with the post location and a one-line fix:

1. **Needs a fact** the reviewers could not settle. Check the source repository and session logs yourself first; ask the user only what remains.
2. **Will fix**: inside the evidence and the brief.
3. **Conflicts with policy**: the brief, voice rules, or an earlier user decision. Recommend declining and say which rule it conflicts with.

**Gate B.** Show the humanize summary (route, change rate, guard result, rejected changes) and the table, and wait for the user to choose. Do not apply anything before that.

### 7. Apply

Apply the approved rows. Re-run `npm run lint:post` and `npm run build`. If a fix changed a demo, re-verify that demo in the browser. If the fixes rewrote several paragraphs, run phase 4 again on the post with the light route ("가볍게"), fenced by the same guard.

### 8. Publish, then gate C

- Find two or three thumbnail candidates that fit the post's central idea. Unsplash pages block scripted downloads, so read the photo page with a web fetch to get its `images.unsplash.com/photo-…` URL, confirm it is free under the Unsplash License and not Unsplash+, and download a small preview to the scratchpad to look at it.
- **Gate C.** Show the candidates (preview, photographer, license, why it fits) and the commit you will push. Wait for the user's choice and approval to push.
- Run:

  ```bash
  npm run publish:post -- <post> --image "<images.unsplash.com URL>?fm=jpg&q=90&w=2400" [--focus-y 0.45]
  ```

  It crops to 1600x900, sets `image` and `draft: false`, runs lint and build, commits only the post, its demo folder, and the thumbnail, then rebases onto `origin/main` and pushes. Use `--no-git` to stop before committing, and check the crop by viewing `public/images/blog/<slug>/thumbnail.jpg`. If the rebase or push fails, stop and report what the remote has; do not force.

## Report

At each gate and at the end, say what you verified and what you could not (real-time demo speed, reduced motion, devices, sources the auditor could not reach).
