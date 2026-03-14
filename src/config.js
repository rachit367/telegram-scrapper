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

// LLM keys are no longer required

module.exports = {
  targetDate:  process.env.TARGET_DATE || null, // YYYY-MM-DD
  telegram: {
    apiId:    parseInt(process.env.TELEGRAM_API_ID, 10),
    apiHash:  process.env.TELEGRAM_API_HASH,
    phone:    process.env.TELEGRAM_PHONE,
    session:  process.env.TELEGRAM_SESSION || '',
    channel:  process.env.TELEGRAM_CHANNEL,
  },
  scanInterval: parseInt(process.env.SCAN_INTERVAL, 10) || 0,   // minutes, 0 = run once
};
