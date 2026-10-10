/**
 * API Setup Verification Script
 * Checks all required APIs and environment variables
 *
 * Usage: node scripts/setup-apis.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env if exists (simple parser, no dotenv dependency)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.substring(0, eq).trim();
    let value = trimmed.substring(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

function check(name, value, hint) {
  if (value) {
    console.log(`  ✓ ${name}: SET (length: ${value.length})`);
    return true;
  }
  console.log(`  ✗ ${name}: NOT SET`);
  if (hint) console.log(`    → ${hint}`);
  return false;
}

function testGemini() {
  return new Promise((resolve) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.log('  ✗ Gemini API: SKIPPED (no key)');
      return resolve(false);
    }

    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const postData = JSON.stringify({
      contents: [{ parts: [{ text: 'Say OK' }] }],
      generationConfig: { maxOutputTokens: 10 }
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key
      },
      timeout: 30000
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.candidates && j.candidates[0]) {
            console.log(`  ✓ Gemini API: WORKING (model: ${model})`);
            resolve(true);
          } else {
            const msg = (j.error && j.error.message) || data.substring(0, 150);
            console.log(`  ✗ Gemini API: FAILED - ${msg}`);
            resolve(false);
          }
        } catch (e) {
          console.log(`  ✗ Gemini API: Invalid response`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`  ✗ Gemini API: Network error - ${e.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('  ✗ Gemini API: Timeout');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

function testEmail() {
  return new Promise((resolve) => {
    const pass = process.env.EMAIL_PASSWORD;
    const user = process.env.EMAIL_USERNAME || 'parmarshiv1101@gmail.com';

    if (!pass) {
      console.log('  ✗ Gmail SMTP: SKIPPED (no EMAIL_PASSWORD)');
      console.log('    → Create App Password: Google Account → Security → 2FA → App Passwords');
      return resolve(false);
    }

    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch {
      console.log('  ✗ Gmail SMTP: nodemailer not installed (run npm install)');
      return resolve(false);
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });

    transporter.verify()
      .then(() => {
        console.log(`  ✓ Gmail SMTP: WORKING (${user})`);
        resolve(true);
      })
      .catch((err) => {
        console.log(`  ✗ Gmail SMTP: FAILED - ${err.message}`);
        if (err.code === 'EAUTH') {
          console.log('    → Check App Password (16 chars) and 2FA enabled');
        }
        resolve(false);
      });
  });
}

async function main() {
  console.log('========================================');
  console.log('API Setup Verification');
  console.log('========================================\n');

  console.log('Environment Variables:');
  const hasGemini = check('GEMINI_API_KEY', process.env.GEMINI_API_KEY, 'Get from https://aistudio.google.com/apikey');
  check('GEMINI_MODEL', process.env.GEMINI_MODEL || 'gemini-3.8-flash (default)');
  const hasEmailPass = check('EMAIL_PASSWORD', process.env.EMAIL_PASSWORD, 'Gmail App Password (16 chars)');
  check('EMAIL_USERNAME', process.env.EMAIL_USERNAME || 'parmarshiv1101@gmail.com (default)');

  console.log('\nAPI Tests:');
  if (hasGemini) {
    await testGemini();
  } else {
    console.log('  ✗ Gemini API: SKIPPED');
  }

  if (hasEmailPass) {
    await testEmail();
  } else {
    console.log('  ✗ Gmail SMTP: SKIPPED');
  }

  console.log('\n========================================');
  console.log('Setup Status Summary');
  console.log('========================================');
  console.log('Files:');
  console.log(`  .env: ${fs.existsSync(path.join(__dirname, '..', '.env')) ? 'EXISTS' : 'MISSING (copy .env.example)'}`);
  console.log(`  .env.example: ${fs.existsSync(path.join(__dirname, '..', '.env.example')) ? 'EXISTS' : 'MISSING'}`);
  console.log('');
  console.log('GitHub Secrets needed (for Actions):');
  console.log('  Settings → Secrets and variables → Actions');
  console.log('  1. GEMINI_API_KEY');
  console.log('  2. EMAIL_PASSWORD');
  console.log('');
  console.log('========================================');
}

main().catch(console.error);
