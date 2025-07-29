const { database } = require("firebase-admin");
const _ = require("lodash");
const { sendResponse, httpCodes } = require("../../helpers/utility");

module.exports = {
  async validatequeryChatBot(req, res, next) {
    try {
      const { query } = req.body;
      if (!query) {
        throw "No Query Found";
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateVoiceChat(req, res, next) {
    try {
      console.log(req.file);
      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateFormResponseChatBot(req, res, next) {
    try {
      const { question, data } = req.body;
      if (!question || !data) {
        throw "Both data and question are required";
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },
};
