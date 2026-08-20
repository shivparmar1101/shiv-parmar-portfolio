const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));

let fixed = 0;
files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Fix broken pattern: href="'+p.slug+'.html" -> href="../blog/'+p.slug+'.html"
  // The actual pattern in the file is: href="'+p.slug+'.html"
  content = content.replace(
    /href="'\+p\.slug\+\'\.html"/g,
    'href="../blog/\'+p.slug+\'\.html"'
  );
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`FIXED: ${file}`);
    fixed++;
  }
});

console.log(`\nDone! Fixed ${fixed} files.`);
