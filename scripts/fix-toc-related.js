const fs = require('fs');
const path = require('path');
const { getRelatedPosts, buildRelatedHTML, buildTOC, escapeHtml, BLOG_DIR } = require('./auto-blog-generator.js');

function findBlockEnd(html, openIdx) {
  const tag = '<div';
  let depth = 0;
  let i = openIdx;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = openIdx;
  let m;
  while ((m = re.exec(html))) {
    if (m[0] === '<div') depth++;
    else {
      depth--;
      if (depth === 0) return m.index + m[0].length;
    }
    i = m.index;
  }
  return -1;
}

function processFile(file) {
  const full = path.join(BLOG_DIR, file);
  const slug = file.replace('.html', '');
  let html = fs.readFileSync(full, 'utf-8');
  const original = html;
  const notes = [];

  // 1) Remove fragile inline initBlog script
  const before = html;
  html = html.replace(/<script>\s*\(function\s*\(\)\s*\{\s*function initBlog[\s\S]*?<\/script>/, '');
  if (html !== before) notes.push('removed inline initBlog script');

  // 2) Add ids to h2 inside .content and collect TOC items
  const contentOpen = html.indexOf('<div class="content">');
  if (contentOpen !== -1) {
    const innerStart = contentOpen + '<div class="content">'.length;
    const innerEnd = findBlockEnd(html, contentOpen);
    if (innerEnd !== -1) {
      const inner = html.substring(innerStart, innerEnd);
      if (!/<h2[^>]*\sid="/.test(inner)) {
        const built = buildTOC(inner);
        html = html.substring(0, innerStart) + built.content + html.substring(innerEnd);
        notes.push(`toc ids for ${built.tocHTML ? (built.tocHTML.match(/<li>/g) || []).length : 0} h2`);
      } else {
        notes.push('h2 ids already present');
      }
    }
  } else {
    notes.push('NO .content div');
  }

  // 3) Fill TOC list (server-side, static)
  const tocItems = [];
  const contentOpen2 = html.indexOf('<div class="content">');
  if (contentOpen2 !== -1) {
    const innerEnd2 = findBlockEnd(html, contentOpen2);
    const inner2 = html.substring(contentOpen2, innerEnd2);
    const re = /<h2[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
    let m;
    while ((m = re.exec(inner2))) {
      const text = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      tocItems.push(`<li><a href="#${m[1]}" title="${escapeHtml(text)}">${escapeHtml(text)}</a></li>`);
    }
  }

  if (/<ul id="tocList">/.test(html)) {
    const hasItems = /<ul id="tocList">\s*<li>/.test(html);
    if (!hasItems && tocItems.length) {
      html = html.replace(/<ul id="tocList">[\s\S]*?<\/ul>/,
        `<ul id="tocList">\n${tocItems.join('\n')}\n</ul>`);
      notes.push(`TOC filled (${tocItems.length} links)`);
    } else if (hasItems) {
      notes.push('TOC already filled');
    } else {
      notes.push('TOC: no h2 found');
    }
  } else {
    notes.push('NO tocList');
  }

  // 4) Static related posts
  const marker = '<div class="related-grid" id="relatedBlogs">';
  const relIdx = html.indexOf(marker);
  if (relIdx !== -1) {
    const relInnerStart = relIdx + marker.length;
    const relEnd = findBlockEnd(html, relIdx);
    const relInner = html.substring(relInnerStart, relEnd);
    if (!relInner.includes('related-card')) {
      const cards = buildRelatedHTML(getRelatedPosts(slug));
      if (cards) {
        html = html.substring(0, relInnerStart) + '\n' + cards + '\n' + html.substring(relEnd);
        notes.push('related posts: 3 cards');
      } else {
        notes.push('related posts: none available');
      }
    } else {
      notes.push('related already static');
    }
  } else if (html.includes('class="related-grid"')) {
    notes.push('related present (legacy markup, no id)');
  } else {
    const cards = buildRelatedHTML(getRelatedPosts(slug));
    const closeIdx = html.indexOf('</div></article>');
    if (cards && closeIdx !== -1) {
      const block = `\n<div class="related-blogs">\n<h3>Related Posts</h3>\n<div class="related-grid" id="relatedBlogs">\n${cards}\n</div>\n</div>\n\n`;
      html = html.substring(0, closeIdx) + block + html.substring(closeIdx);
      notes.push('related section: inserted with 3 cards');
    } else {
      notes.push('NO related section (could not insert)');
    }
  }

  const changed = html !== original;
  if (changed) fs.writeFileSync(full, html, 'utf-8');
  return { file, changed, notes };
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
let changed = 0;
for (const f of files) {
  const r = processFile(f);
  if (r.changed) changed++;
  console.log(`${r.changed ? 'FIXED' : '  ---'} ${r.file}`);
  r.notes.forEach(n => console.log(`        - ${n}`));
}
console.log(`\n${changed}/${files.length} files modified`);
