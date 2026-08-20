const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));

let fixed = 0;

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Fix related posts links - add title attribute
  const oldPattern = `card.innerHTML='<div class="date">'+p.date+'</div><h4><a href="../blog/'+p.slug+'.html">'+p.title+'</a></h4>';`;
  const newPattern = `card.innerHTML='<div class="date">'+p.date+'</div><h4><a href="../blog/'+p.slug+'.html" title="'+p.title+'">'+p.title+'</a></h4>';`;
  
  content = content.split(oldPattern).join(newPattern);
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`FIXED RELATED: ${file}`);
    fixed++;
  }
});

console.log(`\nTotal fixed: ${fixed}`);
