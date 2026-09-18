/**
 * Auto Blog Generator
 * Uses Gemini API to generate blog content and publishes to GitHub
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Config
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAb8RN6L4f_unA2inGFnJ5hslmY0rYHGZkpUvi2OP6-789ru6tA';
const SITE_URL = 'https://shiv-parmar-portfolio.netlify.app';
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const QUEUE_FILE = path.join(__dirname, '..', 'blog-queue.json');
const IMAGES_DIR = path.join(__dirname, '..', 'images', 'blog');

/**
 * Call Gemini API
 */
async function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const postData = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
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
            reject(new Error('No response from Gemini API'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Generate blog content using Gemini API
 */
async function generateBlogContent(blog) {
  const prompt = `Write a comprehensive, SEO-optimized blog post about "${blog.title}".

Requirements:
1. Write 2000-2500 words
2. Use proper HTML formatting with h2 and h3 headings
3. Include practical code examples where relevant
4. Write in a professional, helpful tone
5. Include an introduction that hooks the reader
6. Include a conclusion with a call-to-action
7. Make it informative and actionable

Structure:
- Introduction (2-3 paragraphs)
- What is [Topic]? (h2)
- Why [Topic] Matters in 2026 (h2)
- Step-by-Step Guide (h2) with multiple h3 subsections
- Best Practices (h2)
- Common Mistakes to Avoid (h2)
- Conclusion (2-3 paragraphs)

Return ONLY the HTML content (no head, no body tags, just the article content).`;

  try {
    console.log('Generating content with Gemini API...');
    const content = await callGeminiAPI(prompt);
    return content;
  } catch (error) {
    console.error('Error generating content:', error.message);
    return null;
  }
}

/**
 * Generate meta description
 */
async function generateMetaDescription(title) {
  const prompt = `Write a compelling meta description (120-160 characters) for a blog post titled "${title}". Include the primary keyword naturally. Return ONLY the meta description text, nothing else.`;

  try {
    const desc = await callGeminiAPI(prompt);
    return desc.trim().substring(0, 160);
  } catch (error) {
    return `Learn about ${title} with this comprehensive guide by Shiv Parmar. Step-by-step instructions and expert tips.`;
  }
}

/**
 * Create blog HTML file
 */
function createBlogHTML(blog, content, metaDesc) {
  const today = new Date().toISOString().split('T')[0];
  const readTime = Math.ceil(content.split(' ').length / 200);

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${blog.title} | Shiv Parmar</title>
<meta name="description" content="${metaDesc}">
<meta name="keywords" content="${blog.keywords.join(', ')}">
<meta name="author" content="Shiv Parmar">
<meta name="google-site-verification" content="3bq_-xDevPWEZSADvcEB-ykrDgizyDWLNgEPQA1pOrc" />
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE_URL}/blog/${blog.slug}">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:title" content="${blog.title}">
<meta property="og:description" content="${metaDesc}">
<meta property="og:url" content="${SITE_URL}/blog/${blog.slug}">
<meta property="og:image" content="${SITE_URL}/images/blog/${blog.slug}-hero.png">
<meta property="og:site_name" content="Shiv Parmar - WordPress Developer Portfolio">
<meta property="og:locale" content="en_US">
<meta property="article:author" content="https://www.linkedin.com/in/shiv-parmar/">
<meta property="article:published_time" content="${today}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${blog.title}">
<meta name="twitter:description" content="${metaDesc}">
<meta name="twitter:image" content="${SITE_URL}/images/blog/${blog.slug}-hero.png">
<meta name="twitter:creator" content="@shivparmar1101">

<!-- Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${blog.title}",
  "description": "${metaDesc}",
  "author": { "@type": "Person", "name": "Shiv Parmar", "url": "https://www.linkedin.com/in/shiv-parmar/" },
  "publisher": { "@type": "Organization", "name": "Shiv Parmar - WordPress Developer", "url": "${SITE_URL}/" },
  "datePublished": "${today}",
  "dateModified": "${today}",
  "image": "${SITE_URL}/images/blog/${blog.slug}-hero.png",
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
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:40px;padding:24px 0;border-top:1px solid var(--border-glass)}
.tag{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;background:var(--accent-glow-soft);color:var(--accent)}
.author-box{display:flex;gap:20px;align-items:flex-start;padding:24px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);margin-top:32px}
.author-box img{width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0}
.author-box .author-info h4{font-size:16px;font-weight:700;margin:0 0 4px;color:var(--text-primary)}
.author-box .author-info p{font-size:14px;color:var(--text-secondary);margin:0 0 8px}
.author-box .author-social{display:flex;gap:12px}
.author-box .author-social a{font-size:13px;color:var(--accent);text-decoration:none;font-weight:500}
.hero-img{width:100%;height:400px;object-fit:cover;border-radius:var(--radius-lg);margin-top:20px;margin-bottom:32px;border:1px solid var(--border-glass)}
@media(max-width:640px){article{padding:0}h1{font-size:24px}.hero-img{height:200px}.author-box{flex-direction:column;align-items:center;text-align:center}}
</style>
</head>
<body>
<div class="liquid-glass-bg" aria-hidden="true">
<div class="liquid-blob liquid-blob-1"></div>
<div class="liquid-blob liquid-blob-2"></div>
<div class="liquid-blob liquid-blob-3"></div>
<div class="liquid-blob liquid-blob-4"></div>
</div>
<div id="particle-hero" class="particle-canvas-fullpage"></div>
<div id="site-header">
<noscript>
<header><div class="container nav"><a class="logo" href="../">shiv<span class="dot">.</span>parmar</a><nav class="nav-links"><a href="../about">About</a><a href="../services">Services</a><a href="../work">Work</a><a href="../skills">Skills</a><a href="../experience">Experience</a><a href="../blog" class="active">Blog</a><a href="../contact">Contact</a></nav><div class="nav-right"><a class="nav-cta" href="../contact">Hire Me</a></div></div></header>
</noscript>
</div>
<article><div class="container">
<img src="../images/blog/${blog.slug}-hero.png" alt="${blog.title} - WordPress development guide by Shiv Parmar" class="hero-img">
<nav class="breadcrumb" aria-label="Breadcrumb">
<a href="../">Home</a><span>/</span><a href="../blog">Blog</a><span>/</span>${blog.title}
</nav>
<div class="date">${today} &middot; ${readTime} min read</div>
<h1>${blog.title}</h1>
<div class="toc" id="toc">
<h3>Table of Contents</h3>
<ul id="tocList"></ul>
</div>
<div class="content">
${content}

