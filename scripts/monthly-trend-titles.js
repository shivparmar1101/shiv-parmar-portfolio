#!/usr/bin/env node
/**
 * Monthly WordPress title planner.
 *
 * Pulls WordPress-related search demand from Google (all free, no API key) and turns it
 * into a month of blog titles that are NOT already published or queued:
 *
 *   1. Google Trends daily trending RSS   (trends.google.com/trending/rss?geo=..)
 *   2. Google Trends related queries      (trends api explore - best effort, often 429)
 *   3. Google News RSS for WordPress      (news.google.com/rss/search?q=wordpress..)
 *   4. Google Autocomplete suggestions    (suggestqueries.google.com)
 *   5. Built-in evergreen WordPress pool  (only used to fill whatever the above cannot)
 *
 * Every title is checked against blog/*.html (published) and blog-queue.json (queued and
 * published) by normalised title, by slug, and by token overlap, so a topic that already
 * exists never comes back. Gemini polishes the titles when GEMINI_API_KEY is available
 * (best effort - a quota error falls back to the deterministic templates).
 *
 * Output:
 *   blog-queue.json          new entries appended with status "pending"
 *   docs/TREND-PLAN-YYYY-MM.md  human readable month calendar with the source of each title
 *
 * Env:
 *   GEMINI_API_KEY   optional - enables AI title polish
 *
 * Flags:
 *   --count=N     how many titles to plan (default 30 = 1/day)
 *   --month=YYYY-MM  target month (default: current month)
 *   --no-queue    write the plan document only, do not touch blog-queue.json
 *   --no-gemini   skip the AI polish even if the key is set
 *   --dry-run     print the plan, write nothing
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const QUEUE_FILE = path.join(ROOT, 'blog-queue.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const DOCS_DIR = path.join(ROOT, 'docs');

const SITE_URL = 'https://shiv-parmar-portfolio.netlify.app';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const TIMEOUT_MS = 20000;
const TITLE_MIN = 30;
const TITLE_MAX = 65;
// How many distinct news stories may enter the month's plan (the rest is search demand).
const NEWS_STORY_CAP = 8;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NO_QUEUE = args.includes('--no-queue');
const NO_GEMINI = args.includes('--no-gemini');
const flagValue = (name, fallback) => {
  const a = args.find(x => x.startsWith(`${name}=`));
  return a ? a.slice(name.length + 1).trim() : fallback;
};
const COUNT = Math.max(1, Math.min(365, parseInt(flagValue('--count', '30'), 10) || 30));
const MONTH = flagValue('--month', new Date().toISOString().slice(0, 7));
if (!/^\d{4}-\d{2}$/.test(MONTH)) {
  console.error(`ERROR: --month must be YYYY-MM (got "${MONTH}")`);
  process.exit(1);
}

/* ------------------------------------------------------------------ helpers */

const sleep = ms => new Promise(r => setTimeout(r, ms));

// callGemini has no request timeout of its own, and a hung model call would stall the
// whole workflow - race every model call against a deadline and fall back gracefully.
const GEMINI_TIMEOUT_MS = Math.max(10000, parseInt(process.env.GEMINI_TIMEOUT_MS || '240000', 10) || 240000);

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function geminiCall(prompt, label) {
  const { callGemini } = require('./auto-blog-generator');
  const started = Date.now();
  return withTimeout(callGemini(prompt), GEMINI_TIMEOUT_MS, label)
    .then(text => {
      console.log(`  ${label}: ok in ${((Date.now() - started) / 1000).toFixed(1)}s`);
      return text;
    });
}

async function fetchText(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': options.accept || '*/*' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...options.fetch,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function decodeXml(s) {
  return String(s)
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, m => m.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, ''))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRssItems(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
  for (const block of blocks) {
    const pick = re => {
      const m = block.match(re);
      return m ? decodeXml(m[1]) : '';
    };
    items.push({
      title: pick(/<title>([\s\S]*?)<\/title>/),
      pubDate: pick(/<pubDate>([\s\S]*?)<\/pubDate>/),
      source: pick(/<source[^>]*>([\s\S]*?)<\/source>/),
      traffic: pick(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/),
    });
  }
  return items;
}

/* -------------------------------------------------------- dedupe foundation */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'for', 'to', 'in', 'on', 'and', 'or', 'with', 'your', 'my',
  'is', 'it', 'at', 'by', 'from', 'into', '2024', '2025', '2026', '2027',
]);

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&amp;/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(text) {
  return normalize(text).split(' ').filter(w => w && !STOPWORDS.has(w));
}

