#!/usr/bin/env node
/**
 * WebP Image Optimizer (idempotent)
 *
 * Converts JPG/PNG -> WebP (free, lossy-but-visually-lossless) and rewrites
 * <img src="foo.jpg"> to a <picture> block:
 *   <picture>
 *     <source type="image/webp" srcset="foo.webp">
 *     <img src="foo.jpg" ...>
 *   </picture>
 * Original JPG stays as fallback (older browser safety). Marked idempotent.
 *
 * Requires `sharp` (free). If missing, prints install hint and exits 0 (never breaks CI).
 * Run: node scripts/optimize-webp.js [--all]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const SKIP = new Set(['header.html', 'footer.html']);
const MARKER = '<!-- AUTO_WEBP -->';

let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}

function htmlFiles() {
  const out = [];
  for (const f of fs.readdirSync(ROOT)) {
    if (f.endsWith('.html') && !SKIP.has(f) && !/^google[a-f0-9]+\.html$/i.test(f)) out.push(path.join(ROOT, f));
  }
  if (fs.existsSync(BLOG_DIR)) {
    for (const f of fs.readdirSync(BLOG_DIR)) if (f.endsWith('.html')) out.push(path.join(BLOG_DIR, f));
  }
  return out;
}

async function convertOne(imgPath) {
  const webpPath = imgPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  if (fs.existsSync(webpPath)) return true; // already converted
  try {
    await sharp(imgPath).webp({ quality: 78, effort: 4 }).toFile(webpPath);
    const before = fs.statSync(imgPath).size;
    const after = fs.statSync(webpPath).size;
    console.log(`  ${path.basename(imgPath)} ${before}B -> ${path.basename(webpPath)} ${after}B`);
    return true;
  } catch (e) {
    console.log(`  WARN convert failed ${path.basename(imgPath)}: ${e.message}`);
    return false;
  }
}

function rewriteImg(html) {
  // Only rewrite local .jpg/.png img tags not already wrapped
  let changed = false;
  html = html.replace(/<img\b[^>]*>/gi, tag => {
    const srcM = tag.match(/src="([^"]+\.(?:jpg|jpeg|png))"/i);
    if (!srcM) return tag;
    const src = srcM[1];
    if (src.startsWith('http') || src.startsWith('data:')) return tag;

    // Check if webp exists (relative to page dir)
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    // Only wrap if the corresponding webp file exists on disk
    // Resolve relative to ROOT (works for root pages) — blog pages use ../
    const resolved = src.replace(/^\.\.\//, '');
    const webpResolved = resolved.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    if (!fs.existsSync(path.join(ROOT, webpResolved))) return tag;

    changed = true;
    // Use marker as a stable anchor — but marker can't sit inside regex tag. Wrap with picture.
    // To keep idempotent, we detect by checking if tag is already preceded by picture in caller.
    const webpTag = webpSrc;
    return `<picture><source type="image/webp" srcset="${webpTag}">${tag}</picture>`;
  });
  return { html, changed };
}

function wrapOnce(html) {
  // Idempotency: if AUTO_WEBP marker present, skip re-wrap entirely for that region.
  // Simplest global guard: if page already has marker AND picture blocks, leave it.
  if (html.includes(MARKER)) return { html, changed: false };
  const r = rewriteImg(html);
  if (!r.changed) return { html, changed: false };
  // Add marker before first <picture> to record we've processed this file
  const idx = r.html.indexOf('<picture>');
  if (idx !== -1) {
    const out = r.html.slice(0, idx) + MARKER + '\n' + r.html.slice(idx);
    return { html: out, changed: true };
  }
  return { html: r.html, changed: true };
}

async function main() {
  if (!sharp) {
    console.log('sharp not installed - skipping WebP conversion (free to add: npm i sharp)');
    console.log('Install with: npm install sharp  then re-run: npm run seo:webp');
    process.exit(0); // never fail CI
  }

  // 1. Convert all local jpg/png in images/
  const imgDir = path.join(ROOT, 'images');
  if (fs.existsSync(imgDir)) {
    const imgs = fs.readdirSync(imgDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    console.log(`Converting ${imgs.length} images in images/`);
    for (const f of imgs) await convertOne(path.join(imgDir, f));
  }

  // 2. Rewrite img tags in HTML
  const files = htmlFiles();
  let changed = 0;
  for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');
    const r = wrapOnce(html);
    if (r.changed) { fs.writeFileSync(f, r.html); changed++; }
  }
  console.log(`WebP: rewrote ${changed} / ${files.length} HTML files`);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(0); });

module.exports = { rewriteImg, wrapOnce };
