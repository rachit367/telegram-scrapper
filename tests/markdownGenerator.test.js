const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { appendFilteredRawMessage, isMessageDuplicate, MD_FILE } = require('../src/markdownGenerator');

describe('markdownGenerator', () => {
  let backup = null;

  beforeEach(() => {
    if (fs.existsSync(MD_FILE)) {
      backup = fs.readFileSync(MD_FILE, 'utf-8');
      fs.unlinkSync(MD_FILE);
    }
  });

  afterEach(() => {
    if (backup !== null) {
      fs.writeFileSync(MD_FILE, backup, 'utf-8');
    } else if (fs.existsSync(MD_FILE)) {
      fs.unlinkSync(MD_FILE);
    }
    backup = null;
  });

  describe('appendFilteredRawMessage', () => {
    it('saves a message with id, timestamp and text', () => {
      const date = new Date('2026-07-04T07:40:31.000Z');
      const added = appendFilteredRawMessage({ id: 6322, text: 'Internship at Acme Corp', date });

      assert.strictEqual(added, true);
      const content = fs.readFileSync(MD_FILE, 'utf-8');
      assert.ok(content.includes('### Message #6322 (2026-07-04T07:40:31.000Z)'));
      assert.ok(content.includes('Internship at Acme Corp'));
    });

    it('does not save the same message twice', () => {
      const msg = { id: 42, text: 'Some internship', date: new Date() };
      assert.strictEqual(appendFilteredRawMessage(msg), true);
      assert.strictEqual(appendFilteredRawMessage(msg), false);

      const content = fs.readFileSync(MD_FILE, 'utf-8');
      const occurrences = content.split('### Message #42 ').length - 1;
      assert.strictEqual(occurrences, 1);
    });
  });

  describe('isMessageDuplicate', () => {
    it('detects an already saved message id', () => {
      appendFilteredRawMessage({ id: 7, text: 'hello', date: new Date() });
      assert.strictEqual(isMessageDuplicate(7), true);
      assert.strictEqual(isMessageDuplicate(8), false);
    });

    it('returns false when the file is fresh', () => {
      assert.strictEqual(isMessageDuplicate(999), false);
    });
  });
});
