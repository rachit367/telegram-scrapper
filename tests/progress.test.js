const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { loadProgress, saveProgress, PROGRESS_FILE } = require('../src/progress');

describe('progress', () => {
  let backup = null;

  beforeEach(() => {
    if (fs.existsSync(PROGRESS_FILE)) {
      backup = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      fs.unlinkSync(PROGRESS_FILE);
    }
  });

  afterEach(() => {
    if (backup !== null) {
      fs.writeFileSync(PROGRESS_FILE, backup, 'utf-8');
    } else if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
    backup = null;
  });

  describe('loadProgress', () => {
    it('returns null when the file does not exist', () => {
      assert.strictEqual(loadProgress('-100123'), null);
    });

    it('returns null when the file contains invalid JSON', () => {
      fs.writeFileSync(PROGRESS_FILE, '{not json', 'utf-8');
      assert.strictEqual(loadProgress('-100123'), null);
    });

    it('returns null when the stored channel does not match', () => {
      saveProgress({ channel: '-100999', lastMessageId: 42, lastMessageDate: new Date() });
      assert.strictEqual(loadProgress('-100123'), null);
    });

    it('returns null when lastMessageId is missing or invalid', () => {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ channel: '-100123' }), 'utf-8');
      assert.strictEqual(loadProgress('-100123'), null);

      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ channel: '-100123', lastMessageId: -5 }), 'utf-8');
      assert.strictEqual(loadProgress('-100123'), null);

      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ channel: '-100123', lastMessageId: 'abc' }), 'utf-8');
      assert.strictEqual(loadProgress('-100123'), null);
    });
  });

  describe('saveProgress + loadProgress round-trip', () => {
    it('returns the saved checkpoint for the matching channel', () => {
      const date = new Date('2026-07-03T10:15:00.000Z');
      saveProgress({ channel: '-100123', lastMessageId: 12345, lastMessageDate: date });

      const progress = loadProgress('-100123');
      assert.strictEqual(progress.channel, '-100123');
      assert.strictEqual(progress.lastMessageId, 12345);
      assert.strictEqual(progress.lastMessageDate, '2026-07-03T10:15:00.000Z');
    });

    it('coerces non-string channels for comparison', () => {
      saveProgress({ channel: -100123, lastMessageId: 7, lastMessageDate: new Date() });
      const progress = loadProgress('-100123');
      assert.strictEqual(progress.lastMessageId, 7);
    });
  });
});
