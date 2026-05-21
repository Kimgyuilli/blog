#!/usr/bin/env node
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');

const MAPPING = {
  // algorithm (백준 문제풀이)
  '1012-java': 'algorithm',
  '10799-python': 'algorithm',
  '10808-python': 'algorithm',
  '10845-python': 'algorithm',
  '10866-python': 'algorithm',
  '10942-java': 'algorithm',
  '1158-python': 'algorithm',
  '11660-5-java': 'algorithm',
  '1260-dfs-bfs-java': 'algorithm',
  '13549-3-java': 'algorithm',
  '1406-python': 'algorithm',
  '15663-n-m-9-java': 'algorithm',
  '1697-java': 'algorithm',
  '17413-python': 'algorithm',
  '1753-java': 'algorithm',
  '1918-python': 'algorithm',
  '1967-java': 'algorithm',
  '2178-java': 'algorithm',
  '2606-java': 'algorithm',
  '4153-java': 'algorithm',
  '9012-python': 'algorithm',
  '9663-n-queen-java': 'algorithm',

  // language-note (자료구조/문법 정리)
  'java-array-arrays': 'language-note',
  'java-deque-queue': 'language-note',
  'java-math': 'language-note',
  'java-stream-api': 'language-note',
  'java-string-stringbuilder': 'language-note',
  'tistory-76': 'language-note',
  'tistory-79': 'language-note',

  // backend
  'annotation': 'backend',
  'oauth': 'backend',
  'orm-jpa': 'backend',
  'peekcart-monolith-to-msa-flow': 'backend',
  'python-django-api': 'backend',
  'spring-boot-1': 'backend',
  'spring-boot-mdc': 'backend',
  'spring-boot-redis': 'backend',
  'spring-boot-ssr-jwt': 'backend',
  'spring-mvc-rest-api': 'backend',
  'spring-websocket-google-stt-1': 'backend',
  'spring-websocket-google-stt-2': 'backend',
  'springboot-env': 'backend',
  'tistory-49': 'backend',
  'tistory-61': 'backend',
  'tistory-67': 'backend',

  // ai
  '500-ai-pr': 'ai',
  'claude': 'ai',
  'claude-codex': 'ai',
  'codex-x-llm-wiki': 'ai',
  'langchain-deep-agents': 'ai',
  'spring-ai': 'ai',
  'spring-ai-conversation-memory': 'ai',
  'spring-ai-pgvector-rag-re-ranking': 'ai',
  'tistory-90': 'ai',

  // infra
  'astro-blog-start': 'infra',
  'aws-ecs': 'infra',
  'cloudflare-pages-deploy': 'infra',
  'docker-csr': 'infra',
  'docker-csr-47': 'infra',
  'elastic-beanstalk': 'infra',
  'tistory-60': 'infra',
  'tistory-73': 'infra',
  'tistory-89': 'infra',

  // frontend
  'react-css': 'frontend',
  'react-react-api': 'frontend',
  'tistory-71': 'frontend',
  'tistory-74': 'frontend',
  'tistory-75': 'frontend',

  // essay (회고 · 생각 · 메타)
  'github-tistory': 'essay',
  'gitmoji': 'essay',
  'maruni': 'essay',
  'maruni-1': 'essay',
  'maruni-2': 'essay',
  'maruni-3-ai': 'essay',
  'software-as-a-service-saas': 'essay',
  'tistory-11': 'essay',
  'tistory-52': 'essay',
  'tistory-56': 'essay',
  'tistory-58': 'essay',
  'tistory-59': 'essay',
  'tistory-63': 'essay',
  'tistory-64': 'essay',
  'tistory-72': 'essay',
  'tistory-88': 'essay',
  'tistory-92': 'essay',
  'tistory-migration-notes': 'essay',
};

const files = await readdir(BLOG_DIR);
let updated = 0;
let skipped = 0;
const missing = [];

for (const file of files) {
  if (!/\.(md|mdx)$/.test(file)) continue;
  const base = file.replace(/\.(md|mdx)$/, '');
  const category = MAPPING[base];
  if (!category) {
    missing.push(file);
    continue;
  }
  const filePath = path.join(BLOG_DIR, file);
  let content = await readFile(filePath, 'utf8');

  if (/^category:/m.test(content.split('---')[1] ?? '')) {
    skipped++;
    continue;
  }

  // Insert `category:` line right before `tags:`; fallback before `draft:`; fallback at end of frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    missing.push(`${file} (no frontmatter)`);
    continue;
  }
  let fm = fmMatch[1];
  const line = `category: "${category}"`;
  if (/^tags:/m.test(fm)) {
    fm = fm.replace(/^tags:/m, `${line}\ntags:`);
  } else if (/^draft:/m.test(fm)) {
    fm = fm.replace(/^draft:/m, `${line}\ndraft:`);
  } else {
    fm = `${fm}\n${line}`;
  }
  content = content.replace(fmMatch[0], `---\n${fm}\n---`);
  await writeFile(filePath, content);
  updated++;
}

console.log(`updated: ${updated}, skipped (already had category): ${skipped}`);
if (missing.length) {
  console.log('UNMAPPED FILES:');
  for (const m of missing) console.log(`  - ${m}`);
}
