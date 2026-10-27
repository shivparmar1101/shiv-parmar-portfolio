#!/usr/bin/env node
/**
 * Broken Link Checker (CI-friendly)
 *
 * Scans all HTML for internal href/src references and flags ones that don't resolve.
 * Smart enough to skip:
 *   - external (http/https), mailto, tel, data:, #anchors, javascript:
 *   - clean-URL paths that resolve to <path>.html (Netlify pretty_urls + .htaccess)
 *   - template vars ({{...}}, ${...}, __BASE__ placeholders)
 *   - URLs inside <code>/<pre> (code examples) and JS strings
 *
 * Exits 1 if REAL broken internal links found (fails CI), 0 otherwise.
 * Run: node scripts/broken-link-check.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const SKIP_FILES = new Set(['header.html', 'footer.html']);

function htmlFiles() {
  const out = [];
  for (const f of fs.readdirSync(ROOT)) {
    if (f.endsWith('.html') && !SKIP_FILES.has(f)) out.push(path.join(ROOT, f));
  }
  if (fs.existsSync(BLOG_DIR)) {
    for (const f of fs.readdirSync(BLOG_DIR)) if (f.endsWith('.html')) out.push(path.join(BLOG_DIR, f));
  }
  return out;
}

// Strip code blocks & inline code so example hrefs aren't checked
function stripCode(html) {
  return html
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<code[\s\S]*?<\/code>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ');
}

function resolveTarget(pageFile, url) {
  // Clean url: strip query/hash
  const clean = url.split('#')[0].split('?')[0];
  if (!clean) return true;
  const baseDir = path.dirname(pageFile);
  const candidates = [];
  const abs = path.resolve(baseDir, clean);
  candidates.push(abs);
  candidates.push(abs + '.html');
  candidates.push(path.join(abs, 'index.html'));
  // Absolute site-root path (/foo) -> resolve from ROOT
  if (clean.startsWith('/')) {
    const fromRoot = path.join(ROOT, clean);
    candidates.push(fromRoot);
    candidates.push(fromRoot + '.html');
    candidates.push(path.join(fromRoot, 'index.html'));
  }
  return candidates.some(c => fs.existsSync(c));
}

function checkFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const html = stripCode(raw);
  const bad = [];
  const re = /(?:href|src|srcset)="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let u = m[1].split(',')[0].trim(); // handle srcset "a.webp 1x, b.jpg 2x"
    if (!u) continue;
    if (/^(https?:)?\/\//i.test(u)) continue;      // external
    if (/^(mailto|tel|javascript|data|blob):/i.test(u)) continue;
    if (u.startsWith('#')) continue;               // anchor
    if (/\{\{|\$\{|__BASE__|%s|\$tag|\$item/i.test(u)) continue; // template var
    if (u === '' || u === '/' || u === './') continue;
    if (!resolveTarget(file, u)) {
      bad.push(u);
    }
  }
  return bad;
}

function main() {
  const files = htmlFiles();
  let totalBad = 0;
  const seen = new Set();
  for (const f of files) {
    const bad = checkFile(f);
    if (bad.length) {
      for (const b of bad) {
        const key = path.relative(ROOT, f) + ' -> ' + b;
        if (!seen.has(key)) {
          seen.add(key);
          console.log(`BROKEN: ${key}`);
          totalBad++;
        }
      }
    }
  }
  console.log(`\nBroken link check: ${files.length} files scanned, ${totalBad} broken internal refs`);
  if (totalBad > 0) {
    console.log('FAIL: broken internal links found');
    process.exit(1);
  }
  console.log('OK: no broken internal links');
}

module.exports = { checkFile, htmlFiles };

if (require.main === module) main();
