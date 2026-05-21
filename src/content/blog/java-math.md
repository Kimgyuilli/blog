---
title: "Java Math 클래스와 기타 유틸리티 정리 (알고리즘 문제 풀이용)"
description: "알고리즘 문제를 풀 때 자주 사용하는 Java Math 클래스와 기타 유틸리티의 주요 메서드를 정리했습니다. java.lang.Math 클래스는 수학 연산을 위한 static 메서드들을 제공합니다. 사용 예시 사용 예시 사용 예시 사용 예시 사용 예시 사용 예시 사용 예시"
image: "/images/blog/java-math/image-01.png"
pubDate: 2026-02-15
category: "language-note"
tags: ["java", "알고리즘"]
draft: false
slug: "java-math"
---
![Java Math 클래스와 기타 유틸리티 정리 (알고리즘 문제 풀이용)](/images/blog/java-math/image-01.png)

알고리즘 문제를 풀 때 자주 사용하는 Java Math 클래스와 기타 유틸리티의 주요 메서드를 정리했습니다.

\---

## 1\. Math 클래스

java.lang.Math 클래스는 수학 연산을 위한 static 메서드들을 제공합니다.

### 1.1 상수

```
static double E                                  // 자연로그의 밑 (2.718281828459045)
static double PI                                 // 원주율 (3.141592653589793)
```

### 1.2 절대값

```
static int abs(int a)
static long abs(long a)
static float abs(float a)
static double abs(double a)
```

**사용 예시**

```
int a = Math.abs(-10);                           // 10
long b = Math.abs(-100L);                        // 100
double c = Math.abs(-3.14);                      // 3.14
```

### 1.3 최대값/최소값

```
static int max(int a, int b)
static long max(long a, long b)
static float max(float a, float b)
static double max(double a, double b)

static int min(int a, int b)
static long min(long a, long b)
static float min(float a, float b)
static double min(double a, double b)
```

**사용 예시**

```
int max = Math.max(10, 20);                      // 20
int min = Math.min(10, 20);                      // 10

// 3개 이상의 최대/최소값
int max3 = Math.max(Math.max(a, b), c);
int max3 = Math.max(a, Math.max(b, c));

// 배열의 최대/최소값은 Arrays.stream 사용
int[] arr = {5, 2, 8, 1, 9};
int maxVal = Arrays.stream(arr).max().getAsInt();
int minVal = Arrays.stream(arr).min().getAsInt();
```

### 1.4 거듭제곱과 제곱근

```
static double pow(double a, double b)            // a^b
static double sqrt(double a)                     // √a (제곱근)
static double cbrt(double a)                     // ∛a (세제곱근)
```

**사용 예시**

```
double pow = Math.pow(2, 10);                    // 1024.0 (2^10)
double sqrt = Math.sqrt(16);                     // 4.0
double cbrt = Math.cbrt(27);                     // 3.0

// 정수 거듭제곱 (더 빠름)
int result = 1;
for (int i = 0; i < n; i++) {
    result *= base;
}
```

### 1.5 올림/내림/반올림

```
static double ceil(double a)                     // 올림 (ceiling)
static double floor(double a)                    // 내림 (floor)
static long round(double a)                      // 반올림 (long 반환)
static int round(float a)                        // 반올림 (int 반환)
static double rint(double a)                     // 가장 가까운 정수 (double 반환)
```

**사용 예시**

```
double a = 3.14;
double b = 3.75;
double c = -3.14;
double d = -3.75;

Math.ceil(a);    // 4.0
Math.ceil(b);    // 4.0
Math.ceil(c);    // -3.0
Math.ceil(d);    // -3.0

Math.floor(a);   // 3.0
Math.floor(b);   // 3.0
Math.floor(c);   // -4.0
Math.floor(d);   // -4.0

Math.round(a);   // 3
Math.round(b);   // 4
Math.round(c);   // -3
Math.round(d);   // -4

Math.rint(a);    // 3.0
Math.rint(b);    // 4.0
Math.rint(2.5);  // 2.0 (짝수로 반올림)
Math.rint(3.5);  // 4.0 (짝수로 반올림)
```

### 1.6 부호

```
static double signum(double d)                   // 부호 반환 (1.0, 0.0, -1.0)
static float signum(float f)
static double copySign(double magnitude, double sign)  // magnitude의 절대값에 sign의 부호 적용
static float copySign(float magnitude, float sign)
```

