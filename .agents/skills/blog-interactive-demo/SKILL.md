---
name: blog-interactive-demo
description: Design, build, or improve animated and interactive demos inside a blog post in this Astro blog (MDX components under src/components/blog). Use when the user asks for an animation, interactive component, diagram that moves, step-by-step visual, or "try it yourself" demo for a post, says an existing demo feels lacking ("아쉬워요", "우와 할 수 있게"), or when publish-from-obsidian finds a passage worth a demo. Covers diagnosing the article's claim, choosing motions from the motion vocabulary, building with the scene kit, and verifying in the browser.
---

# Blog interactive demo

Demos in this blog must reach the quality of the PeekCart monolith-peel post (`src/content/blog/peekcart-monolith-peel-order.mdx`). That post is the reference implementation. A demo that swaps static panels or lists of text does not meet the bar.

**Read `docs/animation-standards.md` before writing any code.** It defines the motion vocabulary, timing tokens, layout sizes, and the completion checklist. This skill is the workflow; that document is the standard.

## Workflow

### 1. Read the whole post first

If the post is still being written, plan the visual with the `developer-blog-writer` skill's `references/visuals.md`, then return here to build it.


Read the full `.md`/`.mdx` and any existing demo components it imports. Before designing anything, understand the article's argument and where each demo sits in it.

### 2. Find the one change each demo must show

For each demo (existing or proposed), write one sentence in Korean: the change the reader should *see*. For example: "import 화살표만 믿고 Product를 떼면, 숨어 있던 호출이 끊어지며 부팅이 실패한다."

- If you cannot write the sentence, the demo is unnecessary, or it should be split.
- When improving existing demos, diagnose concretely why they fall short. The usual cause is that the motion the article describes (flipping, cutting, moving, emptying) never actually happens on screen.
- Prefer a **"try it yourself"** form when the reader can predict and be wrong, for example clicking the planned order and watching it fail. Use a lens toggle for "same thing, two views", and a timeline when order is the content.
- Check placement too. A demo that lets readers discover a surprise belongs *before* the prose reveals it. Suggest moves; do not rewrite prose without asking.

### 3. Map meanings to motions

Use the motion vocabulary table in `docs/animation-standards.md`: same meaning, same motion, across all posts. If you need a new meaning, add a row to the table and a part to the kit, not a one-off animation.

Use the same node colours (`--scene-hue-*`) for the same entity across every demo in the post.

### 4. Build with the scene kit

- Scripts: `src/scripts/blog/scene/` — `createScene` (numeric state + interpolation), `parts.ts` (node, flip link, call line, curve, boundary), `flip.ts`, `console.ts`, `step-player.ts`.
- Styles: `src/styles/scene.css` (semantic colour tokens). Elements created from JS need these global classes, because Astro scoped styles do not reach them.
- Markup: `InteractiveDemoFrame`, `DemoControls`, `SceneTimeline`, `SceneLegend`.
- Browse the parts live at `/dev/scene-kit/` on the dev server.
- Layout: wide `viewBox` width **560**. Below 560px demo width, use a separate narrow layout via `watchNarrow`; never just scale the wide one down.
- Structure: put the whole scene in one numeric state object and call `scene.go(next)`. For multi-part changes, use two phases: remove first (`duration.cut`), then draw and move (`duration.draw`). Guard async sequences with `const alive = scene.begin()`.
- Honesty: anything simplified or invented for illustration (example error messages, omitted paths) goes in `db-demo-disclaimer`. A demo must not assert facts the article does not.

### 5. Verify in the browser — required

Start the dev server (`npm run dev`) and open `/preview/<slug>/`, which works for drafts and is dev only. Code review alone is not verification.

- Click every button and step, including going backward, skipping steps, and interrupting mid-animation.
- Check the content width (~560px) and a narrow width (shrink `.db-demo`'s parent to ~360px with JS if the window cannot be resized).
- Check light and dark modes (toggle `document.documentElement.classList` `dark`).
- Check that text, lines, and labels do not overlap nodes, especially *after* nodes move.
- Measure layout stability: stage height should not jump between steps.
- Under browser automation, `requestAnimationFrame` may only advance when a screenshot is taken. Take several screenshots to step through, and do not misread throttled timing as a bug. Tell the user that real-time speed was not verified this way.
- Astro does not type-check `<script>` blocks. Extract each script to a temporary `.ts` next to the component, run `tsc --noEmit --strict`, then delete it.
- Run `npm run build`.

### 6. Report

Tell the user what changed and why, in terms of what the reader now sees. Say what you verified and what you could not, such as real-time speed, real devices, or reduced motion. Do not commit unless asked.

## Things to avoid

- Panel swaps (`hidden` toggles) as the main visual change
- New colours or motions that duplicate an existing meaning
- Wide `viewBox` sizes like 720 that shrink text to about ¾ in the article column
- Skipping browser verification, or declaring timing fine from throttled screenshots
- Editing the article's prose or moving demos without the user's confirmation
