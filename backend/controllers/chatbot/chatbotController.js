const logger = require("../../middleware/logger/logger");
const _ = require("lodash");
const { sendResponse, httpCodes } = require("../../helpers/utility");
const { Anthropic } = require("@anthropic-ai/sdk");

const schema = `
users:
- id (string)
- uid (string)
- displayName (string)

accounts:
- id (string)
- name (string)
- currency (string)
- userId (string)

transactions:
- id (string)
- amount (number)
- date (string, YYYY-MM-DD)
- categoryId (string)
- accountId (string)
- notes (string)
- type (string) // income or expense

categories:
- id (string)
- name (string)
- type (string)
`;

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDEAI_API_KEY, // Ensure this is set in your .env
});

module.exports = {
  async queryChatBot(req, res) {
    try {
      const user = req.user;
      const moment = require("moment");
      const today = moment().format("YYYY-MM-DD");

      // 🔥 Step 1. Define  user query
      const query = req.body.query;
      const categories = req.body.categories;
      const accounts = req.body.accounts;

      // 🔥 Step 2. Build prompt for Claude
      const prompt = `
You are a financial database query generator.

If any information asked about you, you are a AI Assistant named as Aura for Expenses Aura app.

1. **Text Mode**: For user questions that are general, conceptual, or not directly answerable via database query, return a "text" type response with a direct, natural answer (no prefixes like "Here's what I found" or "Let me help you").


Here is the database schema:

${schema}

Today's date is ${today}.

Here is the list of available categories in the system (names are case-insensitive for matching):

${JSON.stringify(categories)}

Here is the list of available accounts in the system (names are case-insensitive for matching):

${JSON.stringify(accounts)}

Rules:

When processing category-related questions:
- Check if the user's referenced category term exactly matches or is closely similar (semantic or partial match) to any category in the above list.
- If so, use the exact category name from the list for SQL filters (e.g. WHERE categories.name LIKE 'Food & Drink').
- If no relevant category exists, return type as "text" with text: "Sorry, no such category exists." Do not generate sqlQuery.

When processing **account-related questions**:
- Check if the user's referenced account term exactly matches or is closely similar (semantic or partial match) to any account in the above list.
- If so, use the exact account name from the list for SQL filters (e.g. WHERE accounts.name LIKE 'RBC Checking').
- If no relevant account exists, return type as "text" with text: "Sorry, no such account exists." Do not generate sqlQuery.


- Determine the main table (collectionName) based on user question context:
  - For account-level queries (totals, balances), use 'accounts'.
  - For category-level queries, use 'categories'.
  - For transaction queries, use 'transactions'.
- When filtering based on keywords (e.g. bank names, bill names, or any search terms), always search across **all possible relevant fields** in the chosen main table and its joined tables, including:
  - accounts.name
  - transactions.notes
  - categories.name
- If querying transactions OR if the query is category-related:
  - Always JOIN both accounts and categories tables.
  - Always return only columns for transactions as defined in the schema above, plus:
    - accounts.name as accountName
    - accounts.currency as currency
    - categories.name as categoryName
- When the user requests summaries (e.g. totals, averages) **along with details**, include both:
  - First, select the summarized aggregate values as needed (e.g. SUM, AVG).
  - Then, additionally select the full detailed transaction records (using SELECT * with necessary joins) in a single combined SQL query if your SQL dialect supports it (e.g. using UNION ALL or separate queries if needed).
  - Otherwise, prioritize **detailed transaction records** and include summary values as additional selected columns (e.g. SELECT transactions.*, SUM(transactions.amount) OVER() AS totalAmount).
- If querying accounts:
  - JOIN transactions table only if needed to compute totals.
- If querying categories:
  - JOIN transactions table if needed to compute totals, but do NOT join accounts table directly (no direct relation exists).
- Use full table names in JOINs (no aliases like t or c).
- For any date range filters, calculate actual dates in 'YYYY-MM-DD 00:00:00' format using today's date as reference, to match database datetime columns.
- Return these dates directly as params array with real date strings.
- Do NOT include ? placeholders for dates; provide real calculated dates instead.
- Do NOT change any column or field names. Always use exactly the same names as provided in the schema.
- If no params are required, return an empty params array.
- Always include a list field called joinTables specifying the tables to join (e.g. ["accounts","categories"]) or empty if no join.
- Return your response as a JSON object with the following fields only:
  - type: string ("query" or "text")
  - collectionName: string (the main table to query)
  - sqlQuery: string (the raw SQL query with ? placeholders for user inputs only; dates should be real values)
  - params: array (values for ? placeholders; dates included as real values)
  - joinTables: array of table names to join (empty if no join)
- If type is "text", include:
  - text: string (for text responses: direct answer ≤ 150 characters, no prefixes;)
- No explanations, markdown, or extra text. Return only valid JSON.

User question: "${query}"
`;
      const claudeRaw = await anthropic.messages.create({
        model: "claude-sonnet-4-0",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      // 🛑 Extract only the JSON content
      let claudeContent = claudeRaw.content?.[0]?.text || "{}";
      claudeContent = claudeContent.replace(/```json\n?|```/g, "").trim();
      const claudeResponse = JSON.parse(claudeContent);
      console.log("Claude Response:", claudeResponse);
      return sendResponse(res, httpCodes.OK, {
        status: true,
        message: "Chatbot Started Successfully",
        claudeResponse,
      });
    } catch (e) {
      const err = e?.response?.data?.message || e.toString();
      logger.error(err);
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        status: false,
        message: err,
      });
    }
  },

  // 🆕 New function: Form Response ChatBot
  async formResponseChatBot(req, res) {
    try {
      const { question, data } = req.body;

      const prompt = `
You are a professional financial assistant AI.

User's question:
"${question}"

Summarized database query result:
${data}

Instructions:
- Format your response as **professional, clean, and user-friendly HTML** suitable for display in a mobile chat interface.
- Convert currency codes like CAD or USD into their appropriate symbols ($ for CAD and USD) for **each transaction individually** based on its currency field.
- Use only simple HTML tags such as <p>, <ul>, <li>, <strong>, and <br>.
- Structure the response clearly for readability on mobile:
  - <p> for short summaries or totals
  - <ul> and <li> for listing items with clear spacing
  - <strong> to emphasize important data like amounts, totals, dates, or categories
- If multiple transactions involve different currencies, display each with its correct currency symbol clearly.
- Keep your language **friendly and natural**, addressing the user directly without robotic phrases or disclaimers.
- Avoid phrases like "Here is", "Based on", "Summary:" or markdown formatting.
- Use minimal inline styles for:
  - font-size (14px–16px for <p>, 13px–15px for <li>)
  - margin or padding to ensure readability
- Do not include any CSS classes, JavaScript, or external links.
- The final output should look like a **professional finance chat summary card**, clean and readable on mobile.

Return only the final HTML without any explanations, comments, or markdown formatting.
`;
      const claudeRaw = await anthropic.messages.create({
        model: "claude-sonnet-4-0",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const finalAnswer = claudeRaw.content?.[0]?.text || "No answer found.";
      console.log("Final Claude Answer:", finalAnswer);

      return sendResponse(res, httpCodes.OK, {
        message: "Chatbot Form Response Generated Successfully",
        html: finalAnswer.trim(),
      });
    } catch (e) {
      const err = e?.response?.data?.message || e.toString();
      logger.error(err);
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err,
      });
    }
  },
};
