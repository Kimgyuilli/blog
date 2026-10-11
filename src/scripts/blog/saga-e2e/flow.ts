import { createScene, duration, ease, replayClass, setAttrs, svg, watchNarrow, type Box, type Point } from '../scene/core';
import { createNode, type NodeView } from '../scene/parts';
import { createPacketLayer } from '../scene/packets';
import { createStepPlayer } from '../scene/step-player';

// 독자가 볼 변화: 같은 order.created 로 시작해도 결제 결과에 따라 다른 토픽이 Kafka 를 거쳐 퍼지고,
// 네 서비스의 DB 상태가 다르게 끝난다. 서비스끼리는 서로를 직접 호출하지 않는다.
type Scenario = 'success' | 'failure' | 'refund';
type Key = 'order' | 'payment' | 'toss' | 'product' | 'noti';
type Cls = '' | 'is-temp' | 'is-done' | 'is-error';
type Look = [string, Cls];
type Layout = {
  view: [number, number];
  boxes: Record<Key, Box>;
  bus: { x: number; y: number; w: number; h: number };
  /** 서비스가 Kafka 로 내려가거나 올라오는 x 좌표. */
  dropX: Partial<Record<Key, number>>;
  toss: [Point, Point];
  user: { order: [Point, Point]; payment: [Point, Point] };
};

const LAYOUTS: Record<'wide' | 'narrow', Layout> = {
  wide: {
    view: [560, 330],
    boxes: {
      order: { x: 116, y: 64, w: 150, h: 54 },
      payment: { x: 306, y: 64, w: 150, h: 54 },
      toss: { x: 482, y: 64, w: 104, h: 46 },
      product: { x: 166, y: 278, w: 150, h: 54 },
      noti: { x: 390, y: 278, w: 150, h: 54 },
    },
    bus: { x: 20, y: 157, w: 520, h: 30 },
    dropX: {},
    toss: [{ x: 387, y: 64 }, { x: 424, y: 64 }],
    user: { order: [{ x: 116, y: 4 }, { x: 116, y: 33 }], payment: [{ x: 306, y: 4 }, { x: 306, y: 33 }] },
  },
  narrow: {
    view: [360, 360],
    boxes: {
      order: { x: 104, y: 112, w: 140, h: 52 },
      payment: { x: 268, y: 112, w: 140, h: 52 },
      toss: { x: 268, y: 28, w: 110, h: 40 },
      product: { x: 104, y: 306, w: 140, h: 52 },
      noti: { x: 268, y: 306, w: 140, h: 52 },
    },
    bus: { x: 8, y: 196, w: 344, h: 30 },
    dropX: {},
    toss: [{ x: 268, y: 82 }, { x: 268, y: 52 }],
    user: { order: [{ x: 104, y: 44 }, { x: 104, y: 82 }], payment: [{ x: 186, y: 60 }, { x: 204, y: 90 }] },
  },
};

const STEP_DETAILS: Record<Scenario, string[]> = {
  success: ['order.created', 'stock.reservation.result', 'Toss 승인 성공', 'payment.completed'],
  failure: ['order.created', 'stock.reservation.result', 'Toss 승인 실패', 'payment.failed'],
  refund: ['order.created', 'stock.reservation.result', '주문 취소와 승인 성공', '환불 요청과 회신'],
};

/** 단계 i가 끝났을 때 각 노드의 보조 문구(그 서비스 DB 의 대표 상태). */
function looks(s: Scenario, i: number): Record<Key, Look> {
  const l: Record<Key, Look> = {
    order: ['PENDING', ''],
    payment: ['PENDING', ''],
    toss: ['', ''],
    product: ['RESERVED', 'is-temp'],
    noti: ['주문 알림', ''],
  };
  if (i >= 1) {
    l.order = ['예약 확정', ''];
    l.payment = ['결제 가능', 'is-temp'];
  }
  if (i >= 2) {
    if (s === 'failure') {
      l.payment = ['FAILED', 'is-error'];
      l.toss = ['승인 실패', 'is-error'];
    } else {
      l.payment = ['APPROVED', 'is-done'];
      l.toss = ['승인 성공', 'is-done'];
    }
    if (s === 'refund') {
      l.order = ['CANCELLED', 'is-error'];
      l.product = ['RELEASED', 'is-temp'];
      l.noti = ['취소 알림', ''];
    }
  }
  if (i >= 3) {
    if (s === 'success') {
      l.order = ['PAYMENT_COMPLETED', 'is-done'];
      l.product = ['CONFIRMED', 'is-done'];
      l.noti = ['결제 완료 알림', 'is-done'];
    } else if (s === 'failure') {
      l.order = ['CANCELLED', 'is-error'];
      l.product = ['RELEASED', 'is-temp'];
      l.noti = ['결제 실패 알림', ''];
    } else {
      l.order = ['보상 RESOLVED', 'is-done'];
      l.product = ['보상 종결', 'is-done'];
      l.payment = ['환불 SUCCEEDED', 'is-done'];
      l.toss = ['취소 성공', 'is-done'];
      l.noti = ['환불 알림', 'is-done'];
    }
  }
  return l;
}

