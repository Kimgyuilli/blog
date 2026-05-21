import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from '@joplin/turndown-plugin-gfm';

const BLOG_ORIGIN = 'https://imdeepskyblue.tistory.com';
const CONTENT_DIR = 'src/content/blog';
const IMAGE_ROOT = 'public/images/blog';
const REDIRECTS_FILE = 'public/_redirects';

const turndown = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
  bulletListMarker: '-',
});

turndown.use(gfm);

turndown.addRule('tistoryFigure', {
  filter: ['figure'],
  replacement(content, node) {
    const img = node.querySelector?.('img');
    if (!img) return `\n\n${content}\n\n`;
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt') || '';
    return src ? `\n\n![${alt}](${src})\n\n` : '';
  },
});

turndown.addRule('emptyParagraph', {
  filter(node) {
    return node.nodeName === 'P' && node.textContent.replace(/\u00a0/g, '').trim() === '';
  },
  replacement() {
    return '\n\n';
  },
});

function decodeHtml(value = '') {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ');
}

function cleanText(value = '') {
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
}

function makeDescription($, article, fallback) {
  const paragraphs = [];
  article.find('p').each((_, node) => {
    const text = cleanText($(node).text());
    if (text && !text.startsWith('---')) paragraphs.push(text);
  });

  const source = paragraphs.join(' ') || fallback;
  return source.slice(0, 155).replace(/\s+\S*$/, '').trim();
}

function yamlString(value) {
  return JSON.stringify(value);
}

function toDateOnly(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function titleToSlug(title, id) {
  const ascii = title
    .normalize('NFKD')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();

  if (ascii.length >= 5) return ascii.slice(0, 72).replace(/-+$/g, '');
  return `tistory-${id}`;
}

function uniqueSlug(base, usedSlugs, id) {
  let slug = base;
  if (!usedSlugs.has(slug)) {
    usedSlugs.add(slug);
    return slug;
  }

  slug = `${base}-${id}`;
  usedSlugs.add(slug);
  return slug;
}

function detectImageExt(url, contentType) {
  const pathname = new URL(url).pathname.toLowerCase();
  const ext = pathname.match(/\.(png|jpe?g|gif|webp|svg)$/)?.[1];
  if (ext) return ext === 'jpeg' ? 'jpg' : ext;
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('jpeg')) return 'jpg';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('gif')) return 'gif';
  if (contentType?.includes('svg')) return 'svg';
  return 'png';
}

function parseTiara(html) {
  const match = html.match(/window\.tiara\s*=\s*(\{.*?\});<\/script>/s);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

function deriveTags({ title, category, tiaraTags }) {
  const tags = new Set();
  if (category) tags.add(category);

  for (const tag of tiaraTags ?? []) {
    const cleaned = cleanText(String(tag));
    if (cleaned) tags.add(cleaned);
  }

  const text = title.toLowerCase();
  const keywords = [
    'java',
    'spring',
    'springboot',
    'spring boot',
    'python',
    'react',
    'aws',
    'git',
    'docker',
    'redis',
    'kafka',
    'kubernetes',
    'msa',
    'codex',
    'claude',
    'llm',
    'wiki',
    'rag',
    'mdc',
    '백준',
    '알고리즘',
  ];

  for (const keyword of keywords) {
    if (text.includes(keyword)) tags.add(keyword.replace(/\s+/g, '-'));
  }

  return Array.from(tags).slice(0, 6);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 Tistory migration script',
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 Tistory migration script',
      referer: BLOG_ORIGIN,
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') ?? '',
  };
}

async function getPostUrls() {
  const sitemap = await fetchText(`${BLOG_ORIGIN}/sitemap.xml`);
  return Array.from(sitemap.matchAll(new RegExp(`${escapeRegExp(BLOG_ORIGIN)}/([0-9]+)`, 'g')))
    .map((match) => ({ id: match[1], url: `${BLOG_ORIGIN}/${match[1]}` }))
    .filter((post, index, posts) => posts.findIndex((item) => item.id === post.id) === index)
    .sort((a, b) => Number(b.id) - Number(a.id));
}

async function getExistingRedirectIds() {
  try {
    const redirects = await fs.readFile(REDIRECTS_FILE, 'utf8');
    return new Set(Array.from(redirects.matchAll(/^\/([0-9]+)\s+/gm)).map((match) => match[1]));
  } catch {
    return new Set();
  }
}

async function getExistingSlugs() {
  const slugs = new Set();
  const files = await fs.readdir(CONTENT_DIR);
  for (const file of files.filter((name) => name.endsWith('.md') || name.endsWith('.mdx'))) {
    const contents = await fs.readFile(path.join(CONTENT_DIR, file), 'utf8');
    const slug = contents.match(/^slug:\s*"?([^"\n]+)"?/m)?.[1];
    if (slug) slugs.add(slug.trim());
  }
  return slugs;
}

