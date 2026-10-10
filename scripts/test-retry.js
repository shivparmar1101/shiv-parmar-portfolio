const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'retry-test-'));
const RETRY = path.join(__dirname, 'retry-generate.js');
const ORIG_QUEUE = path.join(__dirname, '..', 'blog-queue.json');
const ORIG_PUBLISHED = JSON.parse(fs.readFileSync(ORIG_QUEUE, 'utf8')).blogs.filter(b => b.status === 'published').length;

// mock generator: behaviour controlled by MOCK_MODE + a counter file
const MOCK = path.join(TMP, 'mock.js');
fs.writeFileSync(MOCK, `
const fs = require('fs');
const counter = process.env.MOCK_COUNTER;
const n = fs.existsSync(counter) ? parseInt(fs.readFileSync(counter, 'utf8'), 10) : 0;
fs.writeFileSync(counter, String(n + 1));
const mode = process.env.MOCK_MODE;
console.log('[mock] attempt#', n + 1, 'mode=', mode);
if (mode === 'always-fail') process.exit(1);
if (mode === 'fail-then-succeed' && n === 0) process.exit(1);
if (mode === 'fail-and-publish') {
  const q = JSON.parse(fs.readFileSync(process.env.QUEUE_FILE, 'utf-8'));
  const b = q.blogs.find(x => x.status === 'pending');
  b.status = 'published';
  fs.writeFileSync(process.env.QUEUE_FILE, JSON.stringify(q, null, 2));
  process.exit(1);
}
process.exit(0);
`);

function freshQueue() {
  const p = path.join(TMP, `queue-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(p, fs.readFileSync(ORIG_QUEUE, 'utf8'));
  return p;
}

function run(mode, opts = {}) {
  const queue = freshQueue();
  const counter = path.join(TMP, `counter-${Math.random().toString(36).slice(2)}`);
  const outFile = path.join(TMP, `ghout-${Math.random().toString(36).slice(2)}`);
  fs.writeFileSync(outFile, '');
  const res = spawnSync(process.execPath, [RETRY], {
    encoding: 'utf8',
    env: {
      ...process.env,
      BLOG_GENERATOR: MOCK,
      QUEUE_FILE: queue,
      MOCK_MODE: mode,
      MOCK_COUNTER: counter,
      GITHUB_OUTPUT: outFile,
      MAX_ATTEMPTS: String(opts.attempts || 2),
      RETRY_DELAY_MS: String(opts.delayMs === undefined ? 100 : opts.delayMs)
    }
  });
  const attempts = fs.readFileSync(outFile, 'utf8').trim();
  const runs = fs.existsSync(counter) ? parseInt(fs.readFileSync(counter, 'utf8'), 10) : 0;
  const q = JSON.parse(fs.readFileSync(queue, 'utf8'));
  const published = q.blogs.filter(b => b.status === 'published').length;
  return { code: res.status, attempts, runs, published, out: res.stdout + res.stderr, queue };
}

const scenarios = [
  {
    name: '1) success on first attempt',
    mode: 'succeed',
    expect: r => r.code === 0 && r.runs === 1 && r.attempts === 'attempts=1'
  },
  {
    name: '2) fail -> auto-retry -> success',
    mode: 'fail-then-succeed',
    expect: r => r.code === 0 && r.runs === 2 && r.attempts === 'attempts=2'
  },
  {
    name: '3) both attempts fail, blog still pending -> exit 1',
    mode: 'always-fail',
    expect: r => r.code === 1 && r.runs === 2 && r.attempts === 'attempts=2'
  },
  {
    name: '4) attempt fails BUT blog got written -> treated as success',
    mode: 'fail-and-publish',
    expect: r => r.code === 0 && r.runs === 1 && r.published === ORIG_PUBLISHED + 1
  }
];

let fail = 0;
for (const s of scenarios) {
  const r = run(s.mode);
  const ok = s.expect(r);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${s.name}`);
  if (!ok) console.log(`        code=${r.code} runs=${r.runs} out='${r.attempts}' published=${r.published}`);
}

// delay actually honoured?
const t0 = Date.now();
const r = run('fail-then-succeed', { delayMs: 1000 });
const elapsed = Date.now() - t0;
const delayOk = elapsed >= 950;
if (!delayOk) fail++;
console.log(`${delayOk ? 'PASS' : 'FAIL'}  5) retry delay respected (waited ${elapsed}ms, expected >=950ms)`);

// no-pending-blogs path
{
  const q = JSON.parse(fs.readFileSync(ORIG_QUEUE, 'utf8'));
  q.blogs.forEach(b => { b.status = 'published'; });
  const p = path.join(TMP, 'empty-queue.json');
  fs.writeFileSync(p, JSON.stringify(q, null, 2));
  const res = spawnSync(process.execPath, [RETRY], {
    encoding: 'utf8',
    env: { ...process.env, BLOG_GENERATOR: MOCK, QUEUE_FILE: p, MOCK_COUNTER: path.join(TMP, 'c0'), RETRY_DELAY_MS: '0' }
  });
  const ok = res.status === 0 && res.stdout.includes('No pending blogs');
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  6) empty queue -> exit 0, no run`);
}

console.log(`\n${scenarios.length + 2 - fail}/${scenarios.length + 2} passed`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
