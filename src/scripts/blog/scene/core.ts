/**
 * 글 속 애니메이션 장면의 바탕.
 * 장면 전체를 숫자 상태로 두고, 두 상태 사이를 보간해 매 프레임 다시 그립니다.
 * 기준과 사용법은 docs/animation-standards.md에 있습니다.
 */

export const SVG_NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number>;

/** Create an SVG element, apply attributes and append it to `parent`. */
export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);
  setAttrs(element, attrs);
  parent?.append(element);
  return element;
}

export function setAttrs(element: Element, attrs: Attrs) {
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
}

// ── 수치 ─────────────────────────────────────────────────

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Interpolate every number inside two objects of the same shape. Non-numbers switch at the end. */
export function lerpState<T>(from: T, to: T, t: number): T {
  if (typeof from === 'number' && typeof to === 'number') return lerp(from, to, t) as T;
  if (from && to && typeof from === 'object') {
    const result: Record<string, unknown> = {};
    Object.keys(to as object).forEach((key) => {
      const a = (from as Record<string, unknown>)[key];
      const b = (to as Record<string, unknown>)[key];
      result[key] = a === undefined ? b : lerpState(a, b, t);
    });
    return result as T;
  }
  return (t < 1 ? from : to) as T;
}

// ── 모션 토큰 ────────────────────────────────────────────

export const ease = {
  /** 대부분의 이동과 전환. */
  standard: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  /** 끊김·튕김처럼 힘이 실린 순간. 끝에서 살짝 넘쳤다 돌아옵니다. */
  overshoot: (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2,
  /** 들어와서 멈추는 것. */
  out: (t: number) => 1 - (1 - t) ** 3,
  linear: (t: number) => t,
};

/** 의미별 기본 시간(ms). 새 장면도 이 값에서 시작합니다. */
export const duration = {
  snap: 300, // 끊김, 튕김
  cut: 420, // 취소선 긋기
  move: 720, // 노드·블록 이동
  flip: 800, // 방향 뒤집기
  draw: 880, // 새 흐름 그리기 + 배치 바뀜
  fly: 760, // FLIP 비행
  reflow: 380, // 남은 요소가 자리 메우기
  beat: 440, // 로그 한 줄 사이의 쉼
  read: 2100, // 결과를 읽을 시간
  dwell: 2700, // 타임라인 한 단계
  dwellLast: 4200, // 타임라인 마지막 단계
};

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── 트윈 ─────────────────────────────────────────────────

export type Tween = { done: Promise<boolean>; cancel: () => void };

/** Run `onFrame` with eased progress. `done` resolves false when cancelled. */
export function tween(ms: number, onFrame: (t: number) => void, easing = ease.standard): Tween {
  let frame = 0;
  let resolve: (finished: boolean) => void = () => {};
  const done = new Promise<boolean>((r) => { resolve = r; });
  if (ms <= 0) {
    onFrame(1);
    resolve(true);
    return { done, cancel: () => {} };
  }
  const start = performance.now();
  const step = (now: number) => {
    const progress = clamp01((now - start) / ms);
    onFrame(easing(progress));
    if (progress < 1) frame = requestAnimationFrame(step);
    else resolve(true);
  };
  frame = requestAnimationFrame(step);
  return { done, cancel: () => { cancelAnimationFrame(frame); resolve(false); } };
}

export const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/**
 * 숫자 상태 하나를 들고 있는 장면.
 * `go`는 진행 중인 전환을 끊고 지금 보이는 상태에서 이어 갑니다. 움직임 줄이기 설정이면 즉시 끝납니다.
 */
export function createScene<S>(initial: S, render: (state: S) => void) {
  const reduced = prefersReducedMotion();
  let state = initial;
  let active: Tween | undefined;
  let run = 0;

  const scene = {
    reduced,
    get state() { return state; },
    /** 시간 값을 움직임 줄이기 설정에 맞춰 바꿉니다. */
    ms: (value: number) => (reduced ? 0 : value),
    set(next: S) {
      active?.cancel();
      state = next;
      render(state);
    },
    go(next: S, ms: number = duration.move, easing = ease.standard) {
      active?.cancel();
      const from = state;
      active = tween(reduced ? 0 : ms, (t) => { state = lerpState(from, next, t); render(state); }, easing);
      return active.done;
    },
    pause: (ms: number) => wait(reduced ? 0 : ms),
    /** 연속 동작을 시작합니다. 반환된 `alive()`가 false면 더 새 동작이 시작된 것이니 멈춥니다. */
    begin() {
      const id = ++run;
      return () => id === run;
    },
    redraw: () => render(state),
  };
  return scene;
}

// ── 기하 ─────────────────────────────────────────────────

export type Point = { x: number; y: number };
export type Box = Point & { w: number; h: number };

/** Where the line from the centre of `box` toward `target` leaves the box, pushed out by `gap`. */
export function exitPoint(box: Box, target: Point, gap = 6): Point {
  const dx = target.x - box.x;
  const dy = target.y - box.y;
  if (dx === 0 && dy === 0) return { x: box.x, y: box.y };
  const scale = Math.min(
    dx === 0 ? Infinity : (box.w / 2 + gap) / Math.abs(dx),
    dy === 0 ? Infinity : (box.h / 2 + gap) / Math.abs(dy),
  );
  return { x: box.x + dx * scale, y: box.y + dy * scale };
}

export const pointAt = (a: Point, b: Point, t: number): Point => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
export const angleOf = (from: Point, to: Point) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

/** Point and tangent angle (degrees) on a quadratic curve. */
export function quadAt(a: Point, c: Point, b: Point, t: number) {
  const u = 1 - t;
  const point = { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  const tangent = { x: 2 * u * (c.x - a.x) + 2 * t * (b.x - c.x), y: 2 * u * (c.y - a.y) + 2 * t * (b.y - c.y) };
  return { ...point, angle: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI };
}

// ── 화면 ─────────────────────────────────────────────────

/** 본문 폭에 맞춘 넓은 배치 기준. 블로그 본문 안의 데모 폭은 약 530~580px입니다. */
export const WIDE_VIEW_WIDTH = 560;
export const NARROW_BREAKPOINT = 560;

/** Call `onChange(isNarrow)` whenever the element crosses `breakpoint` pixels. */
export function watchNarrow(element: HTMLElement, onChange: (narrow: boolean) => void, breakpoint = NARROW_BREAKPOINT) {
  let narrow: boolean | undefined;
  const check = () => {
    const next = element.clientWidth < breakpoint;
    if (next === narrow) return;
    narrow = next;
    onChange(next);
  };
  const observer = 'ResizeObserver' in window ? new ResizeObserver(check) : undefined;
  observer?.observe(element);
  check();
  return () => observer?.disconnect();
}

/** 클래스를 다시 붙여 CSS 애니메이션을 처음부터 재생합니다. */
export function replayClass(element: Element, className: string) {
  element.classList.remove(className);
  void (element as HTMLElement).getBoundingClientRect();
  element.classList.add(className);
}

/** 숫자·짧은 값이 바뀔 때 튀어 오르게 합니다. 같은 값이면 아무것도 하지 않습니다. */
export function bumpText(element: HTMLElement, text: string) {
  if (element.textContent === text) return;
  element.textContent = text;
  if (!prefersReducedMotion()) replayClass(element, 'is-bump');
}
