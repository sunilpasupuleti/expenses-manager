const logger = require("../../middleware/logger/logger");
const _ = require("lodash");
const { sendResponse, httpCodes } = require("../../helpers/utility");
const { isRateLimited, saveOtp, verifyOtp } = require("../../helpers/otpStore");
const { sendSMS } = require("../../helpers/smsHelpers");
const { auth } = require("firebase-admin");
const openai = require("../../helpers/openai/openaiClient");
const path = require("path");
const { getRedis } = require("../../config/redisConfig");
const fs = require("fs");
const OTP_TID = process.env.OTP_TEMPLATEID;

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
};

module.exports = {
  async sendOtp(req, res) {
    try {
      const { phone } = req.body;

      if (await isRateLimited(phone)) {
        throw "Too many requests. Try again later!";
      }

      const otp = generateOtp();

      // await sendSMS(phone, OTP_TID, {
      //   otp: otp,
      // });
      console.log(otp);

      await saveOtp(phone, otp);
      return sendResponse(res, httpCodes.OK, {
        status: true,
        message: "Otp Sent Successfully",
      });
    } catch (e) {
      logger.error(" Error occured while sendin otp " + e);
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        status: false,
        message: e.toString(),
      });
    }
  },

  async verifyOtpHandler(req, res) {
    try {
      const { phone, otp } = req.body;

      const result = await verifyOtp(phone, otp);
      if (!result.success) {
        throw result.message;
      }
      let user;
      try {
        user = await auth().getUserByPhoneNumber(phone);
      } catch (e) {
        user = await auth().createUser({
          phoneNumber: phone,
        });
      }

      const firebaseToken = await auth().createCustomToken(user.uid);

      return sendResponse(res, httpCodes.OK, {
        message: "Otp Verified Successfully",
        firebaseToken: firebaseToken,
      });
    } catch (e) {
      console.log(e);

      logger.error(" Error occured while verifying otp " + e);
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: e.toString(),
      });
    }
  },
};
