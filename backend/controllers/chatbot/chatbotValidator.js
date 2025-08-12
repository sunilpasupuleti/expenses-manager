const { database } = require("firebase-admin");
const _ = require("lodash");
const {
  sendResponse,
  httpCodes,
  deleteFile,
} = require("../../helpers/utility");

module.exports = {
  async validatequeryChatBot(req, res, next) {
    try {
      const { query, fromVoiceChat } = req.body;
      if (!query && !fromVoiceChat) {
        throw "No Query Found";
      }

      next();
    } catch (err) {
      const file = req?.file?.path;
      console.log(file);

      deleteFile(file);
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
