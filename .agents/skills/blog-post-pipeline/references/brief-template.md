# Brief template

The user starts a post by pasting a brief. Read every field before drafting. If a field is missing and the conclusion depends on it, ask once at the start; otherwise use the default noted here.

```markdown
developer-blog-writer 스킬로 <연재명> 다음 편 최종본을 작성해 주세요.

- 입력: <초안 경로>            # 사실의 원천. §2 사실, §3 [핵심]/[보조] 재료, 데모 명세(<!-- 데모: -->)
- 원천 레포: <경로>             # fact auditor 가 1차 자료로 내려갈 곳. 없으면 "없음"
- 세션 기록: <경로 | 없음>      # 측정 명령과 출력이 남은 작업 기록(JSONL 등)
- 출력: src/content/blog/<파일명>.mdx (draft 유지)
- 제목: <제목>
- 메타: 초안 §1 의 승인된 description, category, tags 를 그대로 씁니다
- 글 유형: 주 <type>, 보조 <type>

보편성 조건
- 독자: <누가 자기 시스템에 대입할 수 있어야 하는가>
- 중심이 되는 재현 가능한 함정: <목록>
- 프로젝트 고유 장치는 결론에 필요한 만큼만

반드시 지킬 것
- 초안 §2 의 사실, 수치, 조건, 한계를 지킵니다. §3 [핵심] 항목이 빠지지 않았는지 대조합니다.
- <측정 출처 분리 규칙: 예) 클러스터 수치와 로컬 재현 수치를 한 표나 그래프에 섞지 않는다>
- 출력 블록은 초안에 "발췌"로 표시된 것만 씁니다.
- 본문에 다른 편 번호, 내부 부채/ADR/PR 번호, 리뷰 절차명을 쓰지 않습니다.
- 데모: 초안의 데모 명세를 후보로 blog-interactive-demo 스킬 기준으로 판단합니다.
- 외부 근거 링크는 <허용 목록>만 씁니다.
- 승인된 문구라 리뷰에서 바꾸자고 하지 말 것: <제목, description 등>
```

Defaults when a field is absent:
- 원천 레포 / 세션 기록: the fact auditor works from the draft alone and reports the unchecked range.
- 외부 링크 허용 목록: links the draft cites; any new link needs the user's approval at gate B.
- 승인된 문구: title and description from the draft's §1.
