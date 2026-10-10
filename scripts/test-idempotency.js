const fs = require('fs');
const path = require('path');
const { updateBlogHTML, updateIndexHTML, updateSitemap } = require('./auto-blog-generator.js');
const queue = require('../blog-queue.json');

const ROOT = path.join(__dirname, '..');
const paths = {
  blog: path.join(ROOT, 'blog.html'),
  index: path.join(ROOT, 'index.html'),
  sitemap: path.join(ROOT, 'sitemap.xml')
};

// use an already-listed blog so the "already present" branch is exercised
const blog = queue.blogs.find(b => b.status === 'published');

const before = {};
for (const k of Object.keys(paths)) before[k] = fs.readFileSync(paths[k], 'utf8');

function countCards(html) { return (html.match(/class="blog-card/g) || []).length; }
function countSlug(html, slug) { return (html.split('blog/' + slug + '.html').length - 1); }

console.log(`Testing with slug: ${blog.slug}`);
console.log(`blog.html cards BEFORE: ${countCards(before.blog)}`);
console.log(`index.html cards BEFORE: ${countCards(before.index)}`);
console.log(`sitemap locs BEFORE: ${(before.sitemap.match(/<loc>/g) || []).length}`);

let fail = 1;
try {
  // run twice, as a retry would
  for (const i of [1, 2]) {
    updateBlogHTML(blog);
    updateIndexHTML(blog);
    updateSitemap(blog);
  }

  const after = {};
  for (const k of Object.keys(paths)) after[k] = fs.readFileSync(paths[k], 'utf8');

  const checks = {
    'blog.html: no duplicate card': countSlug(after.blog, blog.slug) === countSlug(before.blog, blog.slug),
    'blog.html: card count unchanged': countCards(after.blog) === countCards(before.blog),
    'index.html: no duplicate card': countSlug(after.index, blog.slug) === countSlug(before.index, blog.slug),
    'index.html: card count unchanged': countCards(after.index) === countCards(before.index),
    'sitemap: loc count unchanged': (after.sitemap.match(/<loc>/g) || []).length === (before.sitemap.match(/<loc>/g) || []).length,
    'sitemap: no duplicate url': after.sitemap.split(blog.slug).length === before.sitemap.split(blog.slug).length
  };

  fail = 0;
  for (const [k, v] of Object.entries(checks)) { if (!v) fail++; console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`); }
  console.log(`\n${Object.keys(checks).length - fail}/${Object.keys(checks).length} passed`);
} finally {
  for (const k of Object.keys(paths)) fs.writeFileSync(paths[k], before[k], 'utf8');
  console.log('(originals restored)');
}
process.exit(fail ? 1 : 0);
