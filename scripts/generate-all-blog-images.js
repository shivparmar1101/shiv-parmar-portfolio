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
  },
  {
    slug: 'wordpress-caching-plugins-compared-2026',
    title: 'WordPress Caching Plugins',
    subtitle: 'Compared 2026',
    badge: 'Performance',
    icon: 'speed'
  },
  {
    slug: 'how-to-create-wordpress-mega-menu',
    title: 'WordPress Mega Menu',
    subtitle: 'Complete Guide',
    badge: 'WordPress',
    icon: 'menu'
  },
  {
    slug: 'woocommerce-shipping-zones-setup-guide',
    title: 'WooCommerce Shipping',
    subtitle: 'Zones Setup Guide',
    badge: 'WooCommerce',
    icon: 'shipping'
  }
];

function getDecorativeElements(slug) {
  const elements = {
    'how-to-add-custom-css-to-wordpress-without-plugin': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <polygon points="30,0 10,35 25,35 15,65 50,25 32,25 45,0" fill="#c9a84c"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
        <rect x="0" y="165" width="200" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>
      <g transform="translate(100, 300)" opacity="0.7">
        <rect x="0" y="0" width="120" height="80" rx="6" fill="none" stroke="#c9a84c" stroke-width="1.5"/>
        <text x="60" y="50" font-family="Arial, sans-serif" font-size="14" fill="#c9a84c" text-anchor="middle" opacity="0.6">CSS</text>
      </g>`,
    'how-to-create-a-wordpress-booking-system': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <rect x="10" y="10" width="60" height="50" rx="6" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <line x1="10" y1="25" x2="70" y2="25" stroke="#c9a84c" stroke-width="2"/>
        <circle cx="25" cy="40" r="4" fill="#c9a84c"/>
        <circle cx="45" cy="40" r="4" fill="#c9a84c"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>
      <g transform="translate(950, 160)" opacity="0.7">
        <path d="M0,80 A80,80 0 1,1 -80,80" fill="none" stroke="#c9a84c" stroke-width="3"/>
        <line x1="0" y1="80" x2="40" y2="20" stroke="#c9a84c" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="0" cy="80" r="5" fill="#c9a84c"/>
      </g>`,
    'woocommerce-payment-gateway-comparison-2026': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <rect x="10" y="15" width="60" height="40" rx="4" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <line x1="10" y1="30" x2="70" y2="30" stroke="#c9a84c" stroke-width="2"/>
      </g>
      <g opacity="0.4">
        <rect x="500" y="320" width="250" height="20" rx="4" fill="#c9a84c" opacity="0.3"/>
        <rect x="500" y="355" width="200" height="20" rx="4" fill="#c9a84c" opacity="0.25"/>
        <rect x="500" y="390" width="180" height="20" rx="4" fill="#c9a84c" opacity="0.2"/>
      </g>
      <g font-family="Arial, sans-serif" font-size="11" fill="#c9a84c" opacity="0.7">
        <text x="760" y="335">Stripe</text>
        <text x="710" y="370">PayPal</text>
        <text x="690" y="405">Razorpay</text>
      </g>`,
    'woocommerce-product-bundles-setup': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <rect x="10" y="10" width="25" height="25" rx="3" fill="#c9a84c"/>
        <rect x="45" y="10" width="25" height="25" rx="3" fill="#c9a84c"/>
        <rect x="10" y="45" width="25" height="25" rx="3" fill="#c9a84c"/>
        <rect x="45" y="45" width="25" height="25" rx="3" fill="#c9a84c"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="400" width="320" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="425" width="250" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'woocommerce-product-variation-best-practices': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <circle cx="40" cy="40" r="25" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <circle cx="40" cy="40" r="8" fill="#c9a84c"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'woocommerce-tax-configuration-guide': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <rect x="15" y="10" width="50" height="60" rx="4" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <text x="40" y="45" font-family="Arial, sans-serif" font-size="16" fill="#c9a84c" text-anchor="middle">%</text>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'wordpress-block-theme-development-guide': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <rect x="10" y="10" width="25" height="25" rx="3" fill="#c9a84c" opacity="0.7"/>
        <rect x="45" y="10" width="25" height="25" rx="3" fill="#c9a84c" opacity="0.5"/>
        <rect x="10" y="45" width="25" height="25" rx="3" fill="#c9a84c" opacity="0.5"/>
        <rect x="45" y="45" width="25" height="25" rx="3" fill="#c9a84c" opacity="0.3"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'wordpress-migration-guide-local-to-production': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <rect x="10" y="20" width="30" height="40" rx="4" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <rect x="50" y="20" width="30" height="40" rx="4" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <path d="M40,40 L50,40" stroke="#c9a84c" stroke-width="2"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'wordpress-multisite-configuration-tips': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <circle cx="40" cy="40" r="12" fill="#c9a84c"/>
        <circle cx="20" cy="25" r="6" fill="#c9a84c" opacity="0.7"/>
        <circle cx="60" cy="25" r="6" fill="#c9a84c" opacity="0.7"/>
        <circle cx="20" cy="55" r="6" fill="#c9a84c" opacity="0.7"/>
        <circle cx="60" cy="55" r="6" fill="#c9a84c" opacity="0.7"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'wordpress-rest-api-authentication-methods': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <circle cx="40" cy="40" r="25" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <circle cx="40" cy="40" r="8" fill="#c9a84c"/>
        <line x1="40" y1="15" x2="40" y2="65" stroke="#c9a84c" stroke-width="1.5"/>
        <line x1="15" y1="40" x2="65" y2="40" stroke="#c9a84c" stroke-width="1.5"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'wordpress-security-headers-configuration': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <path d="M40,15 L65,28 L65,48 L40,68 L15,48 L15,28 Z" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <path d="M40,30 L50,38 L40,46 L30,38 Z" fill="#c9a84c"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'wordpress-user-role-management-guide': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <circle cx="40" cy="30" r="10" fill="#c9a84c"/>
        <circle cx="25" cy="35" r="7" fill="#c9a84c" opacity="0.7"/>
        <circle cx="55" cy="35" r="7" fill="#c9a84c" opacity="0.7"/>
        <path d="M30,55 Q40,48 50,55" fill="none" stroke="#c9a84c" stroke-width="2"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'how-to-set-up-wordpress-staging-environment': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <rect x="10" y="20" width="30" height="40" rx="4" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <rect x="50" y="20" width="30" height="40" rx="4" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <path d="M40,40 L50,40" stroke="#c9a84c" stroke-width="2"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'woocommerce-coupon-system-complete-guide': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <path d="M40,15 L65,30 L50,55 L25,40 Z" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <circle cx="55" cy="25" r="5" fill="#c9a84c"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`,
    'woocommerce-product-filter-setup-guide': `
      <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
        <rect x="15" y="10" width="50" height="60" rx="4" fill="none" stroke="#c9a84c" stroke-width="2"/>
        <line x1="15" y1="30" x2="65" y2="30" stroke="#c9a84c" stroke-width="1.5"/>
        <line x1="15" y1="50" x2="65" y2="50" stroke="#c9a84c" stroke-width="1.5"/>
        <circle cx="40" cy="30" r="5" fill="#c9a84c"/>
        <circle cx="40" cy="50" r="5" fill="#c9a84c"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
        <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
      </g>`
  };
  return elements[slug] || `
    <g transform="translate(180, 150)" opacity="0.7" filter="url(#glow)">
      <polygon points="30,0 10,35 25,35 15,65 50,25 32,25 45,0" fill="#c9a84c"/>
    </g>
    <g opacity="0.4">
      <rect x="0" y="120" width="350" height="3" rx="1.5" fill="url(#speedGrad)"/>
      <rect x="0" y="145" width="280" height="2" rx="1" fill="url(#speedGrad)"/>
    </g>`;
}

