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

// Auto internal linking - scan existing blogs and create keyword mapping
function addInternalLinks(content, currentSlug) {
  const existingFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  const linkMap = [];

  existingFiles.forEach(file => {
    const slug = file.replace('.html', '');
    if (slug === currentSlug) return;

    const html = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) return;

    const title = titleMatch[1].replace(' | Shiv Parmar', '').trim();
    const keywords = [];

    // Extract key phrases from title
    const titleLower = title.toLowerCase();

    // WooCommerce topics
    if (titleLower.includes('coupon')) keywords.push('coupon', 'coupon code', 'coupon system');
    if (titleLower.includes('payment gateway')) keywords.push('payment gateway', 'payment gateways');
    if (titleLower.includes('product variation')) keywords.push('product variation', 'variable product', 'variations');
    if (titleLower.includes('product filter')) keywords.push('product filter', 'filter products');
    if (titleLower.includes('product bundles')) keywords.push('product bundle', 'product bundles', 'bundle');
    if (titleLower.includes('tax')) keywords.push('tax configuration', 'tax setup', 'tax settings');
    if (titleLower.includes('shipping')) keywords.push('shipping zone', 'shipping zones', 'shipping');
    if (titleLower.includes('inventory')) keywords.push('inventory management', 'inventory', 'stock management');
    if (titleLower.includes('cart abandonment')) keywords.push('cart abandonment', 'abandoned cart');

    // WordPress topics
    if (titleLower.includes('staging')) keywords.push('staging environment', 'staging site', 'staging');
    if (titleLower.includes('migration')) keywords.push('migration', 'migrate', 'migrating');
    if (titleLower.includes('debug')) keywords.push('debug', 'debugging', 'troubleshoot');
    if (titleLower.includes('rest api')) keywords.push('REST API', 'API', 'API endpoint');
    if (titleLower.includes('block theme')) keywords.push('block theme', 'block themes', 'theme.json');
    if (titleLower.includes('gutenberg')) keywords.push('Gutenberg', 'Gutenberg blocks', 'block editor');
    if (titleLower.includes('security header')) keywords.push('security header', 'security headers', 'HTTP headers');
    if (titleLower.includes('user role')) keywords.push('user role', 'user roles', 'roles', 'capabilities');
    if (titleLower.includes('custom css')) keywords.push('custom CSS', 'CSS', 'additional CSS');
    if (titleLower.includes('multisite')) keywords.push('multisite', 'multi-site', 'network');
    if (titleLower.includes('booking')) keywords.push('booking system', 'booking', 'reservation');
    if (titleLower.includes('mega menu')) keywords.push('mega menu', 'navigation menu');
    if (titleLower.includes('backup')) keywords.push('backup', 'database backup', 'backup strategy');
    if (titleLower.includes('schema')) keywords.push('schema markup', 'structured data', 'schema');
    if (titleLower.includes('caching')) keywords.push('caching', 'cache', 'page cache');
    if (titleLower.includes('seo')) keywords.push('SEO', 'search engine optimization');
    if (titleLower.includes('image optimization')) keywords.push('image optimization', 'image compression', 'optimize images');
    if (titleLower.includes('membership')) keywords.push('membership', 'membership site', 'membership site');
    if (titleLower.includes('speed')) keywords.push('speed', 'performance', 'fast loading');

    if (keywords.length > 0) {
      linkMap.push({ slug, keywords });
    }
  });

  // Replace keywords with links (longest keywords first to avoid partial matches)
  let linkedContent = content;
  const processedSlugs = new Set();

  linkMap.forEach(({ slug, keywords }) => {
    if (processedSlugs.has(slug)) return;

    // Sort keywords by length (longest first)
    keywords.sort((a, b) => b.length - a.length);

    keywords.forEach(keyword => {
      // Skip if keyword is too short (avoid false matches)
      if (keyword.length < 4) return;

      // Case-insensitive replacement, but preserve case in replacement
      const regex = new RegExp(`(?<![<a-zA-Z/])\\b${escapeRegex(keyword)}\\b(?![a-zA-Z>])`, 'gi');
      const matches = linkedContent.match(regex);

      if (matches && matches.length > 0) {
        // Only link first occurrence
        const firstMatch = matches[0];
        const link = `<a href="/blog/${slug}.html">${firstMatch}</a>`;
        linkedContent = linkedContent.replace(firstMatch, link);
        processedSlugs.add(slug);
      }
    });
  });

  return linkedContent;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    });

    const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`);


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

function generateBlogHTML(title, slug, date, readtime, imageUrl, content, expertise, ctaHeadline, ctaButton, metaDesc, metaKeywords) {
  const canonicalUrl = `https://shiv-parmar-portfolio.netlify.app/blog/${slug}`;
  
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${metaDesc}">
<meta name="keywords" content="${metaKeywords}">
<meta name="author" content="Shiv Parmar">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonicalUrl}">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${metaDesc}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:site_name" content="Shiv Parmar - WordPress Developer Portfolio">
<meta property="og:locale" content="en_IN">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${metaDesc}">
<meta name="twitter:image" content="${imageUrl}">
<meta name="twitter:image:alt" content="${title} - WordPress development guide by Shiv Parmar">
<meta name="twitter:creator" content="@shivparmar1101">

