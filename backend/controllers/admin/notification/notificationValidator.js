const { sendResponse, httpCodes } = require("../../../helpers/utility");

module.exports = {
  async validateSendNotificationToUsers(req, res, next) {
    const { title, body, users } = req.body;
    if (!title) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Title required",
      });
    }

    if (!body) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Body required",
      });
    }

    if (!users || users.length === 0) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Users required",
      });
    }

    next();
  },
};
