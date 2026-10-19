#!/usr/bin/env node
/**
 * 글 파이프라인(blog-post-pipeline 스킬)의 단계 기록과 검사.
 *
 * 각 단계를 마칠 때 그 단계의 산출물을 기록하고, 게시 직전에 모든 단계가 기록됐는지 검사합니다.
 * 기록은 .pipeline/<slug>/ 에 남고 git 에 올리지 않습니다.
 *
 *   node scripts/pipeline-record.mjs <post.mdx> <단계> --file <산출물>   단계를 기록합니다
 *   node scripts/pipeline-record.mjs <post.mdx> --status                   기록 상태를 봅니다
 *   node scripts/pipeline-record.mjs <post.mdx> --check                    게시 전 검사(실패하면 exit 1)
 *
 * 단계(순서대로):
 *   coverage    재료 목록. 수치와 사건마다 출처(원래 작업, 재현, CI)와 세는 대상을 적은 표
 *   gate-a      게이트 A 목차와 데모 계획, 사용자 결정. 사용자가 승인을 생략했다면 그 말과 스스로 한 점검 결과
 *   humanize    첫 윤문의 요약과 guard:rewrite check 출력
 *   fact-audit  사실 검증 리뷰어의 보고
 *   cold-read   처음 읽는 독자 리뷰어의 보고
 *   gate-b      게이트 B 표와 사용자가 고른 항목
 *   final-pass  게이트 C 직전, 모든 수정이 끝난 뒤 돌린 윤문의 요약과 guard:rewrite check 출력
 *
 * 검사는 산출물의 내용이 좋은지 판단하지 않습니다. 단계를 건너뛰지 않았는지, 순서가 맞는지,
 * 마지막 윤문 뒤에 본문이 바뀌지 않았는지만 봅니다.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const STEPS = ['coverage', 'gate-a', 'humanize', 'fact-audit', 'cold-read', 'gate-b', 'final-pass'];
/** guard:rewrite check 가 통과했다는 출력이 산출물에 있어야 하는 단계. */
const NEEDS_GUARD = new Set(['humanize', 'final-pass']);

const slugOf = (source) => {
  const front = source.match(/^---\n([\s\S]*?)\n---\n/);
  const slug = front?.[1].match(/^slug:\s*['"]?([^'"\n]+)['"]?\s*$/m)?.[1];
  if (!slug) throw new Error('frontmatter 에 slug 가 없습니다');
  return slug;
};

/** frontmatter 를 뺀 본문의 해시. 게시 단계가 frontmatter 를 고쳐도 바뀌지 않습니다. */
export const bodyHash = (source) =>
  createHash('sha256').update(source.replace(/^---\n[\s\S]*?\n---\n/, '')).digest('hex').slice(0, 16);

const dirFor = (slug) => join(root, '.pipeline', slug);
const statePath = (slug) => join(dirFor(slug), 'state.json');
const readState = (slug) => (existsSync(statePath(slug)) ? JSON.parse(readFileSync(statePath(slug), 'utf8')) : {});

/** 게시 전 검사. 문제 목록을 돌려줍니다. 빈 배열이면 통과입니다. */
export function checkPipeline(postPath) {
  const source = readFileSync(postPath, 'utf8');
  const slug = slugOf(source);
  const state = readState(slug);
  const problems = [];
  for (const step of STEPS) {
    if (!state[step]) problems.push(`${step} 단계 기록이 없습니다`);
  }
  // 순서: 앞 단계가 뒤 단계보다 먼저 기록돼야 합니다. 같은 단계를 다시 기록하면 시각이 갱신됩니다.
  const order = [['gate-a', 'fact-audit'], ['gate-a', 'cold-read'], ['fact-audit', 'gate-b'], ['cold-read', 'gate-b'], ['gate-b', 'final-pass']];
  for (const [before, after] of order) {
    if (state[before] && state[after] && state[before].at > state[after].at) {
      problems.push(`${before} 가 ${after} 보다 나중에 기록됐습니다. ${after} 단계를 다시 하고 기록하세요`);
    }
  }
  if (state['final-pass'] && state['final-pass'].bodyHash !== bodyHash(source)) {
    problems.push('마지막 윤문(final-pass) 뒤에 본문이 바뀌었습니다. 윤문과 guard 를 다시 돌리고 final-pass 를 다시 기록하세요');
  }
  return { slug, problems };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const option = (name) => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args[i + 1];
  };
  const [postArg, step] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--file'));
  if (!postArg) {
    console.error('사용법: node scripts/pipeline-record.mjs <post.mdx> <단계> --file <산출물> | --status | --check');
    process.exit(2);
  }
  const post = resolve(postArg);

  if (args.includes('--check')) {
    const { slug, problems } = checkPipeline(post);
    if (problems.length) {
      console.error(`파이프라인 검사 실패 (${slug}):\n  ${problems.join('\n  ')}`);
      process.exit(1);
    }
    console.log(`파이프라인 검사 통과 (${slug}): ${STEPS.join(', ')}`);
    process.exit(0);
  }

  const source = readFileSync(post, 'utf8');
  const slug = slugOf(source);

  if (args.includes('--status')) {
    const state = readState(slug);
    const now = bodyHash(source);
    for (const s of STEPS) {
      const r = state[s];
      console.log(r ? `${s.padEnd(11)} ${r.at}  ${r.bodyHash === now ? '현재 본문' : '이전 본문'}  ${r.artifact}` : `${s.padEnd(11)} (없음)`);
    }
    process.exit(0);
  }

  if (!STEPS.includes(step)) {
    console.error(`알 수 없는 단계: ${step ?? '(없음)'}. 단계: ${STEPS.join(', ')}`);
    process.exit(2);
  }
  const file = option('--file');
  if (!file || !existsSync(file) || statSync(file).size === 0) {
    console.error('--file 로 내용이 있는 산출물 파일을 넘겨야 합니다');
    process.exit(2);
  }
  const content = readFileSync(file, 'utf8');
  if (NEEDS_GUARD.has(step) && !/\b0 error\b/.test(content)) {
    console.error(`${step} 산출물에 guard:rewrite check 의 "0 error" 출력이 없습니다. guard 를 통과한 뒤 그 출력을 함께 넣으세요`);
    process.exit(1);
  }
  const dir = dirFor(slug);
  mkdirSync(dir, { recursive: true });
  const artifact = `${step}${extname(file) || '.md'}`;
  copyFileSync(file, join(dir, artifact));
  const state = readState(slug);
  state[step] = { at: new Date().toISOString(), bodyHash: bodyHash(source), artifact, source: basename(file) };
  writeFileSync(statePath(slug), `${JSON.stringify(state, null, 2)}\n`);
  console.log(`${slug}: ${step} 기록 (${artifact})`);
}