**사용 예시**

```
double s1 = Math.signum(5.0);                    // 1.0
double s2 = Math.signum(0.0);                    // 0.0
double s3 = Math.signum(-5.0);                   // -1.0

double cs = Math.copySign(3.0, -1.0);            // -3.0
```

### 1.7 지수와 로그

```
static double exp(double a)                      // e^a
static double log(double a)                      // ln(a) (자연로그)
static double log10(double a)                    // log₁₀(a) (상용로그)
static double log1p(double x)                    // ln(1 + x) (정밀도 향상)
static double expm1(double x)                    // e^x - 1 (정밀도 향상)
```

**사용 예시**

```
double exp = Math.exp(1);                        // e (2.718281828459045)
double log = Math.log(Math.E);                   // 1.0
double log10 = Math.log10(100);                  // 2.0

// 로그 밑 변환 공식: log_b(x) = log(x) / log(b)
double log2 = Math.log(8) / Math.log(2);         // 3.0 (log₂(8))
```

### 1.8 삼각 함수

```
static double sin(double a)                      // 사인 (라디안)
static double cos(double a)                      // 코사인
static double tan(double a)                      // 탄젠트

static double asin(double a)                     // 아크사인
static double acos(double a)                     // 아크코사인
static double atan(double a)                     // 아크탄젠트
static double atan2(double y, double x)          // atan(y/x) (사분면 고려)

static double sinh(double x)                     // 쌍곡사인
static double cosh(double x)                     // 쌍곡코사인
static double tanh(double x)                     // 쌍곡탄젠트
```

**사용 예시**

```
// 각도를 라디안으로 변환
double degree = 90;
double radian = Math.toRadians(degree);          // π/2
double sin = Math.sin(radian);                   // 1.0

// 라디안을 각도로 변환
double angle = Math.toDegrees(Math.PI);          // 180.0

// atan2 사용 (사분면 고려)
double angle1 = Math.atan2(1, 1);                // π/4 (45도, 1사분면)
double angle2 = Math.atan2(1, -1);               // 3π/4 (135도, 2사분면)
```

### 1.9 각도 변환

```
static double toRadians(double angdeg)           // 도 → 라디안
static double toDegrees(double angrad)           // 라디안 → 도
```

### 1.10 기타 수학 함수

```
static double hypot(double x, double y)          // √(x² + y²) (빗변 길이)
static double IEEEremainder(double f1, double f2) // IEEE 754 나머지
static double ulp(double d)                      // Unit in the Last Place
static double ulp(float f)
static double nextAfter(double start, double direction)  // 다음 부동소수점 값
static float nextAfter(float start, double direction)
static double nextUp(double d)                   // 다음 큰 값
static float nextUp(float f)
static double nextDown(double d)                 // 다음 작은 값
static float nextDown(float f)
static double scalb(double d, int scaleFactor)   // d × 2^scaleFactor
static float scalb(float f, int scaleFactor)
static int getExponent(double d)                 // 지수 반환
static int getExponent(float f)
```

**사용 예시**

```
// 빗변 길이 (피타고라스)
double hypotenuse = Math.hypot(3, 4);            // 5.0 (√(3² + 4²))

// 두 점 사이의 거리
double dist = Math.hypot(x2 - x1, y2 - y1);
```

### 1.11 오버플로우 안전 연산 (Java 8+)

```
static int addExact(int x, int y)                // 덧셈 (오버플로우 시 예외)
static long addExact(long x, long y)

static int subtractExact(int x, int y)           // 뺄셈 (오버플로우 시 예외)
static long subtractExact(long x, long y)

static int multiplyExact(int x, int y)           // 곱셈 (오버플로우 시 예외)
static long multiplyExact(int x, int y)
static long multiplyExact(long x, long y)

static int incrementExact(int a)                 // 증가 (오버플로우 시 예외)
static long incrementExact(long a)

static int decrementExact(int a)                 // 감소 (오버플로우 시 예외)
static long decrementExact(long a)

static int negateExact(int a)                    // 부호 반전 (오버플로우 시 예외)
static long negateExact(long a)

static int toIntExact(long value)                // long → int (오버플로우 시 예외)
```

**사용 예시**

