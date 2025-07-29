const express = require("express");
const router = express.Router();

const {
  validatequeryChatBot,
  validateFormResponseChatBot,
  validateVoiceChat,
} = require("../controllers/chatbot/chatbotValidator");
const {
  queryChatBot,
  formResponseChatBot,
  processVoiceChat,
} = require("../controllers/chatbot/chatbotController");
const { VerifyToken } = require("../helpers/AuthHelpers");
const audioUpload = require("../helpers/audio-processing/audioUpload,js");
const { sendResponse, httpCodes } = require("../helpers/utility");

router.post("/query", VerifyToken, validatequeryChatBot, queryChatBot);

router.post(
  "/voice",
  (req, res, next) => {
    audioUpload.single("audio")(req, res, (err) => {
      if (err) {
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: err.toString(),
        });
      }
      next();
    });
  },
  validateVoiceChat,
  processVoiceChat
);

router.post(
  "/form-response",
  VerifyToken,
  validateFormResponseChatBot,
  formResponseChatBot
);

module.exports = router;
