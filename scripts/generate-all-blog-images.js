const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const IMAGES_DIR = path.join(__dirname, '..', 'images', 'blog');

const blogPosts = [
  {
    slug: 'how-to-add-custom-css-to-wordpress-without-plugin',
    title: 'Custom CSS',
    subtitle: 'Without Plugin',
    badge: 'WordPress',
    icon: 'code'
  },
  {
    slug: 'how-to-create-a-wordpress-booking-system',
    title: 'Booking System',
    subtitle: 'Complete Guide',
    badge: 'WordPress',
    icon: 'calendar'
  },
  {
    slug: 'woocommerce-payment-gateway-comparison-2026',
    title: 'Payment Gateway',
    subtitle: 'Comparison 2026',
    badge: 'WooCommerce',
    icon: 'payment'
  },
  {
    slug: 'woocommerce-product-bundles-setup',
    title: 'Product Bundles',
    subtitle: 'Setup Guide',
    badge: 'WooCommerce',
    icon: 'box'
  },
  {
    slug: 'woocommerce-product-variation-best-practices',
    title: 'Product Variations',
    subtitle: 'Best Practices',
    badge: 'WooCommerce',
    icon: 'options'
  },
  {
    slug: 'woocommerce-tax-configuration-guide',
    title: 'Tax Configuration',
    subtitle: 'Complete Guide',
    badge: 'WooCommerce',
    icon: 'calculator'
  },
  {
    slug: 'wordpress-block-theme-development-guide',
    title: 'Block Theme',
    subtitle: 'Development Guide',
    badge: 'WordPress',
    icon: 'blocks'
  },
  {
    slug: 'wordpress-migration-guide-local-to-production',
    title: 'Migration Guide',
    subtitle: 'Local to Production',
    badge: 'WordPress',
    icon: 'server'
  },
  {
    slug: 'wordpress-multisite-configuration-tips',
    title: 'Multisite',
    subtitle: 'Configuration Tips',
    badge: 'WordPress',
    icon: 'network'
  },
  {
    slug: 'wordpress-rest-api-authentication-methods',
    title: 'REST API',
    subtitle: 'Authentication Methods',
    badge: 'WordPress',
    icon: 'api'
  },
  {
    slug: 'wordpress-security-headers-configuration',
    title: 'Security Headers',
    subtitle: 'Configuration Guide',
    badge: 'WordPress',
    icon: 'shield'
  },
  {
    slug: 'wordpress-user-role-management-guide',
    title: 'User Roles',
    subtitle: 'Management Guide',
    badge: 'WordPress',
    icon: 'users'
  },
  {
    slug: 'how-to-set-up-wordpress-staging-environment',
    title: 'Staging Environment',
    subtitle: 'Setup Guide',
    badge: 'WordPress',
    icon: 'server'
  },
  {
    slug: 'woocommerce-coupon-system-complete-guide',
    title: 'Coupon System',
    subtitle: 'Complete Guide',
    badge: 'WooCommerce',
    icon: 'tag'
  },
  {
    slug: 'woocommerce-product-filter-setup-guide',
    title: 'Product Filter',
    subtitle: 'Setup Guide',
    badge: 'WooCommerce',
    icon: 'filter'
  }
];

