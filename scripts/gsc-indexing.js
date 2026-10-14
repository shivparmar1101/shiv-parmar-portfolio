#!/usr/bin/env node
/**
 * Google Search Console integration (no extra npm dependencies).
 *
 *  1. Submits sitemap.xml  (webmasters v3 -> sitemaps submit)
 *  2. Inspects recently changed URLs (searchconsole v1 -> urlInspection.index:inspect)
 *  3. Writes seo-data/gsc-status.json + prints a report
 *  4. Exits 1 when a post is old but still not indexed (-> GitHub failure email)
 *
 * Auth: Google service account, RS256 JWT signed with node:crypto.
 *
 * Env:
 *   GSC_SERVICE_ACCOUNT  service account JSON (raw JSON, or base64 of it). If unset -> skip.
 *   GSC_SITE_URL         default https://shiv-parmar-portfolio.netlify.app/
 *   GSC_INSPECT_DAYS     inspect URLs with lastmod within N days (default 14)
 *   GSC_ALERT_DAYS       fail when a post older than N days is not indexed (default 7)
 *
 * Flags:
 *   --all          inspect every sitemap URL (not just recent ones)
 *   --limit=N      inspect at most N URLs
 *   --no-sitemap   skip the sitemap submission step
 *   --dry-run      print the plan, no API calls
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const OUTPUT_PATH = path.join(ROOT, 'seo-data', 'gsc-status.json');

const SITE_URL = (process.env.GSC_SITE_URL || 'https://shiv-parmar-portfolio.netlify.app/').replace(/\/*$/, '/');
const INSPECT_DAYS = Math.max(1, parseInt(process.env.GSC_INSPECT_DAYS || '14', 10));
const ALERT_DAYS = Math.max(1, parseInt(process.env.GSC_ALERT_DAYS || '7', 10));

const SCOPES = 'https://www.googleapis.com/auth/webmasters';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const WEBMASTERS = 'https://www.googleapis.com/webmasters/v3';
const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ALL = args.includes('--all');
const SKIP_SITEMAP = args.includes('--no-sitemap');
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
    try { text = Buffer.from(text, 'base64').toString('utf8'); } catch (e) { /* assume JSON below */ }
  }
  try {
    const sa = JSON.parse(text);
    if (!sa.client_email || !sa.private_key) throw new Error('missing client_email/private_key');
    return sa;
  } catch (e) {
    throw new Error(`GSC_SERVICE_ACCOUNT is not valid service account JSON: ${e.message}`);
  }
}

const b64url = input => Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

