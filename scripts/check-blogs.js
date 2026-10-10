const fs = require('fs');
const path = require('path');
const { BLOG_DIR } = require('./auto-blog-generator.js');

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
let issues = 0;
for (const f of files) {
  const h = fs.readFileSync(path.join(BLOG_DIR, f), 'utf-8');
  const p = [];

  const tocBlock = (h.match(/<ul id="tocList">[\s\S]*?<\/ul>/) || [''])[0];
  const tocLi = (tocBlock.match(/<li>/g) || []).length;
  const tocAnchors = (tocBlock.match(/<li><a href="#section-/g) || []).length;

  const contentStart = h.indexOf('<div class="content">');
  let contentEnd = contentStart === -1 ? -1 : h.indexOf('<div class="tags">', contentStart);
  if (contentEnd === -1 && contentStart !== -1) contentEnd = h.indexOf('</article>', contentStart);
  if (contentEnd === -1 && contentStart !== -1) contentEnd = h.length;
  const content = contentStart === -1 ? '' : h.substring(contentStart, contentEnd);
  const h2Total = (content.match(/<h2[ >]/g) || []).length;
  const h2Ids = (content.match(/<h2 id="section-/g) || []).length;

  const hasRelated = h.includes('class="related-grid"');
  const relatedCards = (h.match(/class="related-card"/g) || []).length;
  const hasInitBlog = h.includes('function initBlog');
  const brokenJSON = /var posts=\[[\s\S]{0,300}<title>/.test(h);

  if (!tocLi) p.push('TOC empty');
  if (h2Ids !== h2Total) p.push(`h2 ids ${h2Ids}/${h2Total}`);
  if (tocLi !== h2Total) p.push(`toc links ${tocLi} vs h2 ${h2Total}`);
  if (tocAnchors !== tocLi) p.push('toc anchor mismatch');
  if (!hasRelated) p.push('NO related section');
  else if (relatedCards < 3) p.push(`related cards ${relatedCards}`);
  if (hasInitBlog) p.push('stale initBlog JS');
  if (brokenJSON) p.push('broken posts JSON');
  if (!h.includes('</html>')) p.push('missing </html>');

  if (p.length) { issues++; console.log(`ISSUE ${f}: ${p.join(' | ')}`); }
}
console.log(`\n${files.length} files checked, ${issues} with issues`);
