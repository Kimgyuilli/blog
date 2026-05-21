---
title: "Java 배열(Array)과 Arrays 클래스 정리 (알고리즘 문제 풀이용)"
description: "알고리즘 문제를 풀 때 자주 사용하는 Java 배열과 Arrays 유틸리티 클래스의 주요 메서드를 정리했습니다. 1차원 배열 2차원 배열 기본 for문 향상된 for문 (for-each) 2차원 배열 순회 java.util.Arrays 클래스는 배열을 다루는 다양한 유틸리티"
image: "/images/blog/java-array-arrays/image-01.png"
pubDate: 2026-02-15
tags: ["java", "알고리즘"]
draft: false
slug: "java-array-arrays"
---
![Java 배열(Array)과 Arrays 클래스 정리 (알고리즘 문제 풀이용)](/images/blog/java-array-arrays/image-01.png)

알고리즘 문제를 풀 때 자주 사용하는 Java 배열과 Arrays 유틸리티 클래스의 주요 메서드를 정리했습니다.

\---

## 1\. 배열(Array) 기본

### 1.1 배열 선언 및 생성

**1차원 배열**

```
// 선언과 생성 분리
int[] arr1;                                      // 선언
arr1 = new int[5];                               // 크기 5인 배열 생성

// 선언과 동시에 생성
int[] arr2 = new int[5];                         // [0, 0, 0, 0, 0]

// 선언과 동시에 초기화
int[] arr3 = {1, 2, 3, 4, 5};                    // [1, 2, 3, 4, 5]
int[] arr4 = new int[]{1, 2, 3, 4, 5};           // [1, 2, 3, 4, 5]

// 다른 타입
String[] strings = new String[3];                // [null, null, null]
String[] words = {"apple", "banana", "cherry"};
```

**2차원 배열**

```
// 정방 행렬
int[][] matrix1 = new int[3][4];                 // 3행 4열

// 초기화
int[][] matrix2 = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

// 가변 배열 (행마다 열 개수가 다름)
int[][] jagged = new int[3][];
jagged[0] = new int[2];                          // 1행: 2개
jagged[1] = new int[3];                          // 2행: 3개
jagged[2] = new int[1];                          // 3행: 1개
```

### 1.2 배열 접근

```
int[] arr = {10, 20, 30, 40, 50};

// 인덱스로 접근
int value = arr[0];                              // 10
arr[2] = 100;                                    // [10, 20, 100, 40, 50]

// 길이
int len = arr.length;                            // 5

// 2차원 배열
int[][] matrix = {{1, 2}, {3, 4}};
int rows = matrix.length;                        // 2 (행 개수)
int cols = matrix[0].length;                     // 2 (첫 행의 열 개수)
int value2 = matrix[1][0];                       // 3
```

### 1.3 배열 순회

**기본 for문**

```
int[] arr = {10, 20, 30, 40, 50};

for (int i = 0; i < arr.length; i++) {
    System.out.println(arr[i]);
}
```

**향상된 for문 (for-each)**

```
for (int num : arr) {
    System.out.println(num);
}
```

**2차원 배열 순회**

```
int[][] matrix = {{1, 2, 3}, {4, 5, 6}};

// 기본 for문
for (int i = 0; i < matrix.length; i++) {
    for (int j = 0; j < matrix[i].length; j++) {
        System.out.print(matrix[i][j] + " ");
    }
}

// 향상된 for문
for (int[] row : matrix) {
    for (int num : row) {
        System.out.print(num + " ");
    }
}
```

\---

## 2\. Arrays 클래스

java.util.Arrays 클래스는 배열을 다루는 다양한 유틸리티 메서드를 제공합니다.

### 2.1 배열 정렬 (sort)

**기본 정렬 (오름차순)**

```
static void sort(byte[] a)
static void sort(byte[] a, int fromIndex, int toIndex)
static void sort(char[] a)
static void sort(char[] a, int fromIndex, int toIndex)
static void sort(double[] a)
static void sort(double[] a, int fromIndex, int toIndex)
static void sort(float[] a)
static void sort(float[] a, int fromIndex, int toIndex)
static void sort(int[] a)
static void sort(int[] a, int fromIndex, int toIndex)
static void sort(long[] a)
static void sort(long[] a, int fromIndex, int toIndex)
static void sort(short[] a)
static void sort(short[] a, int fromIndex, int toIndex)
static void sort(Object[] a)
static void sort(Object[] a, int fromIndex, int toIndex)
static <T> void sort(T[] a, Comparator<? super T> c)
static <T> void sort(T[] a, int fromIndex, int toIndex, Comparator<? super T> c)
```

