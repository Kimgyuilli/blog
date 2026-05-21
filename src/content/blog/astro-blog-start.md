---
title: "Astro로 파일 기반 블로그 시작하기"
description: "Markdown과 content collection으로 빠르게 운영하는 개발자 블로그의 기본 구조를 정리합니다."
pubDate: 2026-05-21
category: "infra"
tags: ["astro", "blog", "markdown"]
draft: true
slug: "astro-blog-start"
---

Astro는 정적 페이지를 빠르게 생성하고, 글 관리는 Markdown 또는 MDX 파일로 단순하게 유지할 수 있습니다.

## 글 저장 위치

이 블로그의 글은 `src/content/blog` 아래에 저장됩니다. 새 글을 추가할 때는 frontmatter에 필요한 메타데이터를 채우고 본문을 작성하면 됩니다.

## 공개 글 필터링

```ts
const posts = await getCollection('blog', ({ data }) => !data.draft);
```

`draft: true`로 표시한 글은 목록, 상세 페이지, RSS에 포함되지 않습니다.

## 운영 팁

파일을 추가한 뒤 `npm run build`를 실행하면 slug, 날짜, 태그 형식 오류를 빠르게 확인할 수 있습니다.
