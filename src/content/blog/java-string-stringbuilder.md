---
title: "Java String, StringBuilder 메서드 정리 (알고리즘 문제 풀이용)"
description: "알고리즘 문제를 풀 때 자주 사용하는 Java String과 StringBuilder 클래스의 주요 메서드를 정리했습니다. String은 불변(immutable) 객체입니다. 한 번 생성되면 값을 변경할 수 없습니다. 길이 문자 접근 사용 예시 사용 예시 indexOf 계열"
image: "/images/blog/java-string-stringbuilder/image-01.jpg"
pubDate: 2026-02-15
category: "language-note"
tags: ["java", "알고리즘"]
draft: false
slug: "java-string-stringbuilder"
---
![Java String, StringBuilder 메서드 정리 (알고리즘 문제 풀이용)](/images/blog/java-string-stringbuilder/image-01.jpg)

알고리즘 문제를 풀 때 자주 사용하는 Java String과 StringBuilder 클래스의 주요 메서드를 정리했습니다.

\---

## 1\. String 클래스

String은 불변(immutable) 객체입니다. 한 번 생성되면 값을 변경할 수 없습니다.

### 1.1 문자열 길이 및 접근

**길이**

```java
int length()                                     // 문자열 길이
boolean isEmpty()                                // 길이가 0인지 확인
boolean isBlank()                                // 공백만 있는지 확인 (Java 11+)
```

**문자 접근**

```java
char charAt(int index)                           // index 위치의 문자 반환
int codePointAt(int index)                       // 유니코드 코드포인트
char[] toCharArray()                             // char 배열로 변환
```

**사용 예시**

```java
String str = "Hello";
int len = str.length();                          // 5
char ch = str.charAt(0);                         // 'H'
char[] chars = str.toCharArray();                // ['H', 'e', 'l', 'l', 'o']
```

### 1.2 부분 문자열 추출

```java
String substring(int beginIndex)                 // beginIndex부터 끝까지
String substring(int beginIndex, int endIndex)   // [beginIndex, endIndex)
CharSequence subSequence(int beginIndex, int endIndex)  // substring과 동일
```

**사용 예시**

```java
String str = "Hello World";
String sub1 = str.substring(6);                  // "World"
String sub2 = str.substring(0, 5);               // "Hello"
String sub3 = str.substring(6, 11);              // "World"
```

### 1.3 문자열 검색

**indexOf 계열 (앞에서부터 검색)**

```java
int indexOf(int ch)                              // 문자 ch의 첫 위치 (-1: 없음)
int indexOf(int ch, int fromIndex)               // fromIndex부터 검색
// 파라미터는 int지만 char로 전달시 자동으로 int 변환
int indexOf(String str)                          // 문자열 str의 첫 위치
int indexOf(String str, int fromIndex)           // fromIndex부터 검색
```

**lastIndexOf 계열 (뒤에서부터 검색)**

```java
int lastIndexOf(int ch)                          // 문자 ch의 마지막 위치
int lastIndexOf(int ch, int fromIndex)           // fromIndex부터 역방향 검색
int lastIndexOf(String str)                      // 문자열 str의 마지막 위치
int lastIndexOf(String str, int fromIndex)       // fromIndex부터 역방향 검색
```

**사용 예시**

```java
String str = "Hello World";
int idx1 = str.indexOf('o');                     // 4
int idx2 = str.lastIndexOf('o');                 // 7
int idx3 = str.indexOf("World");                 // 6
int idx4 = str.indexOf('x');                     // -1 (없음)
```

### 1.4 문자열 포함 확인

```java
boolean contains(CharSequence s)                 // 문자열 s를 포함하는지
boolean startsWith(String prefix)                // prefix로 시작하는지
boolean startsWith(String prefix, int offset)    // offset 위치에서 prefix로 시작하는지
boolean endsWith(String suffix)                  // suffix로 끝나는지
boolean matches(String regex)                    // 정규표현식과 일치하는지
```

**사용 예시**

```java
String str = "Hello World";
boolean b1 = str.contains("World");              // true
boolean b2 = str.startsWith("Hello");            // true
boolean b3 = str.endsWith("World");              // true
boolean b4 = str.matches("[A-Z].*");             // true (대문자로 시작)
```