const NOTES: Record<Scenario, string[]> = {
  success: [],
  failure: [],
  refund: [],
};
const COMMON = [
  '주문 요청을 받은 Order 가 주문을 <code>PENDING</code> 으로 만들고 <code>order.created</code> 를 발행합니다. Product 는 재고를 예약하고, Payment 는 결제 행을 만들고, Notification 은 주문 알림을 남깁니다.',
  'Product 가 예약 결과를 <code>stock.reservation.result</code> 로 알립니다. Order 는 예약 확정을 기록하고, Payment 의 결제 행은 승인할 수 있는 상태가 됩니다.',
];
NOTES.success.push(...COMMON,
  '사용자가 결제 승인을 요청하면 Payment 가 Toss 승인을 호출합니다. 승인이 성공해 결제는 <code>APPROVED</code> 가 됩니다.',
  'Payment 가 발행한 <code>payment.completed</code> 를 받아 Order 는 <code>PAYMENT_COMPLETED</code>, Product 는 예약을 <code>CONFIRMED</code> 로 바꾸고, Notification 은 결제 완료를 알립니다.');
NOTES.failure.push(...COMMON,
  'Toss 승인이 실패하면 Payment 가 결제를 <code>FAILED</code> 로 바꿉니다.',
  'Payment 가 발행한 <code>payment.failed</code> 를 받아 Order 는 주문을 <code>CANCELLED</code> 로 바꾸고, Product 는 예약을 <code>RELEASED</code> 로 되돌려 재고를 원복하고, Notification 은 실패 알림을 남깁니다. Order 가 이어서 발행하는 <code>order.cancelled</code> 의 결제 실패 사유는 Notification 이 건너뜁니다.');
NOTES.refund.push(...COMMON,
  '결제 승인이 진행되는 사이 사용자가 주문을 취소합니다. Order 는 <code>CANCELLED</code> 가 되어 <code>order.cancelled</code> 를 발행하고, Product 는 예약을 풀고, Notification 은 취소 알림을 남깁니다. 그런데 Toss 승인은 성공해 결제는 <code>APPROVED</code> 가 됩니다.',
  '이미 취소된 주문에 <code>payment.completed</code> 가 도착하자 Order 와 Product 가 각자 보상을 기록하고 환불 요청 토픽 두 개에 발행합니다. Payment 는 환불 원장에 한 행을 만들어 Toss 취소를 호출하고, 결과를 <code>payment.refunded</code> 로 돌려줍니다.');

