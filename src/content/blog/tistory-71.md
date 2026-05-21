---
title: "나만의 개발자 포트폴리오 웹사이트 제작기"
description: "올해가 다 지나가고 있는 와중 학교에서의 마지막 시험을 끝내게 되었다. 물론 졸업 논문도 써야 하지만 다음 일정 전에 시간이 남아서 전부터 하고 싶었던 나만의 포트폴리오 사이트를 만들어보기로 했다. 이전까지는 노션으로 포트폴리오를 퍼블리싱했었다. 노션은 빠르게 포트폴리오를"
image: "/images/blog/tistory-71/image-01.png"
pubDate: 2025-12-10
category: "frontend"
tags: []
draft: false
slug: "tistory-71"
---
## 프로젝트 시작 배경

올해가 다 지나가고 있는 와중 학교에서의 마지막 시험을 끝내게 되었다. 물론 졸업 논문도 써야 하지만 다음 일정 전에 시간이 남아서 전부터 하고 싶었던 **나만의 포트폴리오 사이트**를 만들어보기로 했다.

### 노션 포트폴리오의 한계

이전까지는 노션으로 포트폴리오를 퍼블리싱했었다.

![나만의 개발자 포트폴리오 웹사이트 제작기](/images/blog/tistory-71/image-01.png)

노션은 빠르게 포트폴리오를 만들 수 있다는 장점이 있지만 개발자로서 아쉬운 점들이 많았다.

1.  **커스터마이징의 한계** - 디자인과 레이아웃을 자유롭게 변경할 수 없음
2.  **공유하기 불편함** - URL이 길고 복잡하며, 로딩 속도가 느림
3.  **차별화 부족** - 너무 많은 사람들이 사용해서 독창성이 떨어짐
4.  **브랜딩 약함** - 나만의 도메인과 디자인으로 정체성을 표현하기 어려움

이런 문제들을 직접 웹사이트를 만들어 해소해보기로 했다. (어차피 취업용 PDF 포트폴리오도 따로 만들어야 하니 웹사이트는 더 자유롭게!)

\---

## 📋 기획 및 설계

### 레퍼런스 조사

먼저 포트폴리오를 만들기 위한 레퍼런스를 찾아보았는데, 웹사이트 형태로 된 개발자 포트폴리오는 생각보다 많지 않았다. 대부분이 노션이나 PDF 형태였다.

그래서 Figma로 직접 디자인을 하고 **Claude AI와 함께 기획**을 진행하기로 했다. AI에게 내가 원하는 방향을 설명하고 다양한 레이아웃 아이디어를 받아 최적의 구조를 찾아갔다.

### 최종 섹션 구성

```
📍 Navigation Bar (고정 헤더)
   └─ 섹션별 스크롤 이동 + 다크모드 토글

📄 Section 1: Hero (이력서 형태의 포트폴리오 요약)
   └─ 프로필 사진, 자기소개, 학력, 소셜 링크

💻 Section 2: Skills (보유 스킬)
   └─ Frontend, Backend, Database, DevOps, Tools (5개 카테고리)

🚀 Section 3: Projects (진행한 프로젝트)
   └─ 카테고리 필터링 + 프로젝트 상세 모달

🏆 Section 4: Achievements (자격증, 수상 기록)
   └─ 시간순 정렬된 성과 목록

👔 Section 5: Experience (활동 경험)
   └─ 타임라인 형태의 경력 섹션

✍️ Section 6: Blog (블로그)
   └─ RSS 자동 업데이트 기능

📧 Section 7: Contact (연락처)
   └─ 이메일 전송 폼 + 연락처 정보
```

\---

## 🛠️ 기술 스택 선정

### React + TypeScript + Vite

기술 스택은 **React 18 + TypeScript**로 결정했다. 이유는 다음과 같다.

-   **React**: 가장 익숙하고 컴포넌트 재사용성이 뛰어남
-   **TypeScript**: 타입 안전성으로 개발 중 버그를 사전에 방지
-   **Vite**: CRA보다 월등히 빠른 빌드 속도와 HMR

### CSS Modules vs Tailwind CSS

초반에는 **Tailwind CSS**도 사용하려고 했는데 나랑 너무 안 맞는 스택이었다.

**Tailwind의 장점**

-   CSS 파일이 없어도 돼서 파일 구조가 간단함
-   유틸리티 클래스만으로 빠른 스타일링 가능

