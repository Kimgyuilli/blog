#!/usr/bin/env node
/**
 * 글 게시.
 *
 * 썸네일을 1600x900 으로 잘라 넣고, draft 를 풀고, 문체 검사와 빌드를 통과하면 커밋하고 push 합니다.
 * 사진을 고르는 일과 push 승인은 사람이 합니다(blog-post-pipeline 스킬의 게이트 C).
 *
 *   node scripts/publish-post.mjs <post.mdx> --image <URL 또는 로컬 경로> [--focus-y 0.45] [--focus-x 0.5]
 *                                 [--message "커밋 메시지"] [--no-git]
 *
 *   --focus-y/x  자를 때 남길 중심 위치(0~1). 세로 사진에서 피사체가 가운데보다 위에 있으면 --focus-y 0.4 처럼 줍니다.
 *   --no-git     썸네일, frontmatter, 검사, 빌드까지만 하고 커밋과 push 는 하지 않습니다.
 *
 * Unsplash 사진 페이지는 봇 차단 때문에 바로 받을 수 없습니다. 페이지에서 images.unsplash.com/photo-... 주소를 찾아
 * `?fm=jpg&q=90&w=2400` 을 붙여 넘기세요.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const postArg = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const image = option('--image');
if (!postArg || !image) {
  console.error('사용법: node scripts/publish-post.mjs <post.mdx> --image <URL|경로> [--focus-y 0.45] [--focus-x 0.5] [--message "..."] [--no-git]');
  process.exit(2);
}
const post = resolve(postArg);
const focusY = Number(option('--focus-y') ?? 0.5);
const focusX = Number(option('--focus-x') ?? 0.5);
const noGit = args.includes('--no-git');

const run = (cmd, cmdArgs, opts = {}) => {
  console.log(`$ ${cmd} ${cmdArgs.join(' ')}`);
  return execFileSync(cmd, cmdArgs, { cwd: root, stdio: opts.capture ? 'pipe' : 'inherit', encoding: 'utf8' });
};

// 1. frontmatter 에서 slug 를 읽습니다.
let source = readFileSync(post, 'utf8');
const front = source.match(/^---\n([\s\S]*?)\n---\n/);
if (!front) throw new Error('frontmatter 가 없습니다');
const slug = front[1].match(/^slug:\s*['"]?([^'"\n]+)['"]?\s*$/m)?.[1];
if (!slug) throw new Error('frontmatter 에 slug 가 없습니다');

// 2. 썸네일을 받아 16:9 로 잘라 1600x900 으로 저장합니다.
const input = /^https?:\/\//.test(image)
  ? Buffer.from(await (await fetch(image, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => {
      if (!r.ok) throw new Error(`이미지 다운로드 실패: HTTP ${r.status}`);
      return r;
    })).arrayBuffer())
  : readFileSync(resolve(image));
const { width, height } = await sharp(input).metadata();
let cropW = width;
let cropH = Math.round((width * 9) / 16);
if (cropH > height) {
  cropH = height;
  cropW = Math.round((height * 16) / 9);
}
const clamp = (v, max) => Math.max(0, Math.min(max, v));
const left = clamp(Math.round(width * focusX - cropW / 2), width - cropW);
const top = clamp(Math.round(height * focusY - cropH / 2), height - cropH);
const outDir = join(root, 'public/images/blog', slug);
mkdirSync(outDir, { recursive: true });
const thumbnail = join(outDir, 'thumbnail.jpg');
await sharp(input).extract({ left, top, width: cropW, height: cropH }).resize(1600, 900).jpeg({ quality: 85, mozjpeg: true }).toFile(thumbnail);
console.log(`썸네일: ${relative(root, thumbnail)} (원본 ${width}x${height}, 자른 영역 ${cropW}x${cropH} at ${left},${top})`);

// 3. frontmatter 의 image 와 draft 를 바꿉니다.
const imageLine = `image: "/images/blog/${slug}/thumbnail.jpg"`;
let fm = front[1];
fm = /^image:/m.test(fm) ? fm.replace(/^image:.*$/m, imageLine) : fm.replace(/^(pubDate:.*)$/m, `${imageLine}\n$1`);
fm = /^draft:/m.test(fm) ? fm.replace(/^draft:.*$/m, 'draft: false') : `${fm}\ndraft: false`;
source = source.replace(front[0], `---\n${fm}\n---\n`);
writeFileSync(post, source);
console.log('frontmatter: image 추가, draft: false');

// 4. 문체 검사(error 가 있으면 중단)와 빌드.
run('node', ['scripts/lint-post.mjs', post]);
try {
  run('npm', ['run', 'build'], { capture: true });
} catch (error) {
  console.error(error.stdout ?? '', error.stderr ?? '');
  throw new Error('빌드 실패');
}
if (!existsSync(join(root, 'dist/client/blog', slug, 'index.html'))) throw new Error(`빌드 결과에 /blog/${slug}/ 가 없습니다`);

if (noGit) {
  console.log('--no-git: 커밋과 push 는 하지 않았습니다.');
  process.exit(0);
}

// 5. 이 글과 글이 import 한 컴포넌트 폴더, 썸네일만 커밋합니다.
const components = [...new Set([...source.matchAll(/^import \w+ from '@\/([^']+)\/[^/']+\.astro';/gm)].map((m) => join('src', m[1])))];
const paths = [relative(root, post), relative(root, outDir), ...components];
run('git', ['add', '--', ...paths]);
const message = option('--message') ?? `publish ${slug} post with thumbnail${components.length ? ' and demos' : ''}`;
run('git', ['commit', '-m', message]);
run('git', ['fetch', 'origin']);
run('git', ['rebase', 'origin/main']);
run('git', ['push', 'origin', 'HEAD:main']);
console.log(run('git', ['log', '-1', '--oneline'], { capture: true }).trim());
