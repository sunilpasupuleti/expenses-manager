const express = require("express");

const router = express.Router();
const { VerifyAdminToken } = require("../helpers/AuthHelpers");
const {
  getSelfUser,
  signin,
  refreshToken,
  signout,
} = require("../controllers/admin/auth/authController");
const { validateSignin } = require("../controllers/admin/auth/authValidator");
const {
  validateSendDailyUpdateNotificationToUsers,
} = require("../controllers/admin/notification/notificationValidator");
const {
  sendDailyUpdatesNotificationToUsers,
  getActiveDevicesList,
} = require("../controllers/admin/notification/notificationController");

// Get self user details after login
router.route("/auth").get(VerifyAdminToken, getSelfUser);

// Route used for signin
router.route("/auth/signin").post(validateSignin, signin);

// Refresh
router.route("/auth/refresh").get(refreshToken);

// Signout
router.route("/auth/signout").get(signout);

// Get active devices list for sending notification
router
  .route("/notification/active-devices")
  .get(VerifyAdminToken, getActiveDevicesList);

// send notification to users
router
  .route("/notification")
  .post(
    validateSendDailyUpdateNotificationToUsers,
    sendDailyUpdatesNotificationToUsers
  );

module.exports = router;
