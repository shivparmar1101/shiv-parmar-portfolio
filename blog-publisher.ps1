# Blog Auto-Publisher
# Generates AI blog posts every hour using OpenAI API
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
    @{title="How to Create WordPress Custom Post Types"; cat="WordPress"; read="5 min"},
    @{title="WooCommerce Inventory Management Tips"; cat="WooCommerce"; read="4 min"},
    @{title="WordPress Migration Guide: Shared to VPS"; cat="WordPress"; read="6 min"},
    @{title="How to Add Schema Markup to WordPress"; cat="SEO"; read="5 min"},
    @{title="WooCommerce Email Template Customization"; cat="WooCommerce"; read="5 min"}
)

function Generate-BlogPost {
    param(
        [string]$apiKey,
        [hashtable]$topic
    )

    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }

    $prompt = @"
Write a professional WordPress development blog post about: $($topic.title)

Requirements:
- Write in first person as Shiv Parmar, a WordPress Developer from Rajkot, India
- Include practical code examples where relevant
- Use HTML formatting with h2, h3, p, code, pre, ul, ol tags
- Make it informative and actionable
- Include a blockquote with a key insight
- Length: 800-1200 words
- Tone: Professional but friendly

Return ONLY the blog content HTML (inside the .content div), no full HTML document.
"@

    $body = @{
        model = "gpt-4o-mini"
        messages = @(
            @{role="system"; content="You are a WordPress developer writing technical blog posts."},
            @{role="user"; content=$prompt}
        )
        max_tokens = 2000
        temperature = 0.7
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "https://api.openai.com/v1/chat/completions" -Method Post -Headers $headers -Body $body
        return $response.choices[0].message.content
    } catch {
        Write-Host "Error generating content: $_" -ForegroundColor Red
        return $null
    }
}

function Generate-Image {
    param(
        [string]$apiKey,
        [string]$prompt
    )

    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }

    $body = @{
        model = "dall-e-3"
        prompt = "Professional blog header image: $prompt. Modern, clean, dark theme, abstract tech style, no text."
        n = 1
        size = "1792x1024"
        quality = "standard"
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "https://api.openai.com/v1/images/generations" -Method Post -Headers $headers -Body $body
        return $response.data[0].url
    } catch {
        Write-Host "Error generating image: $_" -ForegroundColor Red
        return $null
    }
}