async function migratePost({ id, url }, usedSlugs) {
  const html = await fetchText(url);
  const $ = load(html, { decodeEntities: false });
  const tiara = parseTiara(html);
  const entry = tiara.entry ?? {};

  const title = cleanText(
    $('meta[property="og:title"]').attr('content') || $('meta[name="title"]').attr('content') || $('h1').first().text(),
  );
  if (!title) throw new Error(`Missing title: ${url}`);

  const pubDate = toDateOnly($('meta[property="article:published_time"]').attr('content') || $('meta[property="og:regDate"]').attr('content'));
  const category = cleanText(entry.categoryName || '');
  const tags = deriveTags({ title, category, tiaraTags: entry.tags });

  const slug = uniqueSlug(titleToSlug(title, id), usedSlugs, id);
  const article = $('.tt_article_useless_p_margin.contents_style').first();
  if (!article.length) throw new Error(`Missing article body: ${url}`);

  const description = makeDescription($, article, title);

  article.find('script, style, iframe, .container_postbtn, .another_category').remove();
  article.find('hr').replaceWith('<p>---</p>');

  const imageDir = path.join(IMAGE_ROOT, slug);
  await fs.mkdir(imageDir, { recursive: true });

  let imageIndex = 1;
  for (const img of article.find('img').toArray()) {
    const $img = $(img);
    const src = $img.attr('src');
    if (!src || src.includes('no-image-v1.png')) continue;

    const imageUrl = src.startsWith('//') ? `https:${src}` : src;
    try {
      const { buffer, contentType } = await fetchBuffer(imageUrl);
      const ext = detectImageExt(imageUrl, contentType);
      const imageName = `image-${String(imageIndex).padStart(2, '0')}.${ext}`;
      const imagePath = path.join(imageDir, imageName);
      await fs.writeFile(imagePath, buffer);
      $img.attr('src', `/images/blog/${slug}/${imageName}`);
      $img.attr('alt', $img.attr('alt') || title);
      $img.removeAttr('srcset');
      $img.removeAttr('onerror');
      $img.removeAttr('data-origin-width');
      $img.removeAttr('data-origin-height');
      imageIndex += 1;
    } catch (error) {
      console.warn(`Image failed (${id}): ${imageUrl} ${error.message}`);
    }
  }

  const bodyHtml = article.html() ?? '';
  const markdown = turndown
    .turndown(bodyHtml)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
  const image = markdown.match(/!\[[^\]]*]\((\/images\/blog\/[^)]+)\)/)?.[1];

  const frontmatter = [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description || title)}`,
    image ? `image: ${yamlString(image)}` : undefined,
    `pubDate: ${pubDate}`,
    `tags: [${tags.map(yamlString).join(', ')}]`,
    'draft: false',
    `slug: ${yamlString(slug)}`,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  await fs.writeFile(path.join(CONTENT_DIR, `${slug}.md`), `${frontmatter}${markdown}\n`);

  return {
    id,
    slug,
    title,
    redirects: [`/${id} /blog/${slug}/ 301`, `/m/${id} /blog/${slug}/ 301`],
  };
}

async function appendRedirects(migrated) {
  if (migrated.length === 0) return;
  const redirects = await fs.readFile(REDIRECTS_FILE, 'utf8');
  const lines = new Set(redirects.split('\n').map((line) => line.trim()));
  const additions = migrated.flatMap((post) => post.redirects).filter((line) => !lines.has(line));
  if (additions.length === 0) return;
  const next = `${redirects.trimEnd()}\n${additions.join('\n')}\n`;
  await fs.writeFile(REDIRECTS_FILE, next);
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : Number.POSITIVE_INFINITY;
  const existingRedirectIds = await getExistingRedirectIds();
  const usedSlugs = await getExistingSlugs();
  const postUrls = await getPostUrls();
  const targets = postUrls.filter((post) => !existingRedirectIds.has(post.id)).slice(0, limit);

  console.log(`Found ${postUrls.length} posts, ${targets.length} pending.`);

  const migrated = [];
  const failed = [];
  for (const post of targets) {
    try {
      const result = await migratePost(post, usedSlugs);
      migrated.push(result);
      console.log(`✓ ${post.id} -> ${result.slug}`);
    } catch (error) {
      failed.push({ ...post, error: error.message });
      console.error(`✗ ${post.id}: ${error.message}`);
    }
  }

  await appendRedirects(migrated);

  console.log(`Migrated ${migrated.length} posts.`);
  if (failed.length > 0) {
    console.log(`Failed ${failed.length} posts:`);
    for (const failure of failed) {
      console.log(`- ${failure.url}: ${failure.error}`);
    }
    process.exitCode = 1;
  }
}

await main();