export function initSagaFlow(demo: HTMLElement) {
  if (demo.dataset.ready) return;
  demo.dataset.ready = 'true';
  const stage = demo.querySelector<HTMLElement>('[data-stage]')!;
  const root = demo.querySelector<SVGSVGElement>('[data-graphic]')!;
  const note = demo.querySelector<HTMLElement>('[data-note]')!;
  const scenarioButtons = [...demo.querySelectorAll<HTMLButtonElement>('[data-flow-scenario]')];
  const stepDetails = [...demo.querySelectorAll<HTMLElement>('[data-step] small')];
  let layout = LAYOUTS.wide;
  let scenario: Scenario = 'success';
  let current = -1;

  const bus = svg('rect', { class: 'sf-bus', rx: 15 }, root);
  const busCaption = svg('text', { class: 'sf-bus-caption' }, root);
  busCaption.textContent = 'Kafka';
  const tossLine = svg('path', { class: 'saga-wire sf-toss-line' }, root);
  const tossCaption = svg('text', { class: 'sf-http-caption' }, root);
  tossCaption.textContent = 'HTTP';

  const node = (label: string, hue: string) => {
    const n = createNode(root, { label, hue });
    n.group.classList.add('is-sans-sub');
    return n;
  };
  const nodes: Record<Key, NodeView> = {
    order: node('Order', 'var(--scene-hue-blue)'),
    payment: node('Payment', 'var(--scene-hue-violet)'),
    toss: node('Toss', 'var(--scene-hue-pink)'),
    product: node('Product', 'var(--scene-hue-amber)'),
    noti: node('Notification', 'var(--scene-hue-cyan)'),
  };
  const layer = createPacketLayer(root);

  const scene = createScene({ t: 0 }, () => {
    const l = layout;
    setAttrs(bus, { x: l.bus.x, y: l.bus.y, width: l.bus.w, height: l.bus.h });
    setAttrs(busCaption, { x: l.bus.x + 6, y: l.bus.y - 8 });
    (Object.keys(nodes) as Key[]).forEach((k) => nodes[k].setBox(l.boxes[k]));
    setAttrs(tossLine, { d: `M ${l.toss[0].x} ${l.toss[0].y} L ${l.toss[1].x} ${l.toss[1].y}` });
    const mid = { x: (l.toss[0].x + l.toss[1].x) / 2, y: (l.toss[0].y + l.toss[1].y) / 2 };
    const vertical = l.toss[0].x === l.toss[1].x;
    setAttrs(tossCaption, { x: vertical ? mid.x + 8 : mid.x, y: vertical ? mid.y + 4 : mid.y - 8, 'text-anchor': vertical ? 'start' : 'middle' });
  });

  // 경로 계산: 서비스 가장자리 → Kafka 띠 → 다른 서비스 가장자리.
  const busY = () => layout.bus.y + layout.bus.h / 2;
  const xOf = (k: Key) => layout.dropX[k] ?? layout.boxes[k].x;
  const edge = (k: Key): Point => {
    const b = layout.boxes[k];
    return { x: xOf(k), y: b.y < busY() ? b.y + b.h / 2 + 3 : b.y - b.h / 2 - 3 };
  };
  const onBus = (k: Key): Point => ({ x: xOf(k), y: busY() });

  const say = (html: string) => { note.innerHTML = html; replayClass(note, 'is-entering'); };
  const setLook = (k: Key, [text, cls]: Look) => {
    const n = nodes[k];
    n.setSub(text);
    ['is-temp', 'is-done', 'is-error'].forEach((c) => n.group.classList.toggle(c, c === cls));
  };
  const paint = (i: number) => {
    const lk = looks(scenario, i);
    (Object.keys(lk) as Key[]).forEach((k) => setLook(k, lk[k]));
  };
  const react = (k: Key, look: Look) => {
    setLook(k, look);
    nodes[k].flash(look[1] === 'is-error' ? 'is-shaking' : 'is-ok');
  };

  /** 한 서비스가 토픽에 발행하면 Kafka 를 거쳐 구독한 서비스들로 갈라져 갑니다. */
  const publish = async (alive: () => boolean, from: Key, topic: string, targets: [Key, Look | null][], tone: 'dep' | 'flow' | 'danger' = 'flow') => {
    const p = layer.spawn({ label: topic, tone, at: edge(from) });
    if (!(await p.travel([onBus(from)], 420, ease.out)) || !alive()) return false;
    void p.fade(260);
    const results = await Promise.all(targets.map(async ([to, look], i) => {
      await scene.pause(i * 170);
      if (!alive()) return false;
      const c = layer.spawn({ label: topic, tone, at: onBus(from) });
      if (!(await c.travel([onBus(to), edge(to)], 820, ease.standard)) || !alive()) return false;
      void c.land(false);
      if (look) react(to, look);
      return true;
    }));
    return results.every(Boolean) && alive();
  };

  /** 사용자의 HTTP 요청이 서비스로 들어옵니다. */
  const request = async (alive: () => boolean, to: 'order' | 'payment', label: string) => {
    const [a, b] = layout.user[to];
    const p = layer.spawn({ label, tone: 'dep', at: a });
    if (!(await p.travel([b], 520, ease.out)) || !alive()) return false;
    void p.land(false);
    return true;
  };

  /** Payment 가 Toss 를 부르고 결과를 받습니다. */
  const callToss = async (alive: () => boolean, label: string, ok: boolean, look: Look) => {
    const [a, b] = layout.toss;
    const p = layer.spawn({ label, tone: 'dep', at: a });
    if (!(await p.travel([b], 560, ease.out)) || !alive()) return false;
    p.relabel(ok ? '성공' : '실패', ok ? 'flow' : 'danger');
    react('toss', look);
    if (!(await p.travel([a], 520, ease.standard)) || !alive()) return false;
    void p.fade(260);
    return true;
  };

  const animate = async (i: number, alive: () => boolean) => {
    const L = looks(scenario, i);
    if (i === 0) {
      if (!(await request(alive, 'order', '주문 요청'))) return;
      react('order', ['PENDING', '']);
      await scene.pause(duration.beat);
      if (!alive()) return;
      await publish(alive, 'order', 'order.created', [['product', L.product], ['payment', L.payment], ['noti', L.noti]]);
      return;
    }
    if (i === 1) {
      await publish(alive, 'product', 'stock.reservation.result', [['order', L.order], ['payment', L.payment]]);
      return;
    }
    if (i === 2) {
      if (scenario === 'refund') {
        // 결제 승인과 사용자 취소가 겹칩니다.
        const cancel = (async () => {
          if (!(await request(alive, 'order', '취소 요청'))) return;
          react('order', L.order);
          await scene.pause(duration.beat);
          if (!alive()) return;
          await publish(alive, 'order', 'order.cancelled', [['product', L.product], ['noti', L.noti]], 'danger');
        })();
        const approve = (async () => {
          if (!(await request(alive, 'payment', '승인 요청'))) return;
          await scene.pause(duration.beat * 2);
          if (!alive()) return;
          if (!(await callToss(alive, '승인', true, L.toss))) return;
          react('payment', L.payment);
        })();
        await Promise.all([cancel, approve]);
        return;
      }
      if (!(await request(alive, 'payment', '승인 요청'))) return;
      const ok = scenario === 'success';
      if (!(await callToss(alive, '승인', ok, L.toss))) return;
      react('payment', L.payment);
      return;
    }
    // i === 3
    if (scenario === 'success') {
      await publish(alive, 'payment', 'payment.completed', [['order', L.order], ['product', L.product], ['noti', L.noti]]);
      return;
    }
    if (scenario === 'failure') {
      if (!(await publish(alive, 'payment', 'payment.failed', [['order', L.order], ['product', L.product], ['noti', L.noti]], 'danger'))) return;
      await scene.pause(duration.beat);
      if (!alive()) return;
      await publish(alive, 'order', 'order.cancelled', [['product', null], ['payment', null], ['noti', null]], 'dep');
      if (alive()) nodes.noti.setSub('건너뜀');
      await scene.pause(duration.read / 2);
      if (alive()) setLook('noti', L.noti);
      return;
    }
    // refund: 감지 → 요청 토픽 두 개 → 환불 원장 한 행 → Toss 취소 → payment.refunded
    if (!(await publish(alive, 'payment', 'payment.completed', [['order', ['원장 OPEN', 'is-temp']], ['product', ['감지 표시', 'is-temp']]]))) return;
    await scene.pause(duration.beat);
    if (!alive()) return;
    const requests = await Promise.all([
      publish(alive, 'order', 'order.compensation.requested', [['payment', null]], 'dep'),
      (async () => { await scene.pause(900); return alive() && publish(alive, 'product', 'stock.compensation.requested', [['payment', null]], 'dep'); })(),
    ]);
    if (!requests.every(Boolean)) return;
    react('payment', ['환불 REQUESTED', 'is-temp']);
    await scene.pause(duration.beat);
    if (!alive()) return;
    if (!(await callToss(alive, '취소', true, L.toss))) return;
    react('payment', L.payment);
    await scene.pause(duration.beat);
    if (!alive()) return;
    await publish(alive, 'payment', 'payment.refunded', [['order', L.order], ['product', L.product], ['noti', L.noti]]);
  };

  const enter = async (index: number, instant: boolean) => {
    const prev = current;
    current = index;
    const alive = scene.begin();
    layer.clear();
    say(NOTES[scenario][index]);
    if (instant || index !== prev + 1) {
      paint(index);
      return;
    }
    paint(index - 1);
    await animate(index, alive);
    if (alive()) paint(index);
  };

  const showDetails = () => stepDetails.forEach((el, i) => { el.textContent = STEP_DETAILS[scenario][i]; });

  createStepPlayer(demo, {
    dwell: (i) => (i === 3 ? duration.dwellLast + (scenario === 'refund' ? 4200 : 1200) : i === 2 ? duration.dwell + 1600 : duration.dwell + 1200),
    onStep: (i, instant) => { void enter(i, instant); },
  });

  scenarioButtons.forEach((button) => button.addEventListener('click', () => {
    const next = button.dataset.flowScenario as Scenario;
    scenarioButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    if (next === scenario) return;
    scenario = next;
    showDetails();
    // 경로가 갈리는 단계(결제·결과 전파)라면 그 단계를 새 경로로 다시 재생합니다.
    const index = current;
    if (index >= 2) {
      current = index - 1;
      void enter(index, false);
    } else {
      say(NOTES[scenario][index]);
    }
  }));

  watchNarrow(stage, (narrow) => {
    layout = LAYOUTS[narrow ? 'narrow' : 'wide'];
    setAttrs(root, { viewBox: `0 0 ${layout.view[0]} ${layout.view[1]}` });
    layer.clear();
    scene.redraw();
  });
  showDetails();
}
