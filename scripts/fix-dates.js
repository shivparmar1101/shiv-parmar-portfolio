const fs = require('fs');
const path = require('path');
const BLOG_DIR = path.join(__dirname, '..', 'blog');

const dateMap = {
  'Aug 25, 2026': '2026-08-25',
  'Aug 24, 2026': '2026-08-24',
  'Aug 23, 2026': '2026-08-23',
  'Aug 22, 2026': '2026-08-22',
  'Aug 21, 2026': '2026-08-21',
  'Aug 20, 2026': '2026-08-20',
  'Aug 19, 2026': '2026-08-19',
  'Aug 18, 2026': '2026-08-18',
  'Aug 17, 2026': '2026-08-17',
  'Aug 16, 2026': '2026-08-16',
  'Aug 15, 2026': '2026-08-15',
  'Aug 14, 2026': '2026-08-14',
  'Aug 13, 2026': '2026-08-13',
  'Aug 12, 2026': '2026-08-12',
  'Aug 11, 2026': '2026-08-11',
  'Aug 10, 2026': '2026-08-10',
  'Aug 09, 2026': '2026-08-09',
  'Aug 08, 2026': '2026-08-08',
  'Aug 07, 2026': '2026-08-07',
  'Aug 06, 2026': '2026-08-06',
  'Aug 05, 2026': '2026-08-05',
  'Aug 04, 2026': '2026-08-04',
  'Aug 03, 2026': '2026-08-03',
  'Aug 02, 2026': '2026-08-02',
  'Aug 01, 2026': '2026-08-01',
  'July 31, 2026': '2026-07-31',
  'July 30, 2026': '2026-07-30',
  'July 29, 2026': '2026-07-29',
  'July 28, 2026': '2026-07-28',
  'July 27, 2026': '2026-07-27',
  'July 26, 2026': '2026-07-26',
  'July 25, 2026': '2026-07-25',
  'July 24, 2026': '2026-07-24',
  'July 23, 2026': '2026-07-23',
  'July 22, 2026': '2026-07-22',
  'July 21, 2026': '2026-07-21',
  'July 20, 2026': '2026-07-20',
  'July 19, 2026': '2026-07-19',
  'July 18, 2026': '2026-07-18',
  'July 17, 2026': '2026-07-17',
  'July 16, 2026': '2026-07-16',
  'July 15, 2026': '2026-07-15',
  'July 14, 2026': '2026-07-14',
  'July 13, 2026': '2026-07-13',
  'July 12, 2026': '2026-07-12',
  'July 11, 2026': '2026-07-11',
  'July 10, 2026': '2026-07-10',
  'July 09, 2026': '2026-07-09',
  'July 08, 2026': '2026-07-08',
  'July 07, 2026': '2026-07-07',
  'July 06, 2026': '2026-07-06',
  'July 05, 2026': '2026-07-05',
  'July 04, 2026': '2026-07-04',
  'July 03, 2026': '2026-07-03',
  'July 02, 2026': '2026-07-02',
  'July 01, 2026': '2026-07-01',
};

function fixDateFormat(filename) {
  const filepath = path.join(BLOG_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  let changed = false;
  
  for (const [oldDate, newDate] of Object.entries(dateMap)) {
    if (html.includes(oldDate)) {
      html = html.replace(new RegExp(oldDate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newDate);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filepath, html);
    console.log(`Fixed: ${filename}`);
    return true;
  }
  console.log(`Skipped: ${filename}`);
  return false;
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
let count = 0;
for (const f of files) { if (fixDateFormat(f)) count++; }
console.log(`\nTotal: ${count} blogs updated`);
