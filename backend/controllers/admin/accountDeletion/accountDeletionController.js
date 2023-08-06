const httpstatus = require("http-status-codes");
const moment = require("moment");
const _ = require("lodash");
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const AccountDeletion = require("../../../models/AccountDeletion");
const BackupsTemp = require("../../../models/BackupsTemp");
const Backups = require("../../../models/Backups");
const firebaseAdmin = require("firebase-admin");
const { httpCodes, sendResponse } = require("../../../helpers/utility");
const Users = require("../../../models/Users");
const logger = require("../../../middleware/logger/logger");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

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
    let uid = req.params.accountKey;
    let { reason } = req.body;

    let user = await Users.findOne({
      uid: uid,
    });

    let data = {
      reason: reason,
      uid: uid,
      user: user._id,
    };

    AccountDeletion.create(data)
      .then((result) => {
        return sendResponse(res, httpCodes.OK, {
          requestId: result._id,
          message:
            "Account Deletion request submitted successfully, we will reach you out soon.",
        });
      })
      .catch((err) => {
        logger.error(
          " Error occured while creating account deletion request to the database " +
            err
        );
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message: "Error occured while saving " + err,
        });
      });
  },

  async getRequests(req, res) {
    let requests = await AccountDeletion.find({})
      .populate("user")
      .sort({ createdAt: -1 });

    return sendResponse(res, httpCodes.OK, {
      message: "Deletion requests",
      requests: requests,
    });
  },

  async getRequestStatus(req, res) {
    let { id } = req.query;

    let dataFromRequestId = null;
    let dataFromAccountKey = null;

    let request;

    dataFromAccountKey = await AccountDeletion.findOne({
      uid: id,
    });

    if (!dataFromAccountKey) {
      let validObjectId = ObjectId.isValid(id);
      if (!validObjectId) {
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: "Invalid Account Key or Request Id",
        });
      }
      dataFromRequestId = await AccountDeletion.findOne({
        _id: id,
      });
      request = dataFromRequestId;
    } else {
      request = dataFromAccountKey;
    }

    if (!request) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Record Not Found",
      });
    }

    return sendResponse(res, httpCodes.OK, {
      message: "Status",
      request: request,
    });
  },

  async rejectRequest(req, res) {
    let requestId = req.params.requestId;
    let { rejectedReason } = req.body;
    AccountDeletion.findOneAndUpdate(
      {
        _id: requestId,
      },
      {
        $set: {
          status: "rejected",
          rejectedReason: rejectedReason,
        },
      }
    ).then(() => {
      return sendResponse(res, httpCodes.OK, {
        message: "Status changed to rejected",
      });
    });
  },

  async deleteAccount(req, res) {
    let requestId = req.params.requestId;
    let request = await AccountDeletion.findOne({ _id: requestId }).populate(
      "user"
    );
    let user = request.user;

    // delete user related files
    await deleteUserFiles(`users/${user.uid}`);
    // delete user tempBackUpdata
    await BackupsTemp.findOneAndDelete({
      uid: user.uid,
    });

    // delete backups
    let backups = [];
    user.backups.forEach((backup) => {
      backups.push(backup._id);
    });

    await Backups.deleteMany({
      _id: { $in: backups },
    });

    // delete user
    await Users.findOneAndDelete({
      _id: user._id,
    });

    // delete from firebase

    await firebaseAdmin
      .auth()
      .deleteUser(user.uid)
      .then(() => {
        // update status
        let referenceData = {
          name: user.displayName,
          email: user.email,
          phoneNumber: user.phoneNumber,
        };
        AccountDeletion.findOneAndUpdate(
          {
            _id: requestId,
          },
          {
            $set: {
              status: "deleted",
              referenceData: referenceData,
            },
          }
        )
          .then(() => {
            return sendResponse(res, httpCodes.OK, {
              message: "Account and its data deleted successfully",
            });
          })
          .catch((err) => {
            logger.error("Error occured while deleting data " + err);
            return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
              message: "Error Occured while deleting account " + err,
            });
          });
      })
      .catch((err) => {
        logger.error("Error occured while deleting user from firebase " + err);
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message: "Error Occured while deleting user from firebase " + err,
        });
      });
  },
};