**사용 예시**

```
// 기본형 배열 정렬
int[] arr = {5, 2, 8, 1, 9};
Arrays.sort(arr);                                // [1, 2, 5, 8, 9]

// 부분 정렬 [fromIndex, toIndex)
int[] arr2 = {5, 2, 8, 1, 9};
Arrays.sort(arr2, 1, 4);                         // [5, 1, 2, 8, 9] (인덱스 1~3만 정렬)

// 객체 배열 정렬 (Comparable 구현 필요)
String[] words = {"banana", "apple", "cherry"};
Arrays.sort(words);                              // ["apple", "banana", "cherry"]

// Comparator를 사용한 정렬
Integer[] numbers = {5, 2, 8, 1, 9};
Arrays.sort(numbers, (a, b) -> b - a);           // [9, 8, 5, 2, 1] (내림차순)

// 문자열 길이순 정렬
String[] words2 = {"apple", "hi", "banana"};
Arrays.sort(words2, (a, b) -> a.length() - b.length());  // ["hi", "apple", "banana"]
```

**내림차순 정렬**

```
// Integer 배열 (Wrapper 클래스 사용)
Integer[] arr = {5, 2, 8, 1, 9};
Arrays.sort(arr, Collections.reverseOrder());    // [9, 8, 5, 2, 1]

// 또는 Comparator.reverseOrder() 사용
Arrays.sort(arr, Comparator.reverseOrder());     // [9, 8, 5, 2, 1]

// int[] 를 내림차순 정렬하려면
int[] arr2 = {5, 2, 8, 1, 9};
Arrays.sort(arr2);                               // 오름차순 정렬
// 배열 뒤집기
for (int i = 0; i < arr2.length / 2; i++) {
    int temp = arr2[i];
    arr2[i] = arr2[arr2.length - 1 - i];
    arr2[arr2.length - 1 - i] = temp;
}
// 또는 Integer[]로 변환
Integer[] arr3 = Arrays.stream(arr2).boxed().toArray(Integer[]::new);
Arrays.sort(arr3, Collections.reverseOrder());
```

### 2.2 이진 탐색 (binarySearch)

**정렬된 배열에서 값 찾기**

```
static int binarySearch(byte[] a, byte key)
static int binarySearch(byte[] a, int fromIndex, int toIndex, byte key)
static int binarySearch(char[] a, char key)
static int binarySearch(char[] a, int fromIndex, int toIndex, char key)
static int binarySearch(double[] a, double key)
static int binarySearch(double[] a, int fromIndex, int toIndex, double key)
static int binarySearch(float[] a, float key)
static int binarySearch(float[] a, int fromIndex, int toIndex, float key)
static int binarySearch(int[] a, int key)
static int binarySearch(int[] a, int fromIndex, int toIndex, int key)
static int binarySearch(long[] a, long key)
static int binarySearch(long[] a, int fromIndex, int toIndex, long key)
static int binarySearch(short[] a, short key)
static int binarySearch(short[] a, int fromIndex, int toIndex, short key)
static int binarySearch(Object[] a, Object key)
static int binarySearch(Object[] a, int fromIndex, int toIndex, Object key)
static <T> int binarySearch(T[] a, T key, Comparator<? super T> c)
static <T> int binarySearch(T[] a, int fromIndex, int toIndex, T key, Comparator<? super T> c)
```

**사용 예시**

```
int[] arr = {1, 2, 5, 8, 9};  // 정렬된 배열이어야 함!
int idx1 = Arrays.binarySearch(arr, 5);          // 2 (인덱스)
int idx2 = Arrays.binarySearch(arr, 3);          // -3 (없으면 -(삽입위치)-1)

// 반환값 해석
// 값이 있으면: 해당 인덱스 (>= 0)
// 값이 없으면: -(삽입위치) - 1 (< 0)
if (idx2 < 0) {
    int insertPos = -(idx2 + 1);                 // 2 (삽입될 위치)
}

// 부분 범위 검색
int idx3 = Arrays.binarySearch(arr, 1, 4, 8);    // 3
```

