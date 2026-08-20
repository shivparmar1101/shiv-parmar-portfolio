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
  
  const expertise = expertiseMap[file] || 'WordPress';
  
  // Replace "Hire a WordPress Developer" with dynamic expertise
  const bottomCtaOld = 'Hire a WordPress Developer';
  const bottomCtaNew = `Hire a ${expertise} Developer`;
  
  if (content.includes(bottomCtaOld) && bottomCtaOld !== bottomCtaNew) {
    content = content.replace(bottomCtaOld, bottomCtaNew);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`FIXED BOTTOM CTA: ${file} → ${bottomCtaNew}`);
    updated++;
  }
});

console.log(`\nDone! Updated ${updated} files.`);
