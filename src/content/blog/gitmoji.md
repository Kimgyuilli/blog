---
title: "Gitmoji에 대해 아시나요?"
description: "작성일: 2025/10/04 첫 아티클인데 gitmoji라는 git 컨벤션에 대해 소개해보려고 해요! 먼저 아래와 같은 git 컨벤션은 많이 보셨을 거라고 생각되는데요. 하지만 글이 많아지면 집중력이 급격히 떨어지는 저 같은 사람도 있습니다… 그래서 그런 사람들을 위한"
image: "/images/blog/gitmoji/image-01.png"
pubDate: 2025-11-10
tags: ["git"]
draft: false
slug: "gitmoji"
---
작성일: 2025/10/04

첫 아티클인데 gitmoji라는 git 컨벤션에 대해 소개해보려고 해요!

먼저 아래와 같은 git 컨벤션은 많이 보셨을 거라고 생각되는데요.

| 커밋 유형 | 의미  |
| --- | --- |
| `Feat` | 새로운 기능 추가 |
| `Fix` | 버그 수정 |
| `Docs` | 문서 수정 |
| `Style` | 코드 formatting, 세미콜론 누락, 코드 자체의 변경이 없는 경우 |
| `Refactor` | 코드 리팩토링 |
| `Test` | 테스트 코드, 리팩토링 테스트 코드 추가 |
| `Chore` | 패키지 매니저 수정, 그 외 기타 수정 ex) .gitignore |
| `Design` | CSS 등 사용자 UI 디자인 변경 |
| `Comment` | 필요한 주석 추가 및 변경 |
| `Rename` | 파일 또는 폴더 명을 수정하거나 옮기는 작업만인 경우 |
| `Remove` | 파일을 삭제하는 작업만 수행한 경우 |
| `!BREAKING CHANGE` | 커다란 API 변경의 경우 |
| `!HOTFIX` | 급하게 치명적인 버그를 고쳐야 하는 경우 |

하지만 **글이 많아지면 집중력이 급격히 떨어지는 저 같은 사람**도 있습니다…

그래서 그런 사람들을 위한 컨벤션이 있습니다!

![Gitmoji에 대해 아시나요?](/images/blog/gitmoji/image-01.png)

gitmoji를 사용한 컨벤션인데요, 각 커밋 유형을 글자가 아닌 이모지로 작성하는 방법입니다!

이 방법은 익숙해진다면 **더 직관적으로 커밋 유형을 파악**할 수 있고 **조금 더 화려하고 시각적으로 강렬한** git 히스토리를 볼 수 있게 됩니다.

이 컨밴션은 생각보다 인기가 많은 방법이어서 gitmoji를 사용하기 위한 cli와 vscode extention도 있는데요.

조금 더 자세한 내용이 설명돼있는 블로그 링크도 함께 첨부합니다!

[⚡️ Gitmoji 사용법 정리 (+ 깃모지 툴 소개)](https://inpa.tistory.com/entry/GIT-%E2%9A%A1%EF%B8%8F-Gitmoji-%EC%82%AC%EC%9A%A9%EB%B2%95-Gitmoji-cli)
