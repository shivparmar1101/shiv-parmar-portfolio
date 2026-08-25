const fs = require('fs');
const path = require('path');
const BLOG_DIR = path.join(__dirname, '..', 'blog');

function fixImageRendering(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  const oldCSS = '.author-box img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0}';
  const newCSS = '.author-box img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0;image-rendering:-webkit-optimize-contrast;image-rendering:crisp-edges}';

  if (html.includes(oldCSS)) {
    html = html.replace(oldCSS, newCSS);
    fs.writeFileSync(filepath, html);
    console.log(`Fixed: ${filename}`);
    return true;
  }
  console.log(`Skipped: ${filename}`);
  return false;
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
let count = 0;
for (const f of files) { if (fixImageRendering(f)) count++; }
console.log(`\nTotal: ${count} blogs updated`);
