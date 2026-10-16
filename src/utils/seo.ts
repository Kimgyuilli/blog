export const SITE_TITLE = '개발 노트';
export const SITE_DESCRIPTION = '코드, 운영, 배포 경험을 정리하는 한국어 개발자 블로그';
export const DEFAULT_IMAGE = '/images/blog/og-default.svg';

export function canonicalUrl(pathname: string, site: URL) {
  const path = pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
  return new URL(path, site).href;
}

// JSON-LD is embedded in a script element; prevent content from closing the tag.
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
