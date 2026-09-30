import { watchDemoPlayback } from './blog/watch-demo-playback';

document.querySelectorAll<HTMLElement>('[data-db-auto-motion]').forEach((motion) => {
  watchDemoPlayback(motion, ({ shouldPlay }) => {
    motion.classList.toggle('is-running', shouldPlay);
  });
});
