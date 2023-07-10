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

    let androidPayload = {
      data: { type: "daily-update", title: title, body: body },
    };

    let iosPayload = {
      data: { type: "daily-update", title: title, body: body },
      notification: {
        title: title,
        body: body,
      },
    };

    users = users.map((id) => (id = new ObjectId(id)));

    let fcmTokens = await Users.find({
      _id: { $in: users },
    }).select({ fcmToken: 1, _id: 0, platform: 1 });
    let androidFcmTokens = [];
    let iosFcmTokens = [];

    androidFcmTokens = fcmTokens.filter(
      (u) => u && u.platform && u.platform === "android"
    );
    iosFcmTokens = users.filter((u) => u && u.platform && u.platform === "ios");

    let structuredAndroidFcmTokens = [];
    let structuredIosFcmTokens = [];

    androidFcmTokens.forEach((t) => {
      structuredAndroidFcmTokens.push(t.fcmToken);
    });

    iosFailureCount.forEach((t) => {
      structuredIosFcmTokens.push(t.fcmToken);
    });

    let androidSuccessCount = 0;
    let androidFailureCount = 0;
    let iosSuccessCount = 0;
    let iosFailureCount = 0;

    // send to android
    await getMessaging()
      .sendToDevice(structuredAndroidFcmTokens, androidPayload, {
        priority: "high",
      })
      .then((r) => {
        let error = null;
        if (r.results[0] && r.results[0].error) {
          error = r.results[0].error;
        }
        if (error) {
          logger.error(
            `Error in sending daily notifications android ${error.code} ${error.message}`
          );
        } else {
          androidSuccessCount = r.successCount;
          androidFailureCount = r.failureCount;
          logger.info(
            "successfully sent daily update notifications to android"
          );
          //   logger.info(JSON.stringify(r));
          logger.info(
            `ANDROID - Failure count - ${r.failureCount} - Success cound - ${r.successCount}`
          );
        }
      })
      .catch((err) => {
        logger.error(err);
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: `Error in sending notifications ${JSON.stringify(err)}`,
        });
      });

    // send to ios
    await getMessaging()
      .sendToDevice(structuredIosFcmTokens, iosPayload, {
        priority: "high",
      })
      .then((r) => {
        let error = null;
        if (r.results[0] && r.results[0].error) {
          error = r.results[0].error;
        }
        if (error) {
          logger.error(
            `Error in sending daily notifications IOS ${error.code} ${error.message}`
          );
        } else {
          iosSuccessCount = r.successCount;
          iosFailureCount = r.failureCount;
          logger.info("successfully sent daily update notifications IOS");
          //   logger.info(JSON.stringify(r));
          logger.info(
            `IOS -  count - ${r.failureCount} - Success cound - ${r.successCount}`
          );
        }
      })
      .catch((err) => {
        logger.error(err);
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: `Error in sending notifications ${JSON.stringify(err)}`,
        });
      });

    return sendResponse(res, httpCodes.OK, {
      message: `Android (Users/Success/Failure) - ${androidUsers.length}/${androidSuccessCount}/${androidFailureCount} - IOS (Users/Success/Failure) - ${iosUsers.length}/${iosSuccessCount}/${iosFailureCount} `,
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