### 2.3 배열 채우기 (fill)

```
static void fill(boolean[] a, boolean val)
static void fill(boolean[] a, int fromIndex, int toIndex, boolean val)
static void fill(byte[] a, byte val)
static void fill(byte[] a, int fromIndex, int toIndex, byte val)
static void fill(char[] a, char val)
static void fill(char[] a, int fromIndex, int toIndex, char val)
static void fill(double[] a, double val)
static void fill(double[] a, int fromIndex, int toIndex, double val)
static void fill(float[] a, float val)
static void fill(float[] a, int fromIndex, int toIndex, float val)
static void fill(int[] a, int val)
static void fill(int[] a, int fromIndex, int toIndex, int val)
static void fill(long[] a, long val)
static void fill(long[] a, int fromIndex, int toIndex, long val)
static void fill(short[] a, short val)
static void fill(short[] a, int fromIndex, int toIndex, short val)
static void fill(Object[] a, Object val)
static void fill(Object[] a, int fromIndex, int toIndex, Object val)
```

**사용 예시**

```
int[] arr = new int[5];
Arrays.fill(arr, 10);                            // [10, 10, 10, 10, 10]

int[] arr2 = new int[5];
Arrays.fill(arr2, 1, 4, 99);                     // [0, 99, 99, 99, 0]

// 2차원 배열 채우기
int[][] matrix = new int[3][4];
for (int[] row : matrix) {
    Arrays.fill(row, -1);                        // 모든 요소를 -1로
}
```

### 2.4 배열 복사 (copyOf, copyOfRange)

```
static boolean[] copyOf(boolean[] original, int newLength)
static byte[] copyOf(byte[] original, int newLength)
static char[] copyOf(char[] original, int newLength)
static double[] copyOf(double[] original, int newLength)
static float[] copyOf(float[] original, int newLength)
static int[] copyOf(int[] original, int newLength)
static long[] copyOf(long[] original, int newLength)
static short[] copyOf(short[] original, int newLength)
static <T> T[] copyOf(T[] original, int newLength)
static <T,U> T[] copyOf(U[] original, int newLength, Class<? extends T[]> newType)

static boolean[] copyOfRange(boolean[] original, int from, int to)
static byte[] copyOfRange(byte[] original, int from, int to)
static char[] copyOfRange(char[] original, int from, int to)
static double[] copyOfRange(double[] original, int from, int to)
static float[] copyOfRange(float[] original, int from, int to)
static int[] copyOfRange(int[] original, int from, int to)
static long[] copyOfRange(long[] original, int from, int to)
static short[] copyOfRange(short[] original, int from, int to)
static <T> T[] copyOfRange(T[] original, int from, int to)
static <T,U> T[] copyOfRange(U[] original, int from, int to, Class<? extends T[]> newType)
```

**사용 예시**

```
int[] arr = {1, 2, 3, 4, 5};

// 전체 또는 크기 변경하여 복사
int[] copy1 = Arrays.copyOf(arr, arr.length);    // [1, 2, 3, 4, 5] (같은 크기)
int[] copy2 = Arrays.copyOf(arr, 3);             // [1, 2, 3] (작게)
int[] copy3 = Arrays.copyOf(arr, 7);             // [1, 2, 3, 4, 5, 0, 0] (크게, 0으로 채움)

// 범위 복사 [from, to)
int[] copy4 = Arrays.copyOfRange(arr, 1, 4);     // [2, 3, 4]
int[] copy5 = Arrays.copyOfRange(arr, 0, arr.length);  // 전체 복사
```

### 2.5 배열 비교 (equals, deepEquals)

```
static boolean equals(boolean[] a, boolean[] a2)
static boolean equals(byte[] a, byte[] a2)
static boolean equals(char[] a, char[] a2)
static boolean equals(double[] a, double[] a2)
static boolean equals(float[] a, float[] a2)
static boolean equals(int[] a, int[] a2)
static boolean equals(long[] a, long[] a2)
static boolean equals(short[] a, short[] a2)
static boolean equals(Object[] a, Object[] a2)

static boolean deepEquals(Object[] a1, Object[] a2)  // 다차원 배열 비교
```

**사용 예시**

