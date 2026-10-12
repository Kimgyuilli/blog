// Code block copy buttons.
export function setupCopyButtons() {
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