**하지만 내가 느낀 단점**

-   HTML 태그에 클래스가 너무 많아져서 **가독성이 크게 떨어짐**
-   복잡한 레이아웃을 구현할 때 **의도한 대로 배치가 잘 안 됨**
-   커스텀 디자인을 구현하기 위해 @apply를 남발하게 되는데 그럴 거면 그냥 CSS를 쓰는 게 낫다고 느껴졌다.

결국 **CSS Modules**를 선택했고 이 선택은 정말 잘한 것 같다. 컴포넌트별로 스타일이 분리되어 유지보수가 편하고 CSS 변수를 활용해 다크모드를 깔끔하게 구현할 수 있었다.

### 추가 라이브러리

-   **Framer Motion**: 부드러운 스크롤 애니메이션과 페이드인 효과
-   **next-themes**: 다크모드 구현을 위한 테마 관리 (localStorage 자동 저장)
-   **Lucide React**: 깔끔하고 일관성 있는 아이콘 세트
-   **EmailJS**: 백엔드 없이 이메일 전송 기능 구현

### 배포 플랫폼

배포는 항상 놀리고 있던 **GitHub Pages**를 사용했다. 무료이면서도 HTTPS를 기본 지원하고 Actions를 통한 자동 배포가 가능해서 최고의 선택이었다.

\---

## 🎨 디자인 시스템

### 컬러 팔레트

메인 컬러는 내가 좋아하는 **에메랄드 그린(Emerald)**을 선택했다. 내가 웹 개발을 시작했던 때와도 관련이 있는 색이다.

```
/* Light Mode */
--accent-primary: #10b981      /* Emerald 500 */
--text-primary: #0f172a        /* Slate 900 */
--bg-primary: #ffffff

/* Dark Mode */
--accent-primary: #34d399      /* Emerald 400 */
--text-primary: #f1f5f9        /* Slate 100 */
--bg-primary: #0f172a
```

### CSS 변수 시스템

모든 색상과 간격을 CSS 변수로 관리해서 테마 전환이 자연스럽게 이루어지도록 했다. globals.css에 100개 이상의 CSS 변수를 정의해 일관성 있는 디자인을 유지했다.

```
:root {
  /* Spacing System */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */

  /* Typography */
  --font-size-body: 1rem;
  --font-size-heading: 2.5rem;
  --line-height-relaxed: 1.75;
}
```

\---

## 💡 주요 구현 내용

이제 하나씩 구현을 시작했는데 특히 신경 쓴 부분들을 소개해보려 한다.

### 1\. Navigation Bar - 스마트한 섹션 감지

먼저 **Navigation Bar**의 경우 단순히 섹션별 이동만 하는 게 아니라 **현재 보고 있는 섹션을 자동으로 감지**하도록 구현했다.

**구현 포인트**

-   IntersectionObserver API를 사용해 스크롤 위치 감지
-   90% 줌 비율을 고려한 정확한 위치 계산
-   페이지 하단에 도달하면 자동으로 마지막 섹션 활성화
-   모바일에서는 햄버거 메뉴로 변환되는 반응형 UI

```
// 핵심 로직 (간략화)
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach((section) => observer.observe(section));
}, []);
```

**다크모드 토글**도 next-themes를 사용해 구현했는데 View Transitions API를 활용해 부드러운 전환 효과를 추가했다.

### 2\. Hero Section - 3열 레이아웃의 도전

-   **이력서 섹션(Hero)**은 포트폴리오 내의 모든 정보를 한눈에 보여주는 섹션으로 만들고 싶었다.

![나만의 개발자 포트폴리오 웹사이트 제작기](/images/blog/tistory-71/image-02.png)

**구조**

```
┌─────────────┬──────────────────┬─────────────┐
│ Left Column │  Center Column   │Right Column │
│             │                  │             │
│ Profile     │  Introduction    │   Stats     │
│ Contact     │  Education       │   Links     │
│ Social      │                  │             │
└─────────────┴──────────────────┴─────────────┘
```

**도전 과제**

-   3개 컬럼이 다양한 화면 크기에서 균형있게 배치되도록 반응형 구현
-   모바일에서는 1열로 자연스럽게 변환
-   프로필 사진에 호버 시 미묘한 애니메이션 효과

**해결 방법**

