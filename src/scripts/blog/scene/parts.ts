/**
 * SVG 장면 부품. 각 부품은 한 번 만들고, 매 프레임 `draw`/`place`에 현재 상태를 넘겨 다시 그립니다.
 * 스타일은 styles/scene.css의 scene-* 클래스가 맡습니다.
 */
import { angleOf, clamp01, exitPoint, pointAt, prefersReducedMotion, quadAt, replayClass, setAttrs, svg, type Box, type Point } from './core';

// ── 노드 ─────────────────────────────────────────────────

export type NodeView = {
  group: SVGGElement;
  setBox: (box: Box) => void;
  setSub: (text: string) => void;
  /** 상태 클래스를 켜고 끕니다. is-shaking, is-ok처럼 애니메이션이 있는 클래스는 다시 재생됩니다. */
  flash: (className: string, on?: boolean) => void;
};

/** 왼쪽 색 막대, 이름, 작은 고정폭 보조 문구를 가진 카드. 상자 중심 좌표에 놓입니다. */
export function createNode(parent: Element, { label, hue, sub = '' }: { label: string; hue: string; sub?: string }): NodeView {
  const group = svg('g', { class: 'scene-node' }, parent);
  group.style.setProperty('--node-hue', hue);
  const body = svg('g', { class: 'scene-node-body' }, group);
  const card = svg('rect', { class: 'scene-node-card', rx: 10 }, body);
  const accent = svg('rect', { class: 'scene-node-accent', rx: 2, width: 4 }, body);
  const name = svg('text', { class: 'scene-node-name' }, body);
  const subText = svg('text', { class: 'scene-node-sub' }, body);
  name.textContent = label;
  subText.textContent = sub;
  let size = { w: 0, h: 0 };

  const layoutText = () => {
    const hasSub = Boolean(subText.textContent);
    setAttrs(name, { x: 4, y: hasSub ? -2 : 5 });
    setAttrs(subText, { x: 4, y: size.h / 2 - 9 });
  };

  return {
    group,
    setBox: ({ x, y, w, h }) => {
      setAttrs(group, { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})` });
      if (w === size.w && h === size.h) return;
      size = { w, h };
      setAttrs(card, { x: -w / 2, y: -h / 2, width: w, height: h });
      setAttrs(accent, { x: -w / 2 + 7, y: -h / 2 + 10, height: h - 20 });
      layoutText();
    },
    setSub: (text) => {
      subText.textContent = text;
      layoutText();
    },
    flash: (className, on = true) => {
      if (on) replayClass(group, className);
      else group.classList.remove(className);
    },
  };
}

/** 착지 링: 옮겨진 상자 둘레에서 한 번 퍼지며 사라지는 테두리. 이동이 끝난 뒤 부릅니다. */
export function landRing(parent: Element, { x, y, w, h }: Box) {
  if (prefersReducedMotion()) return;
  const ring = svg('rect', { class: 'scene-land-ring', x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 12 }, parent);
  ring.addEventListener('animationend', () => ring.remove());
}

export type TrayView = NodeView & {
  /** 실린 노드의 중심. 트레이가 움직이면 매 프레임 이 값으로 실린 노드를 다시 놓습니다. */
  seat: (at: Point) => Point;
};

/**
 * 다른 노드를 싣고 다니는 카드. OS 스레드 위의 VT처럼 "실려서 함께 움직인다"를 보여줍니다.
 * 이름은 왼쪽 위, 보조 문구는 오른쪽 위, 아래쪽에 점선 자리(seat)가 있습니다.
 */
export function createTray(parent: Element, { label, hue, sub = '', seatDy = 14, seatSize }: { label: string; hue: string; sub?: string; seatDy?: number; seatSize: { w: number; h: number } }): TrayView {
  const group = svg('g', { class: 'scene-node scene-tray' }, parent);
  group.style.setProperty('--node-hue', hue);
  const body = svg('g', { class: 'scene-node-body' }, group);
  const card = svg('rect', { class: 'scene-node-card', rx: 12 }, body);
  const accent = svg('rect', { class: 'scene-node-accent', rx: 2, width: 4 }, body);
  const name = svg('text', { class: 'scene-node-name scene-tray-name' }, body);
  const subText = svg('text', { class: 'scene-node-sub scene-tray-sub' }, body);
  const seat = svg('rect', { class: 'scene-tray-seat', rx: 10 }, body);
  name.textContent = label;
  subText.textContent = sub;
  let size = { w: 0, h: 0 };
  return {
    group,
    setBox: ({ x, y, w, h }) => {
      setAttrs(group, { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})` });
      if (w === size.w && h === size.h) return;
      size = { w, h };
      setAttrs(card, { x: -w / 2, y: -h / 2, width: w, height: h });
      setAttrs(accent, { x: -w / 2 + 8, y: -h / 2 + 11, height: 16 });
      setAttrs(name, { x: -w / 2 + 19, y: -h / 2 + 24 });
      setAttrs(subText, { x: w / 2 - 12, y: -h / 2 + 23 });
      setAttrs(seat, { x: -seatSize.w / 2 - 4, y: seatDy - seatSize.h / 2 - 4, width: seatSize.w + 8, height: seatSize.h + 8 });
    },
    setSub: (text) => { subText.textContent = text; },
    flash: (className, on = true) => {
      if (on) replayClass(group, className);
      else group.classList.remove(className);
    },
    seat: (at) => ({ x: at.x, y: at.y + seatDy }),
  };
}

