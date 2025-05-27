const express = require("express");

const router = express.Router();
const { VerifyToken } = require("../../helpers/AuthHelpers");
const {
  getSelfUser,
  signin,
  refreshToken,
  signout,
} = require("../../controllers/admin/auth/authController");
const {
  validateSignin,
} = require("../../controllers/admin/auth/authValidator");
const {
  validateSendDailyUpdateNotificationToUsers,
} = require("../../controllers/admin/notification/notificationValidator");
const {
  sendDailyUpdateNotificationsToUsers,
  getActiveDevicesList,
} = require("../../controllers/admin/notification/notificationController");
const { getUsers } = require("../../controllers/admin/user/userController");
const {
  validateCreateRequest,
  validateRejectRequest,
  validateRequestId,
  validateDeleteAccount,
  validateGetStatus,
} = require("../../controllers/admin/accountDeletion/accountDeletionValidator");
const {
  validateGetPlaidAnalytics,
} = require("../../controllers/admin/plaid/plaidValidator");
const {
  createRequest,
  getRequests,
  rejectRequest,
  deleteAccount,
  getRequestStatus,
} = require("../../controllers/admin/accountDeletion/accountDeletionController");

const { validateParamsObjectId } = require("../../helpers/utility");

/**
 * User
 */

router.use("/user", VerifyToken, require("./adminUserRoutes"));

/**
 * Notification
 */

router.use("/notification", require("./adminNotificationRoutes"));

/**
 * Account Deletion
 */
router.use("/account-deletion", require("./accountDeletionRoutes"));

/**
 * Plaid
 */

router.use("/plaid", VerifyToken, require("./plaidRoutes"));

module.exports = router;
