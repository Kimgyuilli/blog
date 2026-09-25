---
name: developer-blog-writer
description: Write or revise Korean developer-blog posts from source notes, drafts, code, or links for this repository. Use for article drafting and editing, not ordinary code changes.
---

# Developer blog writer

Turn the user's source material into a reviewable article for this blog. The blog covers backend development, technical decisions, operations, and side projects. Preserve the author's actual experience and the evidence behind each claim.

## Select the article type

Choose the type by the main question the reader should have answered. A topic or repository category is not an article type. Honor a type named by the user. If several types fit, use the one that carries the main conclusion and borrow supporting elements from the others.

| Main question | Read |
| --- | --- |
| What is this, how does it work, and when is it useful? | [Concept and principle](references/types/concept.md) |
| How was a feature or system built or applied? | [Implementation](references/types/implementation.md) |
| Why did something fail, and how was it fixed? | [Troubleshooting](references/types/troubleshooting.md) |
| Why was one design chosen over alternatives? | [Design decision](references/types/decision.md) |
| Did a change produce the intended effect? | [Experiment and validation](references/types/experiment.md) |
| What changed in the author's thinking after an experience, or what position is the author arguing? | [Reflection and perspective](references/types/reflection.md) |
| How is an algorithm problem solved? | [Algorithm solution](references/types/algorithm.md) |

Read [voice.md](references/voice.md) for every article. Read [repository.md](references/repository.md) when creating or changing a post file in this repository.

## Work from the source

1. Identify the intended reader, central point, article type, and facts supplied by the user. When revising a substantial source, make a coverage inventory of its distinct evidence, constraints, alternatives, code or configuration, measurements, and limits. Keep details needed to understand the conclusion or reproduce the work; the inventory is a drafting aid, not a required section in the article.
2. Distinguish observed facts, the author's interpretation, plans, and missing information. Do not invent firsthand events, tests, metrics, quotes, dates, or outcomes. If a missing fact is essential to the conclusion, ask for it; otherwise write around it or mark a specific item for the author's review.
3. Check version-sensitive technical claims against the relevant code or authoritative documentation when the source does not establish them. Cite external factual sources when they matter to the article. Inspiration blogs are style references, not evidence for technical claims.
4. Draft for the chosen reader question. Use the type guide as a coverage check, not a fixed heading template. Make the opening concrete and let the conclusion follow from the evidence.
5. Edit for factual fidelity, technical accuracy, a consistent voice, useful detail, and readable flow. Compare the draft with the coverage inventory: restore any missing observation, decision reason, operative setting, verification condition, or limitation that a reader needs. Consolidate repeated explanations and omit incidental boilerplate without setting a target length or preserving the source's layout. If the source explains terms that the intended reader needs, keep those explanations in a glossary or in the flow of the article. Remove unsupported certainty, generic praise, and search-keyword stuffing.

## Deliver the draft

When the request is to write a post in this repository, create a Markdown draft under `src/content/blog/` and return its path. If the user asks for text only, provide the draft in the requested format without creating a file. Keep a post in draft status unless the user explicitly requests publication-ready metadata. Do not overwrite a different existing article merely because a slug matches.

The user's earlier instruction remains in force: **do not use existing posts in this repository as references for tone or article structure**. Their metadata may be used to avoid duplicate topics and to connect related content; their bodies may be consulted for factual continuity only when the task calls for it. Do not copy sentences or distinctive phrasing from the external style references either.
