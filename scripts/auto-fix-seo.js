/**
 * Auto SEO Fixer Script
 * Detects and fixes common SEO issues automatically
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT_DIR = path.join(__dirname, '..');
const LOG_FILE = path.join(__dirname, '..', 'seo-data', 'fix-log.json');

// Ensure directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'seo-data'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'seo-data'), { recursive: true });
}

let fixLog = {
  date: new Date().toISOString(),
  fixes: [],
  summary: { total: 0, fixed: 0, skipped: 0 }
};

function logFix(file, type, before, after) {
  fixLog.fixes.push({ file, type, before, after });
  fixLog.summary.total++;
  fixLog.summary.fixed++;
  console.log(`  ✅ FIXED: ${type} in ${file}`);
}

function logSkip(file, type, reason) {
  fixLog.fixes.push({ file, type, status: 'skipped', reason });
  fixLog.summary.total++;
  fixLog.summary.skipped++;
  console.log(`  ⏭️ SKIP: ${type} in ${file} - ${reason}`);
}

// Fix 1: Add brand name to blog titles
function fixBlogTitles() {
  console.log('\n📝 Fix 1: Blog Title Branding...');
  
  const blogDir = path.join(ROOT_DIR, 'blog');
  if (!fs.existsSync(blogDir)) return;
  
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));
  
  files.forEach(file => {
    const filepath = path.join(blogDir, file);
    let html = fs.readFileSync(filepath, 'utf8');
    const $ = cheerio.load(html);
    
    const title = $('title').text().trim();
    
    if (!title.includes('Shiv Parmar')) {
      const newTitle = title + ' | Shiv Parmar';
      html = html.replace(/<title>.*?<\/title>/, `<title>${newTitle}</title>`);
      fs.writeFileSync(filepath, html);
      logFix(file, 'title-brand', title, newTitle);
    } else {
      logSkip(file, 'title-brand', 'Already has brand');
    }
  });
}

// Fix 2: Add missing meta descriptions
function fixMetaDescriptions() {
  console.log('\n📝 Fix 2: Missing Meta Descriptions...');
  
  const files = getAllHTMLFiles();
  
  files.forEach(file => {
    const filepath = path.join(ROOT_DIR, file);
    let html = fs.readFileSync(filepath, 'utf8');
    const $ = cheerio.load(html);
    
    const existingDesc = $('meta[name="description"]').attr('content');
    
    if (!existingDesc) {
      // Generate description based on page content
      const h1 = $('h1').first().text().trim() || $('title').text().trim();
      const newDesc = `${h1} - Professional WordPress development services by Shiv Parmar. 4+ years experience in custom themes, WooCommerce, plugins. Contact for a free quote.`;
      
      // Add meta description after title tag
      html = html.replace(
        /<\/title>/i,
        `</title>\n    <meta name="description" content="${newDesc}">`
      );
      
      fs.writeFileSync(filepath, html);
      logFix(file, 'meta-description', 'Missing', newDesc.substring(0, 50) + '...');
    } else {
      logSkip(file, 'meta-description', 'Already exists');
    }
  });
}

// Fix 3: Add missing canonical tags
function fixCanonicalTags() {
  console.log('\n📝 Fix 3: Missing Canonical Tags...');
  
  const files = getAllHTMLFiles();
  const siteUrl = 'https://shiv-parmar-portfolio.netlify.app';
  
  files.forEach(file => {
    const filepath = path.join(ROOT_DIR, file);
    let html = fs.readFileSync(filepath, 'utf8');
    const $ = cheerio.load(html);
    
    const existingCanonical = $('link[rel="canonical"]').attr('href');
    
    if (!existingCanonical) {
      // Generate canonical URL
      let canonicalUrl;
      if (file === 'index.html') {
        canonicalUrl = siteUrl + '/';
      } else if (file.startsWith('blog/')) {
        const blogName = file.replace('blog/', '').replace('.html', '');
        canonicalUrl = `${siteUrl}/blog/${blogName}`;
      } else {
        const pageName = file.replace('.html', '');
        canonicalUrl = `${siteUrl}/${pageName}`;
      }
      
      // Add canonical tag in head
      html = html.replace(
        /<\/head>/i,
        `    <link rel="canonical" href="${canonicalUrl}">\n  </head>`
      );
      
      fs.writeFileSync(filepath, html);
      logFix(file, 'canonical', 'Missing', canonicalUrl);
    } else {
      logSkip(file, 'canonical', 'Already exists');
    }
  });
}

// Fix 4: Add missing Open Graph image
function fixOgImages() {
  console.log('\n📝 Fix 4: Missing OG Image...');
  
  const files = getAllHTMLFiles();
  const defaultImage = 'https://shiv-parmar-portfolio.netlify.app/images/shiv-parmar-wordpress-developer.jpg';
  
  files.forEach(file => {
    const filepath = path.join(ROOT_DIR, file);
    let html = fs.readFileSync(filepath, 'utf8');
    const $ = cheerio.load(html);
    
    const existingOgImage = $('meta[property="og:image"]').attr('content');
    
    if (!existingOgImage) {
      // Add OG image before </head>
      html = html.replace(
        /<\/head>/i,
        `    <meta property="og:image" content="${defaultImage}">\n    <meta property="og:image:width" content="500">\n    <meta property="og:image:height" content="600">\n  </head>`
      );
      
      fs.writeFileSync(filepath, html);
      logFix(file, 'og-image', 'Missing', defaultImage);
    } else {
      logSkip(file, 'og-image', 'Already exists');
    }
  });
}

// Fix 5: Add missing Twitter Card tags
function fixTwitterCards() {
  console.log('\n📝 Fix 5: Missing Twitter Cards...');
  
  const files = getAllHTMLFiles();
  
  files.forEach(file => {
    const filepath = path.join(ROOT_DIR, file);
    let html = fs.readFileSync(filepath, 'utf8');
    const $ = cheerio.load(html);
    
    const existingTwitter = $('meta[name="twitter:card"]').attr('content');
    
    if (!existingTwitter) {
      const twitterTags = `    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:creator" content="@shivparmar1101">`;
      
      html = html.replace(
        /<\/head>/i,
        `${twitterTags}\n  </head>`
      );
      
      fs.writeFileSync(filepath, html);
      logFix(file, 'twitter-card', 'Missing', 'summary_large_image');
    } else {
      logSkip(file, 'twitter-card', 'Already exists');
    }
  });
}

// Fix 6: Add missing schema markup for contact page
function fixContactSchema() {
  console.log('\n📝 Fix 6: Contact Page Schema...');
  
  const contactFile = path.join(ROOT_DIR, 'contact.html');
  if (!fs.existsSync(contactFile)) return;
  
  let html = fs.readFileSync(contactFile, 'utf8');
  const $ = cheerio.load(html);
  
  const existingSchema = $('script[type="application/ld+json"]');
  
  if (existingSchema.length === 0) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Shiv Parmar - WordPress Developer",
      "url": "https://shiv-parmar-portfolio.netlify.app/contact",
      "mainEntity": {
        "@type": "Person",
        "name": "Shiv Parmar",
        "jobTitle": "WordPress Developer",
        "email": "shivparmar1101@gmail.com",
        "telephone": "+91-7359411663"
      }
    };
    
    const schemaScript = `\n    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    
    html = html.replace(/<\/head>/i, `${schemaScript}\n  </head>`);
    fs.writeFileSync(contactFile, html);
    logFix('contact.html', 'schema', 'Missing', 'ContactPage schema');
  } else {
    logSkip('contact.html', 'schema', 'Already exists');
  }
}

// Helper: Get all HTML files
function getAllHTMLFiles() {
  const files = [];
  
  fs.readdirSync(ROOT_DIR).forEach(file => {
    if (file.endsWith('.html') && file !== '404.html') {
      files.push(file);
    }
  });
  
  const blogDir = path.join(ROOT_DIR, 'blog');
  if (fs.existsSync(blogDir)) {
    fs.readdirSync(blogDir).forEach(file => {
      if (file.endsWith('.html')) {
        files.push('blog/' + file);
      }
    });
  }
  
  return files;
}

// Main function
function main() {
  console.log('=== Auto SEO Fixer Started ===');
  console.log(`Date: ${new Date().toISOString()}`);
  
  // Run all fixes
  fixBlogTitles();
  fixMetaDescriptions();
  fixCanonicalTags();
  fixOgImages();
  fixTwitterCards();
  fixContactSchema();
  
  // Save log
  fs.writeFileSync(LOG_FILE, JSON.stringify(fixLog, null, 2));
  
  // Print summary
  console.log('\n=== Summary ===');
  console.log(`Total checks: ${fixLog.summary.total}`);
  console.log(`Fixed: ${fixLog.summary.fixed}`);
  console.log(`Skipped: ${fixLog.summary.skipped}`);
  console.log(`Log saved: ${LOG_FILE}`);
  
  console.log('\n=== Auto Fix Complete ===');
}

main();
