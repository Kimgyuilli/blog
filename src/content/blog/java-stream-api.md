---
title: "Java Stream API 정리 (알고리즘 문제 풀이용)"
description: "알고리즘 문제를 풀 때 자주 사용하는 Java Stream API의 주요 메서드를 정리했습니다. Stream이란? 컬렉션, 배열 등의 데이터를 함수형 프로그래밍 방식으로 처리할 수 있는 API (Java 8+) 사용 예시 사용 예시 사용 예시 사용 예시 사용 예시 사용 예시"
pubDate: 2026-02-15
tags: ["java", "알고리즘"]
draft: false
slug: "java-stream-api"
---
![Java Stream API 정리 (알고리즘 문제 풀이용)](/images/blog/java-stream-api/image-01.jpg)

알고리즘 문제를 풀 때 자주 사용하는 Java Stream API의 주요 메서드를 정리했습니다.

**Stream이란?** 컬렉션, 배열 등의 데이터를 함수형 프로그래밍 방식으로 처리할 수 있는 API (Java 8+)

\---

## 1\. Stream 생성

### 1.1 컬렉션에서 생성

```
// Collection 인터페이스
Stream<E> stream()                               // 순차 스트림
Stream<E> parallelStream()                       // 병렬 스트림
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
Stream<Integer> stream1 = list.stream();

Set<String> set = new HashSet<>(Arrays.asList("a", "b", "c"));
Stream<String> stream2 = set.stream();

Map<String, Integer> map = new HashMap<>();
Stream<String> keyStream = map.keySet().stream();
Stream<Integer> valueStream = map.values().stream();
Stream<Map.Entry<String, Integer>> entryStream = map.entrySet().stream();
```

### 1.2 배열에서 생성

```
// Arrays 클래스
static <T> Stream<T> stream(T[] array)
static <T> Stream<T> stream(T[] array, int startInclusive, int endExclusive)
static IntStream stream(int[] array)
static IntStream stream(int[] array, int startInclusive, int endExclusive)
static LongStream stream(long[] array)
static LongStream stream(long[] array, int startInclusive, int endExclusive)
static DoubleStream stream(double[] array)
static DoubleStream stream(double[] array, int startInclusive, int endExclusive)
```

**사용 예시**

```
String[] arr = {"a", "b", "c"};
Stream<String> stream1 = Arrays.stream(arr);
Stream<String> stream2 = Arrays.stream(arr, 0, 2);  // "a", "b"

int[] intArr = {1, 2, 3, 4, 5};
IntStream intStream = Arrays.stream(intArr);
```

### 1.3 Stream.of()

```
static <T> Stream<T> of(T... values)             // 가변 인자
static <T> Stream<T> of(T t)                     // 단일 요소
static <T> Stream<T> empty()                     // 빈 스트림
```

**사용 예시**

```
Stream<String> stream1 = Stream.of("a", "b", "c");
Stream<Integer> stream2 = Stream.of(1, 2, 3, 4, 5);
Stream<String> empty = Stream.empty();
```

### 1.4 범위 생성 (IntStream, LongStream)

```
// IntStream
static IntStream range(int startInclusive, int endExclusive)      // [start, end)
static IntStream rangeClosed(int startInclusive, int endInclusive) // [start, end]

// LongStream
static LongStream range(long startInclusive, long endExclusive)
static LongStream rangeClosed(long startInclusive, long endInclusive)
```

**사용 예시**

```
IntStream stream1 = IntStream.range(1, 5);       // 1, 2, 3, 4
IntStream stream2 = IntStream.rangeClosed(1, 5); // 1, 2, 3, 4, 5

// 반복문 대체
IntStream.range(0, 10).forEach(i -> System.out.println(i));

// 배열 인덱스 순회
String[] arr = {"a", "b", "c"};
IntStream.range(0, arr.length).forEach(i -> System.out.println(arr[i]));
```

### 1.5 무한 스트림

```
static <T> Stream<T> iterate(T seed, UnaryOperator<T> f)
static <T> Stream<T> iterate(T seed, Predicate<? super T> hasNext, UnaryOperator<T> next)
static <T> Stream<T> generate(Supplier<? extends T> s)

// IntStream
static IntStream iterate(int seed, IntUnaryOperator f)
static IntStream iterate(int seed, IntPredicate hasNext, IntUnaryOperator next)
static IntStream generate(IntSupplier s)
```

