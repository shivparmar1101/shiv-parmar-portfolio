#!/usr/bin/env node
/**
 * Normalize HTML + cache-bust core assets (idempotent, safe to run repeatedly).
 *
 * What it does to every root + blog HTML page:
 *   1. Repairs broken "</script defer>" end-tags (defer wrongly placed after
 *      the closing tag — browsers ignore it, so the script loaded sync).
 *      Moves defer into the opening <script> tag.
 *   2. Ensures local <script src> tags carry defer (skips async/JSON-LD/gtag).
 *   3. Injects a <noscript> fallback that reveals .reveal content when JS
 *      is disabled/failed (content must never stay invisible).
 *   4. Cache-busts core assets: appends ?v=<content-hash> to
 *      style.css / liquid-glass.css / script.js / includes.js /
 *      particle-bg.js / spatial-tilt.js references so a plain reload always
 *      fetches the fresh file (old Cache-Control: immutable entries never
 *      revalidate on their own).
 *
 * Wired into: scripts/enhance.js (runs after every auto-publish, so future
 * posts inherit all of this automatically).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

const ASSETS = [
  'style.css',
  'liquid-glass.css',
  'script.js',
  'includes.js',
  'particle-bg.js',
  'spatial-tilt.js',
];

const NOSCRIPT_REVEAL =
  '<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>';

function contentHash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
}

function repairBrokenDefer(html) {
  // "<script ...></script defer>" -> defer moved into the opening tag
  return html.replace(
    /<script\b([^>]*)>(\s*)<\/script(\s+)defer(\s*)>/gi,
    (m, attrs, ws) => {
      const hasDefer = /\b(?:defer|async)\b/i.test(attrs);
      const newAttrs = hasDefer ? attrs : attrs.replace(/\s+$/, '') + ' defer';
      return `<script${newAttrs}>${ws}</script>`;
    }
  );
}

function ensureLocalDefer(html) {
  return html.replace(
    /<script\b(?![^>]*\b(?:defer|async|type="application\/ld\+json"|type='application\/ld\+json'|src="https:\/\/www\.googletagmanager|src="https:\/\/connect\.facebook))[^>]*src="[^"]*"[^>]*>/gi,
    (tag) => (/\bdefer\b/i.test(tag) ? tag : tag.replace(/>\s*$/, ' defer>'))
  );
}

function injectNoscriptReveal(html) {
  if (html.includes('.reveal{opacity:1!important')) return html;
  const idx = html.lastIndexOf('</head>');
  if (idx === -1) return html;
  return html.slice(0, idx) + '  ' + NOSCRIPT_REVEAL + '\n' + html.slice(idx);
}

function bustAssets(html, hashes) {
  for (const asset of ASSETS) {
    const escaped = asset.replace(/\./g, '\\.');
    const re = new RegExp(`((?:href|src)="(?:\\.\\./)?${escaped})(\\?v=[a-f0-9]+)?`, 'g');
    html = html.replace(re, (_m, prefix) => `${prefix}?v=${hashes[asset]}`);
  }
  return html;
}

function processFile(file, hashes) {
  const before = fs.readFileSync(file, 'utf8');
  let html = before;
  html = repairBrokenDefer(html);
  html = ensureLocalDefer(html);
  html = injectNoscriptReveal(html);
  html = bustAssets(html, hashes);
  if (html !== before) {
    fs.writeFileSync(file, html);
    return true;
  }
  return false;
}

function main() {
  const hashes = {};
  for (const asset of ASSETS) {
    const p = path.join(ROOT, asset);
    hashes[asset] = fs.existsSync(p) ? contentHash(p) : '00000000';
  }

  const files = [
    ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')),
    ...fs
      .readdirSync(path.join(ROOT, 'blog'))
      .filter((f) => f.endsWith('.html'))
      .map((f) => path.join('blog', f)),
  ].map((f) => path.join(ROOT, f));

  let changed = 0;
  for (const f of files) if (processFile(f, hashes)) changed++;
  console.log(`Normalize: ${changed} / ${files.length} files updated`);
}

if (require.main === module) main();
module.exports = { repairBrokenDefer, ensureLocalDefer, injectNoscriptReveal, bustAssets };
