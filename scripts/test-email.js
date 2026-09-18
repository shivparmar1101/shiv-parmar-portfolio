/**
 * Test Email Script
 * Sends a test email to verify email notification setup
 * 
 * Usage: node scripts/test-email.js
 */

const nodemailer = require('nodemailer');

// Email Config
const config = {
  from: 'parmarshiv1101@gmail.com',
  to: 'parmarshiv1101@gmail.com',
  subject: 'Test Email - Blog Notification System Working!',
  password: 'wwok yben jcoh atqj'
};

// Email HTML Template
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
    .success-badge { display: inline-block; background: #22c55e; color: #fff; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
    .info-box { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .info-label { color: #888; font-size: 14px; }
    .info-value { color: #c9a84c; font-size: 14px; font-weight: 600; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #c9a84c, #e8c547); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 20px; }
    .footer { padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #333; }
    .checklist { margin: 20px 0; }
    .checklist-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .check-icon { color: #22c55e; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Email Notification Test</h1>
    </div>
    <div class="content">
      <div class="success-badge">Test Successful!</div>
      
      <p style="color: #a0a0a0; font-size: 15px; line-height: 1.6;">
        Congratulations! Your blog email notification system is working correctly.
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value">Active</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email Provider:</span>
          <span class="info-value">Gmail SMTP</span>
        </div>
        <div class="info-row">
          <span class="info-label">From:</span>
          <span class="info-value">parmarshiv1101@gmail.com</span>
        </div>
        <div class="info-row">
          <span class="info-label">To:</span>
          <span class="info-value">parmarshiv1101@gmail.com</span>
        </div>
        <div class="info-row">
          <span class="info-label">Test Time:</span>
          <span class="info-value">${new Date().toLocaleString()}</span>
        </div>
      </div>
      
      <p style="color: #a0a0a0; font-size: 14px; margin-top: 20px;">
        When you publish a blog post, you'll receive an email like this:
      </p>
      
      <div class="checklist">
        <div class="checklist-item">
          <span class="check-icon">✓</span>
          <span style="color: #f0f0f0; font-size: 14px;">Blog title in subject line</span>
        </div>
        <div class="checklist-item">
          <span class="check-icon">✓</span>
          <span style="color: #f0f0f0; font-size: 14px;">Blog description in email body</span>
        </div>
        <div class="checklist-item">
          <span class="check-icon">✓</span>
          <span style="color: #f0f0f0; font-size: 14px;">Direct link to blog post</span>
        </div>
        <div class="checklist-item">
          <span class="check-icon">✓</span>
          <span style="color: #f0f0f0; font-size: 14px;">"Read Blog" button</span>
        </div>
      </div>
      
      <a href="https://shiv-parmar-portfolio.netlify.app/blog" class="cta-btn">View Your Blog &rarr;</a>
    </div>
    <div class="footer">
      <p>Shiv Parmar - WordPress Developer Portfolio</p>
      <p>This is a test email from your blog notification system.</p>
    </div>
  </div>
</body>
</html>
`;

async function sendTestEmail() {
  console.log('========================================');
  console.log('Test Email Script');
  console.log('========================================\n');
  
  try {
    // Create transporter
    console.log('Creating Gmail transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.from,
        pass: config.password
      }
    });
    
    // Verify connection
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('Connection verified!\n');
    
    // Send email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: config.from,
      to: config.to,
      subject: config.subject,
      html: htmlContent
    });
    
    console.log('========================================');
    console.log('EMAIL SENT SUCCESSFULLY!');
    console.log('========================================');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`To: ${config.to}`);
    console.log(`Subject: ${config.subject}`);
    console.log('\nCheck your inbox for the test email!');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n========================================');
    console.error('ERROR SENDING EMAIL');
    console.error('========================================');
    console.error(`Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.error('\nAuthentication failed!');
      console.error('Please check:');
      console.error('1. Gmail App Password is correct');
      console.error('2. 2-Step Verification is enabled');
      console.error('3. App Password is for "Mail" app');
    }
    
    console.error('========================================');
  }
}

// Run
sendTestEmail();
