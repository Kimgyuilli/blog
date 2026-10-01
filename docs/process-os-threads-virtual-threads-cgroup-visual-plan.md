# CPU 실행 글의 시각자료 자리 설계

대상 글: [`process-os-threads-virtual-threads-cgroup-cpu.md`](../src/content/blog/process-os-threads-virtual-threads-cgroup-cpu.md). 본문에는 V1~V4 위치를 HTML 주석으로 표시했습니다. 지금은 장면을 구현하거나 MDX로 바꾸지 않습니다. 본문의 텍스트 도식과 설명은 구현 전에도 완결된 설명으로 남깁니다.

## 글에서 시각자료가 맡을 역할

앞선 [CS 데이터베이스 글](../src/content/blog/cs-database-normalization-joins-indexes.mdx)은 작은 주문 예시를 설명한 직후 독자가 값의 변화를 보게 합니다. [PeekCart 분리 글](../src/content/blog/peekcart-monolith-peel-order.mdx)은 먼저 분리 결과를 예측하게 한 뒤, 보이지 않던 연결이 드러나는 장면을 둡니다. 이 글에서도 독자가 잘못 짚기 쉬운 **스케줄링 주체, quota의 공유 범위, 큐 소속**을 해당 설명 가까이에서 확인하도록 합니다. 장면은 본문에 없는 성능 수치나 커널 동작을 주장하지 않습니다.

| 자리 | 독자가 장면에서 확인할 한 가지 변화 | 형태 | 본문 위치 |
| --- | --- | --- | --- |
| V1 | VT A가 대기하면 같은 carrier에 VT B가 올라갈 수 있지만, carrier가 CPU를 받는 순서는 커널이 정합니다 | 시선 바꾸기 + 직접 눌러 보기 | “작업을 바꾸는 것과 OS의 시분할은 같을까요?”의 답 앞 |
| V2 | 같은 100ms quota를 두 CPU에서 동시에 쓰면 실제 시간 50ms 만에 소진될 수 있습니다 | 조건 조절 실험 + 타임라인 | “period 중간에 throttle이 생기는 경우”의 예 앞 |
| V3 | OS 스레드의 정책을 바꾸면 그 스레드가 관리되는 클래스 큐가 바뀌고, VT는 그 큐에 별도로 들어가지 않습니다 | 정책 선택 + 이동 애니메이션 | “같은 job이 여러 클래스 큐에 동시에 들어갈까요?”의 답 앞 |
| V4 | JVM의 VT 선택, Linux의 carrier 선택, cgroup quota 계산은 서로 다른 층에 놓입니다 | 정적 요약 도식 | 마지막 VT 설명 뒤, 참고 자료 앞 |

## V1 두 스케줄러의 시선 바꾸기

- **독자 조작:** `JVM이 보는 작업`과 `커널이 보는 스레드`를 전환합니다. `VT A가 I/O 대기`를 누르면 A가 carrier에서 내려오고 B가 같은 carrier로 이동합니다. 커널 시선에서는 B를 실행하는 carrier OS 스레드가 CPU의 실행 후보가 되는 모습을 봅니다.
- **보일 변화:** 같은 그림의 VT 노드만 carrier 사이로 옮겨집니다. 관점을 바꾸어도 CPU가 직접 VT를 고르는 화살표는 생기지 않습니다.
- **배치:** VT A·B와 carrier 1·2, CPU 한 개만 그립니다. 본문의 Q3, Q4, Q8, Q9에서 설명한 두 결정 주체를 한 장면에서 가리킵니다. 색만으로 주체를 구별하지 않고 `Java 런타임`, `Linux 커널` 라벨을 둡니다.
- **모형의 한계:** 지원되는 대기 지점에서 VT가 내려오는 경우를 보여줍니다. 모든 I/O가 반드시 unmount되는 것처럼 표현하지 않습니다. syscall 자체와 carrier pinning 경로는 생략했다고 안내합니다.
- **움직임:** 노드 이동은 명세의 `옮겨졌다` 어휘를 사용합니다. PeekCart의 [`PeelDependencyGraph`](../src/components/blog/PeelDependencyGraph.astro)가 한 그래프를 두 시선으로 보여주는 조작을 참고하되 도메인 노드나 문구를 재사용하지 않습니다.

## V2 공유 quota 소모 실험

- **독자 조작:** `실행 CPU 1개`와 `동시에 실행하는 CPU 2개`를 고른 뒤, “100ms가 지나기 전에 멈출까?”를 예상하고 재생합니다. 기준은 `cpu.max = 100000 100000`, 즉 실제 시간 100ms마다 그룹 합산 CPU 시간 최대 100ms입니다.
- **보일 변화:** CPU 한 개에서는 100ms가 지나며 예산이 소모됩니다. CPU 두 개에서는 각 CPU가 50ms씩 실행한 시점에 전역 잔액이 0이 되고, 남은 period 동안 실행 가능한 FAIR 작업이 제한됩니다. 실제 시간 눈금과 합산 CPU 시간 눈금을 별도로 보여줍니다.
- **설명 범위:** 전역 quota의 공유만 움직여 보여줍니다. CPU별 5ms slice는 바로 뒤의 본문 도식과 설명에서 다룹니다. slice를 CPU나 스레드의 개인 예산처럼 표시하지 않습니다.
- **모형의 한계:** 이는 경쟁 작업과 이전 period의 잔여 slice를 생략한 교육용 계산입니다. 실제 throttling 경계나 벤치마크 결과가 아닙니다. `cpu.max`는 일반적인 FAIR 클래스 작업에 적용되며, 문서에 적힌 BPF 스케줄러 예외도 본문 설명과 맞춥니다.
- **움직임:** 잔액 변화는 명세의 `수치가 바뀌었다` 어휘를 씁니다. quota가 0이 된 상태는 새 의미이므로 구현 시 `animation-standards.md` 모션 어휘와 장면 키트를 함께 확장한 뒤 사용합니다. 기준 숫자와 상태를 한 화면에 남겨 값의 출처를 계속 볼 수 있게 합니다. 이전 글의 [`TransactionMotion`](../src/components/blog/TransactionMotion.astro)과 [`IndexLookupDemo`](../src/components/blog/IndexLookupDemo.astro)는 한 조건을 바꾼 뒤 결과를 유지해 보여주는 방식의 참고입니다.

