#!/usr/bin/env node
/**
 * Google Search Console performance report (searchAnalytics API).
 *
 * Writes:
 *   reports/SEO-REPORT.md            human readable, committed by seo-monitor.yml
 *   seo-data/gsc-performance.json    machine readable snapshot
 *
 * Report covers the last N days vs the N days before it (clicks, impressions, CTR,
 * average position) plus the top queries and top pages. Search Console data lags
 * 2-3 days, so the window ends 3 days ago by default.
 *
 * No extra npm dependencies - RS256 JWT signed with node:crypto, same as gsc-indexing.js.
 *
 * Env:
 *   GSC_SERVICE_ACCOUNT  service account JSON (raw JSON, or base64 of it). If unset -> skip.
 *   GSC_SITE_URL         default https://shiv-parmar-portfolio.netlify.app/
 *   GSC_REPORT_DAYS      window length in days (default 7)
 *
 * Flags:
 *   --days=N   override the window length
 *   --dry-run print the plan, no API calls
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const MD_PATH = path.join(ROOT, 'reports', 'SEO-REPORT.md');
const JSON_PATH = path.join(ROOT, 'seo-data', 'gsc-performance.json');

const SITE_URL = (process.env.GSC_SITE_URL || 'https://shiv-parmar-portfolio.netlify.app/').replace(/\/*$/, '/');
const DATA_LAG_DAYS = 3;
const SCOPES = 'https://www.googleapis.com/auth/webmasters';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const WEBMASTERS = 'https://www.googleapis.com/webmasters/v3';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DAYS = (() => {
  const a = args.find(x => x.startsWith('--days='));
  const v = a ? parseInt(a.split('=')[1], 10) : parseInt(process.env.GSC_REPORT_DAYS || '7', 10);
  return Math.max(1, Math.min(28, v || 7));
})();

function loadServiceAccount() {
  const raw = process.env.GSC_SERVICE_ACCOUNT;
  if (!raw || !raw.trim()) return null;
  let text = raw.trim();
  if (!text.startsWith('{')) {
    try { text = Buffer.from(text, 'base64').toString('utf8'); } catch (e) { /* assume JSON below */ }
  }
  const sa = JSON.parse(text);
  if (!sa.client_email || !sa.private_key) throw new Error('missing client_email/private_key');
  return sa;
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

