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
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$title — Shiv Parmar</title>
<meta name="description" content="$title - WordPress development guide by Shiv Parmar.">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#f7f8fc;--bg-2:#fff;--bg-soft:#eef0f5;--ink:#0d1321;--muted:#5b6478;--line:#e4e8f0;--accent:#2456f0;--accent-soft:#eef1ff;--radius:14px;--container:720px}
html[data-theme="dark"]{--bg:#0d1321;--bg-2:#141b2e;--bg-soft:#1b2440;--ink:#eef2ff;--muted:#9aa5c0;--line:#26324d;--accent:#5b8cff;--accent-soft:#182450}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.container{max-width:var(--container);margin:0 auto;padding:0 24px}
header{padding:24px 0;border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between}
.logo{font-weight:800;font-size:19px;color:var(--ink);text-decoration:none}.logo span{color:var(--accent)}
.back{font-size:14px;font-weight:500;color:var(--muted)}
.back:hover{color:var(--accent);text-decoration:none}
.theme-btn{width:38px;height:38px;border-radius:50%;border:1.5px solid var(--line);background:var(--bg-2);color:var(--ink);font-size:16px;cursor:pointer;display:grid;place-items:center}
article{padding:64px 0}
.date{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--muted);margin-bottom:12px}
h1{font-size:clamp(28px,4vw,40px);font-weight:800;line-height:1.2;margin-bottom:24px}
.lead{font-size:18px;color:var(--muted);margin-bottom:40px;max-width:600px}
.content{font-size:16px;color:var(--ink)}
.content h2{font-size:22px;font-weight:700;margin:40px 0 16px;color:var(--ink)}
.content h3{font-size:18px;font-weight:600;margin:32px 0 12px;color:var(--ink)}
.content p{margin-bottom:16px;color:var(--muted)}
.content ul,.content ol{margin:0 0 16px 24px;color:var(--muted)}
.content li{margin-bottom:8px}
.content code{font-family:'JetBrains Mono',monospace;background:var(--bg-soft);padding:2px 8px;border-radius:6px;font-size:14px}
.content pre{background:var(--ink);color:#c7d2fe;padding:20px;border-radius:var(--radius);overflow-x:auto;margin:0 0 24px;font-size:14px;line-height:1.6}
.content pre code{background:none;padding:0;color:inherit}
.content blockquote{border-left:3px solid var(--accent);padding:16px 20px;background:var(--accent-soft);border-radius:0 var(--radius) var(--radius) 0;margin:0 0 24px;color:var(--muted)}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:40px;padding-top:24px;border-top:1px solid var(--line)}
.tag{font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;background:var(--accent-soft);color:var(--accent)}
footer{border-top:1px solid var(--line);padding:32px 0;text-align:center;color:var(--muted);font-size:14px}
.hero-img{width:100%;height:360px;object-fit:cover;border-radius:var(--radius);margin-bottom:32px}
@media(max-width:640px){article{padding:40px 0}h1{font-size:24px}.hero-img{height:200px}}
</style>
</head>
<body>
<header><div class="container nav"><a class="logo" href="../">shiv<span>.</span>parmar</a><div style="display:flex;gap:16px;align-items:center"><a class="back" href="../">← Back to Portfolio</a><button class="theme-btn" onclick="toggleTheme()">🌙</button></div></div></header>
<article><div class="container">
<img src="$imageUrl" alt="$title" class="hero-img">
<div class="date">$date · $readTime read</div>
<h1>$title</h1>
<div class="content">
$content
</div>
<div class="tags"><span class="tag">WordPress</span><span class="tag">Development</span></div>
</div></article>
<footer><div class="container">© $(Get-Date -Format 'yyyy') Shiv Parmar · WordPress Developer</div></footer>
<script>
function toggleTheme(){const t=document.documentElement.getAttribute("data-theme");document.documentElement.setAttribute("data-theme",t==="dark"?"light":"dark")}
</script>
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
    $content = Get-Content $indexPath -Raw

    # Create new blog card
    $newCard = @"
          <article class="blog-card reveal">
            <div class="date">$date &middot; $readTime read</div>
            <h3><a href="blog/$slug.html">$title</a></h3>
            <p>$description</p>
            <a class="read-more" href="blog/$slug.html">Read more &rarr;</a>
          </article>
"@

    # Find the grid-3 div and add new card at the beginning
    $content = $content -replace '(<div class="grid-3">[\s\S]*?<article class="blog-card reveal">)', "`$1`n$newCard"

    # Remove the last blog card if more than 3
    $cards = [regex]::Matches($content, '<article class="blog-card reveal">[\s\S]*?</article>')
    if ($cards.Count -gt 3) {
        $lastCard = $cards[$cards.Count - 1]
        $content = $content.Remove($lastCard.Index, $lastCard.Length)
    }

    Set-Content -Path $indexPath -Value $content -Encoding UTF8
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

# Select random topic
$topic = $topics | Get-Random
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
Update-HomepageBlog -blogDir $BlogDir -title $topic.title -date $date -readTime $topic.readTime -slug $slug -description "AI-generated blog post about $($topic.title.ToLower())."

# Git commit and push
Write-Host "Committing to GitHub..." -ForegroundColor Yellow
Set-Location "D:\xampp\htdocs\portfolio"
$gitExe = "C:\Users\Krunal\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"
& $gitExe add .
& $gitExe commit -m "blog: auto-published - $topic.title"
& $gitExe push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Blog published successfully!" -ForegroundColor Green
Write-Host "  Title: $($topic.title)" -ForegroundColor Green
Write-Host "  File: blog/$filename" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green