function slugify(text) {
  return normalize(text).replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
}

function jaccard(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size || !setB.size) return 0;
  let shared = 0;
  for (const t of setA) if (setB.has(t)) shared++;
  return shared / (setA.size + setB.size - shared);
}

function collectExistingTitles() {
  const out = [];

  // Published posts (blog/*.html)
  if (fs.existsSync(BLOG_DIR)) {
    for (const file of fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      let title = (html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || '';
      if (!title) title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
      title = decodeXml(title).replace(/\s*\|\s*Shiv Parmar\s*$/i, '').trim();
      if (title) out.push({ title, slug: path.basename(file, '.html'), origin: 'published' });
    }
  }

  // Everything already in the queue (pending items become posts, published items are posts)
  try {
    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    for (const b of queue.blogs || []) {
      if (b.title) out.push({ title: b.title, slug: b.slug || slugify(b.title), origin: `queue:${b.status}` });
    }
  } catch (e) {
    console.warn(`WARNING: could not read blog-queue.json (${e.message}) - dedupe will only use published posts`);
  }

  // Sitemap URLs (belt and braces: an URL means the post exists)
  try {
    const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const seg = m[1].trim().split('/').filter(Boolean).pop() || '';
      if (seg && seg !== 'blog' && seg !== 'category') out.push({ title: '', slug: seg, origin: 'sitemap' });
    }
  } catch (e) { /* sitemap optional */ }

  return out;
}

function makeDedupe(existing) {
  const slugs = new Set(existing.map(e => e.slug).filter(Boolean));
  const entries = existing.filter(e => e.title).map(e => ({ title: e.title, tokens: tokens(e.title) }));

  return {
    slugs,
    count: entries.length,
    isDuplicate(title) {
      const norm = normalize(title);
      if (!norm) return true;
      if (entries.some(e => normalize(e.title) === norm)) return true;
      const t = tokens(title);
      return entries.some(e => jaccard(t, e.tokens) >= 0.6);
    },
    isDuplicateSlug(slug) {
      return slugs.has(slug);
    },
  };
}

/* ------------------------------------------------------------- title sources */

const WP_RE = /\b(wordpress|woocommerce|gutenberg|elementor|divi|wp)\b|website builder|\bcms\b|\bhosting\b|\bseo\b/i;

// Autocomplete seeds like "gutenberg" also return history questions ("Johann Gutenberg's
// original press") - require an actual WordPress signal for a topic to qualify.
const WP_TOPIC_RE = /\b(wordpress|woocommerce|wp|elementor|divi)\b|gutenberg\s+(block|editor|theme|plugin|site|website|pattern|template|style)|website builder|\bseo\b|\bhosting\b|\bcms\b/i;

async function fetchTrendsDaily() {
  const geos = ['US', 'IN', 'GB'];
  const found = [];
  for (const geo of geos) {
    try {
      const xml = await fetchText(`https://trends.google.com/trending/rss?geo=${geo}`);
      for (const item of parseRssItems(xml)) {
        if (item.title && WP_TOPIC_RE.test(item.title)) {
          found.push({ topic: item.title, source: 'google-trends', detail: `trending ${geo}${item.traffic ? `, ${item.traffic} searches` : ''}` });
        }
      }
    } catch (e) {
      console.warn(`  trends ${geo}: ${e.message}`);
    }
  }
  return found;
}

async function fetchTrendsRelated() {
  const seeds = ['wordpress', 'woocommerce', 'gutenberg'];
  const found = [];
  for (const keyword of seeds) {
    try {
      const req = JSON.stringify({
        comparisonItem: [{ keyword, geo: '', time: 'today 12-m' }],
        category: 0,
        property: '',
      });
      const url = `https://trends.google.com/trends/api/explore?hl=en-US&tz=0&req=${encodeURIComponent(req)}`;
      const raw = await fetchText(url, { accept: 'application/json' });
      const json = JSON.parse(raw.replace(/^\)\]\}',?\s*/, ''));
      const lists = (json && json[0] && json[0].reads && json[0].reads[0] && json[0].reads[0].rankedList) || [];
      for (const list of lists) {
        for (const k of (list.rankedKeyword || [])) {
          const q = (k.query || (k.topic && k.topic.title) || '').trim();
          if (q && WP_TOPIC_RE.test(q)) found.push({ topic: q, source: 'google-trends', detail: `related to "${keyword}"` });
        }
      }
    } catch (e) {
      console.warn(`  trends related "${keyword}": ${e.message}`);
    }
    await sleep(400);
  }
  return found;
}