async function query(token, body) {
  const url = `${WEBMASTERS}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
  if (!res.ok) throw new Error(`searchAnalytics HTTP ${res.status} ${JSON.stringify(data)}`);
  return (data && data.rows) || [];
}

const iso = d => d.toISOString().slice(0, 10);
const dayOffset = (from, days) => new Date(from.getTime() + days * 86400000);

function windowRanges() {
  const end = dayOffset(new Date(), -DATA_LAG_DAYS);
  const start = dayOffset(end, -(DAYS - 1));
  const prevEnd = dayOffset(start, -1);
  const prevStart = dayOffset(prevEnd, -(DAYS - 1));
  return {
    current: { startDate: iso(start), endDate: iso(end) },
    previous: { startDate: iso(prevStart), endDate: iso(prevEnd) },
  };
}

const total = rows => rows.reduce((acc, r) => ({
  clicks: acc.clicks + (r.clicks || 0),
  impressions: acc.impressions + (r.impressions || 0),
}), { clicks: 0, impressions: 0 });

const ctr = t => (t.impressions ? (t.clicks / t.impressions) * 100 : 0);
const pct = (now, before) => {
  if (!before) return now ? 'new' : '-';
  const change = ((now - before) / before) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};
const f2 = n => Number(n || 0).toFixed(2);

function buildMarkdown(report) {
  const { ranges, current, previous, queries, pages, generatedAt } = report;
  const rows = [
    ['# SEO Monitor Report', ''],
    ['', ''],
    [`**Generated:** ${generatedAt}`, ''],
    [`**Property:** ${SITE_URL}`, ''],
    [`**Window:** ${ranges.current.startDate} to ${ranges.current.endDate} ` +
      `(vs ${ranges.previous.startDate} to ${ranges.previous.endDate})`, ''],
    ['', ''],
    ['## Totals', ''],
    ['| Metric | This period | Previous period | Change |', ''],
    ['|--------|-------------|-----------------|--------|', ''],
    [`| Clicks | ${current.totals.clicks} | ${previous.totals.clicks} | ${pct(current.totals.clicks, previous.totals.clicks)} |`, ''],
    [`| Impressions | ${current.totals.impressions} | ${previous.totals.impressions} | ${pct(current.totals.impressions, previous.totals.impressions)} |`, ''],
    [`| CTR | ${f2(current.ctr)}% | ${f2(previous.ctr)}% | ${pct(current.ctr, previous.ctr)} |`, ''],
    [`| Avg position | ${f2(current.avgPosition)} | ${f2(previous.avgPosition)} | ${pct(current.avgPosition, previous.avgPosition)} |`, ''],
    ['', ''],
    ['## Top queries', ''],
    ['| # | Query | Clicks | Impressions | CTR | Position |', ''],
    ['|---|-------|--------|-------------|-----|----------|', ''],
  ];
  queries.forEach((q, i) => {
    const label = String(q.keys && q.keys[0] || '').replace(/\|/g, '/');
    rows.push([`| ${i + 1} | ${label} | ${q.clicks} | ${q.impressions} | ${f2(q.ctr)}% | ${f2(q.position)} |`, '']);
  });
  if (!queries.length) rows.push(['| - | No query data in this window | 0 | 0 | 0% | - |', '']);
  rows.push(
    ['', ''],
    ['## Top pages', ''],
    ['| # | Page | Clicks | Impressions | CTR | Position |', ''],
    ['|---|------|--------|-------------|-----|----------|', '']
  );
  pages.forEach((p, i) => {
    const label = String(p.keys && p.keys[0] || '').replace(SITE_URL, '/').replace(/\|/g, '/');
    rows.push([`| ${i + 1} | ${label} | ${p.clicks} | ${p.impressions} | ${f2(p.ctr)}% | ${f2(p.position)} |`, '']);
  });
  if (!pages.length) rows.push(['| - | No page data in this window | 0 | 0 | 0% | - |', '']);
  rows.push(
    ['', ''],
    ['_Data source: Google Search Console searchAnalytics API. ' +
      `Reports lag ~${DATA_LAG_DAYS} days, so the window ends ${DATA_LAG_DAYS} days ago._`, '']
  );
  return rows.map(r => r[0]).join('\n') + '\n';
}

async function main() {
  const ranges = windowRanges();
  console.log('=========================================');
  console.log('Search Console performance report');
  console.log(`Property: ${SITE_URL}`);
  console.log(`Window:   ${ranges.current.startDate} .. ${ranges.current.endDate} ` +
    `(previous: ${ranges.previous.startDate} .. ${ranges.previous.endDate})`);
  console.log('=========================================\n');

  let sa = null;
  try { sa = loadServiceAccount(); } catch (e) { console.error(`ERROR: ${e.message}`); return 1; }

  if (DRY_RUN) {
    console.log('Dry run - would query searchAnalytics for:');
    console.log(`  totals + top ${DAYS} queries + top pages, current and previous window`);
    console.log(sa ? `\nAuth: service account ${sa.client_email}` : '\nAuth: not configured (would skip)');
    return 0;
  }

  if (!sa) {
    console.log('SKIP: GSC_SERVICE_ACCOUNT secret not set - no performance report generated.');
    console.log('Setup: add the Search Console service account JSON as the GSC_SERVICE_ACCOUNT secret.');
    return 0;
  }

  let token;
  try {
    token = await getAccessToken(sa);
    console.log('Authenticated with service account.');
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    return 1;
  }

  let currentRows;
  let previousRows;
  let queries;
  let pages;
  try {
    currentRows = await query(token, { ...ranges.current, rowLimit: 1 });
    previousRows = await query(token, { ...ranges.previous, rowLimit: 1 });
    queries = await query(token, { ...ranges.current, dimensions: ['query'], rowLimit: 20 });
    pages = await query(token, { ...ranges.current, dimensions: ['page'], rowLimit: 20 });
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    console.error('  Common causes: service account not added as a "Full" user in Search Console,');
    console.error('  or the property is not exactly: ' + SITE_URL);
    return 1;
  }

  const curTotal = total(currentRows);
  const prevTotal = total(previousRows);
  const avgPosition = rows => (rows.length && rows[0].position ? rows[0].position : 0);

  const report = {
    generatedAt: new Date().toISOString(),
    siteUrl: SITE_URL,
    days: DAYS,
    ranges,
    current: { totals: curTotal, ctr: ctr(curTotal), avgPosition: avgPosition(currentRows) },
    previous: { totals: prevTotal, ctr: ctr(prevTotal), avgPosition: avgPosition(previousRows) },
    topQueries: queries,
    topPages: pages,
  };

  fs.mkdirSync(path.dirname(MD_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
  fs.writeFileSync(MD_PATH, buildMarkdown(report));
  fs.writeFileSync(JSON_PATH, JSON.stringify(report, null, 2));

  console.log('\n=== Summary ===');
  console.log(`Clicks: ${curTotal.clicks} (prev ${prevTotal.clicks}) | ` +
    `Impressions: ${curTotal.impressions} (prev ${prevTotal.impressions}) | ` +
    `CTR: ${f2(report.current.ctr)}% | Avg position: ${f2(report.current.avgPosition)}`);
  console.log(`Top query: ${queries[0] ? `${queries[0].keys[0]} (${queries[0].clicks} clicks)` : 'none'}`);
  console.log(`Report: ${path.relative(ROOT, MD_PATH)} + ${path.relative(ROOT, JSON_PATH)}`);
  return 0;
}

if (require.main === module) {
  main().then(code => process.exit(code)).catch(err => {
    console.error('Fatal error:', err.message || err);
    process.exit(1);
  });
}

module.exports = { windowRanges, buildMarkdown };
