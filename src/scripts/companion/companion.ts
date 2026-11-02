import { createSpritePlayer } from './player';
import type { AnimationName } from './sprite';

const STORAGE_KEY = 'companion:hidden';
const DEMO_SELECTOR = '[data-blog-demo], [data-db-auto-motion], [data-motion-join]';

// 스크롤 속도(px/s)와 멈춘 시간(ms)의 경계
const WALK_SPEED = 60;
const RUN_SPEED = 2600;
const SCROLL_GAP = 220;
const SIT_AFTER = 6000;
const SLEEP_AFTER = 30000;
// 걷기와 달리기가 깜빡이며 바뀌지 않게 한 동작을 최소한 이만큼 유지합니다.
const MIN_HOLD = 360;
const TICK = 150;

function readHidden(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeHidden(hidden: boolean) {
  try {
    if (hidden) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장하지 못해도 이번 방문에서는 숨김이 유지됩니다.
  }
}

/**
 * 목차 아래의 도트 캐릭터가 읽는 흐름에 반응하게 합니다.
 * 스크롤 속도로 걷기·달리기, 멈춘 시간으로 앉기·잠자기, 화면 속 데모로 구경을 고르고,
 * 목차 클릭과 완독에는 한 번씩 깜짝·축하로 반응합니다.
 */
export function setupCompanion() {
  const root = document.querySelector<HTMLElement>('[data-companion-root]');
  const stage = root?.querySelector<HTMLElement>('.companion-stage');
  const toggle = root?.querySelector<HTMLButtonElement>('.companion-toggle');
  const article = document.querySelector<HTMLElement>('.article-body');
  if (!root || !stage || !toggle || !article) return;

  const wide = window.matchMedia('(min-width: 981px)');
  const player = createSpritePlayer(stage);

  let hidden = readHidden();
  let timer = 0;
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let lastScrollAt = performance.now();
  let speed = 0;
  let current: AnimationName | null = null;
  let changedAt = 0;
  let reaction: { name: AnimationName; until: number } | null = null;
  const visibleDemos = new Set<Element>();

  const react = (name: AnimationName, ms: number) => {
    reaction = { name, until: performance.now() + ms };
    tick();
  };

  const choose = (now: number): AnimationName => {
    if (reaction && now < reaction.until) return reaction.name;
    reaction = null;
    const still = now - lastScrollAt;
    if (still < SCROLL_GAP) {
      if (speed > RUN_SPEED) return 'run';
      if (speed > WALK_SPEED) return 'walk';
      return 'idle';
    }
    if (visibleDemos.size > 0) return 'watch';
    if (still > SLEEP_AFTER) return 'sleep';
    if (still > SIT_AFTER) return 'sit';
    return 'idle';
  };

  function tick() {
    const now = performance.now();
    const next = choose(now);
    const isReaction = reaction?.name === next;
    if (next !== current && (isReaction || now - changedAt > MIN_HOLD)) {
      current = next;
      changedAt = now;
      root.dataset.state = next;
      player.play(next, { restart: isReaction });
    }
  }

  const active = () => !hidden && wide.matches && !document.hidden;

  const start = () => {
    if (timer || !active()) return;
    timer = window.setInterval(tick, TICK);
    tick();
  };

  const stop = () => {
    window.clearInterval(timer);
    timer = 0;
  };

  const sync = () => (active() ? start() : stop());

  window.addEventListener('scroll', () => {
    const now = performance.now();
    const elapsed = Math.max(now - lastTime, 16);
    const distance = Math.abs(window.scrollY - lastY);
    const instant = (distance / elapsed) * 1000;
    lastY = window.scrollY;
    lastTime = now;
    // Home/End 키나 링크로 한 번에 건너뛰면 달리기 대신 놀랍니다.
    if (distance > window.innerHeight * 1.5) {
      speed = 0;
      lastScrollAt = now;
      react('alert', 900);
      return;
    }
    // 끊긴 뒤 다시 시작한 스크롤은 이전 속도를 이어받지 않습니다.
    speed = now - lastScrollAt > SCROLL_GAP ? instant : speed * 0.6 + instant * 0.4;
    lastScrollAt = now;
  }, { passive: true });

  document.querySelector('.toc')?.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a[href^="#"]')) react('alert', 900);
  });

  stage.addEventListener('click', () => react('wave', 1400));

  if ('IntersectionObserver' in window) {
    const demoObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleDemos.add(entry.target);
        else visibleDemos.delete(entry.target);
      }
    }, { threshold: 0.5 });
    article.querySelectorAll(DEMO_SELECTOR).forEach((demo) => demoObserver.observe(demo));

    const end = document.createElement('div');
    end.setAttribute('aria-hidden', 'true');
    article.appendChild(end);
    const endObserver = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      endObserver.disconnect();
      react('cheer', 2600);
    });
    endObserver.observe(end);
  }

  const render = () => {
    root.classList.toggle('is-hidden', hidden);
    toggle.textContent = hidden ? '새싹 부르기' : '숨기기';
    toggle.setAttribute('aria-label', hidden ? '도트 캐릭터 다시 보이기' : '도트 캐릭터 숨기기');
  };

  toggle.addEventListener('click', () => {
    hidden = !hidden;
    writeHidden(hidden);
    render();
    if (hidden) {
      stop();
      player.stop();
      current = null;
    } else {
      sync();
      react('wave', 1400);
    }
  });

  wide.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);

  render();
  sync();
  if (active()) react('wave', 1600);
}
