---
title: "[백준] 9663 N-Queen - JAVA"
description: "백트래킹 문제로 굉장히 유명하다는 N-Queen 문제이다. 다른 거는 어떻게 할지 감이 잡혔는데 대각선 검증을 어떻게 해야 할지가 고민이었는데 찾아보니 기울기 비교를 통해 검증하는 방법을 많이 사용한다고 하더라. 절대값을 사용해 순회를 돌면서 기울기가 같으면 서로 공격할 수"
pubDate: 2025-03-28
category: "algorithm"
tags: ["java", "백준"]
draft: false
slug: "9663-n-queen-java"
---
![[백준] 9663 N-Queen - JAVA](/images/blog/9663-n-queen-java/image-01.png)

```
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Main {
 static int N;
 static int[] board;
 static int count = 0;
 public static void main(String[] args) throws IOException {
     BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
     N = Integer.parseInt(br.readLine());
     board = new int[N];

     dfs(0);
     System.out.println(count);
 }

 public static void dfs(int depth) {
     if(depth == N) {
         count++;
         return;
     }
     for(int i = 0; i < N; i++) {
         board[depth] = i;
         if(possible(depth)) {
             dfs(depth + 1);
         }
     }
 }

 public static boolean possible(int depth) {
     for(int i = 0; i < depth; i++) {
         if(board[i] == board[depth]) return false;

         // 대각선 검증
         else if(Math.abs(depth-i) == Math.abs(board[depth]-board[i])) return false;
     }
     return true;
 }
}
```

### **후기**

백트래킹 문제로 굉장히 유명하다는 N-Queen 문제이다.

다른 거는 어떻게 할지 감이 잡혔는데 대각선 검증을 어떻게 해야 할지가 고민이었는데 찾아보니 기울기 비교를 통해 검증하는 방법을 많이 사용한다고 하더라.


절대값을 사용해 순회를 돌면서 기울기가 같으면 서로 공격할 수 있다는 건데 보니까 이해가 된다. 수학공부를 좀 더 열심히 해놨으면 이거 한번에 알 수 있었을까
