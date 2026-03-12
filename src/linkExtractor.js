/**
 * Pure-function utilities for extracting links and emails from message text.
 */

/**
 * Extract Google Form links from text.
 * Matches:
 *   https://forms.gle/xxxx
 *   https://docs.google.com/forms/d/xxxx
 *   http variants
 */
function extractGoogleFormLinks(text) {
  if (!text) return [];
  const regex = /https?:\/\/(?:forms\.gle\/[A-Za-z0-9_-]+|docs\.google\.com\/forms\/d\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_\-/?&=%.]*)?)/gi;
  const matches = text.match(regex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Extract all HTTP(S) URLs from text.
 */
function extractAllUrls(text) {
  if (!text) return [];
  const regex = /https?:\/\/[^\s<>"')\]]+/gi;
  const matches = text.match(regex);
  // Clean trailing punctuation that's likely not part of the URL
  const cleaned = matches
    ? matches.map(url => url.replace(/[.,;:!?)]+$/, ''))
    : [];
  return [...new Set(cleaned)];
}

/**
 * Extract valid email addresses from text.
 */
function extractEmails(text) {
  if (!text) return [];
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const matches = text.match(regex);
  return matches ? [...new Set(matches)] : [];
}

module.exports = {
  extractGoogleFormLinks,
  extractAllUrls,
  extractEmails,
};