```
try {
    int result = Math.addExact(Integer.MAX_VALUE, 1);  // ArithmeticException
} catch (ArithmeticException e) {
    System.out.println("오버플로우 발생");
}

// 일반 연산은 오버플로우 발생
int overflow = Integer.MAX_VALUE + 1;            // -2147483648 (오버플로우)
```

### 1.12 나눗셈 관련 (Java 8+)

```
static int floorDiv(int x, int y)                // 내림 나눗셈
static long floorDiv(long x, int y)
static long floorDiv(long x, long y)

static int floorMod(int x, int y)                // 내림 나머지 (항상 양수)
static int floorMod(long x, int y)
static long floorMod(long x, long y)
```

**사용 예시**

```
// 일반 나눗셈
int div1 = 7 / 3;                                // 2
int mod1 = 7 % 3;                                // 1

int div2 = -7 / 3;                               // -2
int mod2 = -7 % 3;                               // -1

// floorDiv, floorMod (항상 내림)
int floorDiv1 = Math.floorDiv(7, 3);             // 2
int floorMod1 = Math.floorMod(7, 3);             // 1

int floorDiv2 = Math.floorDiv(-7, 3);            // -3 (내림)
int floorMod2 = Math.floorMod(-7, 3);            // 2 (항상 양수)

// 음수 인덱스 처리에 유용
int idx = Math.floorMod(-1, arr.length);         // arr.length - 1
```

### 1.13 난수 생성

```
static double random()                           // [0.0, 1.0) 범위의 난수
```

**사용 예시**

```
// [0.0, 1.0) 범위
double rand = Math.random();

// [0, n) 범위의 정수
int randInt = (int)(Math.random() * n);

// [min, max) 범위의 정수
int randRange = (int)(Math.random() * (max - min)) + min;

// [min, max] 범위의 정수 (max 포함)
int randInclusive = (int)(Math.random() * (max - min + 1)) + min;

// 더 나은 방법: Random 클래스 사용
Random random = new Random();
int value = random.nextInt(n);                   // [0, n)
```

\---

## 2\. Random 클래스

java.util.Random 클래스는 난수 생성을 위한 다양한 메서드를 제공합니다.

### 2.1 생성자

```
Random()                                         // 현재 시간으로 시드 초기화
Random(long seed)                                // 시드 지정
```

### 2.2 주요 메서드

```
void setSeed(long seed)                          // 시드 재설정

boolean nextBoolean()                            // true 또는 false
int nextInt()                                    // 전체 int 범위
int nextInt(int bound)                           // [0, bound)
long nextLong()                                  // 전체 long 범위
float nextFloat()                                // [0.0, 1.0)
double nextDouble()                              // [0.0, 1.0)
double nextGaussian()                            // 가우시안 분포 (평균 0, 표준편차 1)

void nextBytes(byte[] bytes)                     // 바이트 배열 채우기
```

**사용 예시**

```
Random random = new Random();

// [0, n) 범위의 정수
int randInt = random.nextInt(10);                // [0, 10)

// [min, max) 범위의 정수
int randRange = random.nextInt(max - min) + min;

// [min, max] 범위의 정수 (max 포함)
int randInclusive = random.nextInt(max - min + 1) + min;

// boolean
boolean bool = random.nextBoolean();

// double [0.0, 1.0)
double randDouble = random.nextDouble();

// 배열 섞기 (Fisher-Yates 셔플)
int[] arr = {1, 2, 3, 4, 5};
for (int i = arr.length - 1; i > 0; i--) {
    int j = random.nextInt(i + 1);
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}
```

### 2.3 Stream API (Java 8+)

```
IntStream ints()                                 // 무한 int 스트림
IntStream ints(long streamSize)                  // streamSize개의 int
IntStream ints(int randomNumberOrigin, int randomNumberBound)  // 범위 지정 무한 스트림
IntStream ints(long streamSize, int randomNumberOrigin, int randomNumberBound)

LongStream longs()
LongStream longs(long streamSize)
LongStream longs(long randomNumberOrigin, long randomNumberBound)
LongStream longs(long streamSize, long randomNumberOrigin, long randomNumberBound)

DoubleStream doubles()
DoubleStream doubles(long streamSize)
DoubleStream doubles(double randomNumberOrigin, double randomNumberBound)
DoubleStream doubles(long streamSize, double randomNumberOrigin, double randomNumberBound)
```

**사용 예시**

