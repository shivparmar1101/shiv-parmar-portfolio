#!/usr/bin/env node
/**
 * E-E-A-T Author Box Standardizer
 * Ensures EVERY blog post has:
 *   1. An author box with real photo + bio + LinkedIn/GitHub/Email (Experience signal)
 *   2. A Person JSON-LD schema (author entity for Google + AI search)
 *   3. rel="author" + visible byline
 * Idempotent - safe to run on every publish.
 *
 * Run: node scripts/standardize-author-box.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const AUTHOR_MARKER = '<!-- AUTO_AUTHOR_BOX -->';
const PERSON_MARKER = '<!-- AUTO_PERSON_SCHEMA -->';

const PERSON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Shiv Parmar',
  url: 'https://shiv-parmar-portfolio.netlify.app/',
  jobTitle: 'WordPress Developer',
  email: 'mailto:parmarshiv1101@gmail.com',
  telephone: '+91-73594-11663',
  image: 'https://shiv-parmar-portfolio.netlify.app/images/shiv-parmar-wordpress-developer.jpg',
  sameAs: [
    'https://www.linkedin.com/in/shiv-parmar/',
    'https://github.com/shivparmar1101',
    'https://twitter.com/shivparmar1101'
  ],
  knowsAbout: ['WordPress', 'WooCommerce', 'PHP', 'JavaScript', 'WordPress Performance', 'WordPress Security'],
  description: 'WordPress developer with 4+ years of experience building custom themes, WooCommerce stores, plugins and REST API integrations. Available worldwide.'
};

const ICONS = {
  linkedin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  github: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.769.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
  email: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'
};

const AUTHOR_BOX = `${AUTHOR_MARKER}
<div class="author-box" itemscope itemtype="https://schema.org/Person" rel="author">
  <img src="../images/shiv-parmar-wordpress-developer.jpg" alt="Shiv Parmar - WordPress Developer" title="Shiv Parmar - WordPress Developer" width="120" height="120" loading="lazy" decoding="async">
  <div class="author-info">
    <h4 itemprop="name">Shiv Parmar</h4>
    <p itemprop="jobTitle">WordPress Developer</p>
    <p itemprop="description">WordPress developer with 4+ years of experience building custom themes, WooCommerce stores, plugins and high-performance sites. I've delivered 30+ WordPress projects for clients worldwide (Santushti Infotech, Guru Technolab, DM Weboft LLP). Available for hire worldwide.</p>
    <div class="author-social">
      <a href="https://linkedin.com/in/shiv-parmar" target="_blank" rel="noopener nofollow me" itemprop="sameAs" title="Shiv Parmar on LinkedIn">${ICONS.linkedin}LinkedIn</a>
      <a href="https://github.com/shivparmar1101" target="_blank" rel="noopener nofollow me" itemprop="sameAs" title="Shiv Parmar on GitHub">${ICONS.github}GitHub</a>
      <a href="mailto:parmarshiv1101@gmail.com" itemprop="email" title="Email Shiv Parmar">${ICONS.email}Email</a>
    </div>
  </div>
</div>`;

function ensureAuthorBox(html) {
  if (html.includes(AUTHOR_MARKER)) return html; // already standardized
  if (html.includes('class="author-box"')) {
    // Has an old author box - prepend marker so future runs recognize it
    const idx = html.indexOf('class="author-box"');
    const start = html.lastIndexOf('<div', idx);
    return html.slice(0, start) + AUTHOR_MARKER + '\n' + html.slice(start);
  }
  // No author box at all - insert before related-blogs section or before </article>
  if (html.includes('<div class="related-blogs">')) {
    const idx = html.indexOf('<div class="related-blogs">');
    return html.slice(0, idx) + AUTHOR_BOX + '\n\n' + html.slice(idx);
  }
  if (html.includes('</article>')) {
    const idx = html.lastIndexOf('</article>');
    return html.slice(0, idx) + AUTHOR_BOX + '\n' + html.slice(idx);
  }
  return null;
}

function ensurePersonSchema(html) {
  if (html.includes(PERSON_MARKER)) return html;
  if (html.includes('"@type": "Person"') && html.includes('schema.org')) {
    const idx = html.lastIndexOf('</head>');
    if (idx === -1) return html;
    return html.slice(0, idx) + `  ${PERSON_MARKER}\n  <script type="application/ld+json">\n${JSON.stringify(PERSON_SCHEMA, null, 2)}\n  </script>\n` + html.slice(idx);
  }
  const idx = html.lastIndexOf('</head>');
  if (idx === -1) return null;
  return html.slice(0, idx) + `  ${PERSON_MARKER}\n  <script type="application/ld+json">\n${JSON.stringify(PERSON_SCHEMA, null, 2)}\n  </script>\n` + html.slice(idx);
}

function main() {
  if (!fs.existsSync(BLOG_DIR)) { console.log('No blog dir'); return; }
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  let updated = 0;
  for (const f of files) {
    const file = path.join(BLOG_DIR, f);
    let html = fs.readFileSync(file, 'utf8');
    const withAuthor = ensureAuthorBox(html);
    if (withAuthor === null) { console.log('  skip (no anchor): ' + f); continue; }
    const withSchema = ensurePersonSchema(withAuthor);
    if (withSchema && withSchema !== html) {
      fs.writeFileSync(file, withSchema);
      updated++;
    }
  }
  console.log(`E-E-A-T: standardized ${updated} / ${files.length} posts`);
}

module.exports = { ensureAuthorBox, ensurePersonSchema, AUTHOR_BOX };

if (require.main === module) main();
