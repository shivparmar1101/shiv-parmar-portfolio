/**
 * SEO Audit Script - Main Auditor
 * Runs automatically via GitHub Actions
 * Checks all SEO elements across the portfolio
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SITE_URL = 'https://shiv-parmar-portfolio.netlify.app';
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const DATA_DIR = path.join(__dirname, '..', 'seo-data');

// Pages to audit
const PAGES = [
  { name: 'Homepage', file: 'index.html', url: '/' },
  { name: 'About', file: 'about.html', url: '/about' },
  { name: 'Services', file: 'services.html', url: '/services' },
  { name: 'Work', file: 'work.html', url: '/work' },
  { name: 'Projects', file: 'projects.html', url: '/projects' },
  { name: 'Skills', file: 'skills.html', url: '/skills' },
  { name: 'Experience', file: 'experience.html', url: '/experience' },
  { name: 'Blog', file: 'blog.html', url: '/blog' },
  { name: 'Contact', file: 'contact.html', url: '/contact' },
];

// Target keywords
const TARGET_KEYWORDS = {
  primary: [
    'hire wordpress developer',
    'wordpress developer for hire',
    'hire woocommerce developer',
    'freelance wordpress developer',
    'hire web developer',
  ],
  secondary: [
    'custom wordpress theme',
    'wordpress plugin development',
    'woocommerce store setup',
    'wordpress speed optimization',
    'wordpress seo',
  ],
  longtail: [
    'hire wordpress developer for ecommerce',
    'wordpress developer for small business',
    'hire woocommerce expert',
    'wordpress developer remote hire',
    'custom wordpress plugin developer',
  ],
};

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read HTML file
function readHTML(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return null;
}

// Audit single page
function auditPage(page) {
  const html = readHTML(page.file);
  if (!html) {
    return { page: page.name, error: 'File not found' };
  }

  const $ = cheerio.load(html);
  const results = {
    page: page.name,
    file: page.file,
    url: SITE_URL + page.url,
    issues: [],
    warnings: [],
    passed: [],
  };

  // Check title tag
  const title = $('title').text().trim();
  if (!title) {
    results.issues.push({ type: 'ERROR', message: 'Missing title tag' });
  } else if (title.length < 30) {
    results.warnings.push({ type: 'WARNING', message: `Title too short (${title.length} chars): ${title}` });
  } else if (title.length > 65) {
    results.warnings.push({ type: 'WARNING', message: `Title too long (${title.length} chars): ${title}` });
  } else {
    results.passed.push(`Title OK (${title.length} chars): ${title}`);
  }

  // Check meta description
  const description = $('meta[name="description"]').attr('content') || '';
  if (!description) {
    results.issues.push({ type: 'ERROR', message: 'Missing meta description' });
  } else if (description.length < 120) {
    results.warnings.push({ type: 'WARNING', message: `Description too short (${description.length} chars)` });
  } else if (description.length > 320) {
    results.warnings.push({ type: 'WARNING', message: `Description too long (${description.length} chars)` });
  } else {
    results.passed.push(`Description OK (${description.length} chars)`);
  }

  // Check meta keywords
  const keywords = $('meta[name="keywords"]').attr('content') || '';
  if (!keywords) {
    results.warnings.push({ type: 'WARNING', message: 'Missing meta keywords' });
  } else {
    const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
    const primaryFound = TARGET_KEYWORDS.primary.some(kw => 
      keywordList.some(k => k.includes(kw) || kw.includes(k))
    );
    if (!primaryFound) {
      results.warnings.push({ type: 'WARNING', message: 'No primary keyword in meta keywords' });
    } else {
      results.passed.push('Primary keyword found in meta keywords');
    }
  }

  // Check H1 tag
  const h1Tags = $('h1');
  if (h1Tags.length === 0) {
    results.issues.push({ type: 'ERROR', message: 'Missing H1 tag' });
  } else if (h1Tags.length > 1) {
    results.warnings.push({ type: 'WARNING', message: `Multiple H1 tags (${h1Tags.length})` });
  } else {
    const h1Text = $(h1Tags[0]).text().trim();
    results.passed.push(`H1 OK: ${h1Text.substring(0, 50)}...`);
  }

  // Check canonical tag
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    results.issues.push({ type: 'ERROR', message: 'Missing canonical tag' });
  } else {
    results.passed.push('Canonical tag present');
  }

  // Check Open Graph tags
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDescription = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  
  if (!ogTitle) results.issues.push({ type: 'ERROR', message: 'Missing og:title' });
  if (!ogDescription) results.issues.push({ type: 'ERROR', message: 'Missing og:description' });
  if (!ogImage) results.issues.push({ type: 'ERROR', message: 'Missing og:image' });
  if (ogTitle && ogDescription && ogImage) {
    results.passed.push('Open Graph tags complete');
  }

  // Check Twitter Card tags
  const twitterCard = $('meta[name="twitter:card"]').attr('content');
  if (!twitterCard) {
    results.warnings.push({ type: 'WARNING', message: 'Missing Twitter Card tag' });
  } else {
    results.passed.push('Twitter Card present');
  }

  // Check schema markup
  const schemaScripts = $('script[type="application/ld+json"]');
  if (schemaScripts.length === 0) {
    results.issues.push({ type: 'ERROR', message: 'Missing schema markup' });
  } else {
    results.passed.push(`Schema markup present (${schemaScripts.length} schemas)`);
  }

  // Check images without alt
  let imagesWithoutAlt = 0;
  $('img').each((i, img) => {
    if (!$(img).attr('alt')) imagesWithoutAlt++;
  });
  if (imagesWithoutAlt > 0) {
    results.warnings.push({ type: 'WARNING', message: `${imagesWithoutAlt} images without alt text` });
  } else {
    results.passed.push('All images have alt text');
  }

  return results;
}

// Audit blog posts
function auditBlogPosts() {
  const blogDir = path.join(__dirname, '..', 'blog');
  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));
  const results = [];

  files.forEach(file => {
    const html = readHTML(`blog/${file}`);
    if (!html) return;

    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    
    const blogResult = {
      file: file,
      hasTitle: !!title,
      titleLength: title.length,
      hasDescription: !!description,
      descriptionLength: description.length,
      hasSchema: $('script[type="application/ld+json"]').length > 0,
      hasOgTitle: !!$('meta[property="og:title"]').attr('content'),
      hasBrandInTitle: title.includes('Shiv Parmar'),
      issues: [],
    };

    if (!blogResult.hasBrandInTitle) {
      blogResult.issues.push('Missing brand name in title');
    }
    if (blogResult.descriptionLength < 120) {
      blogResult.issues.push('Description too short');
    }

    results.push(blogResult);
  });

  return results;
}

// Generate report
function generateReport(pageResults, blogResults) {
  const timestamp = new Date().toISOString().split('T')[0];
  const report = {
    date: timestamp,
    siteUrl: SITE_URL,
    summary: {
      totalPages: pageResults.length,
      totalIssues: 0,
      totalWarnings: 0,
      totalPassed: 0,
    },
    pages: pageResults,
    blogPosts: blogResults,
    recommendations: [],
  };

  // Calculate summary
  pageResults.forEach(page => {
    report.summary.totalIssues += page.issues ? page.issues.length : 0;
    report.summary.totalWarnings += page.warnings ? page.warnings.length : 0;
    report.summary.totalPassed += page.passed ? page.passed.length : 0;
  });

  // Generate recommendations
  if (report.summary.totalIssues > 0) {
    report.recommendations.push('Fix all ERROR issues immediately');
  }
  if (blogResults.some(b => !b.hasBrandInTitle)) {
    report.recommendations.push('Add "| Shiv Parmar" to all blog post titles');
  }
  if (blogResults.some(b => b.descriptionLength < 120)) {
    report.recommendations.push('Rewrite short meta descriptions');
  }

  return report;
}

// Save report
function saveReport(report) {
  const filename = `seo-audit-${report.date}.json`;
  const filepath = path.join(REPORT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`Report saved: ${filepath}`);
  
  // Also save as latest
  const latestPath = path.join(DATA_DIR, 'latest-audit.json');
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
  console.log(`Latest audit saved: ${latestPath}`);
}

// Main function
function main() {
  console.log('=== SEO Audit Started ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Site: ${SITE_URL}`);
  console.log('');

  ensureDirs();

  // Audit main pages
  console.log('Auditing main pages...');
  const pageResults = PAGES.map(page => {
    console.log(`  Checking ${page.name}...`);
    return auditPage(page);
  });

  // Audit blog posts
  console.log('Auditing blog posts...');
  const blogResults = auditBlogPosts();
  console.log(`  Found ${blogResults.length} blog posts`);

  // Generate report
  console.log('Generating report...');
  const report = generateReport(pageResults, blogResults);
  saveReport(report);

  // Print summary
  console.log('');
  console.log('=== Audit Summary ===');
  console.log(`Pages checked: ${report.summary.totalPages}`);
  console.log(`Issues: ${report.summary.totalIssues}`);
  console.log(`Warnings: ${report.summary.totalWarnings}`);
  console.log(`Passed: ${report.summary.totalPassed}`);
  
  if (report.recommendations.length > 0) {
    console.log('');
    console.log('Recommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }

  console.log('');
  console.log('=== Audit Complete ===');
}

// Run
main();