// ── 줄어들고 다시 차는 예산 ──────────────────────────────

/**
 * 채워진 비율이 줄어드는 게이지. quota처럼 "쓰면 줄고 기간이 바뀌면 다시 차는 예산"에 씁니다.
 * 세로(v)는 아래부터, 가로(h)는 왼쪽부터 채웁니다. 0이 되면 테두리가 임시 색 점선으로 바뀝니다.
 */
export function createGauge(parent: Element, caption: string, orient: 'v' | 'h' = 'v') {
  const group = svg('g', { class: 'scene-gauge' }, parent);
  const track = svg('rect', { class: 'scene-gauge-track', rx: 7 }, group);
  const fill = svg('rect', { class: 'scene-gauge-fill', rx: 7 }, group);
  const title = svg('text', { class: 'scene-caption' }, group);
  const value = svg('text', { class: 'scene-gauge-value' }, group);
  title.textContent = caption;
  return {
    group,
    value,
    /** `direction`을 주면 만들 때 정한 방향 대신 씁니다(넓은·좁은 배치에서 방향이 다를 때). */
    place({ x, y, w, h }: { x: number; y: number; w: number; h: number }, amount: number, direction: 'v' | 'h' = orient) {
      const a = clamp01(amount);
      setAttrs(track, { x, y, width: w, height: h });
      if (direction === 'v') {
        setAttrs(fill, { x, y: y + h * (1 - a), width: w, height: h * a });
        setAttrs(title, { x: x + w / 2, y: y - 26, 'text-anchor': 'middle' });
        setAttrs(value, { x: x + w / 2, y: y - 9, 'text-anchor': 'middle' });
      } else {
        setAttrs(fill, { x, y, width: w * a, height: h });
        setAttrs(title, { x, y: y - 8, 'text-anchor': 'start' });
        setAttrs(value, { x: x + w, y: y - 8, 'text-anchor': 'end' });
      }
      group.classList.toggle('is-empty', a <= 0.001);
    },
  };
}

// ── 화살촉과 라벨 ────────────────────────────────────────

/** 끝이 `tip`에 닿고 `angle`도 방향을 가리키는 화살촉. 반환값은 위치를 바꾸는 함수입니다. */
export function createArrow(parent: Element, fill?: string) {
  const arrow = svg('path', { class: 'scene-arrow', d: 'M 0 0 L -11 -5.5 L -8 0 L -11 5.5 Z' }, parent);
  if (fill) arrow.style.fill = fill;
  const place = (tip: Point, angle: number) => setAttrs(arrow, { transform: `translate(${tip.x.toFixed(2)} ${tip.y.toFixed(2)}) rotate(${angle.toFixed(2)})` });
  return Object.assign(place, { element: arrow });
}

