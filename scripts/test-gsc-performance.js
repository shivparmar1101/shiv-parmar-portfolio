#!/usr/bin/env node
/**
 * Regression test: gsc-performance.js buildMarkdown must render the EXACT report
 * shape main() builds (topQueries/topPages, not queries/pages).
 *
 * This caught a real bug: buildMarkdown destructured `queries`/`pages` while main()
 * stored `topQueries`/`topPages`, so the first real run died with
 * "Cannot read properties of undefined (reading 'forEach')".
 */
const assert = require('assert');
const { buildMarkdown } = require('./gsc-performance.js');

const base = () => ({
  generatedAt: '2026-11-05T12:00:00.000Z',
  siteUrl: 'https://shiv-parmar-portfolio.netlify.app/',
  days: 7,
  ranges: {
    current: { startDate: '2026-10-27', endDate: '2026-11-02' },
    previous: { startDate: '2026-10-20', endDate: '2026-10-26' },
  },
  current: { totals: { clicks: 12, impressions: 340 }, ctr: 3.53, avgPosition: 14.2 },
  previous: { totals: { clicks: 8, impressions: 300 }, ctr: 2.67, avgPosition: 15.1 },
  topQueries: [],
  topPages: [],
});

let pass = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`PASS  ${name}`);
    pass++;
  } catch (e) {
    console.log(`FAIL  ${name}: ${e.message}`);
    process.exit(1);
  }
};

check('renders the real main() report shape', () => {
  const md = buildMarkdown(base());
  assert.ok(md.includes('# SEO Monitor Report'), 'missing header');
  assert.ok(md.includes('| Clicks | 12 | 8 | +50.0% |'), 'totals row wrong');
  assert.ok(md.includes('No query data in this window'), 'empty state missing');
  assert.ok(md.includes('No page data in this window'), 'empty page state missing');
});

check('renders rows from topQueries/topPages', () => {
  const r = base();
  r.topQueries = [{ keys: ['wordpress seo'], clicks: 5, impressions: 100, ctr: 5, position: 8.2 }];
  r.topPages = [{ keys: ['https://shiv-parmar-portfolio.netlify.app/blog/a/'], clicks: 5, impressions: 100, ctr: 5, position: 8.2 }];
  const md = buildMarkdown(r);
  assert.ok(md.includes('| 1 | wordpress seo | 5 | 100 | 5.00% | 8.20% |') || md.includes('| 1 | wordpress seo | 5 | 100 | 5.00% | 8.20 |'), 'query row wrong');
  assert.ok(md.includes('| 1 | /blog/a/ |'), 'page label not shortened to site path');
});

check('tolerates a missing report shape without throwing', () => {
  const md = buildMarkdown({ ...base(), topQueries: undefined, topPages: undefined });
  assert.ok(md.includes('No query data in this window'));
});

console.log(`\n${pass}/3 passed`);
