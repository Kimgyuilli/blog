---
title: "백준 10845(파이썬/python)"
description: "정수를 저장하는 큐를 구현한 다음, 입력으로 주어지는 명령을 처리하는 프로그램을 작성하시오. 명령은 총 여섯 가지이다. 첫째 줄에 주어지는 명령의 수 N (1 ≤ N ≤ 10,000)이 주어진다. 둘째 줄부터 N개의 줄에는 명령이 하나씩 주어진다. 주어지는 정수는 1보다"
pubDate: 2022-01-10
tags: ["python", "백준"]
draft: false
slug: "10845-python"
---
## 문제

정수를 저장하는 큐를 구현한 다음, 입력으로 주어지는 명령을 처리하는 프로그램을 작성하시오.

명령은 총 여섯 가지이다.

-   push X: 정수 X를 큐에 넣는 연산이다.
-   pop: 큐에서 가장 앞에 있는 정수를 빼고, 그 수를 출력한다. 만약 큐에 들어있는 정수가 없는 경우에는 -1을 출력한다.
-   size: 큐에 들어있는 정수의 개수를 출력한다.
-   empty: 큐가 비어있으면 1, 아니면 0을 출력한다.
-   front: 큐의 가장 앞에 있는 정수를 출력한다. 만약 큐에 들어있는 정수가 없는 경우에는 -1을 출력한다.
-   back: 큐의 가장 뒤에 있는 정수를 출력한다. 만약 큐에 들어있는 정수가 없는 경우에는 -1을 출력한다.

## 입력

첫째 줄에 주어지는 명령의 수 N (1 ≤ N ≤ 10,000)이 주어진다. 둘째 줄부터 N개의 줄에는 명령이 하나씩 주어진다. 주어지는 정수는 1보다 크거나 같고, 100,000보다 작거나 같다. 문제에 나와있지 않은 명령이 주어지는 경우는 없다.

## 출력

출력해야하는 명령이 주어질 때마다, 한 줄에 하나씩 출력한다.

```
from sys import stdin
n = int(stdin.readline())
q = []
for _ in range(n):
    ord = stdin.readline().split()
    if ord[0] == 'push':
        q.append(ord[1])
    elif ord[0] == 'pop':
        if len(q) == 0:
            print(-1)
        else:
            print(q.pop(0))
    elif ord[0] == 'size':
        print(len(q))
    elif ord[0] == 'empty':
        if len(q) == 0:
            print(1)
        else:
            print(0)
    elif ord[0] == 'front':
        if len(q) == 0:
            print(-1)
        else:
            print(q[0])
    elif ord[0] == 'back':
        if len(q) == 0:
            print(-1)
        else:
            print(q[-1])
```

## 풀이

전에 풀었던 스택문제와 거의 유사해서 푸는데 큰 어려움이 없었다.

실행시간을 줄이기 위해 input함수가 아닌 sys에 있는 stdin.readline()을사용하였고 스택 문제에서 pop기능만 뒤부터가 아닌 앞에서부터 빠지도록 바꾸었다.
