#!/usr/bin/env node
/**
 * inject-body-links.js - adds 1-2 CONTEXTUAL internal links inside the body text
 * of older posts, pointing at NEWER posts (old -> new internal linking).
 *
 * Rules (all enforced):
 *   - anchor must be a real, specific phrase taken from the target post's meta keywords
 *     or a 3-word window of its title
 *   - phrase must appear as PLAIN TEXT inside a <p> or <li> of the source body
 *   - never touches <pre>/<code> blocks, never touches existing <a> tags
 *   - never links a post to itself, never links new -> old, never duplicates a target
 *   - max 2 links added per post (idempotent: existing body links are counted first)
 *   - DIVERSITY caps: same target used by at most MAX_PER_TARGET posts,
 *     same anchor text used at most MAX_PER_PHRASE times sitewide
 *   - scoring prefers longer + rarer + topically relevant anchor phrases
 *
 * Usage:
 *   node scripts/inject-body-links.js --dry-run   (report only, default)
 *   node scripts/inject-body-links.js --apply     (write files)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const APPLY = process.argv.includes('--apply');
const MAX_PER_POST = 2;          // body links per post (existing ones count)
const TARGET_POOL = 30;          // consider only the newest N posts as link targets
const MAX_PER_TARGET = 12;       // max posts allowed to link to the same target
const MAX_PER_PHRASE = 8;        // max sitewide uses of the same anchor text
const MIN_PHRASE_LEN = 10;

const GENERIC = new Set([
  'wordpress', 'plugins', 'plugin', 'security', 'guide', 'tutorial', 'update',
  'development', 'performance', 'woocommerce', 'theme', 'themes', 'content',
  'marketing', 'search', 'engine', 'optimization', 'setup', 'best', 'review',
  'developer', 'developers', 'complete', 'features', 'tips', 'ways', 'steps',
  'reasons', 'shiv', 'parmar', 'using', 'works', 'work',
  // weak / non-descriptive words - never good anchor material on their own
  'your', 'site', 'sites', 'here', 'what', 'when', 'this', 'that', 'with',
  'from', 'have', 'will', 'more', 'most', 'also', 'just', 'like', 'into',
  'over', 'make', 'need', 'know', 'every', 'about', 'after', 'before'
]);

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function decode(s) {
  return String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&middot;/g, '·');
}

function readPosts() {
  return fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html')).map(f => {
    const slug = path.basename(f, '.html');
    const html = fs.readFileSync(path.join(BLOG_DIR, f), 'utf8');
    const title = decode(((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || slug)
      .split('|')[0].split('&middot;')[0].trim());
    const dateM = html.match(/class="date">\s*(\d{4}-\d{2}-\d{2})/) ||
      html.match(/class="date">\s*([A-Z][a-z]{2} \d{1,2}, \d{4})/);
    let date = dateM ? dateM[1] : '';
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const d = new Date(date);
      if (!isNaN(d)) date = d.toISOString().slice(0, 10);
    }
    const keywords = ((html.match(/<meta name="keywords" content="([^"]*)"/i) || [])[1] || '')
      .split(',').map(k => k.trim()).filter(Boolean);
    return { file: f, slug, title, date, keywords, html };
  });
}

function bodyRange(html) {
  const start = html.indexOf('<div class="content">');
  if (start < 0) return null;
  const open = html.indexOf('>', start) + 1;
  const endTag = html.indexOf('<div class="tags">', open);
  const end = endTag > 0 ? endTag : html.indexOf('</article>', open);
  if (end < 0) return null;
  return { start: open, end };
}

/** Remove the AUTO related-inline block so its links are not counted as body links. */
function stripRelatedBlock(body) {
  const m = body.indexOf('<!-- AUTO_INTERNAL_LINKS -->');
  if (m < 0) return body;
  const navEnd = body.indexOf('</nav>', m);
  if (navEnd < 0) return body;
  const divEnd = body.indexOf('</div>', navEnd);
  if (divEnd < 0) return body;
  return body.slice(0, m) + body.slice(divEnd + 6);
}

