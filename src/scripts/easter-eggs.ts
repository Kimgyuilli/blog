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

// 6. Code block copy buttons.
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

function init() {
  setupBrandDot();
  setupArticleFinish();
  setupCopyButtons();
  consoleGreeting();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