```
Random random = new Random();

// 10개의 [0, 100) 난수
int[] randomNumbers = random.ints(10, 0, 100).toArray();

// 무한 스트림에서 5개 가져오기
List<Integer> list = random.ints(0, 100)
    .limit(5)
    .boxed()
    .collect(Collectors.toList());
```

\---

## 3\. BigInteger 클래스

큰 정수 연산을 위한 클래스입니다. 오버플로우 걱정 없이 임의 크기의 정수를 다룰 수 있습니다.

### 3.1 생성자

```
BigInteger(String val)                           // 문자열로 생성
BigInteger(String val, int radix)                // 진법 지정
BigInteger(byte[] val)                           // 바이트 배열로 생성
```

### 3.2 상수

```
static BigInteger ZERO                           // 0
static BigInteger ONE                            // 1
static BigInteger TEN                            // 10
```

### 3.3 산술 연산

```
BigInteger add(BigInteger val)                   // 덧셈
BigInteger subtract(BigInteger val)              // 뺄셈
BigInteger multiply(BigInteger val)              // 곱셈
BigInteger divide(BigInteger val)                // 나눗셈 (몫)
BigInteger remainder(BigInteger val)             // 나머지
BigInteger[] divideAndRemainder(BigInteger val)  // 몫과 나머지
BigInteger mod(BigInteger m)                     // 모듈로 (항상 양수)
BigInteger pow(int exponent)                     // 거듭제곱
BigInteger modPow(BigInteger exponent, BigInteger m)  // (this^exponent) % m
BigInteger modInverse(BigInteger m)              // 모듈로 역원
BigInteger gcd(BigInteger val)                   // 최대공약수
BigInteger abs()                                 // 절대값
BigInteger negate()                              // 부호 반전
```

**사용 예시**

```
BigInteger a = new BigInteger("123456789012345678901234567890");
BigInteger b = new BigInteger("987654321098765432109876543210");

BigInteger sum = a.add(b);
BigInteger diff = a.subtract(b);
BigInteger prod = a.multiply(b);
BigInteger quot = b.divide(a);
BigInteger rem = b.remainder(a);

BigInteger[] divRem = b.divideAndRemainder(a);
BigInteger quotient = divRem[0];
BigInteger remainder = divRem[1];

// 팩토리얼
BigInteger factorial = BigInteger.ONE;
for (int i = 2; i <= n; i++) {
    factorial = factorial.multiply(BigInteger.valueOf(i));
}

// 최대공약수
BigInteger gcd = a.gcd(b);
```

### 3.4 비트 연산

```
BigInteger and(BigInteger val)                   // AND
BigInteger or(BigInteger val)                    // OR
BigInteger xor(BigInteger val)                   // XOR
BigInteger not()                                 // NOT
BigInteger andNot(BigInteger val)                // AND NOT
BigInteger shiftLeft(int n)                      // << (왼쪽 시프트)
BigInteger shiftRight(int n)                     // >> (오른쪽 시프트)
int bitCount()                                   // 1비트 개수
int bitLength()                                  // 비트 길이
boolean testBit(int n)                           // n번째 비트 테스트
BigInteger setBit(int n)                         // n번째 비트를 1로
BigInteger clearBit(int n)                       // n번째 비트를 0으로
BigInteger flipBit(int n)                        // n번째 비트 반전
int getLowestSetBit()                            // 최하위 1비트 위치
```

### 3.5 비교

```
int compareTo(BigInteger val)                    // 비교
boolean equals(Object x)                         // 동등성
int signum()                                     // 부호 (-1, 0, 1)
BigInteger max(BigInteger val)                   // 최대값
BigInteger min(BigInteger val)                   // 최소값
```

### 3.6 변환

```
int intValue()                                   // int로 변환 (오버플로우 주의)
long longValue()                                 // long으로 변환
float floatValue()                               // float로 변환
double doubleValue()                             // double로 변환
int intValueExact()                              // int로 정확히 변환 (예외 발생 가능)
long longValueExact()                            // long으로 정확히 변환

String toString()                                // 10진수 문자열
String toString(int radix)                       // 진법 지정 문자열
byte[] toByteArray()                             // 바이트 배열로
```

**사용 예시**

```
BigInteger big = new BigInteger("123456789");
int intVal = big.intValue();
String str = big.toString();
String hex = big.toString(16);
```

