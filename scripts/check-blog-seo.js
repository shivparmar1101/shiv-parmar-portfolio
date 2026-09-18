/**
 * Check Blog Post SEO
 * Validates all blog posts for SEO best practices
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT_DIR = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT_DIR, 'blog');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');

// SEO Rules for blog posts
const RULES = {
  title: { min: 30, max: 65 },
  description: { min: 120, max: 320 },
  keywords: { min: 3, max: 10 },
  content: { minWords: 500 },
  headings: { min: 3 },
};

function checkBlogPost(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  if (!fs.existsSync(filepath)) return null;

  const html = fs.readFileSync(filepath, 'utf8');
  const $ = cheerio.load(html);

  const result = {
    file: filename,
    title: {
      content: $('title').text().trim(),
      hasBrand: $('title').text().includes('Shiv Parmar'),
      length: $('title').text().trim().length,
      issues: [],
    },
    description: {
      content: $('meta[name="description"]').attr('content') || '',
      length: ($('meta[name="description"]').attr('content') || '').length,
      issues: [],
    },
    keywords: {
      content: $('meta[name="keywords"]').attr('content') || '',
      count: ($('meta[name="keywords"]').attr('content') || '').split(',').length,
      issues: [],
    },
    content: {
      wordCount: $('article').text().split(/\s+/).length,
      headingCount: $('h1, h2, h3').length,
      imageCount: $('img').length,
      imagesWithoutAlt: $('img:not([alt])').length,
      links: $('a').length,
    },
    schema: {
      hasSchema: $('script[type="application/ld+json"]').length > 0,
      type: null,
    },
    og: {
      hasTitle: !!$('meta[property="og:title"]').attr('content'),
      hasDescription: !!$('meta[property="og:description"]').attr('content'),
      hasImage: !!$('meta[property="og:image"]').attr('content'),
      hasArticle: !!$('meta[property="article:published_time"]').attr('content'),
    },
    issues: [],
    warnings: [],
    passed: [],
    score: 100,
  };

  // Check title
  if (!result.title.content) {
    result.title.issues.push('Missing title');
  } else {
    if (result.title.length < RULES.title.min) {
      result.title.issues.push(`Title too short (${result.title.length} chars)`);
    } else if (result.title.length > RULES.title.max) {
      result.title.issues.push(`Title too long (${result.title.length} chars)`);
    } else {
      result.passed.push('Title length OK');
    }
    if (!result.title.hasBrand) {
      result.title.issues.push('Missing brand name "Shiv Parmar"');
    } else {
      result.passed.push('Brand name present');
    }
  }

  // Check description
  if (!result.description.content) {
    result.description.issues.push('Missing meta description');
  } else {
    if (result.description.length < RULES.description.min) {
      result.description.issues.push(`Description too short (${result.description.length} chars)`);
    } else if (result.description.length > RULES.description.max) {
      result.description.issues.push(`Description too long (${result.description.length} chars)`);
    } else {
      result.passed.push('Description length OK');
    }
  }

  // Check keywords
  if (!result.keywords.content) {
    result.keywords.issues.push('Missing meta keywords');
  } else {
    if (result.keywords.count < RULES.keywords.min) {
      result.keywords.issues.push(`Too few keywords (${result.keywords.count})`);
    } else if (result.keywords.count > RULES.keywords.max) {
      result.keywords.issues.push(`Too many keywords (${result.keywords.count})`);
    } else {
      result.passed.push('Keyword count OK');
    }
  }

  // Check content
  if (result.content.wordCount < RULES.content.minWords) {
    result.issues.push(`Content too short (${result.content.wordCount} words)`);
  } else {
    result.passed.push('Content length OK');
  }

  if (result.content.headingCount < RULES.headings.min) {
    result.warnings.push(`Too few headings (${result.content.headingCount})`);
  } else {
    result.passed.push('Heading count OK');
  }

  if (result.content.imagesWithoutAlt > 0) {
    result.warnings.push(`${result.content.imagesWithoutAlt} images without alt text`);
  } else {
    result.passed.push('All images have alt text');
  }

  // Check schema
  if (!result.schema.hasSchema) {
    result.issues.push('Missing schema markup');
  } else {
    result.passed.push('Schema markup present');
  }

  // Check OG tags
  if (!result.og.hasTitle) result.issues.push('Missing og:title');
  if (!result.og.hasDescription) result.issues.push('Missing og:description');
  if (!result.og.hasImage) result.issues.push('Missing og:image');
  if (!result.og.hasArticle) result.warnings.push('Missing article:published_time');
  
  if (result.og.hasTitle && result.og.hasDescription && result.og.hasImage) {
    result.passed.push('OG tags complete');
  }

  // Calculate score
  result.score -= result.issues.length * 15;
  result.score -= result.warnings.length * 5;
  result.score = Math.max(0, result.score);

  return result;
}

function main() {
  console.log('=== Blog Post SEO Check Started ===');
  
  // Ensure directories exist
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  if (!fs.existsSync(BLOG_DIR)) {
    console.error('Blog directory not found!');
    return;
  }

  // Get all blog files
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  console.log(`Found ${files.length} blog posts`);

  const results = files.map(file => {
    console.log(`  Checking ${file}...`);
    return checkBlogPost(file);
  }).filter(r => r !== null);

  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const report = {
    date: timestamp,
    totalPosts: results.length,
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
    if (!result.title.hasBrand) {
      report.actionItems.push({
        file: result.file,
        action: 'Add "| Shiv Parmar" to title',
        priority: 'high',
      });
    }
    if (result.description.length < 120) {
      report.actionItems.push({
        file: result.file,
        action: 'Rewrite meta description (too short)',
        priority: 'high',
      });
    }
  });

  // Save report
  const filepath = path.join(REPORT_DIR, `blog-seo-${timestamp}.json`);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('');
  console.log('=== Blog SEO Summary ===');
  console.log(`Total posts: ${report.totalPosts}`);
  console.log(`Perfect (100%): ${report.summary.perfect}`);
  console.log(`Good (80-99%): ${report.summary.good}`);
  console.log(`Needs Work (60-79%): ${report.summary.needsWork}`);
  console.log(`Critical (<60%): ${report.summary.critical}`);
  
  if (report.actionItems.length > 0) {
    console.log('');
    console.log('Action Items:');
    report.actionItems.slice(0, 10).forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.file}] ${item.action}`);
    });
  }

  console.log('');
  console.log('=== Check Complete ===');
}

main();