function createAssertion(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: SCOPES,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(sa.private_key.replace(/\\n/g, '\n')).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${unsigned}.${signature}`;
}

async function getAccessToken(sa) {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: createAssertion(sa),
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`token request failed: HTTP ${res.status} ${data.error_description || data.error || ''}`.trim());
  }
  return data.access_token;
}

async function api(method, url, token, payload) {
  const res = await fetch(url, {
    method,
    headers: Object.assign(
      { Authorization: `Bearer ${token}` },
      payload !== undefined ? { 'Content-Type': 'application/json; charset=utf-8' } : {}
    ),
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

function readSitemapTargets() {
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const out = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  for (const block of urlBlocks) {
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    if (!loc) continue;
    const lastmod = (block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || null;
    out.push({ loc: loc.trim(), lastmod });
  }
  return out;
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / 86400000;
}

function selectTargets(targets) {
  let list = targets;
  if (!ALL) list = list.filter(t => daysSince(t.lastmod) <= INSPECT_DAYS);
  if (LIMIT) list = list.slice(0, LIMIT);
  return list;
}

async function submitSitemap(token) {
  const feedPath = `${SITE_URL}sitemap.xml`;
  const url = `${WEBMASTERS}/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(feedPath)}`;
  const res = await api('PUT', url, token, {});
  if (res.ok) {
    console.log(`Sitemap submitted to Search Console: ${feedPath}`);
    return true;
  }
  console.warn(`WARNING: sitemap submit failed (HTTP ${res.status}) ${JSON.stringify(res.data)}`);
  console.warn('  Common causes: service account not added as "Full" user in Search Console,');
  console.warn('  or the property is not exactly: ' + SITE_URL);
  return false;
}

async function inspectUrl(token, target) {
  const res = await api('POST', INSPECT_URL, token, {
    inspectionUrl: target.loc,
    siteUrl: SITE_URL,
    languageCode: 'en-US',
  });
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) return { error: `HTTP ${res.status} ${JSON.stringify(res.data)}` };

  const r = (res.data && res.data.inspectionResult && res.data.inspectionResult.indexStatusResult) || {};
  return {
    url: target.loc,
    lastmod: target.lastmod,
    verdict: r.verdict || 'VERDICT_UNSPECIFIED',
    coverageState: r.coverageState || '',
    indexingState: r.indexingState || '',
    robotsTxtState: r.robotsTxtState || '',
    pageFetchState: r.pageFetchState || '',
    lastCrawlTime: r.lastCrawlTime || null,
    googleCanonical: r.googleCanonical || null,
    userCanonical: r.userCanonical || null,
    inSitemap: Array.isArray(r.sitemap) ? r.sitemap : [],
    indexed: r.verdict === 'PASS',
  };
}

async function main() {
  console.log('=========================================');
  console.log('Google Search Console indexer');
  console.log(`Property: ${SITE_URL}`);
  console.log(`Inspect window: ${INSPECT_DAYS} days | alert after: ${ALERT_DAYS} days`);
  console.log(`Mode: ${DRY_RUN ? 'dry-run (no API calls)' : 'live'}${ALL ? ' | all URLs' : ''}${SKIP_SITEMAP ? ' | sitemap skip' : ''}`);
  console.log('=========================================\n');

  const targets = readSitemapTargets();
  const selected = selectTargets(targets);
  console.log(`Sitemap URLs: ${targets.length} | selected for inspection: ${selected.length}`);

  let sa = null;
  try { sa = loadServiceAccount(); } catch (e) { console.error(`ERROR: ${e.message}`); process.exit(1); }

  if (DRY_RUN) {
    console.log('\nDry run - would inspect:');
    selected.forEach(t => console.log(`  ${t.loc} (lastmod ${t.lastmod || 'n/a'})`));
    console.log(sa ? `\nAuth: service account ${sa.client_email}` : '\nAuth: not configured (would skip)');
    return 0;
  }

  if (!sa) {
    console.log('\nSKIP: GSC_SERVICE_ACCOUNT secret not set.');
    console.log('Setup required for Google Search Console automation:');
    console.log('  1. https://console.cloud.google.com -> create project -> enable "Google Search Console API"');
    console.log('  2. IAM & Admin -> Service Accounts -> Keys -> Add key -> JSON (download)');
    console.log('  3. Search Console -> Settings -> Users and permissions -> Add user -> paste the');
    console.log('     client_email from the JSON -> permission: Full');
    console.log('  4. GitHub -> Settings -> Secrets and variables -> Actions -> new secret');
    console.log('     GSC_SERVICE_ACCOUNT = entire contents of the JSON key file');
    console.log('  5. Re-run this workflow (Actions -> GSC Indexing -> Run workflow)');
    console.log('\nNothing failed - sitemap + IndexNow still handle discovery meanwhile.');
    return 0;
  }

  let token;
  try {
    token = await getAccessToken(sa);
    console.log('Authenticated with service account.\n');
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    return 1;
  }

  if (!SKIP_SITEMAP) await submitSitemap(token);
  console.log('');

  const results = [];
  let rateLimited = false;
  for (let i = 0; i < selected.length; i++) {
    const t = selected[i];
    const r = await inspectUrl(token, t);
    if (r.rateLimited) {
      rateLimited = true;
      console.warn(`Rate limited (HTTP 429) after ${i} inspections - stopping early.`);
      break;
    }
    if (r.error) {
      console.warn(`  ERROR ${t.loc}: ${r.error}`);
      results.push({ url: t.loc, lastmod: t.lastmod, error: r.error, indexed: false });
    } else {
      results.push(r);
      console.log(`  ${r.indexed ? 'INDEXED  ' : 'NOT-INDEX'} ${r.verdict.padEnd(8)} ${t.loc}`);
      if (r.coverageState) console.log(`            ${r.coverageState}${r.lastCrawlTime ? ` (crawled ${r.lastCrawlTime})` : ''}`);
    }
    await sleep(200);
  }

  const indexed = results.filter(r => r.indexed).length;
  const notIndexed = results.filter(r => !r.indexed && !r.error);
  const errors = results.filter(r => r.error);

  const blockers = results.filter(r =>
    r.indexingState === 'BLOCKED_BY_META_TAG' ||
    r.indexingState === 'BLOCKED_BY_HTTP_HEADER' ||
    r.robotsTxtState === 'DISALLOWED'
  );
  const stale = notIndexed.filter(r => daysSince(r.lastmod) > ALERT_DAYS);

  const report = {
    generatedAt: new Date().toISOString(),
    siteUrl: SITE_URL,
    sitemapUrls: targets.length,
    inspected: results.length,
    indexed,
    notIndexed: notIndexed.length,
    rateLimited,
    blockers: blockers.map(r => ({ url: r.url, indexingState: r.indexingState, robotsTxtState: r.robotsTxtState })),
    staleNotIndexed: stale.map(r => ({ url: r.url, lastmod: r.lastmod, verdict: r.verdict, coverageState: r.coverageState })),
    results,
  };
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));

  console.log('\n=== Summary ===');
  console.log(`Inspected: ${results.length} | indexed: ${indexed} | not indexed: ${notIndexed.length} | errors: ${errors.length}`);
  if (rateLimited) console.log('Note: hit API rate limit, inspection was partial.');
  console.log(`Report: ${path.relative(ROOT, OUTPUT_PATH)}`);

  if (blockers.length) {
    console.error('\nBLOCKED FROM INDEXING (fix these first):');
    blockers.forEach(r => console.error(`  ${r.url} -> meta=${r.indexingState} robots=${r.robotsTxtState}`));
  }
  if (stale.length) {
    console.error(`\nNOT INDEXED after ${ALERT_DAYS}+ days:`);
    stale.forEach(r => console.error(`  ${r.url} (${r.lastmod}) -> ${r.verdict}: ${r.coverageState}`));
    console.error('\nGoogle has no "request indexing" API. To push these:');
    console.error('  Search Console -> URL Inspection -> enter URL -> Request indexing (top posts only).');
  }

  if (blockers.length || stale.length) return 1;
  if (errors.length && errors.length === results.length) return 1;
  console.log('\nAll inspected URLs are indexed or still inside the grace period.');
  return 0;
}

if (require.main === module) {
  main().then(code => process.exit(code)).catch(err => {
    console.error('Fatal error:', err.message || err);
    process.exit(1);
  });
}

module.exports = { readSitemapTargets, selectTargets, daysSince };
