# Blog Auto-Publisher (FREE - Using Google Gemini API)
# Generates AI blog posts every hour using Gemini API
# Run via Windows Task Scheduler

param(
    [string]$ApiKey = "",
    [string]$BlogDir = "D:\xampp\htdocs\portfolio\blog",
    [string]$SiteUrl = "https://shivparmar1101.github.io/shiv-parmar-portfolio"
)

# Blog topics pool
$topics = @(
    @{title="WordPress Gutenberg vs Elementor: Which is Better in 2026?"; cat="WordPress"; read="6 min"},
    @{title="How to Speed Up WooCommerce Product Pages"; cat="WooCommerce"; read="5 min"},
    @{title="Building a WordPress REST API from Scratch"; cat="WordPress"; read="7 min"},
    @{title="WordPress Database Optimization Guide"; cat="WordPress"; read="5 min"},
    @{title="How to Create Custom WooCommerce Product Types"; cat="WooCommerce"; read="6 min"},
    @{title="WordPress Cron Jobs: Complete Guide"; cat="WordPress"; read="4 min"},
    @{title="WooCommerce Subscription Setup Guide"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress Multisite Configuration Tips"; cat="WordPress"; read="6 min"},
    @{title="How to Build a WordPress Membership Site"; cat="WordPress"; read="7 min"},
    @{title="WooCommerce Payment Gateway Comparison 2026"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress Security Headers Configuration"; cat="Security"; read="4 min"},
    @{title="How to Debug WordPress Like a Pro"; cat="WordPress"; read="5 min"},
    @{title="WordPress SEO Technical Checklist"; cat="SEO"; read="6 min"},
    @{title="WooCommerce Product Variation Best Practices"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress Block Theme Development Guide"; cat="WordPress"; read="8 min"},
    @{title="How to Add Custom CSS to WordPress without Plugin"; cat="WordPress"; read="4 min"},
    @{title="WooCommerce Shipping Zones Setup Guide"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress Post Types and Taxonomies Explained"; cat="WordPress"; read="6 min"},
    @{title="How to Create WordPress Widget Areas"; cat="WordPress"; read="4 min"},
    @{title="WooCommerce Coupon System Complete Guide"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress Image Optimization for Speed"; cat="Performance"; read="5 min"},
    @{title="How to Set Up WordPress Staging Environment"; cat="WordPress"; read="4 min"},
    @{title="WooCommerce Inventory Management Best Practices"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress Migration Guide: Local to Production"; cat="WordPress"; read="6 min"},
    @{title="How to Add Schema Markup to WordPress"; cat="SEO"; read="5 min"},
    @{title="WooCommerce Email Template Customization"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress Caching Plugins Compared 2026"; cat="Performance"; read="6 min"},
    @{title="How to Build a WordPress Job Board"; cat="WordPress"; read="7 min"},
    @{title="WooCommerce Product Filter Setup Guide"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress User Role Management Guide"; cat="WordPress"; read="5 min"},
    @{title="How to Create a WordPress Booking System"; cat="WordPress"; read="6 min"},
    @{title="WooCommerce Tax Configuration Guide"; cat="WooCommerce"; read="4 min"},
    @{title="WordPress Gutenberg Block Development"; cat="WordPress"; read="7 min"},
    @{title="How to Secure WordPress Login Page"; cat="Security"; read="4 min"},
    @{title="WooCommerce Cart Abandonment Recovery"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress REST API Authentication Methods"; cat="WordPress"; read="6 min"},
    @{title="How to Create WordPress Mega Menu"; cat="WordPress"; read="5 min"},
    @{title="WooCommerce Product Bundles Setup"; cat="WooCommerce"; read="5 min"},
    @{title="WordPress Database Backup Strategies"; cat="WordPress"; read="4 min"},
    @{title="How to Optimize WordPress for Core Web Vitals"; cat="Performance"; read="6 min"}
)

function Generate-BlogPost {
    param(
        [string]$apiKey,
        [hashtable]$topic
    )

    $prompt = @"
Write a professional WordPress development blog post about: $($topic.title)

Requirements:
- Write in first person as Shiv Parmar, a WordPress Developer from Rajkot, India
- Include practical code examples where relevant (PHP, CSS, JavaScript)
- Use HTML formatting with h2, h3, p, code, pre, ul, ol, blockquote tags
- Make it informative and actionable
- Include a blockquote with a key insight
- Length: 800-1200 words
- Tone: Professional but friendly

Return ONLY the blog content HTML. No ```html or ``` tags, just raw HTML.
"@

    $body = @{
        contents = @(
            @{
                parts = @(
                    @{text = $prompt}
                )
            }
        )
        generationConfig = @{
            temperature = 0.7
            maxOutputTokens = 4096
        }
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=$apiKey" -Method Post -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 180
        return $response.candidates[0].content.parts[0].text
    } catch {
        Write-Host "Error generating content: $_" -ForegroundColor Red
        Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
        return $null
    }
}

function Generate-Image {
    param(
        [string]$apiKey,
        [string]$prompt
    )

    $body = @{
        contents = @(
            @{
                parts = @(
                    @{text = "Generate a professional blog header image for this topic: $prompt. Style: modern, clean, dark blue theme, abstract tech/wordpress style, no text in the image, suitable for a developer portfolio blog."}
                )
            }
        )
        generationConfig = @{
            responseModalities = @("TEXT", "IMAGE")
        }
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=$apiKey" -Method Post -ContentType "application/json" -Body $body

        # Extract image data from response
        foreach ($part in $response.candidates[0].content.parts) {
            if ($part.inlineData) {
                $imageData = $part.inlineData.data
                $imagePath = "D:\xampp\htdocs\portfolio\blog\temp-image.png"
                [System.IO.File]::WriteAllBytes($imagePath, [System.Convert]::FromBase64String($imageData))

                # Upload to imgbb or use placeholder
                return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
            }
        }
        return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
    } catch {
        Write-Host "Error generating image, using placeholder..." -ForegroundColor Yellow
        return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
    }
}

function Send-EmailNotification {
    param(
        [string]$status,
        [string]$title,
        [string]$filename,
        [string]$url,
        [string]$error = ""
    )

    $notificationUrl = "https://script.google.com/macros/s/AKfycbxZ5poh7MGyq-4nzpri5qtB4AujOWhIAsxT6uLiZ5NuJ7VzgRVuJKZRKY0VipBFli6D/exec"

    $body = @{
        type = "blog_notification"
        status = $status
        title = $title
        filename = $filename
        url = $url
        error = $error
        time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri $notificationUrl -Method Post -ContentType "application/json" -Body $body
        Write-Host "Email notification sent!" -ForegroundColor Green
    } catch {
        Write-Host "Email notification failed: $_" -ForegroundColor Yellow
    }
}

function Create-BlogHTML {
    param(
        [string]$title,
        [string]$date,
        [string]$readTime,
        [string]$content,
        [string]$imageUrl,
        [string]$slug,
        [string]$ctaHeading = "Need a WordPress Expert on Your Side?",
        [string]$ctaSubtitle = "I build custom WordPress solutions that help businesses grow. Let's discuss what you need.",
        [string]$ctaButton = "Get in Touch &rarr;"
    )

    # Insert CTA after first 2 paragraphs (safe injection)
    $cta = @"

<div style="background:var(--accent-glow-soft);border:1px solid var(--accent);border-radius:var(--radius-lg);padding:24px;margin:32px 0;text-align:center">
  <p style="margin:0 0 12px;font-weight:600;color:var(--text-primary)">$ctaHeading</p>
  <p style="margin:0 0 12px;font-size:14px;color:var(--text-secondary)">$ctaSubtitle</p>
  <a href="../index.html#contact" style="display:inline-block;background:var(--accent);color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;text-decoration:none">$ctaButton</a>
</div>

"@

    # Find safe injection point: after a </p> that is NOT followed by <pre or <code
    $insertPos = -1
    $searchStart = 0
    while ($searchStart -lt $content.Length) {
        $pIdx = $content.IndexOf('</p>', $searchStart)
        if ($pIdx -lt 0) { break }
        $afterP = $pIdx + 4
        # Skip whitespace
        while ($afterP -lt $content.Length -and $content[$afterP] -in ' ', "`n", "`r", "`t") { $afterP++ }
        # Check what follows: skip if it's <pre or <code or another <p
        $followsCode = $false
        if ($afterP -lt $content.Length - 4) {
            $nextTag = $content.Substring($afterP, [Math]::Min(10, $content.Length - $afterP)).ToLower()
            if ($nextTag -match '^<(pre|code|ul|ol|blockquote|h[1-6])') {
                $followsCode = $true
            }
        }
        if (-not $followsCode) {
            $insertPos = $pIdx + 4
            break
        }
        $searchStart = $pIdx + 4
    }

    if ($insertPos -gt 0) {
        $content = $content.Substring(0, $insertPos) + "`n" + $cta + "`n" + $content.Substring($insertPos)
    }

    # Add second CTA + contact form at end
    $content += @"

<div style="background:var(--accent-glow-soft);border:1px solid var(--accent);border-radius:var(--radius-lg);padding:24px;margin:40px 0 32px;text-align:center">
  <p style="margin:0 0 12px;font-weight:600;color:var(--text-primary)">Like what you read? Let's work together!</p>
  <a href="../index.html#contact" style="display:inline-block;background:var(--accent);color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;text-decoration:none">$ctaButton</a>
</div>

"@

    $html = @"
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$title &mdash; Shiv Parmar</title>
<meta name="description" content="$title - WordPress development guide by Shiv Parmar.">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css">
<style>
.blog-header{padding:20px 0;border-bottom:1px solid var(--border-glass)}
.blog-header .nav{display:flex;align-items:center;justify-content:space-between}
.blog-header .logo{font-family:var(--font-primary);font-weight:800;font-size:19px;color:var(--text-primary);text-decoration:none}.blog-header .logo span{color:var(--accent)}
.blog-header .back{font-size:14px;font-weight:500;color:var(--text-muted)}
.blog-header .back:hover{color:var(--accent);text-decoration:none}
.blog-header .nav-right{display:flex;gap:12px;align-items:center}
article{padding:0}
.breadcrumb{font-size:13px;color:var(--text-muted);margin-bottom:16px;font-family:var(--font-mono)}
.breadcrumb a{color:var(--accent);text-decoration:none}
.breadcrumb a:hover{text-decoration:underline}
.breadcrumb span{margin:0 6px;opacity:0.5}
.date{font-family:var(--font-mono);font-size:13px;color:var(--text-muted);margin-bottom:12px}
.date .updated{color:var(--accent);margin-left:12px}
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
.content blockquote{border-left:4px solid #c9a84c;padding:0 0 0 15px;margin:20px 0;font-style:italic;color:#fff;background:transparent;border-radius:0}
.content blockquote em{color:#fff}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:40px;padding:24px 0;border-top:1px solid var(--border-glass)}
.tag{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;background:var(--accent-glow-soft);color:var(--accent)}
.author-box{display:flex;gap:20px;align-items:flex-start;padding:24px;background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);margin-top:32px}
.author-box img{width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--accent)}
.author-box .author-info h4{font-size:16px;font-weight:700;margin:0 0 4px;color:var(--text-primary)}
.author-box .author-info p{font-size:14px;color:var(--text-secondary);margin:0 0 8px}
.author-box .author-social{display:flex;gap:12px}
.author-box .author-social a{font-size:13px;color:var(--accent);text-decoration:none;font-weight:500}
.author-box .author-social a:hover{text-decoration:underline}
.related-blogs{margin-top:48px;padding-top:32px;border-top:1px solid var(--border-glass)}
.related-blogs h3{font-size:20px;font-weight:700;margin-bottom:20px;color:var(--text-primary)}
.related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.related-card{background:var(--bg-glass);border:1px solid var(--border-glass);border-radius:var(--radius-lg);padding:20px;transition:border-color 0.3s}
.related-card:hover{border-color:var(--accent)}
.related-card .date{font-size:12px;margin-bottom:8px}
.related-card h4{font-size:15px;font-weight:600;margin:0 0 8px;color:var(--text-primary)}
.related-card h4 a{color:var(--text-primary);text-decoration:none}
.related-card h4 a:hover{color:var(--accent)}
.hero-img{width:100%;height:420px;object-fit:cover;border-radius:var(--radius-lg);margin-top:70px;margin-bottom:32px;border:1px solid var(--border-glass)}
.cta-section{padding:80px 0}
.contact-grid{margin-top:0}
.blog-footer{border-top:1px solid var(--border-glass);padding:32px 0;text-align:center;color:var(--text-muted);font-size:14px;font-family:var(--font-primary)}
.blog-footer .foot-inner{display:flex;justify-content:space-between;align-items:center}
select option{background:#111;color:#f0f0f0;padding:8px}
@media(max-width:640px){article{padding:0}h1{font-size:24px}.hero-img{height:200px}.author-box{flex-direction:column;align-items:center;text-align:center}.blog-footer .foot-inner{flex-direction:column;gap:12px}}
</style>
</head>
<body>
  <div id="site-header"></div>
<article><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="../index.html">Home</a><span>/</span><a href="../blog.html">Blog</a><span>/</span>$title
</nav>
<img src="$imageUrl" alt="$title" title="$title" class="hero-img">
<div class="date">$date &middot; $readTime read<span class="updated">Updated: $date</span></div>
<h1>$title</h1>
<div class="toc" id="toc">
  <h3>Table of Contents</h3>
  <ul id="tocList"></ul>
</div>
<div class="content">
$content
</div>
<div class="tags"><span class="tag">WordPress</span><span class="tag">Development</span></div>
<div class="author-box">
  <img src="https://avatars.githubusercontent.com/u/shivparmar1101" alt="Shiv Parmar" onerror="this.src='https://ui-avatars.com/api/?name=Shiv+Parmar&background=c9a84c&color=fff&size=80'">
  <div class="author-info">
    <h4>Shiv Parmar</h4>
    <p>WordPress Developer from Rajkot, India. Specializing in custom themes, WooCommerce, and high-performance WordPress sites.</p>
    <div class="author-social">
      <a href="https://linkedin.com/in/shiv-parmar" target="_blank" rel="noopener">LinkedIn</a>
      <a href="https://github.com/shivparmar1101" target="_blank" rel="noopener">GitHub</a>
    </div>
  </div>
</div>
<div class="related-blogs">
  <h3>Related Posts</h3>
  <div class="related-grid" id="relatedBlogs"></div>
</div>
</div></article>

<section id="contact" class="cta-section" aria-labelledby="contact-heading">
  <div class="container">
    <div class="contact-grid">
      <div class="form-card reveal">
        <h3>Let's Work Together</h3>
        <form id="contactForm" novalidate>
          <div class="form-row">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" placeholder="John Doe" required>
          </div>
          <div class="form-row">
            <label for="email">Email Address *</label>
            <input type="email" id="email" name="email" placeholder="john@example.com" required>
          </div>
          <div class="form-row">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" placeholder="+91 00000 00000">
          </div>
          <div class="form-row">
            <label for="subject">Subject *</label>
            <select id="subject" name="subject" required>
              <option value="" disabled selected>Select an inquiry type</option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Project Request">Project Request</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Freelance Work">Freelance Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-row">
            <label for="budget">Budget Range</label>
            <select id="budget" name="budget">
              <option value="" disabled selected>Select budget range</option>
              <option value="Under Rs.10,000">Under Rs.10,000</option>
              <option value="Rs.10,000 - Rs.25,000">Rs.10,000 - Rs.25,000</option>
              <option value="Rs.25,000 - Rs.50,000">Rs.25,000 - Rs.50,000</option>
              <option value="Rs.50,000 - Rs.1,00,000">Rs.50,000 - Rs.1,00,000</option>
              <option value="Above Rs.1,00,000">Above Rs.1,00,000</option>
            </select>
          </div>
          <div class="form-row">
            <label for="message">Project Details *</label>
            <textarea id="message" name="message" rows="5" placeholder="Tell me about your project, goals, and timeline..." required></textarea>
          </div>
          <button class="btn btn-primary" type="submit">Send Message <span class="arrow">&rarr;</span></button>
          <p class="form-note" id="formStatus">Your message will be sent directly to my email &mdash; I'll respond within 24 hours.</p>
        </form>
      </div>
      <div class="contact-info">
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="6" y="10" width="36" height="26" rx="3"/>
              <path d="M6 14l18 11 18-11"/>
            </svg>
          </div>
          <div>
            <strong>Email</strong>
            <a href="mailto:parmarshiv1101@gmail.com">parmarshiv1101@gmail.com</a>
          </div>
        </div>
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="6" y="6" width="36" height="36" rx="5"/>
              <path d="M16 21v15"/>
              <circle cx="16" cy="15" r="2.5" fill="currentColor" stroke="none"/>
              <path d="M24 21v15"/>
              <path d="M24 27c0-4 2-6 5-6s5 2 5 6v9"/>
            </svg>
          </div>
          <div>
            <strong>LinkedIn</strong>
            <a href="https://www.linkedin.com/in/shiv-parmar/" target="_blank" rel="noopener noreferrer">linkedin.com/in/shiv-parmar</a>
          </div>
        </div>
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="currentColor" stroke="none" aria-hidden="true">
              <path d="M24 4C12.95 4 4 12.95 4 24c0 8.84 5.74 16.34 13.7 18.98 1 .18 1.37-.44 1.37-.98v-3.46c-5.57 1.22-6.74-2.68-6.74-2.68-.91-2.31-2.22-2.93-2.22-2.93-1.81-1.24.14-1.21.14-1.21 2 .14 3.06 2.06 3.06 2.06 1.78 3.05 4.67 2.16 5.81 1.65.18-1.29.7-2.16 1.27-2.66-4.45-.5-9.12-2.22-9.12-9.9 0-2.19.78-3.98 2.06-5.38-.2-.5-.9-2.52.2-5.25 0 0 1.68-.54 5.5 2.06a19.16 19.16 0 0 1 10 0c3.82-2.6 5.5-2.06 5.5-2.06 1.1 2.73.4 4.75.2 5.25 1.28 1.4 2.06 3.19 2.06 5.38 0 7.7-4.68 9.39-9.14 9.88.72.62 1.36 1.85 1.36 3.73v5.54c0 .55.37 1.17 1.38.98C38.27 40.34 44 32.84 44 24 44 12.95 35.05 4 24 4Z"/>
            </svg>
          </div>
          <div>
            <strong>GitHub</strong>
            <a href="https://github.com/shivparmar1101/shiv-parmar-portfolio" target="_blank" rel="noopener noreferrer">github.com/shivparmar1101</a>
          </div>
        </div>
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 8h-2a3 3 0 0 0-3 3v2c0 14 10 24 24 24h2a3 3 0 0 0 3-3v-3l-5-3-3 2a18 18 0 0 1-9-9l2-3-3-5z"/>
            </svg>
          </div>
          <div>
            <strong>Phone</strong>
            <a href="tel:+917359411663">+91 73594 11663</a>
          </div>
        </div>
        <div class="contact-card reveal">
          <div class="contact-icon">
            <svg class="contact-svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M24 44S40 30 40 20a16 16 0 1 0-32 0c0 10 16 24 16 24Z"/>
              <circle cx="24" cy="20" r="5"/>
            </svg>
          </div>
          <div>
            <strong>Location</strong>
            <span>Rajkot, India &middot; Remote-ready</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<div id="site-footer"></div>
<script src="../includes.js"></script><script src="../script.js"></script>
<script>
(function(){
  function initBlog(){
    var toc=document.getElementById("tocList");
    if(toc){
      var headings=document.querySelectorAll(".content h2");
      headings.forEach(function(h,i){
        var id="section-"+i;
        h.id=id;
        var li=document.createElement("li");
        var a=document.createElement("a");
        a.href="#"+id;
        a.textContent=h.textContent;
        li.appendChild(a);
        toc.appendChild(li);
      });
    }
    var related=document.getElementById("relatedBlogs");
    if(related){
      var posts=[
        {title:"WordPress SEO Technical Checklist",slug:"wordpress-seo-technical-checklist",date:"Aug 15, 2026"},
        {title:"WordPress Database Optimization Guide",slug:"wordpress-database-optimization-guide",date:"Aug 16, 2026"},
        {title:"WordPress Gutenberg vs Elementor: Which is Better in 2026?",slug:"wordpress-gutenberg-vs-elementor-which-is-better-in-2026",date:"Aug 16, 2026"}
      ];
      var currentSlug=window.location.pathname.split("/").pop().replace(".html","");
      posts.forEach(function(p){
        if(p.slug!==currentSlug){
          var card=document.createElement("div");
          card.className="related-card";
          card.innerHTML='<div class="date">'+p.date+'</div><h4><a href="'+p.slug+'.html">'+p.title+'</a></h4>';
          related.appendChild(card);
        }
      });
    }
  }
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",initBlog)}else{initBlog()}
})();
</script>
</body>
</html>
"@

    return $html
}

function Update-HomepageBlog {
    param(
        [string]$title,
        [string]$date,
        [string]$readTime,
        [string]$slug,
        [string]$description
    )

    $indexPath = "D:\xampp\htdocs\portfolio\index.html"
    $content = Get-Content $indexPath -Raw -Encoding UTF8

    # Create new blog card
    $newCard = @"
          <article class="blog-card reveal">
            <div class="date">$date &middot; $readTime read</div>
            <h3><a href="blog/$slug.html">$title</a></h3>
            <p>$description</p>
            <a class="read-more" href="blog/$slug.html">Read more &rarr;</a>
          </article>
"@

    # Use marker comments for reliable insertion
    $startMarker = "<!-- BLOG_CARDS_START -->"
    $endMarker = "<!-- BLOG_CARDS_END -->"
    $startIdx = $content.IndexOf($startMarker)
    $endIdx = $content.IndexOf($endMarker)

    if ($startIdx -gt 0 -and $endIdx -gt $startIdx) {
        # Extract existing cards between markers
        $between = $content.Substring($startIdx + $startMarker.Length, $endIdx - $startIdx - $startMarker.Length)
        $existingCards = [regex]::Matches($between, '<article class="blog-card reveal">[\s\S]*?</article>')

        # Build new content: new card + keep only 2 most recent existing
        $newBetween = "`n" + $newCard
        $count = 0
        foreach ($card in $existingCards) {
            if ($count -lt 2) {
                # Ensure consistent indentation
                $cardText = $card.Value -replace '^\s+', '          '
                $newBetween += "`n" + $cardText
                $count++
            }
        }

        # Replace between markers
        $content = $content.Substring(0, $startIdx + $startMarker.Length) + $newBetween + "`n          " + $content.Substring($endIdx)
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($indexPath, $content, $utf8NoBom)
}

# Main execution
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Blog Auto-Publisher (FREE Gemini)" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check API key
if (-not $ApiKey) {
    $ApiKey = $env:GEMINI_API_KEY
}

# Fallback: read from config file for scheduled task
if (-not $ApiKey) {
    $configDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
    if (-not $configDir) { $configDir = "D:\xampp\htdocs\portfolio" }
    $configFile = Join-Path $configDir ".api-key"
    if (Test-Path $configFile) {
        $raw = (Get-Content $configFile -Raw -ErrorAction SilentlyContinue)
        if ($raw) { $ApiKey = $raw.Trim() }
    }
}

if (-not $ApiKey) {
    Write-Host "ERROR: No API key provided!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Set environment variable: GEMINI_API_KEY"
    Write-Host "  2. Pass parameter: .\blog-publisher-gemini.ps1 -ApiKey 'AQ...'"
    Write-Host ""
    Write-Host "API key should be in .api-key file" -ForegroundColor Yellow
    exit 1
}

# Filter out already-published topics
$existingFiles = Get-ChildItem -Path $BlogDir -Filter "*.html" -File | ForEach-Object { $_.BaseName }
$availableTopics = $topics | Where-Object {
    $slug = $_.title.ToLower() -replace '[^a-z0-9]+', '-' -replace '^-|-$', ''
    $existingFiles -notcontains $slug
}

if ($availableTopics.Count -eq 0) {
    Write-Host "All topics already published! No new blog to generate." -ForegroundColor Yellow
    exit 0
}

# Select random topic from available (unpublished) topics
$topic = $availableTopics | Get-Random
Write-Host "Topic: $($topic.title)" -ForegroundColor Green
Write-Host "Category: $($topic.cat)" -ForegroundColor Gray
Write-Host ""

# Generate content
Write-Host "Generating blog content with Gemini..." -ForegroundColor Yellow
$content = Generate-BlogPost -apiKey $ApiKey -topic $topic

if (-not $content) {
    Write-Host "Failed to generate content!" -ForegroundColor Red
    Send-EmailNotification -status "error" -title $topic.title -filename "" -url "" -error "Failed to generate blog content from Gemini API"
    exit 1
}

Write-Host "Content generated! ($($content.Length) chars)" -ForegroundColor Green

# Use topic-specific image based on keywords
$topicImages = @{
    "speed" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
    "performance" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
    "cache" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
    "woo" = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
    "ecommerce" = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
    "shop" = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
    "checkout" = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
    "plugin" = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop"
    "code" = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop"
    "develop" = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop"
    "security" = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop"
    "protect" = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop"
    "firewall" = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop"
    "theme" = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop"
    "design" = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop"
    "gutenberg" = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop"
    "payment" = "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&h=600&fit=crop"
    "gateway" = "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&h=600&fit=crop"
    "membership" = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop"
    "community" = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop"
    "widget" = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop"
    "api" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
    "rest" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
    "optimization" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
    "database" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
    "cron" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
    "multisite" = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop"
    "seo" = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop"
    "shipping" = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
    "coupon" = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
    "subscription" = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
    "product" = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop"
    "post type" = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop"
    "taxonomy" = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop"
    "css" = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop"
    "block" = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop"
    "migration" = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop"
    "debug" = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop"
    "default" = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
}

# Find matching image based on topic title
$imageUrl = $topicImages["default"]
$topicTitle = $topic.title.ToLower()
foreach ($key in $topicImages.Keys) {
    if ($topicTitle -match $key) {
        $imageUrl = $topicImages[$key]
        break
    }
}
Write-Host "Using topic-matched header image..." -ForegroundColor Green

# Create slug and filename
$slug = $topic.title.ToLower() -replace '[^a-z0-9]+', '-' -replace '^-|-$', ''
$date = Get-Date -Format "MMM dd, yyyy"
$filename = "$slug.html"

# Generate topic-specific CTA text
function Get-TopicCTA {
    param([string]$title)
    $t = $title.ToLower()
    if ($t -match 'seo') {
        return @{ heading="Want Better Rankings for Your WordPress Site?"; subtitle="I implement technical SEO strategies that actually move the needle. Let's audit your site together."; button="Let's Talk SEO &rarr;" }
    } elseif ($t -match 'speed|performance|optimization|fast|cache') {
        return @{ heading="Is Your WordPress Site Running Slow?"; subtitle="A fast site means more conversions. I optimize databases, hosting, and code for peak performance."; button="Boost Your Site Speed &rarr;" }
    } elseif ($t -match 'gutenberg|elementor|page builder|block') {
        return @{ heading="Not Sure Which Page Builder to Choose?"; subtitle="I build with both Gutenberg and Elementor. Let me help you pick the right one for your project."; button="Get Expert Advice &rarr;" }
    } elseif ($t -match 'woocommerce|ecommerce|e-commerce|store|shop|cart|checkout|product|payment') {
        return @{ heading="Need a WooCommerce Store That Actually Works?"; subtitle="From tax setup to payment gateways — I build stores that are ready to sell from day one."; button="Start Your Store &rarr;" }
    } elseif ($t -match 'security|secure|login|hack') {
        return @{ heading="Is Your WordPress Site Secure?"; subtitle="I harden WordPress sites against attacks. Let's make sure your business is protected."; button="Secure Your Site &rarr;" }
    } elseif ($t -match 'database|sql|db') {
        return @{ heading="Is Your WordPress Database Slowing You Down?"; subtitle="A clean database means faster queries and happier users. Let me optimize yours."; button="Clean Up Your DB &rarr;" }
    } elseif ($t -match 'theme|template|design') {
        return @{ heading="Need a Custom WordPress Theme?"; subtitle="I build fast, beautiful themes tailored to your brand. Let's create something unique."; button="Build Your Theme &rarr;" }
    } elseif ($t -match 'plugin|custom|code|php|api') {
        return @{ heading="Need Custom WordPress Development?"; subtitle="From plugins to REST APIs — I build solutions that extend WordPress beyond limits."; button="Let's Build It &rarr;" }
    } elseif ($t -match 'migration|move|backup') {
        return @{ heading="Planning a WordPress Migration?"; subtitle="I move sites safely with zero downtime. Let's handle your migration stress-free."; button="Plan Your Move &rarr;" }
    } elseif ($t -match 'membership|course|learn|education') {
        return @{ heading="Building a Membership Site?"; subtitle="I set up learning platforms and membership systems on WordPress. Let's get started."; button="Launch Your Platform &rarr;" }
    } else {
        return @{ heading="Need a WordPress Expert on Your Side?"; subtitle="I build custom WordPress solutions that help businesses grow. Let's discuss what you need."; button="Get in Touch &rarr;" }
    }
}

$cta = Get-TopicCTA -title $topic.title

# Generate HTML
$html = Create-BlogHTML -title $topic.title -date $date -readTime $topic.read -content $content -imageUrl $imageUrl -slug $slug -ctaHeading $cta.heading -ctaSubtitle $cta.subtitle -ctaButton $cta.button

# Save file
$filePath = Join-Path $BlogDir $filename
$html | Out-File -FilePath $filePath -Encoding UTF8
Write-Host "Saved: blog/$filename" -ForegroundColor Green

# Update homepage
Write-Host "Updating homepage..." -ForegroundColor Yellow
Update-HomepageBlog -title $topic.title -date $date -readTime $topic.read -slug $slug -description "$($topic.cat) development guide covering best practices, code examples and real-world use cases."

# Update blog listing page
Write-Host "Updating blog listing page..." -ForegroundColor Yellow
$blogHtmlPath = "D:\xampp\htdocs\portfolio\blog.html"
$blogContent = Get-Content $blogHtmlPath -Raw -Encoding UTF8

# Create new blog card for listing page
$listCard = @"
          <article class="blog-card reveal">
            <div class="date">$date &middot; $($topic.read) read</div>
            <h3><a href="blog/$slug.html">$($topic.title)</a></h3>
            <p>$($topic.cat) development guide covering best practices, code examples and real-world use cases.</p>
            <a class="read-more" href="blog/$slug.html">Read more &rarr;</a>
          </article>
"@

# Use marker comments for reliable insertion
$blogStartMarker = "<!-- BLOG_CARDS_START -->"
$blogEndMarker = "<!-- BLOG_CARDS_END -->"
$blogStartIdx = $blogContent.IndexOf($blogStartMarker)
$blogEndIdx = $blogContent.IndexOf($blogEndMarker)

if ($blogStartIdx -gt 0 -and $blogEndIdx -gt $blogStartIdx) {
    # Extract existing cards between markers
    $between = $blogContent.Substring($blogStartIdx + $blogStartMarker.Length, $blogEndIdx - $blogStartIdx - $blogStartMarker.Length)
    $existingCards = [regex]::Matches($between, '<article class="blog-card reveal">[\s\S]*?</article>')

    # Build new content: new card + all existing cards
    $newBetween = "`n" + $listCard
    foreach ($card in $existingCards) {
        # Ensure consistent indentation
        $cardText = $card.Value -replace '^\s+', '          '
        $newBetween += "`n" + $cardText
    }

    # Replace between markers
    $blogContent = $blogContent.Substring(0, $blogStartIdx + $blogStartMarker.Length) + $newBetween + "`n          " + $blogContent.Substring($blogEndIdx)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($blogHtmlPath, $blogContent, $utf8NoBom)

# Git commit and push
Write-Host "Committing to GitHub..." -ForegroundColor Yellow
Set-Location "D:\xampp\htdocs\portfolio"
$gitExe = "git"
& $gitExe add .
& $gitExe commit -m "blog: auto-published - $($topic.title)"
& $gitExe push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Blog published successfully!" -ForegroundColor Green
Write-Host "  Title: $($topic.title)" -ForegroundColor Green
Write-Host "  File: blog/$filename" -ForegroundColor Green
Write-Host "  Cost: FREE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Send success email
Send-EmailNotification -status "success" -title $topic.title -filename "blog/$filename" -url "$SiteUrl/blog/$filename"