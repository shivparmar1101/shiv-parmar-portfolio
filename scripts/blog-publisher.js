const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;
const BLOG_DIR = path.join(__dirname, '..', 'blog');

const topics = [
  { slug: "wordpress-gutenberg-vs-elementor-which-is-better-in-2026", title: "WordPress Gutenberg vs Elementor: Which is Better in 2026?", cat: "WordPress", read: "6 min" },
  { slug: "how-to-speed-up-woocommerce-product-pages", title: "How to Speed Up WooCommerce Product Pages", cat: "WooCommerce", read: "5 min" },
  { slug: "building-a-wordpress-rest-api-from-scratch", title: "Building a WordPress REST API from Scratch", cat: "WordPress", read: "7 min" },
  { slug: "wordpress-cron-jobs-complete-guide", title: "WordPress Cron Jobs: Complete Guide", cat: "WordPress", read: "4 min" },
  { slug: "wordpress-security-headers-configuration", title: "WordPress Security Headers Configuration", cat: "Security", read: "4 min" },
  { slug: "how-to-debug-wordpress-like-a-pro", title: "How to Debug WordPress Like a Pro", cat: "WordPress", read: "5 min" },
  { slug: "wordpress-block-theme-development-guide", title: "WordPress Block Theme Development Guide", cat: "WordPress", read: "8 min" },
  { slug: "how-to-add-custom-css-to-wordpress-without-plugin", title: "How to Add Custom CSS to WordPress without Plugin", cat: "WordPress", read: "4 min" },
  { slug: "wordpress-image-optimization-for-speed", title: "WordPress Image Optimization for Speed", cat: "Performance", read: "5 min" },
  { slug: "how-to-set-up-wordpress-staging-environment", title: "How to Set Up WordPress Staging Environment", cat: "WordPress", read: "4 min" },
  { slug: "wordpress-migration-guide-local-to-production", title: "WordPress Migration Guide: Local to Production", cat: "WordPress", read: "6 min" },
  { slug: "how-to-add-schema-markup-to-wordpress", title: "How to Add Schema Markup to WordPress", cat: "SEO", read: "5 min" },
  { slug: "wordpress-caching-plugins-compared-2026", title: "WordPress Caching Plugins Compared 2026", cat: "Performance", read: "6 min" },
  { slug: "wordpress-user-role-management-guide", title: "WordPress User Role Management Guide", cat: "WordPress", read: "5 min" },
  { slug: "how-to-create-a-wordpress-booking-system", title: "How to Create a WordPress Booking System", cat: "WordPress", read: "6 min" },
  { slug: "wordpress-gutenberg-block-development", title: "WordPress Gutenberg Block Development", cat: "WordPress", read: "7 min" },
  { slug: "wordpress-rest-api-authentication-methods", title: "WordPress REST API Authentication Methods", cat: "WordPress", read: "6 min" },
  { slug: "how-to-create-wordpress-mega-menu", title: "How to Create WordPress Mega Menu", cat: "WordPress", read: "5 min" },
  { slug: "wordpress-database-backup-strategies", title: "WordPress Database Backup Strategies", cat: "WordPress", read: "4 min" },
  { slug: "wordpress-multisite-configuration-tips", title: "WordPress Multisite Configuration Tips", cat: "WordPress", read: "6 min" },
  { slug: "woocommerce-payment-gateway-comparison-2026", title: "WooCommerce Payment Gateway Comparison 2026", cat: "WooCommerce", read: "5 min" },
  { slug: "woocommerce-product-variation-best-practices", title: "WooCommerce Product Variation Best Practices", cat: "WooCommerce", read: "5 min" },
  { slug: "woocommerce-shipping-zones-setup-guide", title: "WooCommerce Shipping Zones Setup Guide", cat: "WooCommerce", read: "5 min" },
  { slug: "woocommerce-coupon-system-complete-guide", title: "WooCommerce Coupon System Complete Guide", cat: "WooCommerce", read: "5 min" },
  { slug: "woocommerce-inventory-management-best-practices", title: "WooCommerce Inventory Management Best Practices", cat: "WooCommerce", read: "5 min" },
  { slug: "woocommerce-product-filter-setup-guide", title: "WooCommerce Product Filter Setup Guide", cat: "WooCommerce", read: "5 min" },
  { slug: "woocommerce-tax-configuration-guide", title: "WooCommerce Tax Configuration Guide", cat: "WooCommerce", read: "4 min" },
  { slug: "woocommerce-cart-abandonment-recovery", title: "WooCommerce Cart Abandonment Recovery", cat: "WooCommerce", read: "5 min" },
  { slug: "woocommerce-product-bundles-setup", title: "WooCommerce Product Bundles Setup", cat: "WooCommerce", read: "5 min" },
  { slug: "wordpress-seo-technical-checklist", title: "WordPress SEO Technical Checklist", cat: "SEO", read: "6 min" },
  { slug: "how-to-build-a-wordpress-membership-site", title: "How to Build a WordPress Membership Site", cat: "WordPress", read: "7 min" }
];

