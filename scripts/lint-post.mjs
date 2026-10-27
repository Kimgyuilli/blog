#!/usr/bin/env node
/**
 * 글 문체 검사.
 *
 * developer-blog-writer 스킬의 references/voice.md "Prose the author has rejected" 가운데
 * 기계적으로 잡을 수 있는 부분을 검사합니다. 판단이 필요한 부분(문단 끝 경구, 대칭 대구 등)은 잡지 않습니다.
 *
 *   node scripts/lint-post.mjs <post.mdx> [더 많은 파일...]
 *   node scripts/lint-post.mjs <post.mdx> --no-imports   글이 import 한 데모 컴포넌트는 빼고 검사
 *
 * 글(.md/.mdx)은 frontmatter, 코드 블록, 인라인 코드, 주석, import 줄을 빼고 검사합니다.
 * 데모(.astro)는 한글이 들어 있는 문자열과 태그 사이 텍스트만 검사합니다.
 * error 가 하나라도 있으면 exit 1 입니다. warn 은 문맥을 보고 판단합니다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESCRIPTION_MAX_LENGTH = 80;

/** @typedef {{ id: string, level: 'error' | 'warn', re: RegExp, msg: string }} Rule */
/** @type {Rule[]} */
const RULES = [
  // 기호
  { id: 'em-dash', level: 'error', re: /—/g, msg: 'em dash 대신 문장을 나누거나 쉼표를 씁니다' },
  { id: 'middle-dot', level: 'error', re: /·/g, msg: '`·` 대신 쉼표나 "와/과"를 씁니다' },
  { id: 'icon-symbol', level: 'error', re: /[✓✔✕✗❌✅▶►①②③④⑤⑥⑦⑧⑨⑩→←↔⇒…÷′≠≈]/g, msg: '아이콘 같은 기호 대신 말로 씁니다 (에서 ~으로, 1, 2, 3)' },
  { id: 'multiplier', level: 'error', re: /×\s?\d|\d\s?×/g, msg: '배수는 "2.31배"처럼 씁니다' },

  // 번호와 절차명
  { id: 'internal-id', level: 'error', re: /\bADR-?\d+|\bPR\s?#?\d+|(?<![\w/])#\d{2,4}\b|\b[DL]-\d{3}\b/g, msg: '내부 ADR, PR, 부채 번호를 본문에 쓰지 않습니다' },
  { id: 'episode-number', level: 'error', re: /\d+\s?편(?!집|리|향|안|차|견|성|법|도|중|입|제|승)/g, msg: '다른 편 번호 대신 내용으로 가리킵니다' },
  { id: 'review-process', level: 'error', re: /Codex|\d+\s?차 리뷰|리뷰 라운드|라운드 \d/g, msg: '리뷰 절차명을 쓰지 않습니다' },
  { id: 'reviewer-attribution', level: 'error', re: /리뷰(가|에서) (짚|반박|지적|잡아)/g, msg: '리뷰어 대신 문제 자체를 씁니다' },

  // 문서 인용투
  { id: 'doc-citing', level: 'error', re: /기록은 [^.。\n]{0,40}(결론|들었|했다|했습니다)|기록에 (아래|다음)|(주석|문서|runbook|매뉴얼|javadoc)(에|은|는|이) [^.\n]{0,30}(적혀|적고|설명합니다|설명했)|기록이 (정한|보여|말해|가리)|적어 두었|한 기록은 없/g, msg: '문서 인용투입니다. "기존 계획은 ~였습니다", "따로 검토하지 않았습니다"로 씁니다' },

  // 상투구
  { id: 'stock-phrase', level: 'error', re: /질문은 하나입니다|더 근본적인 문제|확실하게 말할 수 있는 것|먼저 밝혀 둘 것|남은 것도 분명|셈입니다|셈이었|셈이고|셈이며|에는 의미가 있습니다|에서 끝나지 않습니다|편이 안전합니다|퇴보가 아닌 이유|다시 여는 기록/g, msg: '상투구입니다' },

  // 대조 구문 (문맥에 따라 쓸 수 있어 warn)
  { id: 'contrast', level: 'warn', re: /[가이] 아니라(?![는면고])|[가이] 아니고(?![는요])|라기보다|라기 보다/g, msg: '"A가 아니라 B" 대조 구문입니다. 발견한 사실을 바로 씁니다' },
  { id: 'rhetorical-near', level: 'warn', re: /보다 [^.\n]{0,60}에 가깝(습니다|았|고|다)/g, msg: '"A보다 B에 가깝습니다" 비교 구문입니다. B를 바로 씁니다' },

  // 선언형 마무리, 흐린 지시어, 나열 (문맥에 따라 쓸 수 있어 warn)
  { id: 'declarative', level: 'warn', re: /중요한 (것|점)은|핵심은 |(기준|답|방향|결론|이유)(은|는) (분명|명확|간단)합니다/g, msg: '선언형 문장입니다. 지우거나 구체적인 행동이나 근거를 바로 씁니다' },
  { id: 'vague-reference', level: 'warn', re: /이를 (통해|바탕으로)|그 기준(?=[에을이은으])|이러한 방식/g, msg: '가리키는 대상을 바로 앞 문장에서 찾을 수 있는지 봅니다. 없으면 대상을 직접 씁니다' },
  { id: 'triad', level: 'warn', re: /, 그리고 [가-힣]+(이|가|을|를|은|는|의|와|과)(?=\s)/g, msg: '"A, B, 그리고 C" 나열입니다. 세 항목의 관계를 설명하거나 중요한 것만 남깁니다' },

  // 비유 동사, 번역투
  { id: 'metaphor-verb', level: 'warn', re: /닫(았|혔|히|는다|고 )|접(어 |었|히|는다)|삼키|넘나들|끼어들|이음매|줄을 세|약속한 순서|테스트(를|도) 뒤집|현상을 고정|(결함|주입)을 거두|(지연|잡음)을 흡수/g, msg: '비유 동사입니다. 해결하다, 확정하다, 합치다, 막다, 순서대로 처리하다 같은 구체 동사를 씁니다' },
  { id: 'counter-beol', level: 'warn', re: /(한|두|세|네|다섯|여섯|여러|몇)\s?벌(?!레|금|써|칙|점|어|여)/g, msg: '코드나 파일 사본을 "벌"로 세지 않습니다. "네 서비스의 사본", "사본 네 개"처럼 씁니다' },
  { id: 'translationese', level: 'warn', re: /판단|관측|성립|수렴|모양|좌표|표적|선점|표식|단언|판독|처분|결부|공허한|빈틈|구멍/g, msg: '번역투 명사입니다. 평이한 동사나 원어로 바꿀 수 있는지 봅니다' },
  { id: 'translated-term', level: 'warn', re: /적중|캐시 미스|무작위 편차|기아 상태|부수 효과|계약 테스트|벽시계 시간|부하 생성기|버퍼 풀|대기 이벤트|행 락 대기|밀리코어|실행 단위|대역폭 제어/g, msg: '원어를 쓰기로 한 용어입니다 (hit, miss, jitter, starvation, side effect, contract test, wall-clock, load generator, buffer pool, wait event, row lock wait, millicore, task, bandwidth control)' },
  { id: 'abstract-noun', level: 'warn', re: /의 결(?=[을이은에\s])|농도|여운|(맥락|정보|감정)의 밀도/g, msg: '감각적인 추상어입니다. 구체적으로 무엇이 달라지는지 씁니다' },
  { id: 'quiet-adverb', level: 'warn', re: /조용(히|한|하게)|소리\s?없이|슬그머니|몰래/g, msg: '"조용히" 같은 의인화 부사입니다. 무엇이 없었는지 씁니다 (오류 로그 없이, DEBUG 로만 남고)' },
  { id: 'dictionary-compound', level: 'warn', re: /운영 관점|작동 구조|관점에서|측면에서/g, msg: '사전적인 합성어입니다. 반복된다면 실제로 무엇을 하는지 풀어 씁니다' },
  { id: 'time-anchor', level: 'warn', re: /당시에는|당시에|지금 돌아보|글을 쓰면서|이 글을 쓰기 전|\d{4}년 \d{1,2}월 \d{1,2}일/g, msg: '서술 시점 표지입니다. "당시 분석은"처럼 내용으로 가리킵니다' },

  // 조사 띄어쓰기
  { id: 'particle-spacing', level: 'warn', re: /(?<=[A-Za-z])(은|는|이|가|을|를|의|와|과|로|으로|에|에서|도|만|일)(?=[\s,.)])/g, msg: '영어 뒤 조사는 띄어 씁니다 (hit 이어도, miss 는)' },
];

