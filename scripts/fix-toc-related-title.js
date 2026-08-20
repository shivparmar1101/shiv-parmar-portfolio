const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));

let updated = 0;

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Fix TOC links - add title attribute
  // Pattern: a.href="#"+id;a.textContent=h.textContent;
  content = content.replace(
    /a\.href="#"\+id;a\.textContent=h\.textContent;/g,
    'a.href="#"+id;a.textContent=h.textContent;a.title=h.textContent;'
  );
  
  // Also fix: a.href="#" + id;a.textContent = h.textContent;
  content = content.replace(
    /a\.href="#" \+id;a\.textContent = h\.textContent;/g,
    'a.href="#"+id;a.textContent=h.textContent;a.title=h.textContent;'
  );
  
  // Fix related posts links - add title attribute
  // Pattern: card.innerHTML='<div class="date">'+p.date+'</div><h4><a href="../blog/'+p.slug+'.html">'+p.title+'</a></h4>';
  content = content.replace(
    /card\.innerHTML='<div class="date">\'+p\.date\+\'<\/div><h4><a href="\.\.\/blog\/\'+p\.slug\+\'\.html">\'+p\.title\+\'<\/a><\/h4>';'/g,
    "card.innerHTML='<div class=\"date\">'+p.date+'</div><h4><a href=\"../blog/'+p.slug+'.html\" title=\"'+p.title+'\">'+p.title+'</a></h4>';"
  );
  
  // Also fix single quote version
  content = content.replace(
    /card\.innerHTML='<div class="date">\'+p\.date\+\'<\/div><h4><a href="\.\.\/blog\/\'+p\.slug\+\'\.html">\'+p\.title\+\'<\/a><\/h4>';'/g,
    "card.innerHTML='<div class=\"date\">'+p.date+'</div><h4><a href=\"../blog/'+p.slug+'.html\" title=\"'+p.title+'\">'+p.title+'</a></h4>';"
  );
  
  // Fix template literal version (building-a-wordpress-rest-api)
  content = content.replace(
    /card\.innerHTML = `\n\s*<div class="date">\$\{p\.date\}<\/div><h4><a href="\.\.\/blog\/\$\{p\.slug\}\.html">\$\{p\.title\}<\/a><\/h4>`;/g,
    'card.innerHTML = `\n<div class="date">${p.date}</div><h4><a href="../blog/${p.slug}.html" title="${p.title}">${p.title}</a></h4>`;'
  );
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`UPDATED: ${file}`);
    updated++;
  }
});

console.log(`\nDone! Updated ${updated} files.`);
