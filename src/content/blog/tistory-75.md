---
title: "포트폴리오 웹사이트에서 이력서 PDF 자동 생성하기"
description: "취업을 준비하는 개발자로서 관리해야 할 것들이 많다. GitHub, 블로그, 이력서, 포트폴리오... 각각 따로 관리하다 보면 내용이 서로 달라지기 마련이다. 경력사항을 업데이트하면 이력서도 고치고 포트폴리오도 고치고 여기저기 흩어진 정보를 하나하나 동기화해야 한다. 이"
image: "/images/blog/tistory-75/image-01.png"
pubDate: 2026-02-13
category: "frontend"
tags: []
draft: false
slug: "tistory-75"
---
![포트폴리오 웹사이트에서 이력서 PDF 자동 생성하기](/images/blog/tistory-75/image-01.png)

## 포트폴리오 통합 관리의 필요성

취업을 준비하는 개발자로서 관리해야 할 것들이 많다. GitHub, 블로그, 이력서, 포트폴리오... 각각 따로 관리하다 보면 내용이 서로 달라지기 마련이다. 경력사항을 업데이트하면 이력서도 고치고 포트폴리오도 고치고 여기저기 흩어진 정보를 하나하나 동기화해야 한다.

이 문제를 해결하기 위해 포트폴리오 웹사이트를 직접 만들었다. React + TypeScript + Vite 기반의 SPA로 스킬, 프로젝트, 경력, 수상 내역 등 모든 정보를 한곳에서 관리한다. 모든 콘텐츠 데이터는 data/ 폴더에 분리해두었기 때문에, 내용을 수정할 때 데이터 파일 하나만 고치면 웹사이트에 바로 반영된다.

## 이력서도 자동으로 관리하고 싶다

웹사이트에 모든 정보를 모아두고 나니 자연스럽게 다음 생각이 들었다. **"이 데이터를 그대로 이력서 PDF로 만들 수 있지 않을까?"**

이력서를 따로 관리하면 결국 같은 문제가 반복된다. 경력사항을 웹사이트에 추가하고, 또 이력서 파일을 열어서 같은 내용을 적는 이중 작업. 웹사이트의 데이터를 Single Source of Truth로 삼아 PDF를 자동으로 생성하면 이 문제가 사라진다.

**목표는 이랬다.**

-   웹사이트 데이터 파일을 수정하면 이력서 PDF에도 자동 반영
-   사용자가 버튼 하나로 이력서를 다운로드할 수 있게

## PDF 생성 방법 비교

웹에서 PDF를 만드는 방법은 크게 세 가지가 있다.

### 1\. 브라우저 Print / window.print()

가장 간단한 방법이다. @media print CSS를 작성하고 브라우저의 인쇄 기능을 활용한다.

장점으로는 별도 라이브러리 없이 구현 가능하고 기존 HTML/CSS를 그대로 활용한다

단점으로는 브라우저마다 렌더링 결과가 다르고 페이지 나눔 제어가 어려우면서 이력서 전용 레이아웃을 만들려면 결국 별도 CSS가 필요하다.

### 2\. html2canvas + jsPDF

HTML 요소를 캔버스로 캡처한 뒤 이미지로 PDF에 삽입하는 방식이다.

장점으로는 화면에 보이는 그대로 PDF로 변환해 기존 컴포넌트를 재사용 할 수 있다.

단점은 결과물이 이미지이므로 텍스트 선택/검색을 할 수 없고 파일 용량이 크며 해상도에 따라 품질 차이 발생한다.

### 3\. @react-pdf/renderer

React 컴포넌트 문법으로 PDF 문서 자체를 직접 구성하는 라이브러리다. HTML을 캡처하는 게 아니라 PDF 전용 컴포넌트(Document, Page, View, Text 등)로 문서를 처음부터 만든다.

장점은 텍스트 기반 PDF로 검색/선택 가능, 레이아웃을 정밀하게 제어 가능, React 컴포넌트 패턴을 그대로 사용할 수 있다.

단점은 HTML/CSS를 그대로 쓸 수 없고 PDF 전용 컴포넌트로 다시 작성해야 함, Flexbox 기반이지만 지원하는 CSS 속성이 제한적이다.

### 선택: @react-pdf/renderer

**@react-pdf/renderer를 선택했다.** 결정적인 이유는 두 가지였다.

첫째, **텍스트 기반 PDF**라는 점이다. 이력서는 채용 과정에서 ATS(지원자 추적 시스템)를 통과해야 할 수도 있고 받는 사람이 내용을 복사하거나 검색할 수 있어야 한다. 이미지 기반 PDF로는 이걸 보장할 수 없다.

둘째, **React 컴포넌트 패턴과의 일관성**이다. 이미 프로젝트가 React + TypeScript 기반이고 데이터는 모두 타입이 정의된 객체로 관리하고 있다. @react-pdf/renderer는 같은 데이터를 같은 React 패턴으로 그대로 활용할 수 있다.

