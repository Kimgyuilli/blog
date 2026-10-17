/**
 * CI 잡 막대(Gantt) 장면의 공통 부분. TwoRunsGantt 와 CriticalPathSteps 가 같은 레인 배치와 색을 씁니다.
 * 시각은 모두 각 CI 실행의 시작 기준 초입니다. 값의 출처는 각 컴포넌트의 안내문에 적습니다.
 */
import { clamp01, setAttrs, svg } from '@/scripts/blog/scene/core';

export type Lane = 'test' | 'gate' | 'lint' | 'images' | 'e2e';
export const LANES: Lane[] = ['test', 'gate', 'lint', 'images', 'e2e'];
export const HUES: Record<Lane, string> = {
  test: 'var(--scene-hue-amber)',
  gate: 'var(--scene-hue-violet)',
  lint: 'var(--scene-hue-gray)',
  images: 'var(--scene-hue-blue)',
  e2e: 'var(--scene-hue-cyan)',
};

/** 막대 하나. show 가 0이면 그리지 않습니다(값이 없거나 그 실행에 없는 잡). */
export type Bar = { s: number; e: number; show: number };
export const bar = (s: number, e: number): Bar => ({ s, e, show: 1 });
export const none = (at = 0): Bar => ({ s: at, e: at, show: 0 });

export type GanttState = {
  bars: Record<Lane, Bar>;
  /** test 레인 안의 두 번째 막대(주문 서비스 샤드). */
  order: Bar;
  /** e2e 레인 안의 두 번째 막대(시나리오 잡). */
  scen: Bar;
  /** 레인별 강조. 1이면 임계경로, 0이면 흐리게. */
  crit: Record<Lane, number>;
  /** 값이 없는 레인에 "미측정" 을 보일지. */
  unknown: Record<Lane, number>;
  total: number;
  /** needs 간선 두 개: gate 에서 images 로, e2e 에서 gate 로. 0~1 은 그려진 정도. */
  edgeGI: number;
  edgeEG: number;
  /** 여유 표시: 어느 레인 끝에서 전체 종료선까지. */
  slackLane: number; // LANES 인덱스, 표시하지 않으면 show 0
  slackShow: number;
  /** 여유 값(초). 마지막 잡 종료 기준이라 전체 종료선(실행 생성부터 갱신까지)과 1~2초 다를 수 있습니다. */
  slackSec: number;
};

export type GanttLayout = {
  view: [number, number];
  labelX: number;
  x0: number;
  x1: number;
  top: number;
  rowH: number;
  barH: number;
  axisMax: number;
  ticks: number[];
  short: boolean;
};

const LABELS: Record<Lane, [string, string]> = {
  test: ['테스트 (가장 긴 샤드)', '테스트'],
  gate: ['gate', 'gate'],
  lint: ['lint', 'lint'],
  images: ['이미지 빌드', '이미지'],
  e2e: ['e2e', 'e2e'],
};

export const mmss = (sec: number) => {
  const r = Math.round(sec);
  const m = Math.floor(r / 60);
  const s = r % 60;
  return m ? `${m}분 ${String(s).padStart(2, '0')}초` : `${s}초`;
};

