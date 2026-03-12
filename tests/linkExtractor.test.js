const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  extractGoogleFormLinks,
  extractAllUrls,
  extractEmails,
} = require('../src/linkExtractor');

// ── Google Form Links ────────────────────────────────────────────────────────

describe('extractGoogleFormLinks', () => {
  it('should extract forms.gle short links', () => {
    const text = 'Apply here: https://forms.gle/abc123XYZ and more text';
    assert.deepStrictEqual(extractGoogleFormLinks(text), ['https://forms.gle/abc123XYZ']);
  });

  it('should extract docs.google.com/forms links', () => {
    const text = 'Link: https://docs.google.com/forms/d/1aBcDeF/viewform?usp=sf_link';
    const result = extractGoogleFormLinks(text);
    assert.strictEqual(result.length, 1);
    assert.ok(result[0].startsWith('https://docs.google.com/forms/d/'));
  });

  it('should extract multiple form links', () => {
    const text = 'https://forms.gle/aaa and also https://forms.gle/bbb';
    assert.strictEqual(extractGoogleFormLinks(text).length, 2);
  });

  it('should deduplicate form links', () => {
    const text = 'https://forms.gle/same https://forms.gle/same';
    assert.strictEqual(extractGoogleFormLinks(text).length, 1);
  });

  it('should return empty array for no matches', () => {
    assert.deepStrictEqual(extractGoogleFormLinks('no links here'), []);
  });

  it('should handle null/undefined input', () => {
    assert.deepStrictEqual(extractGoogleFormLinks(null), []);
    assert.deepStrictEqual(extractGoogleFormLinks(undefined), []);
  });
});

// ── All URLs ─────────────────────────────────────────────────────────────────

describe('extractAllUrls', () => {
  it('should extract HTTP and HTTPS URLs', () => {
    const text = 'Visit http://example.com or https://secure.example.com/path';
    assert.strictEqual(extractAllUrls(text).length, 2);
  });

  it('should strip trailing punctuation', () => {
    const text = 'Check this link: https://example.com.';
    assert.deepStrictEqual(extractAllUrls(text), ['https://example.com']);
  });

  it('should return empty for no URLs', () => {
    assert.deepStrictEqual(extractAllUrls('just text'), []);
  });
});

// ── Emails ───────────────────────────────────────────────────────────────────

describe('extractEmails', () => {
  it('should extract standard emails', () => {
    const text = 'Contact hr@company.com for details';
    assert.deepStrictEqual(extractEmails(text), ['hr@company.com']);
  });

  it('should extract multiple emails', () => {
    const text = 'Reach out to hr@a.com or support@b.co.in';
    assert.strictEqual(extractEmails(text).length, 2);
  });

  it('should return empty for no emails', () => {
    assert.deepStrictEqual(extractEmails('nothing here'), []);
  });
});
