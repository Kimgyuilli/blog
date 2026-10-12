// Keep the current heading visible without interrupting TOC browsing.
export function setupTocHighlight() {
  const toc = document.querySelector<HTMLElement>('.toc');
  if (!toc) return;
  const headings = Array.from(toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
    .map((link) => {
      const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      return heading ? { link, heading } : null;
    })
    .filter((item): item is { link: HTMLAnchorElement; heading: HTMLElement } => Boolean(item));
  if (headings.length === 0) return;

  let activeLink: HTMLAnchorElement | undefined;
  let pointerInside = false;
  let pauseUntil = 0;
  let resumeTimer = 0;
  let frame = 0;

  const revealActive = () => {
    const keyboardFocus = toc.contains(document.activeElement) && document.activeElement?.matches(':focus-visible');
    if (!activeLink || pointerInside || keyboardFocus || Date.now() < pauseUntil) return;
    if (toc.clientHeight === 0 || toc.scrollHeight <= toc.clientHeight) return;

    const bounds = toc.getBoundingClientRect();
    const item = activeLink.getBoundingClientRect();
    // Leave space for the edge fade and neighbouring entries.
    const margin = Math.min(36, toc.clientHeight / 4);
    const top = bounds.top + toc.clientTop + margin;
    const bottom = bounds.top + toc.clientTop + toc.clientHeight - margin;
    let delta = 0;
    if (item.top < top) delta = item.top - top;
    else if (item.bottom > bottom) delta = item.bottom - bottom;
    if (delta) {
      // Scroll only the sidebar; scrollIntoView can also move the article.
      toc.scrollTo({ top: toc.scrollTop + delta, behavior: 'instant' });
    }
  };

  const update = () => {
    frame = 0;
    const threshold = window.innerHeight * 0.28;
    let current = headings[0];
    for (const item of headings) {
      if (item.heading.getBoundingClientRect().top > threshold) break;
      current = item;
    }
    if (activeLink !== current.link) {
      activeLink?.classList.remove('toc-link-active');
      activeLink?.removeAttribute('aria-current');
      activeLink = current.link;
      activeLink.classList.add('toc-link-active');
      activeLink.setAttribute('aria-current', 'location');
    }
    revealActive();
  };
  const scheduleUpdate = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const pauseFollowing = () => {
    pauseUntil = Date.now() + 1200;
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(scheduleUpdate, 1200);
  };

  toc.addEventListener('pointerenter', () => { pointerInside = true; });
  toc.addEventListener('pointerleave', () => {
    pointerInside = false;
    pauseFollowing();
  });
  toc.addEventListener('pointercancel', () => {
    pointerInside = false;
    pauseFollowing();
  });
  toc.addEventListener('wheel', pauseFollowing, { passive: true });
  toc.addEventListener('touchstart', pauseFollowing, { passive: true });
  toc.addEventListener('touchmove', pauseFollowing, { passive: true });
  toc.addEventListener('touchend', pauseFollowing, { passive: true });
  toc.addEventListener('keydown', pauseFollowing);
  toc.addEventListener('focusout', pauseFollowing);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  // Re-evaluate when images, fonts, or demos change the article's height.
  const article = document.querySelector<HTMLElement>('.article-body');
  if (article) new ResizeObserver(scheduleUpdate).observe(article);
  update();
}
