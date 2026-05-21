---
title: "Java 컬렉션 프레임워크 정리 (알고리즘 문제 풀이용)"
description: "알고리즘 문제를 풀 때 자주 사용하는 Java 컬렉션 프레임워크의 주요 클래스와 메서드를 정리했습니다. List는 순서가 있고 중복을 허용하는 컬렉션입니다. 동적 배열 기반의 리스트. 인덱스 접근이 빠릅니다 (O(1)). 생성자 주요 메서드 추가 삭제 조회 수정 크기 변환"
image: "/images/blog/tistory-79/image-01.png"
pubDate: 2026-02-15
tags: ["java", "알고리즘"]
draft: false
slug: "tistory-79"
---
![Java 컬렉션 프레임워크 정리 (알고리즘 문제 풀이용)](/images/blog/tistory-79/image-01.png)

알고리즘 문제를 풀 때 자주 사용하는 Java 컬렉션 프레임워크의 주요 클래스와 메서드를 정리했습니다.

\---

## 1\. List 인터페이스

List는 순서가 있고 중복을 허용하는 컬렉션입니다.

### 1.1 ArrayList 클래스

동적 배열 기반의 리스트. 인덱스 접근이 빠릅니다 (O(1)).

**생성자**

```
ArrayList()                                      // 초기 용량 10
ArrayList(int initialCapacity)                   // 초기 용량 지정
ArrayList(Collection<? extends E> c)             // 다른 컬렉션으로 초기화
```

**주요 메서드**

**추가**

```
boolean add(E e)                                 // 끝에 추가
void add(int index, E element)                   // 특정 위치에 삽입
boolean addAll(Collection<? extends E> c)        // 컬렉션의 모든 요소 추가
boolean addAll(int index, Collection<? extends E> c)  // 특정 위치에 컬렉션 삽입
```

**삭제**

```
E remove(int index)                              // 인덱스로 삭제 후 반환
boolean remove(Object o)                         // 객체로 삭제 (첫 번째 일치)
boolean removeAll(Collection<?> c)               // c에 있는 모든 요소 삭제
boolean retainAll(Collection<?> c)               // c에 있는 요소만 남기고 삭제
void clear()                                     // 모든 요소 삭제
boolean removeIf(Predicate<? super E> filter)    // 조건에 맞는 요소 삭제
```

**조회**

```
E get(int index)                                 // 인덱스로 조회
int indexOf(Object o)                            // 첫 번째 일치 인덱스 (-1: 없음)
int lastIndexOf(Object o)                        // 마지막 일치 인덱스
boolean contains(Object o)                       // 포함 여부
boolean containsAll(Collection<?> c)             // c의 모든 요소 포함 여부
```

**수정**

```
E set(int index, E element)                      // 인덱스 위치 값 변경 후 이전 값 반환
void replaceAll(UnaryOperator<E> operator)       // 모든 요소에 함수 적용
```

**크기**

```
int size()                                       // 크기
boolean isEmpty()                                // 비어있는지 확인
```

**변환**

```
Object[] toArray()                               // Object 배열로 변환
<T> T[] toArray(T[] a)                           // 타입 지정 배열로 변환
List<E> subList(int fromIndex, int toIndex)      // 부분 리스트 [fromIndex, toIndex)
```

**정렬**

```
void sort(Comparator<? super E> c)               // 정렬
```

**기타**

```
void ensureCapacity(int minCapacity)             // 최소 용량 보장
void trimToSize()                                // 용량을 크기에 맞춤
Iterator<E> iterator()                           // Iterator 반환
ListIterator<E> listIterator()                   // ListIterator 반환
ListIterator<E> listIterator(int index)          // index부터 시작하는 ListIterator
void forEach(Consumer<? super E> action)         // 각 요소에 작업 수행
```

**사용 예시**

```
// 생성 및 초기화
ArrayList<Integer> list = new ArrayList<>();
list.add(10);                                    // [10]
list.add(20);                                    // [10, 20]
list.add(1, 15);                                 // [10, 15, 20]

// 조회
int value = list.get(0);                         // 10
int idx = list.indexOf(15);                      // 1
boolean has = list.contains(20);                 // true

// 수정
list.set(0, 100);                                // [100, 15, 20]

// 삭제
list.remove(1);                                  // [100, 20] (인덱스 1 삭제)
list.remove(Integer.valueOf(20));                // [100] (값 20 삭제)

// 정렬
list.addAll(Arrays.asList(30, 10, 50));          // [100, 30, 10, 50]
list.sort(Comparator.naturalOrder());            // [10, 30, 50, 100]
list.sort(Comparator.reverseOrder());            // [100, 50, 30, 10]

// 배열 변환
Integer[] arr = list.toArray(new Integer[0]);
```

### 1.2 LinkedList 클래스

연결 리스트 기반. 삽입/삭제가 빠릅니다 (O(1) at ends).

**생성자**

```
LinkedList()
LinkedList(Collection<? extends E> c)
```

