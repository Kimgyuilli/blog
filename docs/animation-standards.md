# 글 속 애니메이션 기준

글 속 장면은 **글이 주장하는 변화를 독자가 직접 보게** 만드는 도구입니다. 패널을 바꿔 끼우는 대신, 같은 그림이 이어서 움직여 "무엇이 어떻게 바뀌었는지"를 보여줍니다. 이 문서는 그 품질의 기준이고, 구현은 장면 키트(`src/scripts/blog/scene/`, `src/styles/scene.css`)가 맡습니다.

- 부품을 직접 보고 고르기: 개발 서버의 **`/dev/scene-kit/`**
- draft 글 미리 보기: 개발 서버의 **`/preview/<slug>/`**
- 첫 적용 사례: `PeelDependencyGraph`, `PeelMigrationSteps`, `PeelSequenceDiagram`
- 실어 나르기·예산 게이지 사례: `ThreadSchedulerLens`, `CpuQuotaExperiment`, `RunqueuePolicyMotion`, `ExecutionLayersDiagram`
- 패킷·렌즈·칩 이동 사례: `SharedBootOrder`, `FkGuardDemo`, `DbSeparationSteps`, `RetentionBoundary`
- 순서 퍼즐·벽·유령 벽 사례: `GatewayRolloutDemo`, `GatewayKeyOwnership`, `RefreshFamilyDemo`, `PolicyEnforcementDemo`
- 실행 위치·값 복사·모드 배지 사례: `LdeSyscallTrap`, `LdeFirstRun`, `LdeTimerInterrupt`, `LdeTwoSaves`, `LdeEspOffset`, `LdeSwtchReturn`

## 1. 먼저 정할 것: 독자가 장면에서 알아낼 변화

장면을 그리기 전에 독자가 *무엇을 예상하고, 조작 뒤 무엇을 보게 되는지* 한 문장으로 씁니다. 한 번의 조작은 구별할 변화 하나를 보여주고, 타임라인의 여러 변화는 하나의 인과 흐름을 이뤄야 합니다. 어느 쪽도 설명할 수 없다면 장면을 다시 설계하거나 생략합니다.

> "import 화살표만 믿고 Product를 떼면, 숨어 있던 호출이 끊어지며 부팅이 실패한다."

설명문을 가리고 조작 전후의 그림만 보아도 **무엇이 바뀌고 무엇이 그대로인지** 읽혀야 합니다. 관계가 중요한 대상은 같은 장면에 남깁니다. 예를 들어 VT가 carrier에 실린 관계를 설명한다면 carrier가 옮겨질 때 VT도 함께 옮겨져야 합니다. 수치가 핵심이라면 출처·단위·소진이나 갱신 시점이 보여야 합니다. 이 검토는 설명문을 없애자는 뜻이 아니라, 그림 자체가 맡은 설명을 확인하는 방법입니다.

그다음 독자가 **무엇을 직접 해 볼지** 정합니다.

| 형태 | 언제 | 예 |
| --- | --- | --- |
| 직접 해 보기 (칩·버튼) | 독자가 예측하고 틀려 볼 수 있을 때. 가장 강합니다 | 계획대로 떼어내 보기 → 부팅 실패 |
| 조건을 바꾸고 다시 보내기 | 같은 요청이 조건(설정·규칙)에 따라 다른 결과를 낼 때 | FK를 걷어 낸 뒤 같은 세 요청 다시 보내기 |
| 값 직접 움직이기 (슬라이더) | 경계가 연속값에 달려 있을 때. 끌자마자 결과가 따라와야 합니다 | 시계 오차를 0→5분으로 끌기 |
| 시선 바꾸기 (렌즈 토글) | 같은 대상을 두 기준으로 볼 때 | import 화살표 ↔ 실행 시점 호출 |
| 타임라인 | 순서 자체가 내용일 때 | 호출을 하나씩 끊는 다섯 단계 |

### 살아 있는 장면

정지한 도식보다 **실제로 무언가가 지나가는 장면**이 더 많이 설명합니다. 요청·이벤트·마이그레이션이 많다면 패킷으로 흘려 보내고, 지표(카운터·Ready 수·게이지)가 패킷의 도착과 함께 바뀌게 합니다. 독자는 "몇 개가 어디서 막혔는지"를 숫자 대신 움직임으로 셉니다.

