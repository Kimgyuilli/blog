---
title: "Maruni 개발 기록(1) - 욕심 덜어내기.."
description: "프로젝트 욕심을 덜어내고 실제 데모를 위해 클라이언트와 서버를 연결하며 마주한 설계 문제와 해결 과정을 정리합니다."
pubDate: 2025-11-07
category: "essay"
tags: []
draft: false
slug: "maruni-1"
---
개발일지 2

[https://imdeepskyblue.tistory.com/54](https://imdeepskyblue.tistory.com/54)

## 들어가며

졸업 프로젝트와 다른 활동들을 병행하면서 정작 핵심인 프로젝트에 대한 신경을 많이 못 쓰고 있었다. 그러다 데모 발표를 일주일 앞두고 본격적으로 클라이언트와 서버를 연결하는 작업을 시작했고 예상치 못한 여러 문제들이 연쇄적으로 터져나왔다.

이 글은 그 2일간의 문제 해결 과정을 기록한 회고다.

\---

## API 연결 과정에서 발견된 설계 결함

### 1\. 알림 시스템의 구조적 문제

클라이언트와 서버를 처음으로 연결하면서 가장 먼저 마주한 문제는 **알림 API의 설계 결함**이었다.

**발견된 문제점들:**

-   **카테고리 구분 없음**: 알림은 크게 3가지 타입이 있었다
    -   이상 징후 포착 (ALERT\_TRIGGERED)
    -   안부 메시지 (DAILY\_CHECK)
    -   보호자 등록 요청 (GUARDIAN\_REQUEST)
-   하지만 이들을 구분할 수 있는 타입 필드가 없었다
-   **알림 전송 미동작**: API를 호출해도 실제로 알림이 생성되지 않는 치명적 문제가 있었다.

```ts
// 기존: 타입 구분 없음
interface Notification {
  id: number;
  message: string;
  createdAt: string;
  isRead: boolean;
  // type 필드가 없었음!
}

// 수정 후: 명확한 타입 정의
interface Notification {
  id: number;
  type: 'ALERT_TRIGGERED' | 'DAILY_CHECK' | 'GUARDIAN_REQUEST';
  message: string;
  createdAt: string;
  isRead: boolean;
  relatedId: number; // 관련 엔티티 ID
}
```

### 2\. 클라이언트-서버 API 규격 불일치

더 큰 문제는 **클라이언트가 예상하는 API 규격과 서버의 실제 규격이 달랐다**는 것이다.

**문제의 원인:**

1.  **반-바이브 코딩**: 클라이언트 개발 초기, 완전히 이해하지 못한 상태로 코드 생성 도구에 의존
2.  **TypeScript 욕심**: TS를 제대로 학습하기 전에 사용하면서 타입 안정성을 오히려 저해

\---

## API 규격 통일 작업

가장 먼저 해야 할 일은 **API 규격을 통일하고 사용 가능한 API만 먼저 연결**하는 것이었다.

### 작업 내용

**공통 응답 타입 정의** (ApiResponse<T>)

```
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ErrorDetail;
}
```

### 커밋 기록

```
4940cb5 feat: 마지막 대화 불러오기 연동
9168d20 fix: 대화 창 돌아오기 스크롤 수정
97dc66b fix: 대화 기록 남는 문제 해결
ca87e28 feat: 타이틀 변경
6ac0f33 feat: api 최신에 맞춰서 수정
1a1fd87 docs: api 문서 업데이트
dcc90f8 docs: 문서 업데이트
46569a1 alertRule api 연결
b874191 feat: guardian api 구현
d923014 feat: conversation api 연결
7067de0 feat: member api 구현
514e66e feat: join api 연결
2d76c21 feat: auth api 추가
d26a20a api: api 연결 작업 수행
e179cc3 feat: phase8 진행
9a0068d feat: 공통 enum 타입정의
c8e69e2 feat: api 인터셉터 구현
2ad4cd7 feat: 기본 api 설정
4b71ef9 feat: apiResponse 타입 정의
501596e feat: api 연결 계획서 작성
6df8c0f docs: api 문서 추가
```

\---

## FCM 제거

API 규격을 통일한 후 이제 서버 로직을 수정해야 했다. 여기서 더 큰 문제를 발견했다.

**초기 설계의 문제점:**

-   해본 적도 없는 **PWA** 도입
-   **Firebase Cloud Messaging (FCM)** 으로 푸시 알림 구현
-   확장성과 서비스로서의 완성에만 집중
-   **정작 핵심 기능인 "대화 중 위험 신호 감지"와 데모의 구현, 그리고 짧게 주어진 개발 기간과 혼자서 모든걸 다 해야한다는 걸 간과하고 있었다.**

데모가 1주일 남은 시점에서 이 문제가 발견되었고 선택을 해야만 했다.

### 프로젝트 구조를 단순하게 바꾸자

-   FCM 완전 제거
-   PWA 푸시 알림 기능 제거
-   웹 기반 인앱 알림으로 단순화
-   핵심 기능인 "대화 중 이상 감지"에 집중

### 마이그레이션..

FCM을 제거하는 작업은 생각보다 훨씬 오래 걸렸다.

**주요 작업:**

1.  FCM 설정 파일 제거 (firebase-config.ts, fcm-service.ts)
2.  Push Token 관련 도메인 제거
3.  Notification 도메인 재설계
4.  각 도메인과의 의존성 제거
    -   Guardian 도메인 연동
    -   DailyCheck 도메인 연동
    -   AlertRule 도메인 연동
5.  Presentation, Application Layer 재구현
6.  테스트 코드 재작성

```bash
# 마이그레이션 커밋 기록 (24개 커밋)
b66fcf8 docs: notification 문서 업데이트
681bb80 feat: mock 관련 로직 간략화
7cb88c9 refactor: push token 파일 정리
26fbf06 refactor: fcm 관련 설정 파일 정리
985b701 refactor: fcm 관련 파일들 제거
76eba19 docs: notification 문서 업데이트
e7e3dbb test: test code 작성
a97bae5 feat(Notification): AlertRule Domain 연동
d6524b9 feat(Notification): AlertRule Domain 연동
a000010 feat(Notification): DailyCheck Domain 연동
4ecdd21 feat(Notification): Guardian Domain 연동
b783335 feat(Notification): Presentation layer 구현
015d646 feat(Notification): Application layer 구현
f291293 feat: notification decorator 확장
95eee2b feat(Notification): NotificationHistory 확장
e02b87f feat(Notification): NotificationHistory 확장
ad15a89 feat(Notification): NotificationType 정의
aac4621 feat: 간략화된 config 작성
11775c0 refactor: fcm 관련 코드 정리
ac3ca8d docs: notification 문서 수정
d19135c docs: 서버 변경 계획 수립
984fe4d docs: 알림 문제 정의 문서와 1차 수정 계획 작성
# ... (총 24개)

```

> 정신없이 작업하면서 커밋 메시지가 일관성을 잃었다. 급하게 작업할 때일수록 더 신경 써야 했다.

\---

## 알림 로직 재연결

다행히 서버 구조를 단순화한 후에는 알림 로직 연결이 빠르게 진행되었다.

### 추가적인 개선: 에러 처리 UX 향상

기존에는 에러 발생 시 무조건 **404 페이지**로 이동했는데, 이는 개발자에게 디버깅 정보를 제공하지 못하는 문제가 있었다.

**개선 방안:**

1.  **전용 에러 디버깅 페이지 구현**
    -   에러 메시지 표시
    -   에러 코드 및 상태 코드 표시
    -   스택 트레이스 (개발 모드)
    -   재시도 버튼
2.  **라우팅 전략 변경**
3.  // 404: 실제로 존재하지 않는 경로 <Route path="\*" element={<NotFoundPage />} /> // 에러: API 호출 실패, 권한 없음 등 <Route path="/error" element={<ErrorPage />} />

### 커밋 기록

```
1e6b318 fix: notification page 진입 버그 수정
437ed93 feat: error 디버깅 페이지 구현
9ac27c6 feat: 알림 로직 연결
```

\---

## 해결 과정 3: 운영 서버 배포 - SPA 라우팅 문제

마지막 관문은 **운영 서버와의 연결**이었다.

**배포 전략:**

-   **Backend (WAS)**: AWS EC2 + Spring Boot + Nginx (이미 HTTPS 구성 완료)
    -   Domain: [https://api.maruni.kro.kr](https://api.maruni.kro.kr)
-   **Frontend (WS)**: Vercel (빠른 배포)
    -   Domain: [https://maruni.kro.kr](https://maruni.kro.kr)

### 문제 발생: Vercel 404 에러

Vercel에 배포 후 /login, /register 등의 경로에서 **404 에러**가 발생했다.

```
GET <https://maruni.kro.kr/login> 404 (Not Found)
GET <https://maruni.kro.kr/favicon.ico> 404 (Not Found)
```

### SPA 라우팅 vs 서버 라우팅

원인을 찾아보니 아래와 같았다.

-   React Router는 **클라이언트 사이드 라우팅**을 사용
-   Vercel은 /login을 **실제 파일**로 찾으려 시도
-   파일이 없으므로 404 반환

**SPA의 동작 원리:**

1.  사용자가 /login 접근
2.  서버는 무조건 index.html 반환
3.  React가 로드되면서 /login 라우트 렌더링

하지만 Vercel은 이 과정을 자동으로 처리하지 않았다.

### vercel.json 설정

모든 경로를 index.html로 리다이렉트하도록 설정했다.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 결과: 성공!

```
844d5ca fix: Add vercel.json for SPA routing
```

배포 후 모든 라우팅이 정상 동작했고 일단 급한 불은 끄게 됐다.

\---

## 마치며

처음부터 FCM, PWA 같은 "멋진 기능"에 집중했지만, 정작 핵심 가치인 \*\*"대화 중 위험 감지"\*\*는 제대로 구현하지 못했다. 핵심 기능에 대한 검증의 중요성을 절실히 깨닫게 되었다. 빠르게 완성된 프로젝트를 내놓고 싶다는 생각에 성급했던게 문제였다.

### **API 문서화의 중요성**

클라이언트와 서버의 API 불일치는 초기 문서화 부재에서 시작되었다. 바이브 코딩을 할 때 ai가 인식하는 서버의 spec을 항상 동기화를 해줘야 했는데 너무 빠르게 해치우려고 했다.

### **점진적 학습의 중요성**

TypeScript를 제대로 이해하지 못한 채 사용하면서 오히려 생산성이 떨어졌다. js같은 조금 더 학습 경험이 있는 스택을 썼다면 이렇게까지 흐름을 파악을 못하지는 않았을텐데 욕심이 앞선 것에 반성을 하게 된다..

\---

## 앞으로의 계획

급한 불은 껐지만 아직 할 일이 많다.

### 1주일 안에 해야 하는 작업들

1.  변경된 아키텍처 문서화
2.  대화 중 위험 신호 감지 로직 고도화
    -   현재: 키워드 기반 단순 매칭
    -   목표: 맥락을 고려한 감정 분석
3.  데모 시연 준비

먼저 문서화를 다시 진행하려고 한다.

화이팅..!
