---
title: "JAVA의 Deque 클래스와 Queue 클래스의 차이"
description: "백준을 풀다가 Deque 클래스를 알게 되었다. BFS를 풀면서 Queue만 쓰던 나에게 새로운 고민을 안겨줬는데 Deque가 더 유연하니까 그냥 모든 경우에 Deque만 쓰면 되는 거 아니야? 라는 생각이었다. 그래서 찾아본 JAVA에서 Queue와 Deque의 차이를"
image: "/images/blog/java-deque-queue/image-01.png"
pubDate: 2025-03-25
tags: ["java"]
draft: false
slug: "java-deque-queue"
---
백준을 풀다가 Deque 클래스를 알게 되었다.

BFS를 풀면서 Queue만 쓰던 나에게 새로운 고민을 안겨줬는데

Deque가 더 유연하니까 그냥 모든 경우에 Deque만 쓰면 되는 거 아니야? 라는 생각이었다.

그래서 찾아본 JAVA에서 Queue와 Deque의 차이를 정리해보았다.

|     |     |     |
| --- | --- | --- |
| 항목  | Queue | Deque |
| 자료구조 개념 | FIFO (First-In-First-Out) | 양방향 큐 (Double-Ended Queue) |
| 기본 동작 | 뒤에 추가, 앞에서 제거 | 앞뒤 양쪽에서 추가 및 제거 가능 |
| 주요 메서드 | offer(), poll(), peek() | addFirst(), addLast(), removeFirst(), removeLast() 등 |
| 사용 목 | 순차적으로 처리 (ex. 대기열) | 앞/뒤 모두에서 조작 필요할 때 (ex. 슬라이딩 윈도우, Palindrome 체크 등) |

가장 핵심정인 실마리는 JAVA Deque의 정의에 있었다.

![JAVA의 Deque 클래스와 Queue 클래스의 차이](/images/blog/java-deque-queue/image-01.png)

이걸 보면 Deque는 Queue의 하위 인터페이스임을 알 수 있다.

이렇게 개발할 때 Queue를 사용하는 경우에는 두가지 이유를 알게됐다.

1\. 명확한 의도 표현

Queue를 사용하면 이건 단방향 큐를 사용한다는 것을 바로 알 수 있다. 곧 가독성으로 이어진다.

2\. 설계적 관점

Queue는 Deque의 부모 인터페이스이다.

설계적으로 봤을 때 부모 인터페이스인 Queue만 쓰면 돼는데 굳이 사용하지도 않을 하위 인터페이스인 Deque까지 가지고 오는건 불필요한 행동이다.

결국 자신이 써야 하는 기능을 명확히 인지하고 그에 맞는 클래스를 쓰는게 더 좋은 코드 짜는 방식이라는 교과서적인 결론을 내게 됐다.
