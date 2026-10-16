#!/usr/bin/env node
/**
 * 윤문 전후 대조.
 *
 * humanize-korean 은 문체만 고치도록 지시받지만, 다시 쓰는 과정에서 수치, 코드, 표, 추정 표지가
 * 바뀌어도 스스로 확인하지 못합니다. 이 스크립트가 그 부분을 기계적으로 대조합니다.
 *
 *   node scripts/rewrite-guard.mjs extract <post.mdx> <input.txt>
 *       글에서 윤문할 본문만 꺼냅니다(frontmatter, import, 머리 주석 다음부터).
 *   node scripts/rewrite-guard.mjs check <input.txt> <final.md>
 *       윤문본이 보존해야 할 것을 보존했는지 대조합니다. error 가 있으면 exit 1 입니다.
 *   node scripts/rewrite-guard.mjs apply <post.mdx> <input.txt> <final.md>
 *       글이 extract 이후 바뀌지 않았고 check 를 통과하면, 글의 본문을 윤문본으로 바꿉니다.
 *
 * final.md 끝의 <!-- HUMANIZE-SUMMARY --> 블록은 떼고 대조합니다.
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** 글을 머리(그대로 둘 부분)와 본문으로 나눕니다. */
function splitPost(src) {
  const fm = src.match(/^---\n[\s\S]*?\n---\n/);
  let i = fm ? fm[0].length : 0;
  const comment = src.indexOf('*/}', i);
  if (comment !== -1 && /^\s*(import .*\n|\s)*\{\/\*/.test(src.slice(i))) {
    i = comment + 3;
  } else {
    const imports = src.slice(i).match(/^(\s*import .*\n)*/);
    i += imports ? imports[0].length : 0;
  }
  return { head: src.slice(0, i), body: src.slice(i).trim() + '\n' };
}

function stripSummary(text) {
  return text.split('<!-- HUMANIZE-SUMMARY')[0].trimEnd() + '\n';
}

/** 코드 블록을 떼어 내고, 나머지를 빈 줄 기준 문단으로 나눕니다. */
function parse(text) {
  const fences = [];
  const prose = text.replace(/^```[\s\S]*?^```/gm, (m) => {
    fences.push(m);
    return `\u0000FENCE${fences.length - 1}\u0000`;
  });
  const paragraphs = prose.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return { fences, paragraphs };
}

/** 한 줄 단위로 그대로 남아야 하는 줄인지. */
function isProtectedLine(line) {
  return (
    /^#{1,6} /.test(line) || // 헤딩
    /^\|/.test(line) || // 표
    /^<[A-Za-z]/.test(line) || /^\{\/\*/.test(line) || // 컴포넌트, MDX 주석
    /^import /.test(line) ||
    /^\(.*\)$/.test(line.trim()) || // "(측정 기록에서 발췌)" 같은 캡션
    /^>/.test(line) // 인용 블록
  );
}

/** 측정 범위와 확신 정도를 나타내는 표지. 줄면 주장이 강해진 것입니다. */
const MARKERS = [
  '추정', '로컬 재현', '발췌', '재지 않았', '확인하지 않았', '검토하지 않았', '분리하지 않았', '않았을 것',
];
/** 확신 정도를 나타낼 때가 많지만 다른 뜻으로도 쓰이는 표지. */
const SOFT_MARKERS = ['수 있습니다', '보입니다', '가능성', '것 같'];

function tokens(paragraph) {
  const p = paragraph.replace(/\u0000FENCE\d+\u0000/g, '');
  return {
    numbers: p.replace(/`[^`]*`/g, '').match(/\d[\d,.]*\d|\d/g) ?? [],
    code: p.match(/`[^`\n]+`/g) ?? [],
    links: p.match(/\]\([^)]+\)|https?:\/\/[^\s)>"]+/g) ?? [],
    bold: p.match(/\*\*[^*]+\*\*/g) ?? [],
    quotes: p.match(/"[^"\n]{2,}"/g) ?? [],
  };
}

function multisetDiff(a, b) {
  const count = new Map();
  for (const x of a) count.set(x, (count.get(x) ?? 0) + 1);
  for (const x of b) count.set(x, (count.get(x) ?? 0) - 1);
  const missing = [];
  const added = [];
  for (const [x, n] of count) {
    for (let k = 0; k < Math.abs(n); k++) (n > 0 ? missing : added).push(x);
  }
  return { missing, added };
}

function countOf(text, s) {
  return text.split(s).length - 1;
}

function check(beforeText, afterText) {
  const errors = [];
  const warns = [];
  const before = parse(beforeText);
  const after = parse(afterText);

  // 코드 블록은 바이트 단위로 같아야 합니다.
  const fenceDiff = multisetDiff(before.fences, after.fences);
  if (fenceDiff.missing.length || fenceDiff.added.length) {
    errors.push(`코드 블록이 바뀌었습니다 (${fenceDiff.missing.length}개 사라짐, ${fenceDiff.added.length}개 새로 생김)`);
  }

  // 헤딩, 표, 컴포넌트, 캡션, 인용 줄은 그대로 남아야 합니다.
  const lines = (ps) => ps.flatMap((p) => p.split('\n')).filter(isProtectedLine);
  const lineDiff = multisetDiff(lines(before.paragraphs), lines(after.paragraphs));
  for (const l of lineDiff.missing) errors.push(`보호 줄이 바뀌거나 사라졌습니다: ${l.slice(0, 100)}`);
  for (const l of lineDiff.added) errors.push(`보호 줄이 새로 생겼습니다: ${l.slice(0, 100)}`);

  // 문단 수가 같으면 문단마다, 다르면 글 전체로 토큰을 대조합니다.
  const sameShape = before.paragraphs.length === after.paragraphs.length;
  if (!sameShape) {
    warns.push(`문단 수가 ${before.paragraphs.length} 에서 ${after.paragraphs.length} 로 바뀌었습니다. 문단별 대조 대신 글 전체로 대조합니다`);
  }
  const groupsB = sameShape ? before.paragraphs : [before.paragraphs.join('\n\n')];
  const groupsA = sameShape ? after.paragraphs : [after.paragraphs.join('\n\n')];
  groupsB.forEach((pb, idx) => {
    const pa = groupsA[idx];
    const tb = tokens(pb);
    const ta = tokens(pa);
    const where = sameShape ? `문단 ${idx + 1} "${pb.replace(/\s+/g, ' ').slice(0, 40)}"` : '글 전체';
    for (const [kind, label] of [['numbers', '수치'], ['code', '인라인 코드'], ['links', '링크'], ['bold', '굵은 글씨'], ['quotes', '따옴표 인용']]) {
      const d = multisetDiff(tb[kind], ta[kind]);
      if (!d.missing.length && !d.added.length) continue;
      const msg = `${where}: ${label} 변경 (사라짐 [${d.missing.join(', ')}], 생김 [${d.added.join(', ')}])`;
      // 같은 문단에 이미 있던 값을 한 번 더 쓴 것은 문장을 나눈 결과일 때가 많습니다.
      const onlyRepeated = !d.missing.length && d.added.every((x) => tb[kind].includes(x));
      (kind === 'bold' || kind === 'quotes' || onlyRepeated ? warns : errors).push(
        onlyRepeated ? `${msg}. 문장을 나누며 반복한 것인지, 주장이 바뀌었는지 봅니다` : msg,
      );
    }
    for (const [list, sink] of [[MARKERS, errors], [SOFT_MARKERS, warns]]) {
      for (const m of list) {
        const nb = countOf(pb, m);
        const na = countOf(pa, m);
        if (na < nb) sink.push(`${where}: 범위 표지 "${m}" 가 ${nb} 에서 ${na} 로 줄었습니다`);
      }
    }
  });

  return { errors, warns };
}

function report({ errors, warns }) {
  for (const e of errors) console.log(`error  ${e}`);
  for (const w of warns) console.log(`warn   ${w}`);
  console.log(`\n${errors.length} error, ${warns.length} warn`);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'extract' && args.length === 2) {
  const { body } = splitPost(readFileSync(args[0], 'utf8'));
  writeFileSync(args[1], body);
  console.log(`본문 ${body.length}자를 ${args[1]} 에 썼습니다`);
} else if (cmd === 'check' && args.length === 2) {
  const result = check(readFileSync(args[0], 'utf8'), stripSummary(readFileSync(args[1], 'utf8')));
  report(result);
  process.exit(result.errors.length ? 1 : 0);
} else if (cmd === 'apply' && args.length === 3) {
  const [postPath, inputPath, finalPath] = args;
  const src = readFileSync(postPath, 'utf8');
  const { head, body } = splitPost(src);
  const input = readFileSync(inputPath, 'utf8');
  if (body !== input) {
    console.log('error  extract 이후 글이 바뀌었습니다. 다시 extract 해서 윤문하거나 바뀐 부분을 직접 합칩니다');
    process.exit(1);
  }
  const final = stripSummary(readFileSync(finalPath, 'utf8'));
  const result = check(input, final);
  report(result);
  if (result.errors.length) {
    console.log('\n글을 바꾸지 않았습니다. 윤문본에서 error 구간을 원문대로 되돌린 뒤 다시 실행합니다');
    process.exit(1);
  }
  writeFileSync(postPath, `${head.trimEnd()}\n\n${final}`);
  console.log(`\n${postPath} 의 본문을 윤문본으로 바꿨습니다`);
} else {
  console.log('사용법: rewrite-guard.mjs extract <post> <input.txt> | check <input.txt> <final.md> | apply <post> <input.txt> <final.md>');
  process.exit(2);
}
