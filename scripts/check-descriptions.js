const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

function checkDescriptions() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  
  console.log('Checking all blog descriptions:\n');
  
  for (const file of files) {
    const filepath = path.join(BLOG_DIR, file);
    const html = fs.readFileSync(filepath, 'utf8');
    
    const match = html.match(/<meta name="description" content="([^"]*)">/);
    if (match) {
      const desc = match[1];
      const len = desc.length;
      const status = len >= 120 ? '✅' : '❌';
      console.log(`${status} ${file}: ${len} chars`);
      if (len < 120) {
        console.log(`   Current: "${desc.substring(0, 80)}..."`);
      }
    }
  }
}

checkDescriptions();