## V3 정책과 실행 대기열

- **독자 조작:** `SCHED_OTHER`, `SCHED_FIFO`, `SCHED_DEADLINE` 중 하나를 선택합니다. OS 스레드 T 하나가 `cfs_rq`, `rt_rq`, `dl_rq` 가운데 해당 큐로 이동합니다. T 위에서 실행 중인 VT A는 커널 큐의 별도 카드가 되지 않습니다.
- **보일 변화:** 정책 선택이 바뀌면 **같은 T가 한 큐에서 다른 큐로 옮겨집니다**. 큐 사이의 `DL → RT → FAIR` 선택 순서와 큐 안에서 고르는 규칙은 별도 라벨로 남깁니다. EEVDF는 FAIR 안에서만 표시합니다.
- **모형의 한계:** 정책 변경은 개념 실험입니다. 실제 RT·DL 설정에는 권한·매개변수·허용 조건이 필요합니다. Linux의 다른 스케줄링 클래스와 cgroup 계층 큐는 생략했다고 안내합니다. 이 장면을 `cpu.max`가 RT·DL에도 적용된다는 그림으로 읽히지 않게 합니다.
- **움직임:** `옮겨졌다` 어휘를 사용합니다. 큐를 새로 그려 바꿔치기하지 않습니다. 시각 조작과 설명을 동기화하는 방식은 [`PeelMigrationSteps`](../src/components/blog/PeelMigrationSteps.astro)와 [`PeelSequenceDiagram`](../src/components/blog/PeelSequenceDiagram.astro)을 참고합니다.

## V4 전체 실행 경로 도식

```text
프로세스의 자원 경계: Java 런타임의 VT A, VT B → carrier OS 스레드 T
Linux 커널: T의 정책 → 해당 CPU의 rq → CPU 실행
cgroup CPU 제어: FAIR T의 실행 시간을 전역 quota / CPU별 slice에 반영
```

문장으로 떨어져 있던 세 결정을 한눈에 연결하는 **정적 도식**입니다. syscall 화살표는 `같은 T에서 커널 코드 실행 → 같은 T로 복귀 가능`이라고 표시해 스레드 전환과 분리합니다. VT가 커널 `rq`에 직접 들어가는 선은 그리지 않습니다. 본문 마지막 문단 뒤에 두어 새 사실을 추가하지 않고 이미 읽은 경로를 확인하게 합니다. 실제 도식을 만들 때는 `V1`과 같은 노드 색을 사용합니다.

## 구현할 때 따를 기준

- [`developer-blog-writer`의 시각자료 기획](../.agents/skills/developer-blog-writer/references/visuals.md), [`blog-interactive-demo` 스킬](../.agents/skills/blog-interactive-demo/SKILL.md), [`애니메이션 기준`](animation-standards.md)을 따릅니다.
- 동적 장면은 `src/scripts/blog/scene/`과 `src/styles/scene.css`로 만들고, 그때만 글을 MDX로 전환합니다. 넓은 장면은 `viewBox` 폭 560, 좁은 장면은 360 안팎의 별도 좌표를 씁니다. 패널을 바꿔 끼우지 않고 같은 숫자 상태를 보간합니다.
- 본문 설명과 텍스트 도식은 시각자료 없이도 읽히게 둡니다. 구현 뒤에는 중복되는 텍스트 도식을 정리할 수 있지만, Q1~Q35에서 다룬 기술 설명과 제한 조건은 유지합니다.
- 구현 단계에서는 `/preview/process-os-threads-virtual-threads-cgroup-cpu/`와 `/dev/scene-kit/`에서 모든 조작, 되돌리기, 좁은 폭, 라이트·다크 모드, 움직임 줄이기를 확인하고 빌드를 실행합니다.

## 기술 근거

- [Oracle Virtual Threads](https://docs.oracle.com/en/java/javase/26/core/virtual-threads.html): VT와 carrier의 스케줄링 주체, 대기 중 unmount.
- [OpenJDK JEP 444](https://openjdk.org/jeps/444): VT의 M:N 배치와 강제 시분할 범위.
- [Linux cgroup v2 CPU 인터페이스](https://docs.kernel.org/admin-guide/cgroup-v2.html#cpu-interface-files): `cpu.max`의 단위·형식·적용 범위.
- [Linux CFS bandwidth control](https://docs.kernel.org/scheduler/sched-bwc.html): 전역 quota와 CPU별 slice, throttling, 잔여 slice.
- [Linux `sched(7)`](https://man7.org/linux/man-pages/man7/sched.7.html): 스레드별 DL·RT·FAIR 정책과 클래스 순서.
