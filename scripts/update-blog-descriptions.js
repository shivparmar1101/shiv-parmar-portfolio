const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

const blogDescriptions = {
  'how-to-add-custom-css-to-wordpress-without-plugin': {
    description: 'Learn how to add custom CSS to WordPress without using any plugins. Step-by-step guide with code examples for beginners and developers by Shiv Parmar.',
    keywords: 'WordPress, custom CSS, WordPress tutorial, CSS styling, WordPress development, Shiv Parmar'
  },
  'how-to-create-a-wordpress-booking-system': {
    description: 'Complete guide to create a WordPress booking system from scratch. Learn PHP, JavaScript and WooCommerce integration for appointment scheduling.',
    keywords: 'WordPress booking system, appointment scheduling, WooCommerce bookings, WordPress development, PHP'
  },
  'woocommerce-payment-gateway-comparison-2026': {
    description: 'Detailed comparison of WooCommerce payment gateways in 2026. Compare Stripe, PayPal, Razorpay and more for your online store with expert insights.',
    keywords: 'WooCommerce payment gateway, Stripe vs PayPal, payment comparison 2026, online store payments'
  },
  'woocommerce-product-bundles-setup': {
    description: 'Complete guide to setup WooCommerce product bundles. Learn how to create bundle products, configure pricing and boost your average order value.',
    keywords: 'WooCommerce product bundles, bundle pricing, product grouping, WooCommerce setup, ecommerce'
  },
  'woocommerce-product-variation-best-practices': {
    description: 'Best practices for WooCommerce product variations. Learn how to setup variable products, manage inventory and optimize your store performance.',
    keywords: 'WooCommerce variations, variable products, product attributes, WooCommerce tips, ecommerce'
  },
  'woocommerce-tax-configuration-guide': {
    description: 'Complete WooCommerce tax configuration guide. Learn how to setup tax rates, tax classes and automate tax calculations for your online store.',
    keywords: 'WooCommerce tax, tax configuration, tax rates, ecommerce taxes, WordPress taxes'
  },
  'wordpress-block-theme-development-guide': {
    description: 'Comprehensive guide to WordPress block theme development. Learn how to create custom block themes, use theme.json and build modern WordPress sites.',
    keywords: 'WordPress block theme, theme development, block editor, theme.json, WordPress 2024'
  },
  'wordpress-migration-guide-local-to-production': {
    description: 'Step-by-step WordPress migration guide from local to production. Learn how to move your WordPress site safely without downtime or data loss.',
    keywords: 'WordPress migration, local to production, website migration, WordPress deploy, hosting'
  },
  'wordpress-multisite-configuration-tips': {
    description: 'Expert tips for WordPress multisite configuration. Learn how to setup and manage WordPress multisite network for multiple websites.',
    keywords: 'WordPress multisite, multisite configuration, network setup, WordPress hosting, multisite tips'
  },
  'wordpress-rest-api-authentication-methods': {
    description: 'Complete guide to WordPress REST API authentication methods. Learn OAuth, JWT, Application Passwords and API key authentication techniques.',
    keywords: 'WordPress REST API, API authentication, JWT, OAuth, WordPress API, API security'
  },
  'wordpress-security-headers-configuration': {
    description: 'Learn how to configure HTTP security headers in WordPress. Complete guide to CSP, HSTS, X-Frame-Options and more for better website security.',
    keywords: 'WordPress security, HTTP headers, security headers, CSP, HSTS, website security'
  },
  'wordpress-user-role-management-guide': {
    description: 'Complete guide to WordPress user role management. Learn how to create, customize and manage user roles and capabilities in WordPress.',
    keywords: 'WordPress user roles, user management, capabilities, WordPress admin, user permissions'
  }
};

function updateBlogDescription(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  
  const slug = filename.replace('.html', '');
  const blogData = blogDescriptions[slug];
  
  if (!blogData) {
    console.log(`Skipped: ${filename} (no data)`);
    return;
  }
  
  // Update meta description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${blogData.description}">`
  );
  
  // Update keywords
  html = html.replace(
    /<meta name="keywords" content="[^"]*">/,
    `<meta name="keywords" content="${blogData.keywords}">`
  );
  
  fs.writeFileSync(filepath, html);
  console.log(`Updated: ${filename} (${blogData.description.length} chars)`);
}

function main() {
  console.log('Updating blog descriptions to 120+ characters...\n');
  
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  
  for (const file of files) {
    updateBlogDescription(file);
  }
  
  console.log(`\nTotal: ${files.length} blogs updated`);
}

main();
