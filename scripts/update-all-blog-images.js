const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

function updateBlogPost(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  
  const slug = filename.replace('.html', '');
  const svgPath = `../images/blog/${slug}-hero.svg`;
  const fullSvgUrl = `https://shiv-parmar-portfolio.netlify.app/images/blog/${slug}-hero.svg`;
  
  // Update hero img tag
  html = html.replace(
    /<img src="[^"]*" alt="[^"]*" title="[^"]*" class="hero-img">/,
    `<img src="${svgPath}" alt="Blog post hero image - WordPress development guide by Shiv Parmar" title="WordPress development guide by Shiv Parmar" class="hero-img">`
  );
  
  // Update OG image
  html = html.replace(
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${fullSvgUrl}">`
  );
  
  // Update Twitter image
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${fullSvgUrl}">`
  );
  
  // Update Schema image
  html = html.replace(
    /"image": "[^"]*"/,
    `"image": "${fullSvgUrl}"`
  );
  
  fs.writeFileSync(filepath, html);
  console.log(`Updated: ${filename}`);
}

function main() {
  console.log('Updating all blog posts with SVG images...\n');
  
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && !f.includes('index'));
  
  for (const file of files) {
    updateBlogPost(file);
  }
  
  console.log(`\nTotal: ${files.length} blog posts updated`);
}

main();
