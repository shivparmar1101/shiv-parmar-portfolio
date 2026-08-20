const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));

const expertiseMap = {
  'building-a-wordpress-rest-api-from-scratch.html': 'WordPress',
  'how-to-build-a-wordpress-membership-site.html': 'WordPress',
  'how-to-set-up-wordpress-staging-environment.html': 'WordPress',
  'how-to-speed-up-woocommerce-product-pages.html': 'WooCommerce',
  'woocommerce-inventory-management-best-practices.html': 'WooCommerce',
  'woocommerce-payment-gateway-comparison-2026.html': 'WooCommerce',
  'woocommerce-product-bundles-setup.html': 'WooCommerce',
  'woocommerce-product-variation-best-practices.html': 'WooCommerce',
  'woocommerce-shipping-zones-setup-guide.html': 'WooCommerce',
  'woocommerce-tax-configuration-guide.html': 'WooCommerce',
  'wordpress-database-optimization-guide.html': 'WordPress',
  'wordpress-gutenberg-vs-elementor-which-is-better-in-2026.html': 'WordPress',
  'wordpress-migration-guide-local-to-production.html': 'WordPress',
  'wordpress-post-types-and-taxonomies-explained.html': 'WordPress',
  'wordpress-security-headers-configuration.html': 'WordPress Security',
  'wordpress-seo-technical-checklist.html': 'WordPress',
  'wordpress-cron-jobs-complete-guide.html': 'WordPress',
  'how-to-add-custom-css-to-wordpress-without-plugin.html': 'WordPress'
};

let updated = 0;

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Check if CTA already exists
  if (content.includes('Need a') && content.includes('Expert on Your Side?')) {
    return; // Skip, CTA already exists
  }
  
  const expertise = expertiseMap[file] || 'WordPress';
  
  const topCta = `<div style="background:var(--bg-glass);backdrop-filter:blur(var(--blur-lg));-webkit-backdrop-filter:blur(var(--blur-lg));border:1px solid var(--border-glass);padding:48px 32px;border-radius:var(--radius-xl);text-align:center;position:relative;overflow:hidden;margin:32px 0"><div style="position:absolute;top:0;left:0;right:0;height:1px;background:var(--gradient-accent);opacity:0.5"></div><p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;justify-content:center;gap:12px"><span style="width:24px;height:1px;background:var(--accent)"></span>Open to work<span style="width:24px;height:1px;background:var(--accent)"></span></p><h3 style="margin:0 0 12px;font-size:clamp(22px,3vw,32px);font-weight:800;color:var(--text-primary);letter-spacing:-0.02em">Need a ${expertise} Expert on Your Side?</h3><p style="margin:0 auto 24px;max-width:480px;font-size:15px;color:var(--text-secondary);line-height:1.7">I build custom ${expertise} solutions that help businesses grow. Let's discuss what you need.</p><a href="mailto:parmarshiv1101@gmail.com" style="display:inline-flex;align-items:center;gap:8px;background:var(--gradient-accent);color:#000;padding:14px 32px;border-radius:var(--radius-md);font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 20px rgba(201,168,76,0.3);transition:all 0.3s">Get in Touch <span>&rarr;</span></a></div>`;
  
  // Find first </p> in content div and insert CTA after it
  const contentStart = content.indexOf('<div class="content">');
  if (contentStart === -1) return;
  
  const firstPEnd = content.indexOf('</p>', contentStart);
  if (firstPEnd === -1) return;
  
  content = content.substring(0, firstPEnd + 4) + '\n' + topCta + '\n' + content.substring(firstPEnd + 4);
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`ADDED CTA: ${file} (${expertise})`);
    updated++;
  }
});

console.log(`\nDone! Updated ${updated} files.`);