function generateSVG(post) {
  const decorative = getDecorativeElements(post.slug);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c9a84c"/>
      <stop offset="100%" stop-color="#e8d48b"/>
    </linearGradient>
    <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c9a84c" stop-opacity="0"/>
      <stop offset="100%" stop-color="#c9a84c" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f2a"/>
      <stop offset="50%" stop-color="#0d1225"/>
      <stop offset="100%" stop-color="#111830"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  ${decorative}

  <!-- 26 text -->
  <g transform="translate(1050, 450)" opacity="0.7">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="80" fill="#c9a84c" font-weight="bold">26</text>
  </g>

  <!-- Pixel dots -->
  <g fill="#c9a84c" opacity="0.4">
    <rect x="700" y="100" width="4" height="4"/>
    <rect x="710" y="100" width="4" height="4"/>
    <rect x="720" y="100" width="4" height="4"/>
    <rect x="700" y="110" width="4" height="4"/>
    <rect x="720" y="110" width="4" height="4"/>
    <rect x="700" y="120" width="4" height="4"/>
    <rect x="710" y="120" width="4" height="4"/>
    <rect x="720" y="120" width="4" height="4"/>
  </g>

  <!-- Corner brackets -->
  <g opacity="0.7" fill="none" stroke="#c9a84c" stroke-width="2">
    <path d="M40,40 L40,80 M40,40 L80,40"/>
    <path d="M1160,40 L1160,80 M1160,40 L1120,40"/>
    <path d="M40,590 L40,550 M40,590 L80,590"/>
    <path d="M1160,590 L1160,550 M1160,590 L1120,590"/>
  </g>

  <!-- Title -->
  <text x="600" y="530" font-family="Arial, Helvetica, sans-serif" font-size="46" fill="#D9BF6E" text-anchor="middle" font-weight="bold">${post.title}</text>
  
  <!-- Underline -->
  <rect x="350" y="555" width="500" height="3" rx="1.5" fill="url(#goldGrad)" opacity="0.7"/>
  
  <!-- Year badge -->
  <g transform="translate(600, 590)" opacity="0.7">
    <rect x="-35" y="-12" width="70" height="24" rx="12" fill="none" stroke="#c9a84c" stroke-width="1.5"/>
    <text x="0" y="5" font-family="Arial, sans-serif" font-size="14" fill="#c9a84c" text-anchor="middle">2026</text>
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
