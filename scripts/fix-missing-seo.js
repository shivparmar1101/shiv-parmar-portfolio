const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'blog', 'woocommerce-inventory-management-best-practices.html');
let c = fs.readFileSync(file, 'utf8');

const title = 'WooCommerce Inventory Management Best Practices Guide';
const desc = 'Master WooCommerce inventory management with best practices for stock tracking, threshold optimization, out-of-stock handling, and automated alerts. Includes PHP code snippets for developers.';
const keywords = 'WooCommerce inventory management, stock management, WooCommerce stock, inventory tracking, out of stock';
const ogimage = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop';
const canonical = 'https://shiv-parmar-portfolio.netlify.app/blog/woocommerce-inventory-management-best-practices.html';

// Replace title
c = c.replace(/<title>[^<]+<\/title>/, '<title>' + title + '</title>');

// Replace description
c = c.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + desc + '">');

// Add SEO tags after description
const seoTags = `
<meta name="keywords" content="${keywords}">
<meta name="author" content="Shiv Parmar">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogimage}">
<meta property="og:site_name" content="Shiv Parmar - WordPress Developer Portfolio">
<meta property="og:locale" content="en_IN">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ogimage}">
<meta name="twitter:creator" content="@shivparmar1101">

<!-- Schema.org Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${title}",
  "description": "${desc}",
  "author": { "@type": "Person", "name": "Shiv Parmar", "url": "https://www.linkedin.com/in/shiv-parmar/" },
  "publisher": { "@type": "Person", "name": "Shiv Parmar" },
  "datePublished": "2026-08-19",
  "dateModified": "2026-08-19",
  "image": "${ogimage}",
  "mainEntityOfPage": "${canonical}"
}
</script>`;

c = c.replace(/(<meta name="description" content="[^"]*">)/, '$1' + seoTags);

fs.writeFileSync(file, c, 'utf8');
console.log('UPDATED: woocommerce-inventory-management-best-practices.html');