```
int[] arr1 = {1, 2, 3};
int[] arr2 = {1, 2, 3};
int[] arr3 = {1, 2, 4};

boolean eq1 = Arrays.equals(arr1, arr2);         // true
boolean eq2 = Arrays.equals(arr1, arr3);         // false
boolean eq3 = (arr1 == arr2);                    // false (다른 객체)

// 2차원 배열 비교
int[][] matrix1 = {{1, 2}, {3, 4}};
int[][] matrix2 = {{1, 2}, {3, 4}};

boolean eq4 = Arrays.equals(matrix1, matrix2);   // false (1차원만 비교)
boolean eq5 = Arrays.deepEquals(matrix1, matrix2);  // true (재귀적으로 비교)
```

### 2.6 배열을 문자열로 변환 (toString, deepToString)

```
static String toString(boolean[] a)
static String toString(byte[] a)
static String toString(char[] a)
static String toString(double[] a)
static String toString(float[] a)
static String toString(int[] a)
static String toString(long[] a)
static String toString(short[] a)
static String toString(Object[] a)

static String deepToString(Object[] a)           // 다차원 배열용
```

**사용 예시**

```
int[] arr = {1, 2, 3, 4, 5};
String str1 = Arrays.toString(arr);              // "[1, 2, 3, 4, 5]"

// 2차원 배열
int[][] matrix = {{1, 2}, {3, 4}};
String str2 = Arrays.toString(matrix);           // "[[I@15db9742, [I@6d06d69c]" (주소)
String str3 = Arrays.deepToString(matrix);       // "[[1, 2], [3, 4]]" (내용)
```

### 2.7 배열을 리스트로 변환 (asList)

```
static <T> List<T> asList(T... a)                // 가변 인자 또는 배열을 List로
```

**사용 예시**

```
// 배열 → List
String[] arr = {"apple", "banana", "cherry"};
List<String> list = Arrays.asList(arr);

// 직접 값 전달
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 주의: 반환된 List는 고정 크기 (add, remove 불가)
// list.add("date");  // UnsupportedOperationException
// list.remove(0);    // UnsupportedOperationException

// 수정 가능한 List로 변환
List<String> mutableList = new ArrayList<>(Arrays.asList(arr));
mutableList.add("date");  // OK
```

### 2.8 병렬 정렬 (parallelSort)

**멀티코어 활용한 빠른 정렬**

```
static void parallelSort(byte[] a)
static void parallelSort(byte[] a, int fromIndex, int toIndex)
static void parallelSort(char[] a)
static void parallelSort(char[] a, int fromIndex, int toIndex)
static void parallelSort(double[] a)
static void parallelSort(double[] a, int fromIndex, int toIndex)
static void parallelSort(float[] a)
static void parallelSort(float[] a, int fromIndex, int toIndex)
static void parallelSort(int[] a)
static void parallelSort(int[] a, int fromIndex, int toIndex)
static void parallelSort(long[] a)
static void parallelSort(long[] a, int fromIndex, int toIndex)
static void parallelSort(short[] a)
static void parallelSort(short[] a, int fromIndex, int toIndex)
static <T extends Comparable<? super T>> void parallelSort(T[] a)
static <T extends Comparable<? super T>> void parallelSort(T[] a, int fromIndex, int toIndex)
static <T> void parallelSort(T[] a, Comparator<? super T> cmp)
static <T> void parallelSort(T[] a, int fromIndex, int toIndex, Comparator<? super T> cmp)
```

**사용 예시**

```
int[] largeArray = new int[1000000];
// ... 배열 초기화
Arrays.parallelSort(largeArray);  // 멀티코어 활용, 큰 배열에서 효율적
```

### 2.9 배열 채우기 (setAll, parallelSetAll)

**함수를 사용한 배열 초기화**

```
static void setAll(int[] array, IntUnaryOperator generator)
static void setAll(long[] array, IntToLongFunction generator)
static void setAll(double[] array, IntToDoubleFunction generator)
static <T> void setAll(T[] array, IntFunction<? extends T> generator)

static void parallelSetAll(int[] array, IntUnaryOperator generator)
static void parallelSetAll(long[] array, IntToLongFunction generator)
static void parallelSetAll(double[] array, IntToDoubleFunction generator)
static <T> void parallelSetAll(T[] array, IntFunction<? extends T> generator)
```

**사용 예시**

