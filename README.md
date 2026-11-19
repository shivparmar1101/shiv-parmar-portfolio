# Shiv Parmar — WordPress Developer Portfolio

**https://shiv-parmar-portfolio.netlify.app**

Personal portfolio and blog of Shiv Parmar — WordPress developer focused on WooCommerce, custom themes and performance. The site is a fully static HTML/CSS/JS project deployed on Netlify, with an automated daily blog pipeline.

## What's here

- `index.html` / `about.html` / `services.html` / `contact.html` / `blog.html` — main pages
- `blog/` — 87+ long-form WordPress guides, published 1 per day by CI
- `images/` — page and post imagery (incl. generated hero SVGs)
- `scripts/` — Node utilities that maintain the site's SEO and content:
  - `auto-blog-generator.js` — generates a post from `blog-queue.json` + AI
  - `inject-internal-links.js` — refreshes the "Related reading" block in every post
  - `inject-body-links.js` — adds 1–2 contextual in-body internal links (old → new)
  - `request-indexing.js` / `gsc-indexing.js` — IndexNow + Google Indexing API on publish
  - `broken-link-check.js` — validates internal/external links
- `seo-data/` — backlink plan + tracker, GSC performance/index reports
- `.github/workflows/auto-blog-publisher.yml` — cron that publishes one post daily

## Local development

```bash
# no build step — it's a static site
npx serve .        # or just open index.html

node scripts/inject-internal-links.js       # refresh related-post blocks
node scripts/inject-body-links.js --dry-run # preview body internal links
node scripts/inject-body-links.js --apply   # apply body internal links
node scripts/broken-link-check.js           # link audit
```

## Deployment

Push to `main` → Netlify deploys automatically (`netlify.toml`, static, no build).

## SEO internals

- Every post carries `<!-- AUTO_INTERNAL_LINKS -->` — a marker-managed related-reading block
- In-body links are idempotent and capped (max 2/post, anchor + target diversity caps)
- Sitemap, RSS and GSC status reports refresh via scheduled workflows
