#!/usr/bin/env node
/**
 * Generate rss.xml from blog posts (idempotent - overwrites each run).
 * Free, no dependencies. Run: node scripts/generate-rss.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const OUT = path.join(ROOT, 'rss.xml');
const SITE_URL = 'https://shiv-parmar-portfolio.netlify.app';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textOnly(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePost(file) {
  const html = fs.readFileSync(file, 'utf8');
  const slug = path.basename(file, '.html');

  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || slug.replace(/-/g, ' ');
  const desc =
    (html.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || '';
  const dateStr =
    (html.match(/<div class="date">([^<]*)<\/div>/i) || [])[1] ||
    (html.match(/article:published_time" content="([^"]*)"/) || [])[1] ||
    '';
  const keywords = (html.match(/<meta name="keywords" content="([^"]*)"/i) || [])[1] || '';

  // Extract first paragraph as description fallback
  let bodyDesc = desc;
  if (!bodyDesc) {
    const p = html.match(/<div class="content">\s*<p>([\s\S]*?)<\/p>/i);
    if (p) bodyDesc = textOnly(p[1]);
  }

  const cleanDate = dateStr.match(/\d{4}-\d{2}-\d{2}/)
    ? dateStr.match(/\d{4}-\d{2}-\d{2}/)[0]
    : new Date().toISOString().split('T')[0];

  return { slug, title, desc: bodyDesc, keywords, date: cleanDate };
}

function buildRSS() {
  if (!fs.existsSync(BLOG_DIR)) return '';

  const posts = fs
    .readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => parsePost(path.join(BLOG_DIR, f)))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  const items = posts
    .map(p => {
      const link = `${SITE_URL}/blog/${p.slug}`;
      const pubDate = new Date(p.date + 'T00:00:00Z').toUTCString();
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${esc(p.desc)}</description>
      <category>${esc(p.keywords.split(',')[0] || 'WordPress')}</category>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Shiv Parmar - WordPress Development Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Expert guides on WordPress, WooCommerce, plugin development and performance optimization by Shiv Parmar, professional WordPress developer.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Shiv Parmar RSS Generator</generator>
${items}
  </channel>
</rss>
`;
}

function main() {
  const rss = buildRSS();
  if (!rss) {
    console.log('No blog posts found - rss.xml not written');
    return;
  }
  fs.writeFileSync(OUT, rss);
  const count = (rss.match(/<item>/g) || []).length;
  console.log(`rss.xml generated: ${count} items`);
}

module.exports = { buildRSS };

if (require.main === module) main();
