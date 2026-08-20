const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'blog', 'how-to-add-custom-css-to-wordpress-without-plugin.html');
const c = fs.readFileSync(file, 'utf8');

console.log('=== SEO CHECK ===');
console.log('Title tag:', c.includes('<title>') ? '✅' : '❌');
console.log('Meta description:', c.includes('name="description"') ? '✅' : '❌');
console.log('Meta keywords:', c.includes('name="keywords"') ? '✅' : '❌');
console.log('Canonical URL:', c.includes('rel="canonical"') ? '✅' : '❌');
console.log('Open Graph:', c.includes('og:title') ? '✅' : '❌');
console.log('Twitter Card:', c.includes('twitter:card') ? '✅' : '❌');
console.log('Schema.org:', c.includes('BlogPosting') ? '✅' : '❌');
console.log('Particle BG:', c.includes('particle-canvas-fullpage') ? '✅' : '❌');
console.log('');
console.log('=== LINKS & IMAGES ===');
console.log('TOC title attr:', c.includes('a.title=h.textContent') ? '✅' : '❌');
console.log('Author img title:', c.includes('Shiv Parmar - WordPress Developer') ? '✅' : '❌');
console.log('Hero img alt:', c.includes('WordPress development guide') ? '✅' : '❌');
