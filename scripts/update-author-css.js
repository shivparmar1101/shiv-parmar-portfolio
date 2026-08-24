const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

function updateAuthorCSS(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  
  // Update author box image CSS - make it smaller and better
  const oldCSS = '.author-box img{width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--accent)}';
  const newCSS = '.author-box img{width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0}';
  
  if (html.includes(oldCSS)) {
    html = html.replace(oldCSS, newCSS);
  }
  
  // Also update author-box flex alignment
  const oldBoxCSS = '.author-box{display:flex;gap:20px;align-items:flex-start;padding:24px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);margin-top:32px}';
  const newBoxCSS = '.author-box{display:flex;gap:16px;align-items:center;padding:20px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);margin-top:32px}';
  
  if (html.includes(oldBoxCSS)) {
    html = html.replace(oldBoxCSS, newBoxCSS);
  }
  
  fs.writeFileSync(filepath, html);
  console.log(`Updated: ${filename}`);
}

function main() {
  console.log('Updating author box CSS in all blog posts...\n');
  
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  
  for (const file of files) {
    updateAuthorCSS(file);
  }
  
  console.log(`\nTotal: ${files.length} blogs updated`);
}

main();
