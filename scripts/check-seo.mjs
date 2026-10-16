import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = existsSync('dist/client/index.html') ? 'dist/client' : 'dist';
const read = (file) => readFile(path.join(root, file), 'utf8');
const home = load(await read('index.html'));
const site = new URL(home('link[rel="canonical"]').attr('href'));
const sitemapIndex = load(await read('sitemap-index.xml'), { xml: true });
const sitemapUrls = new Set();
for (const loc of sitemapIndex('sitemap > loc').toArray()) {
  const url = new URL(sitemapIndex(loc).text());
  assert.equal(url.origin, site.origin);
  const sitemap = load(await read(decodeURIComponent(url.pathname.slice(1))), { xml: true });
  for (const entry of sitemap('url > loc').toArray()) sitemapUrls.add(sitemap(entry).text());
}
assert(sitemapUrls.size > 0, 'Sitemap must contain pages');
assert((await read('robots.txt')).includes(`Sitemap: ${new URL('sitemap-index.xml', site).href}`));

async function htmlFiles(directory = '') {
  const files = [];
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    // The portfolio is an independently built application.
    if (entry.isDirectory() && !['portfolio', '_astro'].includes(entry.name)) files.push(...await htmlFiles(file));
    else if (entry.isFile() && file.endsWith('.html')) files.push(file);
  }
  return files;
}

const canonicalUrls = new Set();
let articles = 0;
for (const file of await htmlFiles()) {
  assert(!/^(preview|dev)\//.test(file), `Development page in production: ${file}`);
  const $ = load(await read(file));
  assert.equal($('html').attr('lang'), 'ko', file);
  assert.equal($('head title').length, 1, file);
  assert($('meta[name="description"]').attr('content')?.trim(), file);
  const schemas = $('script[type="application/ld+json"]').toArray().map((node) => JSON.parse($(node).text()));
  if (file === '404.html') {
    assert($('meta[name="robots"]').attr('content')?.includes('noindex'), file);
    assert.equal($('link[rel="canonical"]').length, 0, file);
    continue;
  }
  assert(!$('meta[name="robots"]').attr('content')?.includes('noindex'), file);
  assert.equal($('link[rel="canonical"]').length, 1, file);
  const canonical = $('link[rel="canonical"]').attr('href');
  const expectedPath = file === 'index.html' ? '/' : `/${file.replace(/index\.html$/, '')}`;
  assert.equal(canonical, new URL(expectedPath, site).href, file);
  assert(!canonicalUrls.has(canonical), `Duplicate canonical: ${canonical}`);
  canonicalUrls.add(canonical);
  assert(sitemapUrls.has(canonical), `Missing from sitemap: ${canonical}`);
  assert.equal($('meta[property="og:url"]').attr('content'), canonical, file);
  for (const link of $('a[href^="/blog/tag/"]').toArray()) {
    const url = new URL($(link).attr('href'), site);
    assert.equal(decodeURIComponent(url.pathname), decodeURIComponent(url.pathname).toLowerCase(), file);
    assert(sitemapUrls.has(url.href), `Tag link missing from sitemap: ${url.href} in ${file}`);
  }
  if (file === 'index.html') assert(schemas.some((schema) => schema['@type'] === 'WebSite'), file);
  if (file.startsWith('blog/') && !file.startsWith('blog/tag/')) {
    articles++;
    assert.equal($('meta[property="og:type"]').attr('content'), 'article', file);
    const article = schemas.find((schema) => schema['@type'] === 'BlogPosting');
    assert(article, `Missing BlogPosting: ${file}`);
    assert.equal(article.headline, $('h1').first().text(), file);
    assert.equal(article.mainEntityOfPage['@id'], canonical, file);
    assert.equal(article.datePublished, $('meta[property="article:published_time"]').attr('content'), file);
    assert(Number.isFinite(Date.parse(article.datePublished)), file);
    assert(schemas.some((schema) => schema['@type'] === 'BreadcrumbList'), file);
  }
}
assert(articles > 0, 'No published articles checked');
assert.deepEqual(sitemapUrls, canonicalUrls, 'Sitemap must contain only canonical, indexable blog pages');
console.log(`SEO checks passed: ${canonicalUrls.size} pages, ${articles} articles, robots.txt and sitemap.`);
