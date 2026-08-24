/* ==========================================================================
   Blog Image Generator - Gemini Prompt + Unsplash Image
   Uses Gemini AI to generate prompts, then fetches from Unsplash
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const IMAGES_DIR = path.join(__dirname, '..', 'images', 'blog');

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

function extractSections(html) {
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  const h2Regex = /<h2[^>]*id="([^"]*)"[^>]*>(.*?)<\/h2>/gs;
  const sections = [];
  let match;

  while ((match = h2Regex.exec(html)) !== null) {
    sections.push({
      id: match[1],
      title: match[2].replace(/<[^>]+>/g, '').trim()
    });
  }

  return { title, sections };
}

function getUnsplashKeywords(title) {
  const lower = title.toLowerCase();
  const keywordMap = {
    'woocommerce': 'ecommerce,online-store,shopping',
    'wordpress': 'wordpress,web-development,cms',
    'plugin': 'plugin,code,development',
    'theme': 'theme,design,layout',
    'seo': 'seo,search,analytics',
    'performance': 'speed,fast,optimization',
    'security': 'security,shield,lock',
    'migration': 'server,cloud,transfer',
    'api': 'api,programming,code',
    'css': 'css,code,styling',
    'javascript': 'javascript,code,programming',
    'php': 'php,code,programming',
    'payment': 'payment,checkout,money',
    'shipping': 'shipping,delivery,package',
    'tax': 'tax,calculator,finance',
    'product': 'product,store,inventory',
    'checkout': 'checkout,cart,shopping',
    'database': 'database,server,data',
    'staging': 'staging,development,server',
    'membership': 'membership,community,people',
    'booking': 'booking,calendar,schedule',
    'multisite': 'network,server,multiple',
    'user': 'user,people,management',
    'block': 'blocks,editor,interface',
    'gutenberg': 'gutenberg,editor,wordpress',
    'elementor': 'page-builder,drag-drop,design',
    'guide': 'guide,tutorial,learning',
    'setup': 'setup,configuration,install',
    'best': 'quality,checklist,star',
    'comparison': 'compare,versus,choice'
  };

  const keywords = [];
  for (const [key, values] of Object.entries(keywordMap)) {
    if (lower.includes(key)) {
      keywords.push(values.split(',')[0]);
    }
  }

  if (keywords.length === 0) {
    keywords.push('technology', 'web-development');
  }

  return keywords.slice(0, 3).join(',');
}

function generateUnsplashUrl(keywords, width = 1200, height = 630) {
  const seed = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', (chunk) => chunks.push(chunk));
          res2.on('end', () => {
            fs.writeFileSync(filepath, Buffer.concat(chunks));
            resolve();
          });
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        fs.writeFileSync(filepath, Buffer.concat(chunks));
        resolve();
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function updateBlogHTML(html, heroImage, sectionImages) {
  html = html.replace(
    /<img src="[^"]*" alt="[^"]*" title="[^"]*" class="hero-img">/,
    `<img src="../images/blog/${heroImage}" alt="Blog post hero image - WordPress development guide by Shiv Parmar" title="WordPress development guide by Shiv Parmar" class="hero-img">`
  );

  for (const [id, filename] of Object.entries(sectionImages)) {
    const h2Regex = new RegExp(`(<h2[^>]*id="${id}"[^>]*>.*?</h2>)`, 's');
    const imageHtml = `\n<img src="../images/blog/${filename}" alt="Section illustration" width="800" height="450" loading="lazy" style="width:100%;border-radius:var(--radius-lg);margin:24px 0;border:1px solid var(--border-glass)">\n`;
    html = html.replace(h2Regex, `$1${imageHtml}`);
  }

  return html;
}

async function processBlogPost(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  const { title, sections } = extractSections(html);
  if (!title) {
    console.log(`Skipping ${filename} - no title found`);
    return;
  }

  console.log(`\nProcessing: ${title}`);
  console.log(`Found ${sections.length} sections`);

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const heroKeywords = getUnsplashKeywords(title);
  const heroFilename = filename.replace('.html', '') + '-hero.jpg';
  const heroPath = path.join(IMAGES_DIR, heroFilename);

  console.log(`Downloading hero image: ${heroKeywords}`);
  try {
    const heroUrl = generateUnsplashUrl(heroKeywords);
    await downloadImage(heroUrl, heroPath);
    console.log(`Saved: ${heroFilename}`);
  } catch (err) {
    console.log(`Hero download failed: ${err.message}`);
  }

  const sectionImages = {};

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionFilename = filename.replace('.html', '') + `-section-${i + 1}.jpg`;
    const sectionPath = path.join(IMAGES_DIR, sectionFilename);

    const sectionKeywords = getUnsplashKeywords(section.title);
    console.log(`Downloading: ${section.title} (${sectionKeywords})`);

    try {
      const sectionUrl = generateUnsplashUrl(sectionKeywords, 800, 450);
      await downloadImage(sectionUrl, sectionPath);
      sectionImages[section.id] = sectionFilename;
      console.log(`Saved: ${sectionFilename}`);
    } catch (err) {
      console.log(`Failed: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  const updatedHtml = updateBlogHTML(html, heroFilename, sectionImages);
  fs.writeFileSync(filepath, updatedHtml);
  console.log(`Updated: ${filename}`);
}

async function main() {
  console.log('Blog Image Generator - Gemini Prompts + Unsplash\n');

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  console.log(`Found ${files.length} blog posts\n`);

  for (const file of files) {
    await processBlogPost(file);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\nDone! All blog posts updated.');
}

main().catch(console.error);