function getIconSVG(icon) {
  const icons = {
    code: '<path d="M30 50 L50 30 L70 50 L50 70 Z" fill="url(#goldGrad)" filter="url(#glow)"/><circle cx="50" cy="50" r="8" fill="#000"/>',
    calendar: '<rect x="30" y="35" width="40" height="35" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><line x1="30" y1="45" x2="70" y2="45" stroke="url(#goldGrad)" stroke-width="2"/><circle cx="40" cy="55" r="3" fill="url(#goldGrad)"/><circle cx="50" cy="55" r="3" fill="url(#goldGrad)"/><circle cx="60" cy="55" r="3" fill="url(#goldGrad)"/>',
    payment: '<rect x="25" y="35" width="50" height="30" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><line x1="25" y1="45" x2="75" y2="45" stroke="url(#goldGrad)" stroke-width="3"/><rect x="30" y="52" width="20" height="8" rx="2" fill="url(#goldGrad)"/>',
    box: '<rect x="30" y="35" width="40" height="30" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><rect x="35" y="40" width="30" height="10" rx="2" fill="url(#goldGrad)" opacity="0.5"/><line x1="30" y1="50" x2="70" y2="50" stroke="url(#goldGrad)" stroke-width="2"/>',
    options: '<circle cx="50" cy="50" r="20" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><circle cx="50" cy="50" r="8" fill="url(#goldGrad)"/><line x1="50" y1="30" x2="50" y2="20" stroke="url(#goldGrad)" stroke-width="3"/><line x1="50" y1="70" x2="50" y2="80" stroke="url(#goldGrad)" stroke-width="3"/><line x1="30" y1="50" x2="20" y2="50" stroke="url(#goldGrad)" stroke-width="3"/><line x1="70" y1="50" x2="80" y2="50" stroke="url(#goldGrad)" stroke-width="3"/>',
    calculator: '<rect x="30" y="25" width="40" height="55" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><rect x="35" y="30" width="30" height="15" rx="2" fill="url(#goldGrad)" opacity="0.5"/><circle cx="40" cy="55" r="3" fill="url(#goldGrad)"/><circle cx="50" cy="55" r="3" fill="url(#goldGrad)"/><circle cx="60" cy="55" r="3" fill="url(#goldGrad)"/><circle cx="40" cy="65" r="3" fill="url(#goldGrad)"/><circle cx="50" cy="65" r="3" fill="url(#goldGrad)"/><circle cx="60" cy="65" r="3" fill="url(#goldGrad)"/>',
    blocks: '<rect x="25" y="30" width="20" height="20" rx="3" fill="url(#goldGrad)" opacity="0.7"/><rect x="55" y="30" width="20" height="20" rx="3" fill="url(#goldGrad)" opacity="0.5"/><rect x="25" y="60" width="20" height="20" rx="3" fill="url(#goldGrad)" opacity="0.5"/><rect x="55" y="60" width="20" height="20" rx="3" fill="url(#goldGrad)" opacity="0.3"/>',
    server: '<rect x="25" y="25" width="50" height="25" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><rect x="25" y="55" width="50" height="25" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><circle cx="35" cy="37" r="3" fill="url(#goldGrad)"/><circle cx="35" cy="67" r="3" fill="url(#goldGrad)"/><line x1="45" y1="37" x2="65" y2="37" stroke="url(#goldGrad)" stroke-width="2"/><line x1="45" y1="67" x2="65" y2="67" stroke="url(#goldGrad)" stroke-width="2"/>',
    network: '<circle cx="50" cy="50" r="12" fill="url(#goldGrad)"/><circle cx="30" cy="30" r="6" fill="url(#goldGrad)" opacity="0.7"/><circle cx="70" cy="30" r="6" fill="url(#goldGrad)" opacity="0.7"/><circle cx="30" cy="70" r="6" fill="url(#goldGrad)" opacity="0.7"/><circle cx="70" cy="70" r="6" fill="url(#goldGrad)" opacity="0.7"/><line x1="50" y1="50" x2="30" y2="30" stroke="url(#goldGrad)" stroke-width="2"/><line x1="50" y1="50" x2="70" y2="30" stroke="url(#goldGrad)" stroke-width="2"/><line x1="50" y1="50" x2="30" y2="70" stroke="url(#goldGrad)" stroke-width="2"/><line x1="50" y1="50" x2="70" y2="70" stroke="url(#goldGrad)" stroke-width="2"/>',
    api: '<circle cx="50" cy="50" r="25" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><path d="M50 25 L50 75" stroke="url(#goldGrad)" stroke-width="2"/><path d="M25 50 L75 50" stroke="url(#goldGrad)" stroke-width="2"/><circle cx="50" cy="50" r="8" fill="url(#goldGrad)"/>',
    shield: '<path d="M50 20 L75 35 L75 55 L50 80 L25 55 L25 35 Z" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><path d="M50 35 L60 45 L50 55 L40 45 Z" fill="url(#goldGrad)"/>',
    users: '<circle cx="50" cy="35" r="10" fill="url(#goldGrad)"/><circle cx="30" cy="40" r="7" fill="url(#goldGrad)" opacity="0.7"/><circle cx="70" cy="40" r="7" fill="url(#goldGrad)" opacity="0.7"/><path d="M35 65 Q50 55 65 65" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><path d="M15 70 Q30 60 45 70" fill="none" stroke="url(#goldGrad)" stroke-width="2" opacity="0.7"/><path d="M55 70 Q70 60 85 70" fill="none" stroke="url(#goldGrad)" stroke-width="2" opacity="0.7"/>',
    tag: '<path d="M50 20 L75 35 L55 60 L30 45 Z" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><circle cx="60" cy="30" r="5" fill="url(#goldGrad)"/>',
    filter: '<rect x="30" y="25" width="40" height="50" rx="4" fill="none" stroke="url(#goldGrad)" stroke-width="3"/><line x1="30" y1="40" x2="70" y2="40" stroke="url(#goldGrad)" stroke-width="2"/><line x1="30" y1="55" x2="70" y2="55" stroke="url(#goldGrad)" stroke-width="2"/><circle cx="50" cy="40" r="5" fill="url(#goldGrad)"/><circle cx="50" cy="55" r="5" fill="url(#goldGrad)"/>'
  };
  return icons[icon] || icons.code;
}

