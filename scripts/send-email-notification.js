/**
 * GitHub Actions Email Notification Script
 * Sends email when a new blog post is published
 * Design matches shiv-parmar-portfolio.netlify.app
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
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    </style>
  </head>
  <body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#f0f0f0;line-height:1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);box-shadow:0 8px 32px rgba(0,0,0,0.4);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#c9a84c 0%,#e8d48b 50%,#c9a84c 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#000000;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.02em;font-family:'Inter',sans-serif;">New Blog Published!</h1>
                <p style="color:rgba(0,0,0,0.7);font-size:14px;margin-top:8px;font-weight:500;font-family:'Inter',sans-serif;">WordPress Development Blog</p>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding:40px 30px;">
                
                <!-- Badge -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="background:rgba(201,168,76,0.15);color:#c9a84c;padding:6px 16px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border:1px solid rgba(201,168,76,0.3);font-family:'Inter',sans-serif;">
                      Just Published
                    </td>
                  </tr>
                </table>
                
                <!-- Blog Title -->
                <h2 style="font-size:24px;font-weight:800;color:#c9a84c;margin:0 0 16px;line-height:1.3;letter-spacing:-0.02em;font-family:'Inter',sans-serif;">
                  ${BLOG_TITLE || 'New Blog Post'}
                </h2>
                
                <!-- Description -->
                <p style="color:#a0a0a0;font-size:15px;line-height:1.7;margin:0 0 30px;font-family:'Inter',sans-serif;">
                  ${BLOG_DESC || 'A new blog post has been published on the WordPress development blog.'}
                </p>
                
                <!-- URL Section -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:12px;margin-bottom:30px;">
                  <tr>
                    <td style="padding:20px;">
                      <p style="font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;font-family:'Inter',sans-serif;">
                        Blog URL
                      </p>
                      <a href="${BLOG_URL}" style="color:#c9a84c;font-size:13px;word-break:break-all;text-decoration:underline;font-family:'JetBrains Mono',monospace;">
                        ${BLOG_URL}
                      </a>
                    </td>
                  </tr>
                </table>
                
                <!-- CTA Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background:linear-gradient(135deg,#c9a84c 0%,#e8d48b 50%,#c9a84c 100%);border-radius:12px;box-shadow:0 4px 20px rgba(201,168,76,0.3);">
                            <a href="${BLOG_URL}" style="display:inline-block;padding:16px 36px;color:#000000;text-decoration:none;font-weight:700;font-size:15px;font-family:'Inter',sans-serif;">
                              Read Blog &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding:30px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
                <p style="font-size:16px;font-weight:800;color:#f0f0f0;margin:0 0 8px;font-family:'Inter',sans-serif;">
                  shiv<span style="color:#c9a84c;">.</span>parmar
                </p>
                <p style="color:#666666;font-size:12px;margin:0 0 20px;font-family:'Inter',sans-serif;">
                  Shiv Parmar - WordPress Developer Portfolio
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                  <tr>
                    <td style="padding:0 8px;">
                      <a href="https://www.linkedin.com/in/shiv-parmar/" style="color:#c9a84c;text-decoration:underline;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;">
                        LinkedIn
                      </a>
                    </td>
                    <td style="padding:0 8px;color:#666666;">|</td>
                    <td style="padding:0 8px;">
                      <a href="https://github.com/shivparmar1101" style="color:#c9a84c;text-decoration:underline;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;">
                        GitHub
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
          </table>
        </td>
      </tr>
    </table>
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