// One story gets covered by ten outlets. Ask Gemini to collapse a headline list into
// distinct stories; when the key is missing or the call fails the list is used as-is.
async function groupNewsStories(headlines, maxStories) {
  if (!headlines.length || NO_GEMINI || !process.env.GEMINI_API_KEY) return headlines;
  try {
    const prompt = [
      'You are the news editor of a WordPress developer blog.',
      'The list below contains headlines about the same few stories from different outlets.',
      `Group them by story and keep ONE representative headline per story, at most ${maxStories}.`,
      'Keep each headline factual, 40-65 characters, and in its original language.',
      'Return ONLY a JSON array of strings - no markdown, no commentary.',
      '',
      'Headlines:',
      ...headlines.map((h, i) => `${i + 1}. ${h}`),
    ].join('\n');

    const text = await geminiCall(prompt, 'news grouping');
    const cleaned = String(text).replace(/```(?:json)?/gi, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error(`no JSON array: ${cleaned.slice(0, 120)}`);
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr) || !arr.length) throw new Error('empty array');
    const kept = arr.map(x => String(x).trim()).filter(Boolean).slice(0, maxStories);
    console.log(`  news: ${headlines.length} headlines grouped into ${kept.length} stories`);
    return kept;
  } catch (e) {
    console.warn(`  news grouping skipped: ${String(e.message).slice(0, 120)}`);
    return headlines;
  }
}

// Lexical overlap misses reworded repeats ("Bricksforge Critical Vulnerability" vs
// "Critical Bricksforge Plugin Flaw"), so Gemini also drops candidates that cover a
// story the blog already has. Best effort: a missing key or a failed call keeps them.
async function dropAlreadyCovered(candidates, existingTitles) {
  if (!candidates.length || NO_GEMINI || !process.env.GEMINI_API_KEY) return candidates;
  try {
    const prompt = [
      'You are the editor of a WordPress developer blog.',
      'Existing posts (already published or queued) - a new post must NOT repeat any of them:',
      ...existingTitles.map((t, i) => `${i + 1}. ${t}`),
      '',
      'Candidate topics for next month:',
      ...candidates.map((c, i) => `${i + 1}. ${c.topic} [${c.source}]`),
      '',
      'Remove every candidate that covers the same story, feature, vulnerability, plugin or',
      'question as an existing post - rewording does not make it a new topic.',
      'Keep the remaining candidates in their original order and invent nothing.',
      'Return ONLY a JSON array of the KEPT candidate numbers as integers, no markdown.',
    ].join('\n');

    const text = await geminiCall(prompt, 'semantic dedupe');
    const cleaned = String(text).replace(/```(?:json)?/gi, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error(`no JSON array: ${cleaned.slice(0, 120)}`);
    const picked = JSON.parse(match[0]);
    if (!Array.isArray(picked)) throw new Error('response is not an array');

    const kept = picked
      .filter(n => Number.isInteger(n) && n >= 1 && n <= candidates.length)
      .map(n => candidates[n - 1]);
    if (!kept.length) throw new Error('empty selection');
    console.log(`  semantic dedupe: ${candidates.length} candidates -> ${kept.length} kept ` +
      `(${candidates.length - kept.length} already covered)`);
    return kept;
  } catch (e) {
    console.warn(`  semantic dedupe skipped: ${String(e.message).slice(0, 120)}`);
    return candidates;
  }
}

async function fetchNews() {
  const queries = ['wordpress', 'woocommerce', 'gutenberg wordpress', 'wordpress plugin'];
  const found = [];
  const seen = new Set();
  for (const q of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      const xml = await fetchText(url);
      for (const item of parseRssItems(xml)) {
        let title = item.title || '';
        if (item.source && title.endsWith(` - ${item.source}`)) title = title.slice(0, -(item.source.length + 3));
        title = title.replace(/\s+/g, ' ').trim();
        if (!title || seen.has(normalize(title))) continue;
        if (!WP_RE.test(title)) continue;
        // A story that only mentions WordPress at the very end is not a WordPress story.
        if (!WP_RE.test(title.split(/\s+/).slice(0, 8).join(' '))) continue;
        seen.add(normalize(title));
        found.push({ topic: title, source: 'google-news', detail: `news for "${q}"` });
      }
    } catch (e) {
      console.warn(`  news "${q}": ${e.message}`);
    }
  }
  // Collapse the same story reported by several outlets before it reaches the plan.
  const grouped = await groupNewsStories(found.map(f => f.topic), NEWS_STORY_CAP);
  const byTopic = new Map(found.map(f => [normalize(f.topic), f]));
  return grouped.map(topic => {
    const hit = byTopic.get(normalize(topic));
    return hit || { topic, source: 'google-news', detail: 'news for "wordpress"' };
  });
}

