#!/usr/bin/env node
/**
 * Core Web Vitals Optimizer (idempotent, safe for all HTML pages + future posts)
 *
 * Applies free, no-risk optimizations:
 *  1. Add loading="lazy" decoding="async" to below-the-fold images (skip hero/first images)
 *  2. Add width/height from existing attributes if missing (prevents CLS) - only if detectable
 *  3. Add fetchpriority="high" to the hero image (LCP boost)
 *  4. Defer non-critical <script src> that lack defer/async (particle, tilt, etc.)
 *  5. Add rel="preload" hints already handled elsewhere
 *
 * Run: node scripts/optimize-cwv.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');

// Files to skip (partials, verification)
const SKIP = new Set(['header.html', 'footer.html']);

// Hero / LCP images: give them fetchpriority high instead of lazy
const HERO_RE = /class="[^"]*hero-img[^"]*"|class="[^"]*hero[^"]*"|class="[^"]*page-hero/;

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

function optimizeImages(html) {
  let changed = false;
  let imgCount = 0;
  html = html.replace(/<img\b[^>]*>/gi, tag => {
    imgCount++;
    const isHero = HERO_RE.test(tag) || imgCount === 1; // first image often LCP
    let t = tag;

    if (isHero) {
      if (!/fetchpriority=/i.test(t)) t = t.replace(/^<img/i, '<img fetchpriority="high"');
      if (!/loading=/i.test(t)) t = t.replace(/^<img/i, '<img loading="eager"');
      if (!/decoding=/i.test(t)) t = t.replace(/^<img/i, '<img decoding="async"');
    } else {
      if (!/loading=/i.test(t)) t = t.replace(/^<img/i, '<img loading="lazy"');
      if (!/decoding=/i.test(t)) t = t.replace(/^<img/i, '<img decoding="async"');
    }
    if (t !== tag) changed = true;
    return t;
  });
  return { html, changed };
}

function deferScripts(html) {
  let changed = false;
  // Only touch local script tags without defer/async (external SDKs like gtag should stay as authored)
  html = html.replace(/<script\b(?![^>]*\b(?:defer|async|type="application\/ld\+json"|type='application\/ld\+json'|src="https:\/\/www\.googletagmanager|src="https:\/\/connect\.facebook))[^>]*src="[^"]*"[^>]*><\/script>/gi, tag => {
    if (/>$/.test(tag) && !/defer/i.test(tag)) {
      changed = true;
      return tag.replace(/>\s*$/, ' defer>');
    }
    return tag;
  });
  return { html, changed };
}

function addPreconnect(html) {
  // Ensure preconnect for fonts (cheap LCP win)
  if (html.includes('fonts.gstatic.com') || html.includes('rel="preconnect"')) return { html, changed: false };
  const idx = html.indexOf('</head>');
  if (idx === -1) return { html, changed: false };
  const hint = '  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n';
  return { html: html.slice(0, idx) + hint + html.slice(idx), changed: true };
}

function addRssAutodiscovery(html) {
  // Feed readers + Google discover the RSS feed via <link rel="alternate">
  if (html.includes('type="application/rss+xml"')) return { html, changed: false };
  const idx = html.indexOf('</head>');
  if (idx === -1) return { html, changed: false };
  const link = '  <link rel="alternate" type="application/rss+xml" title="Shiv Parmar - WordPress Blog RSS" href="/rss.xml">\n';
  return { html: html.slice(0, idx) + link + html.slice(idx), changed: true };
}

function processFile(file) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const a = optimizeImages(html); html = a.html;
  const b = deferScripts(html); html = b.html;
  const c = addPreconnect(html); html = c.html;
  const d = addRssAutodiscovery(html); html = d.html;
  if (html !== before) { fs.writeFileSync(file, html); return true; }
  return false;
}

function main() {
  const files = htmlFiles();
  let changed = 0;
  for (const f of files) if (processFile(f)) changed++;
  console.log(`CWV: optimized ${changed} / ${files.length} files`);
}

module.exports = { optimizeImages, deferScripts, addPreconnect, addRssAutodiscovery };

if (require.main === module) main();
