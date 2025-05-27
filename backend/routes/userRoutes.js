const express = require("express");
const {
  sendOtp,
  verifyOtpHandler,
} = require("../controllers/user/userController");
const {
  validateSendOtp,
  validateVerifyOtp,
} = require("../controllers/user/userValidator");
const { VerifyToken } = require("../helpers/AuthHelpers");
const router = express.Router();

router.post("/send-otp", validateSendOtp, sendOtp);
router.post("/verify-otp", validateVerifyOtp, verifyOtpHandler);

module.exports = router;
