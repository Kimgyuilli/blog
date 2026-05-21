---
title: "Java 래퍼 클래스 메서드 정리 (알고리즘 문제 풀이용)"
description: "알고리즘 문제를 풀 때 자주 사용하는 Java 래퍼 클래스들의 주요 메서드를 정리했습니다. parseInt 계열 valueOf 계열 toString 계열 사용 예시 10진수 → 다른 진법 (String 반환) 다른 진법 → 10진수 사용 예시 사용 예시 사용 예시 사용 예시"
pubDate: 2026-02-15
tags: ["java", "알고리즘"]
draft: false
slug: "tistory-76"
---
알고리즘 문제를 풀 때 자주 사용하는 Java 래퍼 클래스들의 주요 메서드를 정리했습니다.

![Java 래퍼 클래스 메서드 정리 (알고리즘 문제 풀이용)](/images/blog/tistory-76/image-01.png)

\---

## 1\. Integer 클래스

### 1.1 문자열 ↔ 정수 변환

**parseInt 계열**

```
static int parseInt(String s)                    // "123" → 123
static int parseInt(String s, int radix)         // "1010", 2 → 10 (진법 지정)
```

**valueOf 계열**

```
static Integer valueOf(String s)                 // "123" → Integer(123)
static Integer valueOf(String s, int radix)      // "1010", 2 → Integer(10)
static Integer valueOf(int i)                    // 123 → Integer(123)
```

**toString 계열**

```
static String toString(int i)                    // 123 → "123"
static String toString(int i, int radix)         // 10, 2 → "1010"
String toString()                                // 인스턴스 메서드
```

**사용 예시**

```
int num = Integer.parseInt("123");               // 기본형 반환
Integer obj = Integer.valueOf("123");            // 래퍼 객체 반환
String str = Integer.toString(123);              // "123"
```

### 1.2 진법 변환

**10진수 → 다른 진법 (String 반환)**

```
static String toBinaryString(int i)              // 10 → "1010"
static String toOctalString(int i)               // 10 → "12"
static String toHexString(int i)                 // 10 → "a"
```

**다른 진법 → 10진수**

```
static int parseInt(String s, int radix)         // "1010", 2 → 10
static Integer valueOf(String s, int radix)      // "FF", 16 → Integer(255)
```

**사용 예시**

```
String binary = Integer.toBinaryString(10);      // "1010"
int num = Integer.parseInt("1010", 2);           // 10
int num2 = Integer.parseInt("FF", 16);           // 255
```

### 1.3 상수값

```
Integer.MAX_VALUE    // 2147483647 (2^31 - 1)
Integer.MIN_VALUE    // -2147483648 (-2^31)
Integer.SIZE         // 32 (비트 수)
Integer.BYTES        // 4 (바이트 수)
```

### 1.4 비트 연산 관련

```
static int bitCount(int i)                       // 1비트 개수
static int highestOneBit(int i)                  // 최상위 1비트
static int lowestOneBit(int i)                   // 최하위 1비트
static int numberOfLeadingZeros(int i)           // 최상위 0 개수
static int numberOfTrailingZeros(int i)          // 최하위 0 개수
static int reverse(int i)                        // 비트 뒤집기
static int reverseBytes(int i)                   // 바이트 순서 뒤집기
static int rotateLeft(int i, int distance)       // 왼쪽 회전
static int rotateRight(int i, int distance)      // 오른쪽 회전
```

**사용 예시**

```
int count = Integer.bitCount(7);                 // 3 (111)
int highest = Integer.highestOneBit(10);         // 8 (1000)
int lowest = Integer.lowestOneBit(10);           // 2 (0010)
```

### 1.5 비교

```
static int compare(int x, int y)                 // x < y: -1, x == y: 0, x > y: 1
int compareTo(Integer anotherInteger)            // 인스턴스 메서드
static int max(int a, int b)                     // 최대값
static int min(int a, int b)                     // 최소값
```

