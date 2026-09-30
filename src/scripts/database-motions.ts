document.querySelectorAll<HTMLElement>('[data-db-auto-motion]').forEach((motion) => {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    motion.classList.toggle('is-running', entries[0]?.isIntersecting ?? false);
  }, { threshold: 0.2 });

  observer.observe(motion);
});
