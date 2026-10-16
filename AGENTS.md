# 블로그 작업 안내

이 파일은 Codex와 Claude Code가 함께 읽는 작업 안내입니다. Codex는 이 파일을 직접 읽고, Claude Code는 `CLAUDE.md`가 이 파일을 불러옵니다.

## 스킬

스킬 원본은 `.agents/skills/` 하나입니다. Codex는 여기서 바로 읽고, Claude Code가 읽는 `.claude/skills/`는 사본입니다.

- 스킬은 **`.agents/skills/`에서만 고칩니다.** 고친 뒤 `npm run sync:skills`로 사본을 갱신합니다.
- `.claude/skills/`의 파일을 직접 고치지 않습니다. 사본이 원본과 같은지는 `npm run check:skills`로 확인합니다.

| 스킬 | 언제 |
| --- | --- |
| `developer-blog-writer` | 글을 쓰거나 고칠 때 (문체, 글 유형, 저장소 규칙) |
| `publish-from-obsidian` | Obsidian에서 쓴 글과 첨부 이미지를 가져올 때 |
| `blog-interactive-demo` | 글 속 애니메이션·인터랙티브 데모를 만들거나 고칠 때 |
| `blog-post-pipeline` | 브리프를 받아 연재 글을 초안부터 게시까지 진행할 때 (humanize-korean 윤문 기본, 승인 게이트 3개, 독립 리뷰 2개) |

## 글 검사와 게시

- `npm run lint:post <글>`: voice.md 의 기계적 규칙(기호, 금지 표현, 원어, 조사 띄어쓰기, 내부 번호)을 글과 글이 import 한 데모 문구에 검사합니다. error 가 있으면 실패합니다.
- `npm run guard:rewrite -- check <윤문 전> <윤문 후>`: humanize-korean 윤문이 수치, 코드, 표, 헤딩, 캡션, 링크, 추정과 측정 범위 표지를 그대로 두었는지 대조합니다. `extract`, `apply` 로 글 본문을 꺼내고 되돌려 넣습니다.
- `npm run publish:post -- <글> --image <URL>`: 썸네일을 1600x900 으로 넣고 draft 를 풀고, 검사와 빌드를 통과하면 커밋하고 push 합니다. 사용자가 사진과 push 를 승인한 뒤에만 실행합니다.

## 글 속 애니메이션·인터랙티브 데모

움직이는 그림, 단계 전환, 직접 해 보는 실험은 `blog-interactive-demo` 스킬의 절차를 따르고, 먼저 `docs/animation-standards.md`를 읽습니다.

- 장면 키트(`src/scripts/blog/scene/`, `src/styles/scene.css`)로 만듭니다. 패널을 바꿔 끼우는 대신 숫자 상태를 보간합니다.
- 같은 의미에는 문서의 "모션 어휘" 표에 있는 같은 움직임을 씁니다. 새 의미가 필요하면 표와 키트를 함께 늘립니다.
- 넓은 배치는 `viewBox` 폭 560, 좁은 배치는 좌표를 따로 둡니다.
- 완성 전 개발 서버에서 직접 확인합니다. draft 글은 `/preview/<slug>/`, 키트 견본은 `/dev/scene-kit/`에서 볼 수 있습니다. 문서의 완성 체크리스트를 모두 확인합니다.