**사용 예시**

```
int result = Integer.compare(10, 20);            // -1
int max = Integer.max(10, 20);                   // 20
int min = Integer.min(10, 20);                   // 10
```

### 1.6 부호 및 기타

```
static int signum(int i)                         // 양수: 1, 0: 0, 음수: -1
static int sum(int a, int b)                     // a + b
static int divideUnsigned(int dividend, int divisor)     // 부호없는 나눗셈
static int remainderUnsigned(int dividend, int divisor)  // 부호없는 나머지
int intValue()                                   // Integer → int
long longValue()                                 // Integer → long
double doubleValue()                             // Integer → double
```

**사용 예시**

```
int sign = Integer.signum(-10);                  // -1
int sum = Integer.sum(10, 20);                   // 30
int value = Integer.valueOf(123).intValue();     // 123
```

\---

## 2\. Long 클래스

Long은 Integer와 거의 동일한 메서드를 제공합니다. (반환 타입만 long)

### 2.1 문자열 ↔ 정수 변환

**parseLong 계열**

```
static long parseLong(String s)                  // "123456789" → 123456789L
static long parseLong(String s, int radix)       // "1010", 2 → 10L
```

**valueOf 계열**

```
static Long valueOf(String s)                    // "123456789" → Long(123456789)
static Long valueOf(String s, int radix)         // "1010", 2 → Long(10)
static Long valueOf(long l)                      // 123L → Long(123)
```

**toString 계열**

```
static String toString(long i)                   // 123L → "123"
static String toString(long i, int radix)        // 10L, 2 → "1010"
String toString()                                // 인스턴스 메서드
```

### 2.2 진법 변환

```
static String toBinaryString(long i)             // 10L → "1010"
static String toOctalString(long i)              // 10L → "12"
static String toHexString(long i)                // 10L → "a"
```

### 2.3 상수값

```
Long.MAX_VALUE       // 9223372036854775807 (2^63 - 1)
Long.MIN_VALUE       // -9223372036854775808 (-2^63)
Long.SIZE            // 64
Long.BYTES           // 8
```

### 2.4 비트 연산 관련

```
static int bitCount(long i)                      // 1비트 개수
static long highestOneBit(long i)                // 최상위 1비트
static long lowestOneBit(long i)                 // 최하위 1비트
static int numberOfLeadingZeros(long i)          // 최상위 0 개수
static int numberOfTrailingZeros(long i)         // 최하위 0 개수
static long reverse(long i)                      // 비트 뒤집기
static long reverseBytes(long i)                 // 바이트 순서 뒤집기
static long rotateLeft(long i, int distance)     // 왼쪽 회전
static long rotateRight(long i, int distance)    // 오른쪽 회전
```

### 2.5 비교 및 기타

```
static int compare(long x, long y)               // 비교
int compareTo(Long anotherLong)                  // 인스턴스 메서드
static long max(long a, long b)                  // 최대값
static long min(long a, long b)                  // 최소값
static int signum(long i)                        // 부호
static long sum(long a, long b)                  // 합
long longValue()                                 // Long → long
int intValue()                                   // Long → int (오버플로우 주의)
double doubleValue()                             // Long → double
```

\---

## 3\. Character 클래스

### 3.1 문자 타입 체크

**숫자 체크**

```
static boolean isDigit(char ch)                  // '5' → true, 'a' → false
static boolean isDigit(int codePoint)            // 유니코드 코드포인트용
```

**알파벳 체크**

```
static boolean isLetter(char ch)                 // 'a' → true, '5' → false
static boolean isLetter(int codePoint)
// ch == 'a' 형태로도 사용 가능
```

**알파벳 또는 숫자**

```
static boolean isLetterOrDigit(char ch)          // 'a' → true, '5' → true, '!' → false
static boolean isLetterOrDigit(int codePoint)
```

