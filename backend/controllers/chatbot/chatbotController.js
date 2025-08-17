const logger = require("../../middleware/logger/logger");
const _ = require("lodash");
const {
  sendResponse,
  httpCodes,
  deleteFile,
} = require("../../helpers/utility");
const { Anthropic } = require("@anthropic-ai/sdk");
const {
  speechToText,
  textToSpeechConvert,
  convertAudioToWav,
} = require("../../helpers/audio-processing/audioProcessor");
const path = require("path");

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
- date (string, YYYY-MM-DD HH:mm:ss)
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
  //   async queryChatBot(req, res) {
  //     try {
  //       const user = req.user;
  //       const moment = require("moment");
  //       const today = moment().format("YYYY-MM-DD");
  //       const fromVoiceChat = req.body.fromVoiceChat;
  //       // 🔥 Step 1. Define  user query
  //       const query = req.body.query;
  //       const categories = req.body.categories;
  //       const accounts = req.body.accounts;

  //       // 🔥 Step 2. Build prompt for Claude
  //       const prompt = `
  // You are a financial database query generator.

  // If any information asked about you, you are a AI Assistant named as Aura for Expenses Aura app.

  // 1. **Text Mode**: For user questions that are general, conceptual, or not directly answerable via database query, return a "text" type response with a direct, natural answer (no prefixes like "Here's what I found" or "Let me help you").

  // Here is the database schema:

  // ${schema}

  // Today's date is ${today}.

  // Here is the list of available categories in the system (names are case-insensitive for matching):

  // ${JSON.stringify(categories)}

  // Here is the list of available accounts in the system (names are case-insensitive for matching):

  // ${JSON.stringify(accounts)}

  // Rules:

  // When processing category-related questions:
  // - Check if the user's referenced category term exactly matches or is closely similar (semantic or partial match) to any category in the above list.
  // - If so, use the exact category name from the list for SQL filters (e.g. WHERE categories.name LIKE 'Food & Drink').
  // - If no relevant category exists, return type as "text" with text: "Sorry, no such category exists." Do not generate sqlQuery.

  // When processing **account-related questions**:
  // - Check if the user's referenced account term exactly matches or is closely similar (semantic or partial match) to any account in the above list.
  // - If so, use the exact account name from the list for SQL filters (e.g. WHERE accounts.name LIKE 'RBC Checking').
  // - If no relevant account exists, return type as "text" with text: "Sorry, no such account exists." Do not generate sqlQuery.

  // - Determine the main table (collectionName) based on user question context:
  //   - For account-level queries (totals, balances), use 'accounts'.
  //   - For category-level queries, use 'categories'.
  //   - For transaction queries, use 'transactions'.
  // - When filtering based on keywords (e.g. bank names, bill names, or any search terms), always search across **all possible relevant fields** in the chosen main table and its joined tables, including:
  //   - accounts.name
  //   - transactions.notes
  //   - categories.name
  // - If querying transactions OR if the query is category-related:
  //   - Always JOIN both accounts and categories tables.
  //   - Always return only columns for transactions as defined in the schema above, plus:
  //     - accounts.name as accountName
  //     - accounts.currency as currency
  //     - categories.name as categoryName
  // - When the user requests summaries (e.g. totals, averages) **along with details**, include both:
  //   - First, select the summarized aggregate values as needed (e.g. SUM, AVG).
  //   - Then, additionally select the full detailed transaction records (using SELECT * with necessary joins) in a single combined SQL query if your SQL dialect supports it (e.g. using UNION ALL or separate queries if needed).
  //   - Otherwise, prioritize **detailed transaction records** and include summary values as additional selected columns (e.g. SELECT transactions.*, SUM(transactions.amount) OVER() AS totalAmount).
  // - If querying accounts:
  //   - JOIN transactions table only if needed to compute totals.
  // - If querying categories:
  //   - JOIN transactions table if needed to compute totals, but do NOT join accounts table directly (no direct relation exists).
  // - Use full table names in JOINs (no aliases like t or c).
  // - For any date range filters, calculate actual dates in 'YYYY-MM-DD 00:00:00' format using today's date as reference, to match database datetime columns.
  // - ALWAYS include the full datetime string with 00:00:00 in the SQL query, never use date-only format.
  // - NEVER use DATE() function or  or exact date matching with = operator.Use only LIKE Pattern matching.
  // - Return these dates directly as params array with real date strings.
  // - Do NOT include ? placeholders for dates; provide real calculated dates instead.
  // - Do NOT change any column or field names. Always use exactly the same names as provided in the schema.
  // - If no params are required, return an empty params array.
  // - Always include a list field called joinTables specifying the tables to join (e.g. ["accounts","categories"]) or empty if no join.
  // - Return your response as a JSON object with the following fields only:
  //   - type: string ("query" or "text")
  //   - collectionName: string (the main table to query)
  //   - sqlQuery: string (the raw SQL query with ? placeholders for user inputs only; dates should be real values)
  //   - params: array (values for ? placeholders; dates included as real values)
  //   - joinTables: array of table names to join (empty if no join)
  // - If type is "text", include:
  //   - text: string (for text responses: direct answer ≤ 150 characters, no prefixes;)
  // - No explanations, markdown, or extra text. Return only valid JSON.

  // User question: "${query}"
  // `;
  //       const claudeRaw = await anthropic.messages.create({
  //         model: "claude-sonnet-4-0",
  //         max_tokens: 1024,
  //         messages: [{ role: "user", content: prompt }],
  //       });

  //       // 🛑 Extract only the JSON content
  //       let claudeContent = claudeRaw.content?.[0]?.text || "{}";
  //       claudeContent = claudeContent.replace(/```json\n?|```/g, "").trim();
  //       const claudeResponse = JSON.parse(claudeContent);
  //       console.log("Claude Response:", claudeResponse);
  //       let audioResult = {};
  //       if (claudeResponse?.type !== "query" && fromVoiceChat) {
  //         audioResult = await textToSpeechConvert(claudeResponse.text);
  //       }
  //       return sendResponse(res, httpCodes.OK, {
  //         status: true,
  //         message: "Chatbot Started Successfully",
  //         claudeResponse,
  //         audioData: audioResult.audioData || null,
  //         audioMimeType: audioResult.mimeType || null,
  //         audioEncoding: audioResult.encoding || null,
  //       });
  //     } catch (e) {
  //       const err = e?.response?.data?.message || e.toString();
  //       logger.error(err);
  //       return sendResponse(res, httpCodes.BAD_REQUEST, {
  //         status: false,
  //         message: err,
  //       });
  //     }
  //   },

  async formResponseChatBot(req, res) {
    try {
      const { question, data, fromVoiceChat } = req.body;

      const prompt = `
You are a professional financial assistant AI.

User's question:
"${question}"

Summarized database query result:
${data}

From Voice Chat : ${fromVoiceChat}

Instructions:
- Format your response as **professional, clean, and user-friendly HTML** suitable for display in a mobile chat interface.
- Convert currency codes (e.g., USD, CAD, EUR, GBP, etc.) into their appropriate symbols for each account individually based on the associated country or currency code. Ensure every amount reflects the correct currency symbol depending on the specific account’s currency (e.g., $ for USD/CAD, € for EUR, £ for GBP, etc.).
for **each transaction individually** based on its currency field.
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

If "From Voice Chat" is true:
- Do NOT return HTML.
- Instead, return a friendly, naturally worded summary in plain text (no HTML or markdown), suitable for speaking out loud.
- Make it emotionally engaging, concise but informative — like you're personally helping the user understand their finances.
- Avoid robotic phrases or technical jargon. Keep it around 2–4 sentences.

If "From Voice Chat" is false:
- Return only the final HTML without any explanations, comments, or markdown formatting.
`;
      const claudeRaw = await anthropic.messages.create({
        model: "claude-sonnet-4-0",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const finalAnswer = claudeRaw.content?.[0]?.text || "No answer found.";
      console.log("Final Claude Answer:", finalAnswer);

      let audioResult = {};
      if (fromVoiceChat) {
        audioResult = await textToSpeechConvert(finalAnswer);
      }

      return sendResponse(res, httpCodes.OK, {
        message: "Chatbot Form Response Generated Successfully",
        html: finalAnswer.trim(),
        transcription: question,
        audioData: audioResult.audioData || null,
        audioMimeType: audioResult.mimeType || null,
        audioEncoding: audioResult.encoding || null,
      });
    } catch (e) {
      const err = e?.response?.data?.message || e.toString();
      logger.error(err);
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err,
      });
    }
  },

  async queryChatBot(req, res) {
    return new Promise(async (resolve, reject) => {
      let tempFilePath = null;
      try {
        const user = req.user;
        const moment = require("moment");
        const today = moment().format("YYYY-MM-DD");
        const currentTime = moment().format("HH:mm:ss");
        const fromVoiceChat = req.body.fromVoiceChat;
        // 🔥 Step 1. Define  user query
        let query = req.body.query;
        const previousQuery = req.body.previousQuery;
        const previousQueryResponse = req.body.previousQueryResponse;
        const categories = req.body.categories;
        const accounts = req.body.accounts;

        let resolvedData = {};

        if (fromVoiceChat) {
          if (!req.file) {
            throw "No audio file provided";
          }

          tempFilePath = req.file.path;

          // Convert audio to wav
          const fileExtension = path.extname(req.file.filename).toLowerCase();

          let convertedFilePath = await convertAudioToWav(
            tempFilePath,
            fileExtension
          );
          let processFilePath = convertedFilePath;
          tempFilePath = convertedFilePath;

          // convert audio to text

          const transcription = await speechToText(processFilePath);
          if (!transcription || transcription.trim() === "") {
            throw "Could not understand the audio. Please try again.";
          }

          console.log("🎤 Transcription received:", transcription);
          query = transcription;
          resolvedData.transcription = transcription;
        }

        if (previousQuery && previousQueryResponse) {
          query = `Current Response Back : ${query}, Previous Query : ${previousQuery}, Previous Query Response : ${previousQueryResponse}`;
        }
        console.log("Query", query);

        // 🔥 Step 2. Build prompt for Claude
        const prompt = `
You are Aura, an AI assistant for the Expenses Aura app.

Your task is to handle both:
1. Smart financial queries (e.g., summaries, totals, category/account insights) — generate SQL
2. Action-based commands (e.g., create transactions, add account/category) — return operation JSON
3. Minimal general responses (e.g., greetings), You can create accounts, transactions or categories and also can analyse them, but do not answer non-financial questions.

Important Rule:
- If the user requests multiple different creation operations in the same query (e.g., "create an account and log transactions" or "create a category and an account"), respond with:
  {
    "type": "text",
    "response_text": "[Generate a friendly response saying that you can only perform one creation operation at a time]"
  }
- This restriction applies only to creation actions (transactions, accounts, categories)

---

Today's date: ${today}
Current time: ${currentTime}

Here is the database schema:

${schema}

Here is the list of available categories (case-insensitive match):

${JSON.stringify(categories)}

Here is the list of available accounts (case-insensitive match):

${JSON.stringify(accounts)}

---

### 🔍 IF USER ASKS A FINANCIAL QUESTION (QUERY MODE)

Rules:
- If category or account name mentioned in the query, then match accounts/categories using semantic or partial match; if match found, use exact name
- If no match: return { "type": "text", "text": "Sorry, no such category/account exists." }

Determine main table:
- 'accounts' → for balances, totals
- 'categories' → for category summaries
- 'transactions' → for detailed records

SQL Rules:
- For transactions/category queries: always JOIN accounts and categories
- For account queries: JOIN transactions only if needed
- For category queries: never JOIN accounts directly
- Only return fields as defined in schema (plus accountName, currency, categoryName)
- Use ‘YYYY-MM-DD 00:00:00’ format for dates
- Never use DATE() or exact = match on dates — only BETWEEN with full datetime
- Replace ? placeholders with actual date strings in params
- Always generate query whereever its possible so that it includes transactions data as well for better result
- Provide:
  {
    "type": "query",
    "collectionName": "...",
    "sqlQuery": "...",
    "params": [...],
    "joinTables": ["accounts", "categories"] or []
  }

If it's not a query but still financial and conceptual (e.g. “what’s a budget?”), return:
  {
    "type": "text",
    "response_text": "short direct answer within 150 characters"
  }

---

### 🗣️ IF USER WANTS TO CREATE SOMETHING

Supported:
1. Creating transactions
2. Creating accounts
3. Creating categories

Return JSON as follows:

✅ TRANSACTION:
{
  "operation": "create_transaction",
  "data": [
    {
      "amount": number,
      "accountId": "string" (if matched) or null,
      "accountName": "string" (matched account name),
      "categoryId": "string" (if matched) or "misc_id",
      "categoryName": "string" (matched category or "Miscellaneous"),
      "notes": "1 sentence (max - extract meaningful, descriptive keywords from user input that best describe the transaction purpose",
      "date": "YYYY-MM-DD HH:mm:ss", (if time is not mentioned in query then always use only 00:00:00 for time)
      "time": "YYYY-MM-DD HH:mm:ss", (if time is not mentioned in query then always use only 00:00:00 for time)
      "showTime": boolean, (if time mentioned in query then true otherwise false)
      "type": "income" or "expense"
    }....
  ],
  "response_text": "[Generate a friendly summary of what was logged — amount, category, account and say that they are created successfully]"
}

- Infer type: "expense" by default, BUT infer "income" if the transaction description contains income-related words or phrases such as: salary, payment, deposit, credit, refund, received, earnings, income, bonus, commission, transfer in, freelance, interest, cash back, or any phrasing that indicates money coming into the account.
- Match account/category using fuzzy logic and include categoryId and accountId in the data
- For categoryId and accountId please dont mention names, its only used for the id
- If multiple transactions are identified but only one account is specified in the query, use that account for all transactions unless additional accounts are explicitly mentioned. 
- Use "Miscellaneous" if no category found
- Default time: "00:00:00" if not mentioned
- Extract 1-sentence meaningful, descriptive keywords from user input to note
- If some required info missing (e.g. account): return operation = "incomplete_info" and ask for it in response_text
- account and category is mandatory if those fail to have or any information missing, please change back to the rule incomplete_info

✅ ACCOUNT:
{
  "operation": "create_account",
  "data": [{ name: "..." }],
  "response_text": "[Generate a short, warm, and varied reply that says account created successfully]"
}

✅ CATEGORY:
{
  "operation": "create_category",
  "data": [{ name: "...", type: "income" or "expense" }],
  "response_text": "[Generate a short, warm, and varied reply that says category created successfully]"
}

✅ INCOMPLETE:
{
  "operation": "incomplete_info",
  "message": "Missing fields",
  "response_text": "[Ask for what’s missing, e.g., Please tell me the account or amount]"
}

✅ OTHER/OUT OF SCOPE:
{
  "operation": "other_query",
  "message": "Outside scope",
  "response_text": "[Generate a short, warm, and varied reply that politely declines the request and redirects the user to financial tasks]" //Include available accounts whenever its required
}

---

✨ NOTE:
- All response_text must be dynamically generated — warm, helpful, short, emotionally engaging
- Do not hardcode or template
- No markdown, no code, no explanations — return JSON only

User Input: "${query}"
`;
        const claudeRaw = await anthropic.messages.create({
          model: "claude-sonnet-4-0",
          max_tokens: 5000,
          messages: [{ role: "user", content: prompt }],
        });

        // 🛑 Extract only the JSON content
        let claudeContent = claudeRaw.content?.[0]?.text || "{}";
        claudeContent = claudeContent.replace(/```json\n?|```/g, "").trim();
        const claudeResponse = JSON.parse(claudeContent);
        console.log("Claude Response:", claudeResponse);
        let audioResult = {};
        if (claudeResponse?.type !== "query" && fromVoiceChat) {
          audioResult = await textToSpeechConvert(claudeResponse.response_text);
        }
        if (tempFilePath) {
          deleteFile(tempFilePath);
        }

        resolvedData.status = true;
        resolvedData.message = "Chatbot Started Successfully";
        resolvedData.claudeResponse = claudeResponse;
        resolvedData.audioData = audioResult.audioData || null;
        resolvedData.audioMimeType = audioResult.mimeType || null;
        resolvedData.audioEncoding = audioResult.encoding || null;

        return sendResponse(res, httpCodes.OK, resolvedData);
      } catch (e) {
        const err = e?.response?.data?.message || e.toString();
        logger.error(err);
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          status: false,
          message: err,
        });
      }
    });
  },
};