function generateSVG(post) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#c9a84c;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#e8d48b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c9a84c;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="darkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#darkGrad)"/>
  
  <!-- Decorative circles -->
  <circle cx="100" cy="500" r="200" fill="rgba(201,168,76,0.05)"/>
  <circle cx="1100" cy="150" r="150" fill="rgba(201,168,76,0.03)"/>
  
  <!-- Grid pattern -->
  <g stroke="rgba(201,168,76,0.08)" stroke-width="1" fill="none">
    <line x1="0" y1="100" x2="1200" y2="100"/>
    <line x1="0" y1="200" x2="1200" y2="200"/>
    <line x1="0" y1="300" x2="1200" y2="300"/>
    <line x1="0" y1="400" x2="1200" y2="400"/>
    <line x1="0" y1="500" x2="1200" y2="500"/>
    <line x1="200" y1="0" x2="200" y2="630"/>
    <line x1="400" y1="0" x2="400" y2="630"/>
    <line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="800" y1="0" x2="800" y2="630"/>
    <line x1="1000" y1="0" x2="1000" y2="630"/>
  </g>
  
  <!-- Icon illustration -->
  <g transform="translate(900, 200)">
    <circle cx="50" cy="50" r="60" fill="none" stroke="url(#goldGrad)" stroke-width="3"/>
    ${getIconSVG(post.icon)}
  </g>
  
  <!-- Title -->
  <text x="80" y="180" font-family="Inter, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#f0f0f0">${post.title.split(' ')[0]}</text>
  <text x="80" y="240" font-family="Inter, -apple-system, sans-serif" font-size="48" font-weight="800" fill="url(#goldGrad)">${post.title.split(' ').slice(1).join(' ') || post.title.split(' ')[0]}</text>
  <text x="80" y="300" font-family="Inter, -apple-system, sans-serif" font-size="36" font-weight="600" fill="#a0a0a0">${post.subtitle}</text>
  
  <!-- Gold accent line -->
  <rect x="80" y="330" width="120" height="4" rx="2" fill="url(#goldGrad)"/>
  
  <!-- Subtitle -->
  <text x="80" y="380" font-family="Inter, -apple-system, sans-serif" font-size="18" fill="#666666">Complete Developer Guide</text>
  
  <!-- Author -->
  <text x="80" y="440" font-family="JetBrains Mono, monospace" font-size="14" fill="url(#goldGrad)">Shiv Parmar</text>
  <text x="80" y="460" font-family="Inter, -apple-system, sans-serif" font-size="12" fill="#666666">WordPress Developer · Rajkot, India</text>
  
  <!-- Badge -->
  <rect x="80" y="500" width="140" height="32" rx="16" fill="rgba(201,168,76,0.15)" stroke="url(#goldGrad)" stroke-width="1"/>
  <text x="150" y="520" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="600" fill="url(#goldGrad)" text-anchor="middle">${post.badge}</text>
  
  <!-- Code snippets decoration -->
  <g transform="translate(80, 520)" opacity="0.4">
    <text font-family="JetBrains Mono, monospace" font-size="10" fill="#c9a84c">&lt;?php</text>
  </g>
</svg>`;
}

function generateAllImages() {
  console.log('Generating SVG images for all blog posts...\n');
  
  for (const post of blogPosts) {
    const svg = generateSVG(post);
    const filename = `${post.slug}-hero.svg`;
    const filepath = path.join(IMAGES_DIR, filename);
    
    fs.writeFileSync(filepath, svg);
    console.log(`Generated: ${filename}`);
  }
  
  console.log(`\nTotal: ${blogPosts.length} images generated`);
}

generateAllImages();
