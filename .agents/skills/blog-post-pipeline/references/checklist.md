# Self-check questions

Answer these before gate A and again before handing the reviewed draft back. They cover the judgment calls `lint:post` cannot make. Each one is a correction the author has had to request on an earlier post.

## Universality
- Could a reader who has never heard of this project apply the central trap to their own system? Is the trap named in a heading, not only in the conclusion?
- Are project-specific mechanics (lint rules, planning or review procedures, cluster session operations, debt numbers) cut to what the conclusion needs?
- Does every generalization stay inside what the evidence covers? Is the ending a result, decision, or remaining limit, not a lesson or flourish?

## Structure
- Does each part answer one question, in an order where nothing is explained after it is used? Look for: a result table that appears before the section explaining its condition; a term or class name used before it is defined; context placed far before the part that needs it.
- Is any explanation repeated in two places? Keep the fuller one and point to it.
- Does every section end on its content, not on a restating aphorism?

## Evidence and honesty
- Is every number traceable to the brief, with its condition (load, duration, limit, version, instance count) stated where it is used?
- Are measurements from different environments (cluster and local reproduction, earlier and later sessions) kept out of one table or chart, and is each local value labeled?
- Is each output block one the brief marks as an excerpt, labeled with its source?
- Are inferences marked as inferences? Is a retrospective section marked as such in its first paragraph?
- Where a measurement could have another explanation, is it stated or the claim narrowed?

## Prose rhythm (before humanize, without it)
`lint:post` cannot see these, and humanize must not be the only check for them. Each was found in this author's posts.
- Does a paragraph end on a sentence that restates it ("~라는 뜻입니다", "~인 것입니다", a one-line verdict)? Cut it or fold the content into the paragraph.
- Is a list announced by its count ("한계가 셋입니다", "접근은 두 가지", 첫째/둘째)? State the items directly.
- Does a sentence only announce what comes next or point at emphasis ("달라진 점은 이것입니다", "세 번째 줄이 중요합니다", "이유는 따로 있었습니다")? Fold it into the sentence that carries the content.
- Are two clauses or sentences built as a mirrored pair, or is a finding framed as a denial ("X 는 오기가 아닙니다", "~대신")? Say what happened.
- Is the subject an abstraction doing a generic verb ("카운터가 구별을 해 줍니다")? Make the person or the system the subject.
- Do several sentences in a row share the same length and ending? Vary them inside the formal "-습니다" style.
- Are commas placed after every connective ending ("~했고,", "~해서,")? Keep them only where the subject changes in a long sentence.
- Does a metaphor verb that is not in `voice.md` yet carry the meaning? Use a concrete verb.
- Are findings framed as cleft sentences ("~한 것은 X입니다", "~한 곳은 X입니다", "이유는 X에 있습니다") more than once or twice? Put the subject first and state it.
- Does a noun carry three or more stacked modifier clauses ("A 를 읽어 B 에서 C 까지 이어지는지 확인하는 검사 스크립트")? Name the thing first, then describe it in its own sentence.
- Is one verb, often "확인했습니다", doing most of the work? Use the specific action (대조했습니다, 다시 받았습니다, 실패했습니다). Leave scope markers such as "확인하지 않았습니다" as they are.
- Is a plan or prediction cited as a document ("계획에는 ~가 있었다", "주석에 남은 이유는")? Make the author or the team the subject: "~하기로 계획했습니다", "~라고 추정했습니다".

## Visuals
- Does each demo show a change the prose describes, built per `blog-interactive-demo`? Is a discovery scene placed before the prose reveals its answer?
- Does each demo's disclaimer state what is measured, what is illustrative, and the model's limits from the brief?
- Would a timeline, toggle, or comparison make a central distinction visible that prose and tables leave abstract? Propose it at gate A instead of adding it silently.
