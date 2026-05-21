---
title: "1260 DFS와 BFS - JAVA"
description: "기본적인 DFS, BFS 문제이다. 나는 알고리즘에 대한 지식이 없기 때문에 좀 고생했다.. 특징이 있는 부분 몇개만 소개하자면 간선 행렬을 표현할 때 1-based index를 사용해 index와 순회 돌 때의 숫자가 같게 만들었다. 재귀를 활용한 dfs queue를 사용한"
image: "/images/blog/1260-dfs-bfs-java/image-01.png"
pubDate: 2025-02-24
category: "algorithm"
tags: ["java"]
draft: false
slug: "1260-dfs-bfs-java"
---
![1260 DFS와 BFS - JAVA](/images/blog/1260-dfs-bfs-java/image-01.png)

기본적인 DFS, BFS 문제이다. 나는 알고리즘에 대한 지식이 없기 때문에 좀 고생했다..

## 전체 코드

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.LinkedList;
import java.util.Queue;
import java.util.StringTokenizer;

public class java_1260 {

    static StringBuilder sb = new StringBuilder();
    static boolean[] flag;
    static int[][] arr;

    static int node, line, start;

    static Queue<Integer> q = new LinkedList<Integer>();

    public static void main(String[] args) throws IOException {

        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        StringTokenizer st = new StringTokenizer(br.readLine());
        node = Integer.parseInt(st.nextToken());
        line = Integer.parseInt(st.nextToken());
        start = Integer.parseInt(st.nextToken());

        arr = new int[node + 1][node + 1];
        flag = new boolean[node + 1];

        for (int i = 0; i < line; i++) {
            StringTokenizer str = new StringTokenizer(br.readLine());
            int a = Integer.parseInt(str.nextToken());
            int b = Integer.parseInt(str.nextToken());

            arr[a][b] = arr[b][a] = 1;
        }

        dfs(start);
        sb.append("\n");

        flag = new boolean[node + 1];

        bfs(start);

        System.out.println(sb);
    }

    public static void dfs(int start) {
        flag[start] = true;
        sb.append(start + " ");

        for (int i = 0; i <= node; i++) {
            if (arr[start][i] == 1 && !flag[i]){
                dfs(i);
            }
        }

    }

    public static void bfs(int start) {
        q.add(start);
        flag[start] = true;

        while (!q.isEmpty()) {
            start = q.poll();
            sb.append(start + " ");

            for (int i = 0; i <= node; i++ ) {
                if (arr[start][i] == 1 && !flag[i]){
                    q.add(i);
                    flag[i] = true;
                }
            }
        }
    }
}
```

특징이 있는 부분 몇개만 소개하자면

```java
        arr = new int[node + 1][node + 1];
        flag = new boolean[node + 1];
```

간선 행렬을 표현할 때 1-based index를 사용해 index와 순회 돌 때의 숫자가 같게 만들었다.

```java
    public static void dfs(int start) {
        flag[start] = true;
        sb.append(start + " ");

        for (int i = 0; i <= node; i++) {
            if (arr[start][i] == 1 && !flag[i]){
                dfs(i);
            }
        }
    }
```

재귀를 활용한 dfs

```java
    public static void bfs(int start) {
        q.add(start);
        flag[start] = true;

        while (!q.isEmpty()) {
            start = q.poll();
            sb.append(start + " ");

            for (int i = 0; i <= node; i++ ) {
                if (arr[start][i] == 1 && !flag[i]){
                    q.add(i);
                    flag[i] = true;
                }
            }
        }
    }
```

queue를 사용한 bfs이다.
