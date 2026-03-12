const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { Api } = require('telegram');
const input = require('input');
require('dotenv').config();

async function listGroups() {
  const session = new StringSession(process.env.TELEGRAM_SESSION || '');
  const client = new TelegramClient(
    session,
    Number(process.env.TELEGRAM_API_ID),
    process.env.TELEGRAM_API_HASH,
    { connectionRetries: 5 }
  );

  console.log('🔌 Connecting to Telegram...\n');

  await client.start({
    phoneNumber: () => Promise.resolve(process.env.TELEGRAM_PHONE),
    phoneCode:   () => input.text('Enter the code you received: '),
    password:    () => input.text('Enter your 2FA password (if any): '),
    onError:     (err) => console.error('Auth error:', err.message),
  });

  // Save session for future use
  const sessionString = client.session.save();
  if (!process.env.TELEGRAM_SESSION) {
    console.log('💡 Save this session string to .env as TELEGRAM_SESSION:');
    console.log(sessionString);
    console.log('');
  }

  console.log('📋 Fetching all joined groups & channels...\n');
  console.log('─'.repeat(80));
  console.log(
    'TYPE'.padEnd(12),
    'ID'.padEnd(22),
    'TITLE'
  );
  console.log('─'.repeat(80));

  const dialogs = await client.getDialogs({ limit: 500 });

  for (const dialog of dialogs) {
    const entity = dialog.entity;
    if (!entity) continue;

    // Only show groups and channels (skip private chats)
    const isGroup   = entity.className === 'Chat';
    const isChannel = entity.className === 'Channel';

    if (!isGroup && !isChannel) continue;

    let type = '';
    let envId = '';

    if (isGroup) {
      type = 'Group';
      envId = `-${entity.id}`;
    } else if (isChannel) {
      // Supergroups & channels both use the Channel class
      type = entity.megagroup ? 'Supergroup' : 'Channel';
      // For supergroups/channels, the full ID uses the -100 prefix
      envId = `-100${entity.id}`;
    }

    const title = entity.title || '(untitled)';
    const username = entity.username ? `@${entity.username}` : '';

    console.log(
      type.padEnd(12),
      envId.padEnd(22),
      `${title}${username ? '  ' + username : ''}`
    );
  }

  console.log('─'.repeat(80));
  console.log('\n✅ Copy the ID for your target group and paste it into .env as TELEGRAM_CHANNEL');

  await client.disconnect();
}

listGroups().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
