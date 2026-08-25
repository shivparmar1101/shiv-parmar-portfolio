const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

// Build keyword map from all blogs
function buildKeywordMap() {
  const blogs = [];
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));

  files.forEach(file => {
    const slug = file.replace('.html', '');
    const html = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) return;

    const title = titleMatch[1].replace(' | Shiv Parmar', '').trim();
    const keywords = [];
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
    if (titleLower.includes('membership')) keywords.push('membership', 'membership site');
    if (titleLower.includes('speed')) keywords.push('speed', 'performance', 'fast loading');
    if (titleLower.includes('widget')) keywords.push('widget', 'widget area', 'sidebar');
    if (titleLower.includes('seo technical')) keywords.push('SEO checklist', 'technical SEO');

    if (keywords.length > 0) {
      blogs.push({ slug, keywords });
    }
  });

  return blogs;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addInternalLinks(content, currentSlug, blogs) {
  let linkedContent = content;
  const processedSlugs = new Set();

  blogs.forEach(({ slug, keywords }) => {
    if (slug === currentSlug || processedSlugs.has(slug)) return;

    keywords.sort((a, b) => b.length - a.length);

    keywords.forEach(keyword => {
      if (keyword.length < 4) return;
      if (processedSlugs.has(slug)) return;

      const regex = new RegExp(`(?<![<a-zA-Z/])\\b${escapeRegex(keyword)}\\b(?![a-zA-Z>])`, 'gi');
      const matches = linkedContent.match(regex);

      if (matches && matches.length > 0) {
        const firstMatch = matches[0];
        const link = `<a href="/blog/${slug}.html">${firstMatch}</a>`;
        linkedContent = linkedContent.replace(firstMatch, link);
        processedSlugs.add(slug);
      }
    });
  });

  return linkedContent;
}

// Main
const blogs = buildKeywordMap();
console.log(`Found ${blogs.length} blogs with keywords`);

let updated = 0;
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const slug = file.replace('.html', '');
  const filepath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filepath, 'utf-8');

  // Find article body
  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  if (!articleMatch) return;

  const articleBody = articleMatch[1];
  const linkedBody = addInternalLinks(articleBody, slug, blogs);

  if (linkedBody !== articleBody) {
    content = content.replace(articleBody, linkedBody);
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Updated: ${file}`);
    updated++;
  }
});

console.log(`\nDone! Updated ${updated} blogs with internal links`);
