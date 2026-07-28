// Run: node scripts/build-faq-index.mjs
// Builds faq-chunks.json from faq.md by splitting on ## headings

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

const faq = readFileSync(join(dataDir, 'faq.md'), 'utf-8');

const lines = faq.split('\n');
const chunks = [];
let currentCategory = '';
let currentQuestion = '';
let currentAnswer = '';

function flushQuestion() {
  if (!currentQuestion && !currentAnswer.trim()) return;
  const content = currentAnswer.trim();
  if (!content) return;
  const id = `faq-${chunks.length + 1}`;
  chunks.push({
    id,
    category: currentCategory,
    question: currentQuestion || currentCategory,
    content,
    heading: currentQuestion || currentCategory,
  });
}

for (const line of lines) {
  const h2Match = line.match(/^##\s+(.+)/);
  const h3Match = line.match(/^###\s+(.+)/);
  const isQuestion = line.match(/^###\s+(.+)\?/);

  if (h2Match) {
    flushQuestion();
    currentCategory = h2Match[1].trim();
    currentQuestion = '';
    currentAnswer = '';
  } else if (isQuestion) {
    flushQuestion();
    currentQuestion = isQuestion[1].trim();
    currentAnswer = '';
  } else if (h3Match) {
    flushQuestion();
    currentQuestion = h3Match[1].trim();
    currentAnswer = '';
  } else {
    if (line.trim() || currentAnswer) {
      currentAnswer += line + '\n';
    }
  }
}
flushQuestion();

const outputPath = join(dataDir, 'faq-chunks.json');
writeFileSync(outputPath, JSON.stringify(chunks, null, 2), 'utf-8');
console.log(`Written ${chunks.length} chunks to ${outputPath}`);