async function fetchAutocomplete() {
  const seeds = [
    'wordpress', 'woocommerce', 'gutenberg', 'wordpress plugin', 'wordpress theme',
    'wordpress seo', 'wordpress speed', 'wordpress security', 'wordpress ai', 'elementor',
  ];
  const found = [];
  const seen = new Set();
  for (const seed of seeds) {
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(seed)}`;
      const text = await fetchText(url, { accept: 'application/json' });
      const data = JSON.parse(text);
      for (const s of (Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [])) {
        const topic = String(s).trim();
        if (!topic || seen.has(normalize(topic))) continue;
        // Navigational queries ("wordpress login", "wordpress.com") are not blog topics.
        if (/\b(login|log in|sign in|signin|download|password|\.com|\.org|pricing|contact us|customer service)\b/i.test(topic)) continue;
        // ...and neither are history questions returned by the "gutenberg" seed.
        if (!WP_TOPIC_RE.test(topic)) continue;
        seen.add(normalize(topic));
        found.push({ topic, source: 'autocomplete', detail: `people search "${seed} ..."` });
      }
    } catch (e) {
      console.warn(`  autocomplete "${seed}": ${e.message}`);
    }
  }
  return found;
}

// Used only when the live sources cannot fill the month. Topics, not finished titles,
// so the template/Gemini step still has room to vary the wording.
const EVERGREEN_POOL = [
  'how to set up a CDN for WordPress',
  'best WordPress CDN services compared',
  'how to enable object caching in WordPress',
  'WordPress database optimization guide',
  'how to reduce server response time in WordPress',
  'WordPress lazy loading guide',
  'how to set up a WordPress firewall',
  'WordPress file and folder permissions explained',
  'how to disable XML-RPC in WordPress',
  'WordPress malware scanning guide',
  'how to stop user enumeration in WordPress',
  'WordPress password policy for teams',
  'how to create a child theme in WordPress',
  'WordPress hooks actions and filters explained',
  'how to register a custom post type in WordPress',
  'WordPress custom fields the practical guide',
  'WP-CLI commands every developer should know',
  'how to build a WordPress plugin from scratch',
  'WordPress settings API made simple',
  'WordPress nonces and how to use them safely',
  'how to add WooCommerce subscriptions',
  'WooCommerce product import and export guide',
  'WooCommerce refund management explained',
  'WooCommerce analytics what it tracks',
  'how to customize WooCommerce emails',
  'WooCommerce vs Shopify which fits your store',
  'how to speed up the WooCommerce checkout',
  'WordPress XML sitemap setup guide',
  'how to manage redirects in WordPress',
  'WordPress canonical URLs explained',
  'how to fix a WordPress 404 error page',
  'WordPress image alt text strategy',
  'how to add llms.txt to WordPress',
  'WordPress internal linking strategy',
  'how to change a WordPress domain name',
  'WordPress staging to production workflow',
  'how to restore a WordPress backup',
  'WordPress maintenance checklist',
  'how much does a WordPress site really cost',
  'WordPress accessibility WCAG checklist',
  'how to make WordPress multilingual',
  'WordPress GDPR compliance checklist',
  'how to set up WordPress SMTP email',
  'best WordPress contact form plugins',
  'how to stop WordPress spam comments',
  'WordPress analytics setup with GA4',
  'how to run A/B tests on WordPress',
  'headless WordPress with Next.js setup',
  'WordPress REST API vs GraphQL',
  'how to deploy WordPress with GitHub Actions',
  'WordPress Docker local development',
  'WordPress coding standards for plugins',
  'how to submit a plugin to WordPress.org',
  'WordPress white screen of death fixes',
  'how to fix WordPress 500 internal server errors',
  'WordPress core update failures and rollback',
  'WordPress site health checks explained',
  'how to monitor WordPress uptime',
  'WordPress HTTPS and SSL setup guide',
  'how to choose WordPress hosting',
  'WordPress admin dashboard customization',
  'how to build a WordPress landing page',
  'WordPress email marketing with Mailchimp',
  'how to connect WordPress to a CRM',
  'WordPress webhooks for automation',
  'how to add a knowledge base to WordPress',
  'WordPress related posts without a plugin',
  'how to add social sharing to WordPress',
  'WordPress Open Graph tags guide',
  'how to create a WordPress job board',
  'WordPress membership site payment options',
  'how to build a WordPress directory site',
  'WordPress LMS setup with LearnDash',
  'how to add live chat to WordPress',
  'WordPress cookie consent setup',
  'how to write a WordPress privacy policy page',
];

function evergreenTopics() {
  return EVERGREEN_POOL.map(topic => ({ topic, source: 'evergreen', detail: 'evergreen WordPress topic' }));
}

/* --------------------------------------------------------- title generation */

function clip(text, max = TITLE_MAX) {
  let out = text;
  if (out.length > max) {
    const cut = out.slice(0, max + 1);
    const at = cut.lastIndexOf(' ');
    out = (at > 10 ? cut.slice(0, at) : cut.slice(0, max)).replace(/[,:;\s]+$/, '');
  }
  // Never end a title on a hanging connector ("... Flaw During").
  const words = out.split(' ');
  const HANGING = new Set(['a', 'an', 'the', 'of', 'for', 'to', 'in', 'on', 'and', 'or', 'with', 'but', 'as', 'at', 'by', 'from', 'into', 'during', 'after', 'before', 'that', 'which', 'who', 'how', 'why']);
  while (words.length > 3 && HANGING.has(words[words.length - 1].toLowerCase().replace(/[^a-z]/g, ''))) words.pop();
  return words.join(' ').replace(/[,:;\s]+$/, '');
}

const MINOR_WORDS = new Set(['a', 'an', 'the', 'of', 'for', 'to', 'in', 'on', 'and', 'or', 'with', 'vs', 'but', 'as', 'at', 'by', 'from', 'into']);

function capitalise(text) {
  const clean = String(text).replace(/'S\b/g, "'s").replace(/\.Com\b/g, '.com');
  const letters = clean.replace(/[^a-z]/gi, '');
  if (!letters) return clean;
  // Google News headlines arrive title-cased already - only autocomplete / trends /
  // evergreen topics are lower case and need the full treatment.
  const lowerRatio = (clean.match(/[a-z]/g) || []).length / letters.length;
  const out = lowerRatio < 0.6 ? clean : clean.split(/(\s+|[:?!,()—–-]+)/).map((part, i) => {
    if (!/[a-z]/.test(part)) return part;
    const bare = part.toLowerCase().replace(/[^a-z]/g, '');
    if (i > 0 && MINOR_WORDS.has(bare)) return part;
    if (/[A-Z]/.test(part) && part === part.toUpperCase() && bare.length <= 6) return part; // RCE, CISA, API
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join('');

  // Product names never follow the generic capitalisation rules.
  return out
    .replace(/\bWord\s?Press\b/g, 'WordPress')
    .replace(/\bWordpress\b/g, 'WordPress')
    .replace(/\bWoocommerce\b/g, 'WooCommerce')
    .replace(/\bWoo commerce\b/g, 'WooCommerce');
}

function titleFor(topic) {
  const raw = String(topic).replace(/\s+/g, ' ').replace(/[.?!]+$/, '').trim();
  const lower = raw.toLowerCase();
  const body = capitalise(raw);

  let title;
  if (/^how to\b/.test(lower)) title = clip(`${body}: Step-by-Step Guide`);
  else if (/^best\b/.test(lower)) title = clip(`${body}: Tested and Compared`);
  else if (/^what is\b/.test(lower)) title = clip(`${body}? Complete Guide`);
  else if (/\bvs\b/.test(lower)) title = clip(`${body}: Which Should You Pick?`);
  else if (/^(why|when|where|which|can|does|do|is|are)\b/.test(lower)) title = clip(`${body}, Explained`);
  else if (raw.length < 45) title = clip(`${body}: Complete Guide`);
  else title = clip(body);

  if (title.length < TITLE_MIN) title = clip(`${body}: Complete Guide 2026`);
  return title;
}

function keywordsFor(title, topic) {
  const base = String(topic || title).replace(/^(how to|best|what is)\s+/i, '');
  const parts = base.split(/[:\-–—,?]/).map(s => s.trim()).filter(Boolean);
  const words = base.split(/\s+/).filter(w => w.length > 3 && !STOPWORDS.has(w.toLowerCase()));

  const kw = [];
  const push = v => {
    const clean = String(v || '').trim();
    if (clean && !kw.some(k => normalize(k) === normalize(clean))) kw.push(clean);
  };
  push(parts[0]);
  if (parts[1]) push(parts[1]);
  if (words[0]) push(words.slice(0, 3).join(' '));
  if (/woo|store|product|cart|checkout|shipping/i.test(base)) push('WooCommerce');
  else push('WordPress');

  // Guarantee three unique keywords - push() silently skips duplicates, so keep
  // offering fresh fallbacks instead of looping forever on the same one.
  for (const filler of ['WordPress', 'WordPress guide', 'WordPress tips', 'WordPress 2026']) {
    if (kw.length >= 3) break;
    push(filler);
  }

  return kw.slice(0, 4);
}

async function polishWithGemini(titles) {
  if (NO_GEMINI || !process.env.GEMINI_API_KEY) return null;
  try {
    const prompt = [
      'You are the SEO editor of a WordPress developer blog.',
      'Rewrite the blog titles below so each one is sharper and more specific.',
      'Rules:',
      `- every title must be ${TITLE_MIN}-${TITLE_MAX} characters`,
      '- keep the same order and the same topic as the input',
      '- no two titles may cover the same topic',
      '- no clickbait, no all caps, no emoji, at most one colon per title',
      '- return ONLY a JSON array of strings, no markdown, no commentary',
      '',
      'Input titles:',
      ...titles.map((t, i) => `${i + 1}. ${t}`),
    ].join('\n');

    const text = await geminiCall(prompt, 'title polish');
    const cleaned = String(text).replace(/```(?:json)?/gi, '').trim();
    let arr = null;

    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) arr = parsed;
      } catch (e) { /* fall through to the numbered-list parser */ }
    }
    if (!arr) {
      // Some models answer with a numbered list even when asked for JSON.
      const lines = cleaned.split('\n')
        .map(l => l.replace(/^\s*\d+[.)]\s*/, '').replace(/^[-*]\s*/, '').replace(/^["']+|["']+$/g, '').trim())
        .filter(l => l.length >= 20 && l.length <= TITLE_MAX + 10);
      if (lines.length >= Math.max(3, Math.floor(titles.length * 0.6))) arr = lines;
    }
    if (!arr) throw new Error(`no usable list in the response: ${cleaned.slice(0, 160)}`);
    return arr.map(x => String(x).trim());
  } catch (e) {
    console.warn(`  Gemini polish skipped: ${String(e.message).slice(0, 120)}`);
    return null;
  }
}

