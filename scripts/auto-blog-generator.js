/**
 * Auto Blog Generator v2
 * Features: SVG hero, 2 CTAs, related posts, contact form, IndexNow indexing
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load .env if exists
(function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.substring(0, eq).trim();
    let val = t.substring(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
})();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const SITE_URL = 'https://shiv-parmar-portfolio.netlify.app';
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const QUEUE_FILE = path.join(__dirname, '..', 'blog-queue.json');
const IMAGES_DIR = path.join(__dirname, '..', 'images', 'blog');
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    });
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.candidates && response.candidates[0]) {
            resolve(response.candidates[0].content.parts[0].text);
          } else {
            reject(new Error(data.substring(0, 500)));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function generateBlogContent(blog) {
  const prompt = `Write a comprehensive, SEO-optimized blog post about "${blog.title}".

Requirements:
1. Write 2000-2500 words
2. Use proper HTML with h2 and h3 headings only (no html/head/body tags)
3. Include practical code examples where relevant (use <pre><code> tags)
4. Professional, helpful tone
5. Hook the reader with a strong introduction
6. Include tables where useful (<table> with inline styles)
7. Actionable and informative

Structure:
- Introduction (2-3 paragraphs)
- What is [Topic]? (h2)
- Why [Topic] Matters in 2026 (h2)
- Step-by-Step Guide (h2) with multiple h3 subsections
- Best Practices (h2)
- Common Mistakes to Avoid (h2)
- DO NOT include a Conclusion section (it will be added automatically)

Primary keywords: ${blog.keywords.join(', ')}.

Return ONLY the HTML content (article body, no head/body tags).`;

  console.log(`Generating content with ${GEMINI_MODEL}...`);
  const content = await callGeminiAPI(prompt);
  return content.replace(/```html\n?|```/g, '').trim();
}

async function generateMetaDescription(title, keywords) {
  const prompt = `Write a compelling meta description (120-160 characters) for a blog post titled "${title}". Include the primary keyword naturally: ${keywords[0]}. Return ONLY the meta description text, nothing else.`;
  try {
    const desc = await callGeminiAPI(prompt);
    return desc.trim().replace(/^["']|["']$/g, '').substring(0, 160);
  } catch (error) {
    return `Learn about ${title} with this comprehensive guide by Shiv Parmar. Step-by-step instructions and expert tips.`;
  }
}

async function generateConclusion(title, keywords) {
  const prompt = `Write a Conclusion section (2-3 paragraphs) for a blog post titled "${title}". Include a call-to-action mentioning that Shiv Parmar is available for WordPress development work worldwide. Use keywords naturally: ${keywords.join(', ')}. Return ONLY the conclusion HTML starting with <h2>Conclusion</h2>.`;
  try {
    const conclusion = await callGeminiAPI(prompt);
    return conclusion.replace(/```html\n?|```/g, '').trim();
  } catch (error) {
    return `<h2>Conclusion</h2>
<p>This guide covered everything you need to know about ${escapeHtml(title)}. By following these steps, you can implement these solutions on your WordPress site today.</p>
<p>If you need help with WordPress development, WooCommerce, or performance optimization, feel free to reach out. I work with clients worldwide and deliver high-quality results.</p>`;
  }
}

function insertMidCTA(content, blog) {
  const midCTA = `
<div style="background:var(--bg-glass);backdrop-filter:blur(var(--blur-lg));-webkit-backdrop-filter:blur(var(--blur-lg));border:1px solid var(--border-glass);padding:48px 32px;border-radius:var(--radius-xl);text-align:center;position:relative;overflow:hidden;margin:40px 0">
<div style="position:absolute;top:0;left:0;right:0;height:1px;background:var(--gradient-accent);opacity:0.5"></div>
<p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;justify-content:center;gap:12px"><span style="width:24px;height:1px;background:var(--accent)"></span>Expert Help Available<span style="width:24px;height:1px;background:var(--accent)"></span></p>
<h3 style="margin:0 0 12px;font-size:clamp(20px,3vw,28px);font-weight:800;color:var(--text-primary);letter-spacing:-0.02em">Need Help Implementing This on Your WordPress Site?</h3>
<p style="margin:0 auto 24px;max-width:480px;font-size:15px;color:var(--text-secondary);line-height:1.7">I help businesses implement ${escapeHtml(blog.keywords[0] || 'WordPress solutions')} with clean code and best practices. Available worldwide.</p>
<a href="mailto:parmarshiv1101@gmail.com?subject=WordPress%20Help%20Request" style="display:inline-flex;align-items:center;gap:8px;background:var(--gradient-accent);color:#000;padding:14px 32px;border-radius:var(--radius-md);font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 20px rgba(201,168,76,0.3);transition:all 0.3s" title="Email Shiv Parmar for WordPress help">Schedule a Meeting <span>&rarr;</span></a>
</div>`;

  // Insert after first major section (after 2nd h2 or ~35% of content)
  const h2Matches = [...content.matchAll(/<h2[^>]*>/gi)];
  if (h2Matches.length >= 3) {
    const insertAfter = h2Matches[2].index;
    const beforeClose = content.lastIndexOf('</p>', insertAfter);
    const pos = beforeClose !== -1 ? beforeClose + 4 : insertAfter;
    return content.substring(0, pos) + '\n' + midCTA + '\n' + content.substring(pos);
  }
  return content;
}

function wrapTitle(title, maxChars = 36) {
  const words = title.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 4);
}

function createHeroSVG(blog) {
  const lines = wrapTitle(blog.title);
  const startY = 315 - (lines.length - 1) * 28;
  const titleSvg = lines.map((line, i) =>
    `<text x="600" y="${startY + i * 56}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="48" font-weight="800" fill="#f0f0f0">${escapeHtml(line)}</text>`
  ).join('\n  ');
  const keyword = escapeHtml(blog.keywords[0] || 'WordPress');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f2a"/><stop offset="50%" stop-color="#0d1225"/><stop offset="100%" stop-color="#111830"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c9a84c" stop-opacity="0"/><stop offset="50%" stop-color="#c9a84c" stop-opacity="1"/><stop offset="100%" stop-color="#e8d48b" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <circle cx="150" cy="120" r="180" fill="#c9a84c" opacity="0.05"/>
  <circle cx="1050" cy="520" r="220" fill="#c9a84c" opacity="0.04"/>
  <rect x="400" y="140" width="400" height="2" fill="url(#goldGrad)" opacity="0.6"/>
  ${titleSvg}
  <rect x="450" y="${startY + lines.length * 56 - 10}" width="300" height="2" fill="url(#goldGrad)" opacity="0.4"/>
  <text x="600" y="${startY + lines.length * 56 + 40}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="22" font-weight="500" fill="#c9a84c" filter="url(#glow)">${keyword}</text>
  <text x="600" y="560" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="18" fill="#666">shiv-parmar-portfolio.netlify.app</text>
  <text x="600" y="590" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="16" fill="#555">WordPress Developer Guide by Shiv Parmar</text>
</svg>`;
}

function countPublishedBlogs() {
  try { return fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html')).length; } catch { return 0; }
}

function getRelatedPosts(currentSlug) {
  try {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== `${currentSlug}.html`);
    const posts = files.map(f => {
      const slug = f.replace('.html', '');
      const html = fs.readFileSync(path.join(BLOG_DIR, f), 'utf-8');
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      let title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');
      title = title.split('|')[0].replace(/\s+/g, ' ').trim();
      const dateMatch = html.match(/<div class="date">([^<]*)<\/div>/i);
      let date = dateMatch ? dateMatch[1] : '';
      date = date.split(/&middot;|·/)[0].replace(/\s+/g, ' ').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = '2026-10-01';
      return { slug, title: escapeHtml(title), date };
    });
    posts.sort((a, b) => b.date.localeCompare(a.date));
    return posts.slice(0, 6);
  } catch { return []; }
}

function buildRelatedHTML(posts) {
  return posts.slice(0, 3).map(p => `<div class="related-card">
<div class="date">${p.date} &middot; 8 min read</div>
<h4><a href="../blog/${p.slug}" title="${p.title}">${p.title}</a></h4>
</div>`).join('\n');
}

function buildTOC(html) {
  let idx = 0;
  const items = [];
  const out = html.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (m, inner) => {
    const id = `section-${idx++}`;
    const text = inner.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    items.push(`<li><a href="#${id}" title="${escapeHtml(text)}">${escapeHtml(text)}</a></li>`);
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { content: out, tocHTML: items.join('\n') };
}

function createBlogHTML(blog, content, metaDesc, conclusion) {
  const today = new Date().toISOString().split('T')[0];
  const readTime = Math.max(5, Math.ceil(content.replace(/<[^>]*>/g, ' ').split(/\s+/).length / 200));
  const safeTitle = escapeHtml(blog.title);
  const safeDesc = escapeHtml(metaDesc);
  const safeKeywords = escapeHtml(blog.keywords.join(', '));
  const fullContent = insertMidCTA(content, blog);

  const preConclusionCTA = `
<div style="background:var(--bg-glass);backdrop-filter:blur(var(--blur-lg));-webkit-backdrop-filter:blur(var(--blur-lg));border:1px solid var(--border-glass);padding:48px 32px;border-radius:var(--radius-xl);text-align:center;position:relative;overflow:hidden;margin:40px 0 32px">
<div style="position:absolute;top:0;left:0;right:0;height:1px;background:var(--gradient-accent);opacity:0.5"></div>
<p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;justify-content:center;gap:12px"><span style="width:24px;height:1px;background:var(--accent)"></span>Open to work<span style="width:24px;height:1px;background:var(--accent)"></span></p>
<h3 style="margin:0 0 12px;font-size:clamp(22px,3vw,32px);font-weight:800;color:var(--text-primary);letter-spacing:-0.02em">Hire a WordPress Developer Who Delivers Results</h3>
<p style="margin:0 auto 24px;max-width:480px;font-size:15px;color:var(--text-secondary);line-height:1.7">From custom themes to WooCommerce stores, I build WordPress sites that perform. Available worldwide.</p>
<a href="mailto:parmarshiv1101@gmail.com?subject=WordPress%20Project%20Inquiry" style="display:inline-flex;align-items:center;gap:8px;background:var(--gradient-accent);color:#000;padding:14px 32px;border-radius:var(--radius-md);font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 20px rgba(201,168,76,0.3);transition:all 0.3s" title="Email Shiv Parmar for WordPress projects">Get Free Quote <span>&rarr;</span></a>
</div>`;

  const relatedPosts = getRelatedPosts(blog.slug);
  const relatedHTML = buildRelatedHTML(relatedPosts);
  const bodyParts = buildTOC(`${fullContent}\n\n${preConclusionCTA}\n\n${conclusion}`);

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle} | Shiv Parmar</title>
<meta name="description" content="${safeDesc}">
<meta name="keywords" content="${safeKeywords}">
<meta name="author" content="Shiv Parmar">
<meta name="google-site-verification" content="3bq_-xDevPWEZSADvcEB-ykrDgizyDWLNgEPQA1pOrc" />
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE_URL}/blog/${blog.slug}">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDesc}">
<meta property="og:url" content="${SITE_URL}/blog/${blog.slug}">
<meta property="og:image" content="${SITE_URL}/images/blog/${blog.slug}-hero.svg">
<meta property="og:image:alt" content="${safeTitle} - WordPress development guide by Shiv Parmar">
<meta property="og:site_name" content="Shiv Parmar - WordPress Developer Portfolio">
<meta property="og:locale" content="en_US">
<meta property="article:author" content="https://www.linkedin.com/in/shiv-parmar/">
<meta property="article:published_time" content="${today}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDesc}">
<meta name="twitter:image" content="${SITE_URL}/images/blog/${blog.slug}-hero.svg">
<meta name="twitter:image:alt" content="${safeTitle} - WordPress development guide by Shiv Parmar">
<meta name="twitter:creator" content="@shivparmar1101">

<!-- Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": ${JSON.stringify(blog.title)},
  "description": ${JSON.stringify(metaDesc)},
  "author": { "@type": "Person", "name": "Shiv Parmar", "url": "https://www.linkedin.com/in/shiv-parmar/" },
  "publisher": { "@type": "Organization", "name": "Shiv Parmar - WordPress Developer", "url": "${SITE_URL}/" },
  "datePublished": "${today}",
  "dateModified": "${today}",
  "image": "${SITE_URL}/images/blog/${blog.slug}-hero.svg",
  "mainEntityOfPage": "${SITE_URL}/blog/${blog.slug}"
}
</script>

<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css">
<link rel="stylesheet" href="../liquid-glass.css">
<style>
article{padding:0}
.breadcrumb{font-size:13px;color:var(--text-muted);margin-bottom:16px;font-family:var(--font-mono)}
.breadcrumb a{color:var(--accent);text-decoration:none}
.breadcrumb a:hover{text-decoration:underline}
.breadcrumb span{margin:0 6px;opacity:0.5}
.date{font-family:var(--font-mono);font-size:13px;color:var(--text-muted);margin-bottom:12px}
h1{font-family:var(--font-primary);font-size:clamp(28px,4vw,40px);font-weight:800;line-height:1.2;margin-bottom:24px;color:var(--text-primary)}
.toc{background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);padding:24px;margin:0 0 32px}
.toc h3{font-size:16px;font-weight:700;margin:0 0 12px;color:var(--text-primary)}
.toc ul{list-style:none;padding:0;margin:0}
.toc li{margin-bottom:8px}
.toc a{font-size:14px;color:var(--text-secondary);text-decoration:none;font-family:var(--font-primary)}
.toc a:hover{color:var(--accent)}
.content{font-size:16px;color:var(--text-primary);font-family:var(--font-primary)}
.content h2{font-size:22px;font-weight:700;margin:40px 0 16px;color:var(--text-primary)}
.content h3{font-size:18px;font-weight:600;margin:32px 0 12px;color:var(--text-primary)}
.content p{margin-bottom:16px;color:var(--text-secondary)}
.content ul,.content ol{margin:0 0 16px 24px;color:var(--text-secondary)}
.content li{margin-bottom:8px}
.content code{font-family:var(--font-mono);background:var(--bg-glass-strong);padding:2px 8px;border-radius:6px;font-size:14px}
.content pre{background:#0d0d0d;color:#c7d2fe;padding:20px;border-radius:var(--radius-lg);overflow-x:auto;margin:0 0 24px;font-size:14px;line-height:1.6;border:1px solid var(--border-glass)}
.content pre code{background:none;padding:0;color:inherit}
.content blockquote{border-left:4px solid var(--accent);padding:10px 0 10px 15px;margin:20px 0;font-style:italic;color:var(--text-primary);background:var(--accent-glow-soft);border-radius:0px 15px 15px 0}
.content table{width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px}
.content th{background:var(--bg-glass);padding:10px 8px;text-align:left;color:var(--text-primary);border-bottom:2px solid var(--accent)}
.content td{padding:10px 8px;border-bottom:1px solid var(--border-glass);color:var(--text-secondary)}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:40px;padding:24px 0;border-top:1px solid var(--border-glass)}
.tag{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;background:var(--accent-glow-soft);color:var(--accent)}
.author-box{display:flex;gap:20px;align-items:flex-start;padding:24px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);margin-top:32px}
.author-box img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0}
.author-box .author-info h4{font-size:16px;font-weight:700;margin:0 0 4px;color:var(--text-primary)}
.author-box .author-info p{font-size:14px;color:var(--text-secondary);margin:0 0 8px}
.author-social{display:flex;gap:12px;flex-wrap:wrap}
.author-social a{font-size:13px;color:var(--accent);text-decoration:none;font-weight:500;display:inline-flex;align-items:center;gap:6px}
.author-social a:hover{text-decoration:underline}
.hero-img{width:100%;height:auto;aspect-ratio:1200/630;object-fit:cover;border-radius:var(--radius-lg);margin-top:20px;margin-bottom:32px;border:1px solid var(--border-glass)}
.related-blogs{margin-top:40px;padding-top:32px;border-top:1px solid var(--border-glass)}
.related-blogs h3{font-size:20px;font-weight:700;margin:0 0 20px;color:var(--text-primary)}
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.related-card{background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);padding:20px;transition:all 0.3s}
.related-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.related-card .date{font-size:12px;margin-bottom:8px}
.related-card h4{font-size:15px;font-weight:600;margin:0;line-height:1.4}
.related-card h4 a{color:var(--text-primary);text-decoration:none}
.related-card h4 a:hover{color:var(--accent)}
.cta-section{padding:80px 0}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.form-card{background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-xl);padding:32px}
.form-card h3{font-size:24px;font-weight:800;margin:0 0 24px;color:var(--text-primary)}
.form-row{margin-bottom:16px}
.form-row label{display:block;font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:6px}
.form-row input,.form-row select,.form-row textarea{width:100%;padding:12px 16px;background:var(--bg-glass-strong);border:1px solid var(--border-glass);border-radius:var(--radius-md);color:var(--text-primary);font-size:14px;font-family:var(--font-primary)}
.form-row input:focus,.form-row select:focus,.form-row textarea:focus{outline:none;border-color:var(--accent)}
.form-row textarea{resize:vertical;min-height:100px}
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--gradient-accent);color:#000;padding:14px 32px;border-radius:var(--radius-md);font-weight:600;font-size:14px;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(201,168,76,0.3);transition:all 0.3s}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(201,168,76,0.4)}
.form-note{font-size:12px;color:var(--text-muted);margin-top:12px;text-align:center}
.contact-info{display:flex;flex-direction:column;gap:16px}
.contact-card{display:flex;gap:16px;align-items:center;padding:20px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);transition:all 0.3s}
.contact-card:hover{border-color:var(--accent)}
.contact-icon{width:48px;height:48px;flex-shrink:0;color:var(--accent)}
.contact-svg{width:100%;height:100%}
.contact-card strong{display:block;font-size:14px;color:var(--text-primary);margin-bottom:4px}
.contact-card a,.contact-card span{font-size:13px;color:var(--text-secondary);text-decoration:none;word-break:break-all}
.contact-card a:hover{color:var(--accent)}
@media(max-width:640px){article{padding:0}h1{font-size:24px}.author-box{flex-direction:column;align-items:center;text-align:center}.contact-grid{grid-template-columns:1fr}.related-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="liquid-glass-bg" aria-hidden="true">
<div class="liquid-blob liquid-blob-1"></div><div class="liquid-blob liquid-blob-2"></div>
<div class="liquid-blob liquid-blob-3"></div><div class="liquid-blob liquid-blob-4"></div>
</div>
<div id="particle-hero" class="particle-canvas-fullpage"></div>
<div id="site-header">
<noscript>
<header><div class="container nav"><a class="logo" href="../">shiv<span class="dot">.</span>parmar</a><nav class="nav-links"><a href="../about">About</a><a href="../services">Services</a><a href="../work">Work</a><a href="../skills">Skills</a><a href="../experience">Experience</a><a href="../blog" class="active">Blog</a><a href="../contact">Contact</a></nav><div class="nav-right"><a class="nav-cta" href="../contact">Hire Me</a></div></div></header>
</noscript>
</div>
<article><div class="container">
<img src="../images/blog/${blog.slug}-hero.svg" alt="${safeTitle} - WordPress development guide by Shiv Parmar" class="hero-img">
<nav class="breadcrumb" aria-label="Breadcrumb">
<a href="../">Home</a><span>/</span><a href="../blog">Blog</a><span>/</span>${safeTitle}
</nav>
<div class="date">${today} &middot; ${readTime} min read</div>
<h1>${safeTitle}</h1>
<div class="toc" id="toc">
<h3>Table of Contents</h3>
<ul id="tocList">
${bodyParts.tocHTML}
</ul>
</div>
<div class="content">
${bodyParts.content}
</div>

<div class="tags">
${blog.keywords.map(k => `<a href="/blog" class="tag">${escapeHtml(k)}</a>`).join('\n')}
</div>

<div class="author-box">
<img src="../images/shiv-parmar-wordpress-developer.jpg" alt="Shiv Parmar - WordPress Developer" title="Shiv Parmar - WordPress Developer">
<div class="author-info">
<h4>Shiv Parmar</h4>
<p>WordPress Developer with global experience. Specializing in custom themes, WooCommerce, and high-performance WordPress sites.</p>
<div class="author-social">
<a href="https://linkedin.com/in/shiv-parmar" target="_blank" rel="noopener" title="Connect with Shiv Parmar on LinkedIn">
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
LinkedIn</a>
<a href="https://github.com/shivparmar1101" target="_blank" rel="noopener" title="View Shiv Parmar's GitHub Profile">
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
GitHub</a>
<a href="mailto:parmarshiv1101@gmail.com" title="Email Shiv Parmar">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
Email</a>
</div>
</div>
</div>

<div class="related-blogs">
<h3>Related Posts</h3>
<div class="related-grid" id="relatedBlogs">
${relatedHTML}
</div>
</div>
</div></article>

<section id="contact" class="cta-section" aria-labelledby="contact-heading">
<div class="container">
<div class="contact-grid">
<div class="form-card reveal">
<h3>Let's Work Together</h3>
<form id="contactForm" novalidate>
<div class="form-row"><label for="name">Full Name *</label><input type="text" id="name" name="name" placeholder="John Doe" required></div>
<div class="form-row"><label for="email">Email Address *</label><input type="email" id="email" name="email" placeholder="john@example.com" required></div>
<div class="form-row"><label for="phone">Phone Number</label><input type="tel" id="phone" name="phone" placeholder="+91 00000 00000"></div>
<div class="form-row"><label for="subject">Subject *</label><select id="subject" name="subject" required><option value="" disabled selected>Select an inquiry type</option><option value="General Inquiry">General Inquiry</option><option value="Project Request">Project Request</option><option value="Collaboration">Collaboration</option><option value="Freelance Work">Freelance Work</option><option value="Other">Other</option></select></div>
<div class="form-row"><label for="budget">Budget Range</label><select id="budget" name="budget"><option value="" disabled selected>Select your budget</option><option value="Under $500">Under $500</option><option value="$500 - $1,500">$500 - $1,500</option><option value="$1,500 - $5,000">$1,500 - $5,000</option><option value="$5,000 - $15,000">$5,000 - $15,000</option><option value="Above $15,000">Above $15,000</option></select></div>
<div class="form-row"><label for="message">Project Details *</label><textarea id="message" name="message" rows="5" placeholder="Tell me about your project, goals, and timeline..." required></textarea></div>
<button class="btn btn-primary" type="submit">Send Message <span class="arrow">&rarr;</span></button>
<p class="form-note" id="formStatus">Your message will be sent directly to my email &mdash; I'll respond within 24 hours.</p>
</form>
</div>
<div class="contact-info">
<div class="contact-card reveal">
<div class="contact-icon"><svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="10" width="36" height="26" rx="3"/><path d="M6 14l18 11 18-11"/></svg></div>
<div><strong>Email</strong><a href="mailto:parmarshiv1101@gmail.com" title="Send email to Shiv Parmar">parmarshiv1101@gmail.com</a></div>
</div>
<div class="contact-card reveal">
<div class="contact-icon"><svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="5"/><path d="M16 21v15"/><circle cx="16" cy="15" r="2.5" fill="currentColor" stroke="none"/><path d="M24 21v15"/><path d="M24 27c0-4 2-6 5-6s5 2 5 6v9"/></svg></div>
<div><strong>LinkedIn</strong><a href="https://www.linkedin.com/in/shiv-parmar/" target="_blank" rel="noopener noreferrer" title="Connect with Shiv Parmar on LinkedIn">linkedin.com/in/shiv-parmar</a></div>
</div>
<div class="contact-card reveal">
<div class="contact-icon"><svg class="contact-svg" viewBox="0 0 48 48" fill="currentColor" stroke="none" aria-hidden="true"><path d="M24 4C12.95 4 4 12.95 4 24c0 8.84 5.74 16.34 13.7 18.98 1 .18 1.37-.44 1.37-.98v-3.46c-5.57 1.22-6.74-2.68-6.74-2.68-.91-2.31-2.22-2.93-2.22-2.93-1.81-1.24.14-1.21.14-1.21 2 .14 3.06 2.06 3.06 2.06 1.78 3.05 4.67 2.16 5.81 1.65.18-1.29.7-2.16 1.27-2.66-4.45-.5-9.12-2.22-9.12-9.9 0-2.19.78-3.98 2.06-5.38-.2-.5-.9-2.52.2-5.25 0 0 1.68-.54 5.5 2.06a19.16 19.16 0 0 1 10 0c3.82-2.6 5.5-2.06 5.5-2.06 1.1 2.73.4 4.75.2 5.25 1.28 1.4 2.06 3.19 2.06 5.38 0 7.7-4.68 9.39-9.14 9.88.72.62 1.36 1.85 1.36 3.73v5.54c0 .55.37 1.17 1.38.98C38.27 40.34 44 32.84 44 24 44 12.95 35.05 4 24 4Z"/></svg></div>
<div><strong>GitHub</strong><a href="https://github.com/shivparmar1101/shiv-parmar-portfolio" target="_blank" rel="noopener noreferrer" title="View Shiv Parmar's Portfolio on GitHub">github.com/shivparmar1101</a></div>
</div>
<div class="contact-card reveal">
<div class="contact-icon"><svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8h-2a3 3 0 0 0-3 3v2c0 14 10 24 24 24h2a3 3 0 0 0 3-3v-3l-5-3-3 2a18 18 0 0 1-9-9l2-3-3-5z"/></svg></div>
<div><strong>Phone</strong><a href="tel:+917359411663" title="Call Shiv Parmar">+91 73594 11663</a></div>
</div>
<div class="contact-card reveal">
<div class="contact-icon"><svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 44S40 30 40 20a16 16 0 1 0-32 0c0 10 16 24 16 24Z"/><circle cx="24" cy="20" r="5"/></svg></div>
<div><strong>Location</strong><span>Available Worldwide &middot; Remote-ready</span></div>
</div>
</div>
</div>
</div>
</section>

<div id="site-footer"></div>
<script src="../includes.js"></script><script src="../particle-bg.js" defer></script><script src="../script.js"></script><script src="../spatial-tilt.js" defer></script>
</body>
</html>`;
}

function buildBlogCard(blog) {
  const today = new Date().toISOString().split('T')[0];
  const desc = escapeHtml(blog.keywords.slice(0, 2).join(', ') + ' - comprehensive guide by Shiv Parmar.');
  return `<article class="blog-card reveal">
            <div class="date">${today} &middot; 8 min read</div>
            <h3><a href="blog/${blog.slug}.html">${escapeHtml(blog.title)}</a></h3>
            <p>${desc}</p>
            <a class="read-more" href="blog/${blog.slug}.html">Read more &rarr;</a>
          </article>`;
}

function updateBlogHTML(blog) {
  const blogHTMLPath = path.join(__dirname, '..', 'blog.html');
  let blogHTML = fs.readFileSync(blogHTMLPath, 'utf-8');
  const newCard = buildBlogCard(blog);
  if (blogHTML.includes('<!-- BLOG_CARDS_START -->')) {
    blogHTML = blogHTML.replace('<!-- BLOG_CARDS_START -->', '<!-- BLOG_CARDS_START -->\n' + newCard);
  }
  const total = countPublishedBlogs();
  blogHTML = blogHTML.replace(/"numberOfItems":\s*\d+/, `"numberOfItems": ${total}`);
  fs.writeFileSync(blogHTMLPath, blogHTML);
  console.log(`blog.html updated (total: ${total})`);
}

function updateIndexHTML(blog) {
  const indexPath = path.join(__dirname, '..', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');
  const startTag = '<!-- BLOG_CARDS_START -->';
  const endTag = '<!-- BLOG_CARDS_END -->';
  const startIdx = html.indexOf(startTag);
  const endIdx = html.indexOf(endTag);
  if (startIdx === -1 || endIdx === -1) return;
  const section = html.substring(startIdx + startTag.length, endIdx);
  const cards = section.match(/<article class="blog-card[\s\S]*?<\/article>/g) || [];
  cards.unshift(buildBlogCard(blog));
  html = html.substring(0, startIdx + startTag.length) + '\n' + cards.slice(0, 3).join('\n') + html.substring(endIdx);
  fs.writeFileSync(indexPath, html);
  console.log('index.html updated');
}

function updateSitemap(blog) {
  const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return;
  let sitemap = fs.readFileSync(sitemapPath, 'utf-8');
  const today = new Date().toISOString().split('T')[0];
  const url = `${SITE_URL}/blog/${blog.slug}`;
  if (sitemap.includes(url)) return;
  const entry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  sitemap = sitemap.replace('</urlset>', entry + '</urlset>');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log('sitemap.xml updated');
}

function submitToIndexNow(blog) {
  const url = `${SITE_URL}/blog/${blog.slug}`;
  const payload = JSON.stringify({
    host: 'shiv-parmar-portfolio.netlify.app',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: [url]
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.indexnow.org',
      path: '/indexnow',
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = https.request(options, (res) => {
      console.log(`IndexNow: ${res.statusCode} ${res.statusCode === 200 || res.statusCode === 202 ? 'Submitted' : 'Failed'}`);
      resolve();
    });
    req.on('error', (e) => { console.log('IndexNow error:', e.message); resolve(); });
    req.write(payload);
    req.end();
  });
}

function pingGoogleSitemap() {
  return new Promise((resolve) => {
    const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITE_URL + '/sitemap.xml')}`;
    https.get(url, (res) => {
      console.log(`Google ping: ${res.statusCode}`);
      resolve();
    }).on('error', () => resolve());
  });
}

async function main() {
  console.log('========================================');
  console.log('Auto Blog Generator v2');
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log('========================================\n');

  if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY not set');
    process.exit(1);
  }

  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  const nextBlog = queue.blogs.find(b => b.status === 'pending');

  if (!nextBlog) {
    console.log('No pending blogs in queue!');
    process.exit(0);
  }

  const blogPath = path.join(BLOG_DIR, `${nextBlog.slug}.html`);
  if (fs.existsSync(blogPath)) {
    console.log(`Blog exists: ${nextBlog.slug} — marking published.`);
    nextBlog.status = 'published';
    nextBlog.published_at = new Date().toISOString();
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
    process.exit(0);
  }

  console.log(`Blog: ${nextBlog.title}`);
  console.log(`Keywords: ${nextBlog.keywords.join(', ')}\n`);

  const [content, metaDesc, conclusion] = await Promise.all([
    generateBlogContent(nextBlog),
    generateMetaDescription(nextBlog.title, nextBlog.keywords),
    generateConclusion(nextBlog.title, nextBlog.keywords)
  ]);

  if (!content || content.length < 500) {
    console.error('Content generation failed (too short)');
    process.exit(1);
  }
  console.log(`Content: ${content.length} chars`);
  console.log('Meta description: OK');
  console.log('Conclusion: OK');

  const heroSVG = createHeroSVG(nextBlog);
  fs.writeFileSync(path.join(IMAGES_DIR, `${nextBlog.slug}-hero.svg`), heroSVG);
  console.log('Hero SVG: created');

  const blogHTML = createBlogHTML(nextBlog, content, metaDesc, conclusion);
  fs.writeFileSync(blogPath, blogHTML);
  console.log('Blog HTML: created');

  updateBlogHTML(nextBlog);
  updateIndexHTML(nextBlog);
  updateSitemap(nextBlog);

  // Google indexing
  console.log('\nSubmitting for indexing...');
  await submitToIndexNow(nextBlog);
  await pingGoogleSitemap();

  nextBlog.status = 'published';
  nextBlog.published_at = new Date().toISOString();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

  console.log('\n========================================');
  console.log('Blog published successfully!');
  console.log(`URL: ${SITE_URL}/blog/${nextBlog.slug}`);
  console.log('========================================');
}

module.exports = { getRelatedPosts, buildRelatedHTML, buildTOC, escapeHtml, createBlogHTML, BLOG_DIR };

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err.message || err);
    process.exit(1);
  });
}
