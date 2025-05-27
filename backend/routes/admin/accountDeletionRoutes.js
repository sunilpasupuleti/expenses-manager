const express = require("express");
const { VerifyToken } = require("../../helpers/AuthHelpers");
const {
  validateCreateRequest,
  validateGetStatus,
  validateRejectRequest,
  validateRequestId,
  validateDeleteAccount,
} = require("../../controllers/admin/accountDeletion/accountDeletionValidator");
const {
  createRequest,
  getRequestStatus,
  getRequests,
  rejectRequest,
  deleteAccount,
} = require("../../controllers/admin/accountDeletion/accountDeletionController");

const router = express.Router();

// create request
router.route("/:accountKey").post(validateCreateRequest, createRequest);

// get request status
router.route("/status").get(validateGetStatus, getRequestStatus);

// get requests
router.route("/:status").get(VerifyToken, getRequests);

// reject request
router
  .route("/:requestId")
  .put(VerifyToken, validateRequestId, validateRejectRequest, rejectRequest);

// delete account
router
  .route("/:requestId")
  .delete(VerifyToken, validateRequestId, validateDeleteAccount, deleteAccount);

module.exports = router;
