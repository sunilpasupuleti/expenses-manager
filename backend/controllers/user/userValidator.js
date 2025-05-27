const { sendResponse, httpCodes } = require("../../helpers/utility");

module.exports = {
  async validateSendOtp(req, res, next) {
    try {
      const { phone } = req.body;

      if (!phone) {
        throw "Phone Number is required";
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateVerifyOtp(req, res, next) {
    try {
      const { phone, otp } = req.body;

      if (!phone) {
        throw "Phone Number is required";
      }

      if (!otp) {
        throw "Otp is required";
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },
};
