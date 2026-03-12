const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

// ── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an internship data extractor. You receive the raw text of a Telegram post about internship opportunities.

Your task:
1. Extract EVERY distinct internship mentioned in the message.
2. For each internship return a JSON object with these fields:
   - company   (string | null)
   - domain    (string | null) — choose the closest match from: Web Development, Frontend Development, Backend Development, Full Stack, AI / Machine Learning, Data Science, Android Development, Marketing, Design, Business, DevOps, Cybersecurity, Cloud Computing, Mobile Development, Other
   - stipend   (string | null) — copy exactly as written
   - apply_link (string | null) — application URL
   - email     (string | null)

3. If a field is not available, set it to null.
4. Return ONLY a JSON array of objects. No markdown, no explanation.

Example output:
[{"company":"Acme Corp","domain":"Web Development","stipend":"₹20000/month","apply_link":"https://forms.gle/abc","email":"hr@acme.com"}]`;

function buildUserPrompt(messageText, urls, googleFormLinks, emails) {
  let prompt = `Telegram message:\n\n${messageText}\n\n`;

  if (urls.length > 0) {
    prompt += `Extracted URLs:\n${urls.join('\n')}\n\n`;
  }
  if (googleFormLinks.length > 0) {
    prompt += `Google Form links (MUST be used as apply_link):\n${googleFormLinks.join('\n')}\n\n`;
  }
  if (emails.length > 0) {
    prompt += `Extracted emails:\n${emails.join('\n')}\n\n`;
  }

  return prompt;
}

// ── OpenAI Provider ─────────────────────────────────────────────────────────

async function processWithOpenAI(apiKey, userPrompt) {
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
  });

  return response.choices[0].message.content;
}

// ── Gemini Provider ─────────────────────────────────────────────────────────

async function processWithGemini(apiKey, userPrompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.1,
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
 * Send a Telegram message to the configured AI provider and return structured
 * internship data.
 *
 * @param {object}   config            – ai config block
 * @param {string}   messageText       – raw Telegram message
 * @param {string[]} urls              – all extracted URLs
 * @param {string[]} googleFormLinks   – Google Form links (priority for apply_link)
 * @param {string[]} emails            – extracted emails
 * @returns {Promise<Array<object>>}   – array of internship objects
 */
async function extractInternships(config, messageText, urls, googleFormLinks, emails) {
  const userPrompt = buildUserPrompt(messageText, urls, googleFormLinks, emails);

  let rawJson;
  try {
    if (config.provider === 'openai') {
      rawJson = await processWithOpenAI(config.openaiKey, userPrompt);
    } else {
      rawJson = await processWithGemini(config.geminiKey, userPrompt);
    }
  } catch (err) {
    logger.error(`AI processing failed: ${err.message}`);
    return [];
  }

  // Parse the response
  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    logger.error('Failed to parse AI JSON response:', rawJson);
    return [];
  }

  // Normalise: could be a single object or an array
  const internships = Array.isArray(parsed) ? parsed : [parsed];

  // Enforce Google Form link override
  if (googleFormLinks.length > 0) {
    for (const internship of internships) {
      if (!internship.apply_link || !googleFormLinks.includes(internship.apply_link)) {
        internship.apply_link = googleFormLinks[0];
      }
    }
  }

  return internships;
}

module.exports = { extractInternships };
