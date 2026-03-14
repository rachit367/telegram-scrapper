# 🤖 Intern Bot

A Node.js automation bot that scrapes internship posts from Telegram channels & private groups and maintains a Markdown database. Support for manual date filtering and strict batch tagging.

## ✨ Features

- **Telegram MTProto access** via GramJS — reads full message history (not limited like Bot API)
- **Private group support** — works with any group/channel you've joined, including private ones
- **Manual Date Filtering** — automatically fetches messages from today or a specific date provided in `.env`
- **Raw Storage** — messages are saved directly to `intern.md`
- **Group discovery utility** — `list-groups.js` helper to find numeric IDs of all your joined groups

## 📁 Project Structure

```
intern bot/
├── index.js                  # Main entry point
├── list-groups.js            # Utility: list all joined groups with IDs
├── internships.md            # Output: Structured internship database (LLM mode)
├── raw_messages.md           # Output: Raw Telegram messages (Raw mode)
├── package.json
├── .env.example              # Environment variable template
├── .gitignore
├── src/
│   ├── config.js             # Env loader & validation
│   ├── logger.js             # Timestamped console logger
│   ├── linkExtractor.js      # Regex: Google Forms, URLs, emails
│   ├── telegramClient.js     # GramJS auth & today's message fetching
│   ├── aiProcessor.js        # AI-powered internship data extraction
│   └── markdownGenerator.js  # Markdown formatting, dedup & append
└── tests/
    ├── linkExtractor.test.js
    └── markdownGenerator.test.js
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Telegram API credentials** — get `API_ID` and `API_HASH` from [my.telegram.org](https://my.telegram.org)

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd intern-bot

# Install dependencies
npm install
```

### Configuration

Copy the environment template and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_API_ID` | ✅ | Telegram API ID from my.telegram.org |
| `TELEGRAM_API_HASH` | ✅ | Telegram API hash |
| `TELEGRAM_PHONE` | ✅ | Your phone number (with country code) |
| `TELEGRAM_SESSION` | ❌ | Session string (saves login — see [Session Setup](#-session-setup) below) |
| `TELEGRAM_CHANNEL` | ✅ | Channel/group username (without `@`) or **numeric ID** for private groups |
| `TARGET_DATE`      | ❌ | Manual Date (YYYY-MM-DD), defaults to today if blank |
| `SCAN_INTERVAL` | ❌ | Minutes between scans (`0` = run once) |

### 🔑 Session Setup

On the **first run**, you'll be prompted to enter the Telegram verification code sent to your phone. The bot will print a session string:

```
💡 Save this session string to .env as TELEGRAM_SESSION:
1BQANOTEuMTA...very_long_string...xYz==
```

Copy the **entire string** and paste it into your `.env`:

```env
TELEGRAM_SESSION=1BQANOTEuMTA...very_long_string...xYz==
```

This saves your login so you won't need the phone code on future runs.

### 🔍 Finding Private Group IDs

Private groups often don't have a username. Use the included utility to find the numeric ID:

```bash
node list-groups.js
```

This lists all groups/channels you've joined with their type and numeric ID:

```
TYPE         ID                     TITLE
────────────────────────────────────────────────────
Supergroup   -1001234567890         SDE Premium Referrals
Channel      -1009876543210         Some Other Channel
```

Copy the ID and set it in your `.env`:

```env
TELEGRAM_CHANNEL=-1001234567890
```

## 📋 Output Format (`intern.md`)

The bot appends matching messages to `intern.md`. 

```markdown
### Message #1234 (2024-03-12T12:00:00Z)
Acme Corp is hiring 2027 graduates for...
---
```

## 🧪 Testing

```bash
npm test
```

Runs unit tests for link extraction using Node's built-in test runner.

## 🔄 Pipeline

```
Telegram Channel/Group → Fetch Messages (Date: Today or Manual)
                                 ↓
                     Append RAW Text to intern.md
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [GramJS](https://github.com/nicedayfor/gramjs) | Telegram MTProto client |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |

## 📄 License

ISC