function Create-BlogHTML {
    param(
        [string]$title,
        [string]$date,
        [string]$readTime,
        [string]$content,
        [string]$imageUrl,
        [string]$slug
    )

    $html = @"
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$title — Shiv Parmar</title>
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
.blog-header .theme-btn{width:38px;height:38px;border-radius:50%;border:1.5px solid var(--border-glass);background:var(--bg-glass);color:var(--text-primary);font-size:16px;cursor:pointer;display:grid;place-items:center}
article{padding:64px 0}
.date{font-family:var(--font-mono);font-size:13px;color:var(--text-muted);margin-bottom:12px}
h1{font-family:var(--font-primary);font-size:clamp(28px,4vw,40px);font-weight:800;line-height:1.2;margin-bottom:24px;color:var(--text-primary)}
.content{font-size:16px;color:var(--text-primary);font-family:var(--font-primary)}
.content h2{font-size:22px;font-weight:700;margin:40px 0 16px;color:var(--text-primary)}
.content h3{font-size:18px;font-weight:600;margin:32px 0 12px;color:var(--text-primary)}
.content p{margin-bottom:16px;color:var(--text-secondary)}
.content ul,.content ol{margin:0 0 16px 24px;color:var(--text-secondary)}
.content li{margin-bottom:8px}
.content code{font-family:var(--font-mono);background:var(--bg-glass-strong);padding:2px 8px;border-radius:6px;font-size:14px}
.content pre{background:#0d0d0d;color:#c7d2fe;padding:20px;border-radius:var(--radius-lg);border:1px solid var(--border-glass);overflow-x:auto;margin:0 0 24px;font-size:14px;line-height:1.6}
.content pre code{background:none;padding:0;color:inherit}
.content blockquote{border-left:4px solid #c9a84c;padding:0 0 0 15px;margin:20px 0;font-style:italic;color:#fff;background:transparent;border-radius:0}
.content blockquote em{color:#fff}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:40px;padding:24px 0;border-top:1px solid var(--border-glass)}
.tag{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;background:var(--accent-glow-soft);color:var(--accent)}
.hero-img{width:100%;height:360px;object-fit:cover;border-radius:var(--radius-lg);margin-bottom:32px;border:1px solid var(--border-glass)}
.blog-footer{border-top:1px solid var(--border-glass);padding:32px 0;text-align:center;color:var(--text-muted);font-size:14px;font-family:var(--font-primary)}
.blog-footer .foot-inner{display:flex;justify-content:space-between;align-items:center}
select option{background:#111;color:#f0f0f0;padding:8px}
@media(max-width:640px){article{padding:40px 0}h1{font-size:24px}.hero-img{height:200px}.blog-footer .foot-inner{flex-direction:column;gap:12px}}
</style>
</head>
<body>
  <div id="site-header"></div>
<article><div class="container">
<img src="$imageUrl" alt="$title" title="$title" class="hero-img">
<div class="date">$date · $readTime read</div>
<h1>$title</h1>
<div class="content">
$content
</div>
<div class="tags"><span class="tag">WordPress</span><span class="tag">Development</span></div>
</div></article>

<section style="padding:64px 0;border-top:1px solid var(--border-glass)">
  <div class="container">
    <div style="max-width:600px;margin:0 auto;text-align:center">
      <p class="eyebrow" style="color:var(--accent)">Contact</p>
      <h2 style="font-family:var(--font-primary);font-size:clamp(24px,3vw,32px);font-weight:800;margin-bottom:12px;color:var(--text-primary)">Let's Work Together</h2>
      <p style="color:var(--text-muted);margin-bottom:32px;font-family:var(--font-primary)">Have a project in mind? Send me a message and I'll get back within 24 hours.</p>
      <form id="blogContactForm" novalidate style="text-align:left">
        <div style="margin-bottom:16px">
          <label for="bc-name" style="display:block;font-size:14px;font-weight:600;margin-bottom:6px;color:var(--text-primary);font-family:var(--font-primary)">Full Name *</label>
          <input type="text" id="bc-name" name="name" placeholder="John Doe" required style="width:100%;padding:12px 16px;border:1.5px solid var(--border-glass);border-radius:8px;font-size:14px;background:var(--bg-glass);color:var(--text-primary);font-family:var(--font-primary)">
        </div>
        <div style="margin-bottom:16px">
          <label for="bc-email" style="display:block;font-size:14px;font-weight:600;margin-bottom:6px;color:var(--text-primary);font-family:var(--font-primary)">Email Address *</label>
          <input type="email" id="bc-email" name="email" placeholder="john@example.com" required style="width:100%;padding:12px 16px;border:1.5px solid var(--border-glass);border-radius:8px;font-size:14px;background:var(--bg-glass);color:var(--text-primary);font-family:var(--font-primary)">
        </div>
        <div style="margin-bottom:16px">
          <label for="bc-phone" style="display:block;font-size:14px;font-weight:600;margin-bottom:6px;color:var(--text-primary);font-family:var(--font-primary)">Phone Number</label>
          <input type="tel" id="bc-phone" name="phone" placeholder="+91 00000 00000" style="width:100%;padding:12px 16px;border:1.5px solid var(--border-glass);border-radius:8px;font-size:14px;background:var(--bg-glass);color:var(--text-primary);font-family:var(--font-primary)">
        </div>
        <div style="margin-bottom:16px">
          <label for="bc-subject" style="display:block;font-size:14px;font-weight:600;margin-bottom:6px;color:var(--text-primary);font-family:var(--font-primary)">Subject *</label>
          <select id="bc-subject" name="subject" required style="width:100%;padding:12px 16px;border:1.5px solid var(--border-glass);border-radius:8px;font-size:14px;background:rgba(0,0,0,0.6);color:var(--text-primary);font-family:var(--font-primary)">
            <option value="" disabled selected>Select an inquiry type</option>
            <option value="General Inquiry">General Inquiry</option>
            <option value="Project Request">Project Request</option>
            <option value="Collaboration">Collaboration</option>
            <option value="Freelance Work">Freelance Work</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style="margin-bottom:16px">
          <label for="bc-budget" style="display:block;font-size:14px;font-weight:600;margin-bottom:6px;color:var(--text-primary);font-family:var(--font-primary)">Budget Range</label>
          <select id="bc-budget" name="budget" style="width:100%;padding:12px 16px;border:1.5px solid var(--border-glass);border-radius:8px;font-size:14px;background:rgba(0,0,0,0.6);color:var(--text-primary);font-family:var(--font-primary)">
            <option value="" disabled selected>Select budget range</option>
            <option value="Under Rs.10,000">Under Rs.10,000</option>
            <option value="Rs.10,000 - Rs.25,000">Rs.10,000 - Rs.25,000</option>
            <option value="Rs.25,000 - Rs.50,000">Rs.25,000 - Rs.50,000</option>
            <option value="Rs.50,000 - Rs.1,00,000">Rs.50,000 - Rs.1,00,000</option>
            <option value="Above Rs.1,00,000">Above Rs.1,00,000</option>
          </select>
        </div>
        <div style="margin-bottom:16px">
          <label for="bc-message" style="display:block;font-size:14px;font-weight:600;margin-bottom:6px;color:var(--text-primary);font-family:var(--font-primary)">Project Details *</label>
          <textarea id="bc-message" name="message" rows="5" placeholder="Tell me about your project, goals, and timeline..." required style="width:100%;padding:12px 16px;border:1.5px solid var(--border-glass);border-radius:8px;font-size:14px;background:var(--bg-glass);color:var(--text-primary);font-family:var(--font-primary);resize:vertical"></textarea>
        </div>
        <button type="submit" style="width:100%;padding:14px;background:var(--accent);color:#000;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;font-family:var(--font-primary)">Send Message <span>&rarr;</span></button>
        <p id="bc-formStatus" style="text-align:center;margin-top:12px;font-size:14px;color:var(--text-muted)">Your message will be sent directly to my email &mdash; I'll respond within 24 hours.</p>
      </form>
    </div>
  </div>
</section>

<footer class="blog-footer"><div class="container foot-inner"><span>&copy; $(Get-Date -Format 'yyyy') Shiv Parmar &middot; WordPress Developer</span><span>Full-time &middot; Contract &middot; Remote</span></div></footer>
<script src="../script.js"></script>
<script>
function toggleTheme(){const t=document.documentElement.getAttribute("data-theme");document.documentElement.setAttribute("data-theme",t==="dark"?"light":"dark")}

const bcForm = document.getElementById("blogContactForm");
if(bcForm){
  bcForm.addEventListener("submit", async(e)=>{
    e.preventDefault();
    const btn = bcForm.querySelector("button[type=submit]");
    const status = document.getElementById("bc-formStatus");
    btn.textContent = "Sending..."; btn.disabled = true;
    try{
      await fetch("https://script.google.com/macros/s/AKfycbz1y8bYxZMjHM03gnyuV9GPKxNTcG4AfgVT6A6wHX9LDYbT4XkKYbeupBBBSR-bHJ-HjQ/exec",{
        method:"POST", mode:"no-cors",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          name:document.getElementById("bc-name").value.trim(),
          email:document.getElementById("bc-email").value.trim(),
          phone:document.getElementById("bc-phone").value.trim(),
          subject:document.getElementById("bc-subject").value,
          budget:document.getElementById("bc-budget").value,
          message:document.getElementById("bc-message").value.trim(),
          pageUrl:window.location.href
        })
      });
      status.textContent = "Message sent! I'll get back within 24 hours.";
      status.style.color = "#22c55e";
      bcForm.reset();
    }catch(err){
      status.textContent = "Something went wrong. Please try again.";
      status.style.color = "#ef4444";
    }
    btn.textContent = "Send Message"; btn.disabled = false;
  });
}
</script>
<div id="site-footer"></div>
<script src="../includes.js"></script><script src="../script.js"></script>
</body>
</html>
"@

    return $html
}

function Update-HomepageBlog {
    param(
        [string]$blogDir,
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

    # Find the blog section and replace all cards with just 3 latest
    $blogSection = [regex]::Match($content, '<div class="grid-3">[\s\S]*?</div>', [System.Text.RegularExpressions.RegexOptions]::Multiline)
    
    if ($blogSection.Success) {
        # Get existing blog cards
        $existingCards = [regex]::Matches($blogSection.Value, '<article class="blog-card reveal">[\s\S]*?</article>')
        
        # Build new grid with new card first, then take first 2 existing cards
        $newGrid = '<div class="grid-3">'
        $newGrid += "`n" + $newCard
        
        $count = 0
        foreach ($card in $existingCards) {
            if ($count -lt 2) {
                $newGrid += "`n" + $card.Value
                $count++
            }
        }
        $newGrid += "`n" + '</div>'
        
        # Replace the old grid with new one
        $content = $content.Substring(0, $blogSection.Index) + $newGrid + $content.Substring($blogSection.Index + $blogSection.Length)
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($indexPath, $content, $utf8NoBom)
}

# Main execution
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Blog Auto-Publisher" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check API key
if (-not $ApiKey) {
    $ApiKey = $env:OPENAI_API_KEY
}

if (-not $ApiKey) {
    Write-Host "ERROR: No API key provided!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Set environment variable: OPENAI_API_KEY"
    Write-Host "  2. Pass parameter: .\blog-publisher.ps1 -ApiKey 'sk-...'"
    Write-Host ""
    Write-Host "Get your API key at: https://platform.openai.com/api-keys" -ForegroundColor Yellow
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
Write-Host "Generating blog content..." -ForegroundColor Yellow
$content = Generate-BlogPost -apiKey $ApiKey -topic $topic

if (-not $content) {
    Write-Host "Failed to generate content!" -ForegroundColor Red
    exit 1
}

Write-Host "Content generated! ($($content.Length) chars)" -ForegroundColor Green

# Generate image
Write-Host "Generating header image..." -ForegroundColor Yellow
$imageUrl = Generate-Image -apiKey $ApiKey -prompt "$($topic.title), WordPress, web development, coding"

if (-not $imageUrl) {
    Write-Host "Using placeholder image..." -ForegroundColor Yellow
    $imageUrl = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop"
}

Write-Host "Image ready!" -ForegroundColor Green

# Create slug and filename
$slug = $topic.title.ToLower() -replace '[^a-z0-9]+', '-' -replace '^-|-$', ''
$date = Get-Date -Format "MMM yyyy"
$filename = "$slug.html"

# Generate HTML
$html = Create-BlogHTML -title $topic.title -date $date -readTime $topic.readTime -content $content -imageUrl $imageUrl -slug $slug

# Save file
$filePath = Join-Path $BlogDir $filename
$html | Out-File -FilePath $filePath -Encoding UTF8
Write-Host "Saved: $filename" -ForegroundColor Green

# Update homepage
Write-Host "Updating homepage..." -ForegroundColor Yellow
Update-HomepageBlog -blogDir $BlogDir -title $topic.title -date $date -readTime $topic.readTime -slug $slug -description "$($topic.cat) development guide covering best practices, code examples and real-world use cases."

# Update blog listing page
Write-Host "Updating blog listing page..." -ForegroundColor Yellow
$blogHtmlPath = "D:\xampp\htdocs\portfolio\blog.html"
$blogContent = Get-Content $blogHtmlPath -Raw -Encoding UTF8

$listCard = @"
          <article class="blog-card reveal">
            <div class="date">$date &middot; $($topic.readTime) read</div>
            <h3><a href="blog/$slug.html">$($topic.title)</a></h3>
            <p>$($topic.cat) development guide covering best practices, code examples and real-world use cases.</p>
            <a class="read-more" href="blog/$slug.html">Read more &rarr;</a>
          </article>
"@

$blogStartMarker = "<!-- BLOG_CARDS_START -->"
$blogEndMarker = "<!-- BLOG_CARDS_END -->"
$blogStartIdx = $blogContent.IndexOf($blogStartMarker)
$blogEndIdx = $blogContent.IndexOf($blogEndMarker)

if ($blogStartIdx -gt 0 -and $blogEndIdx -gt $blogStartIdx) {
    $between = $blogContent.Substring($blogStartIdx + $blogStartMarker.Length, $blogEndIdx - $blogStartIdx - $blogStartMarker.Length)
    $existingCards = [regex]::Matches($between, '<article class="blog-card reveal">[\s\S]*?</article>')

    $newBetween = "`n" + $listCard
    foreach ($card in $existingCards) {
        $newBetween += "`n" + $card.Value
    }

    $blogContent = $blogContent.Substring(0, $blogStartIdx + $blogStartMarker.Length) + $newBetween + "`n          " + $blogContent.Substring($blogEndIdx)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($blogHtmlPath, $blogContent, $utf8NoBom)

# Git commit and push
Write-Host "Committing to GitHub..." -ForegroundColor Yellow
Set-Location "D:\xampp\htdocs\portfolio"
$gitExe = "git"
& $gitExe add .
& $gitExe commit -m "blog: auto-published - $topic.title"
& $gitExe push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Blog published successfully!" -ForegroundColor Green
Write-Host "  Title: $($topic.title)" -ForegroundColor Green
Write-Host "  File: blog/$filename" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green