### 3.7 기타

```
static BigInteger valueOf(long val)              // long → BigInteger
boolean isProbablePrime(int certainty)           // 소수 판정 (확률적)
BigInteger nextProbablePrime()                   // 다음 소수 (확률적)
```

\---

## 4\. BigDecimal 클래스

정밀한 실수 연산을 위한 클래스입니다. 부동소수점 오차 없이 정확한 계산이 가능합니다.

### 4.1 생성자

```
BigDecimal(String val)                           // 문자열로 생성 (권장)
BigDecimal(double val)                           // double로 생성 (비권장, 오차 발생)
BigDecimal(BigInteger val)
BigDecimal(int val)
BigDecimal(long val)
```

### 4.2 상수

```
static BigDecimal ZERO                           // 0
static BigDecimal ONE                            // 1
static BigDecimal TEN                            // 10
```

### 4.3 산술 연산

```
BigDecimal add(BigDecimal augend)                // 덧셈
BigDecimal subtract(BigDecimal subtrahend)       // 뺄셈
BigDecimal multiply(BigDecimal multiplicand)     // 곱셈
BigDecimal divide(BigDecimal divisor)            // 나눗셈 (정확한 결과)
BigDecimal divide(BigDecimal divisor, int roundingMode)  // 반올림 모드 지정
BigDecimal divide(BigDecimal divisor, int scale, int roundingMode)  // 소수점 자리와 반올림 모드
BigDecimal divide(BigDecimal divisor, RoundingMode roundingMode)
BigDecimal divide(BigDecimal divisor, int scale, RoundingMode roundingMode)
BigDecimal[] divideAndRemainder(BigDecimal divisor)  // 몫과 나머지
BigDecimal remainder(BigDecimal divisor)         // 나머지
BigDecimal pow(int n)                            // 거듭제곱
BigDecimal abs()                                 // 절대값
BigDecimal negate()                              // 부호 반전
```

**RoundingMode (반올림 모드)**

```
RoundingMode.UP                                  // 0에서 멀어지는 방향 (올림)
RoundingMode.DOWN                                // 0으로 가까워지는 방향 (버림)
RoundingMode.CEILING                             // 양의 무한대 방향 (천장)
RoundingMode.FLOOR                               // 음의 무한대 방향 (바닥)
RoundingMode.HALF_UP                             // 반올림 (5 이상 올림)
RoundingMode.HALF_DOWN                           // 반올림 (5 초과 올림)
RoundingMode.HALF_EVEN                           // 반올림 (짝수로)
RoundingMode.UNNECESSARY                         // 정확히 나누어떨어져야 함
```

**사용 예시**

```
BigDecimal a = new BigDecimal("123.45");
BigDecimal b = new BigDecimal("67.89");

BigDecimal sum = a.add(b);                       // 191.34
BigDecimal diff = a.subtract(b);                 // 55.56
BigDecimal prod = a.multiply(b);                 // 8382.1605

// 나눗셈 (반올림 필요)
BigDecimal quot = a.divide(b, 2, RoundingMode.HALF_UP);  // 소수점 2자리, 반올림

// 정확한 실수 연산 (부동소수점 오차 없음)
BigDecimal d1 = new BigDecimal("0.1");
BigDecimal d2 = new BigDecimal("0.2");
BigDecimal d3 = d1.add(d2);                      // 0.3 (정확)

// double은 오차 발생
double dd1 = 0.1;
double dd2 = 0.2;
double dd3 = dd1 + dd2;                          // 0.30000000000000004 (오차)
```

### 4.4 스케일 관련

```
int scale()                                      // 소수점 이하 자릿수
int precision()                                  // 전체 자릿수
BigDecimal setScale(int newScale)                // 스케일 변경
BigDecimal setScale(int newScale, int roundingMode)
BigDecimal setScale(int newScale, RoundingMode roundingMode)
BigDecimal stripTrailingZeros()                  // 끝의 0 제거
```

**사용 예시**

```
BigDecimal num = new BigDecimal("123.4500");
int scale = num.scale();                         // 4
int precision = num.precision();                 // 7

BigDecimal scaled = num.setScale(2, RoundingMode.HALF_UP);  // 123.45
BigDecimal stripped = num.stripTrailingZeros();  // 123.45
```

### 4.5 비교