-   CSS Grid를 활용한 유연한 레이아웃
-   Framer Motion의 motion.div로 각 컬럼에 페이드인 효과 추가
-   @media 쿼리로 브레이크포인트별 세밀한 조정

### 3\. Projects Section - 필터링과 모달

**Projects 섹션**에서는 프로젝트를 카테고리별로 필터링할 수 있도록 구현했다.

![나만의 개발자 포트폴리오 웹사이트 제작기](/images/blog/tistory-71/image-03.png)

**주요 기능**

**카테고리 필터링**: All, Frontend, Backend, Mobile, AI

1.  **프로젝트 카드 애니메이션**: Framer Motion으로 부드러운 전환
2.  **상세 모달**: 프로젝트 클릭 시 전체 화면 모달로 상세 정보 표시
3.  **동적 링크 표기**: GitHub, Demo 링크 유무에 따라 버튼 표시 변경

**구현 포인트**

```
// 카테고리 필터링 로직
const filteredProjects = projects.filter(project =>
  selectedCategory === 'All' || project.category === selectedCategory
);

// 데모 링크 유무에 따른 조건부 렌더링
{project.demo && (
  <a href={project.demo} target="_blank" rel="noopener noreferrer">
    <button className={styles.demoButton}>
      Live Demo
    </button>
  </a>
)
```

**프로젝트 모달**에서는 다음과 같은 정보를 보여준다.

-   프로젝트 개요 및 배경
-   주요 기능 목록 (체크리스트 형태)
-   기술 스택 (Frontend/Backend/Database/Deployment로 구분)
-   도전 과제와 해결 방법
-   성과 및 배운 점

### 4\. Blog Section - RSS 자동 업데이트

**Blog 섹션**은 내가 블로그에 쓴 글을 **자동으로 업데이트**해주는 기능을 구현하고 싶었다.

![나만의 개발자 포트폴리오 웹사이트 제작기](/images/blog/tistory-71/image-04.png)

**구현 방법**

1.  **GitHub Actions** + **Cron** 기능으로 매일 자정 실행
2.  티스토리 **RSS 피드**에서 최신 포스트 데이터 가져오기
3.  blog.ts 파일 자동 업데이트
4.  변경사항 자동 커밋 및 배포

```
# .github/workflows/update-blog.yml
name: Update Blog Posts

on:
  schedule:
    - cron: '0 15 * * *'  # 매일 자정 (UTC+9 기준)
  workflow_dispatch:  # 수동 실행도 가능

jobs:
  update-blog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
      - name: Fetch RSS and update blog data
        run: node scripts/fetch-rss.js
      - name: Commit changes
        run: |
          git config user.name "github-actions"
          git add src/data/blog.ts
          git commit -m "chore: update blog posts"
          git push
```

**장점**

-   블로그 글을 쓰면 자동으로 포트폴리오에도 반영됨
-   수동 업데이트가 필요 없어 관리가 편함
-   RSS를 지원하는 모든 블로그 플랫폼에서 사용 가능

### 5\. Contact Section - 백엔드 없는 이메일 전송

마지막으로 **Contact 섹션**에서 나에게 이메일을 보내주는 기능을 구현해야 했다.

![나만의 개발자 포트폴리오 웹사이트 제작기](/images/blog/tistory-71/image-05.png)

백엔드를 따로 만들기는 싫어서 찾아보니 **EmailJS**라는 서비스를 발견했다.

**EmailJS의 장점**

-   무료로 매달 **200개의 이메일** 지원 (개인 포트폴리오에 충분)
-   설정이 간편하고 빠름 (5분이면 연동 완료)
-   이메일 템플릿을 커스터마이징 할 수 있음
-   React와의 연동이 쉬움

**구현 과정**

1.  EmailJS 계정 생성 및 이메일 서비스 연동 (Gmail)
2.  이메일 템플릿 작성 (발신자 정보, 메시지 내용 포함)
3.  React 폼과 연동

```
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setStatus('sending');

  try {
    await emailjs.send(
      'YOUR_SERVICE_ID',
      'YOUR_TEMPLATE_ID',
      {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
      },
      'YOUR_PUBLIC_KEY'
    );
    setStatus('success');
    setFormData({ name: '', email: '', message: '' });
  } catch (error) {
    setStatus('error');
  }
};

```

