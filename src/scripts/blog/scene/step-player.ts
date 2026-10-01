import { watchDemoPlayback } from '../watch-demo-playback';

type Options = {
  /** How long each step stays on screen before auto-advancing. */
  dwell: (index: number) => number;
  /** Draw step `index`. `instant` is true when motion should be skipped. */
  onStep: (index: number, instant: boolean) => void;
};

/**
 * Timeline playback for `[data-step]` buttons and a `[data-step-toggle]` button inside `demo`.
 * Auto-advances while visible, stops on user choice, and shows the last step for reduced motion.
 */
export function createStepPlayer(demo: HTMLElement, { dwell, onStep }: Options) {
  const buttons = [...demo.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const toggle = demo.querySelector<HTMLButtonElement>('[data-step-toggle]');
  const count = buttons.length;
  let current = -1;
  let canPlay = false;
  let reducedMotion = false;
  let pausedByUser = false;
  let timer: number | undefined;

  const mark = () => {
    buttons.forEach((button, index) => {
      button.setAttribute('aria-current', index === current ? 'step' : 'false');
      button.classList.toggle('is-past', index < current);
      button.classList.toggle('is-timing', index === current && canPlay && !pausedByUser && !reducedMotion);
      button.style.setProperty('--dwell', `${dwell(index)}ms`);
    });
  };
  const show = (index: number, instant: boolean) => {
    if (index === current) return;
    current = index;
    onStep(index, instant || reducedMotion);
  };
  const updateToggle = () => {
    if (!toggle) return;
    toggle.hidden = reducedMotion;
    toggle.textContent = pausedByUser ? '▶ 재생' : '❚❚ 일시정지';
    toggle.setAttribute('aria-label', pausedByUser ? '자동 재생 시작' : '자동 재생 일시정지');
  };
  const schedule = () => {
    window.clearTimeout(timer);
    // Restart the CSS progress fill from zero.
    buttons[current]?.classList.remove('is-timing');
    void buttons[current]?.offsetWidth;
    mark();
    if (!canPlay || pausedByUser || reducedMotion) return;
    timer = window.setTimeout(() => {
      show(current === count - 1 ? 0 : current + 1, false);
      schedule();
    }, dwell(current));
  };

  buttons.forEach((button, index) => button.addEventListener('click', () => {
    pausedByUser = true;
    show(index, false);
    updateToggle();
    schedule();
  }));
  toggle?.addEventListener('click', () => {
    pausedByUser = !pausedByUser;
    if (!pausedByUser && current === count - 1) show(0, false);
    updateToggle();
    schedule();
  });

  show(0, true);
  watchDemoPlayback(demo, ({ shouldPlay, reducedMotion: prefersReduced }) => {
    canPlay = shouldPlay;
    if (reducedMotion !== prefersReduced) {
      reducedMotion = prefersReduced;
      if (reducedMotion) show(count - 1, true);
    }
    updateToggle();
    schedule();
  }, { threshold: 0.35 });
}
