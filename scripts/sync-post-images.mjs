import fs from 'node:fs/promises';
import path from 'node:path';

const CONTENT_DIR = 'src/content/blog';
const imagePattern = /!\[[^\]]*]\((\/images\/blog\/[^)]+)\)/;

function hasImageField(frontmatter) {
  return /^image:\s*/m.test(frontmatter);
}

function splitFrontmatter(contents) {
  const match = contents.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  return {
    frontmatter: match[1],
    body: contents.slice(match[0].length),
  };
}

async function main() {
  const files = (await fs.readdir(CONTENT_DIR)).filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));
  let updated = 0;

  for (const file of files) {
    const fullPath = path.join(CONTENT_DIR, file);
    const contents = await fs.readFile(fullPath, 'utf8');
    const parts = splitFrontmatter(contents);
    if (!parts || hasImageField(parts.frontmatter)) continue;

    const image = parts.body.match(imagePattern)?.[1];
    if (!image) continue;

    const nextFrontmatter = parts.frontmatter.replace(
      /^description:\s*(.+)$/m,
      (line) => `${line}\nimage: "${image}"`,
    );

    if (nextFrontmatter === parts.frontmatter) continue;
    await fs.writeFile(fullPath, `---\n${nextFrontmatter}\n---\n${parts.body}`);
    updated += 1;
  }

  console.log(`Updated ${updated} posts with image frontmatter.`);
}

await main();