const images = {
  WooCommerce: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
  SEO: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop",
  Security: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop",
  Performance: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop",
  default: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
};

function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    });

    const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`);


    const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates && json.candidates[0]) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error('No content in response: ' + data.substring(0, 200)));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function generateBlogHTML(title, slug, date, readtime, imageUrl, content) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - Shiv Parmar</title>
<meta name="description" content="${title} - WordPress development guide by Shiv Parmar.">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css">
<style>
.blog-header{padding:20px 0;border-bottom:1px solid var(--border-glass)}
.blog-header .nav{display:flex;align-items:center;justify-content:space-between}
.blog-header .logo{font-family:var(--font-primary);font-weight:800;font-size:19px;color:var(--text-primary);text-decoration:none}.blog-header .logo span{color:var(--accent)}
.blog-header .back{font-size:14px;font-weight:500;color:var(--text-muted)}
.blog-header .back:hover{color:var(--accent);text-decoration:none}
article{padding:0}
.breadcrumb{font-size:13px;color:var(--text-muted);margin-bottom:16px;font-family:var(--font-mono)}
.breadcrumb a{color:var(--accent);text-decoration:none}
.breadcrumb a:hover{text-decoration:underline}
.breadcrumb span{margin:0 6px;opacity:0.5}
.date{font-family:var(--font-mono);font-size:13px;color:var(--text-muted);margin-bottom:12px}
.date .updated{color:var(--accent);margin-left:12px}
h1{font-family:var(--font-primary);font-size:clamp(28px,4vw,40px);font-weight:800;line-height:1.2;margin-bottom:24px;color:var(--text-primary)}
.toc{background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);padding:24px;margin:0 0 32px}
.toc h3{font-size:16px;font-weight:700;margin:0 0 12px;color:var(--text-primary)}
.toc ul{list-style:none;padding:0;margin:0}
.toc li{margin-bottom:8px}
.toc a{font-size:14px;color:var(--text-secondary);text-decoration:none;font-family:var(--font-primary)}
.toc a:hover{color:var(--accent)}
.content{font-size:16px;color:var(--text-primary);font-family:var(--font-primary)}
.content h2{font-size:22px;font-weight:700;margin:40px 0 16px;color:var(--text-primary)}
.content h3{font-size:18px;font-weight:600;margin:32px 0 12px;color:var(--text-primary)}
.content p{margin-bottom:16px;color:var(--text-secondary)}
.content ul,.content ol{margin:0 0 16px 24px;color:var(--text-secondary)}
.content li{margin-bottom:8px}
.content code{font-family:var(--font-mono);background:var(--bg-glass-strong);padding:2px 8px;border-radius:6px;font-size:14px}
.content pre{background:#0d0d0d;color:#c7d2fe;padding:20px;border-radius:var(--radius-lg);overflow-x:auto;margin:0 0 24px;font-size:14px;line-height:1.6;border:1px solid var(--border-glass)}
.content pre code{background:none;padding:0;color:inherit}
.content blockquote{border-left:4px solid var(--accent);padding:10px 0 10px 15px;margin:20px 0;font-style:italic;color:var(--text-primary);background:var(--accent-glow-soft);border-radius:0px 15px 15px 0}
.content blockquote em{color:var(--text-primary)}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:40px;padding:24px 0;border-top:1px solid var(--border-glass)}
.tag{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;background:var(--accent-glow-soft);color:var(--accent)}
.author-box{display:flex;gap:20px;align-items:flex-start;padding:24px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);margin-top:32px}
.author-box img{width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--accent)}
.author-box .author-info h4{font-size:16px;font-weight:700;margin:0 0 4px;color:var(--text-primary)}
.author-box .author-info p{font-size:14px;color:var(--text-secondary);margin:0 0 8px}
.author-box .author-social{display:flex;gap:12px}
.author-box .author-social a{font-size:13px;color:var(--accent);text-decoration:none;font-weight:500}
.author-box .author-social a:hover{text-decoration:underline}
.hero-img{width:100%;height:420px;object-fit:cover;border-radius:var(--radius-lg);margin-top:70px;margin-bottom:32px;border:1px solid var(--border-glass)}
@media(max-width:640px){article{padding:0}h1{font-size:24px}.hero-img{height:200px}.author-box{flex-direction:column;align-items:center;text-align:center}}
</style>
</head>
<body>
<div id="site-header"></div>
<article><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb">
<a href="../index.html">Home</a><span>/</span><a href="../blog.html">Blog</a><span>/</span>${title}
</nav>
<img src="${imageUrl}" alt="${title}" title="${title}" class="hero-img">
<div class="date">${date} &middot; ${readtime} read<span class="updated">Updated: ${date}</span></div>
<h1>${title}</h1>
<div class="toc" id="toc">
<h3>Table of Contents</h3>
<ul id="tocList"></ul>
</div>
<div class="content">
${content}
</div>
<div class="tags"><span class="tag">WordPress</span><span class="tag">Development</span></div>
<div class="author-box">
<img src="https://avatars.githubusercontent.com/u/shivparmar1101" alt="Shiv Parmar" onerror="this.src='https://ui-avatars.com/api/?name=Shiv+Parmar&background=c9a84c&color=fff&size=80'">
<div class="author-info">
<h4>Shiv Parmar</h4>
<p>WordPress Developer from Rajkot, India. Specializing in custom themes, WooCommerce, and high-performance WordPress sites.</p>
<div class="author-social">
<a href="https://linkedin.com/in/shiv-parmar" target="_blank" rel="noopener">LinkedIn</a>
<a href="https://github.com/shivparmar1101" target="_blank" rel="noopener">GitHub</a>
</div>
</div>
</div>
</div></article>
<div id="site-footer"></div>
<script src="../includes.js"></script><script src="../script.js"></script>
<script>
(function(){
var toc=document.getElementById("tocList");
if(toc){document.querySelectorAll(".content h2").forEach(function(h,i){var id="section-"+i;h.id=id;var li=document.createElement("li");var a=document.createElement("a");a.href="#"+id;a.textContent=h.textContent;li.appendChild(a);toc.appendChild(li);});}
})();
</script>
</body>
</html>`;
}