/** 테두리가 있는 알약 모양 라벨. `strike`(0~1)만큼 취소선이 그어집니다. */
export function createPill(parent: Element, text: string) {
  const group = svg('g', {}, parent);
  const rect = svg('rect', { class: 'scene-pill', rx: 8, height: 18 }, group);
  const label = svg('text', { class: 'scene-pill-text', y: 4 }, group);
  label.textContent = text;
  const strike = svg('line', { class: 'scene-strike', y1: 0, y2: 0 }, group);
  let width = 0;
  return {
    group,
    place: (at: Point, strikeAmount: number) => {
      // 글꼴이 늦게 적용되면 첫 측정이 0일 수 있어, 측정에 성공할 때까지만 다시 잽니다.
      if (!width) width = label.getComputedTextLength() && Math.max(40, label.getComputedTextLength() + 16);
      const w = width || text.length * 10 + 16;
      setAttrs(rect, { x: -w / 2, y: -9, width: w });
      setAttrs(strike, { x1: -w / 2 + 5, x2: -w / 2 + 5 + (w - 10) * strikeAmount, opacity: strikeAmount > 0 ? 1 : 0 });
      setAttrs(group, { transform: `translate(${at.x.toFixed(2)} ${at.y.toFixed(2)})` });
    },
  };
}