export function createGantt(root: SVGSVGElement, { laneNames }: { laneNames?: Partial<Record<Lane, [string, string]>> } = {}) {
  const names = { ...LABELS, ...laneNames };
  const grid = svg('g', {}, root);
  const tickEls = Array.from({ length: 8 }, () => ({
    line: svg('line', { class: 'cp-grid' }, grid),
    text: svg('text', { class: 'scene-label scene-label-dep cp-tick' }, grid),
  }));
  const rows = LANES.map((lane) => {
    const label = svg('text', { class: 'scene-label is-sans cp-lane-label' }, root);
    const track = svg('rect', { class: 'scene-lane-track', rx: 4 }, root);
    const unknown = svg('text', { class: 'scene-label is-sans cp-unknown' }, root);
    unknown.textContent = '미측정';
    return { lane, label, track, unknown };
  });
  const edgeLayer = svg('g', {}, root);
  const edgeTG = svg('path', { class: 'cp-edge', pathLength: 1 }, edgeLayer);
  const edgeLI = svg('path', { class: 'cp-edge', pathLength: 1 }, edgeLayer);
  const edgeIE = svg('path', { class: 'cp-edge', pathLength: 1 }, edgeLayer);
  const edgeGI = svg('path', { class: 'cp-edge is-changing', pathLength: 1 }, edgeLayer);
  const edgeEG = svg('path', { class: 'cp-edge is-changing', pathLength: 1 }, edgeLayer);
  // 바뀌는 간선 두 개에는 무엇이 무엇을 기다리는지 글로 붙입니다(선이 짧아 전체 종료선과 겹치기 쉬움).
  const labelGI = svg('text', { class: 'scene-label is-sans cp-edge-text', 'text-anchor': 'end' }, edgeLayer);
  labelGI.textContent = 'images 가 gate 를 기다림';
  const labelEG = svg('text', { class: 'scene-label is-sans cp-edge-text', 'text-anchor': 'start' }, edgeLayer);
  labelEG.textContent = 'gate 가 e2e 를 기다림';
  const bars = LANES.map((lane) => {
    const el = svg('rect', { class: 'scene-lane-bar cp-bar', rx: 3 }, root);
    el.style.setProperty('--node-hue', HUES[lane]);
    const text = svg('text', { class: 'scene-label is-sans cp-bar-text' }, root);
    return { lane, el, text };
  });
  const order = svg('rect', { class: 'scene-lane-bar cp-bar cp-sub', rx: 3 }, root);
  order.style.setProperty('--node-hue', HUES.test);
  const orderText = svg('text', { class: 'scene-label is-sans cp-bar-text' }, root);
  const scen = svg('rect', { class: 'scene-lane-bar cp-bar cp-sub', rx: 3 }, root);
  scen.style.setProperty('--node-hue', HUES.e2e);
  const scenText = svg('text', { class: 'scene-label is-sans cp-bar-text' }, root);
  // 막대 글자는 보조 막대(주문 샤드, 시나리오)보다 위에 그립니다.
  bars.forEach(({ text }) => root.append(text));
  const slackLine = svg('line', { class: 'cp-slack' }, root);
  const slackText = svg('text', { class: 'scene-label is-sans cp-slack-text' }, root);
  const totalLine = svg('line', { class: 'cp-total' }, root);
  const totalText = svg('text', { class: 'scene-label is-sans cp-total-text' }, root);

  let layout: GanttLayout;
  const X = (sec: number) => layout.x0 + (sec / layout.axisMax) * (layout.x1 - layout.x0);
  const rowY = (i: number) => layout.top + i * layout.rowH;

  const elbow = (ax: number, ay: number, bx: number, by: number) => {
    const mx = Math.max(ax + 3, Math.min(bx - 3, ax + 6));
    return `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${mx.toFixed(1)} ${ay.toFixed(1)} L ${mx.toFixed(1)} ${by.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`;
  };
  const drawEdge = (el: SVGPathElement, from: Bar, fromRow: number, to: Bar, toRow: number, amount: number) => {
    const a = clamp01(amount * Math.min(from.show, to.show));
    const fromY = rowY(fromRow) + (fromRow < toRow ? layout.barH : 0);
    const toY = rowY(toRow) + layout.barH / 2;
    setAttrs(el, { d: elbow(X(from.e), fromY, X(to.s), toY), 'stroke-dasharray': `${a} 1`, opacity: a > 0.01 ? 1 : 0 });
  };

  const placeText = (text: SVGTextElement, b: Bar, y: number, label: string, forceInside = false, room = 46) => {
    const x0 = X(b.s);
    const x1 = X(b.e);
    const inside = forceInside || x1 - x0 > 84 || x1 + room > layout.x1;
    setAttrs(text, { x: inside ? x1 - 4 : x1 + 4, y: y + layout.barH / 2 + 3.6, 'text-anchor': inside ? 'end' : 'start', opacity: clamp01(b.show * 2 - 1) * (x1 - x0 > 26 || !inside ? 1 : 0) });
    text.textContent = label;
    text.classList.toggle('is-inside', inside);
  };

  return {
    setLayout(next: GanttLayout) {
      layout = next;
      setAttrs(root, { viewBox: `0 0 ${next.view[0]} ${next.view[1]}` });
      const bottom = rowY(LANES.length - 1) + layout.barH + 6;
      tickEls.forEach((t, i) => {
        const sec = next.ticks[i];
        const on = sec !== undefined;
        setAttrs(t.line, { x1: on ? X(sec) : 0, x2: on ? X(sec) : 0, y1: layout.top - 6, y2: bottom, opacity: on ? 1 : 0 });
        setAttrs(t.text, { x: on ? X(sec) : 0, y: bottom + 13, 'text-anchor': 'middle', opacity: on ? 1 : 0 });
        t.text.textContent = on ? `${Math.round(sec / 60)}분` : '';
      });
      rows.forEach((r, i) => {
        setAttrs(r.label, { x: next.labelX, y: rowY(i) + layout.barH / 2 + 4 });
        r.label.textContent = names[r.lane][next.short ? 1 : 0];
        setAttrs(r.track, { x: next.x0, y: rowY(i), width: next.x1 - next.x0, height: layout.barH });
        setAttrs(r.unknown, { x: next.x0 + 6, y: rowY(i) + layout.barH / 2 + 4 });
      });
    },
    draw(s: GanttState, opts: { barLabel: (lane: Lane, b: Bar) => string; orderLabel?: string; scenLabel?: string }) {
      LANES.forEach((lane, i) => {
        const b = s.bars[lane];
        const { el, text } = bars[i];
        const y = rowY(i);
        const c = clamp01(s.crit[lane]);
        setAttrs(el, { x: X(b.s), y, width: Math.max(0, X(b.e) - X(b.s)), height: layout.barH, opacity: b.show * (0.32 + 0.68 * c) });
        el.style.strokeWidth = String(1 + 1.6 * c);
        el.classList.toggle('is-crit', c > 0.5);
        placeText(text, b, y, opts.barLabel(lane, b), s.slackShow > 0.5 && Math.round(s.slackLane) === i);
        text.style.opacity = String(Number(text.getAttribute('opacity')) * (0.55 + 0.45 * c));
        setAttrs(rows[i].unknown, { opacity: clamp01(s.unknown[lane]) });
      });
      const ty = rowY(0);
      setAttrs(order, { x: X(s.order.s), y: ty + layout.barH * 0.5, width: Math.max(0, X(s.order.e) - X(s.order.s)), height: layout.barH * 0.5, opacity: s.order.show });
      setAttrs(orderText, { x: X(s.order.e) + 4, y: ty + layout.barH + 11, 'text-anchor': 'start', opacity: clamp01(s.order.show * 2 - 1) });
      orderText.textContent = opts.orderLabel ?? '';
      const ey = rowY(4);
      setAttrs(scen, { x: X(s.scen.s), y: ey - layout.barH * 0.42, width: Math.max(0, X(s.scen.e) - X(s.scen.s)), height: layout.barH * 0.36, opacity: s.scen.show * (0.32 + 0.68 * clamp01(s.crit.e2e)) });
      setAttrs(scenText, { x: X(s.scen.e) + 4, y: ey - layout.barH * 0.42 + 7, opacity: clamp01(s.scen.show * 2 - 1) * 0.85 });
      scenText.textContent = opts.scenLabel ?? '';

      drawEdge(edgeTG, s.bars.test, 0, s.bars.gate, 1, 1);
      drawEdge(edgeLI, s.bars.lint, 2, s.bars.images, 3, 1);
      drawEdge(edgeIE, s.bars.images, 3, s.bars.e2e, 4, 1);
      drawEdge(edgeGI, s.bars.gate, 1, s.bars.images, 3, s.edgeGI);
      drawEdge(edgeEG, s.bars.e2e, 4, s.bars.gate, 1, s.edgeEG);
      const midY = rowY(2) + layout.barH / 2 + 4;
      setAttrs(labelGI, { x: X(s.bars.gate.s) - 8, y: rowY(1) + layout.barH / 2 + 4, opacity: clamp01(s.edgeGI * 2 - 1) });
      setAttrs(labelEG, { x: X(s.total) + 6, y: midY, opacity: clamp01(s.edgeEG * 2 - 1) });

      const bottom = rowY(LANES.length - 1) + layout.barH + 6;
      const tx = X(s.total);
      setAttrs(totalLine, { x1: tx, x2: tx, y1: layout.top - 16, y2: bottom });
      setAttrs(totalText, { x: tx, y: layout.top - 21, 'text-anchor': tx > layout.x1 - 50 ? 'end' : 'middle' });
      totalText.textContent = `전체 ${mmss(s.total)}`;

      const li = Math.round(s.slackLane);
      const lb = s.bars[LANES[li]];
      const sy = rowY(li) + layout.barH / 2;
      const sx = X(lb.e);
      const show = clamp01(s.slackShow);
      setAttrs(slackLine, { x1: sx + 2, x2: Math.max(sx + 2, tx - 2), y1: sy, y2: sy, opacity: show });
      const fits = tx - sx > 70;
      // 여유가 짧으면 전체 종료선 오른쪽, 같은 줄 높이에 둡니다.
      setAttrs(slackText, { x: fits ? (sx + tx) / 2 : tx + 5, y: fits ? sy - layout.barH / 2 - 3 : sy + 4, 'text-anchor': fits ? 'middle' : 'start', opacity: show });
      slackText.textContent = `여유 ${mmss(s.slackSec)}`;
    },
  };
}
