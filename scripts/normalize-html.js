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
 *   4. Normalizes tables: the model emits light-theme inline styles (white
 *      backgrounds + light borders) that clash with the dark theme and hide
 *      light text. Those clashing inline color/border styles are stripped and
 *      a single clean dark-theme table stylesheet is injected so every table
 *      reads consistently.
 *   5. Cache-busts core assets: appends ?v=<content-hash> to
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

// Idempotent marker so we only inject once per page.
const TABLE_STYLE_MARKER = '/* table-normalize */';

// Clean, dark-theme-aware table styling. The generation model emits tables with
// hardcoded LIGHT-theme inline styles (white backgrounds, light borders), which
// clash with the dark theme and make light text invisible. We strip those inline
// styles and apply this single stylesheet instead.
const TABLE_CSS = `<style>
${TABLE_STYLE_MARKER}
.content table,table{width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;text-align:left;border:1px solid var(--border-glass,rgba(255,255,255,.1));font-family:var(--font-primary)}
.content thead th,table thead th{background:var(--bg-glass-strong,rgba(255,255,255,.08));padding:12px 15px;color:var(--text-primary,#f0f0f5);font-weight:700;border:1px solid var(--border-glass,rgba(255,255,255,.1));border-bottom:2px solid var(--accent,#c9a84c)}
.content th,.content td,table th,table td{padding:12px 15px;border:1px solid var(--border-glass,rgba(255,255,255,.1))}
.content th,table th{color:var(--text-primary,#f0f0f5);font-weight:700;background:var(--bg-glass-strong,rgba(255,255,255,.08))}
.content td,table td{color:var(--text-secondary,#a0a3b5)}
.content tbody tr:nth-child(even),table tbody tr:nth-child(even){background:var(--bg-glass,rgba(255,255,255,.03))}
.content tbody tr:hover,table tbody tr:hover{background:var(--bg-glass-hover,rgba(255,255,255,.06))}
</style>
`;

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

// Strip the model's hardcoded light-theme inline styles (background-color,
// border colors) from table markup so the injected dark-theme TABLE_CSS wins.
// Keeps useful inline layout styles (width, padding, text-align, font-weight).
function stripTableInlineStyles(html) {
  return html.replace(
    /<(table|thead|tbody|tfoot|tr|th|td)\b([^>]*)>/gi,
    (m, tag, attrs) => {
      if (!/style\s*=/i.test(attrs)) return m;
      const cleaned = attrs.replace(/\s*style\s*=\s*(["'])([\s\S]*?)\1/gi, (sm, q, val) => {
        const kept = String(val)
          // split declarations, drop clashing color/border-color/background rules
          .split(';')
          .map((d) => d.trim())
          .filter((d) => {
            if (!d) return false;
            const prop = d.split(':')[0].trim().toLowerCase();
            if (prop === 'background' || prop === 'background-color') return false;
            if (prop === 'color') return false; // text color -> let CSS own it (dark theme)
            if (prop === 'border' || prop === 'border-color') return false;
            if (prop === 'border-bottom' || prop === 'border-top' ||
                prop === 'border-left' || prop === 'border-right') return false;
            return true;
          })
          .join('; ');
        return kept ? ` style="${kept}"` : '';
      });
      return `<${tag}${cleaned}>`;
    }
  );
}

// Inject the clean table stylesheet once, right before </head>.
function injectTableCSS(html) {
  if (html.includes(TABLE_STYLE_MARKER)) return html;
  const idx = html.lastIndexOf('</head>');
  if (idx === -1) return html;
  return html.slice(0, idx) + TABLE_CSS + html.slice(idx);
}

function normalizeTables(html) {
  return injectTableCSS(stripTableInlineStyles(html));
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
  html = normalizeTables(html);
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
module.exports = { repairBrokenDefer, ensureLocalDefer, injectNoscriptReveal, normalizeTables, stripTableInlineStyles, injectTableCSS, bustAssets };
