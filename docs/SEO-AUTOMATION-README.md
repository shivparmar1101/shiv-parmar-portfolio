# SEO Automation System

## How It Works

This system runs automatically via GitHub Actions. No need to keep your computer on!

### Automated Workflows:

1. **SEO Monitor** (`seo-monitor.yml`)
   - Runs: **Daily at 6 AM UTC** (11:30 AM IST)
   - Checks: Google Search Console performance (clicks, impressions, CTR, position, top queries/pages) vs the previous 7 days
   - Generates: `reports/SEO-REPORT.md` + `seo-data/gsc-performance.json` (committed to the repo)

2. **GSC Indexing** (`gsc-indexing.yml`)
   - Runs: **Daily at 7 AM UTC**
   - Checks: submits `sitemap.xml` and inspects up to 30 URLs (recent changes first, then a rotation over the rest of the sitemap)
   - Generates: `seo-data/gsc-status.json` (committed to the repo)
   - Unindexed URLs are a warning, never a failure - Google has no "request indexing" API

3. **Request Indexing** (`request-indexing.yml`)
   - Runs: **Daily at 7:45 AM UTC**
   - Pushes the newest 10 URLs to Google's Indexing API (best effort)

4. **Monthly Trend Titles** (`monthly-trend-titles.yml`)
   - Runs: **1st of every month at 4:30 AM UTC** (10:00 AM IST)
   - Builds a month of WordPress titles from Google Trends / Google News / Autocomplete
   - Skips anything already published or queued, then appends to `blog-queue.json`
   - Generates: `docs/TREND-PLAN-YYYY-MM.md` (review calendar) - see `docs/MONTHLY-TREND-WORKFLOW.md`

5. **Auto Blog Publisher** (`auto-blog-publisher.yml`)
   - Runs: **Twice a day, 3 AM and 3 PM IST**
   - Writes and publishes the next pending title from `blog-queue.json`, then submits the sitemap to Search Console

6. **Keyword Tracker** (`keyword-tracker.yml`)
   - Runs: **Every Monday at 7 AM UTC** (12:30 PM IST)
   - Tracks: Keyword rankings and positions
   - Generates: Keyword tracking report

7. **Content Check** (`content-check.yml`)
   - Runs: **On every push to main**
   - Validates: HTML SEO, blog posts, schema markup
   - Generates: Validation report

### How to Run Manually:

#### From GitHub:
1. Go to your repository: https://github.com/shivparmar1101/shiv-parmar-portfolio
2. Click "Actions" tab
3. Select workflow (SEO Monitor / Keyword Tracker)
4. Click "Run workflow"

#### From Command Line:
```bash
# Install dependencies
npm install

# Run all SEO checks
npm run seo:all

# Run individual checks
npm run seo:audit
npm run seo:meta
npm run seo:sitemap
npm run seo:speed
npm run seo:keywords
npm run seo:competitors
npm run seo:report
```

### Where to Find Reports:

1. **In the repository (committed daily):**
   - `reports/SEO-REPORT.md` - Search Console performance (SEO Monitor)
   - `seo-data/gsc-status.json` - index status per URL (GSC Indexing)
   - `docs/TREND-PLAN-YYYY-MM.md` - monthly title plan (Monthly Trend Titles)

2. **GitHub Actions Artifacts:**
   - Go to Actions tab
   - Click on completed workflow run
   - Download the report artifact (kept 30-90 days)

3. **Local Files:**
   - Reports: `reports/` directory
   - Data: `seo-data/` directory

### What Gets Checked:

| Check | Frequency | What It Does |
|-------|-----------|--------------|
| SEO Audit | Daily | Checks all pages for SEO issues |
| Meta Tags | Daily | Validates title, description, keywords |
| Sitemap | Daily | Validates sitemap.xml |
| Page Speed | Daily | Checks file sizes and performance |
| Keyword Tracking | Weekly | Tracks keyword rankings |
| Competitor Analysis | Weekly | Analyzes competitor presence |
| HTML Validation | On push | Validates HTML structure |
| Blog SEO | On push | Checks all blog posts |

### Reports Generated:

- `seo-audit-YYYY-MM-DD.json` - Full SEO audit
- `meta-tags-YYYY-MM-DD.json` - Meta tags analysis
- `sitemap-validation-YYYY-MM-DD.json` - Sitemap validation
- `performance-YYYY-MM-DD.json` - Performance check
- `keyword-tracking-YYYY-MM-DD.json` - Keyword tracking
- `competitor-analysis-YYYY-MM-DD.json` - Competitor analysis
- `comprehensive-report-YYYY-MM-DD.json` - Combined report
- `SEO-REPORT-YYYY-MM-DD.md` - Human-readable report

### Setup Instructions:

1. Ensure GitHub Actions is enabled for your repository
2. The workflows will start running automatically
3. Check the "Actions" tab to see workflow runs
4. Download reports from artifacts

### Troubleshooting:

If workflows fail:
1. Check the Actions tab for error messages
2. Ensure all HTML files are valid
3. Check if dependencies install correctly
4. Verify file paths in scripts

---

*Last updated: September 18, 2026*
