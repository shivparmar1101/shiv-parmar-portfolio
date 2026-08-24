const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

function updateAuthorPhoto(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  
  const oldImg = '<img src="https://avatars.githubusercontent.com/u/shivparmar1101" alt="Shiv Parmar - WordPress Developer" title="Shiv Parmar - WordPress Developer from Rajkot, India" onerror="this.src=\'https://ui-avatars.com/api/?name=Shiv+Parmar&background=c9a84c&color=fff&size=80\'">';
  
  const newImg = '<img src="../images/shiv-parmar-wordpress-developer.jpg" alt="Shiv Parmar - WordPress Developer" title="Shiv Parmar - WordPress Developer from Rajkot, India" loading="lazy">';
  
  if (html.includes(oldImg)) {
    html = html.replace(oldImg, newImg);
    fs.writeFileSync(filepath, html);
    console.log(`Updated: ${filename}`);
    return true;
  }
  
  console.log(`Skipped: ${filename} (pattern not found)`);
  return false;
}

function main() {
  console.log('Updating author photos in all blog posts...\n');
  
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  let updated = 0;
  
  for (const file of files) {
    if (updateAuthorPhoto(file)) {
      updated++;
    }
  }
  
  console.log(`\nTotal: ${updated} blogs updated`);
}

main();