**ArrayList의 모든 메서드 + 추가 메서드**

**앞/뒤 추가**

```
void addFirst(E e)                               // 맨 앞에 추가
void addLast(E e)                                // 맨 뒤에 추가 (add와 동일)
boolean offerFirst(E e)                          // 맨 앞에 추가 (true 반환)
boolean offerLast(E e)                           // 맨 뒤에 추가 (true 반환)
```

**앞/뒤 조회**

```
E getFirst()                                     // 첫 번째 요소 (NoSuchElementException 가능)
E getLast()                                      // 마지막 요소
E peekFirst()                                    // 첫 번째 요소 (null 반환)
E peekLast()                                     // 마지막 요소 (null 반환)
E peek()                                         // 첫 번째 요소 (peekFirst와 동일)
E element()                                      // 첫 번째 요소 (getFirst와 동일)
```

**앞/뒤 삭제**

```
E removeFirst()                                  // 첫 번째 요소 삭제 후 반환
E removeLast()                                   // 마지막 요소 삭제 후 반환
E pollFirst()                                    // 첫 번째 요소 삭제 후 반환 (null 가능)
E pollLast()                                     // 마지막 요소 삭제 후 반환 (null 가능)
E poll()                                         // 첫 번째 요소 삭제 후 반환 (pollFirst와 동일)
E remove()                                       // 첫 번째 요소 삭제 후 반환 (removeFirst와 동일)
boolean removeFirstOccurrence(Object o)          // 첫 번째 일치 요소 삭제
boolean removeLastOccurrence(Object o)           // 마지막 일치 요소 삭제
```

**Stack/Queue 연산**

```
void push(E e)                                   // Stack: 맨 앞에 추가
E pop()                                          // Stack: 맨 앞 요소 삭제 후 반환
boolean offer(E e)                               // Queue: 맨 뒤에 추가
```

**사용 예시**

```
LinkedList<String> list = new LinkedList<>();

// Deque로 사용
list.addFirst("A");                              // ["A"]
list.addLast("B");                               // ["A", "B"]
list.addFirst("Z");                              // ["Z", "A", "B"]

String first = list.getFirst();                  // "Z"
String last = list.getLast();                    // "B"

list.removeFirst();                              // ["A", "B"]
list.removeLast();                               // ["A"]

// Queue로 사용
list.offer("X");                                 // ["A", "X"] (뒤에 추가)
String head = list.poll();                       // "A" (앞에서 꺼냄), ["X"]

// Stack으로 사용
list.push("Y");                                  // ["Y", "X"] (앞에 추가)
String top = list.pop();                         // "Y" (앞에서 꺼냄), ["X"]
```

\---

## 2\. Set 인터페이스

Set은 중복을 허용하지 않는 컬렉션입니다.

### 2.1 HashSet 클래스

해시 테이블 기반. 순서 보장 안 됨. 빠른 검색/삽입/삭제 (평균 O(1)).

**생성자**

```
HashSet()                                        // 초기 용량 16, 로드팩터 0.75
HashSet(int initialCapacity)
HashSet(int initialCapacity, float loadFactor)
HashSet(Collection<? extends E> c)
```

**주요 메서드**

**추가**

```
boolean add(E e)                                 // 추가 (이미 있으면 false)
boolean addAll(Collection<? extends E> c)
```

**삭제**

```
boolean remove(Object o)                         // 삭제 (있었으면 true)
boolean removeAll(Collection<?> c)
boolean retainAll(Collection<?> c)               // c에 있는 것만 유지
void clear()
boolean removeIf(Predicate<? super E> filter)
```

**조회**

```
boolean contains(Object o)                       // 포함 여부
boolean containsAll(Collection<?> c)
```

**크기**

```
int size()
boolean isEmpty()
```

**변환**

```
Object[] toArray()
<T> T[] toArray(T[] a)
Iterator<E> iterator()
```

**기타**

```
void forEach(Consumer<? super E> action)
```

**사용 예시**

```
HashSet<Integer> set = new HashSet<>();

// 추가
set.add(10);                                     // true
set.add(20);                                     // true
set.add(10);                                     // false (중복)

// 조회
boolean has = set.contains(10);                  // true

// 크기
int size = set.size();                           // 2

// 순회
for (int num : set) {
    System.out.println(num);                     // 순서 보장 안 됨
}

// 삭제
set.remove(10);                                  // true
set.clear();

// 집합 연산
HashSet<Integer> set1 = new HashSet<>(Arrays.asList(1, 2, 3, 4));
HashSet<Integer> set2 = new HashSet<>(Arrays.asList(3, 4, 5, 6));

// 합집합
HashSet<Integer> union = new HashSet<>(set1);
union.addAll(set2);                              // [1, 2, 3, 4, 5, 6]

// 교집합
HashSet<Integer> intersection = new HashSet<>(set1);
intersection.retainAll(set2);                    // [3, 4]

// 차집합
HashSet<Integer> difference = new HashSet<>(set1);
difference.removeAll(set2);                      // [1, 2]
```