**공백 체크**

```
static boolean isWhitespace(char ch)             // ' ', '\t', '\n' → true
static boolean isWhitespace(int codePoint)
static boolean isSpaceChar(char ch)              // 스페이스 문자만
static boolean isSpaceChar(int codePoint)
```

**대소문자 체크**

```
static boolean isUpperCase(char ch)              // 'A' → true
static boolean isUpperCase(int codePoint)
static boolean isLowerCase(char ch)              // 'a' → true
static boolean isLowerCase(int codePoint)
```

**기타 타입 체크**

```
static boolean isAlphabetic(int codePoint)       // 알파벳인지
static boolean isISOControl(char ch)             // 제어문자인지
```

**사용 예시**

```
if (Character.isDigit('5')) {                    // true
    // 숫자 처리
}
if (Character.isLetter('a')) {                   // true
    // 알파벳 처리
}
if (Character.isLetterOrDigit('a')) {            // true
    // 알파벳 또는 숫자 처리
}
```

### 3.2 대소문자 변환

```
static char toUpperCase(char ch)                 // 'a' → 'A'
static int toUpperCase(int codePoint)
static char toLowerCase(char ch)                 // 'A' → 'a'
static int toLowerCase(int codePoint)
static char toTitleCase(char ch)                 // 타이틀 케이스로 (일부 문자)
static int toTitleCase(int codePoint)
```

**사용 예시**

```
char upper = Character.toUpperCase('a');         // 'A'
char lower = Character.toLowerCase('A');         // 'a'
```

### 3.3 문자 ↔ 숫자 변환

**숫자 값 얻기**

```
static int getNumericValue(char ch)              // '5' → 5, 'A' → 10 (16진수)
static int getNumericValue(int codePoint)
static int digit(char ch, int radix)             // 진법 지정하여 숫자 값 얻기
static int digit(int codePoint, int radix)
```

**문자 생성**

```
static char forDigit(int digit, int radix)       // 5, 10 → '5', 10, 16 → 'a'
static char toString(char c)                     // char → String (deprecated, valueOf 사용 권장)
static String toString(char c)                   // 'a' → "a"
```

**사용 예시**

```
// char → int (숫자 문자인 경우)
int num = Character.getNumericValue('5');        // 5
int num = '5' - '0';                             // 5 (더 자주 사용)

// int → char
char ch = (char)(num + '0');                     // num이 0~9일 때

// char → String
String str = Character.toString('a');            // "a"
String str = String.valueOf('a');                // "a" (더 자주 사용)
```

### 3.4 비교

```
static int compare(char x, char y)               // x < y: -1, x == y: 0, x > y: 1
int compareTo(Character anotherCharacter)        // 인스턴스 메서드
```

**사용 예시**

```
int result = Character.compare('a', 'b');        // -1
int result = Character.compare('b', 'a');        // 1
int result = Character.compare('a', 'a');        // 0
```

### 3.5 기타

```
char charValue()                                 // Character → char
static char reverseBytes(char ch)                // 바이트 순서 뒤집기
static String getName(int codePoint)             // 유니코드 이름 얻기
```

\---

## 4\. Double 클래스

### 4.1 문자열 ↔ 실수 변환

**parseDouble 계열**

```
static double parseDouble(String s)              // "3.14" → 3.14
```

**valueOf 계열**

```
static Double valueOf(String s)                  // "3.14" → Double(3.14)
static Double valueOf(double d)                  // 3.14 → Double(3.14)
```

**toString 계열**

```
static String toString(double d)                 // 3.14 → "3.14"
String toString()                                // 인스턴스 메서드
static String toHexString(double d)              // 16진수 문자열로
```

### 4.2 상수값

