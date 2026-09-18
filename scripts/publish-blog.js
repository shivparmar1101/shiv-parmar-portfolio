/**
 * Blog Publish Script
 * Detects new blog posts and sends email notification
 * 
 * Usage: node scripts/publish-blog.js [blog-slug]
 * Example: node scripts/publish-blog.js wordpress-ai-integration-guide-2026
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Config
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const SITE_URL = 'https://shiv-parmar-portfolio.netlify.app';
const EMAIL_CONFIG = {
  to: process.env.EMAIL_TO || 'parmarshiv1101@gmail.com',
  from: process.env.EMAIL_FROM || 'parmarshiv1101@gmail.com'
};

/**
 * Extract blog metadata from HTML file
 */
function extractBlogMetadata(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract title
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : 'Untitled';
  
  // Extract description
  const descMatch = content.match(/<meta name="description" content="(.*?)"/);
  const description = descMatch ? descMatch[1] : '';
  
  // Extract keywords
  const keywordsMatch = content.match(/<meta name="keywords" content="(.*?)"/);
  const keywords = keywordsMatch ? keywordsMatch[1] : '';
  
  // Extract date
  const dateMatch = content.match(/<div class="date">(.*?)&middot;/);
  const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0];
  
  // Extract read time
  const readTimeMatch = content.match(/middot;\s*(\d+)\s*min read/);
  const readTime = readTimeMatch ? readTimeMatch[1] + ' min read' : '5 min read';
  
  return { title, description, keywords, date, readTime };
}

/**
 * Generate email HTML content
 */
function generateEmailHTML(title, description, blogUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #f0f0f0; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 16px; overflow: hidden; border: 1px solid #333; }
        .header { background: linear-gradient(135deg, #c9a84c, #e8c547); padding: 30px; text-align: center; }
        .header h1 { color: #000; margin: 0; font-size: 24px; font-weight: 800; }
        .content { padding: 30px; }
        .blog-title { font-size: 20px; font-weight: 700; color: #c9a84c; margin-bottom: 15px; line-height: 1.4; }
        .blog-desc { color: #a0a0a0; font-size: 15px; line-height: 1.6; margin-bottom: 25px; }
        .blog-url { color: #c9a84c; font-size: 14px; word-break: break-all; margin-bottom: 25px; }
        .cta-btn { display: inline-block; background: linear-gradient(135deg, #c9a84c, #e8c547); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; }
        .footer { padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #333; }
        .badge { display: inline-block; background: #c9a84c; color: #000; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Blog Published!</h1>
        </div>
        <div class="content">
          <span class="badge">Just Published</span>
          <div class="blog-title">${title}</div>
          <p class="blog-desc">${description}</p>
          <div class="blog-url">
            <strong>URL:</strong><br>
            <a href="${blogUrl}" style="color: #c9a84c;">${blogUrl}</a>
          </div>
          <a href="${blogUrl}" class="cta-btn">Read Blog &rarr;</a>
        </div>
        <div class="footer">
          <p>Shiv Parmar - WordPress Developer Portfolio</p>
          <p>This is an automated notification from your blog workflow.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send email using nodemailer (optional - requires npm install nodemailer)
 */
async function sendEmailNotification(title, description, blogUrl) {
  try {
    // Try to use nodemailer if available
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME || EMAIL_CONFIG.from,
        pass: process.env.EMAIL_PASSWORD || ''
      }
    });
    
    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      subject: `New Blog Published: ${title}`,
      html: generateEmailHTML(title, description, blogUrl)
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    // If nodemailer not available, just log the email content
    console.log('\n========================================');
    console.log('EMAIL NOTIFICATION (Manual Setup Required)');
    console.log('========================================');
    console.log(`To: ${EMAIL_CONFIG.to}`);
    console.log(`Subject: New Blog Published: ${title}`);
    console.log(`\nBlog URL: ${blogUrl}`);
    console.log(`\nEmail HTML content saved to: email-notification.html`);
    
    // Save email content to file
    const emailHTML = generateEmailHTML(title, description, blogUrl);
    fs.writeFileSync('email-notification.html', emailHTML);
    console.log('\nTo enable auto-email, run: npm install nodemailer');
    console.log('Then set EMAIL_PASSWORD environment variable.');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const blogSlug = process.argv[2];
  
  if (!blogSlug) {
    console.log('Usage: node scripts/publish-blog.js [blog-slug]');
    console.log('Example: node scripts/publish-blog.js wordpress-ai-integration-guide-2026');
    console.log('\nAvailable blogs:');
    
    // List all blog files
    const blogs = fs.readdirSync(BLOG_DIR)
      .filter(f => f.endsWith('.html'))
      .map(f => f.replace('.html', ''));
    
    blogs.forEach(blog => console.log(`  - ${blog}`));
    process.exit(1);
  }
  
  const blogFile = path.join(BLOG_DIR, `${blogSlug}.html`);
  
  if (!fs.existsSync(blogFile)) {
    console.error(`Blog file not found: ${blogFile}`);
    process.exit(1);
  }
  
  console.log('Blog Publish Script');
  console.log('==================\n');
  
  // Extract metadata
  console.log('Extracting blog metadata...');
  const metadata = extractBlogMetadata(blogFile);
  console.log(`Title: ${metadata.title}`);
  console.log(`Description: ${metadata.description}`);
  console.log(`Date: ${metadata.date}`);
  console.log(`Read Time: ${metadata.readTime}`);
  
  // Generate URL
  const blogUrl = `${SITE_URL}/blog/${blogSlug}`;
  console.log(`URL: ${blogUrl}`);
  
  // Send email notification
  console.log('\nSending email notification...');
  await sendEmailNotification(metadata.title, metadata.description, blogUrl);
  
  console.log('\n==================');
  console.log('Blog publish complete!');
  console.log('==================');
  
  // Git commands
  console.log('\nNext steps:');
  console.log('1. git add .');
  console.log('2. git commit -m "Add blog: ' + metadata.title + '"');
  console.log('3. git push');
  console.log('\nNetlify will auto-deploy your blog!');
}

// Run
main().catch(console.error);
