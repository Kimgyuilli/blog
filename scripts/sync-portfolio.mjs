import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const portfolioRoot = path.resolve(projectRoot, process.env.PORTFOLIO_DIR ?? '../gyuill-portfolio');
const portfolioBuildDir = path.join(portfolioRoot, 'build');
const targetDir = path.join(projectRoot, 'public', 'portfolio');

if (!fs.existsSync(path.join(portfolioBuildDir, 'index.html'))) {
  console.error(`Portfolio build not found at ${portfolioBuildDir}`);
  console.error('Run `npm run build` in the portfolio project first.');
  process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(portfolioBuildDir, targetDir, { recursive: true });

console.log(`Synced portfolio build to ${targetDir}`);
