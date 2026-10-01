# 글 속 데모 공통 부품

각 글의 설명과 애니메이션 장면은 해당 글의 컴포넌트에 둡니다. 여러 글에서 반복되는 화면 틀과 재생 조건만 이곳에서 공유합니다.

| 부품 | 용도 | 현재 사용처 |
| --- | --- | --- |
| `InteractiveDemoFrame.astro` | 제목·설명·콘텐츠 영역 | 정규화, JOIN, 인덱스 데모 |
| `DemoControls.astro` | 데모 바로 위의 선택 버튼 묶음 | 정규화, JOIN, 인덱스 데모 |
| `AutoMotionFigure.astro` | 제목·장면·캡션이 있는 반복 애니메이션 | 관계도, 트랜잭션 그림 |
| `watchDemoPlayback()` | 화면 노출, 탭 활성 상태, 움직임 줄이기 설정에 따른 재생 여부 | CSS 애니메이션, Motion JOIN, 인덱스 데모 |
| 장면 키트 (`scripts/blog/scene/`, `styles/scene.css`) | 상태 보간 장면, 노드·연결·호출선·흐름 곡선, FLIP 이동, 실행 로그, 타임라인 재생 | PeekCart 분리 그림 |
| `SceneTimeline.astro`, `SceneLegend.astro` | 장면 키트의 타임라인·범례 마크업 | PeekCart 분리 그림 |

새 인터랙티브 데모는 `InteractiveDemoFrame`에 고유한 `demoId`, 접근성 이름, 제목과 설명을 전달하고 본문에 장면을 넣습니다. 버튼이 필요하면 `DemoControls`에 접근성 이름과 버튼들을 넣습니다. 장면의 상태 전환은 해당 데모가 맡습니다.

자동 애니메이션은 CSS 장면이라면 `AutoMotionFigure`를 사용합니다. 장면별 클래스와 키프레임은 해당 장면의 스타일에서 정의하고, `.is-running`일 때 재생되게 만듭니다. Motion이나 타이머로 만든 장면은 `watchDemoPlayback()`의 `shouldPlay`에 따라 재생·일시정지하고, `reducedMotion`일 때 의미가 전달되는 정지 화면을 보여줍니다.

움직이는 그림(SVG 장면, 단계 전환, 직접 해 보는 실험)은 장면 키트로 만듭니다. 기준과 모션 어휘는 [`docs/animation-standards.md`](../../../docs/animation-standards.md)에 있고, 부품은 개발 서버의 `/dev/scene-kit/`에서 직접 재생해 볼 수 있습니다.
