/**
 * Runs auto-blog-generator.js with automatic retries.
 * Exit 0 = published (or already published), Exit 1 = failed after all attempts.
 *
 * Env overrides (mainly for testing):
 *   BLOG_GENERATOR  path to generator script
 *   QUEUE_FILE      path to blog-queue.json
 *   MAX_ATTEMPTS    default 2
 *   RETRY_DELAY_MS  base delay in ms, default 30000 (doubles each retry)
 *
 * Retries use exponential backoff: RETRY_DELAY_MS * 2^(attempt-1),
 * so 30000 -> 30s, 60s, 120s, 240s... to ride out Gemini 503 spikes.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const GENERATOR = process.env.BLOG_GENERATOR || path.join(__dirname, 'auto-blog-generator.js');
const QUEUE_FILE = process.env.QUEUE_FILE || path.join(__dirname, '..', 'blog-queue.json');
const MAX_ATTEMPTS = Math.max(1, parseInt(process.env.MAX_ATTEMPTS || '2', 10) || 2);
const RETRY_DELAY_MS = Math.max(0, parseInt(process.env.RETRY_DELAY_MS || '30000', 10) || 0);

function readQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
}

function pendingSlug() {
  const b = readQueue().blogs.find(x => x.status === 'pending');
  return b ? b.slug : '';
}

function markOutput(name, value) {
  const p = process.env.GITHUB_OUTPUT;
  if (!p) return;
  try { fs.appendFileSync(p, `${name}=${value}\n`); } catch (e) { /* ignore */ }
}

function runOnce() {
  const res = spawnSync(process.execPath, [GENERATOR], { stdio: 'inherit', env: process.env });
  return res.status === 0;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=========================================');
  console.log('Auto Blog Publisher (retry runner)');
  console.log(`Generator: ${GENERATOR}`);
  console.log(`Attempts: ${MAX_ATTEMPTS}, delay: ${RETRY_DELAY_MS}ms`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('=========================================\n');

  const target = pendingSlug();
  if (!target) {
    console.log('No pending blogs in queue - nothing to do.');
    markOutput('attempts', 0);
    return 0;
  }
  console.log(`Target slug: ${target}`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`\n=========== ATTEMPT ${attempt} of ${MAX_ATTEMPTS} ===========`);

    if (runOnce()) {
      console.log(`\nSUCCESS on attempt ${attempt}`);
      markOutput('attempts', attempt);
      return 0;
    }

    console.log(`\nAttempt ${attempt} FAILED`);

    let status = 'missing';
    try {
      const b = readQueue().blogs.find(x => x.slug === target);
      status = b ? b.status : 'missing';
    } catch (e) {
      status = 'unreadable';
    }

    if (status !== 'pending') {
      console.log(`Target slug status is '${status}' - treating as success (output was written).`);
      markOutput('attempts', attempt);
      return 0;
    }

    if (attempt < MAX_ATTEMPTS) {
      // Exponential backoff: 30s, 60s, 120s, 240s...
      // Gemini 503 "high demand" spikes usually clear within a few minutes,
      // so a fixed short delay was not enough.
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Waiting ${delay / 1000}s before retry...`);
      await sleep(delay);
    }
  }

  console.error(`::error::Blog generation failed after ${MAX_ATTEMPTS} attempts (target: ${target})`);
  markOutput('attempts', MAX_ATTEMPTS);
  return 1;
}

if (require.main === module) {
  main().then(code => process.exit(code)).catch(err => {
    console.error('Retry runner error:', err.message || err);
    process.exit(1);
  });
}

module.exports = { pendingSlug, MAX_ATTEMPTS, RETRY_DELAY_MS };
