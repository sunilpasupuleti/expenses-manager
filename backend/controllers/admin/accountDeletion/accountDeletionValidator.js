const { sendResponse, httpCodes } = require("../../../helpers/utility");
const AccountDeletion = require("../../../models/AccountDeletion");
const Users = require("../../../models/Users");
const mongoose = require("mongoose");

module.exports = {
  async validateRequestId(req, res, next) {
    let requestId = req.params.requestId;
    let request = await AccountDeletion.findOne({
      _id: requestId,
    });
    if (!request) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Invalid Request Id",
      });
    }
    next();
  },

  async validateCreateRequest(req, res, next) {
    const { reason } = req.body;
    let accountKey = req.params.accountKey;

    if (!accountKey) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Account Key required",
      });
    }

    let account = await Users.findOne({
      uid: accountKey,
    });
    if (!account) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Invalid Account Key",
      });
    }

    let requestAlreadyPresent = await AccountDeletion.findOne({
      uid: accountKey,
      status: { $ne: "rejected" },
    });

    if (requestAlreadyPresent) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message:
          "A request was alredy present and the status is " +
          requestAlreadyPresent.status?.toUpperCase(),
      });
    }

    if (!reason) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Reason required",
      });
    }

    next();
  },

  async validateRejectRequest(req, res, next) {
    const { rejectedReason } = req.body;
    if (!rejectedReason) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Rejected reason required",
      });
    }
    next();
  },

  async validateDeleteAccount(req, res, next) {
    let requestId = req.params.requestId;

    let requestAlreadyPresent = await AccountDeletion.findOne({
      _id: requestId,
    });

    if (requestAlreadyPresent && requestAlreadyPresent.status === "deleted") {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "The user was already deleted",
      });
    }
    next();
  },

  async validateGetStatus(req, res, next) {
    const { requestId, accountKey } = req.query;

    if (!requestId || !accountKey) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Account key or Request Id needed to proceed",
      });
    }

    next();
  },
};
