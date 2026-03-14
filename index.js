const config = require('./src/config');
const logger = require('./src/logger');
const { authenticate, fetchMessages, ensureConnected } = require('./src/telegramClient');
const { appendFilteredRawMessage, isMessageDuplicate } = require('./src/markdownGenerator');

// ─────────────────────────────────────────────────────────────────────────────

async function processMessages(client) {
  const messages = await fetchMessages(client, config.telegram.channel, config.targetDate);

  if (messages.length === 0) {
    logger.warn('No text messages found in the channel.');
    return;
  }

  let added = 0;
  let skipped = 0;

  logger.info(`🔍  Processing all messages for: ${config.targetDate || 'Today'}`);

  for (const msg of messages) {
    // 1. Skip if already in the Markdown file
    if (isMessageDuplicate(msg.id)) {
      skipped++;
      continue;
    }

    logger.info(`\n── Saving message #${msg.id} (${msg.date.toISOString()}) ──`);

    try {
      const wasAdded = appendFilteredRawMessage(msg);
      if (wasAdded) added++;
    } catch (err) {
      logger.error(`  ❌ ERROR processing message #${msg.id}: ${err.message}`);
    }
  }

  if (skipped > 0) {
    logger.info(`\n⏩  Skipped ${skipped} messages already in intern.md`);
  }
  logger.success(`\nDone! Scanned ${messages.length} | New entries saved: ${added}`);
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  logger.info('🤖  Intern Bot starting (No LLM MODE)...\n');

  // Authenticate
  const { client, sessionString } = await authenticate(config.telegram);

  // Save session string hint
  if (!config.telegram.session) {
    logger.info('💡  Save the session string above to your .env file as TELEGRAM_SESSION');
    logger.info('    This avoids re-entering the phone code on every run.\n');
  }

  // Process messages
  try {
    await processMessages(client);
  } catch (err) {
    logger.error('Error during initial scan:', err.message);
  }

  // Optional: scheduled scanning
  if (config.scanInterval > 0) {
    const intervalMs = config.scanInterval * 60 * 1000;
    logger.info(`⏰  Scheduled mode: scanning every ${config.scanInterval} minute(s)...`);
    
    setInterval(async () => {
      try {
        await ensureConnected(client);
        await processMessages(client);
      } catch (err) {
        logger.error('Error during scheduled scan:', err.message);
        // Try to reconnect for the next cycle
        try {
          await ensureConnected(client);
        } catch (reconnectErr) {
          logger.error('Failed to restore connection for next cycle:', reconnectErr.message);
        }
      }
    }, intervalMs);
  } else {
    logger.info('One-time run complete. Disconnecting...');
    await client.disconnect();
  }
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
