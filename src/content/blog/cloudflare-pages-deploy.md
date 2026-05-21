---
title: "Cloudflare Pages 배포 체크리스트"
description: "Astro 정적 블로그를 Cloudflare Pages로 배포할 때 확인할 설정을 정리합니다."
pubDate: 2026-05-20
category: "infra"
tags: ["cloudflare", "deploy", "astro"]
draft: true
slug: "cloudflare-pages-deploy"
---

Cloudflare Pages에서는 GitHub 저장소를 연결한 뒤 빌드 명령과 출력 디렉터리만 맞추면 정적 블로그를 배포할 수 있습니다.

## 기본 빌드 설정

- Build command: `npm run build`
- Output directory: `dist`
- Node.js 버전: 프로젝트가 사용하는 Astro 버전에 맞는 최신 LTS 권장

## 커스텀 도메인

서브도메인 연결은 Pages 프로젝트의 Custom domains 메뉴에서 `blog.example.com` 같은 값을 추가하고 DNS 확인을 완료하면 됩니다.

## 배포 전 확인

RSS와 sitemap URL은 `SITE` 환경 변수에 설정한 도메인을 기준으로 만들어집니다.
