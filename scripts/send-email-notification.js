/**
 * GitHub Actions Email Notification Script
 * Sends email when a new blog post is published
 */

const nodemailer = require('nodemailer');

async function sendEmail() {
  const { EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_TO, EMAIL_FROM, BLOG_TITLE, BLOG_DESC, BLOG_URL } = process.env;

  console.log('Email configuration:');
  console.log('  Username:', EMAIL_USERNAME);
  console.log('  To:', EMAIL_TO);
  console.log('  Blog Title:', BLOG_TITLE);
  console.log('  Blog URL:', BLOG_URL);

  if (!EMAIL_USERNAME || !EMAIL_PASSWORD || !EMAIL_TO || !EMAIL_FROM) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD
    }
  });

  const htmlContent = `
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
      .blog-url a { color: #c9a84c; }
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
        <div class="blog-title">${BLOG_TITLE || 'New Blog Post'}</div>
        <p class="blog-desc">${BLOG_DESC || 'A new blog post has been published.'}</p>
        <div class="blog-url">
          <strong>URL:</strong><br>
          <a href="${BLOG_URL}">${BLOG_URL}</a>
        </div>
        <a href="${BLOG_URL}" class="cta-btn">Read Blog &rarr;</a>
      </div>
      <div class="footer">
        <p>Shiv Parmar - WordPress Developer Portfolio</p>
        <p>This is an automated notification from your blog workflow.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: 'New Blog Published: ' + (BLOG_TITLE || 'New Blog Post'),
      html: htmlContent
    });

    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
}

sendEmail();