**폼 검증**도 추가해서 이메일 형식이 올바른지, 모든 필드가 채워졌는지 확인한다. 전송 중에는 로딩 스피너를 보여주고, 성공/실패 메시지도 표시한다.

\---

## 🎭 사용자 경험(UX) 개선

### 다크모드 / 라이트모드

next-themes 라이브러리를 사용해 **시스템 설정 감지**와 **사용자 선택 저장** 기능을 모두 구현했다.

```
// ThemeContext.tsx
const ThemeProvider = ({ children }) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

**구현 디테일**

-   첫 방문 시 사용자의 시스템 설정 감지
-   localStorage에 선택한 테마 저장
-   CSS 변수를 통해 모든 색상이 자동으로 전환
-   View Transitions API로 부드러운 전환 효과 (지원 브라우저에서만)

### 반응형 UI

모바일, 태블릿, 데스크톱 환경 모두에서 최적화된 경험을 제공하도록 반응형 디자인을 적용했다.

**브레이크포인트**:

```
/* Mobile First */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large Desktop */ }
```

**모바일 최적화**:

-   햄버거 메뉴로 네비게이션 최적화
-   카드 그리드 → 단일 컬럼 변환
-   터치 친화적인 버튼 크기 (최소 44x44px)
-   이미지 lazy loading

### 스크롤 애니메이션

**Framer Motion**을 활용해 스크롤 시 컨텐츠가 부드럽게 나타나도록 구현했다.

```
// FadeInSection.tsx
const FadeInSection = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};
```

이 컴포넌트로 모든 섹션을 감싸서 스크롤할 때마다 자연스럽게 컨텐츠가 나타나는 효과를 구현했다.

### 커스텀 스크롤바

브라우저 기본 스크롤바를 커스터마이징해서 디자인 일관성을 높였다.

```
/* Light Mode Scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #10b981;
  border-radius: 6px;
}

/* Dark Mode Scrollbar */
.dark ::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark ::-webkit-scrollbar-thumb {
  background: #34d399;
}
```

\---

## 🏗️ 프로젝트 아키텍처

### 데이터 중심 설계

포트폴리오의 가장 큰 특징은 **UI와 데이터의 완전한 분리**다. 모든 컨텐츠를 src/data/ 폴더에 TypeScript 파일로 관리한다.

```
// src/data/projects.ts
export const projects: Project[] = [
  {
    id: 1,
    title: 'Shamrock Tales',
    description: 'AI 기반 육아일기 변환 서비스',
    image: shamrockImage,
    category: 'AI',
    tech: {
      frontend: ['React', 'TypeScript', 'Vite'],
      backend: ['Django', 'OpenAI API'],
      database: ['PostgreSQL'],
      deployment: ['AWS EC2', 'S3']
    },
    // ... 더 많은 필드
  },
  // ... 더 많은 프로젝트
];
```

**장점**

-   포트폴리오 내용 업데이트가 매우 간편 (데이터만 수정하면 됨)
-   TypeScript 타입 체크로 데이터 무결성 보장
-   컴포넌트는 순수하게 프레젠테이션에만 집중
-   같은 데이터를 여러 곳에서 재사용 가능

### 컴포넌트 구조

```
components/
├── layout/           # 레이아웃 컴포넌트
│   └── Navigation/   # 네비게이션 바
├── sections/         # 페이지 섹션
│   ├── Hero/
│   ├── Skills/
│   ├── Projects/
│   └── ...
└── common/           # 재사용 컴포넌트
    ├── ProjectCard/
    ├── ProjectModal/
    ├── FadeInSection/
    └── ...
```

**설계 원칙**

-   **Atomic Design**: 작은 컴포넌트부터 조립하는 방식
-   **Single Responsibility**: 각 컴포넌트는 하나의 역할만 수행
-   **Presentational vs Container**: 데이터 로직과 UI 로직 분리

### CSS Modules 활용

모든 컴포넌트는 자신만의 CSS Module 파일을 가진다.

```
ProjectCard/
├── index.tsx
├── styles.module.css
└── styles.module.css.d.ts  (자동 생성)
```

**장점**

-   클래스명 충돌 방지 (자동으로 고유한 해시 생성)
-   컴포넌트별 스타일 캡슐화
-   CSS 파일을 import하면 TypeScript 자동 완성 지원
-   사용하지 않는 스타일은 빌드 시 제거 (Tree Shaking)

\---

## 🚀 배포 및 CI/CD

### GitHub Pages 배포

Vite 프로젝트를 GitHub Pages에 배포하기 위해 다음과 같이 설정했다.

**vite.config.ts**

```
export default defineConfig({
  base: '/gyuill-portfolio/',  // Repository 이름
  build: {
    outDir: 'build',
  },
});
```

**GitHub Actions 워크플로우**

```
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install and Build
        run: |
          npm ci
          npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

