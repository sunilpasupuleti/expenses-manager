const express = require("express");
const router = express.Router();

const AuthHelper = require("../helpers/AuthHelpers");
const notificationCtrl = require("../controllers/notification");

router.post(
  "/update-daily-reminder",
  AuthHelper.VerifyToken,
  notificationCtrl.updateDailyReminder
);

router.post(
  "/update-daily-backup",
  AuthHelper.VerifyToken,
  notificationCtrl.updateDailyBackUp
);

module.exports = router;
