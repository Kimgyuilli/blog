export type DemoPlaybackState = {
  visible: boolean;
  reducedMotion: boolean;
  shouldPlay: boolean;
};

type Options = { threshold?: number };

/** Keep each demo's playback in sync with its visibility and the user's motion preference. */
export function watchDemoPlayback(
  element: HTMLElement,
  onChange: (state: DemoPlaybackState) => void,
  { threshold = 0.2 }: Options = {},
): () => void {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = !('IntersectionObserver' in window);

  const notify = () => onChange({
    visible,
    reducedMotion: preference.matches,
    shouldPlay: visible && !document.hidden && !preference.matches,
  });

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? false;
        notify();
      }, { threshold })
    : undefined;

  observer?.observe(element);
  preference.addEventListener('change', notify);
  document.addEventListener('visibilitychange', notify);
  notify();

  return () => {
    observer?.disconnect();
    preference.removeEventListener('change', notify);
    document.removeEventListener('visibilitychange', notify);
  };
}