### 1.5 문자열 비교

**equals 계열**

```java
boolean equals(Object obj)                       // 내용 비교 (대소문자 구분)
boolean equalsIgnoreCase(String anotherString)   // 대소문자 무시하고 비교
boolean contentEquals(CharSequence cs)           // CharSequence와 비교
boolean contentEquals(StringBuffer sb)           // StringBuffer와 비교
```

**compareTo 계열 (사전순 비교)**

```java
int compareTo(String anotherString)              // 사전순 비교 (대소문자 구분)
int compareToIgnoreCase(String str)              // 대소문자 무시하고 비교
```

**사용 예시**

```java
String s1 = "apple";
String s2 = "Apple";
String s3 = "banana";

boolean eq1 = s1.equals(s2);                     // false
boolean eq2 = s1.equalsIgnoreCase(s2);           // true

int cmp1 = s1.compareTo(s3);                     // 음수 (apple < banana)
int cmp2 = s1.compareTo(s1);                     // 0 (같음)
int cmp3 = s3.compareTo(s1);                     // 양수 (banana > apple)
```

### 1.6 문자열 변환

**대소문자 변환**

```java
String toLowerCase()                             // 소문자로 변환
String toLowerCase(Locale locale)                // 로케일 지정
String toUpperCase()                             // 대문자로 변환
String toUpperCase(Locale locale)                // 로케일 지정
```

**공백 제거**

```java
String trim()                                    // 양쪽 공백 제거
String strip()                                   // 양쪽 유니코드 공백 제거 (Java 11+)
String stripLeading()                            // 앞쪽 공백 제거 (Java 11+)
String stripTrailing()                           // 뒤쪽 공백 제거 (Java 11+)
```

**사용 예시**

```java
String str1 = "Hello World";
String lower = str1.toLowerCase();               // "hello world"
String upper = str1.toUpperCase();               // "HELLO WORLD"

String str2 = "  Hello  ";
String trimmed = str2.trim();                    // "Hello"
```

### 1.7 문자열 치환

```java
String replace(char oldChar, char newChar)       // 문자 치환
String replace(CharSequence target, CharSequence replacement)  // 문자열 치환
String replaceAll(String regex, String replacement)  // 정규표현식으로 치환
String replaceFirst(String regex, String replacement) // 첫 번째만 치환
```

**사용 예시**

```java
String str = "Hello World";
String r1 = str.replace('o', 'a');               // "Hella Warld"
String r2 = str.replace("World", "Java");        // "Hello Java"
String r3 = str.replaceAll("l+", "L");           // "HeLo WorLd" (연속된 l을 L로)
String r4 = str.replaceFirst("l", "L");          // "HeLlo World"
```

### 1.8 문자열 분할

```java
String[] split(String regex)                     // 정규표현식으로 분할
String[] split(String regex, int limit)          // limit: 최대 분할 개수
```

**사용 예시**

```java
String str = "apple,banana,cherry";
String[] arr1 = str.split(",");                  // ["apple", "banana", "cherry"]
String[] arr2 = str.split(",", 2);               // ["apple", "banana,cherry"]

String str2 = "a b  c   d";                      // 공백이 여러 개
String[] arr3 = str2.split("\\s+");              // ["a", "b", "c", "d"] (정규표현식)
```

### 1.9 문자열 결합

```java
String concat(String str)                        // 문자열 연결
static String join(CharSequence delimiter, CharSequence... elements)  // 구분자로 결합
static String join(CharSequence delimiter, Iterable<? extends CharSequence> elements)
```

**사용 예시**

```java
String s1 = "Hello";
String s2 = "World";
String result1 = s1.concat(" ").concat(s2);      // "Hello World"

String result2 = String.join(", ", "apple", "banana", "cherry");  // "apple, banana, cherry"

List<String> list = Arrays.asList("a", "b", "c");
String result3 = String.join("-", list);         // "a-b-c"
```

### 1.10 문자열 포맷팅

```java
static String format(String format, Object... args)  // 형식화된 문자열 생성
static String format(Locale l, String format, Object... args)
String formatted(Object... args)                 // 인스턴스 메서드 (Java 15+)
```

