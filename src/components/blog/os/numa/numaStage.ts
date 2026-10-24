/**
 * NUMA 글의 장면들이 함께 쓰는 무대: NUMA 노드 두 개, 노드마다 CPU 두 개와 메모리, 두 노드를 잇는 interconnect.
 * multicore 글의 `NumaPlacement` 와 같은 배치를 위쪽 띠(`top`)만큼 내려 그립니다. 위쪽 띠는 장면마다 다르게 씁니다
 * (가상 주소만 있는 buf, 힙 region, 할당자 캐시).
 */
import { setAttrs, svg, type Point } from '@/scripts/blog/scene/core';
import { createBoundary, createNode, type Rect } from '@/scripts/blog/scene/parts';

export type Anchor = 'start' | 'middle' | 'end';
export type StageLayout = {
  view: [number, number];
  nodes: Rect[];
  cpu: (k: number) => Point;
  cpuSize: { w: number; h: number };
  /** CPU 아래 스레드 칩이 앉는 자리. */
  seat: (k: number) => Point;
  lane: (node: number) => number;
  port: (node: number) => Point;
  mem: (node: number) => Rect;
  memCaption: (node: number) => Point & { anchor: Anchor };
  page: (node: number, i: number) => Point;
  link: [Point, Point];
  linkLabel: Point & { anchor: Anchor };
};

export const cpuNode = (k: number) => (k < 2 ? 0 : 1);

/** 넓은 배치(폭 560)와 좁은 배치(폭 360)를 위쪽 띠 높이에 맞춰 만듭니다. */
export function stageLayouts(topWide: number, topNarrow: number): Record<'wide' | 'narrow', StageLayout> {
  const t = topWide;
  const nx = (n: number) => (n === 0 ? 10 : 314);
  const wide: StageLayout = {
    view: [560, t + 246],
    nodes: [{ x: 10, y: t, w: 236, h: 236 }, { x: 314, y: t, w: 236, h: 236 }],
    cpu: (k) => ({ x: [69, 187, 373, 491][k], y: t + 54 }),
    cpuSize: { w: 96, h: 36 },
    seat: (k) => ({ x: [69, 187, 373, 491][k], y: t + 94 }),
    lane: () => t + 118,
    port: (n) => ({ x: n === 0 ? 246 : 314, y: t + 118 }),
    mem: (n) => ({ x: nx(n) + 12, y: t + 130, w: 212, h: 92 }),
    memCaption: (n) => ({ x: nx(n) + 24, y: t + 210, anchor: 'start' }),
    page: (n, i) => ({ x: nx(n) + 52 + i * 44, y: t + 168 }),
    link: [{ x: 246, y: t + 118 }, { x: 314, y: t + 118 }],
    linkLabel: { x: 280, y: t + 138, anchor: 'middle' },
  };
  const u = topNarrow;
  const ny = (n: number) => (n === 0 ? u : u + 214);
  const narrow: StageLayout = {
    view: [360, u + 424],
    nodes: [{ x: 8, y: ny(0), w: 330, h: 200 }, { x: 8, y: ny(1), w: 330, h: 200 }],
    cpu: (k) => ({ x: [74, 184, 74, 184][k], y: ny(cpuNode(k)) + 58 }),
    cpuSize: { w: 92, h: 34 },
    seat: (k) => ({ x: [74, 184, 74, 184][k], y: ny(cpuNode(k)) + 96 }),
    lane: (n) => ny(n) + 120,
    port: (n) => ({ x: 348, y: ny(n) + 120 }),
    mem: (n) => ({ x: 20, y: ny(n) + 130, w: 306, h: 62 }),
    memCaption: (n) => ({ x: 32, y: ny(n) + 156, anchor: 'start' }),
    page: (n, i) => ({ x: 124 + i * 50, y: ny(n) + 152 }),
    link: [{ x: 348, y: ny(0) + 120 }, { x: 348, y: ny(1) + 120 }],
    linkLabel: { x: 340, y: u + 207, anchor: 'end' },
  };
  return { wide, narrow };
}

/** 노드 상자, 메모리 상자, interconnect, CPU 네 개를 그립니다. 배치가 바뀌면 `place` 를 다시 부릅니다. */
export function createStage(root: SVGSVGElement) {
  const nodeBoxes = [0, 1].map((n) => createBoundary(root, `NUMA node ${n}`));
  const memBoxes = [0, 1].map(() => createBoundary(root, '메모리'));
  const link = svg('line', { class: 'scene-numa-link' }, root);
  const linkLabel = svg('text', { class: 'scene-label scene-label-dep is-sans' }, root);
  linkLabel.textContent = 'interconnect';
  const cpus = [0, 1, 2, 3].map((k) => createNode(root, { label: `CPU ${k}`, hue: 'var(--scene-hue-gray)' }));
  return {
    place(layout: StageLayout) {
      setAttrs(root, { viewBox: `0 0 ${layout.view[0]} ${layout.view[1]}` });
      nodeBoxes.forEach((box, n) => box.place(layout.nodes[n]));
      memBoxes.forEach((box, n) => box.place(layout.mem(n), layout.memCaption(n)));
      cpus.forEach((cpu, k) => cpu.setBox({ ...layout.cpu(k), ...layout.cpuSize }));
      setAttrs(link, { x1: layout.link[0].x, y1: layout.link[0].y, x2: layout.link[1].x, y2: layout.link[1].y });
      setAttrs(linkLabel, { x: layout.linkLabel.x, y: layout.linkLabel.y, 'text-anchor': layout.linkLabel.anchor });
    },
  };
}

/**
 * 페이지(`node` 의 `i` 번째 자리)와 CPU `cpu` 아래 스레드 자리 사이의 길. 페이지에서 출발합니다.
 * 노드가 다르면 interconnect 를 건넙니다. 쓰기는 이 길을 뒤집어 씁니다.
 */
export function pageRoute(layout: StageLayout, node: number, i: number, cpu: number): Point[] {
  const from = layout.page(node, i);
  const to = layout.seat(cpu);
  const tn = cpuNode(cpu);
  return tn !== node
    ? [from, { x: from.x, y: layout.lane(node) }, layout.port(node), layout.port(tn), { x: to.x, y: layout.lane(tn) }, to]
    : [from, { x: from.x, y: layout.lane(node) }, { x: to.x, y: layout.lane(tn) }, to];
}

export const routeLength = (route: Point[]) =>
  route.slice(1).reduce((sum, p, k) => sum + Math.hypot(p.x - route[k].x, p.y - route[k].y), 0);

/** 읽기·쓰기 패킷의 이동 시간. 경로가 길수록 오래 걸립니다(실제 지연 비율이 아닙니다). */
export const travelMs = (route: Point[]) => 240 + routeLength(route) * 1.9;
