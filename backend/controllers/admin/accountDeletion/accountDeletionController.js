const httpstatus = require("http-status-codes");
const moment = require("moment");
const _ = require("lodash");
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const firebaseAdmin = require("firebase-admin");
const {
  httpCodes,
  sendResponse,
  decryptAES,
} = require("../../../helpers/utility");
const logger = require("../../../middleware/logger/logger");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { database } = require("firebase-admin");
const { notifyUserStatusChange } = require("./accountDeletionNotifier");
const { plaidClient } = require("../../../config/plaidConfig");

async function deleteUserFiles(folderName) {
  let bucket = firebaseAdmin.storage().bucket();
  try {
    const [files] = await bucket.getFiles({ prefix: folderName });

    if (files.length === 0) {
      console.log(`Folder "${folderName}" does not exist.`);
      return;
    }

    const deletePromises = files.map((file) => file.delete());

    // Wait for all the files to be deleted
    await Promise.all(deletePromises);

    console.log(
      `Folder "${folderName}" and its contents deleted successfully.`
    );
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

module.exports = {
  async createRequest(req, res) {
    try {
      let { reason } = req.body;
      const user = req.account;
      if (!user) {
        throw "Sorry user not found";
      }

      const uid = user.uid;
      let data = {
        reason: reason,
        uid: uid,
        status: "pending",
        createdAt: Date.now(),
      };

      await database().ref(`accountDeletions/${uid}`).set(data);

      notifyUserStatusChange({
        status: "requested",
        user: user,
      });
      return sendResponse(res, httpCodes.OK, {
        requestId: uid,
        message:
          "Account Deletion request submitted successfully, we will reach you out soon.",
      });
    } catch (err) {
      logger.error(
        " Error occured while creating account deletion request to the database " +
          err
      );
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: err.toString(),
      });
    }
  },

  async getRequests(req, res) {
    try {
      const { status } = req.params;
      const allowedStatus = ["pending", "deleted", "rejected", "all"];

      if (!status || !allowedStatus.includes(status)) {
        throw "Invalid Status Provided";
      }

      const dbRef = await database().ref("accountDeletions");
      const snapshot =
        status === "all"
          ? await dbRef.once("value")
          : await dbRef.orderByChild("status").equalTo(status).once("value");

      const requests = snapshot.val() || {};
      const enrichedRequests = await Promise.all(
        _.map(requests, async (request, key) => {
          const userSnapshot = await database()
            .ref(`users/${request.uid}`)
            .once("value");
          const user = userSnapshot.val() || {};
          const { displayName, email, phoneNumber, photoURL } = user;
          const lastUpdate = request.updatedAt || request.createdAt || 0;
          return {
            ...request,
            name: displayName || "",
            email: email || "",
            phoneNumber: phoneNumber || "",
            photoURL: photoURL || "",
            lastUpdate: lastUpdate,
          };
        })
      );

      const sortedRequests = _.orderBy(
        enrichedRequests,
        ["lastUpdate"], // Sorting priorities
        ["desc"] // Sort in descending order (latest first)
      );

      return sendResponse(res, httpCodes.OK, {
        message: "Deletion requests",
        requests: sortedRequests,
      });
    } catch (err) {
      logger.error(err.toString());
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: err.toString(),
      });
    }
  },

  async getRequestStatus(req, res) {
    try {
      const deletionRequest = req.deletionRequest;

      return sendResponse(res, httpCodes.OK, {
        message: "Status",
        request: deletionRequest,
      });
    } catch (err) {
      logger.error(
        "Error Occured in getting the request status : " + err.toString()
      );
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: err.toString(),
      });
    }
  },

  async rejectRequest(req, res) {
    try {
      let uid = req.params.requestId;
      let { rejectedReason } = req.body;
      const requestRef = database().ref(`accountDeletions/${uid}`);
      await requestRef.update({
        status: "rejected",
        rejectedReason: rejectedReason,
        updatedAt: Date.now(),
      });
      const userSnapshot = await database().ref(`users/${uid}`).once("value");
      const user = userSnapshot.val();

      notifyUserStatusChange({
        status: "rejected",
        reason: rejectedReason,
        user: user,
      });

      return sendResponse(res, httpCodes.OK, {
        message: "Status changed to rejected",
      });
    } catch (err) {
      logger.error("Error in rejecting the request " + err.toString());
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: err.toString(),
      });
    }
  },

  async deleteAccount(req, res) {
    try {
      const { requestId } = req.params;
      const requestRef = database().ref(`accountDeletions/${requestId}`);
      const requestSnapshot = await requestRef.once("value");
      const request = requestSnapshot.val();
      const userRef = database().ref(`users/${request.uid}`);
      const userSnapshot = await userRef.once("value");
      const user = userSnapshot.val();
      const { uid, displayName, email, phoneNumber, photoURL } = user;
      // Unlink plaid bank accounts if exists
      const plaidUserToken = user?.plaid?.userToken;
      const accessTokens = _.get(user, "plaid.accessTokens", []);
      await Promise.all(
        accessTokens.map(async (tokenObj) => {
          try {
            const decrypted = decryptAES(tokenObj.token, uid);
            await plaidClient.itemRemove({
              access_token: decrypted,
            });
          } catch (plaidError) {
            const errData = plaidError?.response?.data;
            if (errData?.error_code !== "INVALID_ACCESS_TOKEN") {
              throw plaidError;
            }
          }
        })
      );
      console.log(plaidUserToken);

      if (plaidUserToken) {
        const decryptedPliadUserToken = decryptAES(plaidUserToken, uid);
        try {
          await plaidClient.userRemove({
            user_token: decryptedPliadUserToken,
          });
        } catch (plaidError) {
          const errData = plaidError?.response?.data;
          if (errData?.error_code !== "INVALID_USER_TOKEN") {
            throw plaidError;
          }
        }
      }

      const adminRef = database().ref("/admin/plaid");
      const adminSnap = await adminRef.once("value");
      const adminData = adminSnap.val() || {};
      const summary = adminData.summary || {};
      summary["link_account"] = Math.max(
        (summary["link_account"] || 0) - accessTokens.length,
        0
      );
      summary["unlink_account"] = Math.max(
        (summary["unlink_account"] || 0) + accessTokens.length,
        0
      );

      await adminRef.update({
        summary: summary,
      });

      await firebaseAdmin.auth().revokeRefreshTokens(uid);
      // delete user related files
      await deleteUserFiles(`users/${uid}`);
      // delete user from firebase
      await firebaseAdmin.auth().deleteUser(uid);
      await userRef.remove();
      let referenceData = {
        name: displayName || "",
        email: email || "",
        phoneNumber: phoneNumber || "",
        photoURL: photoURL || "",
        updatedAt: Date.now(),
      };
      await requestRef.update({
        status: "deleted",
        ...referenceData,
      });

      notifyUserStatusChange({
        status: "deleted",
        user: user,
      });

      return sendResponse(res, httpCodes.OK, {
        message: "Account and its data deleted successfully",
      });
    } catch (err) {
      const errorMessage = err?.response?.data?.error_message || err.toString();

      logger.error(
        "Error occured while deleting user from firebase " + errorMessage
      );
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message:
          "Error Occured while deleting user from firebase " + errorMessage,
      });
    }
  },
};
