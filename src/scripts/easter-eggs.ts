function showToast(message: string, duration = 2400) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  window.setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

// 1. Brand dot — a single click greets the visitor.
function setupBrandDot() {
  const dot = document.querySelector<HTMLElement>('.brand-dot');
  if (!dot) return;
  dot.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    dot.classList.remove('brand-dot-pop');
    void dot.offsetWidth;
    dot.classList.add('brand-dot-pop');
    showToast('안녕하세요 👋');
  });
}

// 2. Article finished — toast after the reader reaches the end and lingers.
function setupArticleFinish() {
  const body = document.querySelector<HTMLElement>('.article-body');
  if (!body) return;
  const key = `read:${location.pathname}`;
  if (sessionStorage.getItem(key)) return;
  let observed = false;
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.height = '1px';
  body.appendChild(sentinel);
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !observed) {
        observed = true;
        window.setTimeout(() => {
          if (sessionStorage.getItem(key)) return;
          sessionStorage.setItem(key, '1');
          showToast('끝까지 읽어주셔서 감사합니다 🌱', 1000);
        }, 2000);
      }
    }
  });
  observer.observe(sentinel);
}

// 3. Console greeting.
function consoleGreeting() {
  const title = '%c개발 노트';
  const titleStyle =
    'color: #2e7d61; font-size: 18px; font-weight: 700; padding: 4px 0;';
  const subStyle = 'color: #475569; font-size: 12px;';
  console.log(title, titleStyle);
  console.log('%c코드가 궁금하시면 → https://github.com/Kimgyuilli/blog', subStyle);
}

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  run: (config: { nodes: HTMLElement[] }) => Promise<void>;
};

function findMermaidBlocks(body: HTMLElement) {
  return Array.from(body.querySelectorAll<HTMLPreElement>('pre')).filter((pre) => {
    const language = pre.dataset.language?.toLowerCase();
    const code = pre.querySelector('code');
    return language === 'mermaid' || code?.className.toLowerCase().includes('language-mermaid');
  });
}

// 6. Mermaid diagrams.
async function setupMermaidDiagrams() {
  const body = document.querySelector<HTMLElement>('.article-body');
  if (!body) return;

  const blocks = findMermaidBlocks(body);
  if (blocks.length === 0) return;

  const diagrams = blocks.map((pre) => {
    const diagram = document.createElement('div');
    diagram.className = 'mermaid-diagram mermaid';
    diagram.textContent = pre.textContent?.trim() ?? '';
    pre.replaceWith(diagram);
    return diagram;
  });

  try {
    const mermaidUrl = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    const module = (await import(/* @vite-ignore */ mermaidUrl)) as
      | { default?: MermaidApi }
      | MermaidApi;
    const mermaid = 'default' in module && module.default ? module.default : module;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'default',
    });
    await mermaid.run({ nodes: diagrams });
  } catch (error) {
    console.error('Mermaid rendering failed', error);
    diagrams.forEach((diagram) => {
      diagram.classList.add('mermaid-diagram-error');
    });
  }
}

// 7. Code block copy buttons.
function setupCopyButtons() {
  const body = document.querySelector<HTMLElement>('.article-body');
  if (!body) return;
  const blocks = body.querySelectorAll<HTMLPreElement>('pre');
  blocks.forEach((pre) => {
    if (pre.querySelector('.code-copy')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = '복사';
    button.setAttribute('aria-label', '코드 복사');
    button.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      const text = code?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = '✓ 복사됨';
        button.classList.add('code-copy-done');
        window.setTimeout(() => {
          button.textContent = '복사';
          button.classList.remove('code-copy-done');
        }, 1500);
      } catch {
        button.textContent = '실패';
        window.setTimeout(() => (button.textContent = '복사'), 1500);
      }
    });
    pre.appendChild(button);
  });
}

// 4. Reading progress bar at top of viewport.
function setupReadingProgress() {
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

// 5. TOC active heading highlight while scrolling.
function setupTocHighlight() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.toc a[href^="#"]'));
  const headings = links
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const heading = document.getElementById(id);
      return heading ? { link, heading } : null;
    })
    .filter((item): item is { link: HTMLAnchorElement; heading: HTMLElement } => Boolean(item));

  if (headings.length === 0) return;

  const setActive = (activeId: string) => {
    for (const { link } of headings) {
      const isActive = decodeURIComponent(link.hash.slice(1)) === activeId;
      link.classList.toggle('toc-link-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  };

  const visible = new Map<string, number>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          visible.set(id, entry.boundingClientRect.top);
        } else {
          visible.delete(id);
        }
      }

      if (visible.size > 0) {
        const [activeId] = Array.from(visible.entries()).sort((a, b) => a[1] - b[1])[0];
        setActive(activeId);
        return;
      }

      const current = headings
        .filter(({ heading }) => heading.getBoundingClientRect().top <= window.innerHeight * 0.28)
        .at(-1);
      if (current) setActive(current.heading.id);
    },
    { rootMargin: '-20% 0px -65% 0px', threshold: 0.01 },
  );

  headings.forEach(({ heading }) => observer.observe(heading));
  setActive(headings[0].heading.id);
}

// 8. Image lightbox — click any article image to view it large.
function setupImageZoom() {
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

function init() {
  setupReadingProgress();
  setupTocHighlight();
  setupBrandDot();
  setupArticleFinish();
  void setupMermaidDiagrams();
  setupCopyButtons();
  setupImageZoom();
  consoleGreeting();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
