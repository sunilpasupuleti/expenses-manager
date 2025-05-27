const express = require("express");
const { VerifyToken } = require("../../helpers/AuthHelpers");
const {
  getActiveDevicesList,
  sendDailyUpdateNotificationsToUsers,
} = require("../../controllers/admin/notification/notificationController");
const {
  validateSendDailyUpdateNotificationToUsers,
} = require("../../controllers/admin/notification/notificationValidator");

const router = express.Router();

// Get active devices list for sending notification
router.route("/active-devices").get(VerifyToken, getActiveDevicesList);

// send notification to users
router
  .route("/")
  .post(
    validateSendDailyUpdateNotificationToUsers,
    sendDailyUpdateNotificationsToUsers
  );

module.exports = router;
