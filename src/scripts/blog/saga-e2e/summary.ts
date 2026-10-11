import { createScene, duration, ease, replayClass, setAttrs, svg, watchNarrow, type Point } from '../scene/core';
import { createNode, type NodeView } from '../scene/parts';
import { createPacketLayer } from '../scene/packets';

// 독자가 볼 변화: 결함을 넣은 대조군이 실패해도, 판정 규칙에 따라 그 실패가 결함을 잡은 증거가 되기도 하고
// 아무것도 확인하지 못한 "잘못된 통과"가 되기도 한다. 실패 지점이 맞아도 앞 단계가 일어나지 않았으면 부족하다.
type CaseId = 'product' | 'stale' | 'stock';
type Mark = 'pass' | 'fail' | 'skip' | 'timeout';
type Case = {
  defect: string;
  scenario: string;
  expected: number;
  /** 단계별 결과: 상품 생성 · 주문 · 예약 · 취소(또는 예약 대기). */
  marks: Mark[];
  subs: string[];
  /** 실제로 실패한 단계. */
  stop: number;
  /** 기대 지점 앞 단계(예약)가 실제로 일어났는가. */
  before: boolean;
  note: string;
};

const STAGES = ['상품 생성', '주문', '예약', '취소'];
const CASES: Record<CaseId, Case> = {
  product: {
    defect: 'product-service 를 먼저 정지',
    scenario: '시나리오 A',
    expected: 2,
    marks: ['fail', 'skip', 'skip', 'skip'],
    subs: ['연결 실패', '안 감', '안 감', ''],
    stop: 0,
    before: false,
    note: 'product 정지 대조군의 처음 구성입니다. product-service 를 멈춘 뒤 A 를 돌리면 첫 줄인 상품 생성 API 에서 바로 실패합니다. 대조군이 확인하려던 예약 단계에는 가지도 못했습니다.',
  },
  stale: {
    defect: '재고 100 · poller 락이 남은 채',
    scenario: '시나리오 B',
    expected: 3,
    marks: ['pass', 'pass', 'skip', 'timeout'],
    subs: ['통과', '통과', '안 일어남', '시간 초과'],
    stop: 3,
    before: false,
    note: '재고 충분 대조군이 poller 정지 대조군 뒤에 돈 경우입니다. 앞 대조군이 ShedLock 행을 지워 poller 가 멈춰 있어서 주문 이벤트가 나가지 않았습니다. 예약도 취소도 일어나지 않았는데, 취소 대기는 기대한 지점에서 시간 초과로 끝났습니다.',
  },
  stock: {
    defect: '재고 100',
    scenario: '시나리오 B',
    expected: 3,
    marks: ['pass', 'pass', 'pass', 'timeout'],
    subs: ['통과', '통과', '예약됨', '시간 초과'],
    stop: 3,
    before: true,
    note: '재고 충분 대조군이 정상 스택에서 돈 경우입니다. 재고가 충분해 예약이 성공했으므로 주문은 취소되지 않고, 취소 대기가 시간 초과로 끝납니다. B 의 단언이 "예약 실패"를 제대로 보고 있다는 증거입니다.',
  },
};

type Rule = { ok: boolean; right: boolean; text: string };
/** 세 판정 규칙의 결과. right 는 그 판정이 사실과 맞는지(잘못 통과·잘못 실패가 아닌지). */
function judge(c: Case): Rule[] {
  const at = c.stop === c.expected;
  const real = at && c.before;
  return [
    { ok: true, right: real, text: real ? 'OK · 결함을 잡음' : 'OK · 잘못 통과' },
    at
      ? { ok: true, right: real, text: real ? 'OK · 결함을 잡음' : 'OK · 잘못 통과 (지점은 맞음)' }
      : { ok: false, right: true, text: `FAIL · 기대는 ${STAGES[c.expected]}, 실제는 ${STAGES[c.stop]}` },
    real
      ? { ok: true, right: true, text: 'OK · 예약 확인 뒤 취소 대기 시간 초과' }
      : { ok: false, right: true, text: at ? 'FAIL · 예약이 일어나지 않음' : 'FAIL · 기대 지점에 가지 못함' },
  ];
}

