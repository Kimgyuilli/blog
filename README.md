# Astro Developer Blog

Astro 기반 정적 개발자 블로그입니다. GitHub 저장소에 올린 뒤 Cloudflare Pages에서 `npm run build`와 `dist` 출력 디렉터리로 배포할 수 있습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

빌드 확인:

```bash
npm run build
```

## 글 작성

글은 `src/content/blog`에 Markdown 또는 MDX 파일로 추가합니다.

```md
---
title: "글 제목"
description: "글 설명"
pubDate: 2026-05-21
tags: ["astro", "markdown"]
draft: false
slug: "post-slug"
---

본문을 작성합니다.
```

- `slug`는 실제 URL `/blog/post-slug/`에 사용됩니다.
- `draft: true`인 글은 목록, 상세 페이지, RSS에 포함되지 않습니다.
- 이미지는 `public/images/blog`에 두고 본문에서는 `/images/blog/file-name.png`처럼 참조합니다.

## 폴더 구조

```txt
src/
  content.config.ts
  content/blog/
  layouts/
  pages/
  styles/
  utils/
public/
  _redirects
  images/blog/
```

## Cloudflare Pages 배포

1. GitHub에 새 저장소를 만들고 이 프로젝트를 push합니다.
2. Cloudflare Pages에서 해당 저장소를 연결합니다.
3. Framework preset은 Astro를 선택하거나 직접 아래 값을 입력합니다.
4. Build command: `npm run build`
5. Output directory: `dist`

서브도메인 연결은 Pages 프로젝트의 Custom domains에서 `blog.rlarbdlf222.workers.dev` 같은 도메인을 추가하고 DNS 안내에 따라 설정합니다.

프로덕션 canonical URL과 sitemap URL은 빌드 시 `SITE` 환경 변수로 지정할 수 있습니다.

```bash
SITE=https://blog.rlarbdlf222.workers.dev npm run build
```

## 티스토리 마이그레이션

기존 글 URL과 새 URL 매핑은 `public/_redirects`에 기록합니다.

```txt
/123 /blog/new-post-slug/ 301
/entry/old-post-title /blog/new-post-slug/ 301
```

Cloudflare Pages는 빌드 후 `public/_redirects`를 배포 결과에 포함해 redirect 규칙으로 사용합니다. 티스토리 글을 Markdown으로 변환한 뒤 `src/content/blog`에 넣고, 이미지 경로를 `/images/blog/...`로 정리하면 목록과 상세 페이지에 자동 반영됩니다.

일괄 이전 스크립트:

```bash
npm run migrate:tistory
```

스크립트는 티스토리 sitemap에서 숫자형 글 URL을 수집하고, 이미 `public/_redirects`에 등록된 글은 건너뜁니다. 시험 실행이 필요하면 아래처럼 개수를 제한할 수 있습니다.

```bash
npm run migrate:tistory -- --limit=2
```
