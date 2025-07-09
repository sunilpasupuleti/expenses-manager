const express = require("express");
const router = express.Router();

const {
  validatequeryChatBot,
  validateFormResponseChatBot,
} = require("../controllers/chatbot/chatbotValidator");
const {
  queryChatBot,
  formResponseChatBot,
} = require("../controllers/chatbot/chatbotController");
const { VerifyToken } = require("../helpers/AuthHelpers");

router.post("/query", VerifyToken, validatequeryChatBot, queryChatBot);

router.post(
  "/form-response",
  VerifyToken,
  validateFormResponseChatBot,
  formResponseChatBot
);

module.exports = router;