**사용 예시**

```
// 무한 수열 (limit으로 제한)
Stream<Integer> infiniteStream = Stream.iterate(0, n -> n + 1);
infiniteStream.limit(10).forEach(System.out::println);  // 0~9

// 조건부 무한 수열 (Java 9+)
Stream<Integer> stream = Stream.iterate(0, n -> n < 10, n -> n + 1);  // 0~9

// generate
Stream<Double> randomStream = Stream.generate(Math::random);
randomStream.limit(5).forEach(System.out::println);

// 피보나치 수열
Stream.iterate(new int[]{0, 1}, arr -> new int[]{arr[1], arr[0] + arr[1]})
    .limit(10)
    .map(arr -> arr[0])
    .forEach(System.out::println);
```

### 1.6 기타

```
// Stream.Builder
Stream.Builder<T> builder()
Stream.Builder<T> add(T t)
Stream<T> build()

// Files (파일 읽기)
static Stream<String> lines(Path path)
```

**사용 예시**

```
// Builder 패턴
Stream<String> stream = Stream.<String>builder()
    .add("a")
    .add("b")
    .add("c")
    .build();
```

\---

## 2\. 중간 연산 (Intermediate Operations)

중간 연산은 Stream을 반환하므로 체이닝이 가능합니다. \*\*지연 연산(lazy)\*\*되어 최종 연산이 호출될 때 실행됩니다.

### 2.1 필터링

**filter**

```
Stream<T> filter(Predicate<? super T> predicate)
IntStream filter(IntPredicate predicate)
LongStream filter(LongPredicate predicate)
DoubleStream filter(DoublePredicate predicate)
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 짝수만 필터링
List<Integer> evenNumbers = list.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());  // [2, 4, 6, 8, 10]

// 문자열 길이 필터링
List<String> words = Arrays.asList("apple", "hi", "banana", "ok");
List<String> longWords = words.stream()
    .filter(w -> w.length() > 2)
    .collect(Collectors.toList());  // ["apple", "banana"]
```

### 2.2 중복 제거

**distinct**

```
Stream<T> distinct()
IntStream distinct()
LongStream distinct()
DoubleStream distinct()
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 2, 3, 3, 3, 4, 5);
List<Integer> unique = list.stream()
    .distinct()
    .collect(Collectors.toList());  // [1, 2, 3, 4, 5]
```

### 2.3 정렬

**sorted**

```
Stream<T> sorted()                               // 자연 순서
Stream<T> sorted(Comparator<? super T> comparator)  // 사용자 정의 순서
IntStream sorted()
LongStream sorted()
DoubleStream sorted()
```

**사용 예시**

```
List<Integer> list = Arrays.asList(5, 2, 8, 1, 9);

// 오름차순
List<Integer> sorted1 = list.stream()
    .sorted()
    .collect(Collectors.toList());  // [1, 2, 5, 8, 9]

// 내림차순
List<Integer> sorted2 = list.stream()
    .sorted(Comparator.reverseOrder())
    .collect(Collectors.toList());  // [9, 8, 5, 2, 1]

// 문자열 길이순
List<String> words = Arrays.asList("apple", "hi", "banana");
List<String> sorted3 = words.stream()
    .sorted(Comparator.comparing(String::length))
    .collect(Collectors.toList());  // ["hi", "apple", "banana"]

// 복합 정렬
List<String> sorted4 = words.stream()
    .sorted(Comparator.comparing(String::length)
        .thenComparing(Comparator.naturalOrder()))
    .collect(Collectors.toList());
```

### 2.4 변환 (매핑)

**map**

```
<R> Stream<R> map(Function<? super T, ? extends R> mapper)
IntStream mapToInt(ToIntFunction<? super T> mapper)
LongStream mapToLong(ToLongFunction<? super T> mapper)
DoubleStream mapToDouble(ToDoubleFunction<? super T> mapper)

// IntStream
IntStream map(IntUnaryOperator mapper)
<U> Stream<U> mapToObj(IntFunction<? extends U> mapper)
LongStream mapToLong(IntToLongFunction mapper)
DoubleStream mapToDouble(IntToDoubleFunction mapper)
```

**사용 예시**