<!-- Schema.org Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${title}",
  "description": "${metaDesc}",
  "author": { "@type": "Person", "name": "Shiv Parmar", "url": "https://www.linkedin.com/in/shiv-parmar/" },
  "publisher": { "@type": "Person", "name": "Shiv Parmar" },
  "datePublished": "${date}",
  "dateModified": "${date}",
  "image": "${imageUrl}",
  "mainEntityOfPage": "${canonicalUrl}"
}
</script>

<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css">
<link rel="stylesheet" href="../liquid-glass.css">
<style>
.blog-header{padding:20px 0;border-bottom:1px solid var(--border-glass)}
.blog-header .nav{display:flex;align-items:center;justify-content:space-between}
.blog-header .logo{font-family:var(--font-primary);font-weight:800;font-size:19px;color:var(--text-primary);text-decoration:none}.blog-header .logo span{color:var(--accent)}
.blog-header .back{font-size:14px;font-weight:500;color:var(--text-muted)}
.blog-header .back:hover{color:var(--accent);text-decoration:none}
.blog-header .nav-right{display:flex;gap:12px;align-items:center}
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
.author-box img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0}
.author-box .author-info h4{font-size:16px;font-weight:700;margin:0 0 4px;color:var(--text-primary)}
.author-box .author-info p{font-size:14px;color:var(--text-secondary);margin:0 0 8px}
.author-box .author-social{display:flex;gap:12px}
.author-box .author-social a{font-size:13px;color:var(--accent);text-decoration:none;font-weight:500}
.author-box .author-social a:hover{text-decoration:underline}
.related-blogs{margin:30px 0;padding-top:32px;border-top:1px solid var(--border-glass)}
.related-blogs h3{font-size:20px;font-weight:700;margin-bottom:20px;color:var(--text-primary)}
.related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.related-card{background:rgba(255, 255, 255, 0.04);backdrop-filter:blur(16px) saturate(150%);-webkit-backdrop-filter:blur(16px) saturate(150%);border:1px solid rgba(255, 255, 255, 0.08);border-radius:var(--radius-lg);padding:20px;transition:all 0.3s}
.related-card:hover{border-color:var(--accent);background:rgba(255, 255, 255, 0.08);box-shadow:0 8px 32px rgba(0, 0, 0, 0.2)}
.related-card .date{font-size:12px;margin-bottom:8px}
.related-card h4{font-size:15px;font-weight:600;margin:0 0 8px;color:var(--text-primary)}
.related-card h4 a{color:var(--text-primary);text-decoration:none}
.related-card h4 a:hover{color:var(--accent)}
.hero-img{width:100%;height:420px;object-fit:cover;border-radius:var(--radius-lg);margin-top:70px;margin-bottom:32px;border:1px solid var(--border-glass)}
.cta-section{padding:80px 0}
.cta-block{background:rgba(255, 255, 255, 0.05);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(255, 255, 255, 0.1);padding:80px 48px;text-align:center;position:relative;border-radius:var(--radius-xl);overflow:hidden;margin-bottom:40px}
.cta-block::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:var(--gradient-accent);opacity:0.5}
.cta-block .eyebrow{justify-content:center}
.cta-block h2{font-size:clamp(28px,3.8vw,48px);margin-bottom:16px;letter-spacing:-0.025em;color:var(--text-primary)}
.cta-block p{color:var(--text-secondary);max-width:520px;margin:0 auto 36px;font-size:16px;line-height:1.75}
.contact-grid{margin-top:0}
.blog-footer{border-top:1px solid var(--border-glass);padding:32px 0;text-align:center;color:var(--text-muted);font-size:14px;font-family:var(--font-primary)}
.blog-footer .foot-inner{display:flex;justify-content:space-between;align-items:center}
select option{background:#111;color:#f0f0f0;padding:8px}
@media(max-width:640px){article{padding:0}h1{font-size:24px}.hero-img{height:200px}.author-box{flex-direction:column;align-items:center;text-align:center}.blog-footer .foot-inner{flex-direction:column;gap:12px}}
</style>
</head>
<body>
<!-- Liquid Glass Background -->
<div class="liquid-glass-bg" aria-hidden="true">
<div class="liquid-blob liquid-blob-1"></div>
<div class="liquid-blob liquid-blob-2"></div>
<div class="liquid-blob liquid-blob-3"></div>
<div class="liquid-blob liquid-blob-4"></div>
</div>
<!-- Full Page Particle Background -->
<div id="particle-hero" class="particle-canvas-fullpage"></div>
<div id="site-header">
<noscript>
<header><div class="container nav"><a class="logo" href="../">shiv<span class="dot">.</span>parmar</a><nav class="nav-links" aria-label="Main navigation"><a href="../about">About</a><a href="../services">Services</a><a href="../work">Work</a><a href="../skills">Skills</a><a href="../experience">Experience</a><a href="../blog" class="active">Blog</a><a href="../contact">Contact</a></nav><div class="nav-right"><a class="nav-cta" href="../contact">Hire Me</a></div></div></header>
</noscript>
</div>
<article><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb">
<a href="../" title="Shiv Parmar - WordPress Developer Portfolio">Home</a><span>/</span><a href="../blog" title="WordPress Development Blog - Tips, Tutorials & Guides">Blog</a><span>/</span>${title}
</nav>
<img src="${imageUrl}" alt="${title} - WordPress development guide by Shiv Parmar" title="${title} - Complete guide by Shiv Parmar" class="hero-img">
<div class="date">${date} &middot; ${readtime} read<span class="updated">Updated: ${date}</span></div>
<h1>${title}</h1>
<div class="toc" id="toc">
<h3>Table of Contents</h3>
<ul id="tocList"></ul>
</div>
<div class="content">
${content}
${(() => {
  // Close any unclosed <pre> or <code> tags before bottom CTA
  let fixed = content;
  const preOpen = (fixed.match(/<pre>/g) || []).length;
  const preClose = (fixed.match(/<\/pre>/g) || []).length;
  const codeOpen = (fixed.match(/<code>/g) || []).length;
  const codeClose = (fixed.match(/<\/code>/g) || []).length;
  let closingTags = '';
  if (preOpen > preClose) closingTags += '</code></pre>';
  if (codeOpen > codeClose) closingTags += '</code>';
  return closingTags;
})()}

<div style="background:var(--bg-glass);backdrop-filter:blur(var(--blur-lg));-webkit-backdrop-filter:blur(var(--blur-lg));border:1px solid var(--border-glass);padding:48px 32px;border-radius:var(--radius-xl);text-align:center;position:relative;overflow:hidden;margin:40px 0 32px">
  <div style="position:absolute;top:0;left:0;right:0;height:1px;background:var(--gradient-accent);opacity:0.5"></div>
  <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;justify-content:center;gap:12px"><span style="width:24px;height:1px;background:var(--accent)"></span>Open to work<span style="width:24px;height:1px;background:var(--accent)"></span></p>
  <h3 style="margin:0 0 12px;font-size:clamp(22px,3vw,32px);font-weight:800;color:var(--text-primary);letter-spacing:-0.02em">${ctaHeadline}</h3>
  <p style="margin:0 auto 24px;max-width:480px;font-size:15px;color:var(--text-secondary);line-height:1.7">Available for full-time, contract or remote ${expertise} development roles. Let's discuss your project &mdash; I'll get back within 24 hours.</p>
  <a href="mailto:parmarshiv1101@gmail.com" style="display:inline-flex;align-items:center;gap:8px;background:var(--gradient-accent);color:#000;padding:14px 32px;border-radius:var(--radius-md);font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 20px rgba(201,168,76,0.3);transition:all 0.3s" title="Email Shiv Parmar for ${expertise} development projects">${ctaButton} <span>&rarr;</span></a>
</div>
</div>
<div class="tags"><span class="tag">WordPress</span><span class="tag">Development</span></div>
<div class="author-box">
  <img src="../images/shiv-parmar-wordpress-developer.jpg" alt="Shiv Parmar - WordPress Developer" title="Shiv Parmar - WordPress Developer from Rajkot, India">
  <div class="author-info">
    <h4>Shiv Parmar</h4>
    <p>WordPress Developer from Rajkot, India. Specializing in custom themes, WooCommerce, and high-performance WordPress sites.</p>
    <div class="author-social">
      <a href="https://linkedin.com/in/shiv-parmar" target="_blank" rel="noopener" title="Connect with Shiv Parmar on LinkedIn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </a>
      <a href="https://github.com/shivparmar1101" target="_blank" rel="noopener" title="View Shiv Parmar's GitHub Profile">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        GitHub
      </a>
      <a href="mailto:parmarshiv1101@gmail.com" title="Email Shiv Parmar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        Email
      </a>
    </div>
  </div>
</div>
<div class="related-blogs">
  <h3>Related Posts</h3>
  <div class="related-grid" id="relatedBlogs"></div>
</div>
</div></article>

<section id="contact" class="cta-section" aria-labelledby="contact-heading">
  <div class="container">
    <div class="contact-grid">
      <div class="form-card reveal">
        <h3>Let's Work Together</h3>
        <form id="contactForm" novalidate>
          <div class="form-row">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" placeholder="John Doe" required>
          </div>
          <div class="form-row">
            <label for="email">Email Address *</label>
            <input type="email" id="email" name="email" placeholder="john@example.com" required>
          </div>
          <div class="form-row">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" placeholder="+91 00000 00000">
          </div>
          <div class="form-row">
            <label for="subject">Subject *</label>
            <select id="subject" name="subject" required>
              <option value="" disabled selected>Select an inquiry type</option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Project Request">Project Request</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Freelance Work">Freelance Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-row">
            <label for="budget">Budget Range</label>
            <select id="budget" name="budget">
              <option value="" disabled selected>Select budget range</option>
              <option value="Under Rs.10,000">Under Rs.10,000</option>
              <option value="Rs.10,000 - Rs.25,000">Rs.10,000 - Rs.25,000</option>
              <option value="Rs.25,000 - Rs.50,000">Rs.25,000 - Rs.50,000</option>
              <option value="Rs.50,000 - Rs.1,00,000">Rs.50,000 - Rs.1,00,000</option>
              <option value="Above Rs.1,00,000">Above Rs.1,00,000</option>
            </select>
          </div>
          <div class="form-row">
            <label for="message">Project Details *</label>
            <textarea id="message" name="message" rows="5" placeholder="Tell me about your project, goals, and timeline..." required></textarea>
          </div>
          <button class="btn btn-primary" type="submit">Send Message <span class="arrow">&rarr;</span></button>
          <p class="form-note" id="formStatus">Your message will be sent directly to my email &mdash; I'll respond within 24 hours.</p>
        </form>
      </div>
      <div class="contact-info">
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="6" y="10" width="36" height="26" rx="3"/>
              <path d="M6 14l18 11 18-11"/>
            </svg>
          </div>
          <div>
            <strong>Email</strong>
            <a href="mailto:parmarshiv1101@gmail.com" title="Send email to Shiv Parmar">parmarshiv1101@gmail.com</a>
          </div>
        </div>
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="6" y="6" width="36" height="36" rx="5"/>
              <path d="M16 21v15"/>
              <circle cx="16" cy="15" r="2.5" fill="currentColor" stroke="none"/>
              <path d="M24 21v15"/>
              <path d="M24 27c0-4 2-6 5-6s5 2 5 6v9"/>
            </svg>
          </div>
          <div>
            <strong>LinkedIn</strong>
            <a href="https://www.linkedin.com/in/shiv-parmar/" target="_blank" rel="noopener noreferrer" title="Connect with Shiv Parmar on LinkedIn">linkedin.com/in/shiv-parmar</a>
          </div>
        </div>
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="currentColor" stroke="none" aria-hidden="true">
              <path d="M24 4C12.95 4 4 12.95 4 24c0 8.84 5.74 16.34 13.7 18.98 1 .18 1.37-.44 1.37-.98v-3.46c-5.57 1.22-6.74-2.68-6.74-2.68-.91-2.31-2.22-2.93-2.22-2.93-1.81-1.24.14-1.21.14-1.21 2 .14 3.06 2.06 3.06 2.06 1.78 3.05 4.67 2.16 5.81 1.65.18-1.29.7-2.16 1.27-2.66-4.45-.5-9.12-2.22-9.12-9.9 0-2.19.78-3.98 2.06-5.38-.2-.5-.9-2.52.2-5.25 0 0 1.68-.54 5.5 2.06a19.16 19.16 0 0 1 10 0c3.82-2.6 5.5-2.06 5.5-2.06 1.1 2.73.4 4.75.2 5.25 1.28 1.4 2.06 3.19 2.06 5.38 0 7.7-4.68 9.39-9.14 9.88.72.62 1.36 1.85 1.36 3.73v5.54c0 .55.37 1.17 1.38.98C38.27 40.34 44 32.84 44 24 44 12.95 35.05 4 24 4Z"/>
            </svg>
          </div>
          <div>
            <strong>GitHub</strong>
            <a href="https://github.com/shivparmar1101/shiv-parmar-portfolio" target="_blank" rel="noopener noreferrer" title="View Shiv Parmar's Portfolio on GitHub">github.com/shivparmar1101</a>
          </div>
        </div>
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 8h-2a3 3 0 0 0-3 3v2c0 14 10 24 24 24h2a3 3 0 0 0 3-3v-3l-5-3-3 2a18 18 0 0 1-9-9l2-3-3-5z"/>
            </svg>
          </div>
          <div>
            <strong>Phone</strong>
            <a href="tel:+917359411663" title="Call Shiv Parmar">+91 73594 11663</a>
          </div>
        </div>
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M24 44S40 30 40 20a16 16 0 1 0-32 0c0 10 16 24 16 24Z"/>
              <circle cx="24" cy="20" r="5"/>
            </svg>
          </div>
          <div>
            <strong>Location</strong>
            <span>Rajkot, India &middot; Remote-ready</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<div id="site-footer">
<noscript>
<footer><div class="container footer-inner"><span class="footer-left">&copy; 2026 Shiv Parmar &middot; WordPress Developer</span><div class="footer-right"><a href="https://linkedin.com/in/shiv-parmar" target="_blank" rel="noopener">LinkedIn</a><a href="https://github.com/shivparmar1101" target="_blank" rel="noopener">GitHub</a><span style="color:var(--text-muted);font-size:13px">Full-time &middot; Contract &middot; Remote</span></div></div></footer>
</noscript>
</div>
<script src="../includes.js"></script><script src="../particle-bg.js" defer></script><script src="../script.js"></script><script src="../spatial-tilt.js" defer></script>
<script>
(function(){
  function initBlog(){
    var toc=document.getElementById("tocList");
    if(toc){
      document.querySelectorAll(".content h2").forEach(function(h,i){
        var id="section-"+i;h.id=id;
        var li=document.createElement("li");
        var a=document.createElement("a");
        a.href="#"+id;a.textContent=h.textContent;a.title=h.textContent;
        li.appendChild(a);toc.appendChild(li);
      });
    }
    var related=document.getElementById("relatedBlogs");
    if(related){
      var posts=[{"date":"Aug 19, 2026 \u0026middot; 6 min read","title":"WordPress Gutenberg vs Elementor: Which is Better in 2026?","slug":"wordpress-gutenberg-vs-elementor-which-is-better-in-2026"},{"date":"Aug 19, 2026 \u0026middot; 5 min read","title":"How to Speed Up WooCommerce Product Pages","slug":"how-to-speed-up-woocommerce-product-pages"},{"date":"Aug 19, 2026 \u0026middot; 4 min read","title":"How to Set Up WordPress Staging Environment","slug":"how-to-set-up-wordpress-staging-environment"},{"date":"Aug 19, 2026 \u0026middot; 5 min read","title":"WooCommerce Shipping Zones Setup Guide","slug":"woocommerce-shipping-zones-setup-guide"},{"date":"Aug 19, 2026 \u0026middot; 5 min read","title":"WooCommerce Tax Configuration Guide","slug":"woocommerce-tax-configuration-guide"},{"date":"Aug 19, 2026 \u0026middot; 5 min read","title":"WordPress Post Types and Taxonomies Explained","slug":"wordpress-post-types-and-taxonomies-explained"},{"date":"Aug 19, 2026 \u0026middot; 8 min read","title":"WordPress Database Optimization Guide","slug":"wordpress-database-optimization-guide"},{"date":"Aug 19, 2026 \u0026middot; 4 min read","title":"WordPress Security Headers Configuration","slug":"wordpress-security-headers-configuration"},{"date":"Aug 19, 2026 \u0026middot; 5 min read","title":"WordPress SEO Technical Checklist","slug":"wordpress-seo-technical-checklist"},{"date":"Aug 19, 2026 \u0026middot; 7 min read","title":"How to Build a WordPress Membership Site","slug":"how-to-build-a-wordpress-membership-site"}];
      var currentSlug=window.location.pathname.split("/").pop().replace(".html","");
      var count=0;
      posts.forEach(function(p){
        if(p.slug!==currentSlug && count<3){
          var card=document.createElement("div");
          card.className="related-card";
          card.innerHTML='<div class="date">'+p.date+'</div><h4><a href="../blog/'+p.slug+'.html" title="'+p.title+'">'+p.title+'</a></h4>';
          related.appendChild(card);
          count++;
        }
      });
    }
  }
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",initBlog)}else{initBlog()}
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
    const existingCards = content.substring(startIdx + startMarker.length, endIdx).trim();
    const newContent = content.substring(0, startIdx + startMarker.length) + '\n' + newCard + '\n' + existingCards + '\n' + content.substring(endIdx);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('Updated: ' + filePath);
    return true;
  }
  console.log('ERROR: Markers not found in ' + filePath);
  return false;
}

async function main() {
  console.log('Blog Auto-Publisher v2 (Node.js)');
  console.log('Model: gemini-3.6-flash');
  console.log('  ' + new Date().toISOString());

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

  const rawContent = await callGemini(prompt);
  console.log('Content generated! (' + rawContent.length + ' chars)');

  // Auto internal linking
  const linkedContent = addInternalLinks(rawContent, topic.slug);
  console.log('Internal links added!');

  const expertiseMap = {
    WordPress: 'WordPress',
    WooCommerce: 'WooCommerce',
    SEO: 'WordPress SEO',
    Security: 'WordPress Security',
    Performance: 'WordPress Performance'
  };
  const expertise = expertiseMap[topic.cat] || 'WordPress';

  // Dynamic CTA generation based on category and topic
  const ctaVariants = {
    WordPress: {
      headlines: [
        'Need a WordPress Expert on Your Side?',
        'Want to Build Something Similar?',
        'Let\'s Create Your WordPress Solution',
        'Looking for a WordPress Developer?',
        'Your WordPress Project Deserves Expert Help'
      ],
      descriptions: [
        'I specialize in building custom WordPress solutions that drive results. Let\'s discuss your project.',
        'From custom themes to complex plugins — I build WordPress solutions that work. Let\'s talk.',
        'Whether it\'s a simple site or complex platform, I deliver WordPress projects on time and on budget.',
        'I help businesses unlock WordPress\'s full potential. Let\'s see what I can do for you.',
        'Custom WordPress development with clean code and fast delivery. Let\'s start your project.'
      ],
      buttons: ['Start a Project', 'Get in Touch', 'Let\'s Talk', 'Hire Me', 'Discuss My Project']
    },
    WooCommerce: {
      headlines: [
        'Need a WooCommerce Expert on Your Side?',
        'Want to Boost Your Online Store?',
        'Let\'s Optimize Your WooCommerce Store',
        'Looking for a WooCommerce Developer?',
        'Your WooCommerce Store Deserves Expert Help'
      ],
      descriptions: [
        'I build WooCommerce stores that convert visitors into customers. Let\'s discuss your e-commerce needs.',
        'From payment gateways to inventory management — I make WooCommerce work for your business.',
        'Custom WooCommerce solutions that increase sales and streamline operations. Let\'s talk.',
        'I help businesses maximize their WooCommerce potential. Ready to grow your store?',
        'Expert WooCommerce development that drives revenue. Let\'s build something amazing together.'
      ],
      buttons: ['Boost My Store', 'Get in Touch', 'Let\'s Talk', 'Hire Me', 'Discuss My Project']
    },
    Security: {
      headlines: [
        'Need a WordPress Security Expert on Your Side?',
        'Worried About Your Site\'s Security?',
        'Let\'s Secure Your WordPress Site',
        'Looking for a Security Specialist?',
        'Your Website Security Can\'t Wait'
      ],
      descriptions: [
        'I help businesses protect their WordPress sites from threats. Let\'s assess your security needs.',
        'From security audits to malware removal — I keep your WordPress site safe and secure.',
        'Don\'t wait for a breach. I implement proactive security measures that protect your business.',
        'I specialize in WordPress security hardening. Let\'s make your site attack-resistant.',
        'Expert security solutions that give you peace of mind. Let\'s protect your digital assets.'
      ],
      buttons: ['Secure My Site', 'Get in Touch', 'Let\'s Talk', 'Hire Me', 'Discuss My Project']
    },
    SEO: {
      headlines: [
        'Need Help With WordPress SEO?',
        'Want to Rank Higher on Google?',
        'Let\'s Improve Your Search Rankings',
        'Looking for an SEO Expert?',
        'Your Website Deserves More Traffic'
      ],
      descriptions: [
        'I help businesses improve their WordPress SEO and drive organic traffic. Let\'s discuss your goals.',
        'From technical SEO to content optimization — I make WordPress sites rank higher.',
        'Custom SEO strategies that deliver measurable results. Let\'s grow your organic presence.',
        'I specialize in WordPress SEO that works. Ready to dominate search results?',
        'Expert SEO solutions that increase visibility and drive qualified leads. Let\'s talk.'
      ],
      buttons: ['Rank Higher', 'Get in Touch', 'Let\'s Talk', 'Hire Me', 'Discuss My Project']
    },
    Performance: {
      headlines: [
        'Need a WordPress Performance Expert?',
        'Is Your Site Running Slow?',
        'Let\'s Speed Up Your WordPress Site',
        'Looking for a Performance Specialist?',
        'Your Website Speed Matters'
      ],
      descriptions: [
        'I help businesses optimize WordPress performance for faster load times. Let\'s assess your site.',
        'From caching to CDN setup — I make WordPress sites lightning fast.',
        'Custom performance solutions that improve user experience and SEO. Let\'s optimize your site.',
        'I specialize in WordPress speed optimization. Ready to leave competitors behind?',
        'Expert performance tuning that boosts conversions. Let\'s make your site blazing fast.'
      ],
      buttons: ['Speed Up My Site', 'Get in Touch', 'Let\'s Talk', 'Hire Me', 'Discuss My Project']
    }
  };

  const variants = ctaVariants[topic.cat] || ctaVariants.WordPress;
  const headlineIdx = Math.floor(Math.random() * variants.headlines.length);
  const descIdx = Math.floor(Math.random() * variants.descriptions.length);
  const btnIdx = Math.floor(Math.random() * variants.buttons.length);
  
  const ctaHeadline = variants.headlines[headlineIdx];
  const ctaDescription = variants.descriptions[descIdx];
  const ctaButton = variants.buttons[btnIdx];

  const topCta = '<div style="background:var(--bg-glass);backdrop-filter:blur(var(--blur-lg));-webkit-backdrop-filter:blur(var(--blur-lg));border:1px solid var(--border-glass);padding:48px 32px;border-radius:var(--radius-xl);text-align:center;position:relative;overflow:hidden;margin:32px 0"><div style="position:absolute;top:0;left:0;right:0;height:1px;background:var(--gradient-accent);opacity:0.5"></div><p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;justify-content:center;gap:12px"><span style="width:24px;height:1px;background:var(--accent)"></span>Open to work<span style="width:24px;height:1px;background:var(--accent)"></span></p><h3 style="margin:0 0 12px;font-size:clamp(22px,3vw,32px);font-weight:800;color:var(--text-primary);letter-spacing:-0.02em">' + ctaHeadline + '</h3><p style="margin:0 auto 24px;max-width:480px;font-size:15px;color:var(--text-secondary);line-height:1.7">' + ctaDescription + '</p><a href="mailto:parmarshiv1101@gmail.com" style="display:inline-flex;align-items:center;gap:8px;background:var(--gradient-accent);color:#000;padding:14px 32px;border-radius:var(--radius-md);font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 20px rgba(201,168,76,0.3);transition:all 0.3s">' + ctaButton + ' <span>&rarr;</span></a></div>';

  // Find first </p> that is NOT inside <pre> or <code> block
  let insertPos = -1;
  let searchFrom = 0;
  while (searchFrom < linkedContent.length) {
    const pEnd = linkedContent.indexOf('</p>', searchFrom);
    if (pEnd === -1) break;
    
    // Check if this </p> is inside a <pre> block
    const beforeP = linkedContent.substring(0, pEnd);
    const lastPreOpen = beforeP.lastIndexOf('<pre');
    const lastPreClose = beforeP.lastIndexOf('</pre>');
    
    // If last <pre> is after last </pre>, we're inside a <pre> block - skip
    if (lastPreOpen > lastPreClose) {
      searchFrom = pEnd + 4;
      continue;
    }
    
    // Also check for <code> blocks (inline code won't have newlines, but block code might)
    const lastCodeOpen = beforeP.lastIndexOf('<code');
    const lastCodeClose = beforeP.lastIndexOf('</code>');
    if (lastCodeOpen > lastCodeClose) {
      searchFrom = pEnd + 4;
      continue;
    }
    
    insertPos = pEnd;
    break;
  }
  
  const content = insertPos > -1
    ? linkedContent.substring(0, insertPos + 4) + '\n' + topCta + '\n' + linkedContent.substring(insertPos + 4)
    : linkedContent;

  const date = new Date().toISOString().split('T')[0];
  const imageUrl = images[topic.cat] || images.default;

  // Meta Description = Category template + Blog title (120-320 chars, SEO optimized)
  const metaDescTemplates = {
    'WordPress': `Learn ${topic.title} with this comprehensive WordPress development guide by Shiv Parmar. Step-by-step instructions, practical code examples, and expert tips to help you build better WordPress websites.`,
    'WooCommerce': `Master ${topic.title} with this detailed WooCommerce guide by Shiv Parmar. Expert tips, step-by-step instructions, and real-world examples to grow your online store.`,
    'Security': `Protect your WordPress site with this in-depth guide on ${topic.title} by Shiv Parmar. Learn security best practices, vulnerability fixes, and hardening techniques.`,
    'SEO': `Improve your search rankings with this complete guide on ${topic.title} by Shiv Parmar. WordPress SEO strategies, technical tips, and actionable steps for better visibility.`,
    'Performance': `Boost your website speed with this expert guide on ${topic.title} by Shiv Parmar. Learn optimization techniques, caching strategies, and performance best practices.`
  };
  const metaDesc = metaDescTemplates[topic.cat] || metaDescTemplates['WordPress'];

  // Keywords = Category base + Title keywords (auto-extracted)
  const catKeywords = {
    'WordPress': 'WordPress, WordPress development, WordPress tips',
    'WooCommerce': 'WooCommerce, WooCommerce tips, online store',
    'Security': 'WordPress security, website security, security tips',
    'SEO': 'WordPress SEO, SEO tips, search engine optimization',
    'Performance': 'WordPress speed, website performance, page speed'
  };
  const titleWords = topic.title.toLowerCase().split(' ').filter(w => w.length > 4 && !['guide','tips','best','practices','complete','comparison'].includes(w)).slice(0, 4).join(', ');
  const metaKeywords = `${catKeywords[topic.cat] || catKeywords['WordPress']}, ${titleWords}`;

  // Save blog file
  const blogHTML = generateBlogHTML(topic.title, topic.slug, date, topic.read, imageUrl, content, expertise, ctaHeadline, ctaButton, metaDesc, metaKeywords);
  const blogPath = path.join(BLOG_DIR, topic.slug + '.html');
  fs.writeFileSync(blogPath, blogHTML, 'utf-8');
  console.log('Saved: blog/' + topic.slug + '.html');

  // Update sitemap.xml
  const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let sitemap = fs.readFileSync(sitemapPath, 'utf-8');
    const newUrl = `  <url><loc>https://shiv-parmar-portfolio.netlify.app/blog/${topic.slug}</loc><lastmod>${date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    sitemap = sitemap.replace('</urlset>', newUrl + '\n</urlset>');
    fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
    console.log('Updated: sitemap.xml');
  }

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
  console.log('  URL: https://shiv-parmar-portfolio.netlify.app/blog/' + topic.slug + '.html');
  console.log('=========================================');
  
  // Output for GitHub Actions
  console.log('::set-output name=blog_url::https://shiv-parmar-portfolio.netlify.app/blog/' + topic.slug + '.html');
  console.log('::set-output name=blog_title::' + topic.title);
}

main().catch(err => {
  console.error('FATAL ERROR:', err.message);
  process.exit(1);
});