<div style="background:var(--bg-glass);backdrop-filter:blur(var(--blur-lg));-webkit-backdrop-filter:blur(var(--blur-lg));border:1px solid var(--border-glass);padding:48px 32px;border-radius:var(--radius-xl);text-align:center;position:relative;overflow:hidden;margin:32px 0">
<div style="position:absolute;top:0;left:0;right:0;height:1px;background:var(--gradient-accent);opacity:0.5"></div>
<p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;justify-content:center;gap:12px">
<span style="width:24px;height:1px;background:var(--accent)"></span>Available for Hire<span style="width:24px;height:1px;background:var(--accent)"></span>
</p>
<h3 style="margin:0 0 12px;font-size:clamp(22px,3vw,32px);font-weight:800;color:var(--text-primary);letter-spacing:-0.02em">Hire WordPress Developer for Your Project</h3>
<p style="margin:0 auto 24px;max-width:480px;font-size:15px;color:var(--text-secondary);line-height:1.7">Expert in WooCommerce, custom themes, plugins. Available worldwide.</p>
<a href="mailto:parmarshiv1101@gmail.com" style="display:inline-flex;align-items:center;gap:8px;background:var(--gradient-accent);color:#000;padding:14px 32px;border-radius:var(--radius-md);font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 4px 20px rgba(201,168,76,0.3)">Get Free Quote <span>&rarr;</span></a>
</div>
</div>

<div class="tags">
${blog.keywords.map(k => `<a href="/blog" class="tag">${k}</a>`).join('\n')}
</div>

