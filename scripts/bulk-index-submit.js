#!/usr/bin/env node
/**
 * Bulk IndexNow submitter — submits every sitemap URL to Bing/Yandex/Seznam/Naver.
 * Google does not use IndexNow, but it speeds up discovery on other engines
 * and often triggers secondary crawls.
 *
 * Usage:
 *   node scripts/bulk-index-submit.js           # submit all sitemap URLs
 *   node scripts/bulk-index-submit.js --limit=10
 *   node scripts/bulk-index-submit.js --dry-run
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const HOST = 'shiv-parmar-portfolio.netlify.app';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = (() => {
  const a = args.find(x => x.startsWith('--limit='));
  return a ? Math.max(1, parseInt(a.split('=')[1], 10) || 0) : 0;
})();

function readSitemapUrls() {
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  return (xml.match(/<loc>([^<]+)<\/loc>/g) || [])
    .map(m => m.replace(/<\/?loc>/g, '').trim());
}

function postIndexNow(urlList) {
  const payload = JSON.stringify({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList,
  });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.indexnow.org',
        path: '/indexnow',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      res => {
        let body = '';
        res.on('data', c => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  let urls = readSitemapUrls();
  if (LIMIT) urls = urls.slice(0, LIMIT);
  console.log(`IndexNow: ${urls.length} URLs -> api.indexnow.org (key ${INDEXNOW_KEY.slice(0, 8)}...)`);

  if (DRY_RUN) {
    urls.forEach(u => console.log('  ' + u));
    return 0;
  }

  // IndexNow accepts up to 10,000 URLs per request
  const res = await postIndexNow(urls);
  console.log(`Response: HTTP ${res.status} ${res.body || ''}`);
  if (res.status === 200 || res.status === 202) {
    console.log('OK — Bing/Yandex/Seznam/Naver will recrawl these URLs.');
    return 0;
  }
  console.error('IndexNow failed. Ensure https://HOST/' + INDEXNOW_KEY + '.txt is publicly reachable.');
  return 1;
}

main()
  .then(code => process.exit(code))
  .catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
