const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

// ── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a strict filtering assistant. Your job is to determine if a Telegram post describes an internship or job opportunity specifically for a target graduation batch.

Instructions:
1. Examine the message text to see if it mentions the target batch.
2. If the message explicitly mentions the target batch OR implies it (e.g., "for 2027 grads", "Batch: 2027"), set "isMatch" to true.
3. If the message is for a different batch, or does NOT specify a batch that includes the target, set "isMatch" to false.
4. If it's a general hiring post that DOES NOT mention any batch, set "isMatch" to false (we only want specific matches).

Return ONLY a JSON object with:
- "isMatch": boolean
- "reason": string (short explanation)`;

function buildUserPrompt(targetBatch, messageText) {
  return `Target Batch: ${targetBatch}\n\nTelegram message:\n\n${messageText}`;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries a function with exponential backoff for 429 errors.
 */
async function withRetry(fn, maxAttempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRateLimit = err.message?.includes('429') || err.status === 429 || err.code === 'rate_limit_exceeded';
      const isQuotaExceeded = err.message?.includes('quota') || err.message?.includes('limit: 0');

      if (isQuotaExceeded) {
        throw new Error(`Daily quota exhausted: ${err.message}`);
      }

      if (isRateLimit && attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`Rate limit hit (attempt ${attempt}/${maxAttempts}). Retrying in ${delay / 1000}s...`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}

// ── Providers ────────────────────────────────────────────────────────────────

async function processWithOpenRouter(config, userPrompt) {
  const client = new OpenAI({
    apiKey: config.openrouterKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/rachit367/telegram-scrapper',
      'X-Title': 'Telegram Intern Bot',
    },
  });

  const response = await client.chat.completions.create({
    model: config.openrouterModel,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
  });

  return response.choices[0].message.content;
}

async function processWithOpenAI(apiKey, userPrompt) {
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
  });

  return response.choices[0].message.content;
}

async function processWithGemini(apiKey, userPrompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent([
    SYSTEM_PROMPT + '\n\n' + userPrompt,
  ]);

  return result.response.text();
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if a message matches the target batch using AI.
 * Returns { isMatch: boolean, reason: string }
 */
async function checkBatchMatch(config, messageText) {
  const userPrompt = buildUserPrompt(config.targetBatch, messageText);

  let rawJson;
  try {
    await withRetry(async () => {
      if (config.ai.provider === 'openai') {
        rawJson = await processWithOpenAI(config.ai.openaiKey, userPrompt);
      } else if (config.ai.provider === 'openrouter') {
        rawJson = await processWithOpenRouter(config.ai, userPrompt);
      } else {
        rawJson = await processWithGemini(config.ai.geminiKey, userPrompt);
      }
    });
  } catch (err) {
    logger.error(`AI processing failed: ${err.message}`);
    return { isMatch: false, reason: 'AI error' };
  }

  try {
    const parsed = JSON.parse(rawJson);
    return {
      isMatch: !!parsed.isMatch,
      reason:  parsed.reason || 'No reason provided',
    };
  } catch {
    logger.error('Failed to parse AI JSON response:', rawJson);
    return { isMatch: false, reason: 'Parse error' };
  }
}

module.exports = { checkBatchMatch };
