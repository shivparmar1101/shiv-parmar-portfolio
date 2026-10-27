#!/usr/bin/env node
/**
 * Auto Internal Link Injector - adds contextual + related internal links to blog posts.
 * Idempotent: uses marker comment <!-- AUTO_INTERNAL_LINKS --> so it never duplicates.
 * Free SEO boost: strengthens internal link graph (crawl + ranking signal).
 *
 * Run: node scripts/inject-internal-links.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const MARKER = '<!-- AUTO_INTERNAL_LINKS -->';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getPosts() {
  return fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html')).map(f => {
    const slug = path.basename(f, '.html');
    const html = fs.readFileSync(path.join(BLOG_DIR, f), 'utf8');
    const title = ((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || slug)
      .split('|')[0].split('&middot;')[0].trim();
    const keywords = ((html.match(/<meta name="keywords" content="([^"]*)"/i) || [])[1] || '')
      .split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const cats = (html.match(/<a href="\/blog" class="tag">([^<]*)<\/a>/gi) || [])
      .map(t => (t.match(/>[^<]*<\/a>/i)[0].replace(/<\/?a[^>]*>/g, '') || '').toLowerCase());
    return { slug, title, keywords, cats };
  });
}

function score(a, b) {
  // Shared keywords = relevance score
  const all = new Set([...a.keywords, ...a.cats]);
  let s = 0;
  for (const k of [...b.keywords, ...b.cats]) if (all.has(k)) s++;
  // Title overlap
  const at = a.title.toLowerCase().split(/\W+/);
  const bt = new Set(b.title.toLowerCase().split(/\W+/));
  for (const w of at) if (w.length > 4 && bt.has(w)) s++;
  return s;
}

function topRelated(all, post, n) {
  return all
    .filter(p => p.slug !== post.slug)
    .map(p => ({ p, s: score(post, p) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map(x => x.p);
}

function buildBlock(related) {
  if (!related.length) return '';
  const links = related
    .map(p => `<a href="../blog/${p.slug}" title="${esc(p.title)}">${esc(p.title)}</a>`)
    .join('\n      ');
  return `${MARKER}
<div class="related-inline" style="margin:0 0 28px;padding:16px 20px;background:var(--bg-glass);border:1px solid var(--border-glass);border-left:3px solid var(--accent);border-radius:var(--radius-md)">
  <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)">Related reading</p>
  <nav class="related-inline-links" aria-label="Related posts" style="display:flex;flex-direction:column;gap:6px">
      ${links}
  </nav>
</div>`;
}

function inject(html, block) {
  if (html.includes(MARKER)) {
    // Refresh existing block content (between marker and closing div)
    const start = html.indexOf(MARKER);
    const endIdx = html.indexOf('</div>', html.indexOf('</nav>', start));
    if (endIdx !== -1) {
      return html.slice(0, start) + block + html.slice(endIdx + 6);
    }
    return html;
  }
  // Insert right after the first <div class="content"> opening tag
  const anchor = html.match(/<div class="content">\s*/i);
  if (!anchor) return null; // not a standard blog layout
  const idx = html.indexOf(anchor[0]) + anchor[0].length;
  return html.slice(0, idx) + '\n' + block + '\n' + html.slice(idx);
}

function main() {
  if (!fs.existsSync(BLOG_DIR)) { console.log('No blog dir'); return; }
  const all = getPosts();
  let changed = 0;
  for (const post of all) {
    const file = path.join(BLOG_DIR, post.slug + '.html');
    let html = fs.readFileSync(file, 'utf8');
    const related = topRelated(all, post, 4);
    if (!related.length) continue;
    const block = buildBlock(related);
    const out = inject(html, block);
    if (out && out !== html) {
      fs.writeFileSync(file, out);
      changed++;
    }
  }
  console.log(`Internal links: updated ${changed} / ${all.length} posts`);
}

module.exports = { getPosts, topRelated, buildBlock, inject };

if (require.main === module) main();