PDF 전용 컴포넌트를 새로 작성해야 한다는 단점이 있지만 이력서 레이아웃은 웹사이트 디자인과 다를 수밖에 없기 때문에 어차피 별도 작업이 필요하다고 판단했다.

## 구현

### 프로젝트 구조

PDF 관련 코드를 components/pdf/ 아래에 독립적으로 구성했다.

```
pdf/
├── PdfDownloadButton.tsx       # 다운로드 버튼 (진입점)
├── ResumePdf.tsx                # PDF 문서 루트 컴포넌트
├── fonts.ts                     # 한글 폰트 등록
├── styles.ts                    # PDF 전용 스타일
├── primitives/
│   └── SectionTitle.tsx         # 공통 섹션 제목
└── sections/
    ├── PdfHeader.tsx            # 프로필 + 연락처
    ├── PdfAbout.tsx             # 소개 + 학력
    ├── PdfSkills.tsx            # 기술 스택
    ├── PdfExperience.tsx        # 경력사항
    └── PdfAchievements.tsx      # 수상/자격
```

웹사이트의 섹션 구조(Hero, Skills, Experience, Achievements...)와 PDF의 섹션 구조를 대응시켰다. 그리고 핵심은 **데이터 소스를 완전히 공유한다**는 것이다.

```
// ResumePdf.tsx
import { heroData } from '@/data/hero';
import { skillCategories } from '@/data/skills';
import { experiences } from '@/data/experiences';
import { achievements } from '@/data/achievements';
```

웹사이트 컴포넌트와 PDF 컴포넌트가 동일한 data/ 파일을 import한다. 데이터를 한 곳에서 수정하면 웹사이트와 PDF 이력서가 동시에 업데이트된다.

### 한글 폰트 처리

@react-pdf/renderer는 기본적으로 한글을 지원하지 않는다. CDN에서 Spoqa Han Sans Neo 폰트를 등록하고 한글 하이픈 방지 처리를 추가했다.

```
// fonts.ts
Font.register({
  family: 'Spoqa Han Sans Neo',
  fonts: [
    { src: `${SPOQA_BASE}/SpoqaHanSansNeo-Regular.ttf`, fontWeight: 400 },
    { src: `${SPOQA_BASE}/SpoqaHanSansNeo-Medium.ttf`, fontWeight: 500 },
    { src: `${SPOQA_BASE}/SpoqaHanSansNeo-Bold.ttf`, fontWeight: 700 },
  ],
});

// 한글 단어가 중간에 잘리지 않도록 처리
Font.registerHyphenationCallback((word) => [word]);
```

### Lazy Loading으로 번들 최적화

@react-pdf/renderer는 번들 크기가 상당하다. 이력서 다운로드는 모든 사용자가 쓰는 기능이 아니므로 버튼을 클릭할 때 라이브러리를 로드하도록 했다.

```
// PdfDownloadButton.tsx
const handleDownload = async () => {
  // 클릭 시점에 라이브러리와 PDF 컴포넌트를 동시에 로드
  const [{ pdf }, { ResumePdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./ResumePdf'),
  ]);

  const profileImageBase64 = await fetchImageAsBase64(heroData.profileImage);
  const blob = await pdf(<ResumePdf profileImageBase64={profileImageBase64} />).toBlob();

  // Blob URL로 다운로드 트리거
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '김규일_이력서.pdf';
  a.click();
};
```

Promise.all로 @react-pdf/renderer와 ResumePdf 컴포넌트를 병렬 로드해서 대기 시간을 줄였다. 프로필 이미지는 PDF에 포함시키기 위해 base64로 변환한다.

### 스타일 시스템

@react-pdf/renderer는 CSS를 직접 쓸 수 없고, StyleSheet.create()로 스타일 객체를 만들어야 한다. Flexbox 기반이라 웹 CSS와 비슷하지만 지원하는 속성이 제한적이다.

웹사이트의 CSS 변수 색상값을 colors 객체로 매핑해서 웹과 PDF의 색상 톤을 맞췄다.

```
// styles.ts
export const colors = {
  accent: '#10b981',       // 웹사이트의 --color-accent와 동일
  textPrimary: '#0f172a',  // 웹사이트의 --color-text와 동일
  textSecondary: '#334155',
  // ...
};
```

## 마무리

이 구조의 가장 큰 장점은 **유지보수 비용이 거의 없다**는 것이다. 경력사항이 바뀌면 data/experiences.ts만 수정하면 되고 웹사이트와 이력서 PDF 모두 그 변경을 반영한다. 이력서 파일을 따로 열어서 수정할 필요가 없다.

물론 한계도 있다. PDF 전용 컴포넌트를 별도로 유지해야 하고 이력서에 새로운 섹션을 추가하려면 웹 컴포넌트와 PDF 컴포넌트를 각각 만들어야 한다. 하지만 **데이터는 하나로 관리한다**는 원칙이 지켜지는 한 이중 관리의 핵심 문제는 해결된다.