### 2.2 TreeSet 클래스

이진 검색 트리(Red-Black Tree) 기반. 정렬된 순서 유지. 검색/삽입/삭제 O(log n).

**생성자**

```
TreeSet()                                        // 자연 순서
TreeSet(Comparator<? super E> comparator)        // 사용자 정의 순서
TreeSet(Collection<? extends E> c)
TreeSet(SortedSet<E> s)
```

**HashSet의 모든 메서드 + 추가 메서드**

**첫/마지막 요소**

```
E first()                                        // 최소값 (NoSuchElementException 가능)
E last()                                         // 최대값
E pollFirst()                                    // 최소값 삭제 후 반환 (null 가능)
E pollLast()                                     // 최대값 삭제 후 반환
```

**범위 조회**

```
E lower(E e)                                     // e보다 작은 값 중 최대값 (null 가능)
E floor(E e)                                     // e 이하의 값 중 최대값
E ceiling(E e)                                   // e 이상의 값 중 최소값
E higher(E e)                                    // e보다 큰 값 중 최소값
```

**부분 집합**

```
SortedSet<E> headSet(E toElement)                // toElement 미만의 요소들
NavigableSet<E> headSet(E toElement, boolean inclusive)  // inclusive: 포함 여부
SortedSet<E> tailSet(E fromElement)              // fromElement 이상의 요소들
NavigableSet<E> tailSet(E fromElement, boolean inclusive)
SortedSet<E> subSet(E fromElement, E toElement)  // [fromElement, toElement)
NavigableSet<E> subSet(E fromElement, boolean fromInclusive, E toElement, boolean toInclusive)
```

**역순**

```
NavigableSet<E> descendingSet()                  // 역순 뷰
Iterator<E> descendingIterator()                 // 역순 반복자
```

**사용 예시**

```
TreeSet<Integer> set = new TreeSet<>();

// 추가 (자동 정렬)
set.add(30);
set.add(10);
set.add(20);                                     // 내부적으로 [10, 20, 30] 순서

// 첫/마지막
int first = set.first();                         // 10
int last = set.last();                           // 30

// 범위 조회
int lower = set.lower(20);                       // 10 (20보다 작은 값 중 최대)
int floor = set.floor(20);                       // 20 (20 이하 중 최대)
int ceiling = set.ceiling(20);                   // 20 (20 이상 중 최소)
int higher = set.higher(20);                     // 30 (20보다 큰 값 중 최소)

// 부분 집합
set.addAll(Arrays.asList(5, 15, 25, 35));        // [5, 10, 15, 20, 25, 30, 35]
SortedSet<Integer> headSet = set.headSet(20);    // [5, 10, 15]
SortedSet<Integer> tailSet = set.tailSet(20);    // [20, 25, 30, 35]
SortedSet<Integer> subSet = set.subSet(10, 30);  // [10, 15, 20, 25]

// 역순
NavigableSet<Integer> desc = set.descendingSet();  // [35, 30, 25, 20, 15, 10, 5]

// 사용자 정의 정렬 (내림차순)
TreeSet<Integer> descSet = new TreeSet<>(Comparator.reverseOrder());
descSet.addAll(Arrays.asList(10, 20, 30));       // [30, 20, 10]
```

### 2.3 LinkedHashSet 클래스

해시 테이블 + 연결 리스트. 삽입 순서 유지. HashSet과 거의 동일하나 순서 보장.

**생성자**

```
LinkedHashSet()
LinkedHashSet(int initialCapacity)
LinkedHashSet(int initialCapacity, float loadFactor)
LinkedHashSet(Collection<? extends E> c)
```

**HashSet의 모든 메서드 사용 가능 (순서만 유지됨)**

**사용 예시**

```
LinkedHashSet<String> set = new LinkedHashSet<>();
set.add("C");
set.add("A");
set.add("B");

// 순회 시 삽입 순서 유지
for (String s : set) {
    System.out.println(s);                       // C, A, B (삽입 순서)
}
```

\---

## 3\. Map 인터페이스

Map은 키-값 쌍을 저장하는 컬렉션입니다. 키는 중복 불가, 값은 중복 가능.

### 3.1 HashMap 클래스

해시 테이블 기반. 순서 보장 안 됨. 빠른 검색/삽입/삭제 (평균 O(1)).

**생성자**

```
HashMap()                                        // 초기 용량 16, 로드팩터 0.75
HashMap(int initialCapacity)
HashMap(int initialCapacity, float loadFactor)
HashMap(Map<? extends K, ? extends V> m)
```

**주요 메서드**

**추가/수정**

```
V put(K key, V value)                            // 키-값 추가/수정, 이전 값 반환 (없으면 null)
void putAll(Map<? extends K, ? extends V> m)     // 다른 맵의 모든 항목 추가
V putIfAbsent(K key, V value)                    // 키가 없거나 null이면 추가
```

**조회**