```
Double.MAX_VALUE           // 1.7976931348623157E308
Double.MIN_VALUE           // 4.9E-324 (양수 최소값, 0에 가장 가까운 값)
Double.MIN_NORMAL          // 2.2250738585072014E-308 (정규화된 최소값)
Double.POSITIVE_INFINITY   // 양의 무한대 (1.0 / 0.0)
Double.NEGATIVE_INFINITY   // 음의 무한대 (-1.0 / 0.0)
Double.NaN                 // Not a Number (0.0 / 0.0)
Double.MAX_EXPONENT        // 1023
Double.MIN_EXPONENT        // -1022
Double.SIZE                // 64 (비트 수)
Double.BYTES               // 8 (바이트 수)
```

### 4.3 특수값 체크

```
static boolean isNaN(double v)                   // NaN인지 확인
boolean isNaN()                                  // 인스턴스 메서드
static boolean isInfinite(double v)              // 무한대인지 확인
boolean isInfinite()                             // 인스턴스 메서드
static boolean isFinite(double d)                // 유한값인지 확인 (Java 8+)
```

**사용 예시**

```
boolean isNaN = Double.isNaN(0.0 / 0.0);         // true
boolean isInf = Double.isInfinite(1.0 / 0.0);    // true
boolean isFinite = Double.isFinite(3.14);        // true
```

### 4.4 비교

```
static int compare(double d1, double d2)         // 비교 (-1, 0, 1)
int compareTo(Double anotherDouble)              // 인스턴스 메서드
static double max(double a, double b)            // 최대값
static double min(double a, double b)            // 최소값
```

### 4.5 비트 표현 변환

```
static long doubleToLongBits(double value)      // double → long (비트)
static long doubleToRawLongBits(double value)   // NaN 보존하여 변환
static double longBitsToDouble(long bits)       // long → double (비트)
```

### 4.6 기타

```
double doubleValue()                             // Double → double
int intValue()                                   // Double → int
long longValue()                                 // Double → long
float floatValue()                               // Double → float
static double sum(double a, double b)            // 합
```

\---

## 5\. Float 클래스

Float은 Double과 거의 동일한 메서드를 제공합니다. (반환 타입만 float)

### 5.1 문자열 ↔ 실수 변환

```
static float parseFloat(String s)               // "3.14" → 3.14f
static Float valueOf(String s)                   // "3.14" → Float(3.14)
static Float valueOf(float f)                    // 3.14f → Float(3.14)
static String toString(float f)                  // 3.14f → "3.14"
String toString()                                // 인스턴스 메서드
static String toHexString(float f)               // 16진수 문자열로
```

### 5.2 상수값

```
Float.MAX_VALUE           // 3.4028235E38
Float.MIN_VALUE           // 1.4E-45 (양수 최소값)
Float.MIN_NORMAL          // 1.17549435E-38 (정규화된 최소값)
Float.POSITIVE_INFINITY   // 양의 무한대
Float.NEGATIVE_INFINITY   // 음의 무한대
Float.NaN                 // Not a Number
Float.MAX_EXPONENT        // 127
Float.MIN_EXPONENT        // -126
Float.SIZE                // 32
Float.BYTES               // 4
```

### 5.3 특수값 체크

```
static boolean isNaN(float v)                    // NaN인지 확인
boolean isNaN()                                  // 인스턴스 메서드
static boolean isInfinite(float v)               // 무한대인지 확인
boolean isInfinite()                             // 인스턴스 메서드
static boolean isFinite(float f)                 // 유한값인지 확인
```

### 5.4 비교

```
static int compare(float f1, float f2)           // 비교
int compareTo(Float anotherFloat)                // 인스턴스 메서드
static float max(float a, float b)               // 최대값
static float min(float a, float b)               // 최소값
```

### 5.5 비트 표현 변환

```
static int floatToIntBits(float value)           // float → int (비트)
static int floatToRawIntBits(float value)        // NaN 보존하여 변환
static float intBitsToFloat(int bits)            // int → float (비트)
```

### 5.6 기타

