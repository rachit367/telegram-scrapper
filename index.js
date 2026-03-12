const config = require('./src/config');
const logger = require('./src/logger');
const { authenticate, fetchMessages } = require('./src/telegramClient');
const { extractGoogleFormLinks, extractAllUrls, extractEmails } = require('./src/linkExtractor');
const { extractInternships } = require('./src/aiProcessor');
const { appendInternship } = require('./src/markdownGenerator');

// ─────────────────────────────────────────────────────────────────────────────

async function processMessages(client) {
  const messages = await fetchMessages(client, config.telegram.channel, config.messageLimit);

  if (messages.length === 0) {
    logger.warn('No text messages found in the channel.');
    return;
  }

  let added = 0;
  let skipped = 0;

  for (const msg of messages) {
    logger.info(`\n── Processing message #${msg.id} (${msg.date.toISOString()}) ──`);

    // 1. Extract links & emails from message text
    const googleFormLinks = extractGoogleFormLinks(msg.text);
    const allUrls         = extractAllUrls(msg.text);
    const emails          = extractEmails(msg.text);

    if (googleFormLinks.length > 0) {
      logger.info(`  Google Form link(s): ${googleFormLinks.join(', ')}`);
    }

    // 2. Send to AI for structured extraction
    const internships = await extractInternships(
      config.ai,
      msg.text,
      allUrls,
      googleFormLinks,
      emails
    );

    if (internships.length === 0) {
      logger.warn('  AI returned no internships for this message.');
      continue;
    }

    // 3. Append each internship to Markdown (with dedup)
    for (const internship of internships) {
      const wasAdded = appendInternship(internship);
      if (wasAdded) added++;
      else skipped++;
    }
  }

  logger.success(`\nDone! Added: ${added} | Skipped (duplicates): ${skipped}`);
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