```
V get(Object key)                                // 값 조회 (없으면 null)
V getOrDefault(Object key, V defaultValue)       // 값 조회 (없으면 기본값)
boolean containsKey(Object key)                  // 키 포함 여부
boolean containsValue(Object value)              // 값 포함 여부
```

**삭제**

```
V remove(Object key)                             // 키로 삭제 후 값 반환
boolean remove(Object key, Object value)         // 키-값 쌍이 일치하면 삭제
void clear()                                     // 모든 항목 삭제
```

**크기**

```
int size()
boolean isEmpty()
```

**뷰**

```
Set<K> keySet()                                  // 모든 키의 Set
Collection<V> values()                           // 모든 값의 Collection
Set<Map.Entry<K, V>> entrySet()                  // 모든 엔트리의 Set
```

**함수형 메서드**

```
V compute(K key, BiFunction<? super K, ? super V, ? extends V> remappingFunction)
V computeIfAbsent(K key, Function<? super K, ? extends V> mappingFunction)
V computeIfPresent(K key, BiFunction<? super K, ? super V, ? extends V> remappingFunction)
V merge(K key, V value, BiFunction<? super V, ? super V, ? extends V> remappingFunction)
void replaceAll(BiFunction<? super K, ? super V, ? extends V> function)
void forEach(BiConsumer<? super K, ? super V> action)
```

**사용 예시**

```
HashMap<String, Integer> map = new HashMap<>();

// 추가
map.put("apple", 100);                           // {apple=100}
map.put("banana", 200);                          // {apple=100, banana=200}
map.put("apple", 150);                           // {apple=150, banana=200} (덮어씀)

// 조회
int value1 = map.get("apple");                   // 150
int value2 = map.getOrDefault("cherry", 0);      // 0 (없으면 기본값)
boolean hasKey = map.containsKey("banana");      // true
boolean hasValue = map.containsValue(200);       // true

// 크기
int size = map.size();                           // 2

// 삭제
map.remove("banana");                            // {apple=150}

// 순회 - 방법 1: keySet
for (String key : map.keySet()) {
    System.out.println(key + ": " + map.get(key));
}

// 순회 - 방법 2: entrySet (효율적)
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}

// 순회 - 방법 3: forEach
map.forEach((key, value) -> System.out.println(key + ": " + value));

// 함수형 메서드
map.putIfAbsent("cherry", 300);                  // cherry가 없으면 추가
map.computeIfAbsent("date", k -> 400);           // date가 없으면 함수 실행 후 추가
map.merge("apple", 50, (old, newVal) -> old + newVal);  // apple 값에 50 더하기

// 빈도수 카운팅 패턴
String text = "hello world";
HashMap<Character, Integer> freq = new HashMap<>();
for (char ch : text.toCharArray()) {
    freq.put(ch, freq.getOrDefault(ch, 0) + 1);
}
// 또는
for (char ch : text.toCharArray()) {
    freq.merge(ch, 1, Integer::sum);
}
```

### 3.2 TreeMap 클래스

Red-Black Tree 기반. 키가 정렬된 순서 유지. 검색/삽입/삭제 O(log n).

**생성자**

```
TreeMap()                                        // 자연 순서
TreeMap(Comparator<? super K> comparator)        // 사용자 정의 순서
TreeMap(Map<? extends K, ? extends V> m)
TreeMap(SortedMap<K, ? extends V> m)
```

**HashMap의 모든 메서드 + 추가 메서드**

**첫/마지막 엔트리**

```
Map.Entry<K, V> firstEntry()                     // 최소 키 엔트리
K firstKey()                                     // 최소 키
Map.Entry<K, V> lastEntry()                      // 최대 키 엔트리
K lastKey()                                      // 최대 키
Map.Entry<K, V> pollFirstEntry()                 // 최소 키 엔트리 삭제 후 반환
Map.Entry<K, V> pollLastEntry()                  // 최대 키 엔트리 삭제 후 반환
```

**범위 조회**

```
Map.Entry<K, V> lowerEntry(K key)                // key보다 작은 키 중 최대
K lowerKey(K key)
Map.Entry<K, V> floorEntry(K key)                // key 이하 중 최대
K floorKey(K key)
Map.Entry<K, V> ceilingEntry(K key)              // key 이상 중 최소
K ceilingKey(K key)
Map.Entry<K, V> higherEntry(K key)               // key보다 큰 키 중 최소
K higherKey(K key)
```

**부분 맵**

```
SortedMap<K, V> headMap(K toKey)                 // toKey 미만
NavigableMap<K, V> headMap(K toKey, boolean inclusive)
SortedMap<K, V> tailMap(K fromKey)               // fromKey 이상
NavigableMap<K, V> tailMap(K fromKey, boolean inclusive)
SortedMap<K, V> subMap(K fromKey, K toKey)       // [fromKey, toKey)
NavigableMap<K, V> subMap(K fromKey, boolean fromInclusive, K toKey, boolean toInclusive)
```

**역순**

```
NavigableMap<K, V> descendingMap()               // 역순 맵
NavigableSet<K> descendingKeySet()               // 역순 키 Set
NavigableSet<K> navigableKeySet()                // 키 NavigableSet
```