```
List<String> words = Arrays.asList("apple", "banana", "cherry");

// 대문자로 변환
List<String> upper = words.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());  // ["APPLE", "BANANA", "CHERRY"]

// 길이로 변환
List<Integer> lengths = words.stream()
    .map(String::length)
    .collect(Collectors.toList());  // [5, 6, 6]

// 제곱
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
List<Integer> squares = numbers.stream()
    .map(n -> n * n)
    .collect(Collectors.toList());  // [1, 4, 9, 16, 25]

// IntStream으로 변환
int[] arr = words.stream()
    .mapToInt(String::length)
    .toArray();  // [5, 6, 6]
```

**flatMap** (중첩 구조를 평탄화)

```
<R> Stream<R> flatMap(Function<? super T, ? extends Stream<? extends R>> mapper)
IntStream flatMapToInt(Function<? super T, ? extends IntStream> mapper)
LongStream flatMapToLong(Function<? super T, ? extends LongStream> mapper)
DoubleStream flatMapToDouble(Function<? super T, ? extends DoubleStream> mapper)

// IntStream
IntStream flatMap(IntFunction<? extends IntStream> mapper)
```

**사용 예시**

```
// 2차원 리스트를 1차원으로
List<List<Integer>> nested = Arrays.asList(
    Arrays.asList(1, 2, 3),
    Arrays.asList(4, 5),
    Arrays.asList(6, 7, 8, 9)
);

List<Integer> flat = nested.stream()
    .flatMap(List::stream)
    .collect(Collectors.toList());  // [1, 2, 3, 4, 5, 6, 7, 8, 9]

// 문자열을 문자로 분해
List<String> words = Arrays.asList("hello", "world");
List<Character> chars = words.stream()
    .flatMap(word -> word.chars().mapToObj(c -> (char)c))
    .collect(Collectors.toList());  // ['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']

// 공백으로 분할
String text = "apple banana cherry";
List<String> wordList = Arrays.stream(text.split(" "))
    .flatMap(word -> Arrays.stream(word.split("")))
    .collect(Collectors.toList());
```

### 2.5 제한 및 건너뛰기

**limit, skip**

```
Stream<T> limit(long maxSize)                    // 최대 maxSize개만
Stream<T> skip(long n)                           // 앞의 n개 건너뛰기
IntStream limit(long maxSize)
IntStream skip(long n)
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 처음 5개만
List<Integer> first5 = list.stream()
    .limit(5)
    .collect(Collectors.toList());  // [1, 2, 3, 4, 5]

// 처음 3개 건너뛰고
List<Integer> skip3 = list.stream()
    .skip(3)
    .collect(Collectors.toList());  // [4, 5, 6, 7, 8, 9, 10]

// 건너뛰고 제한 (페이징)
List<Integer> page2 = list.stream()
    .skip(5)
    .limit(5)
    .collect(Collectors.toList());  // [6, 7, 8, 9, 10]
```

**takeWhile, dropWhile (Java 9+)**

```
Stream<T> takeWhile(Predicate<? super T> predicate)  // 조건이 true인 동안만
Stream<T> dropWhile(Predicate<? super T> predicate)  // 조건이 true인 동안 건너뜀
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 1, 2);

// 5 미만인 동안만 (정렬된 스트림에서 유용)
List<Integer> taken = list.stream()
    .takeWhile(n -> n < 5)
    .collect(Collectors.toList());  // [1, 2, 3, 4]

// 5 미만인 동안 건너뛰기
List<Integer> dropped = list.stream()
    .dropWhile(n -> n < 5)
    .collect(Collectors.toList());  // [5, 1, 2]
```

### 2.6 엿보기 (디버깅용)

**peek**

```
Stream<T> peek(Consumer<? super T> action)
IntStream peek(IntConsumer action)
```

**사용 예시**

```
List<Integer> result = list.stream()
    .filter(n -> n % 2 == 0)
    .peek(n -> System.out.println("Filtered: " + n))
    .map(n -> n * 2)
    .peek(n -> System.out.println("Mapped: " + n))
    .collect(Collectors.toList());
```

### 2.7 기타

**boxed, unboxed**

```
// IntStream, LongStream, DoubleStream
Stream<Integer> boxed()                          // int → Integer
Stream<Long> boxed()                             // long → Long
Stream<Double> boxed()                           // double → Double
```

**사용 예시**

