const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const required = ['TELEGRAM_API_ID', 'TELEGRAM_API_HASH', 'TELEGRAM_PHONE', 'TELEGRAM_CHANNEL'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌  Missing required environment variable: ${key}`);
    console.error('   Copy .env.example to .env and fill in your credentials.');
    process.exit(1);
  }
}

const aiProvider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

if (aiProvider === 'openai' && !process.env.OPENAI_API_KEY) {
  console.error('❌  AI_PROVIDER is "openai" but OPENAI_API_KEY is not set.');
  process.exit(1);
}
if (aiProvider === 'gemini' && !process.env.GEMINI_API_KEY) {
  console.error('❌  AI_PROVIDER is "gemini" but GEMINI_API_KEY is not set.');
  process.exit(1);
}

module.exports = {
  telegram: {
    apiId:    parseInt(process.env.TELEGRAM_API_ID, 10),
    apiHash:  process.env.TELEGRAM_API_HASH,
    phone:    process.env.TELEGRAM_PHONE,
    session:  process.env.TELEGRAM_SESSION || '',
    channel:  process.env.TELEGRAM_CHANNEL,
  },
  ai: {
    provider:     aiProvider,
    openaiKey:    process.env.OPENAI_API_KEY || '',
    geminiKey:    process.env.GEMINI_API_KEY || '',
  },
  messageLimit: parseInt(process.env.MESSAGE_LIMIT, 10) || 50,
  scanInterval: parseInt(process.env.SCAN_INTERVAL, 10) || 0,   // minutes, 0 = run once
};