**사용 예시**

```
TreeMap<Integer, String> map = new TreeMap<>();

// 추가 (키 자동 정렬)
map.put(30, "C");
map.put(10, "A");
map.put(20, "B");                                // {10=A, 20=B, 30=C}

// 첫/마지막
Map.Entry<Integer, String> first = map.firstEntry();  // 10=A
Map.Entry<Integer, String> last = map.lastEntry();    // 30=C

// 범위 조회
Integer lower = map.lowerKey(20);                // 10
Integer floor = map.floorKey(20);                // 20
Integer ceiling = map.ceilingKey(20);            // 20
Integer higher = map.higherKey(20);              // 30

// 부분 맵
map.put(5, "Z");
map.put(25, "D");                                // {5=Z, 10=A, 20=B, 25=D, 30=C}
SortedMap<Integer, String> headMap = map.headMap(20);     // {5=Z, 10=A}
SortedMap<Integer, String> tailMap = map.tailMap(20);     // {20=B, 25=D, 30=C}
SortedMap<Integer, String> subMap = map.subMap(10, 30);   // {10=A, 20=B, 25=D}

// 역순
NavigableMap<Integer, String> desc = map.descendingMap();  // {30=C, 25=D, 20=B, 10=A, 5=Z}
```

### 3.3 LinkedHashMap 클래스

해시 테이블 + 연결 리스트. 삽입 순서 또는 접근 순서 유지.

**생성자**

```
LinkedHashMap()                                  // 삽입 순서
LinkedHashMap(int initialCapacity)
LinkedHashMap(int initialCapacity, float loadFactor)
LinkedHashMap(int initialCapacity, float loadFactor, boolean accessOrder)  // accessOrder: true면 접근 순서
LinkedHashMap(Map<? extends K, ? extends V> m)
```

**HashMap의 모든 메서드 사용 가능 (순서만 유지됨)**

**사용 예시**

```
// 삽입 순서 유지
LinkedHashMap<String, Integer> map = new LinkedHashMap<>();
map.put("C", 3);
map.put("A", 1);
map.put("B", 2);

for (String key : map.keySet()) {
    System.out.println(key);                     // C, A, B (삽입 순서)
}

// LRU 캐시 구현 (접근 순서)
LinkedHashMap<Integer, String> lruCache = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, String> eldest) {
        return size() > 3;  // 크기가 3 초과하면 가장 오래된 항목 삭제
    }
};
lruCache.put(1, "A");
lruCache.put(2, "B");
lruCache.put(3, "C");
lruCache.get(1);  // 1 접근
lruCache.put(4, "D");  // 크기 초과, 2 삭제됨
```

\---

## 4\. Queue 인터페이스

Queue는 FIFO(First In First Out) 구조입니다.

### 4.1 PriorityQueue 클래스

힙(Heap) 기반 우선순위 큐. 최소 힙(기본) 또는 최대 힙.

**생성자**

```
PriorityQueue()                                  // 자연 순서 (최소 힙)
PriorityQueue(int initialCapacity)
PriorityQueue(Comparator<? super E> comparator)  // 사용자 정의 순서
PriorityQueue(Collection<? extends E> c)
PriorityQueue(PriorityQueue<? extends E> c)
PriorityQueue(SortedSet<? extends E> c)
```

**주요 메서드**

**추가**

```
boolean add(E e)                                 // 추가 (실패 시 예외)
boolean offer(E e)                               // 추가 (실패 시 false)
```

**조회**

```
E peek()                                         // 최우선 요소 조회 (null 가능)
E element()                                      // 최우선 요소 조회 (예외 가능)
```

**삭제**

```
E poll()                                         // 최우선 요소 삭제 후 반환 (null 가능)
E remove()                                       // 최우선 요소 삭제 후 반환 (예외 가능)
boolean remove(Object o)                         // 특정 객체 삭제
void clear()
```

**기타**

```
int size()
boolean isEmpty()
boolean contains(Object o)
Object[] toArray()
<T> T[] toArray(T[] a)
Iterator<E> iterator()                           // 순서 보장 안 됨!
```

**사용 예시**

```
// 최소 힙 (기본)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(30);
minHeap.offer(10);
minHeap.offer(20);

System.out.println(minHeap.poll());              // 10 (최소값)
System.out.println(minHeap.poll());              // 20
System.out.println(minHeap.poll());              // 30

// 최대 힙
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
maxHeap.offer(30);
maxHeap.offer(10);
maxHeap.offer(20);

System.out.println(maxHeap.poll());              // 30 (최대값)
System.out.println(maxHeap.poll());              // 20
System.out.println(maxHeap.poll());              // 10

// 사용자 정의 객체
class Task {
    String name;
    int priority;
    Task(String name, int priority) {
        this.name = name;
        this.priority = priority;
    }
}

// 우선순위 낮은 순 (숫자가 작을수록 높은 우선순위)
PriorityQueue<Task> taskQueue = new PriorityQueue<>((a, b) -> a.priority - b.priority);
taskQueue.offer(new Task("Low", 3));
taskQueue.offer(new Task("High", 1));
taskQueue.offer(new Task("Medium", 2));

Task task = taskQueue.poll();  // High (priority=1)
```

