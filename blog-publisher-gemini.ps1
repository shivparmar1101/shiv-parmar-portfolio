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
    @{title="WooCommerce Coupon System Complete Guide"; cat="WooCommerce"; read="5 min"}
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
        $response = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=$apiKey" -Method Post -ContentType "application/json" -Body $body
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
<header><div class="container nav"><a class="logo" href="../">shiv<span>.</span>parmar</a><div style="display:flex;gap:16px;align-items:center"><a class="back" href="../">&larr; Back to Portfolio</a><button class="theme-btn" onclick="toggleTheme()">&#9790;</button></div></div></header>
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
                $newBetween += "`n" + $card.Value
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
    $configFile = Join-Path $PSScriptRoot ".api-key"
    if (Test-Path $configFile) {
        $ApiKey = (Get-Content $configFile -Raw).Trim()
    }
}

if (-not $ApiKey) {
    Write-Host "ERROR: No API key provided!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Set environment variable: GEMINI_API_KEY"
    Write-Host "  2. Pass parameter: .\blog-publisher-gemini.ps1 -ApiKey 'AIza...'"
    Write-Host ""
    Write-Host "Get your FREE API key at: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
    exit 1
}

# Select random topic
$topic = $topics | Get-Random
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

# Generate HTML
$html = Create-BlogHTML -title $topic.title -date $date -readTime $topic.read -content $content -imageUrl $imageUrl -slug $slug

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
        $newBetween += "`n" + $card.Value
    }

    # Replace between markers
    $blogContent = $blogContent.Substring(0, $blogStartIdx + $blogStartMarker.Length) + $newBetween + "`n          " + $blogContent.Substring($blogEndIdx)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($blogHtmlPath, $blogContent, $utf8NoBom)

# Git commit and push
Write-Host "Committing to GitHub..." -ForegroundColor Yellow
Set-Location "D:\xampp\htdocs\portfolio"
$gitExe = "C:\Users\Krunal\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe"
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