const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const logger = require('./logger');

/**
 * Create and authenticate a Telegram client via MTProto.
 *
 * @param {object} config  – telegram config block from config.js
 * @returns {{ client: TelegramClient, sessionString: string }}
 */
async function authenticate(config) {
  const session = new StringSession(config.session);
  const client = new TelegramClient(session, config.apiId, config.apiHash, {
    connectionRetries: 5,
  });

  logger.info('Connecting to Telegram...');

  await client.start({
    phoneNumber: () => Promise.resolve(config.phone),
    phoneCode:   () => input.text('Enter the code you received: '),
    password:    () => input.text('Enter your 2FA password (if any): '),
    onError:     (err) => {
      logger.error('Telegram auth error:', err.message);
    },
  });

  const sessionString = client.session.save();
  logger.success('Authenticated! Session string (save to .env TELEGRAM_SESSION):');
  logger.info(sessionString);

  return { client, sessionString };
}

/**
 * Ensure the client is currently connected.
 * If not, attempts to reconnect.
 *
 * @param {TelegramClient} client
 */
async function ensureConnected(client) {
  if (!client.connected) {
    logger.info('Connection lost. Reconnecting to Telegram...');
    try {
      await client.connect();
      logger.success('Reconnected successfully.');
    } catch (err) {
      logger.error('Reconnection failed:', err.message);
      throw err;
    }
  }
}

/**
 * Get the start of today in UTC (midnight IST = 18:30 UTC previous day).
 * Environment-independent calculation using milliseconds.
 */
function getTodayStartUTC() {
  const msPerDay = 24 * 60 * 60 * 1000;
  const istOffset = 5.5 * 60 * 60 * 1000;
  
  const now = Date.now();
  const istNow = now + istOffset;
  const istMidnight = Math.floor(istNow / msPerDay) * msPerDay;
  const todayStartUTC = istMidnight - istOffset;
  
  return new Date(todayStartUTC);
}

/**
 * Fetch today's messages from a channel or group.
 * Iterates in batches until messages older than today are found.
 */
async function fetchMessages(client, channelIdentifier, batchSize = 100) {
  await ensureConnected(client);

  const todayStart = getTodayStartUTC();
  logger.info(`Fetching messages since ${todayStart.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)`);

  let entity;
  try {
    const trimmed = String(channelIdentifier).trim();
    if (/^-?\d+$/.test(trimmed)) {
      entity = await client.getEntity(BigInt(trimmed));
    } else {
      entity = await client.getEntity(trimmed);
    }
  } catch (err) {
    await ensureConnected(client); // Try one more time if getEntity fails due to connection
    try {
      const trimmed = String(channelIdentifier).trim();
      if (/^-?\d+$/.test(trimmed)) {
        entity = await client.getEntity(BigInt(trimmed));
      } else {
        entity = await client.getEntity(trimmed);
      }
    } catch (innerErr) {
      logger.error(`Failed to find group/channel "${channelIdentifier}": ${innerErr.message}`);
      return [];
    }
  }

  const allTextMessages = [];
  let offsetId = 0;
  let reachedOlderMessages = false;
  let totalProcessed = 0;

  while (!reachedOlderMessages) {
    await ensureConnected(client);

    let batch;
    try {
      batch = await client.getMessages(entity, {
        limit: batchSize,
        offsetId,
      });
    } catch (err) {
      logger.warn(`Failed to fetch message batch: ${err.message}. Retrying...`);
      await ensureConnected(client);
      batch = await client.getMessages(entity, {
        limit: batchSize,
        offsetId,
      });
    }

    if (batch.length === 0) break;

    for (const m of batch) {
      totalProcessed++;
      const msgDate = new Date(m.date * 1000);

      if (msgDate < todayStart) {
        reachedOlderMessages = true;
        break;
      }

      if (m.message && m.message.trim().length > 0) {
        allTextMessages.push({
          id:   m.id,
          text: m.message,
          date: msgDate,
        });
      }
    }

    if (reachedOlderMessages) break;
    offsetId = batch[batch.length - 1].id;
  }

  logger.info(`Scanned ${totalProcessed} messages. Found ${allTextMessages.length} text messages from today.`);
  return allTextMessages;
}

module.exports = { authenticate, fetchMessages, ensureConnected };