### 4.2 ArrayDeque 클래스

배열 기반 양방향 큐. Stack, Queue보다 빠름. null 불가.

**생성자**

```
ArrayDeque()                                     // 초기 용량 16
ArrayDeque(int numElements)
ArrayDeque(Collection<? extends E> c)
```

**주요 메서드**

**앞 추가**

```
void addFirst(E e)                               // 맨 앞에 추가
boolean offerFirst(E e)
void push(E e)                                   // Stack: addFirst와 동일
```

**뒤 추가**

```
void addLast(E e)                                // 맨 뒤에 추가
boolean offerLast(E e)
boolean add(E e)                                 // addLast와 동일
boolean offer(E e)                               // offerLast와 동일
```

**앞 조회**

```
E getFirst()                                     // 예외 가능
E peekFirst()                                    // null 가능
E peek()                                         // peekFirst와 동일
E element()                                      // getFirst와 동일
```

**뒤 조회**

```
E getLast()                                      // 예외 가능
E peekLast()                                     // null 가능
```

**앞 삭제**

```
E removeFirst()                                  // 예외 가능
E pollFirst()                                    // null 가능
E remove()                                       // removeFirst와 동일
E poll()                                         // pollFirst와 동일
E pop()                                          // Stack: removeFirst와 동일
```

**뒤 삭제**

```
E removeLast()                                   // 예외 가능
E pollLast()                                     // null 가능
```

**기타**

```
boolean remove(Object o)                         // 첫 번째 일치 삭제
boolean removeFirstOccurrence(Object o)
boolean removeLastOccurrence(Object o)
int size()
boolean isEmpty()
boolean contains(Object o)
void clear()
Iterator<E> iterator()
Iterator<E> descendingIterator()                 // 역순 반복자
```

**사용 예시**

```
ArrayDeque<Integer> deque = new ArrayDeque<>();

// Deque로 사용
deque.addFirst(10);                              // [10]
deque.addLast(20);                               // [10, 20]
deque.addFirst(5);                               // [5, 10, 20]
deque.addLast(30);                               // [5, 10, 20, 30]

int first = deque.peekFirst();                   // 5
int last = deque.peekLast();                     // 30

deque.pollFirst();                               // [10, 20, 30]
deque.pollLast();                                // [10, 20]

// Queue로 사용 (FIFO)
ArrayDeque<String> queue = new ArrayDeque<>();
queue.offer("A");
queue.offer("B");
queue.offer("C");                                // [A, B, C]

String item = queue.poll();                      // "A", [B, C]

// Stack으로 사용 (LIFO)
ArrayDeque<String> stack = new ArrayDeque<>();
stack.push("A");
stack.push("B");
stack.push("C");                                 // [C, B, A]

String top = stack.pop();                        // "C", [B, A]
```

\---

## 5\. Stack 클래스

**주의: Stack은 레거시 클래스입니다. ArrayDeque 사용을 권장합니다.**

**주요 메서드**

```
E push(E item)                                   // 추가
E pop()                                          // 제거 후 반환
E peek()                                         // 조회
boolean empty()                                  // 비어있는지
int search(Object o)                             // 위치 검색 (1부터 시작, 없으면 -1)
```

**사용 예시**

```
Stack<Integer> stack = new Stack<>();
stack.push(10);
stack.push(20);
stack.push(30);

int top = stack.peek();                          // 30
int popped = stack.pop();                        // 30
boolean isEmpty = stack.empty();                 // false
int pos = stack.search(10);                      // 2 (위에서부터 2번째)

// 권장: ArrayDeque 사용
ArrayDeque<Integer> deque = new ArrayDeque<>();
deque.push(10);
deque.push(20);
int top2 = deque.peek();
int popped2 = deque.pop();
```

\---

## 6\. Collections 유틸리티 클래스

java.util.Collections 클래스는 컬렉션을 다루는 유틸리티 메서드를 제공합니다.

### 6.1 정렬

```
static <T extends Comparable<? super T>> void sort(List<T> list)
static <T> void sort(List<T> list, Comparator<? super T> c)
static void reverse(List<?> list)                // 역순
static void shuffle(List<?> list)                // 무작위 섞기
static void shuffle(List<?> list, Random rnd)
static void rotate(List<?> list, int distance)  // 회전
static void swap(List<?> list, int i, int j)     // 교환
```

**사용 예시**

```
List<Integer> list = new ArrayList<>(Arrays.asList(5, 2, 8, 1, 9));

Collections.sort(list);                          // [1, 2, 5, 8, 9]
Collections.reverse(list);                       // [9, 8, 5, 2, 1]
Collections.shuffle(list);                       // 무작위 섞기
Collections.rotate(list, 2);                     // 오른쪽으로 2칸 회전
Collections.swap(list, 0, 4);                    // 0번과 4번 교환
```

