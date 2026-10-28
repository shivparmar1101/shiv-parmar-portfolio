#!/usr/bin/env node
/**
 * Question-Headings Content Audit (AEO).
 *
 * Scans every published post for h2/h3 headings and classifies each one with the
 * shared question detector (scripts/question-query.js). Reports which posts carry
 * question coverage (people-also-ask / featured-snippet / AI-citation friendly)
 * and which are weak on questions so they can be improved in the next revision.
 *
 * Read-only: it never edits blog content. Writes a dated JSON snapshot to
 * reports/question-audit-<YYYY-MM-DD>.json.
 *
 * Run: node scripts/audit-question-headings.js
 */
const fs = require('fs');
const path = require('path');
const { looksLikeQuestion } = require('./question-query.js');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const REPORT_DIR = path.join(ROOT, 'reports');

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function extractHeadings(html) {
  const out = [];
  const re = /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[2]);
    if (text) out.push({ level: Number(m[1]), text });
  }
  return out;
}

function auditFile(file) {
  const html = fs.readFileSync(file, 'utf8');
  const headings = extractHeadings(html);
  const questions = headings.filter((h) => looksLikeQuestion(h.text));
  return {
    file: path.basename(file),
    slug: path.basename(file, '.html'),
    headings: headings.length,
    questionHeadings: questions.length,
    // Coverage ratio, rounded for readable reports.
    coverage: headings.length ? Number((questions.length / headings.length).toFixed(2)) : 0,
    questions: questions.map((q) => ({ level: q.level, text: q.text })),
  };
}

function main() {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(BLOG_DIR, f))
    .sort();

  const posts = files.map(auditFile);
  const totalHeadings = posts.reduce((n, p) => n + p.headings, 0);
  const totalQuestions = posts.reduce((n, p) => n + p.questionHeadings, 0);
  // A post with zero question headings gets no chance at PAA/snippets/AI answers.
  const weak = posts.filter((p) => p.questionHeadings === 0);
  const strong = posts.filter((p) => p.questionHeadings >= 3);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      posts: posts.length,
      totalHeadings,
      totalQuestionHeadings: totalQuestions,
      overallCoverage: totalHeadings ? Number((totalQuestions / totalHeadings).toFixed(2)) : 0,
      postsWithoutQuestions: weak.length,
      postsWith3PlusQuestions: strong.length,
    },
    // Weakest first, so the list doubles as a prioritised to-do.
    weakPosts: weak
      .slice()
      .sort((a, b) => a.headings - b.headings)
      .map((p) => ({ slug: p.slug, headings: p.headings })),
    posts,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = path.join(REPORT_DIR, `question-audit-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log(`Question-heading audit: ${report.summary.posts} posts`);
  console.log(`  headings: ${totalHeadings}, question headings: ${totalQuestions} (coverage ${report.summary.overallCoverage})`);
  console.log(`  posts with 0 questions: ${weak.length}`);
  console.log(`  posts with 3+ questions: ${strong.length}`);
  if (weak.length) {
    console.log('\nWeak posts (no question headings — add FAQ-style h3s):');
    for (const p of report.weakPosts) console.log(`  - ${p.slug} (${p.headings} headings)`);
  }
  console.log(`\nReport written: ${path.relative(ROOT, outFile)}`);
}

if (require.main === module) main();
module.exports = { extractHeadings, auditFile };
