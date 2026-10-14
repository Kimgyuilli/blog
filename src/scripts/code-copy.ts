// Code block copy buttons.
export function setupCopyButtons() {
  const body = document.querySelector<HTMLElement>('.article-body');
  if (!body) return;
  const blocks = body.querySelectorAll<HTMLPreElement>('pre');
  blocks.forEach((pre) => {
    if (pre.querySelector('.code-copy')) return;
    const code = pre.querySelector('code');
    if (!code || pre.dataset.language === 'mermaid') return;
    pre.dataset.language ||= code.className.match(/language-([\w-]+)/)?.[1] ?? 'text';
    const lineCount = code.querySelectorAll(':scope > .line').length;
    pre.style.setProperty('--line-number-digits', String(Math.max(3, String(lineCount).length)));
    // The code is the scrolling region; keep it reachable from the keyboard.
    pre.removeAttribute('tabindex');
    code.tabIndex = 0;
    code.setAttribute('role', 'region');
    code.setAttribute('aria-label', `${pre.dataset.language} 코드`);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = '복사';
    button.setAttribute('aria-label', '코드 복사');
    button.setAttribute('aria-live', 'polite');
    button.addEventListener('click', async () => {
      const text = code?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = '✓ 복사됨';
        button.setAttribute('aria-label', '코드 복사 완료');
        button.classList.add('code-copy-done');
        window.setTimeout(() => {
          button.textContent = '복사';
          button.setAttribute('aria-label', '코드 복사');
          button.classList.remove('code-copy-done');
        }, 1500);
      } catch {
        button.textContent = '실패';
        button.setAttribute('aria-label', '코드 복사 실패');
        window.setTimeout(() => {
          button.textContent = '복사';
          button.setAttribute('aria-label', '코드 복사');
        }, 1500);
      }
    });
    pre.appendChild(button);
  });
}
