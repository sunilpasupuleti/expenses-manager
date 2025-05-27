const express = require("express");
const router = express.Router();

const { VerifyToken } = require("../helpers/AuthHelpers");
const {
  updateDailyReminder,
  updateDailyBackUp,
  destroyNotifications,
  enableNotifications,
} = require("../controllers/notification/notificationController");

router.post("/update-daily-reminder", VerifyToken, updateDailyReminder);

router.post("/update-daily-backup", VerifyToken, updateDailyBackUp);

router.post("/destroy-notifications", VerifyToken, destroyNotifications);

router.post("/enable-notifications", VerifyToken, enableNotifications);

module.exports = router;