```
int[] arr = {1, 2, 3, 4, 5};
List<Integer> list = Arrays.stream(arr)
    .boxed()
    .collect(Collectors.toList());
```

\---

## 3\. 최종 연산 (Terminal Operations)

최종 연산은 Stream을 소비하고 결과를 반환합니다. 한 번만 사용 가능합니다.

### 3.1 반복

**forEach, forEachOrdered**

```
void forEach(Consumer<? super T> action)
void forEachOrdered(Consumer<? super T> action)  // 순서 보장 (병렬 스트림에서도)
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
list.stream().forEach(System.out::println);

// 병렬 스트림에서 순서 보장
list.parallelStream().forEachOrdered(System.out::println);
```

### 3.2 수집

**collect**

```
<R, A> R collect(Collector<? super T, A, R> collector)
<R> R collect(Supplier<R> supplier, BiConsumer<R, ? super T> accumulator, BiConsumer<R, R> combiner)
```

**사용 예시 (Collectors와 함께)**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

// List로 수집
List<Integer> result1 = list.stream().collect(Collectors.toList());

// Set으로 수집
Set<Integer> result2 = list.stream().collect(Collectors.toSet());

// 배열로 수집
Integer[] result3 = list.stream().toArray(Integer[]::new);
int[] result4 = list.stream().mapToInt(Integer::intValue).toArray();

// 문자열로 결합
String result5 = list.stream()
    .map(String::valueOf)
    .collect(Collectors.joining(", "));  // "1, 2, 3, 4, 5"
```

**toArray**

```
Object[] toArray()
<A> A[] toArray(IntFunction<A[]> generator)

// IntStream, LongStream, DoubleStream
int[] toArray()
long[] toArray()
double[] toArray()
```

**사용 예시**

```
String[] arr1 = list.stream().toArray(String[]::new);
Integer[] arr2 = list.stream().toArray(Integer[]::new);
int[] arr3 = list.stream().mapToInt(Integer::intValue).toArray();
```

### 3.3 매칭

```
boolean anyMatch(Predicate<? super T> predicate)     // 하나라도 만족
boolean allMatch(Predicate<? super T> predicate)     // 모두 만족
boolean noneMatch(Predicate<? super T> predicate)    // 모두 불만족
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

boolean hasEven = list.stream().anyMatch(n -> n % 2 == 0);   // true
boolean allPositive = list.stream().allMatch(n -> n > 0);    // true
boolean noneNegative = list.stream().noneMatch(n -> n < 0);  // true
```

### 3.4 찾기

```
Optional<T> findFirst()                          // 첫 번째 요소
Optional<T> findAny()                            // 아무 요소 (병렬에서 빠름)
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

Optional<Integer> first = list.stream()
    .filter(n -> n > 3)
    .findFirst();  // Optional[4]

Integer value = first.orElse(-1);  // 4
Integer value2 = first.orElseGet(() -> -1);
Integer value3 = first.orElseThrow(() -> new RuntimeException("Not found"));

// 병렬 스트림
Optional<Integer> any = list.parallelStream()
    .filter(n -> n > 3)
    .findAny();  // 4 또는 5 (순서 보장 안됨)
```

### 3.5 집계

**count**

```
long count()
```

**min, max**

```
Optional<T> min(Comparator<? super T> comparator)
Optional<T> max(Comparator<? super T> comparator)

// IntStream, LongStream, DoubleStream
OptionalInt min()
OptionalInt max()
OptionalLong min()
OptionalLong max()
OptionalDouble min()
OptionalDouble max()
```

**sum, average (IntStream, LongStream, DoubleStream)**

```
int sum()                                        // IntStream
long sum()                                       // LongStream
double sum()                                     // DoubleStream

OptionalDouble average()                         // 모든 기본 타입 스트림
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

// count
long count = list.stream().count();  // 5

// min, max
Optional<Integer> min = list.stream().min(Comparator.naturalOrder());  // 1
Optional<Integer> max = list.stream().max(Comparator.naturalOrder());  // 5

// sum, average (IntStream)
int sum = list.stream().mapToInt(Integer::intValue).sum();  // 15
double avg = list.stream().mapToInt(Integer::intValue).average().orElse(0);  // 3.0