**배포 프로세스**

1.  main 브랜치에 코드 푸시
2.  GitHub Actions가 자동으로 빌드 시작
3.  build/ 폴더를 gh-pages 브랜치에 배포
4.  약 1-2분 후 사이트가 업데이트됨

### 성능 최적화

**Lighthouse 점수** (목표)

-   Performance: 95+
-   Accessibility: 100
-   Best Practices: 100
-   SEO: 100

**최적화 기법**

-   Vite의 코드 스플리팅으로 초기 로딩 속도 개선
-   이미지 lazy loading (ImageWithFallback 컴포넌트)
-   CSS Modules로 불필요한 스타일 제거
-   Framer Motion의 whileInView 옵션으로 뷰포트에 들어올 때만 애니메이션 실행

\---

## 🎓 배운 점과 개선할 점

### 배운 점

1.  **CSS Modules의 강력함**: Tailwind보다 나에게는 훨씬 더 직관적이고 관리하기 쉬웠다. CSS 변수와 결합하면 다크모드 구현도 깔끔하게 할 수 있다.
2.  **데이터 중심 설계**: UI와 데이터를 분리하면 유지보수가 정말 편하다. 프로젝트를 추가하거나 수정할 때 컴포넌트를 건드릴 필요가 없다.
3.  **TypeScript의 가치**: 타입 체크 덕분에 런타임 에러를 사전에 방지할 수 있었고 자동 완성으로 개발 속도도 빨라졌다.
4.  **Framer Motion의 편리함**: 복잡한 애니메이션을 선언적으로 간단하게 구현할 수 있어서 놀라웠다.
5.  **GitHub Actions의 활용**: RSS 자동 업데이트나 자동 배포처럼 반복 작업을 자동화하는 게 얼마나 편한지 깨달았다.

### 개선하고 싶은 점

1.  **블로그 섹션 개선**: 현재는 RSS 피드를 가져오는 방식인데, 더 풍부한 정보를 보여주고 싶다. 조회수 좋아요 수 등을 추가하면 좋을 것 같다.
2.  **접근성 개선**: 스크린 리더 사용자를 위한 ARIA 속성을 더 신경써서 추가해야겠다.
3.  **성능 측정**: Lighthouse 점수를 정기적으로 체크하고 개선 사항을 찾아야겠다.
4.  **A/B 테스팅**: 방문자 수, 클릭률 등을 추적해서 어떤 섹션이 더 효과적인지 분석하면 좋을 것 같다.
5.  **다국어 지원**: 영문 버전을 추가해서 해외 기업에도 지원할 수 있도록 하고 싶다.

\---

## 💭 마무리하며

포트폴리오 사이트 한 번쯤 만들어보는 것도 정말 좋은 것 같다.

**이 프로젝트를 통해 얻은 것**

-   나만의 브랜드를 표현할 수 있는 공간
-   React, TypeScript, CSS 실력 향상
-   디자인과 UX에 대한 고민

**예상보다 짧은 개발 기간** (4일)

-   Day 1: 기획, 디자인, 기술 스택 선정
-   Day 2: 기본 구조 구현 (Navigation, Hero, Skills, Projects)
-   Day 3: 나머지 섹션 구현 (Achievements, Experience, Blog, Contact)
-   Day 4: 반응형 UI, 다크모드, 애니메이션 추가 및 배포

물론 완벽하지는 않지만,지속적으로 개선해나갈 계획이다. 새로운 프로젝트를 진행할 때마다 더 나은 기술을 배울 때마다 이 포트폴리오도 함께 성장할 것이다.

**개발자 포트폴리오**는 단순히 내 경력을 보여주는 것을 넘어 **나의 성장 과정을 기록하는 공간**이자 **앞으로 나아갈 방향을 보여주는 나침반**이다.

이 글을 읽는 여러분도 나만의 포트폴리오 사이트를 만들어보길 추천한다!
