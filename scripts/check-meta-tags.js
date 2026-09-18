/**
 * Check Meta Tags - Detailed Analysis
 * Checks title, description, keywords for all pages
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');

// SEO Rules
const RULES = {
  title: { min: 30, max: 65 },
  description: { min: 120, max: 320 },
  keywords: { min: 3, max: 10 },
};

// Target keywords
const PRIMARY_KEYWORDS = [
  'hire wordpress developer',
  'wordpress developer for hire',
  'hire woocommerce developer',
  'freelance wordpress developer',
  'hire web developer',
];

// Get all HTML files
function getAllHTMLFiles() {
  const files = [];
  
  // Root files
  fs.readdirSync(ROOT_DIR).forEach(file => {
    if (file.endsWith('.html') && file !== '404.html') {
      files.push(file);
    }
  });
  
  // Blog files
  const blogDir = path.join(ROOT_DIR, 'blog');
  if (fs.existsSync(blogDir)) {
    fs.readdirSync(blogDir).forEach(file => {
      if (file.endsWith('.html')) {
        files.push(`blog/${file}`);
      }
    });
  }
  
  return files;
}

// Check single file meta tags
function checkMetaTags(filename) {
  const filepath = path.join(ROOT_DIR, filename);
  const html = fs.readFileSync(filepath, 'utf8');
  const $ = cheerio.load(html);
  
  const result = {
    file: filename,
    title: {
      content: $('title').text().trim(),
      length: 0,
      issues: [],
      passed: [],
    },
    description: {
      content: $('meta[name="description"]').attr('content') || '',
      length: 0,
      issues: [],
      passed: [],
    },
    keywords: {
      content: $('meta[name="keywords"]').attr('content') || '',
      count: 0,
      issues: [],
      passed: [],
    },
    hasBrand: false,
    hasPrimaryKeyword: false,
    score: 0,
  };

  // Check title
  result.title.length = result.title.content.length;
  if (!result.title.content) {
    result.title.issues.push('Missing title tag');
  } else {
    if (result.title.length < RULES.title.min) {
      result.title.issues.push(`Title too short (${result.title.length} chars, min ${RULES.title.min})`);
    } else if (result.title.length > RULES.title.max) {
      result.title.issues.push(`Title too long (${result.title.length} chars, max ${RULES.title.max})`);
    } else {
      result.title.passed.push('Title length OK');
    }
    
    if (result.title.content.includes('Shiv Parmar')) {
      result.hasBrand = true;
      result.title.passed.push('Brand name present');
    } else {
      result.title.issues.push('Missing brand name "Shiv Parmar"');
    }
  }

  // Check description
  result.description.length = result.description.content.length;
  if (!result.description.content) {
    result.description.issues.push('Missing meta description');
  } else {
    if (result.description.length < RULES.description.min) {
      result.description.issues.push(`Description too short (${result.description.length} chars, min ${RULES.description.min})`);
    } else if (result.description.length > RULES.description.max) {
      result.description.issues.push(`Description too long (${result.description.length} chars, max ${RULES.description.max})`);
    } else {
      result.description.passed.push('Description length OK');
    }
  }

  // Check keywords
  if (result.keywords.content) {
    const keywordList = result.keywords.content.split(',').map(k => k.trim().toLowerCase());
    result.keywords.count = keywordList.length;
    
    if (result.keywords.count < RULES.keywords.min) {
      result.keywords.issues.push(`Too few keywords (${result.keywords.count}, min ${RULES.keywords.min})`);
    } else if (result.keywords.count > RULES.keywords.max) {
      result.keywords.issues.push(`Too many keywords (${result.keywords.count}, max ${RULES.keywords.max})`);
    } else {
      result.keywords.passed.push('Keyword count OK');
    }
    
    // Check for primary keywords
    result.hasPrimaryKeyword = PRIMARY_KEYWORDS.some(kw => 
      keywordList.some(k => k.includes(kw) || kw.includes(k))
    );
    
    if (result.hasPrimaryKeyword) {
      result.keywords.passed.push('Primary keyword found');
    } else {
      result.keywords.issues.push('No primary keyword in meta keywords');
    }
  } else {
    result.keywords.issues.push('Missing meta keywords');
  }

  // Calculate score
  let score = 100;
  score -= result.title.issues.length * 15;
  score -= result.description.issues.length * 15;
  score -= result.keywords.issues.length * 10;
  result.score = Math.max(0, score);

  return result;
}

// Generate meta tags report
function generateReport(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const report = {
    date: timestamp,
    totalFiles: results.length,
    summary: {
      perfect: results.filter(r => r.score === 100).length,
      good: results.filter(r => r.score >= 80 && r.score < 100).length,
      needsWork: results.filter(r => r.score >= 60 && r.score < 80).length,
      critical: results.filter(r => r.score < 60).length,
    },
    results: results,
    actionItems: [],
  };

  // Generate action items
  results.forEach(result => {
    if (result.score < 80) {
      result.title.issues.forEach(issue => {
        report.actionItems.push({ file: result.file, type: 'title', issue });
      });
      result.description.issues.forEach(issue => {
        report.actionItems.push({ file: result.file, type: 'description', issue });
      });
      result.keywords.issues.forEach(issue => {
        report.actionItems.push({ file: result.file, type: 'keywords', issue });
      });
    }
  });

  return report;
}

// Main
function main() {
  console.log('=== Meta Tags Check Started ===');
  
  // Ensure report directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  const files = getAllHTMLFiles();
  console.log(`Found ${files.length} HTML files`);
  
  const results = files.map(file => {
    console.log(`  Checking ${file}...`);
    return checkMetaTags(file);
  });

  const report = generateReport(results);
  
  // Save report
  const filepath = path.join(REPORT_DIR, `meta-tags-${report.date}.json`);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('');
  console.log('=== Meta Tags Summary ===');
  console.log(`Total files: ${report.totalFiles}`);
  console.log(`Perfect (100%): ${report.summary.perfect}`);
  console.log(`Good (80-99%): ${report.summary.good}`);
  console.log(`Needs Work (60-79%): ${report.summary.needsWork}`);
  console.log(`Critical (<60%): ${report.summary.critical}`);
  
  if (report.actionItems.length > 0) {
    console.log('');
    console.log('Action Items:');
    report.actionItems.slice(0, 10).forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.file}] ${item.type}: ${item.issue}`);
    });
  }

  console.log('');
  console.log('=== Check Complete ===');
}

main();