<div class="author-box">
<img src="../images/shiv-parmar-wordpress-developer.jpg" alt="Shiv Parmar">
<div class="author-info">
<h4>Shiv Parmar</h4>
<p>WordPress Developer with 4+ years experience. Expert in WooCommerce, custom themes, plugins, and AI integration.</p>
<div class="author-social">
<a href="https://www.linkedin.com/in/shiv-parmar/" target="_blank">LinkedIn</a>
<a href="https://github.com/shivparmar1101" target="_blank">GitHub</a>
<a href="mailto:parmarshiv1101@gmail.com">Email</a>
</div>
</div>
</div>

</div></article>

<div id="site-footer">
<noscript>
<footer><div class="container footer-inner"><span>&copy; 2026 Shiv Parmar</span><span>WordPress Developer | Available Worldwide</span></div></footer>
</noscript>
</div>

<script src="../includes.js"></script>
<script src="../script.js"></script>
<script src="../particle-bg.js"></script>
<script>
(function(){
  var toc=document.getElementById("tocList");
  if(toc){
    document.querySelectorAll(".content h2").forEach(function(h,i){
      var id="section-"+i;h.id=id;
      var li=document.createElement("li");
      var a=document.createElement("a");
      a.href="#"+id;a.textContent=h.textContent;
      li.appendChild(a);toc.appendChild(li);
    });
  }
})();
</script>
</body>
</html>`;
}

/**
 * Update blog.html with new card
 */
function updateBlogHTML(blog) {
  const blogHTMLPath = path.join(__dirname, '..', 'blog.html');
  let blogHTML = fs.readFileSync(blogHTMLPath, 'utf-8');
  
  const today = new Date().toISOString().split('T')[0];
  const newCard = `<article class="blog-card reveal">
            <div class="date">${today} &middot; 8 min read</div>
            <h3><a href="blog/${blog.slug}.html">${blog.title}</a></h3>
            <p>${blog.keywords.slice(0, 2).join(', ')} - comprehensive guide by Shiv Parmar.</p>
            <a class="read-more" href="blog/${blog.slug}.html">Read more &rarr;</a>
          </article>`;

  // Insert after BLOG_CARDS_START
  blogHTML = blogHTML.replace(
    '<!-- BLOG_CARDS_START -->',
    '<!-- BLOG_CARDS_START -->\n' + newCard
  );

  // Update blog count in schema
  blogHTML = blogHTML.replace(
    /"numberOfItems": \d+/,
    '"numberOfItems": ' + (33)
  );

  fs.writeFileSync(blogHTMLPath, blogHTML);
  console.log('blog.html updated');
}

/**
 * Main function
 */
async function main() {
  console.log('========================================');
  console.log('Auto Blog Generator');
  console.log('========================================\n');

  // Read queue
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  
  // Find next pending blog
  const nextBlog = queue.blogs.find(b => b.status === 'pending');
  
  if (!nextBlog) {
    console.log('No pending blogs in queue!');
    process.exit(0);
  }

  console.log(`Next blog: ${nextBlog.title}`);
  console.log(`Publish time: ${nextBlog.publish_time}`);
  console.log(`Keywords: ${nextBlog.keywords.join(', ')}\n`);

  // Generate content
  const content = await generateBlogContent(nextBlog);
  
  if (!content) {
    console.error('Failed to generate content');
    process.exit(1);
  }

  console.log('Content generated successfully!');

  // Generate meta description
  const metaDesc = await generateMetaDescription(nextBlog.title);
  console.log('Meta description generated');

  // Create blog HTML
  const blogHTML = createBlogHTML(nextBlog, content, metaDesc);
  const blogPath = path.join(BLOG_DIR, `${nextBlog.slug}.html`);
  fs.writeFileSync(blogPath, blogHTML);
  console.log(`Blog file created: ${blogPath}`);

  // Update blog.html
  updateBlogHTML(nextBlog);

  // Update queue status
  nextBlog.status = 'published';
  nextBlog.published_at = new Date().toISOString();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  console.log('Queue updated');

  console.log('\n========================================');
  console.log('Blog generated successfully!');
  console.log(`URL: ${SITE_URL}/blog/${nextBlog.slug}`);
  console.log('========================================');
}

// Run
main().catch(console.error);