- 같은 사건을 두 곳에서 보여줄 때(흐름 + 카운터, 큰 축 + 확대 렌즈)는 둘이 **같은 순간에** 바뀌어야 합니다.
- 작은 차이(9일 축 위의 5분)가 핵심이면 축을 늘리지 말고 렌즈로 확대합니다. 렌즈 테두리가 큰 축의 어느 구간인지 이어 줍니다.
- 여러 대상이 한꺼번에 옮겨질 때는 주인별로 조금씩 늦게 출발시켜(stagger) 물결처럼 보이게 하고, 노드가 다른 대상 위를 가로지르지 않는 배치를 고릅니다. 가로지를 수밖에 없으면 그 자리에서 흐려졌다 나타나게 합니다.
- 처음 화면에 들어올 때 한 번 저절로 보여주되, 자동 재생이 일어나지 않아도(탭이 숨겨진 상태 등) 완성된 정지 화면이 의미를 가져야 합니다.

## 2. 모션 어휘: 의미 하나에 움직임 하나

같은 의미에는 글이 달라도 같은 움직임을 씁니다. 독자는 한 번 배운 움직임을 다음 글에서도 바로 읽습니다.

| 의미 | 움직임 | 키트 | 시간 |
| --- | --- | --- | --- |
| 방향이 반대다 | 화살촉이 선을 따라 미끄러지며 180° 돌고, 색이 의존→위험으로 섞임 | `createFlipLink` `flip` | `flip` |
| 끊어졌다 / 실패했다 | 선 가운데가 벌어지고 ✕, 대상 노드가 빨개지며 흔들림 | `brk` + `is-error` `is-shaking`, `ease.overshoot` | `snap` |
| 끊어 냈다 (의도한 제거) | 라벨에 취소선을 먼저 긋고, 그다음 선이 출발점으로 거둬짐 | `createCallLine` `strike` → `show` | `cut` → `draw` |
| 새 흐름이 생겼다 | 점선 곡선이 출발점에서 그려지고, 절반이 넘으면 라벨이 나타남. 점이 흐르는 방향 = 데이터 방향 | `createCurve` | `draw` |
| 옮겨졌다 | 떠올라 호를 그리며 날아가 착지 링. 남은 것은 짧게 자리를 메움. 두 대상이 자리를 맞바꾸면 서로 반대쪽으로 휘어 비켜 감 | HTML: `createFlipMover` · SVG: `bowAt` + `hopLift` + `nextHop`, `landRing` | `fly` / `reflow` |
| 실려 함께 움직인다 | 실린 것은 싣고 있는 카드의 자리(seat)에 앉아, 카드가 옮겨지면 같이 옮겨짐 (OS 스레드 위의 VT) | `createTray` `seat()` | `fly` |
| 예산이 줄고 다시 찬다 | 게이지가 줄고, 0이 되면 테두리가 임시 색 점선. 기간이 바뀌면 다시 차며 숫자가 튀어 오름 | `createGauge` + `bumpText` | `draw` / 선형 |
| 경계가 바뀌었다 | 점선 경계 상자가 줄어들거나 흐려짐, 캡션이 따라 바뀜 | `createBoundary` | `draw` |
| 완료 / 성공 | 초록 테두리 + 살짝 커졌다 돌아옴 | `is-done`, `is-ok` | — |
| 임시 상태 | 보조 문구가 주황 | `is-temp` | — |
| 수치가 바뀌었다 | 숫자가 튀어 오름 | `bumpText` | — |
| 결과를 확인한다 | 로그 한 줄을 대기(…)로 찍고 잠시 뒤 ✓/✕로 바꿈 | `createConsole` | `beat` |
| 요청·이벤트가 지나간다 | 알약 패킷이 길을 따라 이동하고, 도착하면 한 번 빛남. 많으면 간격을 두고 연달아 흘림 | `createPacketLayer` `spawn` `travel` `land` | `draw` 안팎 |
| 막혔다 (거절) | 패킷이 관문까지 가서 찌그러지며 튕겨 나오고 위험 색으로 바뀜. 관문 쪽 판정 문구가 뜸 | `bounce` | 420 + 300 |
| 여기서 막는다 (정책·제약 관문) | 위험 색 굵은 점선 벽이 위에서 아래로 세워짐. 막히는 패킷은 벽 앞에서 튕겨 나옴 | `createWall` + `bounce` | `draw` |
| 규칙은 있지만 강제되지 않는다 | 같은 벽이 흐린 점선(유령)으로 바뀌고 캡션이 주황. 패킷이 그대로 지나가며 벽이 한 번 일렁임 | `createWall` `ghost` + `pierce()` | `draw` / 520 |
| 관문에서 다른 것으로 바뀌었다 | 패킷이 관문에서 멈칫하며 이름과 색이 바뀐 뒤 계속 감 (DELETE → UPDATE) | `relabel` | `beat` |
| 기다린다 (선행 조건) | 노드 테두리가 임시 색 점선으로 행진, 보조 문구 주황 | `is-waiting` | 반복 |
| 하나가 여럿으로 갈라졌다 | 겹쳐 있던 상자·칩 사본이 각자 자리로 갈라져 나감 | 같은 자리에 겹친 사본 + 상태 보간 | `draw` / `fly` |
| 작은 차이를 확대해 본다 | 큰 축의 좁은 구간을 테두리로 집고, 점선 날개로 이어진 아래 패널이 펼쳐짐 | `createLens` | `draw` |
| 지금 실행하는 위치 (PC) | 코드 목록의 줄 위에 청록 실행 띠가 놓이고, 실행 주체(CPU)에서 점선 끈이 이어짐. 다른 코드 영역으로 넘어가면 띠가 호를 그리며 옮겨짐 | `createCodeList` + `createExecMarker`, `bowAt` + `hopLift` | `move` / `fly` |
| 값을 복사했다 (원본은 남는다) | 원본 칩은 제자리에 남고, 점선 테두리 사본이 날아가 도착 칸을 채움 + 착지 링. 빈 칸은 `is-empty` | `createChip` 사본 + `is-copy`, `setLabel` | `fly` |
| 모드·상태 값이 바뀌었다 | 배지 값이 튀어 오르고 색 점이 값의 주인 색으로 바뀜 | `createBadge` | — |
| 기준점이 옮겨졌다 (포인터) | 가리키는 표시(esp)만 움직이고 칸의 주소·내용은 그대로. 오프셋 괄호(+4)가 기준점을 따라감 | `scene-pointer-*`, `scene-brace`, `scene-mem-*` | `move` |
| 시간에 따라 무엇을 실행했나 | 코드 영역별 줄(lane)에 실행 구간 막대가 자라고, 실행 띠가 줄 사이를 옮겨 다님 | `scene-lane-track`, `scene-lane-bar` | 선형 |
| 값을 직접 움직인다 | 슬라이더를 끄는 동안 장면이 보간 없이 바로 따라오고, 값 숫자가 튀어 오름 | `.scene-range` + `scene.set` | 즉시 |
| 다음에 누를 것 | 칩에 은은한 맥박 | `data-state="next"` | — |

