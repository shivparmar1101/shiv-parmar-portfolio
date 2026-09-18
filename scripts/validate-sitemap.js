/**
 * Validate Sitemap
 * Checks sitemap.xml for errors and SEO best practices
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');

function validateSitemap() {
  console.log('=== Sitemap Validation Started ===');
  
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('ERROR: sitemap.xml not found!');
    return { valid: false, error: 'File not found' };
  }

  const sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const results = {
    valid: true,
    issues: [],
    warnings: [],
    passed: [],
    urls: [],
  };

  // Check XML structure
  if (!sitemapContent.includes('<?xml')) {
    results.issues.push('Missing XML declaration');
  } else {
    results.passed.push('XML declaration present');
  }

  if (!sitemapContent.includes('<urlset')) {
    results.issues.push('Missing urlset tag');
    results.valid = false;
  } else {
    results.passed.push('urlset tag present');
  }

  if (!sitemapContent.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    results.warnings.push('Missing sitemap namespace');
  } else {
    results.passed.push('Sitemap namespace present');
  }

  // Extract URLs
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = urlRegex.exec(sitemapContent)) !== null) {
    results.urls.push(match[1]);
  }

  console.log(`Found ${results.urls.length} URLs in sitemap`);

  // Check each URL
  results.urls.forEach(url => {
    // Check URL format
    if (!url.startsWith('https://')) {
      results.issues.push(`URL doesn't use HTTPS: ${url}`);
    }

    // Check for .html extension (should use clean URLs)
    if (url.includes('.html')) {
      results.warnings.push(`URL has .html extension (use clean URLs): ${url}`);
    }

    // Check for trailing slash consistency
    if (url.endsWith('/') && url !== 'https://shiv-parmar-portfolio.netlify.app/') {
      results.warnings.push(`URL has trailing slash: ${url}`);
    }
  });

  // Check lastmod dates
  const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/g;
  const lastmodDates = [];
  while ((match = lastmodRegex.exec(sitemapContent)) !== null) {
    lastmodDates.push(match[1]);
  }

  // Check if all dates are the same (bad practice)
  const uniqueDates = [...new Set(lastmodDates)];
  if (uniqueDates.length === 1 && lastmodDates.length > 1) {
    results.warnings.push('All URLs have same lastmod date (should be different)');
  } else {
    results.passed.push('Different lastmod dates found');
  }

  // Check for required pages
  const requiredPages = [
    'https://shiv-parmar-portfolio.netlify.app/',
    'https://shiv-parmar-portfolio.netlify.app/about',
    'https://shiv-parmar-portfolio.netlify.app/services',
    'https://shiv-parmar-portfolio.netlify.app/contact',
    'https://shiv-parmar-portfolio.netlify.app/blog',
  ];

  requiredPages.forEach(page => {
    if (results.urls.includes(page)) {
      results.passed.push(`Required page present: ${page}`);
    } else {
      results.issues.push(`Missing required page: ${page}`);
    }
  });

  // Check priority values
  const priorityRegex = /<priority>(.*?)<\/priority>/g;
  const priorities = [];
  while ((match = priorityRegex.exec(sitemapContent)) !== null) {
    priorities.push(parseFloat(match[1]));
  }

  if (priorities.length > 0) {
    const maxPriority = Math.max(...priorities);
    if (maxPriority !== 1.0) {
      results.warnings.push('Homepage should have priority 1.0');
    } else {
      results.passed.push('Homepage priority is 1.0');
    }
  }

  return results;
}

function generateReport(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const report = {
    date: timestamp,
    valid: results.valid,
    totalUrls: results.urls.length,
    issues: results.issues,
    warnings: results.warnings,
    passed: results.passed,
    score: 100 - (results.issues.length * 15) - (results.warnings.length * 5),
  };

  return report;
}

function main() {
  const results = validateSitemap();
  const report = generateReport(results);
  
  // Ensure report directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // Save report
  const filepath = path.join(REPORT_DIR, `sitemap-validation-${report.date}.json`);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('');
  console.log('=== Sitemap Validation Summary ===');
  console.log(`Valid: ${report.valid}`);
  console.log(`Total URLs: ${report.totalUrls}`);
  console.log(`Score: ${report.score}%`);
  console.log(`Issues: ${report.issues.length}`);
  console.log(`Warnings: ${report.warnings.length}`);
  console.log(`Passed: ${report.passed.length}`);
  
  if (report.issues.length > 0) {
    console.log('');
    console.log('Issues:');
    report.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }
  
  if (report.warnings.length > 0) {
    console.log('');
    console.log('Warnings:');
    report.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }

  console.log('');
  console.log('=== Validation Complete ===');
}

main();