function countBodyLinks(body) {
  return (stripRelatedBlock(body).match(/<a href="\.\.\/blog\//g) || []).length;
}

/** Cheap tag-stripped text for prefiltering (false positives OK, wrapFirst is exact). */
function plainOf(body) {
  return body.replace(/<[^>]+>/g, ' ');
}

function phrasesFor(post) {
  const out = [];
  for (const raw of post.keywords) {
    const plain = decode(raw.trim());
    if (plain.length < MIN_PHRASE_LEN) continue;
    if (GENERIC.has(plain.toLowerCase())) continue;
    if (plain.includes(' ')) { out.push(plain); continue; }   // multi-word: always OK
    if (plain.length >= 8) out.push(plain);                   // specific lone word (e.g. "Elementor")
  }
  const words = post.title.replace(/[^\w&]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && /\w*[a-zA-Z]\w*/.test(w));
  for (let i = 0; i + 2 < words.length; i++) {
    out.push(words.slice(i, i + 3).join(' '));
  }
  for (let i = 0; i + 1 < words.length; i++) {                // 2-word windows: better hit rate
    out.push(words.slice(i, i + 2).join(' '));
  }
  return [...new Set(out)];
}

function phraseQuality(phrase) {
  const words = phrase.split(/\s+/);
  const nonGeneric = words.filter(w =>
    w.length > 3 && /\w*[a-zA-Z]\w*/.test(w) && !GENERIC.has(w.toLowerCase())).length;
  return { words: words.length, nonGeneric, len: phrase.length };
}

function phraseIsUsable(phrase) {
  if (phrase.length < MIN_PHRASE_LEN) return false;
  const q = phraseQuality(phrase);
  if (q.nonGeneric < 1) return false;               // e.g. "Your WordPress", "WordPress guide"
  if (q.words < 2 && q.len < 16) return false;      // lone words must be very specific
  return true;
}

/** Topical overlap between source and target (keywords + title words). */
function relevance(src, tgt) {
  const sk = new Set(src.keywords.map(k => k.toLowerCase()));
  let s = 0;
  for (const k of tgt.keywords) if (sk.has(k.toLowerCase())) s++;
  const tw = new Set(tgt.title.toLowerCase().split(/\W+/).filter(w => w.length > 4));
  for (const w of src.title.toLowerCase().split(/\W+/)) {
    if (w.length > 4 && tw.has(w)) s++;
  }
  return s;
}

/** Mask <pre>/<code> regions so code samples are never linked. */
function maskProtected(s) {
  const keep = [];
  const masked = s.replace(/<(pre|code)\b[\s\S]*?<\/\1>/gi, m => {
    keep.push(m);
    return '\u0000' + (keep.length - 1) + '\u0000';
  });
  return { masked, keep };
}
function unmaskProtected(s, keep) {
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
}

/**
 * Wrap the first plain-text occurrence of `phrase` inside a <p>/<li> with a link.
 * Returns the new string, or null when no safe occurrence exists.
 */
function wrapFirst(body, phrase, href, titleAttr) {
  const { masked, keep } = maskProtected(body);
  const needle = esc(phrase);
  const target = needle.toLowerCase();

  // Walk the string as [text between tags] + [tags], tracking whether the text
  // sits inside a <p>/<li> and outside any existing <a>.
  let i = 0, block = null, aDepth = 0, out = '', done = false;
  while (i < masked.length) {
    const lt = masked.indexOf('<', i);
    const segEnd = lt < 0 ? masked.length : lt;
    const seg = masked.slice(i, segEnd);

    if (!done && block && aDepth === 0 && seg.toLowerCase().includes(target)) {
      const at = seg.toLowerCase().indexOf(target);
      out += seg.slice(0, at) +
        `<a href="${href}" title="${titleAttr}">${seg.slice(at, at + needle.length)}</a>` +
        seg.slice(at + needle.length);
      done = true;
    } else {
      out += seg;
    }

    if (lt < 0) break;
    const gt = masked.indexOf('>', lt);
    if (gt < 0) { out += masked.slice(lt); break; }
    const tag = masked.slice(lt, gt + 1);
    out += tag;
    i = gt + 1;

    const m = tag.match(/^<\s*(\/)?\s*([a-z0-9]+)/i);
    if (m) {
      const closing = !!m[1];
      const name = m[2].toLowerCase();
      if (name === 'a') aDepth = Math.max(0, aDepth + (closing ? -1 : 1));
      if (name === 'p' || name === 'li') block = closing ? null : name;
    }
  }

  if (!done) return null;
  return unmaskProtected(out, keep);
}

function main() {
  const posts = readPosts();
  const withDate = posts.filter(p => p.date);
  const newest = [...withDate].sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));

  // Attach body + plain text + existing body-link count to every post
  for (const p of posts) {
    const range = bodyRange(p.html);
    p.range = range;
    p.body = range ? p.html.slice(range.start, range.end) : null;
    p.plain = p.body ? plainOf(p.body) : '';
    p.bodyLinks = p.body ? countBodyLinks(p.body) : 0;
  }

  const pool = newest.slice(0, TARGET_POOL);
  const poolSlugs = new Set(pool.map(p => p.slug));

  // Phrase inventory: for every pool target, all usable phrases + how many posts contain them
  const inventory = new Map(); // tgt.slug -> [{ phrase, rarity }]
  for (const tgt of pool) {
    const list = [];
    for (const phrase of phrasesFor(tgt)) {
      if (!phraseIsUsable(phrase)) continue;
      const needle = esc(phrase).toLowerCase();
      let rarity = 0;
      for (const p of posts) {
        if (p.plain && p.plain.toLowerCase().includes(needle)) rarity++;
      }
      if (rarity > 0) list.push({ phrase, rarity });
    }
    inventory.set(tgt.slug, list);
  }

  // Pass 1 - build all viable (source -> target, phrase) candidates
  const perSource = [];
  for (const src of posts) {
    if (!src.body) continue;
    const candidates = [];
    if (src.bodyLinks < MAX_PER_POST) {
      for (const tgt of pool) {
        if (tgt.slug === src.slug) continue;
        if (src.date && tgt.date && tgt.date <= src.date) continue; // old -> new only
        if (src.body.includes(`../blog/${tgt.slug}"`)) continue;     // incl. related block
        const rel = relevance(src, tgt);
        for (const inv of (inventory.get(tgt.slug) || [])) {
          const needle = esc(inv.phrase).toLowerCase();
          if (!src.plain.toLowerCase().includes(needle)) continue;  // cheap prefilter
          if (!wrapFirst(src.body, inv.phrase, `../blog/${tgt.slug}`, esc(tgt.title))) continue;
          const q = phraseQuality(inv.phrase);
          const score =
            q.nonGeneric * 8 +
            Math.min(q.len, 40) * 0.5 +
            rel * 6 +
            20 / (1 + inv.rarity);   // rarer anchor text = more distinctive
          candidates.push({ tgt, phrase: inv.phrase, score, norm: inv.phrase.toLowerCase() });
        }
      }
    }
    perSource.push({ src, candidates });
  }

  // Pass 2 - greedy apply with diversity caps; sources with fewest options go first
  perSource.sort((a, b) => a.candidates.length - b.candidates.length);

  const BODY_MARKER = '<!-- AUTO_BODY_LINKS -->';
  const targetUse = new Map();
  const phraseUse = new Map();
  const report = [];
  let changedFiles = 0, totalLinks = 0;

  // Seed caps from links already on the site so re-runs respect diversity limits
  for (const p of posts) {
    if (!p.body) continue;
    let b = p.body;
    const m = b.indexOf('<!-- AUTO_INTERNAL_LINKS -->');
    if (m >= 0) {
      const navEnd = b.indexOf('</nav>', m);
      const divEnd = b.indexOf('</div>', navEnd);
      if (divEnd > 0) b = b.slice(0, m) + b.slice(divEnd + 6);
    }
    for (const mm of b.matchAll(/<a href="\.\.\/blog\/([a-z0-9-]+)"[^>]*>([^<]*)<\/a>/g)) {
      const slug = mm[1], anchor = mm[2].trim().toLowerCase();
      if (slug === p.slug) continue;
      targetUse.set(slug, (targetUse.get(slug) || 0) + 1);
      if (anchor) phraseUse.set(anchor, (phraseUse.get(anchor) || 0) + 1);
    }
  }
  const seededTargets = targetUse.size, seededPhrases = phraseUse.size;

  for (const { src, candidates } of perSource) {
    if (src.body.includes(BODY_MARKER)) continue; // already processed -> idempotent
    const room = MAX_PER_POST - src.bodyLinks;
    if (room <= 0 || !candidates.length) continue;

    const dyn = [...candidates].sort((a, b) => {
      const sa = a.score + (MAX_PER_TARGET - (targetUse.get(a.tgt.slug) || 0)) * 5
        - (phraseUse.get(a.norm) || 0) * 12;
      const sb = b.score + (MAX_PER_TARGET - (targetUse.get(b.tgt.slug) || 0)) * 5
        - (phraseUse.get(b.norm) || 0) * 12;
      return sb - sa;
    });

    let body = src.body;
    let added = 0;
    const usedPhrases = new Set();
    const usedTargets = new Set();
    for (const c of dyn) {
      if (added >= room) break;
      if (usedTargets.has(c.tgt.slug)) continue;     // one link per target post
      if ((targetUse.get(c.tgt.slug) || 0) >= MAX_PER_TARGET) continue;
      if ((phraseUse.get(c.norm) || 0) >= MAX_PER_PHRASE) continue;
      if (usedPhrases.has(c.norm)) continue;        // one anchor text per post
      const next = wrapFirst(body, c.phrase, `../blog/${c.tgt.slug}`, esc(c.tgt.title));
      if (!next) continue;
      body = next;
      added++;
      usedPhrases.add(c.norm);
      usedTargets.add(c.tgt.slug);
      targetUse.set(c.tgt.slug, (targetUse.get(c.tgt.slug) || 0) + 1);
      phraseUse.set(c.norm, (phraseUse.get(c.norm) || 0) + 1);
      report.push(`  ${src.slug}  ->  ${c.tgt.slug}   [${c.phrase}]`);
    }

    if (added && body !== src.body) {
      totalLinks += added;
      changedFiles++;
      body = BODY_MARKER + body; // mark processed so future runs skip it
      if (APPLY) {
        fs.writeFileSync(path.join(BLOG_DIR, src.file),
          src.html.slice(0, src.range.start) + body + src.html.slice(src.range.end));
      }
    }
  }

  console.log(`Body internal links: ${APPLY ? 'APPLIED' : 'DRY-RUN'} - ${totalLinks} links across ${changedFiles} posts (of ${posts.length})`);
  console.log(report.join('\n'));

  // Diversity summary
  const tSorted = [...targetUse.entries()].sort((a, b) => b[1] - a[1]);
  const pSorted = [...phraseUse.entries()].sort((a, b) => b[1] - a[1]);
  console.log('\nTarget usage (cap ' + MAX_PER_TARGET + '):');
  tSorted.forEach(([s, n]) => console.log(`  ${n}x ${s}`));
  console.log('Anchor usage (cap ' + MAX_PER_PHRASE + '):');
  pSorted.forEach(([s, n]) => console.log(`  ${n}x "${s}"`));
  console.log('pool targets with 0 uses: ' + pool.filter(p => !targetUse.has(p.slug)).length + ' / ' + pool.length);
  const noCand = perSource.filter(s => !s.candidates.length).length;
  const capBlocked = perSource.filter(s => s.candidates.length && s.candidates.every(c =>
    (targetUse.get(c.tgt.slug) || 0) >= MAX_PER_TARGET || (phraseUse.get(c.norm) || 0) >= MAX_PER_PHRASE)).length;
  console.log('sources with no usable candidate: ' + noCand + ' | sources blocked only by caps: ' + capBlocked);
}

main();
