# 🤖 Intern Bot

A Node.js automation bot that scrapes internship posts from Telegram channels, extracts structured data using AI (OpenAI / Gemini), and maintains a Markdown database.

## ✨ Features

- **Telegram MTProto access** via GramJS — reads full message history (not limited like Bot API)
- **Dual AI support** — OpenAI (`gpt-4o-mini`) or Google Gemini (`gemini-2.0-flash`)
- **Smart link detection** — Google Form links are auto-prioritized as application URLs
- **Multi-internship parsing** — single messages with multiple listings are split into individual entries
- **Duplicate prevention** — company + apply link dedup before appending
- **Scheduled scanning** — optional recurring scans at configurable intervals
- **Structured output** — clean Markdown file (`internships.md`) with all extracted fields

## 📁 Project Structure

```
intern bot/
├── index.js                  # Main entry point
├── package.json
├── .env.example              # Environment variable template
├── .gitignore
├── src/
│   ├── config.js             # Env loader & validation
│   ├── logger.js             # Timestamped console logger
│   ├── linkExtractor.js      # Regex: Google Forms, URLs, emails
│   ├── telegramClient.js     # GramJS authentication & message fetching
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
- **AI API key** — either an [OpenAI](https://platform.openai.com/api-keys) or [Google Gemini](https://aistudio.google.com/apikey) key

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
| `TELEGRAM_SESSION` | ❌ | Session string (auto-generated on first run) |
| `TELEGRAM_CHANNEL` | ✅ | Channel/group username (without `@`) or numeric ID |
| `AI_PROVIDER` | ✅ | `openai` or `gemini` |
| `OPENAI_API_KEY` | ⚡ | Required if `AI_PROVIDER=openai` |
| `GEMINI_API_KEY` | ⚡ | Required if `AI_PROVIDER=gemini` |
| `MESSAGE_LIMIT` | ❌ | Number of recent messages to fetch (default: `50`) |
| `SCAN_INTERVAL` | ❌ | Minutes between scans (`0` = run once) |

### Running

```bash
npm start
```

On the **first run**, you'll be prompted to enter the Telegram verification code sent to your phone. The bot will print a session string — save it as `TELEGRAM_SESSION` in your `.env` to skip verification on future runs.

## 📋 Output Format

The bot creates/updates `internships.md` with entries like:

```markdown
## Company: Acme Corp

**Domain:** Web Development
**Stipend:** ₹20000/month
**Apply Link:** https://forms.gle/abc123
**Email:** hr@acme.com

---
```

Missing fields are displayed as `"Not provided"`.

## 🧪 Testing

```bash
npm test
```

Runs unit tests for link extraction and Markdown generation using Node's built-in test runner.

## 🔄 Pipeline

```
Telegram Channel → Fetch Messages → Extract Links/Emails
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
| [OpenAI SDK](https://github.com/openai/openai-node) | GPT-based extraction |
| [@google/generative-ai](https://github.com/google/generative-ai-js) | Gemini-based extraction |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |

## 📄 License

ISC
