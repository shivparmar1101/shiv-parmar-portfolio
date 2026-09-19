const fs = require('fs');

// Update blog-queue.json
const queue = JSON.parse(fs.readFileSync('blog-queue.json', 'utf-8'));
queue.blogs[0].status = 'published';
queue.blogs[0].published_at = '2026-09-19T03:00:00.000Z';
queue.blogs[1].status = 'published';
queue.blogs[1].published_at = '2026-09-19T15:00:00.000Z';
fs.writeFileSync('blog-queue.json', JSON.stringify(queue, null, 2));
console.log('Queue updated!');

// Update blog.html - add new cards
let blogHtml = fs.readFileSync('blog.html', 'utf-8');

const card1 = `<article class="blog-card reveal">
            <div class="date">2026-09-19 &middot; 10 min read</div>
            <h3><a href="blog/wordpress-7-0-ai-client-complete-setup-guide-2026.html">WordPress 7.0 AI Client: Complete Setup Guide 2026</a></h3>
            <p>WordPress 7.0, AI Client - comprehensive guide by Shiv Parmar.</p>
            <a class="read-more" href="blog/wordpress-7-0-ai-client-complete-setup-guide-2026.html">Read more &rarr;</a>
          </article>`;

const card2 = `<article class="blog-card reveal">
            <div class="date">2026-09-19 &middot; 10 min read</div>
            <h3><a href="blog/woocommerce-11-1-new-features-setup-guide-2026.html">WooCommerce 11.1: New Features & Setup Guide 2026</a></h3>
            <p>WooCommerce 11.1, WooCommerce update - comprehensive guide by Shiv Parmar.</p>
            <a class="read-more" href="blog/woocommerce-11-1-new-features-setup-guide-2026.html">Read more &rarr;</a>
          </article>`;

blogHtml = blogHtml.replace('<!-- BLOG_CARDS_START -->', '<!-- BLOG_CARDS_START -->\n' + card1 + '\n' + card2);
blogHtml = blogHtml.replace(/"numberOfItems": \d+/, '"numberOfItems": 34');

fs.writeFileSync('blog.html', blogHtml);
console.log('blog.html updated!');
