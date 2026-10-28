# Email Notification Setup Guide

## Overview
When you publish a blog post, you'll receive an email with:
- Blog title
- Blog description
- Blog URL (direct link)

---

## Setup Options

### Option 1: GitHub Actions (Recommended - Free)

This sends email automatically when you push to GitHub.

#### Step 1: Create Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy the 16-character password

#### Step 2: Add GitHub Secrets

1. Go to your GitHub repo: https://github.com/shivparmar1101/shiv-parmar-portfolio
2. Click "Settings" -> "Secrets and variables" -> "Actions"
3. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `EMAIL_USERNAME` | parmarshiv1101@gmail.com |
| `EMAIL_PASSWORD` | (your 16-char app password) |
| `EMAIL_TO` | parmarshiv1101@gmail.com |
| `EMAIL_FROM` | parmarshiv1101@gmail.com |

#### Step 3: Test

1. Push a blog post to GitHub
2. Check your email for notification

---

### Option 2: Local Script (Quick Test)

#### Step 1: Install Nodemailer

```bash
npm install nodemailer
```

#### Step 2: Set Environment Variable

```bash
# Windows PowerShell
$env:EMAIL_PASSWORD="your-16-char-app-password"

# Windows CMD
set EMAIL_PASSWORD=your-16-char-app-password
```

#### Step 3: Run Script

```bash
node scripts/publish-blog.js wordpress-ai-integration-guide-2026
```

---

## Quick Publish Commands

### Publish Blog (Full Process)

```bash
# Method 1: Quick publish (git add + commit + push + email)
npm run blog:quick [blog-slug]

# Method 2: Manual steps
npm run blog:publish [blog-slug]
git add .
git commit -m "Add blog: [title]"
git push
```

### Check Blog SEO

```bash
npm run blog:check
```

### List All Blogs

```bash
npm run blog:list
```

---

## Email Template Preview

When a blog is published, you'll receive an email like this:

```
┌─────────────────────────────────────────┐
│         New Blog Published!             │
├─────────────────────────────────────────┤
│  [Just Published Badge]                 │
│                                         │
│  How to Add AI to WordPress:           │
│  Complete Guide 2026                    │
│                                         │
│  Learn how to integrate AI into your   │
│  WordPress website with this step-by-  │
│  step guide.                            │
│                                         │
│  URL:                                   │
│  https://shiv-parmar-portfolio.netlify  │
│  .app/blog/wordpress-ai-guide-2026     │
│                                         │
│  [Read Blog →]                          │
│                                         │
├─────────────────────────────────────────┤
│  Shiv Parmar - WordPress Developer     │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### Email not sending?

1. Check if Gmail App Password is correct
2. Verify GitHub secrets are set correctly
3. Check GitHub Actions tab for errors

### Wrong email address?

Update secrets:
- `EMAIL_TO` = your email address
- `EMAIL_FROM` = your Gmail address

### Want different email template?

Edit: `.github/workflows/blog-email-notification.yml`
- Find `html_body` section
- Modify the HTML template

---

## Workflow Summary

```
1. Write blog post (2000+ words)
2. Add 2 CTA buttons + 1 image
3. Save as blog/[slug].html
4. Update blog.html with new card
5. Run: npm run blog:quick [slug]
6. Check email for confirmation
7. Netlify auto-deploys in ~30 seconds
8. Blog is live!
```
