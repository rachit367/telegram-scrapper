const fs = require('fs');
const path = require('path');

const PROGRESS_FILE = path.resolve(__dirname, '..', 'progress.json');

function loadProgress(channel) {
  if (!fs.existsSync(PROGRESS_FILE)) return null;

  let data;
  try {
    data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  } catch (err) {
    return null;
  }

  if (!data || data.channel !== String(channel).trim()) return null;
  if (!Number.isInteger(data.lastMessageId) || data.lastMessageId <= 0) return null;

  return data;
}

function saveProgress({ channel, lastMessageId, lastMessageDate }) {
  const data = {
    channel: String(channel).trim(),
    lastMessageId,
    lastMessageDate: lastMessageDate instanceof Date ? lastMessageDate.toISOString() : lastMessageDate,
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { loadProgress, saveProgress, PROGRESS_FILE };