/** 코드 스팬 바로 뒤에 붙은 조사. 인라인 코드를 지우기 전에 원문에서 찾습니다. */
const CODE_PARTICLE = /`[^`\n]+`(은|는|이|가|을|를|의|와|과|로|으로|에|도|만)(?=[\s,.)])/g;

const SPACED_PARTICLE = /[A-Za-z] (은|는|이|가|을|를|의|와|과|로|으로|에|에서|도|만)(?=[\s,.)])/g;
const CODE_SPACED_PARTICLE = /`[^`\n]+` (은|는|이|가|을|를|의|와|과|로|으로|에|도|만)(?=[\s,.)])/g;

/** 같은 길이의 공백으로 바꿔 줄과 열 위치를 유지합니다. */
const blank = (s) => s.replace(/[^\n]/g, ' ');

function maskMarkdown(src) {
  let text = src;
  text = text.replace(/^---\n[\s\S]*?\n---\n/, blank);
  text = text.replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, blank);
  text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, blank);
  text = text.replace(/<!--[\s\S]*?-->/g, blank);
  text = text.replace(/^import .*$/gm, blank);
  text = text.replace(/`[^`\n]+`/g, blank);
  text = text.replace(/\]\([^)\s]+\)/g, blank); // 링크 URL
  text = text.replace(/https?:\/\/\S+/g, blank);
  text = text.replace(/<[A-Z][A-Za-z]*[^>]*\/>/g, blank); // 데모 컴포넌트 태그
  return text;
}

/** .astro 에서는 한글이 들어 있는 문자열 리터럴과 태그 사이 텍스트만 남깁니다. */
function maskAstro(src) {
  const keep = new Array(src.length).fill(false);
  const mark = (start, end) => { for (let i = start; i < end; i++) keep[i] = true; };
  const hangul = /[가-힣]/;
  for (const m of src.matchAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g)) {
    if (hangul.test(m[0])) mark(m.index + 1, m.index + m[0].length - 1);
  }
  for (const m of src.matchAll(/>([^<>{}]+)</g)) {
    if (hangul.test(m[1])) mark(m.index + 1, m.index + 1 + m[1].length);
  }
  // 주석은 독자에게 보이지 않으므로 뺍니다.
  for (const m of src.matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g)) {
    for (let i = m.index; i < m.index + m[0].length; i++) keep[i] = false;
  }
  let text = '';
  for (let i = 0; i < src.length; i++) text += keep[i] || src[i] === '\n' ? src[i] : ' ';
  // 문자열 안의 <code>…</code> 와 태그 이름은 검사하지 않습니다.
  text = text.replace(/<code>[\s\S]*?<\/code>/g, blank).replace(/<\/?[a-z][^>]*>/g, blank);
  return text;
}

function position(text, index) {
  const before = text.slice(0, index);
  const line = before.split('\n').length;
  return { line, col: index - before.lastIndexOf('\n') };
}

function lintFile(path) {
  const src = readFileSync(path, 'utf8');
  const isAstro = path.endsWith('.astro');
  const text = isAstro ? maskAstro(src) : maskMarkdown(src);
  const lines = src.split('\n');
  const findings = [];
  const push = (rule, index, match) => {
    const { line, col } = position(text, index);
    findings.push({ path, line, col, level: rule.level, id: rule.id, msg: rule.msg, match, context: lines[line - 1].trim() });
  };
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) push(rule, m.index, m[0]);
  }
  if (!isAstro) {
    const frontmatter = src.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (frontmatter) {
      const metadata = load(frontmatter[1]);
      if (typeof metadata?.description === 'string') {
        const length = [...metadata.description.trim()].length;
        if (length > DESCRIPTION_MAX_LENGTH) {
          const field = /^description\s*:/m.exec(frontmatter[0]);
          push({
            id: 'description-length',
            level: 'warn',
            msg: `카드 소개는 공백 포함 ${DESCRIPTION_MAX_LENGTH}자 이내의 짧은 문장을 권장합니다. 현재 ${length}자입니다.`,
          }, field?.index ?? 0, `${length}자`);
        }
      }
    }
    const outside = src
      .replace(/^---\n[\s\S]*?\n---\n/, blank)
      .replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, blank)
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank);
    for (const m of outside.matchAll(CODE_PARTICLE)) {
      push({ id: 'particle-spacing', level: 'warn', msg: '코드 뒤 조사는 띄어 씁니다 (`@Version` 이)' }, m.index + m[0].length - m[1].length, m[0]);
    }
  }
  // 조사 띄어쓰기는 글마다 관례가 다릅니다. 붙여 쓴 곳이 더 많은 글은 그 관례를 따르므로 경고하지 않습니다.
  const spaced = (text.match(SPACED_PARTICLE) ?? []).length + (isAstro ? 0 : (src.match(CODE_SPACED_PARTICLE) ?? []).length);
  const attached = findings.filter((f) => f.id === 'particle-spacing').length;
  if (attached > spaced) return findings.filter((f) => f.id !== 'particle-spacing').sort((a, b) => a.line - b.line || a.col - b.col);
  return findings.sort((a, b) => a.line - b.line || a.col - b.col);
}

/** 글이 import 한 .astro 컴포넌트 경로. '@/' 는 src/ 입니다. */
function importedComponents(path) {
  const src = readFileSync(path, 'utf8');
  return [...src.matchAll(/^import \w+ from '([^']+\.astro)';/gm)]
    .map((m) => (m[1].startsWith('@/') ? join(root, 'src', m[1].slice(2)) : resolve(dirname(path), m[1])))
    .filter(existsSync);
}

function externalLinks(path) {
  const src = maskMarkdownLinksOnly(readFileSync(path, 'utf8'));
  return [...new Set([...src.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]))];
}
const maskMarkdownLinksOnly = (src) => src.replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, blank);

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
if (files.length === 0) {
  console.error('사용법: node scripts/lint-post.mjs <post.mdx> [--no-imports]');
  process.exit(2);
}
const targets = new Set();
for (const file of files) {
  const path = resolve(file);
  targets.add(path);
  if (!args.includes('--no-imports') && /\.mdx?$/.test(path)) importedComponents(path).forEach((p) => targets.add(p));
}

let errors = 0;
let warns = 0;
for (const path of targets) {
  const findings = lintFile(path);
  const rel = relative(process.cwd(), path);
  for (const f of findings) {
    if (f.level === 'error') errors++;
    else warns++;
    const snippet = f.context.length > 90 ? `${f.context.slice(0, 87)}...` : f.context;
    console.log(`${rel}:${f.line}:${f.col} ${f.level} [${f.id}] "${f.match}" ${f.msg}\n    ${snippet}`);
  }
}
for (const file of files.filter((f) => /\.mdx?$/.test(f))) {
  const links = externalLinks(resolve(file));
  if (links.length) console.log(`\n외부 링크 ${links.length}개 (브리프의 허용 목록과 대조하세요):\n${links.map((l) => `  ${l}`).join('\n')}`);
}
console.log(`\n${targets.size}개 파일, error ${errors}, warn ${warns}`);
process.exit(errors > 0 ? 1 : 0);
