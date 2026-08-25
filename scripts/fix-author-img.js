const fs = require('fs');
const path = require('path');
const BLOG_DIR = path.join(__dirname, '..', 'blog');

function fixAuthorImg(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  // Remove loading="lazy" and width/height from author box img tag
  const oldImg = '<img src="../images/shiv-parmar-wordpress-developer.jpg" alt="Shiv Parmar - WordPress Developer" title="Shiv Parmar - WordPress Developer from Rajkot, India" loading="lazy" width="120" height="120">';
  const newImg = '<img src="../images/shiv-parmar-wordpress-developer.jpg" alt="Shiv Parmar - WordPress Developer" title="Shiv Parmar - WordPress Developer from Rajkot, India">';

  // Also handle 80x80 version
  const oldImg80 = '<img src="../images/shiv-parmar-wordpress-developer.jpg" alt="Shiv Parmar - WordPress Developer" title="Shiv Parmar - WordPress Developer from Rajkot, India" loading="lazy" width="80" height="80">';

  let changed = false;
  if (html.includes(oldImg)) {
    html = html.replace(oldImg, newImg);
    changed = true;
  }
  if (html.includes(oldImg80)) {
    html = html.replace(oldImg80, newImg);
    changed = true;
  }

  // Also update CSS to ensure crisp rendering
  const oldCSS = '.author-box img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0}';
  const newCSS = '.author-box img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0;image-rendering:auto}';
  if (html.includes(oldCSS)) {
    html = html.replace(oldCSS, newCSS);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filepath, html);
    console.log(`Fixed: ${filename}`);
    return true;
  }
  console.log(`Skipped: ${filename}`);
  return false;
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
let count = 0;
for (const f of files) { if (fixAuthorImg(f)) count++; }
console.log(`\nTotal: ${count} blogs updated`);
