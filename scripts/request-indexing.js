#!/usr/bin/env node
/**
 * Google Indexing API notifier — publishes "UPDATED" urlNotifications for
 * every sitemap URL. Best-effort: Google officially documents this API for
 * JobPosting/LiveStream, but it commonly works for any verified property.
 * On 403/404 it exits 0 with a clear message so the workflow does not fail.
 *
 * Env:
 *   GSC_SERVICE_ACCOUNT  service account JSON (raw or base64)
 *   GSC_PROPERTY         optional siteUrl for logs (default domain property)
 *
 * Flags:
 *   --limit=N   publish at most N URLs
 *   --dry-run   print the plan, no API calls
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const OUTPUT_PATH = path.join(ROOT, 'seo-data', 'indexing-api-status.json');
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const INDEX_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const SCOPES = 'https://www.googleapis.com/auth/indexing';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = (() => {
  const a = args.find(x => x.startsWith('--limit='));
  return a ? Math.max(1, parseInt(a.split('=')[1], 10) || 0) : 0;
})();

const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadServiceAccount() {
  const raw = process.env.GSC_SERVICE_ACCOUNT;
  if (!raw || !raw.trim()) return null;
  let text = raw.trim();
  if (!text.startsWith('{')) {
    try { text = Buffer.from(text, 'base64').toString('utf8'); } catch (e) { /* assume JSON */ }
  }
  const sa = JSON.parse(text);
  if (!sa.client_email || !sa.private_key) throw new Error('missing client_email/private_key');
  return sa;
}

const b64url = s => Buffer.from(s).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

function createAssertion(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPES, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claims}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const sig = sign.sign(sa.private_key.replace(/\\n/g, '\n')).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${unsigned}.${sig}`;
}

async function getAccessToken(sa) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: createAssertion(sa) }).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`token request failed: HTTP ${res.status} ${data.error_description || data.error || ''}`.trim());
  }
  return data.access_token;
}

function readUrls() {
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const out = [];
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) || []) {
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    if (loc) out.push(loc.trim());
  }
  return out;
}

async function publish(token, url) {
  const res = await fetch(INDEX_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log('Google Indexing API notifier');
  const urls = readUrls();
  const targets = LIMIT ? urls.slice(0, LIMIT) : urls;
  console.log(`Sitemap URLs: ${urls.length} | to publish: ${targets.length}`);

  if (DRY_RUN) {
    targets.forEach(u => console.log(`  UPDATED ${u}`));
    return 0;
  }

  let sa = null;
  try { sa = loadServiceAccount(); } catch (e) { console.error(`ERROR: ${e.message}`); return 1; }
  if (!sa) {
    console.log('SKIP: GSC_SERVICE_ACCOUNT not set - nothing published.');
    return 0;
  }

  let token;
  try {
    token = await getAccessToken(sa);
    console.log(`Authenticated: ${sa.client_email}\n`);
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    return 1;
  }

  const results = [];
  let forbidden = 0;
  for (let i = 0; i < targets.length; i++) {
    const url = targets[i];
    const r = await publish(token, url);
    if (r.ok) {
      results.push({ url, status: r.status, ok: true, notification: (r.data && r.data.urlNotificationMetadata && r.data.urlNotificationMetadata.latestUpdate) || null });
      console.log(`  OK       ${url}`);
    } else {
      forbidden = (r.status === 403 || r.status === 404) ? forbidden + 1 : forbidden;
      results.push({ url, status: r.status, ok: false, error: r.data });
      console.log(`  FAIL(${r.status}) ${url}`);
    }
    if (r.status === 429) {
      console.warn('Rate limited (429) - stopping early.');
      break;
    }
    await sleep(350);
  }

  const ok = results.filter(r => r.ok).length;
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), total: targets.length, published: ok, results }, null, 2));

  console.log(`\nPublished: ${ok}/${results.length} | report: seo-data/indexing-api-status.json`);
  if (forbidden === results.length && results.length > 0) {
    console.log('\nIndexing API returned 403/404 for every URL.');
    console.log('Likely causes: API not enabled on the project, or service account not a property user.');
    console.log('This is non-fatal - Google still discovers URLs via sitemap + URL Inspection.');
    return 0;
  }
  return 0;
}

if (require.main === module) {
  main().then(code => process.exit(code)).catch(err => {
    console.error('Fatal:', err.message || err);
    process.exit(1);
  });
}
