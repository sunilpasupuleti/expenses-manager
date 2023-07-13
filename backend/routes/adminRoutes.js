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
  sendDailyUpdateNotificationsToUsers,
  getActiveDevicesList,
} = require("../controllers/admin/notification/notificationController");
const { getUsers } = require("../controllers/admin/user/userController");
const {
  validateCreateRequest,
  validateRejectRequest,
  validateRequestId,
  validateDeleteAccount,
} = require("../controllers/admin/accountDeletion/accountDeletionValidator");
const {
  createRequest,
  getRequests,
  rejectRequest,
  deleteAccount,
  getRequestStatus,
} = require("../controllers/admin/accountDeletion/accountDeletionController");
const { validateParamsObjectId } = require("../helpers/utility");

// Get self user details after login
router.route("/auth").get(VerifyAdminToken, getSelfUser);

// Route used for signin
router.route("/auth/signin").post(validateSignin, signin);

// Refresh
router.route("/auth/refresh").get(refreshToken);

// Signout
router.route("/auth/signout").get(signout);

// get Users list
router.route("/user").get(VerifyAdminToken, getUsers);

// Get active devices list for sending notification
router
  .route("/notification/active-devices")
  .get(VerifyAdminToken, getActiveDevicesList);

// send notification to users
router
  .route("/notification")
  .post(
    validateSendDailyUpdateNotificationToUsers,
    sendDailyUpdateNotificationsToUsers
  );

/**
 * Account Deletion
 */

// create request
router
  .route("/account-deletion/:accountKey")
  .post(validateCreateRequest, createRequest);

// get requests
router.route("/account-deletion").get(VerifyAdminToken, getRequests);

// reject request
router
  .route("/account-deletion/:requestId")
  .put(
    VerifyAdminToken,
    validateParamsObjectId("requestId"),
    validateRequestId,
    validateRejectRequest,
    rejectRequest
  );

// delete account
router
  .route("/account-deletion/:requestId")
  .delete(
    VerifyAdminToken,
    validateParamsObjectId("requestId"),
    validateRequestId,
    validateDeleteAccount,
    deleteAccount
  );

// get request status
router.route("/account-deletion/status").get(getRequestStatus);

module.exports = router;