```
int compareTo(BigDecimal val)                    // 비교 (스케일 무시)
boolean equals(Object x)                         // 동등성 (스케일 포함)
int signum()                                     // 부호
BigDecimal max(BigDecimal val)                   // 최대값
BigDecimal min(BigDecimal val)                   // 최소값
```

**사용 예시**

```
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("1.00");

boolean eq1 = a.equals(b);                       // false (스케일 다름)
int cmp = a.compareTo(b);                        // 0 (값은 같음)
```

### 4.6 변환

```
int intValue()                                   // int로 변환
long longValue()                                 // long으로 변환
float floatValue()                               // float로 변환
double doubleValue()                             // double로 변환
int intValueExact()                              // 정확히 변환 (예외 발생 가능)
long longValueExact()
BigInteger toBigInteger()                        // BigInteger로 변환
BigInteger toBigIntegerExact()                   // 정확히 변환
String toString()                                // 문자열로
String toPlainString()                           // 지수 표기 없이
String toEngineeringString()                     // 공학 표기법
```

### 4.7 기타

```
static BigDecimal valueOf(long val)              // long → BigDecimal
static BigDecimal valueOf(double val)            // double → BigDecimal
BigDecimal movePointLeft(int n)                  // 소수점을 왼쪽으로 n자리
BigDecimal movePointRight(int n)                 // 소수점을 오른쪽으로 n자리
BigDecimal ulp()                                 // Unit in the Last Place
```

\---

## 5\. 알고리즘 문제 풀이 팁

### 5.1 자주 사용하는 수학 패턴

**1\. 최대공약수 (GCD)**

```
// 유클리드 호제법
int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// 재귀
int gcd(int a, int b) {
    return b == 0 ? a : gcd(b, a % b);
}

// BigInteger 사용
BigInteger a = BigInteger.valueOf(48);
BigInteger b = BigInteger.valueOf(18);
BigInteger gcd = a.gcd(b);  // 6
```

**2\. 최소공배수 (LCM)**

```
int lcm(int a, int b) {
    return a * b / gcd(a, b);
}

// 오버플로우 방지
long lcm(int a, int b) {
    return (long)a * b / gcd(a, b);
}
```

**3\. 소수 판정**

```
// 기본
boolean isPrime(int n) {
    if (n < 2) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;

    for (int i = 3; i * i <= n; i += 2) {
        if (n % i == 0) return false;
    }
    return true;
}

// BigInteger 사용 (확률적)
BigInteger num = new BigInteger("100000000000000003");
boolean isPrime = num.isProbablePrime(10);  // certainty: 10
```

**4\. 에라토스테네스의 체**

```
boolean[] sieve(int n) {
    boolean[] isPrime = new boolean[n + 1];
    Arrays.fill(isPrime, true);
    isPrime[0] = isPrime[1] = false;

    for (int i = 2; i * i <= n; i++) {
        if (isPrime[i]) {
            for (int j = i * i; j <= n; j += i) {
                isPrime[j] = false;
            }
        }
    }
    return isPrime;
}
```

**5\. 거듭제곱 (빠른 거듭제곱)**

```
// 반복문
long pow(long base, long exp) {
    long result = 1;
    while (exp > 0) {
        if (exp % 2 == 1) {
            result *= base;
        }
        base *= base;
        exp /= 2;
    }
    return result;
}

// 모듈로 연산
long powMod(long base, long exp, long mod) {
    long result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) {
            result = (result * base) % mod;
        }
        base = (base * base) % mod;
        exp /= 2;
    }
    return result;
}

// BigInteger 사용
BigInteger base = BigInteger.valueOf(2);
BigInteger exp = BigInteger.valueOf(1000);
BigInteger mod = BigInteger.valueOf(1000000007);
BigInteger result = base.modPow(exp, mod);
```

**6\. 팩토리얼**

```
// 반복문
long factorial(int n) {
    long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// BigInteger 사용 (큰 수)
BigInteger factorial(int n) {
    BigInteger result = BigInteger.ONE;
    for (int i = 2; i <= n; i++) {
        result = result.multiply(BigInteger.valueOf(i));
    }
    return result;
}
```

**7\. 조합 (nCr)**

