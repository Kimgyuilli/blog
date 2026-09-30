import { animate, type AnimationSequence } from 'motion';
import { watchDemoPlayback, type DemoPlaybackState } from './blog/watch-demo-playback';

const stage = document.querySelector<HTMLElement>('[data-motion-join]');

if (stage) {
  const get = (selector: string) => stage.querySelector<HTMLElement>(selector)!;
  const orderRow = get('[data-order-row]');
  const orderKey = get('[data-order-key]');
  const customerRow = get('[data-customer-row]');
  const customerKey = get('[data-customer-key]');
  const linkLeft = get('[data-link-left]');
  const linkRight = get('[data-link-right]');
  const line = stage.querySelector<SVGPathElement>('[data-link-line]')!;
  const spark = stage.querySelector<SVGCircleElement>('[data-link-spark]')!;
  const resultRow = get('[data-result-row]');
  const resultCells = stage.querySelectorAll<HTMLElement>('[data-result-cell]');
  const check = get('[data-result-check]');
  const toggle = get('[data-motion-toggle]') as HTMLButtonElement;
  let playbackState: DemoPlaybackState = { visible: false, reducedMotion: false, shouldPlay: false };
  let pausedByUser = false;
  let controls: ReturnType<typeof animate> | undefined;

  const resetFrame = () => {
    stage.dataset.motionReady = 'true';
    orderRow.style.backgroundColor = 'rgba(56, 207, 167, 0)';
    customerRow.style.backgroundColor = 'rgba(56, 207, 167, 0)';
    orderKey.style.backgroundColor = 'rgba(56, 207, 167, 0)';
    customerKey.style.backgroundColor = 'rgba(56, 207, 167, 0)';
    line.style.strokeDashoffset = '290';
    spark.style.opacity = '0';
    spark.setAttribute('cx', '2');
    linkLeft.style.opacity = '0';
    linkRight.style.opacity = '0';
    resultRow.style.opacity = '0';
    resultRow.style.transform = 'translateY(18px)';
    resultCells.forEach((cell) => { cell.style.opacity = '0'; });
    check.style.opacity = '0';
  };

  const showStillFrame = () => {
    stage.dataset.motionReady = 'true';
    orderRow.style.backgroundColor = 'rgba(56, 207, 167, .12)';
    customerRow.style.backgroundColor = 'rgba(56, 207, 167, .12)';
    orderKey.style.backgroundColor = '#38cfa7';
    customerKey.style.backgroundColor = '#38cfa7';
    line.style.strokeDashoffset = '0';
    spark.style.opacity = '0';
    linkLeft.style.opacity = '1';
    linkRight.style.opacity = '1';
    resultRow.style.opacity = '1';
    resultRow.style.transform = 'translateY(0)';
    resultCells.forEach((cell) => { cell.style.opacity = '1'; });
    check.style.opacity = '1';
  };

  const sequence: AnimationSequence = [
    [orderRow, { backgroundColor: ['rgba(56, 207, 167, 0)', 'rgba(56, 207, 167, .14)'] }, { at: 0.25, duration: 0.48 }],
    [orderKey, { backgroundColor: ['rgba(56, 207, 167, 0)', '#38cfa7'], scale: [1, 1.2, 1] }, { at: 0.48, duration: 0.65 }],
    [linkLeft, { opacity: [0, 1], y: [8, 0] }, { at: 0.72, duration: 0.44 }],
    [line, { strokeDashoffset: [290, 0] }, { at: 1.12, duration: 0.9, ease: 'easeInOut' }],
    [spark, { opacity: [0, 1, 1, 0], cx: [2, 2, 288, 288] }, { at: 1.12, duration: 0.9, times: [0, 0.05, 0.9, 1] }],
    [linkRight, { opacity: [0, 1], y: [8, 0] }, { at: 1.77, duration: 0.4 }],
    [customerRow, { backgroundColor: ['rgba(56, 207, 167, 0)', 'rgba(56, 207, 167, .14)'] }, { at: 1.85, duration: 0.48 }],
    [customerKey, { backgroundColor: ['rgba(56, 207, 167, 0)', '#38cfa7'], scale: [1, 1.2, 1] }, { at: 1.94, duration: 0.65 }],
    [resultRow, { opacity: [0, 1], y: [18, 0] }, { at: 2.54, duration: 0.58, ease: 'easeOut' }],
    [resultCells, { opacity: [0, 1], y: [8, 0] }, { at: 2.71, duration: 0.52, delay: 0.08 }],
    [check, { opacity: [0, 1], scale: [0.55, 1.12, 1] }, { at: 3.09, duration: 0.5 }],
    [resultRow, { opacity: [1, 1] }, { at: 3.6, duration: 1.35 }],
    [resultRow, { opacity: [1, 0] }, { at: 5.05, duration: 0.45 }],
    [resultCells, { opacity: [1, 0] }, { at: 5.05, duration: 0.45 }],
    [check, { opacity: [1, 0] }, { at: 5.05, duration: 0.45 }],
    [orderRow, { backgroundColor: ['rgba(56, 207, 167, .14)', 'rgba(56, 207, 167, 0)'] }, { at: 5.05, duration: 0.45 }],
    [customerRow, { backgroundColor: ['rgba(56, 207, 167, .14)', 'rgba(56, 207, 167, 0)'] }, { at: 5.05, duration: 0.45 }],
    [orderKey, { backgroundColor: ['#38cfa7', 'rgba(56, 207, 167, 0)'] }, { at: 5.05, duration: 0.45 }],
    [customerKey, { backgroundColor: ['#38cfa7', 'rgba(56, 207, 167, 0)'] }, { at: 5.05, duration: 0.45 }],
    [linkLeft, { opacity: [1, 0] }, { at: 5.05, duration: 0.45 }],
    [linkRight, { opacity: [1, 0] }, { at: 5.05, duration: 0.45 }],
    [line, { strokeDashoffset: [0, 290] }, { at: 5.05, duration: 0.45 }],
  ];

  const syncPlayback = () => {
    if (playbackState.reducedMotion) {
      controls?.stop();
      controls = undefined;
      showStillFrame();
      toggle.hidden = true;
      return;
    }

    toggle.hidden = false;
    if (!controls) {
      resetFrame();
      controls = animate(sequence, { repeat: Infinity, repeatDelay: 0.35 });
    }
    if (playbackState.shouldPlay && !pausedByUser) controls.play();
    else controls.pause();
    toggle.textContent = pausedByUser ? '재생' : '일시정지';
    toggle.setAttribute('aria-label', pausedByUser ? '애니메이션 재생' : '애니메이션 일시정지');
  };

  toggle.addEventListener('click', () => {
    pausedByUser = !pausedByUser;
    syncPlayback();
  });
  watchDemoPlayback(stage, (state) => {
    if (playbackState.reducedMotion !== state.reducedMotion) {
      controls?.stop();
      controls = undefined;
    }
    playbackState = state;
    syncPlayback();
  }, { threshold: 0.15 });
}
