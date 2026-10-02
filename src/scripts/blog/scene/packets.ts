/**
 * 요청·이벤트·마이그레이션처럼 "실제로 지나가는 것"을 작은 알약(패킷)으로 보여줍니다.
 * 패킷 하나가 요청 하나입니다. 길을 따라 이동하고, 관문에서 모양이 바뀌거나(relabel),
 * 벽에 막혀 튕겨 나오거나(bounce), 도착해 자리를 잡습니다(land).
 *
 * 장면의 숫자 상태와 달리 패킷은 생겼다 사라지는 존재라, 층(layer)이 직접 트윈을 돌립니다.
 * `layer.clear()`는 진행 중인 모든 패킷을 멈추고 지우며, 기다리던 Promise는 false로 끝납니다.
 */
import { angleOf, clamp01, ease, lerp, pointAt, prefersReducedMotion, replayClass, setAttrs, svg, tween, type Point, type Tween } from './core';

export type PacketTone = 'dep' | 'flow' | 'danger' | 'temp';

/** 꺾은선 위 t(0~1) 지점과 그 구간의 각도. */
export function polylineAt(points: Point[], t: number): Point & { angle: number } {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  const total = lengths.reduce((sum, l) => sum + l, 0) || 1;
  let left = clamp01(t) * total;
  for (let i = 0; i < lengths.length; i += 1) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const local = lengths[i] ? clamp01(left / lengths[i]) : 1;
      return { ...pointAt(points[i], points[i + 1], local), angle: angleOf(points[i], points[i + 1]) };
    }
    left -= lengths[i];
  }
  return { ...points[points.length - 1], angle: 0 };
}

export type Packet = {
  group: SVGGElement;
  readonly at: Point;
  /** 꺾은선을 따라 이동합니다. 첫 점이 현재 위치와 다르면 현재 위치에서 출발합니다. */
  travel: (points: Point[], ms: number, easing?: (t: number) => number) => Promise<boolean>;
  /** 관문에서 다른 것으로 바뀝니다(예: DELETE → UPDATE). 한 번 튀어 오릅니다. */
  relabel: (text: string, tone?: PacketTone) => void;
  /** `wall`까지 가서 부딪힌 뒤 `back`만큼 되밀려 나며 위험 색으로 바뀝니다. */
  bounce: (wall: Point, back?: number) => Promise<boolean>;
  /** 도착 표시를 하고 남습니다. `stay`가 false면 잠시 뒤 사라집니다. */
  land: (stay?: boolean) => Promise<boolean>;
  /** 흐려지며 사라집니다. */
  fade: (ms?: number) => Promise<boolean>;
  remove: () => void;
};

export function createPacketLayer(parent: Element) {
  const layer = svg('g', { class: 'scene-packets' }, parent);
  const reduced = prefersReducedMotion();
  const live = new Set<{ tween?: Tween; group: SVGGElement }>();
  let generation = 0;

  const run = (entry: { tween?: Tween }, ms: number, frame: (t: number) => void, easing = ease.standard) => {
    const id = generation;
    if (reduced) { frame(1); return Promise.resolve(id === generation); }
    entry.tween = tween(ms, frame, easing);
    return entry.tween.done.then((finished) => finished && id === generation);
  };

  return {
    group: layer,
    /** 새 패킷을 `at`에 만듭니다. 움직임 줄이기 설정이면 이동 없이 끝 상태로 갑니다. */
    spawn({ label, tone = 'dep', at }: { label: string; tone?: PacketTone; at: Point }): Packet {
      const group = svg('g', { class: 'scene-packet' }, layer);
      const body = svg('g', { class: 'scene-packet-body' }, group);
      const rect = svg('rect', { class: 'scene-packet-pill', rx: 8, height: 18, y: -9 }, body);
      const text = svg('text', { class: 'scene-packet-text', y: 3.6 }, body);
      const entry = { group } as { tween?: Tween; group: SVGGElement };
      live.add(entry);
      let pos = { ...at };

      const setTone = (next: PacketTone) => { group.dataset.tone = next; };
      const fit = () => {
        const width = Math.max(26, text.getComputedTextLength() + 14 || label.length * 6.6 + 14);
        setAttrs(rect, { x: -width / 2, width });
      };
      const place = (p: Point, extra = '') => {
        pos = p;
        setAttrs(group, { transform: `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})${extra}` });
      };
      text.textContent = label;
      setTone(tone);
      fit();
      place(at);

      const packet: Packet = {
        group,
        get at() { return pos; },
        travel(points, ms, easing = ease.standard) {
          const route = points.length && (points[0].x !== pos.x || points[0].y !== pos.y) ? [pos, ...points] : points;
          return run(entry, ms, (t) => place(polylineAt(route, t)), easing);
        },
        relabel(next, nextTone) {
          text.textContent = next;
          if (nextTone) setTone(nextTone);
          fit();
          if (!reduced) replayClass(group, 'is-bump');
        },
        async bounce(wall, back = 34) {
          const from = { ...pos };
          if (!(await run(entry, 420, (t) => place(pointAt(from, wall, t)), ease.out))) return false;
          setTone('danger');
          if (!reduced) replayClass(group, 'is-hit');
          const length = Math.hypot(wall.x - from.x, wall.y - from.y) || 1;
          const recoil = { x: wall.x - ((wall.x - from.x) / length) * back, y: wall.y - ((wall.y - from.y) / length) * back };
          return run(entry, 300, (t) => place(pointAt(wall, recoil, t)), ease.overshoot);
        },
        async land(stay = true) {
          if (!reduced) replayClass(group, 'is-landed');
          if (stay) return true;
          return packet.fade(520);
        },
        fade(ms = 360) {
          return run(entry, ms, (t) => { group.style.opacity = String(1 - t); }).then((ok) => { packet.remove(); return ok; });
        },
        remove() {
          entry.tween?.cancel();
          group.remove();
          live.delete(entry);
        },
      };
      return packet;
    },
    /** 진행 중인 패킷을 모두 멈추고 지웁니다. 새 동작을 시작하기 전에 부릅니다. */
    clear() {
      generation += 1;
      live.forEach((entry) => { entry.tween?.cancel(); entry.group.remove(); });
      live.clear();
    },
  };
}

/** 두 점 사이를 `lift`만큼 휜 곡선으로 n개 점을 찍습니다. 패킷이 호를 그리며 날아갈 때 씁니다. */
export function arcPoints(a: Point, b: Point, lift: number, n = 14): Point[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = dy / length;
  const ny = -dx / length;
  const sign = ny > 0 ? -1 : 1;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const h = lift * Math.sin(Math.PI * t) * sign;
    return { x: lerp(a.x, b.x, t) + nx * h, y: lerp(a.y, b.y, t) + ny * h };
  });
}