/* ------------------------------------------------------------------ main */

async function main() {
  console.log('=========================================');
  console.log('Monthly WordPress title planner');
  console.log(`Month: ${MONTH} | titles: ${COUNT}${DRY_RUN ? ' | dry-run' : ''}${NO_QUEUE ? ' | plan only' : ''}`);
  console.log('=========================================\n');

  const existing = collectExistingTitles();
  const dedupe = makeDedupe(existing);
  console.log(`Dedupe base: ${dedupe.count} titles, ${dedupe.slugs.size} slugs (published + queued + sitemap)\n`);

  console.log('Fetching Google sources...');
  const [trends, related, news, autocomplete] = await Promise.all([
    fetchTrendsDaily(),
    fetchTrendsRelated(),
    fetchNews(),
    fetchAutocomplete(),
  ]);
  const evergreen = evergreenTopics();

  const pool = [];
  const seenTopics = new Set();
  const addAll = list => {
    for (const item of list) {
      const norm = normalize(item.topic);
      if (!norm || seenTopics.has(norm)) continue;
      seenTopics.add(norm);
      pool.push(item);
    }
  };
  addAll(trends);
  addAll(related);
  addAll(news);
  addAll(autocomplete);
  addAll(evergreen);

  const bySource = {};
  for (const p of pool) bySource[p.source] = (bySource[p.source] || 0) + 1;
  console.log(`Candidates: ${pool.length} (${Object.entries(bySource).map(([k, v]) => `${k}=${v}`).join(', ')})`);

  // Pick topics: trend sources first, then news, autocomplete and finally the pool.
  // Cap how many near-identical topics from one source get in, so the month stays varied.
  const priority = { 'google-trends': 0, 'google-news': 1, autocomplete: 2, evergreen: 3 };
  // A month built only of headlines would read like an alert feed, so the freshest
  // sources are capped and autocomplete / evergreen topics fill the rest.
  const CAPS = { 'google-trends': 6, 'google-news': NEWS_STORY_CAP };
  const ordered = pool.slice().sort((a, b) => priority[a.source] - priority[b.source]);

  const chosen = [];
  const chosenTokens = [];
  const takenPerSource = {};
  for (const item of ordered) {
    if (chosen.length >= COUNT * 1.5) break;
    const cap = CAPS[item.source] || Infinity;
    if ((takenPerSource[item.source] || 0) >= cap) continue;
    const t = tokens(item.topic);
    if (chosenTokens.some(prev => jaccard(t, prev) >= 0.7)) continue;
    chosenTokens.push(t);
    takenPerSource[item.source] = (takenPerSource[item.source] || 0) + 1;
    chosen.push(item);
  }
  console.log(`Topics selected: ${chosen.length} (deduped against each other)`);

  // Semantic pass: drop candidates the blog already covers (a reworded repeat is still
  // a repeat - lexical overlap cannot see that, Gemini can).
  const selected = await dropAlreadyCovered(chosen, existing.map(e => e.title).filter(Boolean));

  // 1. Deterministic titles - always available.
  let titles = selected.map(item => titleFor(item.topic));

  // 2. Gemini polish - best effort, invalid entries fall back to the template.
  const polished = await polishWithGemini(titles);
  if (polished) {
    let kept = 0;
    titles = titles.map((base, i) => {
      const candidate = (polished[i] || '').trim();
      if (candidate.length >= TITLE_MIN && candidate.length <= TITLE_MAX + 5) {
        kept++;
        return candidate;
      }
      return base;
    });
    console.log(`Gemini polish applied to ${kept}/${titles.length} titles`);
  }

  // 3. Drop anything that collides with what is already published or queued, or with
  //    another title picked in this same run.
  const final = [];
  const skipped = { existing: 0, withinRun: 0 };
  const skippedExamples = [];
  for (let i = 0; i < selected.length; i++) {
    const title = titles[i];
    const slug = slugify(title);
    if (dedupe.isDuplicate(title) || dedupe.isDuplicateSlug(slug)) {
      skipped.existing++;
      if (skippedExamples.length < 5) skippedExamples.push(`  - already covered: ${title}`);
      continue;
    }
    // Template titles share their suffix ("...: Complete Guide"), so the within-run check
    // compares the source topics instead of the finished titles.
    if (final.some(f =>
      f.slug === slug ||
      normalize(f.title) === normalize(title) ||
      jaccard(tokens(f.topic), tokens(selected[i].topic)) >= 0.6)) {
      skipped.withinRun++;
      if (skippedExamples.length < 5) skippedExamples.push(`  - same topic as another pick: ${title}`);
      continue;
    }
    final.push({ title, slug, topic: selected[i].topic, source: selected[i].source, detail: selected[i].detail });
    if (final.length >= COUNT) break;
  }
  const skippedDuplicates = skipped.existing + skipped.withinRun;
  console.log(`Skipped ${skippedDuplicates} duplicate title(s): ` +
    `${skipped.existing} already published/queued, ${skipped.withinRun} repeated inside this run`);
  skippedExamples.forEach(line => console.log(line));

  // 4. Top up from the evergreen pool if the live sources ran dry.
  if (final.length < COUNT) {
    const filler = evergreenTopics();
    for (const item of filler) {
      if (final.length >= COUNT) break;
      const title = titleFor(item.topic);
      const slug = slugify(title);
      if (dedupe.isDuplicate(title) || dedupe.isDuplicateSlug(slug)) continue;
      if (final.some(f => f.slug === slug || jaccard(tokens(f.topic), tokens(item.topic)) >= 0.6)) continue;
      final.push({ title, slug, topic: item.topic, source: item.source, detail: item.detail });
    }
  }

  if (!final.length) {
    console.error('ERROR: no titles left after dedupe - nothing written.');
    return 1;
  }
  if (final.length < COUNT) console.warn(`WARNING: only ${final.length} of ${COUNT} titles available after dedupe.`);

  // 5. Spread the titles over the month (1 per day by default, alternating 3 AM / 3 PM).
  const [year, month] = MONTH.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const plan = final.map((item, i) => {
    const day = Math.min(daysInMonth, Math.floor((i * daysInMonth) / final.length) + 1);
    return {
      ...item,
      publish_date: `${MONTH}-${String(day).padStart(2, '0')}`,
      publish_time: i % 2 === 0 ? '3:00 AM' : '3:00 PM',
      keywords: keywordsFor(item.title, item.topic),
    };
  });

  console.log('\n=== Plan ===');
  plan.slice(0, 10).forEach(p => console.log(`  ${p.publish_date} ${p.publish_time.padEnd(7)} [${p.source}] ${p.title}`));
  if (plan.length > 10) console.log(`  ... and ${plan.length - 10} more`);

  if (DRY_RUN) {
    console.log('\nDry run - nothing written.');
    return 0;
  }

  // 6. Plan document (always written, even in --no-queue mode).
  const planPath = path.join(DOCS_DIR, `TREND-PLAN-${MONTH}.md`);
  const sourceLabel = {
    'google-trends': 'Google Trends',
    'google-news': 'Google News',
    autocomplete: 'Google Autocomplete',
    evergreen: 'Evergreen pool',
  };
  const lines = [
    `# Trend Title Plan - ${MONTH}`,
    '',
    `Generated: ${new Date().toISOString()} | Titles: ${plan.length} | Target: 1 post/day`,
    '',
    'Sources: Google Trends (daily trending RSS + related queries), Google News (WordPress),',
    'Google Autocomplete, evergreen WordPress pool. Every title was checked against the',
    `published posts and the existing queue (${dedupe.count} titles, ${dedupe.slugs.size} slugs) - nothing repeats.`,
    '',
    `Dedupe: ${skippedDuplicates} candidate(s) dropped as duplicates.`,
    '',
    '| # | Date | Time | Title | Slug | Source |',
    '|---|------|------|-------|------|--------|',
  ];
  plan.forEach((p, i) => {
    lines.push(`| ${i + 1} | ${p.publish_date} | ${p.publish_time} | ${p.title} | ${p.slug} | ${sourceLabel[p.source] || p.source} |`);
  });
  lines.push('');
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(planPath, lines.join('\n'));

  // 7. Append to the publish queue (pending items are picked up by Auto Blog Publisher).
  if (NO_QUEUE) {
    console.log(`\nPlan document: ${path.relative(ROOT, planPath)} (queue untouched)`);
    return 0;
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  const nextId = (queue.blogs || []).reduce((max, b) => Math.max(max, Number(b.id) || 0), 0) + 1;
  plan.forEach((p, i) => {
    queue.blogs.push({
      id: nextId + i,
      title: p.title,
      slug: p.slug,
      keywords: p.keywords,
      publish_time: p.publish_time,
      publish_date: p.publish_date,
      status: 'pending',
      source: p.source,
    });
  });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

  const pending = queue.blogs.filter(b => b.status === 'pending').length;
  console.log(`\nAdded ${plan.length} pending title(s) to blog-queue.json (queue now has ${pending} pending).`);
  console.log(`Plan document: ${path.relative(ROOT, planPath)}`);
  return 0;
}

if (require.main === module) {
  main().then(code => process.exit(code)).catch(err => {
    console.error('Fatal error:', err.message || err);
    process.exit(1);
  });
}

module.exports = { normalize, tokens, slugify, jaccard, titleFor, keywordsFor, makeDedupe, collectExistingTitles };
