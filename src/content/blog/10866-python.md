---
title: "백준 10866(파이썬/python)"
description: "정수를 저장하는 덱(Deque)를 구현한 다음, 입력으로 주어지는 명령을 처리하는 프로그램을 작성하시오. 명령은 총 여덟 가지이다. 첫째 줄에 주어지는 명령의 수 N (1 ≤ N ≤ 10,000)이 주어진다. 둘째 줄부터 N개의 줄에는 명령이 하나씩 주어진다. 주어지는 정수는"
pubDate: 2022-01-24
tags: ["python", "백준"]
draft: false
slug: "10866-python"
---
## 문제

정수를 저장하는 덱(Deque)를 구현한 다음, 입력으로 주어지는 명령을 처리하는 프로그램을 작성하시오.

명령은 총 여덟 가지이다.

-   push\_front X: 정수 X를 덱의 앞에 넣는다.
-   push\_back X: 정수 X를 덱의 뒤에 넣는다.
-   pop\_front: 덱의 가장 앞에 있는 수를 빼고, 그 수를 출력한다. 만약, 덱에 들어있는 정수가 없는 경우에는 -1을 출력한다.
-   pop\_back: 덱의 가장 뒤에 있는 수를 빼고, 그 수를 출력한다. 만약, 덱에 들어있는 정수가 없는 경우에는 -1을 출력한다.
-   size: 덱에 들어있는 정수의 개수를 출력한다.
-   empty: 덱이 비어있으면 1을, 아니면 0을 출력한다.
-   front: 덱의 가장 앞에 있는 정수를 출력한다. 만약 덱에 들어있는 정수가 없는 경우에는 -1을 출력한다.
-   back: 덱의 가장 뒤에 있는 정수를 출력한다. 만약 덱에 들어있는 정수가 없는 경우에는 -1을 출력한다.

## 입력

첫째 줄에 주어지는 명령의 수 N (1 ≤ N ≤ 10,000)이 주어진다. 둘째 줄부터 N개의 줄에는 명령이 하나씩 주어진다. 주어지는 정수는 1보다 크거나 같고, 100,000보다 작거나 같다. 문제에 나와있지 않은 명령이 주어지는 경우는 없다.

## 출력

출력해야하는 명령이 주어질 때마다, 한 줄에 하나씩 출력한다.

```
from sys import stdin
n = int(stdin.readline())
deque = []
for _ in range(n):
    read = stdin.readline().split()
    if read[0] == 'push_front':
        deque.insert(0, read[1])
    elif read[0] == 'push_back':
        deque.append(read[1])
    elif read[0] == 'pop_front':
        if len(deque) == 0:
            print(-1)
        else:
            print(deque.pop(0))
    elif read[0] == 'pop_back':
        if len(deque) == 0:
            print(-1)
        else:
            print(deque.pop())
    elif read[0] == 'size':
        print(len(deque))
    elif read[0] == 'empty':
        if len(deque) == 0:
            print(1)
        else:
            print(0)
    elif read[0] == 'front':
        if len(deque) == 0:
            print(-1)
        else:
            print(deque[0])
    elif read[0] == 'back':
        if len(deque) == 0:
            print(-1)
        else:
            print(deque[-1])
```

### 풀이 및 후기

실행시간을 줄이기 위해 stdin.readline()를 사용했으며 push\_front에는 insert, push\_back에는 append를 사용하였다. push\_back에는 insert와 extend도 사용할 수 있을 것 같다.

삭제에는 pop를 사용하였고 del로도 같은 수행을 할 수 있다.

여러번 풀어본 유형의 문제라 그리 어렵지 않았다
