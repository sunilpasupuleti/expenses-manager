const { sendResponse, httpCodes } = require("../../../helpers/utility");
const { database } = require("firebase-admin");
const _ = require("lodash");

module.exports = {
  async validateRequestId(req, res, next) {
    try {
      let uid = req.params.requestId;
      const requestSnapshot = await database()
        .ref(`users/${uid}`)
        .once("value");
      if (!requestSnapshot.exists()) {
        throw "Invalid Request ID";
      }
      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateCreateRequest(req, res, next) {
    try {
      const { reason } = req.body;
      let accountKey = req.params.accountKey;

      if (!accountKey) {
        throw "Account Key Required";
      }
      const userSnapshot = await database()
        .ref(`users/${accountKey}`)
        .once("value");
      const user = userSnapshot.val();
      if (!user) {
        throw "Invalid Account Key or Account doesn't exist";
      }
      const requestSnapshot = await database()
        .ref(`accountDeletions`)
        .orderByChild("uid")
        .equalTo(accountKey)
        .once("value");
      const requests = (await requestSnapshot.val()) || {};
      const hasActiveRequest = _.some(requests, (request) =>
        ["pending"].includes(request.status)
      );
      if (hasActiveRequest) {
        throw "A request is already in progress with a status of PENDING. You can track the status on the Track Status page.";
      }

      if (!reason) {
        throw "Reason Required";
      }
      req.account = user;
      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
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
    try {
      let requestId = req.params.requestId;
      const requestSnapshot = await database()
        .ref(`accountDeletions/${requestId}`)
        .once("value");
      if (!requestSnapshot.exists()) {
        throw "Request not found";
      }
      const request = requestSnapshot.val();
      if (request.status === "deleted") {
        throw "The user was already deleted";
      }
      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateGetStatus(req, res, next) {
    try {
      const { id } = req.query;

      if (!id) {
        throw "Account Key required to proceed";
      }
      const requestSnapshot = await database()
        .ref(`accountDeletions/${id}`)
        .once("value");
      if (!requestSnapshot.exists()) {
        throw "Deletion request not found.";
      }
      req.deletionRequest = requestSnapshot.val();
      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },
};
