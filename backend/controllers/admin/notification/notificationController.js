const { sendResponse, httpCodes } = require("../../../helpers/utility");
const logger = require("../../../middleware/logger/logger");
const Users = require("../../../models/Users");
const { getMessaging } = require("firebase-admin/messaging");
const mongoose = require("mongoose");
let ObjectId = mongoose.Types.ObjectId;

module.exports = {
  async sendNotificationToUsers(req, res) {
    let { title, body, users } = req.body;
    logger.info("sending daily update notifications to users  - ");
    let payload = {
      data: { type: "daily-update", title: title, body: body },
    };

    users = users.map((id) => (id = new ObjectId(id)));

    let fcmTokens = await Users.find({
      _id: { $in: users },
    }).select({ fcmToken: 1, _id: 0 });
    let structuredFcmTokens = [];
    fcmTokens.forEach((t) => {
      structuredFcmTokens.push(t.fcmToken);
    });

    getMessaging()
      .sendToDevice(structuredFcmTokens, payload, { priority: "high" })
      .then((r) => {
        let error = null;
        if (r.results[0] && r.results[0].error) {
          error = r.results[0].error;
        }
        if (error) {
          logger.error(JSON.stringify(error));
          logger.error(
            `Error in sending daily notifications ${error.code} ${error.message}`
          );
          return sendResponse(res, httpCodes.BAD_GATEWAY, {
            message: `Error in sending notifications - failure count - ${
              r.failureCount
            } ${JSON.stringify(error)}`,
          });
        } else {
          logger.info("successfully sent daily update notifications");
          //   logger.info(JSON.stringify(r));
          logger.info(
            `Failure count - ${r.failureCount} - Success cound - ${r.successCount}`
          );
          return sendResponse(res, httpCodes.OK, {
            message: `Succesfully sent notifications to the selected users.Failure count - ${r.failureCount} - Success count - ${r.successCount}`,
          });
        }
      })
      .catch((err) => {
        logger.error(err);
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: `Error in sending notifications ${JSON.stringify(err)}`,
        });
      });
  },

  async getActiveUsersList(req, res) {
    let activeUsers = await Users.find({
      active: true,
      fcmToken: { $ne: null },
    })
      .select({
        email: 1,
        displayName: 1,
        photoURL: 1,
        fcmToken: 1,
        phoneNumber: 1,
        providerId: 1,
        lastLogin: 1,
        uid: 1,
        _id: 1,
      })
      .sort({ displayName: 1 });
    return sendResponse(res, httpCodes.OK, {
      message: "Active users list",
      activeUsers: activeUsers,
    });
  },
};
