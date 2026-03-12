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
 * Fetch recent messages from a channel or group.
 *
 * @param {TelegramClient} client
 * @param {string}         channelUsername – e.g. "mychannel" (without @)
 * @param {number}         limit
 * @returns {Array<{ id: number, text: string, date: Date }>}
 */
async function fetchMessages(client, channelUsername, limit = 50) {
  logger.info(`Fetching up to ${limit} messages from "${channelUsername}"...`);

  const entity = await client.getEntity(channelUsername);
  const messages = await client.getMessages(entity, { limit });

  // Return only text messages (skip service / media-only messages)
  const textMessages = messages
    .filter((m) => m.message && m.message.trim().length > 0)
    .map((m) => ({
      id:   m.id,
      text: m.message,
      date: new Date(m.date * 1000),
    }));

  logger.info(`Retrieved ${textMessages.length} text messages.`);
  return textMessages;
}

module.exports = { authenticate, fetchMessages };
