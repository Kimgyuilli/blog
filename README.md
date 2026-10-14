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

## Google Analytics 4

기본 측정 ID는 `G-9NKWCXKYVV`이며, 저장소를 빌드하면 자동으로 포함됩니다.
다른 ID를 사용하려면 `.env.example`을 `.env`로 복사하거나 배포 서비스의 빌드 환경변수를 설정합니다.

```dotenv
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

- 공통 레이아웃을 사용하는 블로그 페이지에서 페이지 조회를 수집합니다. 별도 앱인 `/portfolio/`는 포함하지 않습니다.
- `npm run dev`에서는 수집하지 않습니다. ID가 비어 있거나 형식이 잘못되면 GA 스크립트를 삽입하지 않습니다.
- ID를 변경할 때는 **빌드 환경변수** `PUBLIC_GA_MEASUREMENT_ID`를 설정하고 다시 빌드·배포합니다. 런타임 변수만 바꿔서는 정적 페이지에 반영되지 않습니다.
- 배포 후 사이트를 방문하고 GA4 실시간 보고서에서 수집 여부를 확인합니다.

연결 방식은 [Google의 Google tag 설정 문서](https://developers.google.com/tag-platform/gtagjs/configure)를 따릅니다.

## 포트폴리오 통합

별도 Vite/React 포트폴리오 프로젝트를 `/portfolio/` 경로로 함께 배포할 수 있습니다.

```bash
cd ../gyuill-portfolio
npm run build

cd ../blog
npm run sync:portfolio
npm run build
```

포트폴리오 프로젝트 위치가 다르면 `PORTFOLIO_DIR` 환경 변수로 지정합니다.

```bash
PORTFOLIO_DIR=/path/to/gyuill-portfolio npm run sync:portfolio
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
- 외부 링크는 `[Astro 문서](https://docs.astro.build/)`처럼 쓰면 본문에서 사이트 아이콘이 붙는 인라인 URL 멘션으로 표시됩니다. Markdown과 MDX 모두 적용되며, 표시 문구는 작성한 그대로 유지합니다(페이지 제목 자동 수집은 하지 않습니다).
- 아이콘은 해당 사이트의 `/favicon.ico`를 HTTPS로 불러오고, 실패하면 공통 아이콘을 표시합니다. JavaScript가 꺼져 있으면 일반 링크로 동작합니다. 내부 경로, 각주, 이미지 링크는 바꾸지 않으며, HTML/MDX에서 `data-no-link-mention` 속성을 붙인 링크나 영역은 제외할 수 있습니다.

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

## 공통 스타일 수정

파비콘 원본은 `public/favicon.svg`입니다. 수정한 뒤 `npm run generate:favicon`을 실행하면 ICO, 32px PNG, Apple 홈 화면 아이콘이 갱신됩니다. 공통 `BaseLayout.astro`에서 불러옵니다.

`BaseLayout.astro`는 `src/styles/global.css`만 불러옵니다. 이 파일은 아래 스타일을 순서대로 import하는 진입점입니다. 기존 선택자와 우선순위를 유지하기 위해 기본 스타일을 먼저, 기능별 스타일을 나중에 불러옵니다.

| 파일 (`src/styles/`) | 담당 영역 |
| --- | --- |
| `base.css` | 테마 변수, 초기화, 기본 타이포그래피 |
| `site-layout.css` | 사이트 헤더, 내비게이션, 페이지 여백, 푸터 |
| `post-list.css` | 글 카드, 태그, 카테고리, 빈 목록·404 |
| `home.css` | 홈 섹션, 공지, 사이드바 위젯 |
| `article.css` | 글 레이아웃, 본문, 표·이미지, 관련 글 |
| `article-tools.css` | 목차, 읽기 진행률, 이미지 확대 |
| `code-blocks.css` | 코드 창, 구문 색상, 줄 번호, 복사 버튼 |
| `link-mentions.css` | 외부 링크 멘션과 사이트 아이콘 |
| `extras.css` | 미니게임, 토스트 알림 |

반응형 규칙은 해당 기능 파일에서 함께 관리합니다. 개별 글의 데모 스타일과 장면 키트 스타일은 기존 파일을 사용합니다.

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
