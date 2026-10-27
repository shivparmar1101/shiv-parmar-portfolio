#!/usr/bin/env node
/**
 * Dev.to Syndicator (FREE backlinks)
 *
 * Republishes new blog posts to Dev.to with canonical_url -> your site
 * (Dev.to marks it canonical, so it's a free backlink, not duplicate content).
 * Tracks what's already syndicated in seo-data/syndicated.json (idempotent).
 *
 * Env: DEVTO_API_KEY (free PAT: dev.to -> Settings -> Extensions -> PAT)
 *      If unset -> skips gracefully (exit 0), never breaks CI.
 *
 * Run: node scripts/syndicate-devto.js [--limit=N] [--dry-run] [--force=slug]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const STATE = path.join(ROOT, 'seo-data', 'syndicated.json');
const SITE_URL = 'https://shiv-parmar-portfolio.netlify.app';

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const LIMIT = (() => { const a = args.find(x => x.startsWith('--limit=')); return a ? parseInt(a.split('=')[1], 10) || 3 : 3; })();
const FORCE = (() => { const a = args.find(x => x.startsWith('--force=')); return a ? a.split('=')[1] : null; })();

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { devto: [] }; }
}
function saveState(s) { fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(s, null, 2)); }

// --- Minimal HTML -> Markdown (covers the blog template structure) ---
function htmlToMarkdown(html) {
  let md = html
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (m, c) => '```' + decodeEnt(c) + '\n```\n')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (m, c) => '```' + decodeEnt(c) + '\n```\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (m, c) => '\n## ' + decodeEnt(c).trim() + '\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (m, c) => '\n### ' + decodeEnt(c).trim() + '\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (m, c) => '\n#### ' + decodeEnt(c).trim() + '\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, c) => '\n> ' + decodeEnt(c).replace(/\s+/g, ' ').trim() + '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, c) => '\n- ' + decodeEnt(c).trim())
    .replace(/<\/(ul|ol)>/gi, '\n')
    .replace(/<strong>|<b>/gi, '**').replace(/<\/strong>|<\/b>/gi, '**')
    .replace(/<em>|<i>/gi, '*').replace(/<\/em>|<\/i>/gi, '*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (m, c) => '`' + decodeEnt(c) + '`')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, txt) => `[${decodeEnt(txt).trim()}](${href})`)
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (m, src) => `\n![image](${src})\n`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '\n').replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  md = decodeEnt(md)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return md;
}
function decodeEnt(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&mdash;/g, '—')
    .replace(/&middot;/g, '·').replace(/&rarr;/g, '→').replace(/&nbsp;/g, ' ');
}

function extractContent(html) {
  const startM = html.match(/<div class="content">\s*([\s\S]*?)<div class="tags">/i);
  let body = startM ? startM[1] : '';
  // Remove our injected related-reading block (internal links - not useful off-site).
  // Match precisely: <div class="related-inline" ...> ... </nav></div>
  body = body.replace(/<div class="related-inline"[\s\S]*?<\/nav>\s*<\/div>/i, '');
  // Keep CTA blocks (harmless promo text + mailto) - do NOT remove, they over-match.
  return htmlToMarkdown(body);
}

function extractTags(html) {
  const kw = (html.match(/<meta name="keywords" content="([^"]*)"/i) || [])[1] || '';
  // Dev.to prefers short, single-token lowercase tags. Split keywords into words,
  // filter stopwords/short words, prefer content-bearing tokens, dedupe, cap at 4.
  const STOP = new Set(['the', 'for', 'and', 'with', 'your', 'you', 'how', 'best', 'guide', '2026', 'new', 'top', 'a', 'an']);
  const words = kw.split(',')
    .flatMap(k => k.trim().toLowerCase().split(/\s+/))
    .map(w => w.replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length >= 3 && w.length <= 20 && !STOP.has(w));
  // Priority tokens first
  const PRIORITY = ['wordpress', 'woocommerce', 'php', 'javascript', 'seo', 'gutenberg', 'plugin', 'plugins', 'themes', 'security', 'performance', 'restapi', 'blocktheme', 'wp'];
  const seen = new Set();
  const out = [];
  for (const p of PRIORITY) if (words.includes(p) && !seen.has(p)) { seen.add(p); out.push(p); }
  for (const w of words) { if (out.length >= 4) break; if (!seen.has(w)) { seen.add(w); out.push(w); } }
  return out.slice(0, 4);
}

function postToDevto(key, article) {
  const payload = JSON.stringify({ article });
  return new Promise(resolve => {
    const options = {
      hostname: 'dev.to',
      path: '/api/articles',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 30000
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        let url = null;
        try { const j = JSON.parse(data); url = j.url || (j.article && j.article.url) || null; } catch {}
        resolve({ status: res.statusCode, url, body: data.slice(0, 300) });
      });
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.write(payload);
    req.end();
  });
}

function getPending() {
  const state = loadState();
  const done = new Set(state.devto || []);
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'))
    .sort((a, b) => fs.statSync(path.join(BLOG_DIR, b)).mtimeMs - fs.statSync(path.join(BLOG_DIR, a)).mtimeMs);
  return files
    .map(f => path.basename(f, '.html'))
    .filter(slug => FORCE ? slug === FORCE : !done.has(slug));
}

async function main() {
  console.log('=== Dev.to Syndicator ===');
  if (!fs.existsSync(BLOG_DIR)) { console.log('No blog dir'); process.exit(0); }

  const key = process.env.DEVTO_API_KEY;
  if (!key || !key.trim()) {
    console.log('DEVTO_API_KEY not set - skipping (free key: dev.to > Settings > Extensions > PAT)');
    process.exit(0);
  }

  const pending = getPending().slice(0, LIMIT);
  if (!pending.length) { console.log('Nothing new to syndicate'); process.exit(0); }

  const state = loadState();
  for (const slug of pending) {
    const file = path.join(BLOG_DIR, slug + '.html');
    const html = fs.readFileSync(file, 'utf8');
    const title = ((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || slug).split('&middot;')[0].trim();
    const canonical = `${SITE_URL}/blog/${slug}`;
    const body = extractContent(html);
    if (!body || body.length < 300) {
      console.log(`  skip ${slug}: content too short (${body.length} chars)`);
      continue;
    }
    const article = {
      title,
      body_markdown: body + `\n\n---\n\n*Originally published at [${canonical}](${canonical}) by Shiv Parmar, WordPress Developer.*`,
      published: true,
      canonical_url: canonical,
      tags: extractTags(html)
    };
    if (DRY) {
      console.log(`DRY: would post "${title}" (${body.length} chars, tags: ${article.tags.join(',')})`);
      continue;
    }
    const r = await postToDevto(key.trim(), article);
    console.log(`  ${slug}: HTTP ${r.status} ${r.url || r.body}`);
    if (r.status === 201 || r.status === 200) {
      if (!state.devto.includes(slug)) state.devto.push(slug);
      state.lastRun = new Date().toISOString();
      saveState(state);
    }
  }
  if (!DRY) console.log(`Syndicated set size: ${(loadState().devto || []).length}`);
  process.exit(0);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(0); });

module.exports = { htmlToMarkdown, extractContent, extractTags };