export function initSagaSummary(demo: HTMLElement) {
  if (demo.dataset.ready) return;
  demo.dataset.ready = 'true';
  const stage = demo.querySelector<HTMLElement>('[data-stage]')!;
  const root = demo.querySelector<SVGSVGElement>('svg')!;
  const note = demo.querySelector<HTMLElement>('[data-note]')!;
  const rows = [...demo.querySelectorAll<HTMLElement>('[data-rule]')];
  const caseButtons = [...demo.querySelectorAll<HTMLButtonElement>('[data-case]')];
  let current: CaseId = 'product';
  let narrow = false;

  const defectText = svg('text', { class: 'saga-label sv-defect' }, root);
  const wires = [0, 1, 2].map(() => svg('path', { class: 'saga-wire' }, root));
  const ring = svg('rect', { class: 'sv-expect', rx: 14 }, root);
  const ringLabel = svg('text', { class: 'saga-caption sv-expect-label' }, root);
  ringLabel.textContent = '기대한 실패 지점';
  const nodes: NodeView[] = STAGES.map((label) => {
    const n = createNode(root, { label, hue: 'var(--scene-hue-blue)' });
    n.group.classList.add('is-sans-sub');
    return n;
  });
  const layer = createPacketLayer(root);

  const W = { w: 116, h: 54 };
  const points = (): Point[] => narrow
    ? [{ x: 90, y: 92 }, { x: 270, y: 92 }, { x: 270, y: 210 }, { x: 90, y: 210 }]
    : [{ x: 74, y: 104 }, { x: 211, y: 104 }, { x: 348, y: 104 }, { x: 486, y: 104 }];

  const scene = createScene({ ring: 1 }, (s) => {
    const pts = points();
    setAttrs(root, { viewBox: narrow ? '0 0 360 262' : '0 0 560 156' });
    setAttrs(defectText, { x: narrow ? 180 : 280, y: 22 });
    nodes.forEach((n, i) => n.setBox({ ...pts[i], ...W }));
    wires.forEach((wire, i) => {
      const a = pts[i];
      const b = pts[i + 1];
      const horizontal = a.y === b.y;
      const dir = horizontal ? Math.sign(b.x - a.x) : Math.sign(b.y - a.y);
      const from = horizontal ? { x: a.x + dir * (W.w / 2 + 4), y: a.y } : { x: a.x, y: a.y + dir * (W.h / 2 + 4) };
      const to = horizontal ? { x: b.x - dir * (W.w / 2 + 4), y: b.y } : { x: b.x, y: b.y - dir * (W.h / 2 + 4) };
      setAttrs(wire, { d: `M ${from.x} ${from.y} L ${to.x} ${to.y}` });
    });
    const e = pts[CASES[current].expected];
    const pad = 9;
    setAttrs(ring, { x: e.x - W.w / 2 - pad, y: e.y - W.h / 2 - pad, width: W.w + pad * 2, height: W.h + pad * 2 });
    ring.style.opacity = String(s.ring);
    setAttrs(ringLabel, { x: e.x, y: e.y + W.h / 2 + pad + 14 });
    ringLabel.style.opacity = String(s.ring);
  });

  const setNode = (i: number, mark: Mark | 'idle', sub: string) => {
    const n = nodes[i];
    n.setSub(sub);
    n.group.classList.toggle('is-done', mark === 'pass');
    n.group.classList.toggle('is-error', mark === 'fail');
    n.group.classList.toggle('is-temp', mark === 'timeout');
    n.group.classList.toggle('is-waiting', false);
    n.group.style.opacity = mark === 'skip' ? '0.5' : '1';
  };
  const showRules = (c: Case, upto: number) => {
    const res = judge(c);
    rows.forEach((row, i) => {
      const out = row.querySelector<HTMLElement>('[data-out]')!;
      if (i >= upto) {
        out.textContent = '판정 전';
        row.dataset.tone = '';
        return;
      }
      out.textContent = res[i].text;
      row.dataset.tone = res[i].right ? 'flow' : 'danger';
    });
  };
  const paintFinal = (c: Case) => {
    c.marks.forEach((m, i) => setNode(i, m, c.subs[i]));
    showRules(c, 3);
  };

  async function run(instant = false) {
    const alive = scene.begin();
    layer.clear();
    const c = CASES[current];
    caseButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.case === current)));
    defectText.textContent = `넣은 결함: ${c.defect}`;
    note.textContent = c.note;
    replayClass(note, 'is-entering');
    scene.redraw();
    if (instant || scene.reduced) { paintFinal(c); return; }
    nodes.forEach((_, i) => setNode(i, 'idle', ''));
    showRules(c, 0);
    const pts = points();
    const p = layer.spawn({ label: c.scenario, tone: 'dep', at: { x: pts[0].x, y: pts[0].y - W.h / 2 - 14 } });
    for (let i = 0; i < STAGES.length; i++) {
      const mark = c.marks[i];
      const above = { x: pts[i].x, y: pts[i].y - W.h / 2 - 14 };
      if (!(await p.travel([above], i === 0 ? 300 : 620, ease.standard)) || !alive()) return;
      if (mark === 'skip') {
        setNode(i, 'skip', c.subs[i]);
        if (i > c.stop) continue;
        await scene.pause(duration.beat);
        if (!alive()) return;
        continue;
      }
      if (mark === 'timeout') {
        nodes[i].setSub('대기 중');
        nodes[i].group.classList.add('is-waiting');
        await scene.pause(duration.read / 2);
        if (!alive()) return;
        setNode(i, 'timeout', c.subs[i]);
        p.relabel('시간 초과', 'temp');
        break;
      }
      setNode(i, mark, c.subs[i]);
      if (mark === 'fail') {
        nodes[i].flash('is-shaking');
        p.relabel('실패', 'danger');
        for (let k = i + 1; k < STAGES.length; k++) setNode(k, 'skip', c.subs[k]);
        break;
      }
      nodes[i].flash('is-ok');
      await scene.pause(160);
      if (!alive()) return;
    }
    for (let r = 1; r <= 3; r++) {
      await scene.pause(duration.beat * 1.4);
      if (!alive()) return;
      showRules(c, r);
      replayClass(rows[r - 1], 'is-entering');
    }
  }

  caseButtons.forEach((b) => b.addEventListener('click', () => { current = b.dataset.case as CaseId; void run(); }));
  demo.querySelector('[data-replay]')!.addEventListener('click', () => void run());
  // 폭이 바뀌면 좌표가 달라지므로 진행 중인 재생을 멈추고 결과 화면을 바로 그립니다.
  watchNarrow(stage, (n) => { narrow = n; void run(true); });
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { observer.disconnect(); void run(); }
  }, { threshold: 0.4 });
  observer.observe(demo);
}
