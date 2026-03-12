# 🤖 Intern Bot

A Node.js automation bot that scrapes today's internship posts from Telegram channels & private groups, extracts structured data using AI (OpenAI / Gemini), and maintains a Markdown database.

## ✨ Features

- **Telegram MTProto access** via GramJS — reads full message history (not limited like Bot API)
- **Private group support** — works with any group/channel you've joined, including private ones
- **Today's messages only** — automatically fetches all messages from today (IST midnight onwards)
- **Dual-Mode Support** — choose between **LLM mode** (AI extraction) or **Raw mode** (direct logging)
- **Triple AI support** — OpenAI, Google Gemini, or **OpenRouter** (e.g., `openrouter/hunter-alpha`)
- **Automatic Multi-Retry** — exponentially backed-off retries for 429 rate limits
- **Smart link detection** — Google Form links are auto-prioritized as application URLs
- **Multi-internship parsing** — single messages with multiple listings are split into individual entries
- **Duplicate prevention** — company + apply link dedup before appending
- **Scheduled scanning** — optional recurring scans at configurable intervals
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
- **AI API key** — OpenAI, Google Gemini, or [OpenRouter](https://openrouter.ai/keys) key

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
| `PROCESS_MODE`     | ❌ | `llm` (use AI extraction) or `raw` (just save text to `raw_messages.md`) |
| `AI_PROVIDER`      | ⚡ | `openai`, `gemini`, or `openrouter` (required if `PROCESS_MODE=llm`) |
| `OPENAI_API_KEY`   | ⚡ | Required if `AI_PROVIDER=openai` |
| `GEMINI_API_KEY`   | ⚡ | Required if `AI_PROVIDER=gemini` |
| `OPENROUTER_API_KEY`| ⚡ | Required if `AI_PROVIDER=openrouter` |
| `OPENROUTER_MODEL`  | ❌ | OpenRouter model (default: `openrouter/hunter-alpha`) |
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

### Running

```bash
npm start
```

The bot automatically fetches **all messages from today** (IST midnight onwards) and processes them.

The bot outputs data to different files depending on the `PROCESS_MODE`:

### LLM Mode (`internships.md`)
Maintains a structured database of extracted internships:
```markdown
## Company: Acme Corp
...
```

### Raw Mode (`raw_messages.md`)
Saves every Telegram message as-is:
```markdown
### Message #1234 (2024-03-12T12:00:00Z)
Check out this new hiring at Acme...
```

## 🧪 Testing

```bash
npm test
```

Runs unit tests for link extraction and Markdown generation using Node's built-in test runner.

## 🔄 Pipeline

```
Telegram Channel/Group → Fetch Today's Messages → Extract Links/Emails
                                                         ↓
                                             AI (OpenAI / Gemini)
                                                         ↓
                                             Structured JSON Output
                                                         ↓
                                        Dedup Check → Append to internships.md
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [GramJS](https://github.com/nicedayfor/gramjs) | Telegram MTProto client |
| [OpenAI SDK](https://github.com/openai/openai-node) | GPT & OpenRouter extraction |
| [@google/generative-ai](https://github.com/google/generative-ai-js) | Gemini-based extraction |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |

## 📄 License

ISC
