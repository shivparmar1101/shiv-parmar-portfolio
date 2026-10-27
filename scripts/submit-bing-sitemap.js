#!/usr/bin/env node
/**
 * Bing Webmaster Sitemap Submitter (FREE)
 *
 * Submits sitemap.xml to Bing Webmaster Tools via JSON API.
 * Free API key: https://www.bing.com/webmasters -> Settings -> API Access
 *
 * Env: BING_WEBMASTER_API_KEY (optional). If unset -> skips gracefully (exit 0).
 *      GSC_SITE_URL / BING_SITE_URL defaults to Netlify site.
 * Bing also reads IndexNow (already in your pipeline) - this is an extra direct push.
 *
 * Run: node scripts/submit-bing-sitemap.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const SITE_URL = (process.env.BING_SITE_URL || process.env.GSC_SITE_URL || 'https://shiv-parmar-portfolio.netlify.app/').replace(/\/*$/, '/');
const SITEMAP_URL = SITE_URL + 'sitemap.xml';
const DRY = process.argv.includes('--dry-run');

function submitSitemap(apiKey) {
  const payload = JSON.stringify({ siteUrl: SITE_URL, sitemapUrl: SITEMAP_URL });
  return new Promise(resolve => {
    const options = {
      hostname: 'ssl.bing.com',
      path: '/webmaster/api.svc/json/SubmitSitemap?apikey=' + encodeURIComponent(apiKey),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 20000
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 300) }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.write(payload);
    req.end();
  });
}

async function main() {
  const apiKey = process.env.BING_WEBMASTER_API_KEY;
  console.log('=== Bing Webmaster Sitemap Submit ===');
  console.log(`Site: ${SITE_URL}`);
  console.log(`Sitemap: ${SITEMAP_URL}`);

  if (DRY) { console.log('(dry run - no request sent)'); return; }
  if (!apiKey || !apiKey.trim()) {
    console.log('BING_WEBMASTER_API_KEY not set - skipping (free key: bing.com/webmasters > Settings > API Access)');
    process.exit(0); // never fail CI when not configured
  }

  const r = await submitSitemap(apiKey.trim());
  console.log(`HTTP ${r.status} - ${r.body}`);
  if (r.status === 200 || r.status === 201) {
    console.log('SUCCESS: sitemap submitted to Bing');
    process.exit(0);
  }
  console.log('WARN: Bing did not return success (check API key + site verified in Bing Webmaster)');
  process.exit(0); // don't fail the build for a third-party API hiccup
}

if (require.main === module) main();
