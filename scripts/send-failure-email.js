/**
 * Sends a "blog publish failed" notification.
 * Usage:
 *   node scripts/send-failure-email.js            -> send for real
 *   node scripts/send-failure-email.js --dry-run  -> print, do not send
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

(function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.substring(0, eq).trim();
    let v = t.substring(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
})();

const QUEUE_FILE = process.env.QUEUE_FILE || path.join(__dirname, '..', 'blog-queue.json');
const FROM = 'parmarshiv1101@gmail.com';
const TO = 'parmarshiv1101@gmail.com';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildPayload() {
  let title = process.env.FAIL_TITLE || '';
  let slug = process.env.FAIL_SLUG || '';
  if (!title) {
    try {
      const q = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
      const b = q.blogs.find(x => x.status === 'pending');
      if (b) { title = b.title; slug = slug || b.slug; }
    } catch (e) { /* leave empty */ }
  }
  if (!title) title = '(queue empty)';

  const server = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const repo = process.env.GITHUB_REPOSITORY || 'shivparmar1101/shiv-parmar-portfolio';
  const runId = process.env.GITHUB_RUN_ID || '';
  const workflow = process.env.GITHUB_WORKFLOW || 'Auto Blog Publisher';
  const runUrl = runId ? `${server}/${repo}/actions/runs/${runId}` : `${server}/${repo}/actions`;
  const when = process.env.FAIL_TIME || new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  const prefix = process.env.FAIL_SUBJECT_PREFIX || '';

  const blogLink = slug
    ? '<div style="text-align:center;margin:20px 0"><a href="https://shiv-parmar-portfolio.netlify.app/blog" style="display:inline-block;background:#2d2d2d;color:#f0f0f0;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px">Open Blog List</a></div>'
    : '';

  const html =
    '<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#000;color:#f0f0f0;border-radius:12px;overflow:hidden;border:1px solid #333">' +
    '<div style="background:#c0392b;padding:20px;text-align:center"><h1 style="color:#fff;margin:0;font-size:22px">Blog Publish Failed</h1></div>' +
    '<div style="padding:24px">' +
    '<p style="color:#aaa;font-size:14px;margin:0 0 4px">2 attempts failed &mdash; this blog was <strong style="color:#e74c3c">NOT published</strong>:</p>' +
    '<h2 style="color:#f0f0f0;margin:4px 0 16px;font-size:19px">' + esc(title) + '</h2>' +
    '<table style="width:100%;font-size:13px;color:#888;border-collapse:collapse">' +
    '<tr><td style="padding:6px 0">Time</td><td style="text-align:right">' + esc(when) + '</td></tr>' +
    '<tr><td style="padding:6px 0">Workflow</td><td style="text-align:right">' + esc(workflow) + '</td></tr>' +
    '</table>' +
    '<div style="text-align:center;margin:24px 0"><a href="' + esc(runUrl) + '" style="display:inline-block;background:#c9a84c;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Logs</a></div>' +
    blogLink +
    '<p style="color:#555;font-size:11px;text-align:center;margin-top:20px">This slot was missed. Re-run the workflow manually or wait for the next scheduled slot.</p>' +
    '</div></div>';

  return {
    from: FROM,
    to: TO,
    subject: prefix + 'Blog Publish FAILED: ' + title,
    html,
    meta: { title, slug, when, runUrl, workflow }
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const mail = buildPayload();

  console.log('=========================================');
  console.log('Failure notification');
  console.log('=========================================');
  console.log('Subject:', mail.subject);
  console.log('Blog:', mail.meta.title);
  console.log('Slug:', mail.meta.slug || '(none)');
  console.log('Time:', mail.meta.when);
  console.log('Logs:', mail.meta.runUrl);
  console.log('Mode:', dryRun ? 'DRY RUN (not sending)' : 'LIVE SEND');

  if (dryRun) {
    console.log('\n--- HTML preview (first 300 chars) ---');
    console.log(mail.html.substring(0, 300) + '...');
    return 0;
  }

  if (!process.env.EMAIL_PASSWORD) {
    console.error('EMAIL_PASSWORD not set - cannot send.');
    return 1;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: FROM, pass: process.env.EMAIL_PASSWORD }
  });

  const info = await transporter.sendMail(mail);
  console.log('Email sent:', info.messageId);
  return 0;
}

if (require.main === module) {
  main().then(code => process.exit(code)).catch(err => {
    console.error('Failure email error:', err.message || err);
    process.exit(1);
  });
}

module.exports = { buildPayload };