```
int[] arr = new int[5];
Arrays.setAll(arr, i -> i * 2);                  // [0, 2, 4, 6, 8]

String[] words = new String[5];
Arrays.setAll(words, i -> "item" + i);           // ["item0", "item1", "item2", "item3", "item4"]
```

### 2.10 해시코드 (hashCode, deepHashCode)

```
static int hashCode(boolean[] a)
static int hashCode(byte[] a)
static int hashCode(char[] a)
static int hashCode(double[] a)
static int hashCode(float[] a)
static int hashCode(int[] a)
static int hashCode(long[] a)
static int hashCode(short[] a)
static int hashCode(Object[] a)

static int deepHashCode(Object[] a)              // 다차원 배열용
```

**사용 예시**

```
int[] arr = {1, 2, 3};
int hash = Arrays.hashCode(arr);

int[][] matrix = {{1, 2}, {3, 4}};
int deepHash = Arrays.deepHashCode(matrix);
```

### 2.11 스트림 변환 (stream)

```
static IntStream stream(int[] array)
static IntStream stream(int[] array, int startInclusive, int endExclusive)
static LongStream stream(long[] array)
static LongStream stream(long[] array, int startInclusive, int endExclusive)
static DoubleStream stream(double[] array)
static DoubleStream stream(double[] array, int startInclusive, int endExclusive)
static <T> Stream<T> stream(T[] array)
static <T> Stream<T> stream(T[] array, int startInclusive, int endExclusive)
```

**사용 예시**

```
int[] arr = {1, 2, 3, 4, 5};
int sum = Arrays.stream(arr).sum();              // 15
double avg = Arrays.stream(arr).average().orElse(0);  // 3.0

String[] words = {"apple", "banana", "cherry"};
long count = Arrays.stream(words)
    .filter(w -> w.startsWith("a"))
    .count();                                    // 1
```

\---

## 3\. 알고리즘 문제 풀이 팁

### 3.1 자주 사용하는 패턴

**1\. 배열 정렬**

```
int[] arr = {5, 2, 8, 1, 9};
Arrays.sort(arr);                                // [1, 2, 5, 8, 9]
```

**2\. 배열 복사**

```
int[] original = {1, 2, 3, 4, 5};

// 방법 1: Arrays.copyOf
int[] copy1 = Arrays.copyOf(original, original.length);

// 방법 2: clone
int[] copy2 = original.clone();

// 방법 3: System.arraycopy
int[] copy3 = new int[original.length];
System.arraycopy(original, 0, copy3, 0, original.length);
```

**3\. 배열 초기화**

```
// 모두 0으로 (기본값)
int[] arr1 = new int[5];                         // [0, 0, 0, 0, 0]

// 특정 값으로 채우기
int[] arr2 = new int[5];
Arrays.fill(arr2, -1);                           // [-1, -1, -1, -1, -1]

// 함수로 초기화
int[] arr3 = new int[5];
Arrays.setAll(arr3, i -> i * 10);                // [0, 10, 20, 30, 40]
```

**4\. 이진 탐색**

```
int[] arr = {1, 2, 5, 8, 9};  // 정렬 필수!
int idx = Arrays.binarySearch(arr, 5);
if (idx >= 0) {
    System.out.println("찾음: " + idx);
} else {
    int insertPos = -(idx + 1);
    System.out.println("없음, 삽입 위치: " + insertPos);
}
```

**5\. 배열 → List 변환**

```
// Integer[] → List
Integer[] arr = {1, 2, 3, 4, 5};
List<Integer> list = Arrays.asList(arr);

// int[] → List (Stream 사용)
int[] intArr = {1, 2, 3, 4, 5};
List<Integer> list2 = Arrays.stream(intArr)
    .boxed()
    .collect(Collectors.toList());
```

**6\. 2차원 배열 정렬**

```
int[][] arr = {{3, 2}, {1, 4}, {2, 1}};

// 첫 번째 원소 기준 오름차순
Arrays.sort(arr, (a, b) -> a[0] - b[0]);         // [[1, 4], [2, 1], [3, 2]]

// 두 번째 원소 기준 내림차순
Arrays.sort(arr, (a, b) -> b[1] - a[1]);         // [[1, 4], [3, 2], [2, 1]]

// 첫 번째 원소 오름차순, 같으면 두 번째 원소 내림차순
Arrays.sort(arr, (a, b) -> {
    if (a[0] != b[0]) return a[0] - b[0];
    return b[1] - a[1];
});
```

