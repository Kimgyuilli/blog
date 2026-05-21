#!/usr/bin/env node
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const DRY = process.argv.includes('--dry');

/**
 * Decide the language of a fenced code block from its body text.
 * Returns null when we are not confident — leave the block as plaintext.
 */
function detectLanguage(body, fileHint) {
  const text = body.trim();
  if (!text) return null;

  // Strong signal: shell prompt
  if (/^(?:\$ |# )/m.test(text) && !/class\s+\w+/i.test(text)) {
    return 'bash';
  }
  // npm / yarn / pnpm / git / docker / brew / cd / ls / mkdir / curl as first token of a line
  if (/^(?:npm |yarn |pnpm |git |docker |brew |cd |ls |mkdir |curl |chmod |export |wrangler |gh )/m.test(text)) {
    return 'bash';
  }

  // YAML (k8s, GitHub Actions, frontmatter-ish)
  if (/^(?:apiVersion|kind|metadata|spec|on:|jobs:|steps:|name:\s)/m.test(text)) {
    return 'yaml';
  }
  // application.yml / .yaml typical
  if (/^\s*(?:spring|server|logging|datasource):/m.test(text)) {
    return 'yaml';
  }

  // Dockerfile
  if (/^(?:FROM |RUN |COPY |WORKDIR |ENTRYPOINT |CMD |EXPOSE |ENV )/m.test(text)) {
    return 'dockerfile';
  }

  // SQL
  if (/^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE)\b/im.test(text)) {
    return 'sql';
  }

  // HTML
  if (/^\s*<!DOCTYPE|<html|<body|<head|<div|<script|<style/im.test(text)) {
    return 'html';
  }

  // JSON — starts with { or [ and contains "key":
  if (/^\s*[{\[]/.test(text) && /"[^"]+"\s*:/.test(text) && !/=>|function|public |private /.test(text)) {
    return 'json';
  }

  // Java (Spring) — very common in this blog
  if (/\b(?:public|private|protected)\s+(?:static\s+)?(?:class|void|[A-Z]\w*)\s+\w/.test(text)) {
    return 'java';
  }
  if (/@(?:RestController|Controller|Service|Component|Repository|Autowired|RequestMapping|GetMapping|PostMapping|Bean|Configuration|Override|Entity|Table|Id)\b/.test(text)) {
    return 'java';
  }
  if (/\bSystem\.out\.println|System\.in|BufferedReader|StringBuilder|ArrayList<|HashMap<|Scanner\(/.test(text)) {
    return 'java';
  }
  if (/^\s*import\s+java\./m.test(text)) {
    return 'java';
  }
  if (/^\s*package\s+[a-z][\w.]+;/m.test(text)) {
    return 'java';
  }

  // Kotlin
  if (/^\s*fun\s+\w+\s*\(/m.test(text) && /\bval\s+\w+|\bvar\s+\w+/.test(text)) {
    return 'kotlin';
  }

  // Python
  if (/^\s*def\s+\w+\s*\(/m.test(text) || /^\s*from\s+\w+\s+import/m.test(text) || /^\s*import\s+\w+\s*(?:$|\n|#)/m.test(text)) {
    if (/print\(|input\(|self\.|__init__|range\(/.test(text)) return 'python';
    if (fileHint === 'python') return 'python';
  }
  if (/print\(.*\)/.test(text) && /input\(\)/.test(text)) return 'python';
  if (/^\s*if\s+__name__\s*==\s*['"]__main__['"]/m.test(text)) return 'python';

  // TypeScript / JavaScript
  if (/\b(?:const|let|var)\s+\w+\s*=/.test(text) && /(?:=>|function\s*\()/.test(text)) {
    if (/:\s*(?:string|number|boolean|any|unknown|Record<|Array<|Promise<)/.test(text)) return 'ts';
    return 'js';
  }
  if (/\binterface\s+\w+\s*\{/.test(text) || /\btype\s+\w+\s*=/.test(text)) {
    return 'ts';
  }
  if (/^\s*import\s+.+\s+from\s+['"]/m.test(text)) {
    return /:\s*(?:string|number|boolean)/.test(text) ? 'ts' : 'js';
  }
  if (/console\.log\(/.test(text)) {
    return 'js';
  }

  // Go
  if (/^\s*package\s+main/m.test(text) && /^\s*func\s+\w+/m.test(text)) return 'go';

  // CSS
  if (/^\s*[.#]?[\w-]+\s*\{[^}]*[a-z-]+\s*:/m.test(text) && /[};]/.test(text)) {
    return 'css';
  }

  // Java method-signature listings (no class/annotation, but multiple "MethodName(args) // comment" lines)
  const methodSigLines = (text.match(/^\s*(?:[a-z]+\s+)?[A-Z]?\w+\s*\([^)]*\)\s*(?:\/\/|$)/gm) || []).length;
  const javaTypeMentions = /\b(?:ArrayList|LinkedList|HashMap|HashSet|TreeMap|TreeSet|Stack|Queue|Deque|Collection|Iterator|Comparator|Optional|StringBuilder|StringBuffer|Integer|Boolean|Character|Math|Arrays|Collections|Stream|List<|Map<|Set<)\b/.test(text);
  if (methodSigLines >= 2 && javaTypeMentions) {
    return 'java';
  }

  // Fallback by file hint when content still looks code-ish
  const looksCodey = /[{}()\[\]=;]|->|=>/.test(text);
  if (looksCodey) {
    if (fileHint === 'java') return 'java';
    if (fileHint === 'python') return 'python';
  }

  // Plain text: short trees, file listings, or descriptive content. Leave as-is.
  return null;
}

async function processFile(file) {
  const filePath = path.join(BLOG_DIR, file);
  const content = await readFile(filePath, 'utf8');

  // Skip frontmatter
  const fmEnd = content.indexOf('\n---', 3);
  if (fmEnd === -1) return null;
  const fm = content.slice(0, fmEnd + 4);
  const bodyStart = fmEnd + 4;
  const body = content.slice(bodyStart);

  const lines = body.split('\n');
  const out = [];
  let inBlock = false;
  let blockStartIndex = -1;
  let blockLang = '';
  let blockBody = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inBlock) {
      const fenceMatch = line.match(/^```(.*)$/);
      if (fenceMatch) {
        inBlock = true;
        blockLang = fenceMatch[1].trim();
        blockStartIndex = out.length;
        blockBody = [];
        out.push(line);
        continue;
      }
      out.push(line);
    } else {
      if (line.trim() === '```') {
        // Close block
        if (blockLang === '') {
          // Detect language and rewrite opener
          let fileHint = '';
          if (/python|django/.test(file)) fileHint = 'python';
          else if (/java|spring|boot|jpa|mdc|jwt|orm|annotation/.test(file)) fileHint = 'java';
          else if (/react|astro|next/.test(file)) fileHint = 'js';
          // Also peek at frontmatter category
          const catMatch = fm.match(/^category:\s*"?([\w-]+)"?/m);
          if (!fileHint && catMatch) {
            const cat = catMatch[1];
            if (cat === 'backend' || cat === 'language-note' || cat === 'algorithm') {
              // tistory-XX language-note posts are mostly Java reference
              fileHint = 'java';
            } else if (cat === 'frontend') {
              fileHint = 'js';
            }
          }
          const detected = detectLanguage(blockBody.join('\n'), fileHint);
          if (detected) {
            out[blockStartIndex] = '```' + detected;
          }
        }
        out.push(line);
        inBlock = false;
        blockLang = '';
        blockBody = [];
      } else {
        blockBody.push(line);
        out.push(line);
      }
    }
  }

  const newBody = out.join('\n');
  if (newBody === body) return null;

  const newContent = fm + newBody;
  if (!DRY) await writeFile(filePath, newContent);
  return file;
}

const files = (await readdir(BLOG_DIR)).filter((f) => /\.md$/.test(f));
let touched = 0;
const changedFiles = [];
for (const file of files) {
  const res = await processFile(file);
  if (res) {
    touched++;
    changedFiles.push(res);
  }
}

console.log(`${DRY ? '[dry] ' : ''}touched: ${touched}`);
for (const f of changedFiles) console.log('  -', f);