### 6.2 검색

```
static <T> int binarySearch(List<? extends Comparable<? super T>> list, T key)
static <T> int binarySearch(List<? extends T> list, T key, Comparator<? super T> c)
static <T extends Object & Comparable<? super T>> T max(Collection<? extends T> coll)
static <T> T max(Collection<? extends T> coll, Comparator<? super T> comp)
static <T extends Object & Comparable<? super T>> T min(Collection<? extends T> coll)
static <T> T min(Collection<? extends T> coll, Comparator<? super T> comp)
static int frequency(Collection<?> c, Object o)  // 빈도수
```

**사용 예시**

```
List<Integer> list = Arrays.asList(1, 2, 5, 8, 9);
int idx = Collections.binarySearch(list, 5);     // 2

int max = Collections.max(list);                 // 9
int min = Collections.min(list);                 // 1

List<String> words = Arrays.asList("a", "b", "a", "c", "a");
int count = Collections.frequency(words, "a");   // 3
```

### 6.3 채우기 및 복사

```
static <T> void fill(List<? super T> list, T obj)
static <T> boolean replaceAll(List<T> list, T oldVal, T newVal)
static <T> void copy(List<? super T> dest, List<? extends T> src)
static <T> boolean addAll(Collection<? super T> c, T... elements)
```

**사용 예시**

```
List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
Collections.fill(list, 0);                       // [0, 0, 0, 0, 0]

List<String> words = new ArrayList<>(Arrays.asList("a", "b", "a", "c"));
Collections.replaceAll(words, "a", "z");         // ["z", "b", "z", "c"]

List<Integer> dest = new ArrayList<>(Arrays.asList(0, 0, 0, 0));
List<Integer> src = Arrays.asList(1, 2, 3, 4);
Collections.copy(dest, src);                     // [1, 2, 3, 4]
```

### 6.4 불변 컬렉션

```
static <T> List<T> emptyList()
static <T> Set<T> emptySet()
static <K,V> Map<K,V> emptyMap()

static <T> List<T> singletonList(T o)
static <T> Set<T> singleton(T o)
static <K,V> Map<K,V> singletonMap(K key, V value)

static <T> List<T> unmodifiableList(List<? extends T> list)
static <T> Set<T> unmodifiableSet(Set<? extends T> s)
static <K,V> Map<K,V> unmodifiableMap(Map<? extends K, ? extends V> m)
static <T> Collection<T> unmodifiableCollection(Collection<? extends T> c)
```

**사용 예시**

```
List<Integer> empty = Collections.emptyList();   // 빈 리스트
Set<String> single = Collections.singleton("A"); // 단일 요소 Set

List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3));
List<Integer> unmodifiable = Collections.unmodifiableList(list);
// unmodifiable.add(4);  // UnsupportedOperationException
```

### 6.5 동기화

```
static <T> Collection<T> synchronizedCollection(Collection<T> c)
static <T> List<T> synchronizedList(List<T> list)
static <T> Set<T> synchronizedSet(Set<T> s)
static <K,V> Map<K,V> synchronizedMap(Map<K,V> m)
```

**사용 예시**

```
List<Integer> list = new ArrayList<>();
List<Integer> syncList = Collections.synchronizedList(list);
// 멀티스레드 환경에서 안전
```

### 6.6 기타

```
static <T> Comparator<T> reverseOrder()          // 역순 Comparator
static <T> Comparator<T> reverseOrder(Comparator<T> cmp)
static <T> void reverse(List<T> list)            // 리스트 역순
static int indexOfSubList(List<?> source, List<?> target)  // 부분 리스트 인덱스
static int lastIndexOfSubList(List<?> source, List<?> target)
static boolean disjoint(Collection<?> c1, Collection<?> c2)  // 교집합 없는지
```

\---

## 7\. 알고리즘 문제 풀이 팁

### 7.1 자료구조 선택 가이드

**순서 있고 중복 허용 → List**

-   인덱스 접근 많음 → ArrayList
-   삽입/삭제 많음 → LinkedList

**중복 불허 → Set**

-   순서 필요 없음 → HashSet
-   정렬 필요 → TreeSet
-   삽입 순서 유지 → LinkedHashSet

**키-값 쌍 → Map**

-   순서 필요 없음 → HashMap
-   정렬 필요 → TreeMap
-   삽입 순서 유지 → LinkedHashMap

**Queue 필요**

-   FIFO → ArrayDeque (Queue로 사용)
-   우선순위 → PriorityQueue
-   LIFO (Stack) → ArrayDeque (Stack으로 사용)

### 7.2 자주 사용하는 패턴

**1\. 빈도수 카운팅**

```
String text = "hello";
Map<Character, Integer> freq = new HashMap<>();
for (char ch : text.toCharArray()) {
    freq.put(ch, freq.getOrDefault(ch, 0) + 1);
}
// {h=1, e=1, l=2, o=1}
```