export type LabelSpot = { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' };

// ── 뒤집히고 끊기는 연결 ─────────────────────────────────

export type FlipLinkState = {
  /** 0이면 a → b(forward), 1이면 b → a(backward). 사이 값에서는 화살촉이 선을 따라 미끄러지며 돕니다. */
  flip: number;
  show: number;
  /** 0이면 이어짐, 1이면 가운데가 벌어지고 ✕가 표시됩니다. */
  brk: number;
};

/**
 * 같은 두 노드 사이의 관계를 두 가지 시선으로 보여주는 선.
 * forward는 의존 색(--scene-dep), backward는 위험 색(--scene-danger)으로 칠하며 flip 값으로 섞습니다.
 */
export function createFlipLink(parent: Element, { forward, backward }: { forward: string; backward: string }) {
  const group = svg('g', {}, parent);
  const line = svg('path', { class: 'scene-line' }, group);
  const arrow = createArrow(group);
  const forwardLabel = svg('text', { class: 'scene-label scene-label-dep' }, group);
  const backwardLabel = svg('text', { class: 'scene-label scene-label-danger' }, group);
  const mark = svg('text', { class: 'scene-break' }, group);
  forwardLabel.textContent = forward;
  backwardLabel.textContent = backward;
  mark.textContent = '✕';

  return {
    group,
    draw(a: Box, b: Box, { flip, show, brk }: FlipLinkState, label: LabelSpot) {
      const start = exitPoint(a, b, 4);
      const end = exitPoint(b, a, 4);
      const gap = 0.2 * brk;
      let d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      if (brk > 0.01) {
        const p = pointAt(start, end, 0.5 - gap);
        const q = pointAt(start, end, 0.5 + gap);
        d = `M ${start.x} ${start.y} L ${p.x} ${p.y} M ${q.x} ${q.y} L ${end.x} ${end.y}`;
      }
      const colour = `color-mix(in srgb, var(--scene-danger) ${Math.round(clamp01(flip) * 100)}%, var(--scene-dep))`;
      setAttrs(line, { d });
      line.style.stroke = colour;
      line.classList.toggle('is-flowing-reverse', flip > 0.98 && brk < 0.01);
      arrow.element.style.fill = colour;
      arrow(pointAt(end, start, flip), angleOf(start, end) + 180 * flip);
      group.style.opacity = String(show);

      const mid = pointAt(start, end, 0.5);
      [forwardLabel, backwardLabel].forEach((text) => setAttrs(text, { x: mid.x + label.dx, y: mid.y + label.dy, 'text-anchor': label.anchor }));
      forwardLabel.style.opacity = String(1 - flip);
      backwardLabel.style.opacity = String(flip);
      setAttrs(mark, { x: mid.x, y: mid.y, opacity: clamp01(brk) });
    },
  };
}

// ── 끊어 내는 호출선 ─────────────────────────────────────

export type CallLineState = {
  /** 1이면 다 그려짐, 0이면 시작점까지 거둬짐. */
  show: number;
  /** 라벨의 취소선 비율. 끊을 때는 strike를 먼저 1로 만든 뒤 show를 0으로 보냅니다. */
  strike: number;
};

/** 위험 색 실선 + 알약 라벨. 동기 호출, 직접 의존처럼 "끊어야 할 연결"에 씁니다. */
export function createCallLine(parent: Element, text: string, colour = 'var(--scene-danger)') {
  const group = svg('g', {}, parent);
  const line = svg('path', { class: 'scene-line' }, group);
  line.style.stroke = colour;
  const arrow = createArrow(group, colour);
  const pill = createPill(group, text);
  return {
    group,
    draw(start: Point, stop: Point, { show, strike }: CallLineState, pillAt: Point = pointAt(start, stop, 0.5)) {
      const tip = pointAt(start, stop, show);
      setAttrs(line, { d: `M ${start.x} ${start.y} L ${tip.x} ${tip.y}` });
      arrow(tip, angleOf(start, stop));
      pill.place(pillAt, strike);
      pill.group.style.opacity = String(clamp01(show * 1.6));
      group.style.opacity = String(clamp01(show * 3));
    },
  };
}

// ── 그려지는 흐름 곡선 ───────────────────────────────────

/** 흐르는 점선 곡선 + 화살촉 + 라벨. 이벤트, 메시지처럼 "새로 생긴 흐름"에 씁니다. */
export function createCurve(parent: Element, text: string) {
  const group = svg('g', {}, parent);
  const path = svg('path', { class: 'scene-line scene-flow' }, group);
  const arrow = createArrow(group, 'var(--scene-flow)');
  const label = svg('text', { class: 'scene-label scene-label-flow' }, group);
  label.textContent = text;
  return {
    group,
    /** `show`(0~1)만큼만 곡선을 그립니다. 라벨은 절반이 넘게 그려진 뒤 나타납니다. */
    draw(a: Point, c: Point, b: Point, show: number, labelAt: Point & { anchor: LabelSpot['anchor'] }) {
      // 드 카스텔조 분할: 0~show 구간만 새 2차 곡선으로 만듭니다.
      const end = quadAt(a, c, b, Math.max(show, 0.001));
      const subCtrl = pointAt(a, c, show);
      setAttrs(path, { d: `M ${a.x} ${a.y} Q ${subCtrl.x} ${subCtrl.y} ${end.x} ${end.y}` });
      arrow(end, end.angle);
      setAttrs(label, { x: labelAt.x, y: labelAt.y, 'text-anchor': labelAt.anchor });
      label.style.opacity = String(clamp01((show - 0.5) * 2));
      group.style.opacity = String(clamp01(show * 4));
    },
  };
}

// ── 경계와 캡션 ──────────────────────────────────────────

/** 왼쪽 위 기준 사각형. 노드 상자(Box)는 중심 기준이라 따로 둡니다. o는 불투명도입니다. */
export type Rect = { x: number; y: number; w: number; h: number; o?: number };

/** 점선 경계 상자와 왼쪽 위 캡션. 줄어들거나 사라지는 경계에 씁니다. */
export function createBoundary(parent: Element, caption: string, variant: 'boundary' | 'zone' = 'boundary') {
  const rect = svg('rect', { class: `scene-${variant}`, rx: 16 }, parent);
  const text = svg('text', { class: 'scene-caption' }, parent);
  text.textContent = caption;
  return {
    rect,
    caption: text,
    place({ x, y, w, h, o = 1 }: Rect, captionAt?: Point & { anchor?: LabelSpot['anchor'] }) {
      setAttrs(rect, { x, y, width: Math.max(0, w), height: Math.max(0, h), opacity: o });
      const at = captionAt ?? { x: x + 16, y: y + 26, anchor: 'start' as const };
      setAttrs(text, { x: at.x, y: at.y, 'text-anchor': at.anchor ?? 'start', opacity: o });
    },
  };
}
