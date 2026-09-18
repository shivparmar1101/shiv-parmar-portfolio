/**
 * Generate SEO Report
 * Creates comprehensive report from all checks
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');
const DATA_DIR = path.join(ROOT_DIR, 'seo-data');

function generateReport() {
  console.log('=== Report Generation Started ===');
  
  // Ensure directories exist
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  
  // Read all existing reports
  const reports = {};
  if (fs.existsSync(REPORT_DIR)) {
    const files = fs.readdirSync(REPORT_DIR);
    files.forEach(file => {
      if (file.endsWith('.json') && file.includes(timestamp)) {
        const name = file.replace(`-${timestamp}.json`, '');
        try {
          reports[name] = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), 'utf8'));
        } catch (e) {
          console.log(`  Skipping ${file}`);
        }
      }
    });
  }

  // Generate comprehensive report
  const report = {
    date: timestamp,
    generatedAt: new Date().toISOString(),
    siteUrl: 'https://shiv-parmar-portfolio.netlify.app',
    summary: {
      overallScore: 0,
      totalPages: 0,
      totalIssues: 0,
      totalWarnings: 0,
      totalPassed: 0,
    },
    sections: reports,
    actionPlan: {
      immediate: [],
      thisWeek: [],
      thisMonth: [],
    },
    nextReview: {
      daily: 'Check Google Search Console queries',
      weekly: 'Run Google Trends check',
      monthly: 'Full keyword audit',
    },
  };

  // Calculate overall score
  let totalScore = 0;
  let sectionCount = 0;
  
  Object.values(reports).forEach(r => {
    if (r.score !== undefined) {
      totalScore += r.score;
      sectionCount++;
    }
    if (r.summary) {
      report.summary.totalPages += r.summary.totalPages || r.summary.totalFiles || 0;
      report.summary.totalIssues += r.summary.totalIssues || 0;
      report.summary.totalWarnings += r.summary.totalWarnings || 0;
      report.summary.totalPassed += r.summary.totalPassed || 0;
    }
  });

  report.summary.overallScore = sectionCount > 0 ? Math.round(totalScore / sectionCount) : 0;

  // Generate action plan
  if (report.summary.totalIssues > 0) {
    report.actionPlan.immediate.push('Fix all ERROR issues');
  }
  
  // Check for specific issues
  if (reports.blogSeo) {
    const blogIssues = reports.blogSeo.results || [];
    const missingBrand = blogIssues.filter(r => r.title && !r.title.hasBrand).length;
    if (missingBrand > 0) {
      report.actionPlan.thisWeek.push(`Add brand name to ${missingBrand} blog post titles`);
    }
    
    const shortDesc = blogIssues.filter(r => r.description && r.description.length < 120).length;
    if (shortDesc > 0) {
      report.actionPlan.thisWeek.push(`Rewrite ${shortDesc} short meta descriptions`);
    }
  }

  if (reports.sitemapValidation && !reports.sitemapValidation.valid) {
    report.actionPlan.immediate.push('Fix sitemap issues');
  }

  if (reports.performance && reports.performance.score < 80) {
    report.actionPlan.thisWeek.push('Improve page performance');
  }

  // Save report
  const filepath = path.join(REPORT_DIR, `comprehensive-report-${timestamp}.json`);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  
  // Save as latest
  const latestPath = path.join(DATA_DIR, 'latest-report.json');
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));

  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const mdPath = path.join(REPORT_DIR, `SEO-REPORT-${timestamp}.md`);
  fs.writeFileSync(mdPath, markdownReport);

  console.log('');
  console.log('=== Report Generated ===');
  console.log(`JSON: ${filepath}`);
  console.log(`Markdown: ${mdPath}`);
  
  return report;
}

function generateMarkdownReport(report) {
  let md = `# SEO Report - ${report.date}\n\n`;
  md += `**Generated:** ${report.generatedAt}\n`;
  md += `**Site:** ${report.siteUrl}\n\n`;
  
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Overall Score | ${report.summary.overallScore}% |\n`;
  md += `| Total Pages | ${report.summary.totalPages} |\n`;
  md += `| Issues | ${report.summary.totalIssues} |\n`;
  md += `| Warnings | ${report.summary.totalWarnings} |\n`;
  md += `| Passed | ${report.summary.totalPassed} |\n\n`;
  
  md += `## Action Plan\n\n`;
  
  if (report.actionPlan.immediate.length > 0) {
    md += `### Immediate (Today)\n`;
    report.actionPlan.immediate.forEach(item => {
      md += `- [ ] ${item}\n`;
    });
    md += `\n`;
  }
  
  if (report.actionPlan.thisWeek.length > 0) {
    md += `### This Week\n`;
    report.actionPlan.thisWeek.forEach(item => {
      md += `- [ ] ${item}\n`;
    });
    md += `\n`;
  }
  
  if (report.actionPlan.thisMonth.length > 0) {
    md += `### This Month\n`;
    report.actionPlan.thisMonth.forEach(item => {
      md += `- [ ] ${item}\n`;
    });
    md += `\n`;
  }
  
  md += `## Next Review Schedule\n\n`;
  md += `- **Daily:** ${report.nextReview.daily}\n`;
  md += `- **Weekly:** ${report.nextReview.weekly}\n`;
  md += `- **Monthly:** ${report.nextReview.monthly}\n\n`;
  
  md += `---\n\n`;
  md += `*Report auto-generated by GitHub Actions SEO Monitor*\n`;
  
  return md;
}

function main() {
  const report = generateReport();
  
  // Print summary
  console.log('');
  console.log('=== Report Summary ===');
  console.log(`Overall Score: ${report.summary.overallScore}%`);
  console.log(`Total Issues: ${report.summary.totalIssues}`);
  console.log(`Total Warnings: ${report.summary.totalWarnings}`);
  
  if (report.actionPlan.immediate.length > 0) {
    console.log('');
    console.log('Immediate Actions:');
    report.actionPlan.immediate.forEach(item => {
      console.log(`  - ${item}`);
    });
  }
  
  console.log('');
  console.log('=== Done ===');
}

main();