**2\. 중복 제거**

```
List<Integer> list = Arrays.asList(1, 2, 2, 3, 3, 4);
Set<Integer> set = new HashSet<>(list);
List<Integer> unique = new ArrayList<>(set);     // [1, 2, 3, 4]
```

**3\. 정렬된 순서 유지하며 중복 제거**

```
List<Integer> list = Arrays.asList(3, 1, 2, 1, 3, 2);
Set<Integer> set = new TreeSet<>(list);          // [1, 2, 3]
```

**4\. 최대/최소 K개 요소**

```
// 최소 K개
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
for (int num : nums) {
    maxHeap.offer(num);
    if (maxHeap.size() > k) maxHeap.poll();
}

// 최대 K개
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
for (int num : nums) {
    minHeap.offer(num);
    if (minHeap.size() > k) minHeap.poll();
}
```

**5\. 슬라이딩 윈도우 최대값 (Deque)**

```
ArrayDeque<Integer> deque = new ArrayDeque<>();
List<Integer> result = new ArrayList<>();

for (int i = 0; i < nums.length; i++) {
    // 범위 벗어난 인덱스 제거
    while (!deque.isEmpty() && deque.peek() < i - k + 1) {
        deque.poll();
    }

    // 현재 값보다 작은 값들 제거
    while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
        deque.pollLast();
    }

    deque.offer(i);

    if (i >= k - 1) {
        result.add(nums[deque.peek()]);
    }
}
```

**6\. LRU 캐시**

```
LinkedHashMap<Integer, Integer> cache = new LinkedHashMap<>(capacity, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
};
```

**7\. 그래프 인접 리스트**

```
// ArrayList 배열
List<Integer>[] graph = new ArrayList[n];
for (int i = 0; i < n; i++) {
    graph[i] = new ArrayList<>();
}

// 또는 HashMap
Map<Integer, List<Integer>> graph = new HashMap<>();
```

**8\. 투 포인터 with Set**

```
Set<Character> set = new HashSet<>();
int left = 0, maxLen = 0;
for (int right = 0; right < s.length(); right++) {
    while (set.contains(s.charAt(right))) {
        set.remove(s.charAt(left++));
    }
    set.add(s.charAt(right));
    maxLen = Math.max(maxLen, right - left + 1);
}
```

\---

## 8\. 주의사항

### 8.1 ConcurrentModificationException

```
List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));

// 잘못된 예 - 예외 발생
for (Integer num : list) {
    if (num % 2 == 0) {
        list.remove(num);  // ConcurrentModificationException!
    }
}

// 올바른 방법 1 - Iterator 사용
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() % 2 == 0) {
        it.remove();
    }
}

// 올바른 방법 2 - removeIf (Java 8+)
list.removeIf(num -> num % 2 == 0);

// 올바른 방법 3 - 역순 순회 (인덱스 변화 없음)
for (int i = list.size() - 1; i >= 0; i--) {
    if (list.get(i) % 2 == 0) {
        list.remove(i);
    }
}
```

### 8.2 null 관련

```
// HashMap: null 키, null 값 모두 허용
HashMap<String, Integer> map = new HashMap<>();
map.put(null, 1);     // OK
map.put("key", null); // OK

// TreeMap: null 키 불가 (NullPointerException)
TreeMap<String, Integer> treeMap = new TreeMap<>();
// treeMap.put(null, 1);  // NullPointerException

// HashSet: null 허용
HashSet<String> set = new HashSet<>();
set.add(null);  // OK

// TreeSet: null 불가
TreeSet<String> treeSet = new TreeSet<>();
// treeSet.add(null);  // NullPointerException

// PriorityQueue: null 불가
PriorityQueue<Integer> pq = new PriorityQueue<>();
// pq.offer(null);  // NullPointerException

// ArrayDeque: null 불가
ArrayDeque<Integer> deque = new ArrayDeque<>();
// deque.offer(null);  // NullPointerException
```

### 8.3 정렬 후 비교

```
// TreeSet, TreeMap은 compareTo/Comparator 사용
TreeSet<String> set = new TreeSet<>();
set.add("10");
set.add("2");
set.add("1");
// ["1", "10", "2"] - 문자열 비교

// 숫자로 비교하려면
TreeSet<String> set2 = new TreeSet<>((a, b) -> Integer.parseInt(a) - Integer.parseInt(b));
set2.add("10");
set2.add("2");
set2.add("1");
// ["1", "2", "10"]
```

### 8.4 ArrayList vs LinkedList

```
// ArrayList: 인덱스 접근 O(1), 삽입/삭제 O(n)
List<Integer> arrayList = new ArrayList<>();
arrayList.get(100);  // 빠름

// LinkedList: 인덱스 접근 O(n), 앞/뒤 삽입/삭제 O(1)
List<Integer> linkedList = new LinkedList<>();
linkedList.get(100);  // 느림
((LinkedList<Integer>) linkedList).addFirst(1);  // 빠름
```

\---
