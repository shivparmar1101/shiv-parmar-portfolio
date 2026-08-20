const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

const posts = [
  {
    file: "how-to-build-a-wordpress-membership-site.html",
    title: "Build WordPress Membership Site with Custom Roles",
    desc: "Complete guide to building a WordPress membership site from scratch. Learn custom user roles, content restriction by role, paywall logic, and subscription management using native PHP hooks — no expensive plugins required.",
    keywords: "WordPress membership site, content restriction, user roles, paywall, premium content",
    ogimage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
  },
  {
    file: "how-to-set-up-wordpress-staging-environment.html",
    title: "Set Up WordPress Staging Environment Step by Step",
    desc: "Learn how to set up a WordPress staging environment for safe testing. Covers WP-CLI site cloning, database duplication, wp-config.php environment isolation, and a full post-setup checklist before pushing to production.",
    keywords: "WordPress staging environment, staging site, WP-CLI clone, development sandbox",
    ogimage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
  },
  {
    file: "how-to-speed-up-woocommerce-product-pages.html",
    title: "Speed Up WooCommerce Product Pages — Developer Guide",
    desc: "Speed up slow WooCommerce product pages with these proven developer techniques. Disable cart fragments, optimize AJAX variation threshold, preload hero images for LCP, and reduce database queries for instant page loads.",
    keywords: "WooCommerce speed, product page optimization, WooCommerce performance, LCP",
    ogimage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
  },
  {
    file: "woocommerce-payment-gateway-comparison-2026.html",
    title: "WooCommerce Payment Gateway Comparison 2026: Stripe vs Razorpay",
    desc: "Compare the best WooCommerce payment gateways for 2026. In-depth review of Stripe, Razorpay, PayPal, and Square with pricing breakdown, feature comparison, developer customization options, and conditional gateway PHP code.",
    keywords: "payment gateway, WooCommerce payments, Stripe Razorpay PayPal",
    ogimage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
  },
  {
    file: "woocommerce-product-bundles-setup.html",
    title: "WooCommerce Product Bundles Setup Guide for Developers",
    desc: "Complete guide to setting up WooCommerce product bundles that increase average order value. Covers bundle pricing configuration, shipping rules, stock management, and custom PHP, CSS, and JavaScript tweaks for a polished look.",
    keywords: "product bundles, WooCommerce bundles, bundle pricing, cross-sell",
    ogimage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
  },
  {
    file: "woocommerce-product-variation-best-practices.html",
    title: "WooCommerce Product Variation Best Practices & Optimization",
    desc: "Master WooCommerce product variations with best practices for performance, UX, and database management. Covers AJAX threshold tuning, dropdown to swatch conversion, out-of-stock handling, and CRUD update optimization with PHP.",
    keywords: "product variations, WooCommerce variable products, variation optimization",
    ogimage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
  },
  {
    file: "woocommerce-shipping-zones-setup-guide.html",
    title: "WooCommerce Shipping Zones Setup Guide for Beginners",
    desc: "Step-by-step WooCommerce shipping zones setup guide. Configure flat rate, free shipping thresholds, local pickup, and conditional shipping methods. Includes PHP snippets for hiding methods and JavaScript for delivery estimates.",
    keywords: "shipping zones, WooCommerce shipping setup, shipping methods",
    ogimage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
  },
  {
    file: "woocommerce-tax-configuration-guide.html",
    title: "WooCommerce Tax Configuration Guide with GST Setup",
    desc: "Complete WooCommerce tax configuration guide for developers. Set up tax rates, classes, Indian GST (CGST/SGST), tax-inclusive pricing, and custom tax exemption logic for wholesale customers using PHP hooks and filters.",
    keywords: "tax configuration, WooCommerce taxes, GST WooCommerce",
    ogimage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
  },
  {
    file: "wordpress-database-optimization-guide.html",
    title: "WordPress Database Optimization Guide for Developers",
    desc: "Optimize your WordPress database for peak performance. Learn to limit post revisions, clean wp_options autoload bloat, remove orphaned metadata, convert MyISAM to InnoDB, and automate weekly maintenance with PHP cron jobs.",
    keywords: "database optimization, WordPress database cleanup, wp_options autoload",
    ogimage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
  },
  {
    file: "wordpress-gutenberg-vs-elementor-which-is-better-in-2026.html",
    title: "Gutenberg vs Elementor 2026: Which Page Builder Wins?",
    desc: "Gutenberg vs Elementor in 2026 — a developer comparison of performance, design flexibility, developer experience, and long-term maintainability. See real Core Web Vitals benchmarks and code-level analysis to pick the right builder.",
    keywords: "Gutenberg vs Elementor, WordPress page builder, block editor vs Elementor",
    ogimage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
  },
  {
    file: "wordpress-migration-guide-local-to-production.html",
    title: "WordPress Migration Guide: Local to Production Deploy",
    desc: "Migrate your WordPress site from localhost to production with confidence. Covers file transfer via rsync and SSH, database search-replace with WP-CLI, wp-config.php production config, and post-deployment QA checklist.",
    keywords: "WordPress migration, local to production, WP-CLI migration",
    ogimage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
  },
  {
    file: "wordpress-post-types-and-taxonomies-explained.html",
    title: "WordPress Custom Post Types and Taxonomies Explained",
    desc: "Learn WordPress custom post types and taxonomies from scratch. Register CPTs with register_post_type, build custom taxonomies, query with WP_Query, and architect your content properly with practical PHP code examples.",
    keywords: "custom post types, WordPress taxonomies, register_post_type",
    ogimage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
  },
  {
    file: "wordpress-security-headers-configuration.html",
    title: "WordPress Security Headers Configuration Guide",
    desc: "Configure WordPress HTTP security headers to protect against XSS, clickjacking, and MIME sniffing attacks. Complete PHP, Apache, and Nginx configuration examples for Content-Security-Policy, HSTS, and X-Frame-Options.",
    keywords: "security headers, WordPress HTTP headers, Content Security Policy",
    ogimage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop"
  },
  {
    file: "wordpress-seo-technical-checklist.html",
    title: "WordPress Technical SEO Checklist for Developers",
    desc: "Master WordPress technical SEO with this developer checklist. Optimize Core Web Vitals, add JSON-LD structured data without plugins, clean up wp_head, configure robots.txt, and implement canonical URLs with PHP code snippets.",
    keywords: "technical SEO, WordPress SEO checklist, Core Web Vitals",
    ogimage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop"
  }
];