**사용 예시**

```java
String s1 = String.format("이름: %s, 나이: %d", "홍길동", 25);  // "이름: 홍길동, 나이: 25"
String s2 = String.format("%.2f", 3.14159);      // "3.14"
String s3 = String.format("%5d", 42);            // "   42" (5자리, 오른쪽 정렬)
String s4 = String.format("%-5d", 42);           // "42   " (5자리, 왼쪽 정렬)
```

### 1.11 반복

```java
String repeat(int count)                         // count번 반복 (Java 11+)
```

**사용 예시**

```java
String str = "ab";
String repeated = str.repeat(3);                 // "ababab"
```

### 1.12 기타 변환

```java
static String valueOf(boolean b)                 // boolean → String
static String valueOf(char c)                    // char → String
static String valueOf(char[] data)               // char[] → String
static String valueOf(char[] data, int offset, int count)
static String valueOf(double d)                  // double → String
static String valueOf(float f)                   // float → String
static String valueOf(int i)                     // int → String
static String valueOf(long l)                    // long → String
static String valueOf(Object obj)                // Object → String (obj.toString())

byte[] getBytes()                                // String → byte[] (기본 인코딩)
byte[] getBytes(String charsetName)              // 인코딩 지정
byte[] getBytes(Charset charset)
```

**사용 예시**

```java
String s1 = String.valueOf(123);                 // "123"
String s2 = String.valueOf(true);                // "true"
String s3 = String.valueOf(3.14);                // "3.14"

byte[] bytes = "Hello".getBytes();               // byte 배열로
```

### 1.13 인턴 풀

```java
String intern()                                  // String Pool에 등록/반환
```

\---

## 2\. StringBuilder 클래스

StringBuilder는 가변(mutable) 문자열입니다. 문자열을 자주 수정할 때 String보다 효율적입니다. **StringBuffer와 거의 동일하나 StringBuilder가 동기화되지 않아 더 빠릅니다. (알고리즘에서는 StringBuilder 사용)**

### 2.1 생성자

```java
StringBuilder()                                  // 빈 문자열, 초기 용량 16
StringBuilder(int capacity)                      // 초기 용량 지정
StringBuilder(String str)                        // str로 초기화
StringBuilder(CharSequence seq)                  // CharSequence로 초기화
```

**사용 예시**

```java
StringBuilder sb1 = new StringBuilder();         // ""
StringBuilder sb2 = new StringBuilder(100);      // 용량 100
StringBuilder sb3 = new StringBuilder("Hello");  // "Hello"
```

### 2.2 문자열 추가 (append)

```java
StringBuilder append(boolean b)                  // boolean 추가
StringBuilder append(char c)                     // char 추가
StringBuilder append(char[] str)                 // char[] 추가
StringBuilder append(char[] str, int offset, int len)  // 부분 배열 추가
StringBuilder append(double d)                   // double 추가
StringBuilder append(float f)                    // float 추가
StringBuilder append(int i)                      // int 추가
StringBuilder append(long lng)                   // long 추가
StringBuilder append(Object obj)                 // Object.toString() 추가
StringBuilder append(String str)                 // String 추가
StringBuilder append(StringBuffer sb)            // StringBuffer 추가
StringBuilder append(CharSequence s)             // CharSequence 추가
StringBuilder append(CharSequence s, int start, int end)  // 부분 추가
```

**사용 예시**

```java
StringBuilder sb = new StringBuilder();
sb.append("Hello");                              // "Hello"
sb.append(' ').append("World");                  // "Hello World"
sb.append(123);                                  // "Hello World123"
sb.append(true);                                 // "Hello World123true"
```

### 2.3 문자열 삽입 (insert)

```java
StringBuilder insert(int offset, boolean b)      // offset 위치에 삽입
StringBuilder insert(int offset, char c)
StringBuilder insert(int offset, char[] str)
StringBuilder insert(int index, char[] str, int offset, int len)
StringBuilder insert(int offset, double d)
StringBuilder insert(int offset, float f)
StringBuilder insert(int offset, int i)
StringBuilder insert(int offset, long l)
StringBuilder insert(int offset, Object obj)
StringBuilder insert(int offset, String str)
StringBuilder insert(int dstOffset, CharSequence s)
StringBuilder insert(int dstOffset, CharSequence s, int start, int end)
```

