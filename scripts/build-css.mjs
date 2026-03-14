import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const srcDir = resolve('src/styles');
const outDir = resolve('dist/styles');

mkdirSync(outDir, { recursive: true });

// Concatenate theme.css + all component CSS into a single index.css
const themeCSS = readFileSync(join(srcDir, 'theme.css'), 'utf-8');
const componentDir = join(srcDir, 'components');
const componentFiles = readdirSync(componentDir).filter((f) => f.endsWith('.css')).sort();

let output = `/* @gamiforge/sdk — Generated styles */\n\n`;
output += `/* === Theme Variables === */\n${themeCSS}\n\n`;

for (const file of componentFiles) {
  const content = readFileSync(join(componentDir, file), 'utf-8');
  output += `/* === ${file} === */\n${content}\n\n`;
}

writeFileSync(join(outDir, 'index.css'), output, 'utf-8');
console.log(`CSS built: dist/styles/index.css (${componentFiles.length} component styles + theme)`);