function generateSEOHead(post) {
  return `
<meta name="keywords" content="${post.keywords}">
<meta name="author" content="Shiv Parmar">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://shiv-parmar-portfolio.netlify.app/blog/${post.file}">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:title" content="${post.title}">
<meta property="og:description" content="${post.desc}">
<meta property="og:url" content="https://shiv-parmar-portfolio.netlify.app/blog/${post.file}">
<meta property="og:image" content="${post.ogimage}">
<meta property="og:site_name" content="Shiv Parmar - WordPress Developer Portfolio">
<meta property="og:locale" content="en_IN">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${post.title}">
<meta name="twitter:description" content="${post.desc}">
<meta name="twitter:image" content="${post.ogimage}">
<meta name="twitter:creator" content="@shivparmar1101">

<!-- Schema.org Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${post.title}",
  "description": "${post.desc}",
  "author": { "@type": "Person", "name": "Shiv Parmar", "url": "https://www.linkedin.com/in/shiv-parmar/" },
  "publisher": { "@type": "Person", "name": "Shiv Parmar" },
  "datePublished": "2026-08-19",
  "dateModified": "2026-08-19",
  "image": "${post.ogimage}",
  "mainEntityOfPage": "https://shiv-parmar-portfolio.netlify.app/blog/${post.file}"
}
</script>`;
}

let updated = 0;
for (const post of posts) {
  const filePath = path.join(BLOG_DIR, post.file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${post.file} (not found)`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace title
  content = content.replace(/<title>[^<]+<\/title>/, `<title>${post.title}</title>`);
  
  // Replace description
  content = content.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${post.desc}">`);
  
  // Check if SEO tags already exist
  if (!content.includes('meta name="keywords"')) {
    // Insert SEO tags after description
    const descMatch = content.match(/<meta name="description" content="[^"]*">/);
    if (descMatch) {
      content = content.replace(descMatch[0], descMatch[0] + generateSEOHead(post));
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`UPDATED: ${post.file}`);
  updated++;
}

console.log(`\nDone! Updated ${updated} blog posts.`);
