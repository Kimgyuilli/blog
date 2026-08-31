---
title: "CS 스터디 2주차: 핵심 알고리즘 지도"
description: "정렬과 탐색부터 그래프, DP, 그리디, 최단 경로, MST, 문자열 매칭까지 문제 유형별 핵심 알고리즘을 정리합니다."
image: "/images/blog/cs-algorithms/thumbnail.png"
pubDate: 2026-08-31
category: "cs"
tags: ["CS", "알고리즘", "그래프", "동적 계획법", "정렬", "탐색"]
draft: false
slug: "cs-algorithms"
---

## **알고리즘이란?**
![](/images/blog/cs-algorithms/content/image-01.png)
- **알고리즘(Algorithm)**은 어떤 문제를 해결하기 위한 일련의 절차나 방법을 의미합니다. 좋은 알고리즘은 정확성뿐 아니라 시간 복잡도(Time Complexity)와 공간 복잡도(Space Complexity) 측면에서도 효율적이어야 합니다.
---
## **1. 정렬 알고리즘 (Sorting Algorithm)**
데이터를 특정 순서(오름차순/내림차순)로 나열하는 알고리즘입니다.
가짓수가 매우 많은데요
[Visualization of 24 Sorting Algorithms In 2 Minutes](https://youtu.be/BeoCbJPuvSE?si=hTjJJ48AqiLnJJJK)
저는 보통 Arrays.sort()를 사용합니다. Java의 Arrays.sort()는 DualPivotQuickSort를 사용합니다. 일반적으로 정렬 알고리즘 중 빠르다고 알려진 QuickSort에서 최적화가 한번 더 이루어져있기에 정렬에 머리 쓰지 말고 그냥 이거 쓰면 좋은 것 같아요.
[Java Development Kit Version 17 API Specification](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Arrays.html#sort(byte%5B%5D))
```java
int[] ex = new int[] {1,3,48,7,6,54,2}

Arrays.sort(ex); -> 오름차순

Arrays.sort(ex, (a, b) -> {
return b - a;
}); -> 내림차순

Arrays.sort(ex, (a, b) -> {
return a[4] - b[4];
}); -> 주어진게 2차원배열일 때 배열 내의 특정 인덱스를 기준으로 비교도 가능
```
### **버블 정렬 (Bubble Sort)**
인접한 두 원소를 비교하여 순서가 잘못되어 있으면 교환하는 방식. 구현이 간단하지만 (O(n²)).
![](/images/blog/cs-algorithms/content/image-02.png)
```java
public class BubbleSort {
    public static void sort(int[] arr) {
        int n= arr.length;
        for (int i= 0; i< n- 1; i++) {
            for (int j= 0; j< n- 1 - i; j++) {
                if (arr[j] > arr[j+ 1]) {
                    int temp= arr[j];
                    arr[j] = arr[j+ 1];
                    arr[j+ 1] = temp;
                }
            }
        }
    }
}
```
### **퀵 정렬 (Quick Sort)**
기준값(pivot)을 정해 그보다 작은 값과 큰 값으로 분할한 뒤 재귀적으로 정렬. 평균 O(n log n).
![](/images/blog/cs-algorithms/content/image-03.png)
```java
public class QuickSort {
    public static void sort(int[] arr, int low, int high) {
        if (low< high) {
            int pi= partition(arr, low, high);
            sort(arr, low, pi- 1);
            sort(arr, pi+ 1, high);
        }
    }

    private static int partition(int[] arr, int low, int high) {
        int pivot= arr[high];
        int i= low- 1;
        for (int j= low; j< high; j++) {
            if (arr[j] < pivot) {
                i++;
                int temp= arr[i]; arr[i] = arr[j]; arr[j] = temp;
            }
        }
        int temp= arr[i+ 1]; arr[i+ 1] = arr[high]; arr[high] = temp;
        return i+ 1;
    }
}
```
### **병합 정렬 (Merge Sort)**
배열을 절반씩 나눈 뒤 정렬하면서 병합. 항상 O(n log n)을 보장하는 안정 정렬.
```java
public class MergeSort {
    public static void sort(int[] arr, int left, int right) {
        if (left< right) {
            int mid= (left+ right) / 2;
            sort(arr, left, mid);
            sort(arr, mid+ 1, right);
            merge(arr, left, mid, right);
        }
    }

    private static void merge(int[] arr, int left, int mid, int right) {
        int[] temp= new int[right- left+ 1];
        int i= left, j= mid+ 1, k= 0;
        while (i<= mid&& j<= right) {
            temp[k++] = (arr[i] <= arr[j]) ? arr[i++] : arr[j++];
        }
        while (i<= mid) temp[k++] = arr[i++];
        while (j<= right) temp[k++] = arr[j++];
        System.arraycopy(temp, 0, arr, left, temp.length);
    }
}
```
---
## **2. 탐색 알고리즘 (Searching Algorithm)**
### **선형 탐색 (Linear Search)**
처음부터 끝까지 순서대로 값을 비교. O(n).
```java
public class LinearSearch {
    public static int search(int[] arr, int target) {
        for (int i= 0; i< arr.length; i++) {
            if (arr[i] == target) return i;
        }
        return -1;
    }
}
```
### **이진 탐색 (Binary Search)**
정렬된 배열에서 중간값과 비교하며 탐색 범위를 절반씩 줄여나감. O(log n).
```java
public class BinarySearch {
    public static int search(int[] arr, int target) {
        int left= 0, right= arr.length- 1;
        while (left<= right) {
            int mid= (left + right) / 2;
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) left= mid+ 1;
            else right= mid- 1;
        }
        return -1;
    }
}
```
---
## **3. 그래프 탐색 알고리즘**
![](/images/blog/cs-algorithms/content/image-04.png)
### **DFS (깊이 우선 탐색, Depth-First Search)**
한 방향으로 갈 수 있는 만큼 깊이 들어간 뒤 되돌아오는 방식. 재귀 또는 스택으로 구현.
```java
import java.util.*;

public class DFS {
    public static void dfs(int start, Map<Integer, List<Integer>> graph, Set<Integer> visited) {
        visited.add(start);
        System.out.print(start+ " ");
        for (int next: graph.getOrDefault(start, new ArrayList<>())) {
            if (!visited.contains(next)) {
                dfs(next, graph, visited);
            }
        }
    }
}
```
### **BFS (너비 우선 탐색, Breadth-First Search)**
가까운 노드부터 순서대로 탐색. 큐(Queue)를 이용해 구현하며 최단 경로 탐색에 자주 사용.
```java
import java.util.*;

public class BFS {
    public static void bfs(int start, Map<Integer, List<Integer>> graph) {
        Set<Integer> visited= new HashSet<>();
        Queue<Integer> queue= new LinkedList<>();
        queue.add(start);
        visited.add(start);

        while (!queue.isEmpty()) {
            int current= queue.poll();
            System.out.print(current+ " ");
            for (int next: graph.getOrDefault(current, new ArrayList<>())) {
                if (!visited.contains(next)) {
                    visited.add(next);
                    queue.add(next);
                }
            }
        }
    }
}
```
---
## **4. 동적 계획법 (Dynamic Programming, DP)**
![](/images/blog/cs-algorithms/content/image-05.png)
큰 문제를 작은 하위 문제로 나누고, 하위 문제의 결과를 저장(메모이제이션)해 재활용하는 방식. 중복 계산을 줄여 효율성을 높임.
```java
public class Fibonacci {
    public static long fib(int n, long[] memo) {
        if (n<= 1) return n;
        if (memo[n] != 0) return memo[n];
        memo[n] = fib(n- 1, memo) + fib(n- 2, memo);
        return memo[n];
    }

    public static void main(String[] args) {
        int n= 10;
        long[] memo= new long[n+ 1];
        System.out.println(fib(n, memo)); // 55
    }
}
```
---
## **5. 그리디 알고리즘 (Greedy Algorithm)**
![](/images/blog/cs-algorithms/content/image-06.png)
매 순간 가장 최선(최적)이라고 생각되는 선택을 반복해 전체 답을 구하는 방식. 항상 최적해를 보장하지는 않지만, 문제에 따라 효율적으로 최적해를 찾을 수 있음 (예: 거스름돈 문제).
```java
public class GreedyCoinChange {
    public static int coinChange(int[] coins, int amount) {
        int count= 0;
        for (int i= coins.length- 1; i>= 0; i--) {
            while (amount>= coins[i]) {
                amount-= coins[i];
                count++;
            }
        }
        return count;
    }

    public static void main(String[] args) {
        int[] coins= {1, 5, 10, 50, 100, 500};
        System.out.println(coinChange(coins, 1260)); // 최소 동전 개수
    }
}
```
---
## **6. 백트래킹 (Backtracking)**
가능한 모든 경우를 탐색하되, 조건에 맞지 않으면 더 진행하지 않고 되돌아가는(가지치기) 방식. 순열, 조합, N-Queen 문제 등에 사용.
```java
public class Backtracking {
    public static void permute(int[] arr, boolean[] used, int[] path, int depth) {
        if (depth== arr.length) {
            for (int p: path) System.out.print(p+ " ");
            System.out.println();
            return;
        }
        for (int i= 0; i< arr.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path[depth] = arr[i];
            permute(arr, used, path, depth+ 1);
            used[i] = false; // 되돌리기 (백트래킹)
        }
    }
}
```
---
![](/images/blog/cs-algorithms/content/image-07.png)
## **7. 투 포인터 (Two Pointer)**
정렬된(혹은 특정 조건이 있는) 배열에서 두 개의 포인터를 이동시키며 조건을 만족하는 구간/쌍을 O(n)에 찾는 기법. 완전탐색(O(n²))을 O(n)으로 줄일 수 있음.
```java
public class TwoPointer {
    // 정렬된 배열에서 합이 target인 두 수 찾기
    public static int[] twoSum(int[] arr, int target) {
        int left= 0, right= arr.length- 1;
        while (left< right) {
            int sum= arr[left] + arr[right];
            if (sum== target) return new int[]{left, right};
            else if (sum< target) left++;
            else right--;
        }
        return new int[]{-1, -1};
    }
}
```
---
## **8. 슬라이딩 윈도우 (Sliding Window)**
일정 크기(혹은 가변 크기)의 윈도우를 이동시키며 부분 배열/문자열에 대한 조건을 계산. 투 포인터의 응용으로, 매번 새로 계산하지 않고 윈도우가 이동할 때 변화분만 갱신해 효율을 높임.
```java
public class SlidingWindow {
    // 크기 k인 부분 배열의 최대 합
    public static int maxSum(int[] arr, int k) {
        int sum= 0;
        for (int i= 0; i< k; i++) sum+= arr[i];
        int maxSum= sum;
        for (int i= k; i< arr.length; i++) {
            sum+= arr[i] - arr[i- k];
            maxSum= Math.max(maxSum, sum);
        }
        return maxSum;
    }
}
```
---
## **9. 파라메트릭 서치 (이분 탐색 응용)**
"조건을 만족하는 최솟값/최댓값"을 찾을 때, 정답이 될 수 있는 값의 범위를 이분 탐색하며 좁혀나가는 기법. 원래 문제를 "이 값이 가능한가?"라는 결정 문제로 바꿔서 푼다.
```java
public class ParametricSearch {
    // 예: 나무 자르기 - 절단기 높이 H로 얻을 수 있는 나무 길이 합이 목표(target) 이상인 최대 H 찾기
    public static long solve(int[] trees, long target) {
        long left= 0, right= 0;
        for (int t: trees) right= Math.max(right, t);
        long answer= 0;

        while (left<= right) {
            long mid= (left+ right) / 2;
            long total= 0;
            for (int t: trees) if (t> mid) total+= (t- mid);

            if (total>= target) {
                answer= mid; // 조건 만족 -> 더 큰 값 시도
                left= mid+ 1;
            } else {
                right= mid- 1;
            }
        }
        return answer;
    }
}
```
---
## **10. 최단 경로 알고리즘**
### **다익스트라 (Dijkstra)**
![](/images/blog/cs-algorithms/content/image-08.png)
음이 아닌 가중치 그래프에서 한 정점으로부터 모든 정점까지의 최단 거리를 구함. 우선순위 큐(힙)로 구현하면 O(E log V).
```java
import java.util.*;

public class Dijkstra {
    public static int[] dijkstra(int start, int n, List<List<int[]>> graph) {
        int[] dist= new int[n]; // 노드간의 최소 거리를 명시해둔 원장
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[start] = 0;

        PriorityQueue<int[]> pq= new PriorityQueue<>(Comparator.comparingInt(a-> a[1]));
        pq.add(new int[]{start, 0});

        while (!pq.isEmpty()) {
            int[] cur= pq.poll();
            int node= cur[0], cost= cur[1];
            if (cost> dist[node]) continue;

            for (int[] next: graph.get(node)) {
                int nextNode= next[0], weight= next[1];
                int newDist= cost+ weight;
                if (newDist< dist[nextNode]) {
                    dist[nextNode] = newDist;
                    pq.add(new int[]{nextNode, newDist});
                }
            }
        }
        return dist;
    }
}
```
### **플로이드-워셜 (Floyd-Warshall)**
모든 정점 쌍 간의 최단 거리를 구함. O(V³)로 정점 수가 적을 때 유용.
```java
public class FloydWarshall {
    public static void solve(int[][] dist, int n) {
        for (int k= 0; k< n; k++) {
            for (int i= 0; i< n; i++) {
                for (int j= 0; j< n; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
    }
}
```
---
## **11. 최소 신장 트리 (MST, Minimum Spanning Tree)**
모든 정점을 연결하면서 간선의 가중치 합이 최소가 되는 트리를 구성.
![](/images/blog/cs-algorithms/content/image-09.png)
### **크루스칼 (Kruskal)**
간선을 가중치 순으로 정렬한 뒤, 유니온-파인드로 사이클을 피하며 선택. O(E log E).
```java
import java.util.*;

public class Kruskal {
    static int[] parent;

    static int find(int x) {
        if (parent[x] == x) return x;
        return parent[x] = find(parent[x]);
    }

    static void union(int a, int b) {
        a= find(a); b= find(b);
        if (a!= b) parent[a] = b;
    }

    // edges: {weight, from, to}
    public static int solve(int n, int[][] edges) {
        parent= new int[n];
        for (int i= 0; i< n; i++) parent[i] = i;

        Arrays.sort(edges, Comparator.comparingInt(e-> e[0]));

        int total= 0;
        for (int[] e: edges) {
            int weight= e[0], from= e[1], to= e[2];
            if (find(from) != find(to)) {
                union(from, to);
                total+= weight;
            }
        }
        return total;
    }
}
```
### **프림 (Prim)**
임의의 정점에서 시작해, 연결된 간선 중 가장 가중치가 작은 것을 우선순위 큐로 선택하며 확장. O(E log V).
```java
import java.util.*;

public class Prim {
    public static int solve(int n, int start, List<List<int[]>> graph) {
        boolean[] visited= new boolean[n];
        PriorityQueue<int[]> pq= new PriorityQueue<>(Comparator.comparingInt(a-> a[1]));
        pq.add(new int[]{start, 0});

        int total= 0;
        while (!pq.isEmpty()) {
            int[] cur= pq.poll();
            int node= cur[0], cost= cur[1];
            if (visited[node]) continue;
            visited[node] = true;
            total+= cost;

            for (int[] next: graph.get(node)) {
                if (!visited[next[0]]) {
                    pq.add(new int[]{next[0], next[1]});
                }
            }
        }
        return total;
    }
}
```
---
## **12. 유니온-파인드 (Union-Find / Disjoint Set)**
여러 원소를 그룹(집합)으로 묶고, 두 원소가 같은 그룹인지 빠르게 판별. 사이클 탐지, MST, 네트워크 연결 등에 활용. 경로 압축(path compression)으로 거의 O(1)에 동작.
```java
public class UnionFind {
    int[] parent;

    public UnionFind(int n) {
        parent= new int[n];
        for (int i= 0; i< n; i++) parent[i] = i;
    }

    public int find(int x) {
        if (parent[x] == x) return x;
        return parent[x] = find(parent[x]); // 경로 압축
    }

    public void union(int a, int b) {
        a= find(a); b= find(b);
        if (a!= b) parent[a] = b;
    }

    public boolean isConnected(int a, int b) {
        return find(a) == find(b);
    }
}
```
---
## **13. 우선순위 큐 / 힙 (Priority Queue / Heap)**
항상 가장 크거나(최대 힙) 가장 작은(최소 힙) 값을 O(log n)에 꺼낼 수 있는 자료구조. 다익스트라, 스케줄링, K번째 값 찾기 등에 자주 사용. Java는 `PriorityQueue`로 기본 제공.
```java
import java.util.PriorityQueue;
import java.util.Collections;

public class HeapExample {
    public static void main(String[] args) {
        PriorityQueue<Integer> minHeap= new PriorityQueue<>();       // 최소 힙 (기본)
        PriorityQueue<Integer> maxHeap= new PriorityQueue<>(Collections.reverseOrder()); // 최대 힙

        int[] nums= {5, 1, 8, 3, 9};
        for (int n: nums) {
            minHeap.add(n);
            maxHeap.add(n);
        }

        System.out.println(minHeap.poll()); // 1
        System.out.println(maxHeap.poll()); // 9
    }
}
```
---
## **14. 위상 정렬 (Topological Sort)**
방향 그래프에서 선후 관계를 지키며 정점을 나열하는 방법. 진입 차수(indegree)가 0인 노드부터 큐에 넣어 처리 (Kahn's Algorithm). 작업 스케줄링, 선수과목 등 순서가 있는 문제에 사용.
```java
import java.util.*;

public class TopologicalSort {
    public static List<Integer> solve(int n, List<List<Integer>> graph) {
        int[] indegree= new int[n];
        for (List<Integer> next: graph) {
            for (int node: next) indegree[node]++;
        }

        Queue<Integer> queue= new LinkedList<>();
        for (int i= 0; i< n; i++) {
            if (indegree[i] == 0) queue.add(i);
        }

        List<Integer> result= new ArrayList<>();
        while (!queue.isEmpty()) {
            int cur= queue.poll();
            result.add(cur);
            for (int next: graph.get(cur)) {
                if (--indegree[next] == 0) queue.add(next);
            }
        }
        return result; // 크기가 n보다 작으면 사이클 존재
    }
}
```
---
## **15. LIS / LCS (DP 응용)**
### **LIS (Longest Increasing Subsequence, 최장 증가 부분 수열)**
수열에서 오름차순으로 증가하는 가장 긴 부분 수열의 길이. 이분 탐색을 활용하면 O(n log n).
```java
import java.util.*;

public class LIS {
    public static int lengthOfLIS(int[] nums) {
        List<Integer> tails= new ArrayList<>();
        for (int num: nums) {
            int pos= Collections.binarySearch(tails, num);
            if (pos< 0) pos= -(pos+ 1);
            if (pos== tails.size()) tails.add(num);
            else tails.set(pos, num);
        }
        return tails.size();
    }
}
```
### **LCS (Longest Common Subsequence, 최장 공통 부분 수열)**
두 문자열에서 순서를 유지하며 공통으로 나타나는 가장 긴 부분 수열의 길이. 2차원 DP로 O(n·m).
```java
public class LCS {
    public static int longestCommonSubsequence(String a, String b) {
        int n= a.length(), m= b.length();
        int[][] dp= new int[n+ 1][m+ 1];

        for (int i= 1; i<= n; i++) {
            for (int j= 1; j<= m; j++) {
                if (a.charAt(i- 1) == b.charAt(j- 1)) {
                    dp[i][j] = dp[i- 1][j- 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i- 1][j], dp[i][j- 1]);
                }
            }
        }
        return dp[n][m];
    }
}
```
---
## **16. 비트마스킹 (Bitmasking)**
집합(부분집합)을 정수의 비트로 표현해 상태를 관리하는 기법. 완전탐색이나 DP와 결합해 "방문한 도시 집합" 같은 상태를 표현할 때 사용 (예: 외판원 순회 TSP).
```java
public class Bitmasking {
    public static void main(String[] args) {
        int n= 4;
        // 0부터 2^n - 1까지 모든 부분집합 순회
        for (int mask= 0; mask< (1 << n); mask++) {
            StringBuilder sb= new StringBuilder();
            for (int i= 0; i< n; i++) {
                if ((mask& (1 << i)) != 0) sb.append(i).append(" ");
            }
            System.out.println("부분집합: " + sb);
        }
    }
}
```
---
## **17. KMP 문자열 매칭**
텍스트에서 패턴을 찾을 때, 실패했던 부분의 정보를 이용해 불필요한 재비교를 건너뛰는 알고리즘. O(N + M)으로 완전탐색(O(N·M))보다 빠름.
```java
public class KMP {
    // 패턴의 각 위치까지 접두사와 접미사가 같은 최대 길이(실패 함수) 계산
    private static int[] getFailure(String pattern) {
        int m= pattern.length();
        int[] fail= new int[m];
        int j= 0;
        for (int i= 1; i< m; i++) {
            while (j> 0 && pattern.charAt(i) != pattern.charAt(j)) {
                j= fail[j- 1];
            }
            if (pattern.charAt(i) == pattern.charAt(j)) {
                fail[i] = ++j;
            }
        }
        return fail;
    }

    public static int search(String text, String pattern) {
        int[] fail= getFailure(pattern);
        int j= 0;
        for (int i= 0; i< text.length(); i++) {
            while (j> 0 && text.charAt(i) != pattern.charAt(j)) {
                j= fail[j- 1];
            }
            if (text.charAt(i) == pattern.charAt(j)) {
                if (j== pattern.length() - 1) return i- j; // 매칭 시작 인덱스
                j++;
            }
        }
        return -1; // 매칭 실패
    }
}
```