// 배열에서
int[] arr = {1, 2, 3, 4, 5};
int sum2 = Arrays.stream(arr).sum();
double avg2 = Arrays.stream(arr).average().getAsDouble();
int min2 = Arrays.stream(arr).min().getAsInt();
int max2 = Arrays.stream(arr).max().getAsInt();
```

### 3.6 축약 (reduce)

```
Optional<T> reduce(BinaryOperator<T> accumulator)
T reduce(T identity, BinaryOperator<T> accumulator)
<U> U reduce(U identity, BiFunction<U, ? super T, U> accumulator, BinaryOperator<U> combiner)

// IntStream, LongStream, DoubleStream
OptionalInt reduce(IntBinaryOperator op)
int reduce(int identity, IntBinaryOperator op)
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

// 합계
int sum1 = list.stream().reduce(0, (a, b) -> a + b);  // 15
int sum2 = list.stream().reduce(0, Integer::sum);     // 15

// 곱셈
int product = list.stream().reduce(1, (a, b) -> a * b);  // 120

// 최대값
Optional<Integer> max = list.stream().reduce(Integer::max);  // 5

// 문자열 연결
String concat = list.stream()
    .map(String::valueOf)
    .reduce("", (a, b) -> a + b);  // "12345"
```

\---

## 4\. Collectors 유틸리티

java.util.stream.Collectors 클래스는 다양한 수집 연산을 제공합니다.

### 4.1 기본 수집

```
static <T> Collector<T, ?, List<T>> toList()
static <T> Collector<T, ?, Set<T>> toSet()
static <T, C extends Collection<T>> Collector<T, ?, C> toCollection(Supplier<C> collectionFactory)
static <T> Collector<T, ?, List<T>> toUnmodifiableList()  // Java 10+
static <T> Collector<T, ?, Set<T>> toUnmodifiableSet()
```

**사용 예시**

```
List<Integer> list = stream.collect(Collectors.toList());
Set<Integer> set = stream.collect(Collectors.toSet());
ArrayList<Integer> arrayList = stream.collect(Collectors.toCollection(ArrayList::new));
TreeSet<Integer> treeSet = stream.collect(Collectors.toCollection(TreeSet::new));
```

### 4.2 문자열 결합

```
static Collector<CharSequence, ?, String> joining()
static Collector<CharSequence, ?, String> joining(CharSequence delimiter)
static Collector<CharSequence, ?, String> joining(CharSequence delimiter, CharSequence prefix, CharSequence suffix)
```

**사용 예시**

```
List<String> words = Arrays.asList("apple", "banana", "cherry");

String result1 = words.stream().collect(Collectors.joining());  // "applebananacherry"
String result2 = words.stream().collect(Collectors.joining(", "));  // "apple, banana, cherry"
String result3 = words.stream().collect(Collectors.joining(", ", "[", "]"));  // "[apple, banana, cherry]"
```

### 4.3 집계

```
static <T> Collector<T, ?, Long> counting()
static <T> Collector<T, ?, Optional<T>> minBy(Comparator<? super T> comparator)
static <T> Collector<T, ?, Optional<T>> maxBy(Comparator<? super T> comparator)
static <T> Collector<T, ?, Integer> summingInt(ToIntFunction<? super T> mapper)
static <T> Collector<T, ?, Long> summingLong(ToLongFunction<? super T> mapper)
static <T> Collector<T, ?, Double> summingDouble(ToDoubleFunction<? super T> mapper)
static <T> Collector<T, ?, Double> averagingInt(ToIntFunction<? super T> mapper)
static <T> Collector<T, ?, Double> averagingLong(ToLongFunction<? super T> mapper)
static <T> Collector<T, ?, Double> averagingDouble(ToDoubleFunction<? super T> mapper)
static <T> Collector<T, ?, IntSummaryStatistics> summarizingInt(ToIntFunction<? super T> mapper)
static <T> Collector<T, ?, LongSummaryStatistics> summarizingLong(ToLongFunction<? super T> mapper)
static <T> Collector<T, ?, DoubleSummaryStatistics> summarizingDouble(ToDoubleFunction<? super T> mapper)
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

long count = list.stream().collect(Collectors.counting());  // 5

Optional<Integer> min = list.stream().collect(Collectors.minBy(Comparator.naturalOrder()));  // 1
Optional<Integer> max = list.stream().collect(Collectors.maxBy(Comparator.naturalOrder()));  // 5

