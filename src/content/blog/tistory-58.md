---
title: "코드리뷰 고수인척 하기 튜토리얼"
description: "작성일: 2025/10/10 안녕하세요! 이번엔 코드리뷰를 할 때 고수처럼 보일 수 있는 약어들을 소개합니다:) 리뷰는 상대방이 알아들을 수 있게 해야 하지만 가끔은 좀 있어보이게 리뷰하고 싶지 않나요? 혹은 다른 사람이 처음 보는 단어를 쓰며 리뷰를 해서 당황했던 적이 있지"
image: "/images/blog/tistory-58/image-01.png"
pubDate: 2025-11-12
tags: []
draft: false
slug: "tistory-58"
---
작성일: 2025/10/10

![코드리뷰 고수인척 하기 튜토리얼](/images/blog/tistory-58/image-01.png)

안녕하세요! 이번엔 코드리뷰를 할 때 고수처럼 보일 수 있는 약어들을 소개합니다:)

리뷰는 **상대방이 알아들을 수 있게** 해야 하지만 가끔은 좀 **있어보이게** 리뷰하고 싶지 않나요?

혹은 다른 사람이 **처음 보는 단어**를 쓰며 리뷰를 해서 당황했던 적이 있지 않나요?

**이번 기회에 여러 약어들을 익혀놔서 이런 상황에 공격, 방어를 해보는건 어떨까요!**

## 코드 리뷰 & PR

-   **LGTM** (Looks Good To Me) - 문제없어 보입니다
-   **SGTM** (Sounds Good To Me) - 좋아요, 동의합니다
-   **ACK** (Acknowledged) - 확인했어요
-   **NACK** (Negative Acknowledgment) - 확인했지만 문제가 있어요
-   **PTAL** (Please Take A Look) - 검토 부탁드립니다
-   **WIP** (Work In Progress) - 작업 중입니다(PR 제목에 붙여서 아직 리뷰하지 말라고 표현할때)
-   **NIT** (Nitpick) - 사소한 의견 제안
-   **RFC** (Request For Comments) - 의견 요청합니다

## 의견 표현

-   **IMO / IMHO** (In My Opinion / In My Humble Opinion) - 제 생각엔
-   **AFAIK** (As Far As I Know) - 제가 아는 한에서는
-   **IIRC** (If I Recall Correctly) - 제 기억이 맞다면
-   **TBH** (To Be Honest) - 솔직히 말하면
-   **WDYT** (What Do You Think) - 어떻게 생각하세요?
-   **YMMV** (Your Mileage May Vary) - 상황에 따라 다를 수 있어요

## 프로젝트 관리

-   **ETA** (Estimated Time of Arrival) - 작업 완료 예상시점
-   **ASAP** (As Soon As Possible) - 가능한 빨리
-   **EOD / EOW** (End Of Day / End Of Week) - 오늘/이번 주 내로
-   **P0, P1, P2** (Priority 0, 1, 2) - 우선순위 표시
-   **TBD / TBA** (To Be Determined / To Be Announced) - 미정
-   **POC** (Proof Of Concept) - 개념 증명

## 정보 공유

-   **FYI** (For Your Information) - 참고하세요
-   **TL;DR** (Too Long; Didn't Read) - 긴 내용 요약
-   **RTFM** (Read The Manual) - 문서 먼저 읽어보세요 (무례할 수 있음)

## 코딩 원칙

-   **KISS** (Keep It Simple, Stupid) - 단순하게 유지하세요
-   **DRY** (Don't Repeat Yourself) - 중복 코드 작성하지 마세요
-   **YAGNI** (You Aren't Gonna Need It) - 필요없는 기능 미리 만들지 마세요

## 일상 커뮤니케이션

-   **AFK** (Away From Keyboard) - 잠깐 자리 비워요
-   **BRB** (Be Right Back) - 금방 돌아올게요

### 아래는 위의 약어를 사용한 예시입니다

## 초보

LGTM입니다!

수고하셨습니다. PTAL 부탁드려요~

WIP입니다. ETA는 내일 오전까지 예상됩니다.

## 중급

전체적으로 LGTM인데, NIT으로 변수명 컨벤션 몇 개만 코멘트 남겼습니다!

접근 방식은 ACK인데요, IMHO DRY 원칙 적용하면 더 좋을 것 같아요. FYI UserService에 비슷한 로직 있습니다.

SGTM! 한 가지 NIT인데, AFAIK 저희 코드베이스에선 보통 Optional<T> 쓰는 것 같아요.

## 고급

성능 이슈 PTAL 부탁드립니다. IIRC #1234에서 비슷한 케이스 있었던 것 같은데, 데이터 크기에 따라 YMMV라서 IMO 고려해볼 만할 것 같습니다.

전반적으로 LGTM이고 몇 가지 NIT만 있습니다. TBH 가독성 측면에서 빌더 패턴 선호하는데 YMMV인 것 같네요. ASAP은 아니고 EOW까지 괜찮습니다. WDYT?

POC 방향성은 ACK입니다. RFC드리는데 null 값 엣지 케이스도 처리해야 할까요? AFAIK Spring의 @Valid는 이 시나리오 커버 안 되는 걸로 알고 있습니다. FYI #567에 관련 논의 있어요.

## 심화

SGTM인데 몇 가지 고려사항 있습니다. IMHO 여기 추상 팩토리는 YAGNI 같고 KISS 원칙 적용이 나을 듯합니다. NIT인데 PR 설명에 TL;DR 있으면 좋겠어요. 통합 테스트 ETA는 어떻게 되나요? 쓰레드 세이프 관련 PTAL 부탁드리고요, AFAIK CompletableFuture 관련해서 RTFM 한번 보시면 좋을 것 같습니다. 전체적으로 ACK인데 P1 이슈들 TBD 처리 후 머지 부탁드립니다. WDYT?

이렇게 하면 팀원이 당황스럽겠죠! 과한 사용은 팀원과의 불화를 야기할 수 있습니다😵

그래도 가끔 한번씩 리뷰에 심어줘서 은은한 고수의 향기를 풍겨보는건 어떨까요?

이상입니다.

![코드리뷰 고수인척 하기 튜토리얼](/images/blog/tistory-58/image-02.png)
