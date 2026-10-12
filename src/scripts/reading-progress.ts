// Reading progress bar at top of viewport.
export function setupReadingProgress() {
  const article = document.querySelector<HTMLElement>('.article-body');
  const progress = document.querySelector<HTMLElement>('.reading-progress-bar');
  if (!article || !progress) return;

  const update = () => {
    const rect = article.getBoundingClientRect();
    const articleTop = window.scrollY + rect.top;
    const articleHeight = article.offsetHeight;
    const readableHeight = Math.max(articleHeight - window.innerHeight * 0.65, 1);
    const current = window.scrollY - articleTop + window.innerHeight * 0.18;
    const ratio = Math.min(Math.max(current / readableHeight, 0), 1);
    progress.style.transform = `scaleX(${ratio})`;
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}