**사용 예시**

```java
StringBuilder sb = new StringBuilder("Hello World");
sb.insert(6, "Java ");                           // "Hello Java World"
sb.insert(0, ">> ");                             // ">> Hello Java World"
```

### 2.4 문자열 삭제 (delete)

```java
StringBuilder delete(int start, int end)         // [start, end) 범위 삭제
StringBuilder deleteCharAt(int index)            // index 위치의 문자 삭제
```

**사용 예시**

```java
StringBuilder sb = new StringBuilder("Hello World");
sb.delete(5, 11);                                // "Hello"
sb.deleteCharAt(0);                              // "ello"
```

### 2.5 문자열 치환 (replace)

```java
StringBuilder replace(int start, int end, String str)  // [start, end) 범위를 str로 치환
```

**사용 예시**

```java
StringBuilder sb = new StringBuilder("Hello World");
sb.replace(6, 11, "Java");                       // "Hello Java"
```

### 2.6 문자열 역순 (reverse)

```java
StringBuilder reverse()                          // 문자열 뒤집기
```

**사용 예시**

```java
StringBuilder sb = new StringBuilder("Hello");
sb.reverse();                                    // "olleH"
```

### 2.7 문자 접근 및 수정

```java
char charAt(int index)                           // index 위치의 문자
void setCharAt(int index, char ch)               // index 위치의 문자를 ch로 변경
int codePointAt(int index)                       // 유니코드 코드포인트
String substring(int start)                      // [start, 끝) 부분 문자열
String substring(int start, int end)             // [start, end) 부분 문자열
CharSequence subSequence(int start, int end)     // [start, end) 부분 문자열
```

**사용 예시**

```java
StringBuilder sb = new StringBuilder("Hello");
char ch = sb.charAt(0);                          // 'H'
sb.setCharAt(0, 'h');                            // "hello"
String sub = sb.substring(1, 4);                 // "ell"
```

### 2.8 길이 및 용량

```java
int length()                                     // 현재 길이
void setLength(int newLength)                    // 길이 변경
int capacity()                                   // 현재 용량
void ensureCapacity(int minimumCapacity)         // 최소 용량 보장
void trimToSize()                                // 용량을 현재 길이에 맞춤
```

**사용 예시**

```java
StringBuilder sb = new StringBuilder("Hello");
int len = sb.length();                           // 5
int cap = sb.capacity();                         // 21 (초기 16 + 5)
sb.setLength(3);                                 // "Hel"
sb.ensureCapacity(50);                           // 용량을 최소 50으로
```

### 2.9 문자열 변환

```java
String toString()                                // String으로 변환
```

**사용 예시**

```java
StringBuilder sb = new StringBuilder("Hello");
String str = sb.toString();                      // "Hello"
```

### 2.10 검색

```java
int indexOf(String str)                          // str의 첫 위치
int indexOf(String str, int fromIndex)           // fromIndex부터 검색
int lastIndexOf(String str)                      // str의 마지막 위치
int lastIndexOf(String str, int fromIndex)       // fromIndex부터 역방향 검색
```

**사용 예시**

```java
StringBuilder sb = new StringBuilder("Hello World");
int idx1 = sb.indexOf("o");                      // 4
int idx2 = sb.lastIndexOf("o");                  // 7
```

\---

## 3\. StringBuffer 클래스

StringBuffer는 StringBuilder와 거의 동일하지만 **동기화(synchronized)** 되어 있습니다. 멀티스레드 환경에서 안전하지만, 알고리즘 문제 풀이에서는 성능이 더 좋은 StringBuilder를 사용하는 것이 일반적입니다.

**주요 메서드는 StringBuilder와 동일:**

-   append, insert, delete, deleteCharAt, replace, reverse
-   charAt, setCharAt, substring, indexOf, lastIndexOf
-   length, setLength, capacity, ensureCapacity, trimToSize
-   toString

\---

