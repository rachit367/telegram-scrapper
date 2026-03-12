const config = require('./src/config');
const logger = require('./src/logger');
const { authenticate, fetchMessages } = require('./src/telegramClient');
const { extractGoogleFormLinks, extractAllUrls, extractEmails } = require('./src/linkExtractor');
const { checkBatchMatch } = require('./src/aiProcessor');
const { appendFilteredRawMessage } = require('./src/markdownGenerator');

// ─────────────────────────────────────────────────────────────────────────────

async function processMessages(client) {
  const messages = await fetchMessages(client, config.telegram.channel);

  if (messages.length === 0) {
    logger.warn('No text messages found in the channel.');
    return;
  }

  let added = 0;
  let matches = 0;

  logger.info(`🔍  Filtering for Target Batch: ${config.targetBatch}`);

  for (const msg of messages) {
    logger.info(`\n── Checking message #${msg.id} (${msg.date.toISOString()}) ──`);

    // Use AI to check if it's a match for the target batch
    const { isMatch, reason } = await checkBatchMatch(config, msg.text);

    if (isMatch) {
      matches++;
      logger.success(`  ✅ MATCH: ${reason}`);
      const wasAdded = appendFilteredRawMessage(msg, reason);
      if (wasAdded) added++;
    } else {
      logger.info(`  ❌ SKIP: ${reason}`);
    }
  }

  logger.success(`\nDone! Scanned ${messages.length} | Matches found: ${matches} | New entries saved: ${added}`);
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  logger.info('🤖  Intern Bot starting...\n');

  // Authenticate
  const { client, sessionString } = await authenticate(config.telegram);

  // Save session string hint
  if (!config.telegram.session) {
    logger.info('💡  Save the session string above to your .env file as TELEGRAM_SESSION');
    logger.info('    This avoids re-entering the phone code on every run.\n');
  }

  // Process messages
  await processMessages(client);

  // Optional: scheduled scanning
  if (config.scanInterval > 0) {
    const intervalMs = config.scanInterval * 60 * 1000;
    logger.info(`⏰  Scheduled mode: scanning every ${config.scanInterval} minute(s)...`);
    setInterval(() => processMessages(client), intervalMs);
  } else {
    logger.info('One-time run complete. Disconnecting...');
    await client.disconnect();
  }
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