**7\. 배열 최대/최소값 찾기**

```
int[] arr = {5, 2, 8, 1, 9};

// 방법 1: 반복문
int max = arr[0];
int min = arr[0];
for (int num : arr) {
    max = Math.max(max, num);
    min = Math.min(min, num);
}

// 방법 2: Stream
int max2 = Arrays.stream(arr).max().getAsInt();  // 9
int min2 = Arrays.stream(arr).min().getAsInt();  // 1

// 방법 3: 정렬 후
Arrays.sort(arr);
int min3 = arr[0];                               // 최소값
int max3 = arr[arr.length - 1];                  // 최대값
```

**8\. 배열 뒤집기**

```
int[] arr = {1, 2, 3, 4, 5};
for (int i = 0; i < arr.length / 2; i++) {
    int temp = arr[i];
    arr[i] = arr[arr.length - 1 - i];
    arr[arr.length - 1 - i] = temp;
}
// [5, 4, 3, 2, 1]
```

**9\. 배열 합계**

```
int[] arr = {1, 2, 3, 4, 5};

// 방법 1: 반복문
int sum = 0;
for (int num : arr) {
    sum += num;
}

// 방법 2: Stream
int sum2 = Arrays.stream(arr).sum();             // 15
```

**10\. 중복 제거**

```
int[] arr = {1, 2, 2, 3, 3, 3, 4, 5};
int[] unique = Arrays.stream(arr)
    .distinct()
    .toArray();                                  // [1, 2, 3, 4, 5]
```

\---

## 4\. 주의사항

### 4.1 배열 인덱스

```
int[] arr = new int[5];  // 인덱스: 0 ~ 4
// arr[5] = 10;  // ArrayIndexOutOfBoundsException!
```

### 4.2 배열 복사 - 얕은 복사 vs 깊은 복사

```
// 얕은 복사 (참조만 복사)
int[] arr1 = {1, 2, 3};
int[] arr2 = arr1;  // 같은 배열을 가리킴
arr2[0] = 100;
System.out.println(arr1[0]);  // 100 (arr1도 변경됨!)

// 깊은 복사 (새로운 배열 생성)
int[] arr3 = arr1.clone();
arr3[0] = 200;
System.out.println(arr1[0]);  // 100 (arr1은 변경 안됨)
```

### 4.3 Arrays.asList의 제한사항

```
List<Integer> list = Arrays.asList(1, 2, 3);
// list.add(4);  // UnsupportedOperationException (크기 고정)
// list.remove(0);  // UnsupportedOperationException

// 수정 가능한 List 필요 시
List<Integer> mutableList = new ArrayList<>(Arrays.asList(1, 2, 3));
mutableList.add(4);  // OK
```

### 4.4 정렬 전 이진 탐색 금지

```
int[] arr = {5, 2, 8, 1, 9};  // 정렬 안 됨!
// int idx = Arrays.binarySearch(arr, 5);  // 잘못된 결과!

Arrays.sort(arr);  // 먼저 정렬
int idx = Arrays.binarySearch(arr, 5);  // 정상 동작
```

### 4.5 2차원 배열 복사

```
int[][] original = {{1, 2}, {3, 4}};

// 얕은 복사 (행 참조만 복사)
int[][] shallow = original.clone();
shallow[0][0] = 100;
System.out.println(original[0][0]);  // 100 (원본도 변경!)

// 깊은 복사 (각 행도 복사)
int[][] deep = new int[original.length][];
for (int i = 0; i < original.length; i++) {
    deep[i] = original[i].clone();
}
deep[0][0] = 100;
System.out.println(original[0][0]);  // 1 (원본은 안 변경)
```

### 4.6 int\[\] vs Integer\[\]

```
// int[]는 기본형 배열 - Comparator 사용 불가
int[] arr1 = {5, 2, 8};
// Arrays.sort(arr1, Collections.reverseOrder());  // 컴파일 에러!

// Integer[]는 객체 배열 - Comparator 사용 가능
Integer[] arr2 = {5, 2, 8};
Arrays.sort(arr2, Collections.reverseOrder());   // OK

// 변환
int[] primitives = {1, 2, 3};
Integer[] objects = Arrays.stream(primitives).boxed().toArray(Integer[]::new);
```

\---
