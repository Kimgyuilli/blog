/**
 * HTML 요소를 컨테이너 사이로 옮길 때 쓰는 FLIP 이동.
 * 다른 컨테이너로 간 요소는 위로 살짝 뜨며 호를 그려 날아가 착지하고(is-flying → is-landed),
 * 같은 컨테이너에 남은 요소는 빈자리를 메우듯 짧게 미끄러집니다.
 */
import { duration, ease, prefersReducedMotion, replayClass, tween, type Tween } from './core';

export function createFlipMover(elements: Iterable<HTMLElement>) {
  const items = [...elements];
  const motions = new Map<HTMLElement, Tween>();

  /** `mutate` 안에서 DOM을 옮기면, 옮기기 전 위치에서 새 위치로 움직입니다. */
  return function move(mutate: () => void, { instant = false } = {}) {
    // First: 지금 보이는 위치(진행 중인 변형 포함)를 기록합니다.
    const first = new Map(items.map((item) => [item, item.getBoundingClientRect()]));
    const parents = new Map(items.map((item) => [item, item.parentElement]));
    motions.forEach((motion) => motion.cancel());
    motions.clear();
    items.forEach((item) => { item.style.transform = ''; item.classList.remove('is-flying'); });

    mutate();
    if (instant || prefersReducedMotion()) return;

    // Last → Invert → Play
    items.forEach((item) => {
      const before = first.get(item)!;
      const after = item.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      const flying = parents.get(item) !== item.parentElement;
      const lift = flying ? Math.min(60, Math.hypot(dx, dy) * 0.18) : 0;
      if (flying) item.classList.add('is-flying');
      item.style.transform = `translate(${dx}px, ${dy}px)`;
      const motion = tween(flying ? duration.fly : duration.reflow, (t) => {
        const arc = Math.sin(Math.PI * t);
        item.style.transform = `translate(${dx * (1 - t)}px, ${dy * (1 - t) - lift * arc}px) scale(${1 + 0.08 * arc})`;
      }, ease.standard);
      motions.set(item, motion);
      motion.done.then((finished) => {
        if (!finished) return;
        item.style.transform = '';
        item.classList.remove('is-flying');
        if (flying) replayClass(item, 'is-landed');
      });
    });
  };
}
