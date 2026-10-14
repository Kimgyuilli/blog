// Enhance article links without changing their text, destination, or navigation behavior.
export function setupLinkMentions() {
  const links = document.querySelectorAll<HTMLAnchorElement>('.article-body a[href]');

  links.forEach((link) => {
    if (
      link.classList.contains('link-mention') ||
      link.closest('pre, code, .not-prose, [data-no-link-mention]') ||
      link.querySelector('img, svg, picture') ||
      !link.textContent?.trim()
    ) return;

    const href = link.getAttribute('href') ?? '';
    // Leave local navigation, footnotes, email, and other protocols alone.
    if (!/^https?:\/\//i.test(href)) return;

    let url: URL;
    try {
      url = new URL(href);
    } catch {
      return;
    }
    if (url.origin === window.location.origin || url.username || url.password) return;

    const icon = document.createElement('span');
    icon.className = 'link-mention-icon';
    icon.setAttribute('aria-hidden', 'true');

    const favicon = document.createElement('img');
    favicon.alt = '';
    favicon.width = 16;
    favicon.height = 16;
    favicon.loading = 'lazy';
    favicon.decoding = 'async';
    favicon.referrerPolicy = 'no-referrer';
    favicon.addEventListener('load', () => icon.classList.add('has-favicon'), { once: true });
    favicon.addEventListener('error', () => {
      icon.classList.remove('has-favicon');
      favicon.remove();
    }, { once: true });
    // Request only the site's icon, without forwarding the article URL to a third party.
    const iconUrl = new URL('/favicon.ico', url);
    iconUrl.protocol = 'https:';
    favicon.src = iconUrl.href;
    icon.append(favicon);

    link.classList.add('link-mention');
    if (!link.title) link.title = url.href;
    link.prepend(icon);
  });
}