int sum = list.stream().collect(Collectors.summingInt(Integer::intValue));  // 15
double avg = list.stream().collect(Collectors.averagingInt(Integer::intValue));  // 3.0

// 통계 정보 한번에
IntSummaryStatistics stats = list.stream().collect(Collectors.summarizingInt(Integer::intValue));
System.out.println(stats.getCount());    // 5
System.out.println(stats.getSum());      // 15
System.out.println(stats.getMin());      // 1
System.out.println(stats.getMax());      // 5
System.out.println(stats.getAverage());  // 3.0
```

### 4.4 그룹화

```
static <T, K> Collector<T, ?, Map<K, List<T>>> groupingBy(Function<? super T, ? extends K> classifier)
static <T, K, A, D> Collector<T, ?, Map<K, D>> groupingBy(Function<? super T, ? extends K> classifier, Collector<? super T, A, D> downstream)
static <T, K, D, A, M extends Map<K, D>> Collector<T, ?, M> groupingBy(Function<? super T, ? extends K> classifier, Supplier<M> mapFactory, Collector<? super T, A, D> downstream)
```

**사용 예시**

```
List<String> words = Arrays.asList("apple", "banana", "cherry", "avocado", "blueberry");

// 첫 글자로 그룹화
Map<Character, List<String>> grouped = words.stream()
    .collect(Collectors.groupingBy(w -> w.charAt(0)));
// {a=[apple, avocado], b=[banana, blueberry], c=[cherry]}

// 길이로 그룹화
Map<Integer, List<String>> byLength = words.stream()
    .collect(Collectors.groupingBy(String::length));
// {5=[apple], 6=[banana, cherry], 7=[avocado], 9=[blueberry]}

// 그룹화 + 카운팅
Map<Integer, Long> lengthCount = words.stream()
    .collect(Collectors.groupingBy(String::length, Collectors.counting()));
// {5=1, 6=2, 7=1, 9=1}

// 그룹화 + Set으로 수집
Map<Character, Set<String>> groupedSet = words.stream()
    .collect(Collectors.groupingBy(w -> w.charAt(0), Collectors.toSet()));

// 짝수/홀수 그룹화
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6);
Map<Boolean, List<Integer>> evenOdd = numbers.stream()
    .collect(Collectors.groupingBy(n -> n % 2 == 0));
// {false=[1, 3, 5], true=[2, 4, 6]}
```

### 4.5 분할 (partitioningBy)

```
static <T> Collector<T, ?, Map<Boolean, List<T>>> partitioningBy(Predicate<? super T> predicate)
static <T, D, A> Collector<T, ?, Map<Boolean, D>> partitioningBy(Predicate<? super T> predicate, Collector<? super T, A, D> downstream)
```

**사용 예시**

```
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 짝수/홀수로 분할
Map<Boolean, List<Integer>> partitioned = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));
// {false=[1, 3, 5, 7, 9], true=[2, 4, 6, 8, 10]}

List<Integer> evens = partitioned.get(true);
List<Integer> odds = partitioned.get(false);

// 분할 + 카운팅
Map<Boolean, Long> partitionedCount = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0, Collectors.counting()));
// {false=5, true=5}
```

### 4.6 Map으로 수집

```
static <T, K, U> Collector<T, ?, Map<K, U>> toMap(Function<? super T, ? extends K> keyMapper, Function<? super T, ? extends U> valueMapper)
static <T, K, U> Collector<T, ?, Map<K, U>> toMap(Function<? super T, ? extends K> keyMapper, Function<? super T, ? extends U> valueMapper, BinaryOperator<U> mergeFunction)
static <T, K, U, M extends Map<K, U>> Collector<T, ?, M> toMap(Function<? super T, ? extends K> keyMapper, Function<? super T, ? extends U> valueMapper, BinaryOperator<U> mergeFunction, Supplier<M> mapSupplier)
```

**사용 예시**

```
List<String> words = Arrays.asList("apple", "banana", "cherry");

// 단어 → 길이 맵
Map<String, Integer> wordLengths = words.stream()
    .collect(Collectors.toMap(w -> w, String::length));
// {apple=5, banana=6, cherry=6}

// 또는
Map<String, Integer> wordLengths2 = words.stream()
    .collect(Collectors.toMap(Function.identity(), String::length));

