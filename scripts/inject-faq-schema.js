#!/usr/bin/env node
/**
 * Auto FAQ Schema Injector - detects FAQ-looking Q&A in blog posts and adds FAQPage JSON-LD.
 * Idempotent: marker <!-- AUTO_FAQ_SCHEMA --> prevents duplicates.
 * Free AI-search optimization: helps Google AI Overviews / Perplexity cite your site.
 *
 * Run: node scripts/inject-faq-schema.js
 */
const fs = require('fs');
const path = require('path');
const { looksLikeQuestion } = require('./question-query.js');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const MARKER = '<!-- AUTO_FAQ_SCHEMA -->';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function stripTags(s) { return String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

function extractFAQ(html) {
  // Capture h3 questions followed by one or more <p> answers (FAQ sections)
  const faq = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*(<p>[\s\S]*?<\/p>)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const q = stripTags(m[1]);
    if (!looksLikeQuestion(q)) continue;
    const a = stripTags(m[2]).slice(0, 350);
    if (a.length < 20) continue;
    if (faq.some(f => f.q === q)) continue;
    faq.push({ q, a });
  }
  return faq.slice(0, 10);
}

function buildSchema(faq) {
  const mainEntity = faq
    .map(f => `    {
      "@type": "Question",
      "name": ${JSON.stringify(f.q)},
      "acceptedAnswer": {
        "@type": "Answer",
        "text": ${JSON.stringify(f.a)}
      }
    }`)
    .join(',\n');
  const json = `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
${mainEntity}
  ]
}`;
  return `  ${MARKER}\n  <script type="application/ld+json">\n${json}\n  </script>`;
}

function apply(html) {
  const faq = extractFAQ(html);
  if (faq.length < 2) return null; // need at least 2 Q&As to be a real FAQ

  const schemaBlock = buildSchema(faq);
  const hasSchema = html.includes('"@type": "FAQPage"');
  const hasMarker = html.includes(MARKER);

  if (hasSchema && hasMarker) return html; // already done

  if (hasSchema && !hasMarker) return html; // schema exists (maybe manual), leave it

  // Insert before </head>
  const idx = html.lastIndexOf('</head>');
  if (idx === -1) return null;
  return html.slice(0, idx) + schemaBlock + '\n' + html.slice(idx);
}

function main() {
  if (!fs.existsSync(BLOG_DIR)) { console.log('No blog dir'); return; }
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  let added = 0, skipped = 0;
  for (const f of files) {
    const file = path.join(BLOG_DIR, f);
    const html = fs.readFileSync(file, 'utf8');
    const out = apply(html);
    if (out === null) { skipped++; continue; }
    if (out !== html) { fs.writeFileSync(file, out); added++; }
  }
  console.log(`FAQ schema: added to ${added}, already had/insufficient ${skipped}, total ${files.length}`);
}

module.exports = { extractFAQ, apply };

if (require.main === module) main();