## 알고리즘 문제 풀이 팁

### String vs StringBuilder 선택 기준

**String 사용:**

-   문자열이 변하지 않을 때
-   문자열 비교, 검색만 할 때
-   간단한 문자열 조작

**StringBuilder 사용:**

-   문자열을 반복적으로 수정할 때
-   문자열을 여러 번 연결할 때
-   반복문 안에서 문자열을 조작할 때

### 자주 사용하는 패턴

**1\. 문자열 뒤집기**

```java
// String 사용
String str = "Hello";
String reversed = new StringBuilder(str).reverse().toString();  // "olleH"

// StringBuilder 사용
StringBuilder sb = new StringBuilder("Hello");
sb.reverse();  // "olleH"
```

**2\. 문자 배열로 변환해서 처리**

```java
String str = "Hello";
char[] chars = str.toCharArray();
// 배열 조작
Arrays.sort(chars);  // "Helo"로 정렬
String result = new String(chars);
```

**3\. 반복문에서 문자열 연결**

```java
// 나쁜 예 - String 사용 (O(n²))
String result = "";
for (int i = 0; i < 1000; i++) {
    result += i + " ";  // 매번 새로운 String 객체 생성
}

// 좋은 예 - StringBuilder 사용 (O(n))
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i).append(" ");
}
String result = sb.toString();
```

**4\. 문자열 분할 및 처리**

```java
String input = "1 2 3 4 5";
String[] tokens = input.split(" ");
int sum = 0;
for (String token : tokens) {
    sum += Integer.parseInt(token);
}
```

**5\. 특정 문자 제거**

```java
// replace 사용
String str = "a-b-c-d";
String result = str.replace("-", "");  // "abcd"

// replaceAll 사용 (정규표현식)
String str2 = "a1b2c3";
String result2 = str2.replaceAll("[0-9]", "");  // "abc"
```

**6\. 공백으로 구분된 입력 처리**

```java
String input = "apple banana cherry";
String[] words = input.split("\\s+");  // 공백이 여러 개여도 처리
```

**7\. 문자열 포맷팅**

```java
int hour = 9, minute = 5;
String time = String.format("%02d:%02d", hour, minute);  // "09:05"

double score = 85.678;
String formatted = String.format("%.2f", score);  // "85.68"
```

**8\. StringBuilder로 조건부 문자열 생성**

```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 5; i++) {
    if (i > 0) sb.append(", ");
    sb.append(i);
}
String result = sb.toString();  // "0, 1, 2, 3, 4"
```

\---

## 주의사항

### 1\. String의 불변성

```java
String str = "Hello";
str.concat(" World");  // 새로운 String 객체가 생성되지만 str은 변하지 않음!
System.out.println(str);  // "Hello" (변하지 않음)

// 올바른 사용
str = str.concat(" World");  // 새로운 객체를 다시 할당
System.out.println(str);  // "Hello World"
```

### 2\. equals vs ==

```java
String s1 = new String("Hello");
String s2 = new String("Hello");
System.out.println(s1 == s2);        // false (다른 객체)
System.out.println(s1.equals(s2));   // true (내용이 같음)

// 리터럴은 String Pool에 저장됨
String s3 = "Hello";
String s4 = "Hello";
System.out.println(s3 == s4);        // true (같은 객체)
```

### 3\. split의 정규표현식

```java
String str = "a.b.c";
String[] arr1 = str.split(".");      // [] (빈 배열) - . 은 정규표현식에서 모든 문자
String[] arr2 = str.split("\\.");    // ["a", "b", "c"] - 이스케이프 필요
```

### 4\. substring의 범위

```java
String str = "Hello";
String sub = str.substring(1, 4);    // "ell" ([1, 4) - 4는 포함 안됨)
```

### 5\. StringBuilder 초기 용량

```java
// 문자열 길이를 대략 알 때는 초기 용량 지정이 효율적
StringBuilder sb = new StringBuilder(10000);  // 큰 문자열 생성 시
```

### 6\. null 처리

```java
String str = null;
// str.length();  // NullPointerException!

// 안전한 처리
if (str != null && !str.isEmpty()) {
    // 처리
}
```

\---