새 의미가 필요하면 먼저 이 표에 한 줄을 추가하고, 그다음 키트에 부품을 만듭니다.

## 3. 움직임의 문법

- **상태를 숫자로 둡니다.** 장면 전체(좌표, `show`, `flip`, `brk`, 경계 사각형)를 하나의 객체로 두고 `createScene().go(next)`로 보간합니다. 패널을 `hidden`으로 바꿔 끼우지 않습니다. 그래야 어느 단계에서 어느 단계로 가도, 도중에 끊겨도 자연스럽게 이어집니다.
- **빼는 것 먼저, 더하는 것 나중.** 한 번에 여러 가지가 바뀌면 2단계로 나눕니다. ① 사라질 것에 취소선을 긋고 걷어내기(`cut`) ② 새 흐름을 그리고 배치를 옮기기(`draw`).
- **원인 → 결과 순서.** 실패 장면은 "이동 → 컴파일 ✓ → 숨은 연결이 드러남 → 끊김 + 흔들림 → 로그"처럼 한 박자씩 보여줍니다. 사이에 `duration.beat`만큼 쉽니다.
- **결과를 읽을 시간을 줍니다.** 실패를 보여준 뒤 되돌릴 때는 `duration.read` 이상 기다립니다.
- **연속 동작은 끊길 수 있어야 합니다.** `const alive = scene.begin()`으로 시작하고, 모든 `await` 뒤에 `if (!alive()) return;`을 씁니다.
- **이징:** 대부분 `ease.standard`. 힘이 실린 순간(끊김, 튕김)에만 `ease.overshoot`를 씁니다.
- **반복 애니메이션은 의미가 있을 때만.** 흐르는 점선(데이터 방향), 다음 칩의 맥박 정도만 반복합니다.

## 4. 색과 글자

- 색은 의미 토큰으로만 고릅니다: `--scene-dep`(의존·중립), `--scene-danger`(끊어야 할 연결·실패), `--scene-flow`(새 흐름·성공), `--scene-temp`(임시·계획과 다름).
- 노드 구분 색은 `--scene-hue-*`에서 고르고, 같은 대상은 글의 모든 장면에서 같은 색을 씁니다.
- 색만으로 구분하지 않습니다. 실선/점선, ✓/✕, 취소선, 라벨을 함께 씁니다.
- 라이트·다크 모드 값은 `scene.css`에 함께 정의합니다. 새 토큰을 추가하면 `html.dark` 값도 같이 넣습니다.

## 5. 크기와 배치

