/**
 * Simple timestamped console logger.
 */

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

const logger = {
  info:  (...args) => console.log(`[${timestamp()}] ℹ️ `, ...args),
  warn:  (...args) => console.warn(`[${timestamp()}] ⚠️ `, ...args),
  error: (...args) => console.error(`[${timestamp()}] ❌ `, ...args),
  success: (...args) => console.log(`[${timestamp()}] ✅ `, ...args),
};

module.exports = logger;