// 중복 키 처리 (mergeFunction)
List<String> duplicates = Arrays.asList("apple", "banana", "apple");
Map<String, Integer> counts = duplicates.stream()
    .collect(Collectors.toMap(w -> w, w -> 1, Integer::sum));
// {apple=2, banana=1}

// TreeMap으로 수집
Map<String, Integer> treeMap = words.stream()
    .collect(Collectors.toMap(w -> w, String::length, (v1, v2) -> v1, TreeMap::new));
```

### 4.7 기타

**mapping**

```
static <T, U, A, R> Collector<T, ?, R> mapping(Function<? super T, ? extends U> mapper, Collector<? super U, A, R> downstream)
```

**filtering (Java 9+)**

```
static <T, A, R> Collector<T, ?, R> filtering(Predicate<? super T> predicate, Collector<? super T, A, R> downstream)
```

**collectingAndThen**

```
static <T, A, R, RR> Collector<T, A, RR> collectingAndThen(Collector<T, A, R> downstream, Function<R, RR> finisher)
```

**사용 예시**

```
// mapping: 그룹화 후 변환
Map<Character, List<Integer>> grouped = words.stream()
    .collect(Collectors.groupingBy(
        w -> w.charAt(0),
        Collectors.mapping(String::length, Collectors.toList())
    ));

// collectingAndThen: 수집 후 변환
List<Integer> unmodifiable = list.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.toList(),
        Collections::unmodifiableList
    ));
```

\---

## 5\. 병렬 스트림

```
Stream<T> parallel()                             // 병렬 스트림으로 변환
Stream<T> sequential()                           // 순차 스트림으로 변환
boolean isParallel()                             // 병렬 스트림인지 확인
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);

// 병렬 스트림 생성
Stream<Integer> parallel1 = list.parallelStream();
Stream<Integer> parallel2 = list.stream().parallel();

// 큰 데이터셋에서 성능 향상
int sum = IntStream.range(1, 1000000)
    .parallel()
    .filter(n -> n % 2 == 0)
    .sum();

// 주의: 순서가 중요하거나 작은 데이터셋에서는 오히려 느릴 수 있음
```

\---

## 6\. 알고리즘 문제 풀이 팁

### 6.1 자주 사용하는 패턴

**1\. 배열 → List**

```
int[] arr = {1, 2, 3, 4, 5};
List<Integer> list = Arrays.stream(arr)
    .boxed()
    .collect(Collectors.toList());
```

**2\. List → 배열**

```
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
int[] arr = list.stream()
    .mapToInt(Integer::intValue)
    .toArray();
```

**3\. 문자열 → 문자 배열**

```
String str = "hello";
char[] chars = str.chars()
    .mapToObj(c -> (char)c)
    .toArray(Character[]::new);
```

**4\. 중복 제거 + 정렬**

```
List<Integer> list = Arrays.asList(5, 2, 8, 2, 1, 5, 9);
List<Integer> result = list.stream()
    .distinct()
    .sorted()
    .collect(Collectors.toList());  // [1, 2, 5, 8, 9]
```

**5\. 빈도수 카운팅**

```
List<String> words = Arrays.asList("a", "b", "a", "c", "a", "b");
Map<String, Long> frequency = words.stream()
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
// {a=3, b=2, c=1}
```

**6\. 최대/최소 K개 요소**

```
List<Integer> list = Arrays.asList(5, 2, 8, 1, 9, 3, 7);

// 최대 3개
List<Integer> top3 = list.stream()
    .sorted(Comparator.reverseOrder())
    .limit(3)
    .collect(Collectors.toList());  // [9, 8, 7]

// 최소 3개
List<Integer> bottom3 = list.stream()
    .sorted()
    .limit(3)
    .collect(Collectors.toList());  // [1, 2, 3]
```

**7\. 조건별 필터링 및 그룹화**

```
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

Map<String, List<Integer>> categorized = numbers.stream()
    .collect(Collectors.groupingBy(n -> {
        if (n % 3 == 0) return "divisible by 3";
        if (n % 2 == 0) return "even";
        return "odd";
    }));
```

**8\. 범위 합계**

```
// 1부터 n까지의 합
int n = 100;
int sum = IntStream.rangeClosed(1, n).sum();  // 5050

// 조건부 합계
int evenSum = IntStream.rangeClosed(1, 100)
    .filter(i -> i % 2 == 0)
    .sum();  // 2550
