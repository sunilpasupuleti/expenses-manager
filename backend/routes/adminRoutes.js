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
  validateSendNotificationToUsers,
} = require("../controllers/admin/notification/notificationValidator");
const {
  sendNotificationToUsers,
  getActiveUsersList,
} = require("../controllers/admin/notification/notificationController");

// Get self user details after login
router.route("/auth").get(VerifyAdminToken, getSelfUser);

// Route used for signin
router.route("/auth/signin").post(validateSignin, signin);

// Refresh
router.route("/auth/refresh").get(refreshToken);

// Signout
router.route("/auth/signout").get(signout);

// Get active users list for sending notification
router
  .route("/notification/active-users")
  .get(VerifyAdminToken, getActiveUsersList);

// send notification to users
router
  .route("/notification")
  .post(validateSendNotificationToUsers, sendNotificationToUsers);

module.exports = router;
