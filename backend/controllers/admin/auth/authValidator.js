const { sendResponse, httpCodes } = require("../../../helpers/utility");

module.exports = {
  async validateSignin(req, res, next) {
    const { email, password } = req.body;
    if (!email) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Email required",
      });
    }

    if (!password) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Password required",
      });
    }

    next();
  },
};
