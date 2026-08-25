const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

function updateAuthorCSS(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  
  // Update author box image CSS - make it 120x120
  const oldCSS = '.author-box img{width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0}';
  const newCSS = '.author-box img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0}';
  
  if (html.includes(oldCSS)) {
    html = html.replace(oldCSS, newCSS);
    fs.writeFileSync(filepath, html);
    console.log(`Updated CSS: ${filename}`);
    return true;
  }
  
  console.log(`Skipped CSS: ${filename}`);
  return false;
}

function main() {
  console.log('Updating author box CSS to 120x120...\n');
  
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  let updated = 0;
  
  for (const file of files) {
    if (updateAuthorCSS(file)) {
      updated++;
    }
  }
  
  console.log(`\nTotal: ${updated} blogs updated`);
}

main();
