// Image lightbox — click any article image to view it large.
export function setupImageZoom() {
  const lightbox = document.querySelector<HTMLElement>('.lightbox');
  const image = lightbox?.querySelector<HTMLImageElement>('.lightbox-image');
  const closeBtn = lightbox?.querySelector<HTMLButtonElement>('.lightbox-close');
  const images = document.querySelectorAll<HTMLImageElement>('.article-body img');
  if (!lightbox || !image || !closeBtn || images.length === 0) return;

  const open = (src: string, alt: string) => {
    image.src = src;
    image.alt = alt;
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('lightbox-visible'));
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lightbox.classList.remove('lightbox-visible');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      lightbox.hidden = true;
      image.src = '';
    }, 200);
  };

  images.forEach((img) => {
    if (img.closest('a')) return;
    img.classList.add('article-image-zoomable');
    img.addEventListener('click', () => open(img.currentSrc || img.src, img.alt));
  });

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) close();
  });
}
