/* ==========================================================================
   Canva Blog Image Inserter
   Inserts images from images/blog/ folder into blog posts
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');
const IMAGES_DIR = path.join(__dirname, '..', 'images', 'blog');

function extractSections(html) {
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gs;
  const sections = [];
  let match;

  while ((match = h2Regex.exec(html)) !== null) {
    sections.push({
      title: match[1].replace(/<[^>]+>/g, '').trim()
    });
  }

  return { title, sections };
}

function getImageFilename(blogTitle, type) {
  const slug = blogTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (type === 'hero') {
    return `${slug}-hero.jpg`;
  }

  return `${slug}-section.jpg`;
}

function findMatchingImage(blogTitle, type) {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  const slug = blogTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  for (const file of files) {
    const fileLower = file.toLowerCase();
    if (type === 'hero' && fileLower.includes(slug) && fileLower.includes('hero')) {
      return file;
    }
    if (type === 'section' && fileLower.includes(slug) && fileLower.includes('section')) {
      return file;
    }
  }

  for (const file of files) {
    const fileLower = file.toLowerCase();
    if (fileLower.includes(slug.substring(0, 20))) {
      return file;
    }
  }

  return null;
}

function updateBlogHTML(html, heroImage, sectionImages) {
  if (heroImage) {
    html = html.replace(
      /<img src="[^"]*" alt="[^"]*" title="[^"]*" class="hero-img">/,
      `<img src="../images/blog/${heroImage}" alt="Blog post hero image - WordPress development guide by Shiv Parmar" title="WordPress development guide by Shiv Parmar" class="hero-img">`
    );
  }

  const h2Regex = /(<h2[^>]*>.*?<\/h2>)/gs;
  let sectionIndex = 0;

  html = html.replace(h2Regex, (match) => {
    if (sectionIndex < sectionImages.length) {
      const img = sectionImages[sectionIndex];
      sectionIndex++;
      return `${match}\n<img src="../images/blog/${img}" alt="Section illustration" width="800" height="450" loading="lazy" style="width:100%;border-radius:var(--radius-lg);margin:24px 0;border:1px solid var(--border-glass)">`;
    }
    return match;
  });

  return html;
}

function processBlogPost(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  const { title, sections } = extractSections(html);
  if (!title) {
    console.log(`Skipping ${filename} - no title found`);
    return;
  }

  console.log(`\nProcessing: ${title}`);

  const heroImage = findMatchingImage(title, 'hero');
  if (heroImage) {
    console.log(`  Hero: ${heroImage}`);
  } else {
    console.log(`  Hero: NOT FOUND`);
  }

  const sectionImages = [];
  for (let i = 0; i < sections.length; i++) {
    const sectionImage = findMatchingImage(sections[i].title, 'section');
    if (sectionImage) {
      sectionImages.push(sectionImage);
      console.log(`  Section ${i + 1}: ${sectionImage}`);
    } else {
      console.log(`  Section ${i + 1}: NOT FOUND`);
    }
  }

  const updatedHtml = updateBlogHTML(html, heroImage, sectionImages);
  fs.writeFileSync(filepath, updatedHtml);
  console.log(`Updated: ${filename}`);
}

function main() {
  console.log('Canva Blog Image Inserter\n');
  console.log('Instructions:');
  console.log('1. Design images in Canva (1200x630 for hero, 800x450 for sections)');
  console.log('2. Save as: [blog-slug]-hero.jpg and [blog-slug]-section-1.jpg, section-2.jpg, etc.');
  console.log('3. Place in: images/blog/');
  console.log('4. Run this script\n');

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  console.log(`Found ${files.length} blog posts\n`);

  for (const file of files) {
    processBlogPost(file);
  }

  console.log('\nDone!');
}

main();