```

**9\. 2차원 배열 처리**

```
int[][] matrix = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};

// 평탄화
int[] flat = Arrays.stream(matrix)
    .flatMapToInt(Arrays::stream)
    .toArray();  // [1, 2, 3, 4, 5, 6, 7, 8, 9]

// 합계
int sum = Arrays.stream(matrix)
    .flatMapToInt(Arrays::stream)
    .sum();  // 45
```

**10\. 조합 생성 (간단한 경우)**

```
List<Integer> list = Arrays.asList(1, 2, 3);

// 모든 쌍 생성
List<int[]> pairs = list.stream()
    .flatMap(i -> list.stream()
        .filter(j -> i < j)
        .map(j -> new int[]{i, j}))
    .collect(Collectors.toList());
// [[1,2], [1,3], [2,3]]
```

**11\. Map의 값으로 정렬**

```
Map<String, Integer> map = new HashMap<>();
map.put("apple", 5);
map.put("banana", 2);
map.put("cherry", 8);

// 값으로 내림차순 정렬
List<Map.Entry<String, Integer>> sorted = map.entrySet().stream()
    .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
    .collect(Collectors.toList());
// [cherry=8, apple=5, banana=2]

// LinkedHashMap으로 (순서 유지)
Map<String, Integer> sortedMap = map.entrySet().stream()
    .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
    .collect(Collectors.toMap(
        Map.Entry::getKey,
        Map.Entry::getValue,
        (e1, e2) -> e1,
        LinkedHashMap::new
    ));
```

**12\. 문자열 처리**

```
String text = "Hello World";

// 문자별 빈도
Map<Character, Long> charFreq = text.chars()
    .mapToObj(c -> (char)c)
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

// 단어별 빈도
String sentence = "apple banana apple cherry banana apple";
Map<String, Long> wordFreq = Arrays.stream(sentence.split(" "))
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
```

\---

## 7\. 주의사항

### 7.1 스트림은 재사용 불가

```
Stream<Integer> stream = list.stream();
stream.forEach(System.out::println);
// stream.forEach(System.out::println);  // IllegalStateException: stream has already been operated upon or closed
```

### 7.2 상태를 변경하지 말 것

```
// 잘못된 예
List<Integer> list = new ArrayList<>();
IntStream.range(0, 10).forEach(list::add);  // 병렬 스트림에서 문제 발생 가능

// 올바른 예
List<Integer> list = IntStream.range(0, 10)
    .boxed()
    .collect(Collectors.toList());
```

### 7.3 병렬 스트림 주의

```
// 순서가 중요한 경우 병렬 스트림 사용 주의
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
list.parallelStream().forEach(System.out::println);  // 순서 보장 안됨
list.parallelStream().forEachOrdered(System.out::println);  // 순서 보장
```

### 7.4 null 처리

```
// null이 포함된 리스트
List<String> list = Arrays.asList("a", null, "b", null, "c");

// NullPointerException 발생 가능
// list.stream().map(String::toUpperCase).collect(Collectors.toList());

// 올바른 처리
List<String> result = list.stream()
    .filter(Objects::nonNull)
    .map(String::toUpperCase)
    .collect(Collectors.toList());
```

### 7.5 성능 고려

```
// 작은 데이터셋에서는 for문이 더 빠를 수 있음
List<Integer> small = Arrays.asList(1, 2, 3, 4, 5);

// Stream (오버헤드 존재)
int sum1 = small.stream().mapToInt(Integer::intValue).sum();

// 일반 for문 (더 빠름)
int sum2 = 0;
for (int num : small) {
    sum2 += num;
}
```

### 7.6 Optional 처리

```
Optional<Integer> opt = list.stream().findFirst();

// 잘못된 예
if (opt.isPresent()) {
    System.out.println(opt.get());
}

// 좋은 예
opt.ifPresent(System.out::println);
int value = opt.orElse(0);
int value2 = opt.orElseGet(() -> 0);
```

### 7.7 무한 스트림 주의

```
// limit 없으면 무한 루프
Stream<Integer> infinite = Stream.iterate(0, n -> n + 1);
// infinite.forEach(System.out::println);  // 무한 실행!

// 올바른 사용
infinite.limit(10).forEach(System.out::println);
```

\---
