#!/usr/bin/env node
/**
 * Enhancement Pipeline - runs AFTER every blog publish.
 * Applies all SEO/CWV/E-E-A-T/RSS optimizations to new + existing posts.
 * Each step is idempotent, so running it repeatedly is safe and cheap.
 *
 * Steps:
 *   1. inject-internal-links   (interlink graph)
 *   2. inject-faq-schema       (FAQPage JSON-LD for AI search)
 *   3. standardize-author-box  (E-E-A-T author + Person schema)
 *   4. optimize-cwv            (lazy images, defer scripts, preconnect)
 *   5. normalize-html          (repair defer tags, noscript reveal, ?v= cache-bust)
 *   6. generate-rss            (refresh rss.xml)
 *   7. broken-link-check       (fail fast on broken internal refs)
 *
 * Usage: node scripts/enhance.js [--skip-check]
 * Wired into: auto-blog-publisher.yml (GitHub Actions) + package.json "enhance"
 */
const { execFileSync } = require('child_process');
const path = require('path');

const SKIP_CHECK = process.argv.includes('--skip-check');
const steps = [
  ['inject-internal-links', 'inject-internal-links.js'],
  ['inject-faq-schema', 'inject-faq-schema.js'],
  ['standardize-author-box', 'standardize-author-box.js'],
  ['optimize-cwv', 'optimize-cwv.js'],
  ['normalize-html', 'normalize-html.js'],
  ['generate-rss', 'generate-rss.js'],
];
if (!SKIP_CHECK) steps.push(['broken-link-check', 'broken-link-check.js']);

console.log('=== Enhancement Pipeline ===');
let failed = false;
for (const [name, script] of steps) {
  try {
    execFileSync(process.execPath, [path.join(__dirname, script)], { stdio: 'inherit' });
  } catch (e) {
    if (name === 'broken-link-check') {
      console.error('FAIL: broken links detected - check output above');
      failed = true;
    } else {
      console.error(`WARN: ${name} step failed (non-fatal): ${e.message}`);
    }
  }
}
console.log('=== Enhancement Pipeline ' + (failed ? 'FAILED' : 'DONE') + ' ===');
process.exit(failed ? 1 : 0);
