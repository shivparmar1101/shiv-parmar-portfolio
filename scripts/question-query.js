#!/usr/bin/env node
/**
 * Shared question-query detection — the single source of truth for the
 * question-word regex used across SEO/AEO tooling.
 *
 * Consumers:
 *   - inject-faq-schema.js         builds FAQPage JSON-LD from question headings
 *   - track-keywords.js            tags tracked keywords as question queries
 *   - audit-question-headings.js   content audit for question coverage
 *
 * Why it matters: question queries power People Also Ask, featured snippets,
 * voice search and AI citations (AI Overviews / Perplexity / ChatGPT) — the
 * core of this site's Answer-Engine-Optimization strategy.
 */

// Leading words that mark a query or heading as a question.
const QUESTION_WORDS = [
  'what', 'how', 'why', 'when', 'where', 'which', 'who', 'whose', 'whom',
  'is', 'are', 'was', 'were',
  'do', 'does', 'did',
  'can', 'could', 'will', 'would', 'should', 'may', 'might',
  'has', 'have', 'had',
];

const QUESTION_PREFIX_RE = new RegExp('^(?:' + QUESTION_WORDS.join('|') + ')\\b', 'i');

// Boundaries kept identical to the original inject-faq-schema behaviour so
// existing FAQ output only ever grows with genuinely-new question headings.
const MIN_LEN = 6;
const MAX_LEN = 180;

/**
 * True when text reads as a question query/heading.
 * Matches a trailing "?" or a leading question word.
 */
function looksLikeQuestion(text) {
  const t = String(text).trim();
  if (t.length < MIN_LEN || t.length > MAX_LEN) return false;
  if (/\?\s*$/.test(t)) return true;
  return QUESTION_PREFIX_RE.test(t);
}

module.exports = { QUESTION_WORDS, QUESTION_PREFIX_RE, looksLikeQuestion };
