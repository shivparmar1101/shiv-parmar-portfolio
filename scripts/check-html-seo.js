/**
 * Check HTML SEO
 * Validates all HTML files for SEO best practices
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');

function checkHTMLSEO(filename) {
  const filepath = path.join(ROOT_DIR, filename);
  if (!fs.existsSync(filepath)) return null;

  const html = fs.readFileSync(filepath, 'utf8');
  const $ = cheerio.load(html);

  const result = {
    file: filename,
    issues: [],
    warnings: [],
    passed: [],
  };

  // Check lang attribute
  if (!$('html').attr('lang')) {
    results.issues.push('Missing lang attribute on html');
  } else {
    result.passed.push('lang attribute present');
  }

  // Check viewport meta
  if (!$('meta[name="viewport"]').attr('content')) {
    result.issues.push('Missing viewport meta tag');
  } else {
    result.passed.push('viewport meta present');
  }

  // Check charset
  if (!$('meta[charset]').attr('charset')) {
    result.issues.push('Missing charset declaration');
  } else {
    result.passed.push('charset declared');
  }

  // Check all links have text
  let linksWithoutText = 0;
  $('a').each((i, el) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr('aria-label');
    if (!text && !ariaLabel) linksWithoutText++;
  });
  if (linksWithoutText > 0) {
    result.warnings.push(`${linksWithoutText} links without text`);
  } else {
    result.passed.push('All links have text');
  }

  // Check heading hierarchy
  const headings = [];
  $('h1, h2, h3, h4, h5, h6').each((i, el) => {
    headings.push({
      level: parseInt(el.tagName.replace('h', '')),
      text: $(el).text().trim().substring(0, 50),
    });
  });

  // Check for skipped heading levels
  let skippedLevels = false;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level > headings[i-1].level + 1) {
      skippedLevels = true;
      break;
    }
  }
  if (skippedLevels) {
    result.warnings.push('Heading levels skipped (h1 > h3)');
  } else if (headings.length > 0) {
    result.passed.push('Heading hierarchy OK');
  }

  // Check for empty paragraphs
  let emptyParagraphs = 0;
  $('p').each((i, el) => {
    if ($(el).text().trim() === '') emptyParagraphs++;
  });
  if (emptyParagraphs > 0) {
    result.warnings.push(`${emptyParagraphs} empty paragraphs`);
  }

  // Check for doctype
  if (!html.includes('<!DOCTYPE html>')) {
    result.issues.push('Missing DOCTYPE declaration');
  } else {
    result.passed.push('DOCTYPE present');
  }

  return result;
}

function main() {
  console.log('=== HTML SEO Check Started ===');
  
  // Ensure report directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // Get all HTML files
  const files = [];
  fs.readdirSync(ROOT_DIR).forEach(file => {
    if (file.endsWith('.html') && file !== '404.html') {
      files.push(file);
    }
  });

  console.log(`Checking ${files.length} HTML files...`);

  const results = files.map(file => {
    console.log(`  Checking ${file}...`);
    return checkHTMLSEO(file);
  }).filter(r => r !== null);

  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const report = {
    date: timestamp,
    totalFiles: results.length,
    totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    totalPassed: results.reduce((sum, r) => sum + r.passed.length, 0),
    results: results,
  };

  // Save report
  const filepath = path.join(REPORT_DIR, `html-seo-${timestamp}.json`);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('');
  console.log('=== HTML SEO Summary ===');
  console.log(`Files checked: ${report.totalFiles}`);
  console.log(`Issues: ${report.totalIssues}`);
  console.log(`Warnings: ${report.totalWarnings}`);
  console.log(`Passed: ${report.totalPassed}`);

  console.log('');
  console.log('=== Check Complete ===');
}

main();