```
float floatValue()                               // Float → float
int intValue()                                   // Float → int
long longValue()                                 // Float → long
double doubleValue()                             // Float → double
static float sum(float a, float b)               // 합
```

\---

## 6\. Boolean 클래스

### 6.1 문자열 ↔ 불린 변환

**parseBoolean 계열**

```
static boolean parseBoolean(String s)            // "true" → true, 그 외 → false
```

**valueOf 계열**

```
static Boolean valueOf(String s)                 // "true" → Boolean(true)
static Boolean valueOf(boolean b)                // true → Boolean(true)
```

**toString 계열**

```
static String toString(boolean b)                // true → "true"
String toString()                                // 인스턴스 메서드
```

**사용 예시**

```
boolean b1 = Boolean.parseBoolean("true");       // true
boolean b2 = Boolean.parseBoolean("false");      // false
boolean b3 = Boolean.parseBoolean("True");       // true (대소문자 무시)
boolean b4 = Boolean.parseBoolean("abc");        // false (true 아니면 모두 false)

String str = Boolean.toString(true);             // "true"
```

### 6.2 논리 연산

```
static boolean logicalAnd(boolean a, boolean b)  // a && b
static boolean logicalOr(boolean a, boolean b)   // a || b
static boolean logicalXor(boolean a, boolean b)  // a ^ b (XOR)
```

**사용 예시**

```
boolean result1 = Boolean.logicalAnd(true, false);   // false
boolean result2 = Boolean.logicalOr(true, false);    // true
boolean result3 = Boolean.logicalXor(true, false);   // true
boolean result4 = Boolean.logicalXor(true, true);    // false
```

### 6.3 비교

```
static int compare(boolean x, boolean y)         // false < true
int compareTo(Boolean b)                         // 인스턴스 메서드
```

**사용 예시**

```
int result1 = Boolean.compare(true, false);      // 1 (true > false)
int result2 = Boolean.compare(false, true);      // -1 (false < true)
int result3 = Boolean.compare(true, true);       // 0
```

### 6.4 기타

```
boolean booleanValue()                           // Boolean → boolean
static int hashCode(boolean value)               // 해시코드 생성
```

### 6.5 상수값

```
Boolean.TRUE                                     // Boolean(true)
Boolean.FALSE                                    // Boolean(false)
```

\---

## 알고리즘 문제 풀이 팁

### 자주 사용하는 패턴

1.  **숫자 문자를 정수로 변환
    **char ch = '5'; int num = ch - '0'; // 5
2.  **진법 변환
    **// 2진수 문자열을 10진수로 int decimal = Integer.parseInt("1010", 2); // 10진수를 2진수 문자열로 String binary = Integer.toBinaryString(10);
3.  **최대값/최소값 상수 활용
    **int max = Integer.MIN\_VALUE; // 최대값 찾을 때 초기값 int min = Integer.MAX\_VALUE; // 최소값 찾을 때 초기값
4.  **문자 타입 체크
    **if (Character.isDigit(ch)) { // 숫자 처리 } if (Character.isLetter(ch)) { // 알파벳 처리 }
5.  **비트 연산
    **int count = Integer.bitCount(n); // 1의 개수 세기

\---

## 주의사항

1.  **parseInt vs valueOf**
    -   parseInt(): 기본형 반환 (int, long 등)
    -   valueOf(): 래퍼 객체 반환 (Integer, Long 등)
    -   알고리즘 문제에서는 보통 parseInt() 사용
2.  **Autoboxing/Unboxing
    **Integer a = 10; // Autoboxing (int → Integer) int b = a; // Unboxing (Integer → int)
3.  **null 체크
    **Integer num = null;
    int value = num; // NullPointerException 발생!
4.  **정수 오버플로우
    **int a = Integer.MAX\_VALUE; int b = a + 1; // 오버플로우! -2147483648 // 큰 수 계산 시 long 사용 long c = (long)a + 1; // 정상 동작