- **넓은 배치는 `viewBox` 폭 560**으로 그립니다. 본문 안의 데모 폭이 약 530~580px이라 거의 1:1로 보이고, 노드 이름 14px · 라벨 11px이 그대로 읽힙니다. 720처럼 넓게 그리면 글자가 ¾로 줄어듭니다.
- **좁은 배치(데모 폭 < 560px)는 좌표를 따로** 둡니다(보통 세로로 쌓은 360 폭). `watchNarrow`가 바꿔 줍니다. 넓은 그림을 그냥 줄이지 않습니다.
- 선은 다른 노드를 지나가지 않게 둡니다. 노드가 움직이는 장면은 **움직인 뒤의 위치**에서도 선과 라벨이 겹치지 않는지 확인합니다.
- 노드 보조 문구는 짧게 씁니다(대략 10자). 상태가 바뀔 때만 보조 문구를 넣고, 평소에는 비워 둡니다.
- 한글 문장이 들어가는 SVG 라벨은 `scene-label is-sans`를 씁니다. 고정폭 글꼴은 한글 자간을 벌립니다. 테이블 이름·코드·버전 같은 값만 고정폭으로 둡니다.

## 6. 접근성과 정직함

- `prefers-reduced-motion`이면 움직임 없이 **완성된 상태**를 보여줍니다. 키트의 `createScene`, `createStepPlayer`, `createFlipMover`가 처리하고, CSS 반복 애니메이션도 멈춥니다.
- 자동 재생은 화면에 보일 때만 하고, 독자가 단계를 누르면 멈춥니다(`createStepPlayer`).
- SVG에는 `role="img"`와 장면 전체를 설명하는 `aria-label`을 둡니다. 로그와 설명 상자는 `aria-live` / `role="status"`를 씁니다.
- 모형은 모형이라고 적습니다. 그리지 않은 것(이벤트 지연, 공유 DB 등)과 예시로 만든 메시지는 `db-demo-disclaimer`에 밝힙니다. 글에 없는 사실을 장면이 만들어 내지 않습니다.

## 7. 완성 체크리스트

장면을 만들었다면 **브라우저에서** 아래를 확인합니다. 코드만 보고 끝내지 않습니다.

- [ ] 1절의 변화 또는 인과 흐름이 장면만 봐도 보인다
- [ ] 초기·결정적 전환·결과 상태에서 설명문을 가려도 조작의 원인, 바뀐 대상, 그대로인 관계를 읽을 수 있다
- [ ] 선택지를 바꾸면 의미 있는 결과 차이가 보이고, 타임라인에서는 같은 대상의 상태가 앞뒤 단계로 이어진다
- [ ] 장면의 수치·상태·생략한 경로가 본문과 근거 자료의 설명 범위를 넘지 않는다
- [ ] 모든 단계·버튼을 눌러 봤고, 단계를 거꾸로·건너뛰어 눌러도 자연스럽다
- [ ] 동작 도중에 다른 버튼을 눌러도 장면이 꼬이지 않는다
- [ ] 본문 폭(약 560px)에서 글자가 읽히고, 선·라벨이 노드와 겹치지 않는다
- [ ] 좁은 화면(데모 폭 360px 안팎)에서 따로 배치되고 읽힌다
- [ ] 라이트·다크 모드 모두 확인했다
- [ ] 움직임 줄이기 설정에서 완성된 정지 화면이 보인다
- [ ] 한국어 조사·띄어쓰기, 모형의 한계 안내문을 확인했다

## 8. 파일 지도

| 파일 | 역할 |
| --- | --- |
| `src/scripts/blog/scene/core.ts` | `createScene`, 보간, 트윈, 모션 토큰(`duration`, `ease`), 기하, 호 이동(`bowAt`, `hopLift`, `nextHop`), `watchNarrow`, `bumpText` |
| `src/scripts/blog/scene/parts.ts` | `createNode`, `createTray`, `createGauge`, `landRing`, `createFlipLink`, `createCallLine`, `createCurve`, `createBoundary`, `createPill`, `createArrow`, `createChip`, `createLens`, `createWall`, `createCodeList`, `createExecMarker`, `createBadge` |
| `src/scripts/blog/scene/packets.ts` | `createPacketLayer` (지나가는 요청·이벤트), `polylineAt`, `arcPoints` |
| `src/scripts/blog/scene/flip.ts` | `createFlipMover` (HTML 요소 이동) |
| `src/scripts/blog/scene/console.ts` | `createConsole` (실행 로그) |
| `src/scripts/blog/scene/step-player.ts` | `createStepPlayer` (타임라인 재생) |
| `src/styles/scene.css` | 의미 색 토큰과 모든 `scene-*` 스타일 |
| `src/components/blog/SceneTimeline.astro`, `SceneLegend.astro` | 타임라인·범례 마크업 |
| `src/components/dev/SceneKitShowcase.astro` | `/dev/scene-kit/` 견본 |