function updateHTMLFile(filePath, newCard, startMarker, endMarker) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx > 0 && endIdx > startIdx) {
    const newContent = content.substring(0, startIdx + startMarker.length) + '\n' + newCard + content.substring(endIdx);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('Updated: ' + filePath);
    return true;
  }
  console.log('ERROR: Markers not found in ' + filePath);
  return false;
}

async function main() {
  console.log('=========================================');
  console.log('  Blog Auto-Publisher (Node.js)');
  console.log('  ' + new Date().toISOString());
  console.log('=========================================');

  if (!API_KEY) {
    console.error('ERROR: GEMINI_API_KEY not set!');
    process.exit(1);
  }
  console.log('API key found: ' + API_KEY.substring(0, 10) + '...');

  // Get existing blog files
  const existing = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));
  console.log('Existing blogs: ' + existing.length);

  // Find unpublished topic
  const available = topics.filter(t => !existing.includes(t.slug));
  console.log('Available topics: ' + available.length);

  if (available.length === 0) {
    console.log('All topics published!');
    process.exit(0);
  }

  const topic = available[Math.floor(Math.random() * available.length)];
  console.log('Selected: ' + topic.title);

  // Generate content
  console.log('Generating content with Gemini...');
  const prompt = `Write a professional WordPress development blog post about: ${topic.title}

Requirements:
- Write in first person as Shiv Parmar, a WordPress Developer from Rajkot, India
- Include practical code examples where relevant (PHP, CSS, JavaScript)
- Use HTML formatting with h2, h3, p, code, pre, ul, ol, blockquote tags
- Make it informative and actionable
- Include a blockquote with a key insight
- Length: 800-1200 words
- Tone: Professional but friendly

Return ONLY the blog content HTML. No markdown code blocks, no backticks, just raw HTML.`;

  const content = await callGemini(prompt);
  console.log('Content generated! (' + content.length + ' chars)');

  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const imageUrl = images[topic.cat] || images.default;

  // Save blog file
  const blogHTML = generateBlogHTML(topic.title, topic.slug, date, topic.read, imageUrl, content);
  const blogPath = path.join(BLOG_DIR, topic.slug + '.html');
  fs.writeFileSync(blogPath, blogHTML, 'utf-8');
  console.log('Saved: blog/' + topic.slug + '.html');

  // Update blog.html
  const listCard = `<article class="blog-card reveal">
            <div class="date">${date} &middot; ${topic.read} read</div>
            <h3><a href="blog/${topic.slug}.html">${topic.title}</a></h3>
            <p>${topic.cat} development guide covering best practices, code examples and real-world use cases.</p>
            <a class="read-more" href="blog/${topic.slug}.html">Read more &rarr;</a>
          </article>`;
  updateHTMLFile(path.join(__dirname, '..', 'blog.html'), listCard, '<!-- BLOG_CARDS_START -->', '<!-- BLOG_CARDS_END -->');

  // Update index.html (keep only 2 most recent)
  const homeCard = `<article class="blog-card reveal">
            <div class="date">${date} &middot; ${topic.read} read</div>
            <h3><a href="blog/${topic.slug}.html">${topic.title}</a></h3>
            <p>${topic.cat} development guide covering best practices, code examples and real-world use cases.</p>
            <a class="read-more" href="blog/${topic.slug}.html">Read more &rarr;</a>
          </article>`;

  const indexPath = path.join(__dirname, '..', 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf-8');
  const startM = '<!-- BLOG_CARDS_START -->';
  const endM = '<!-- BLOG_CARDS_END -->';
  const si = indexContent.indexOf(startM);
  const ei = indexContent.indexOf(endM);
  if (si > 0 && ei > si) {
    const between = indexContent.substring(si + startM.length, ei);
    const cardRegex = /<article class="blog-card reveal">[\s\S]*?<\/article>/g;
    const existingCards = between.match(cardRegex) || [];
    const kept = existingCards.slice(0, 2);
    indexContent = indexContent.substring(0, si + startM.length) + '\n' + homeCard + '\n' + kept.join('\n') + indexContent.substring(ei);
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
    console.log('Updated: index.html');
  }

  console.log('');
  console.log('=========================================');
  console.log('  Blog published successfully!');
  console.log('  Title: ' + topic.title);
  console.log('  File: blog/' + topic.slug + '.html');
  console.log('=========================================');
}

main().catch(err => {
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