```
// 동적 프로그래밍
long combination(int n, int r) {
    if (r > n - r) r = n - r;  // nCr = nC(n-r)

    long[][] dp = new long[n + 1][r + 1];

    for (int i = 0; i <= n; i++) {
        dp[i][0] = 1;
        if (i <= r) dp[i][i] = 1;
    }

    for (int i = 2; i <= n; i++) {
        for (int j = 1; j < Math.min(i, r + 1); j++) {
            dp[i][j] = dp[i-1][j-1] + dp[i-1][j];
        }
    }

    return dp[n][r];
}

// 모듈로 연산 (페르마의 소정리)
long MOD = 1000000007;

long modPow(long base, long exp, long mod) {
    long result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) result = (result * base) % mod;
        base = (base * base) % mod;
        exp /= 2;
    }
    return result;
}

long modInverse(long a, long mod) {
    return modPow(a, mod - 2, mod);
}

long combination(int n, int r, long mod) {
    if (r > n) return 0;

    long numerator = 1;
    for (int i = 0; i < r; i++) {
        numerator = (numerator * (n - i)) % mod;
    }

    long denominator = 1;
    for (int i = 1; i <= r; i++) {
        denominator = (denominator * i) % mod;
    }

    return (numerator * modInverse(denominator, mod)) % mod;
}
```

**8\. 거리 계산**

```
// 유클리드 거리
double euclideanDistance(int x1, int y1, int x2, int y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// 또는
double euclideanDistance(int x1, int y1, int x2, int y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// 맨해튼 거리
int manhattanDistance(int x1, int y1, int x2, int x2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}
```

**9\. 평균**

```
// 정수 배열 평균
double average(int[] arr) {
    return Arrays.stream(arr).average().orElse(0.0);
}

// 또는
double average(int[] arr) {
    long sum = 0;
    for (int num : arr) {
        sum += num;
    }
    return (double) sum / arr.length;
}
```

**10\. 부동소수점 비교**

```
// 오차 범위 내 같은지 비교
boolean equals(double a, double b, double epsilon) {
    return Math.abs(a - b) < epsilon;
}

// 일반적으로 사용
double EPSILON = 1e-9;
boolean same = Math.abs(a - b) < EPSILON;
```

\---

## 6\. 주의사항

### 6.1 정수 오버플로우

```
int a = Integer.MAX_VALUE;
int b = a + 1;  // -2147483648 (오버플로우)

// 해결 방법 1: long 사용
long c = (long)a + 1;  // 정상

// 해결 방법 2: Math.addExact 사용
try {
    int d = Math.addExact(a, 1);
} catch (ArithmeticException e) {
    // 오버플로우 처리
}

// 해결 방법 3: BigInteger 사용
BigInteger big = BigInteger.valueOf(a).add(BigInteger.ONE);
```

### 6.2 부동소수점 오차

```
double d1 = 0.1 + 0.2;  // 0.30000000000000004 (오차)

// 해결 방법: BigDecimal 사용
BigDecimal bd1 = new BigDecimal("0.1");
BigDecimal bd2 = new BigDecimal("0.2");
BigDecimal bd3 = bd1.add(bd2);  // 0.3 (정확)
```

### 6.3 나눗셈 주의

```
int a = 5;
int b = 2;
int c = a / b;  // 2 (정수 나눗셈)
double d = a / b;  // 2.0 (여전히 정수 나눗셈 후 변환)

// 실수 나눗셈
double e = (double)a / b;  // 2.5
double f = 1.0 * a / b;  // 2.5
```

### 6.4 Math.random() vs Random

```
// Math.random()은 내부적으로 Random 사용
// 시드 제어 불가, 스레드 안전하지만 느림

// Random 클래스 권장
Random random = new Random();
random.setSeed(123);  // 시드 제어 가능
```

### 6.5 BigDecimal 생성 주의

```
// 잘못된 방법 (오차 발생)
BigDecimal wrong = new BigDecimal(0.1);  // 0.1000000000000000055511151231257827021181583404541015625

// 올바른 방법
BigDecimal correct = new BigDecimal("0.1");  // 0.1
BigDecimal correct2 = BigDecimal.valueOf(0.1);  // 0.1
```

### 6.6 BigDecimal 비교

```
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("1.00");

// equals는 스케일까지 비교
boolean eq1 = a.equals(b);  // false

// compareTo는 값만 비교
int cmp = a.compareTo(b);  // 0 (같음)

// 값 비교 시 compareTo 사용
if (a.compareTo(b) == 0) {
    // 같음
}
```

\---
