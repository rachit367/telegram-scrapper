const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { formatInternship, isDuplicate, MD_FILE } = require('../src/markdownGenerator');

describe('markdownGenerator', () => {
  // Back up and clean the real MD file around tests
  let backup = null;

  beforeEach(() => {
    if (fs.existsSync(MD_FILE)) {
      backup = fs.readFileSync(MD_FILE, 'utf-8');
    }
    // Start with a clean file
    if (fs.existsSync(MD_FILE)) fs.unlinkSync(MD_FILE);
  });

  afterEach(() => {
    // Restore original file
    if (backup !== null) {
      fs.writeFileSync(MD_FILE, backup, 'utf-8');
    } else if (fs.existsSync(MD_FILE)) {
      fs.unlinkSync(MD_FILE);
    }
    backup = null;
  });

  describe('formatInternship', () => {
    it('should format all fields correctly', () => {
      const result = formatInternship({
        company: 'Acme Corp',
        domain: 'Web Development',
        stipend: '₹20000/month',
        apply_link: 'https://forms.gle/abc',
        email: 'hr@acme.com',
      });

      assert.ok(result.includes('## Company: Acme Corp'));
      assert.ok(result.includes('**Domain:** Web Development'));
      assert.ok(result.includes('**Stipend:** ₹20000/month'));
      assert.ok(result.includes('**Apply Link:** https://forms.gle/abc'));
      assert.ok(result.includes('**Email:** hr@acme.com'));
    });

    it('should show "Not provided" for missing fields', () => {
      const result = formatInternship({
        company: 'Acme Corp',
        domain: null,
        stipend: null,
        apply_link: null,
        email: null,
      });

      assert.ok(result.includes('**Domain:** Not provided'));
      assert.ok(result.includes('**Stipend:** Not provided'));
      assert.ok(result.includes('**Apply Link:** Not provided'));
      assert.ok(result.includes('**Email:** Not provided'));
    });
  });

  describe('isDuplicate', () => {
    it('should detect duplicates based on company and link', () => {
      // Write a fake entry to the real MD file
      const content = `# Internships\n\n---\n\n## Company: Acme Corp\n\n**Apply Link:** https://forms.gle/abc\n\n---\n\n`;
      fs.writeFileSync(MD_FILE, content, 'utf-8');

      assert.strictEqual(isDuplicate('Acme Corp', 'https://forms.gle/abc'), true);
      assert.strictEqual(isDuplicate('Other Corp', 'https://forms.gle/abc'), false);
      assert.strictEqual(isDuplicate('Acme Corp', 'https://forms.gle/xyz'), false);
    });

    it('should return false when file is empty', () => {
      assert.strictEqual(isDuplicate('Anything', 'https://example.com'), false);
    });
  });
});
