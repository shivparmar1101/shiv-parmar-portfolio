/**
 * Track Keyword Rankings
 * Checks Google Search Console data and tracks keyword positions
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'seo-data');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');

// Keywords to track
const KEYWORDS = [
  // Primary (Money Keywords)
  { keyword: 'hire wordpress developer', category: 'primary', target: 10 },
  { keyword: 'wordpress developer for hire', category: 'primary', target: 15 },
  { keyword: 'hire woocommerce developer', category: 'primary', target: 20 },
  { keyword: 'freelance wordpress developer', category: 'primary', target: 15 },
  { keyword: 'hire web developer', category: 'primary', target: 20 },
  
  // Secondary
  { keyword: 'custom wordpress theme', category: 'secondary', target: 20 },
  { keyword: 'wordpress plugin development', category: 'secondary', target: 25 },
  { keyword: 'woocommerce store setup', category: 'secondary', target: 25 },
  { keyword: 'wordpress speed optimization', category: 'secondary', target: 20 },
  { keyword: 'wordpress seo', category: 'secondary', target: 30 },
  
  // Long-tail
  { keyword: 'hire wordpress developer for ecommerce', category: 'longtail', target: 15 },
  { keyword: 'wordpress developer for small business', category: 'longtail', target: 20 },
  { keyword: 'hire woocommerce expert', category: 'longtail', target: 20 },
  { keyword: 'wordpress developer remote hire', category: 'longtail', target: 25 },
  { keyword: 'custom wordpress plugin developer', category: 'longtail', target: 25 },
  
  // Geographic
  { keyword: 'hire wordpress developer india', category: 'geographic', target: 20 },
  { keyword: 'hire wordpress developer usa', category: 'geographic', target: 30 },
  { keyword: 'hire wordpress developer uk', category: 'geographic', target: 30 },
  { keyword: 'hire wordpress developer australia', category: 'geographic', target: 30 },
  
  // Trending
  { keyword: 'wordpress ai integration', category: 'trending', target: 25 },
  { keyword: 'headless wordpress', category: 'trending', target: 25 },
  { keyword: 'wordpress full site editing', category: 'trending', target: 20 },
];

function trackKeywords() {
  console.log('=== Keyword Tracking Started ===');
  
  const results = {
    date: new Date().toISOString(),
    keywords: KEYWORDS,
    summary: {
      total: KEYWORDS.length,
      top10: 0,
      top20: 0,
      top50: 0,
      below50: 0,
    },
    recommendations: [],
  };

  // Load previous data if exists
  const previousDataPath = path.join(DATA_DIR, 'keyword-history.json');
  let previousData = null;
  if (fs.existsSync(previousDataPath)) {
    previousData = JSON.parse(fs.readFileSync(previousDataPath, 'utf8'));
  }

  // For each keyword, we would normally check Google Search Console
  // Since we can't do that directly in GitHub Actions without API,
  // we'll create a tracking structure that can be updated manually
  // or via GSC API when configured

  results.keywords = KEYWORDS.map(kw => ({
    ...kw,
    currentPosition: null, // To be filled via GSC API or manual input
    previousPosition: previousData ? 
      previousData.keywords.find(p => p.keyword === kw.keyword)?.currentPosition : null,
    change: null,
    status: 'pending',
    lastChecked: new Date().toISOString(),
  }));

  // Generate recommendations
  results.keywords.forEach(kw => {
    if (kw.currentPosition && kw.currentPosition > kw.target) {
      results.recommendations.push({
        keyword: kw.keyword,
        current: kw.currentPosition,
        target: kw.target,
        action: `Improve ranking for "${kw.keyword}" - currently at position ${kw.currentPosition}, target ${kw.target}`,
      });
    }
  });

  return results;
}

function generateReport(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const report = {
    date: timestamp,
    totalKeywords: results.summary.total,
    keywords: results.keywords,
    recommendations: results.recommendations,
    nextSteps: [
      'Check Google Search Console for actual rankings',
      'Update keyword positions in seo-data/keyword-history.json',
      'Create content for keywords ranking 11-20',
      'Optimize content for keywords ranking 21-50',
    ],
  };

  return report;
}

function main() {
  const results = trackKeywords();
  const report = generateReport(results);
  
  // Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // Save keyword history
  const historyPath = path.join(DATA_DIR, 'keyword-history.json');
  fs.writeFileSync(historyPath, JSON.stringify(results, null, 2));
  
  // Save report
  const reportPath = path.join(REPORT_DIR, `keyword-tracking-${report.date}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('');
  console.log('=== Keyword Tracking Summary ===');
  console.log(`Total keywords tracked: ${results.summary.total}`);
  console.log('');
  console.log('Keywords by category:');
  
  const categories = {};
  results.keywords.forEach(kw => {
    if (!categories[kw.category]) categories[kw.category] = [];
    categories[kw.category].push(kw.keyword);
  });
  
  Object.entries(categories).forEach(([category, keywords]) => {
    console.log(`  ${category}: ${keywords.length}`);
  });
  
  console.log('');
  console.log('Next steps:');
  console.log('1. Check Google Search Console for actual rankings');
  console.log('2. Update seo-data/keyword-history.json with positions');
  console.log('3. Create content for trending keywords');
  
  console.log('');
  console.log('=== Tracking Complete ===');
}

main();
