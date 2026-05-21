---
title: "React에서 컴포넌트의 css 파일이 적용될 때"
description: "React 프로젝트를 하면서 하나의 문제에 봉착했다. 현재 자료실, 오픈 게시판 페이지를 만들고 있는데 자료실의 css가 import 하지도 않은 오픈 게시판에 계속 적용되는 것이다. 원인원인은 css에서 클래스 선택자는 전역으로 사용되는 문제였다. 클래스 이름이 겹치기만"
pubDate: 2025-03-08
category: "frontend"
tags: ["react"]
draft: false
slug: "react-css"
---
React 프로젝트를 하면서 하나의 문제에 봉착했다.

현재 자료실, 오픈 게시판  페이지를 만들고 있는데 자료실의 css가 import 하지도 않은 오픈 게시판에 계속 적용되는 것이다.

원인
원인은 css에서 클래스 선택자는 전역으로 사용되는 문제였다. 클래스 이름이 겹치기만 하면 모든 해당 클래스 이름을 가진 태그에 css가 적용돼 버리는 것이다.

해결 방법

.module.css 사용

이전 다른 react 강의를 보면서 이걸 왜 사용하는 건지에 대해 이해를 안하고 넘어갔었는데 이런 것 때문에 쓰는 거였다.

```html
import styles from "./openBoard.module.css"

<div className={styles.main__container}></div>
```

이런식으로 사용하면 css 스타일은 전역이 아닌 해당 파일 내에서만 사용되게 된다.
