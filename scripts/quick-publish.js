/**
 * Quick Blog Publish Script
 * Automates: Git add -> Commit -> Push -> Email notification
 * 
 * Usage: node scripts/quick-publish.js [blog-slug]
 * Example: node scripts/quick-publish.js wordpress-ai-integration-guide-2026
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SITE_URL = 'https://shiv-parmar-portfolio.netlify.app';

function run(command) {
  try {
    console.log(`\n> ${command}`);
    const result = execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    return result;
  } catch (error) {
    console.error(`Error running: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function extractTitle(blogFile) {
  const content = fs.readFileSync(blogFile, 'utf-8');
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  return titleMatch ? titleMatch[1] : 'New Blog Post';
}

function extractDescription(blogFile) {
  const content = fs.readFileSync(blogFile, 'utf-8');
  const descMatch = content.match(/<meta name="description" content="(.*?)"/);
  return descMatch ? descMatch[1] : '';
}

async function main() {
  const blogSlug = process.argv[2];
  
  if (!blogSlug) {
    console.log('Usage: node scripts/quick-publish.js [blog-slug]');
    console.log('Example: node scripts/quick-publish.js wordpress-ai-integration-guide-2026');
    process.exit(1);
  }
  
  const blogFile = path.join(__dirname, '..', 'blog', `${blogSlug}.html`);
  
  if (!fs.existsSync(blogFile)) {
    console.error(`Blog file not found: ${blogFile}`);
    process.exit(1);
  }
  
  const title = extractTitle(blogFile);
  const blogUrl = `${SITE_URL}/blog/${blogSlug}`;
  
  console.log('========================================');
  console.log('Quick Blog Publish');
  console.log('========================================');
  console.log(`Blog: ${title}`);
  console.log(`URL: ${blogUrl}`);
  console.log('========================================');
  
  // Step 1: Git add
  console.log('\n[1/4] Adding files to git...');
  run('git add .');
  
  // Step 2: Git commit
  console.log('\n[2/4] Committing changes...');
  run(`git commit -m "Add blog: ${title}"`);
  
  // Step 3: Git push
  console.log('\n[3/4] Pushing to GitHub...');
  run('git push');
  
  // Step 4: Email notification
  console.log('\n[4/4] Sending email notification...');
  try {
    run(`node scripts/publish-blog.js ${blogSlug}`);
  } catch (e) {
    console.log('Email notification skipped (configure EMAIL_PASSWORD to enable)');
  }
  
  console.log('\n========================================');
  console.log('PUBLISH COMPLETE!');
  console.log('========================================');
  console.log(`\nYour blog is now live at:`);
  console.log(`${blogUrl}`);
  console.log('\nNetlify will auto-deploy in ~30 seconds.');
  console.log('========================================');
}

main().catch(console.error);
