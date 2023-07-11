const { sendResponse, httpCodes } = require("../../../helpers/utility");
const logger = require("../../../middleware/logger/logger");
const Users = require("../../../models/Users");
const { getMessaging } = require("firebase-admin/messaging");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const util = require("util");
const OneSignal = require("onesignal-node");
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_API_KEY
);

const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);

module.exports = {
  async sendDailyUpdatesNotificationToUsers(req, res) {
    logger.info("sending daily update notifications to users  - ");

    let { title, body, users, bigPicture, largeIcon } = req.body;
    let bigPictureUrl = null;
    let bigPicturePath = null;

    let largeIconUrl = `${process.env.BACKEND_URL}/public/notification/mike.png`;
    let largeIconPath = null;

    // delete old uploaded daily update files from dashboard
    try {
      let files = await readdir(process.cwd() + "/public/notification");
      //  big picture images
      let bigPictureFileExists = files.filter((fileName) =>
        fileName.includes("daily_update_big_picture")
      );
      bigPictureFileExists.forEach((fileName) => {
        let path = `${process.cwd()}/public/notification/${fileName}`;
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      });
      // large icon images
      let largeIconFileExists = files.filter((fileName) =>
        fileName.includes("daily_update_large_icon")
      );
      largeIconFileExists.forEach((fileName) => {
        let path = `${process.cwd()}/public/notification/${fileName}`;
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      });
    } catch (e) {
      logger.error("Error in reading files " + e);
    }

    if (bigPicture) {
      var base64Data = bigPicture.split(";base64,").pop();
      let pictureExtension = bigPicture.substring(
        "data:image/".length,
        bigPicture.indexOf(";base64")
      );
      let pictureName = `daily_update_big_picture.${pictureExtension}`;
      bigPicturePath = `public/notification/${pictureName}`;
      try {
        await writeFile(bigPicturePath, base64Data, {
          encoding: "base64",
        });
        bigPictureUrl = `${process.env.BACKEND_URL}/${bigPicturePath}`;
      } catch (e) {
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message:
            "Error occured while uploading big picture. Please try again later!",
        });
      }
    }

    if (largeIcon) {
      var base64Data = largeIcon.split(";base64,").pop();
      let pictureExtension = largeIcon.substring(
        "data:image/".length,
        largeIcon.indexOf(";base64")
      );
      let pictureName = `daily_update_large_icon.${pictureExtension}`;
      largeIconPath = `public/notification/${pictureName}`;
      try {
        await writeFile(largeIconPath, base64Data, {
          encoding: "base64",
        });
        largeIconUrl = `${process.env.BACKEND_URL}/${largeIconPath}`;
      } catch (e) {
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message:
            "Error occured while uploading big picture. Please try again later!",
        });
      }
    }

    let collapseId = "daily-update";
    let filters = [];
    users.forEach((uid, index) => {
      if (uid) {
        let filter = {
          field: "tag",
          key: "uid",
          relation: "=",
          value: uid,
        };
        filters.push(filter);
        if (users.length !== index + 1 && users[index + 1]) {
          let filterOperator = {
            operator: "OR",
          };
          filters.push(filterOperator);
        }
      }
    });
    try {
      client
        .createNotification({
          name: "Daily Update",
          headings: {
            en: title,
          },
          priority: 7,
          android_accent_color: "5756d5",
          ios_sound: "notification_primary.wav",
          ios_attachments: {
            picture: bigPictureUrl,
          },
          content_available: true,
          big_picture: bigPictureUrl,
          android_channel_id: process.env.ONE_SIGNAL_DAILY_UPDATES_CHANNEL_ID,
          large_icon: largeIconUrl,
          contents: {
            en: body,
          },
          collapse_id: collapseId,
          buttons: [],
          filters: filters,
        })
        .then((response) => {
          setTimeout(() => {
            client
              .viewNotification(response.body.id)
              .then((d) => {
                let stats = d.body.platform_delivery_stats;
                let androidSuccessCount = 0;
                let androidFailureCount = 0;
                let androidErroredCount = 0;
                let iosSuccessCount = 0;
                let iosFailureCount = 0;
                let iosErroredCount = 0;

                if (stats && stats.android) {
                  androidSuccessCount = stats.android.successful;
                  androidFailureCount = stats.android.failed;
                  androidErroredCount = stats.android.errored;
                }
                if (stats && stats.ios) {
                  iosSuccessCount = stats.ios.successful;
                  iosFailureCount = stats.ios.failed;
                  iosErroredCount = stats.ios.errored;
                }
                return sendResponse(res, httpCodes.OK, {
                  message: `Android (Success/Failure/Errored) - ${androidSuccessCount}/${androidFailureCount}/${androidErroredCount} - IOS (Success/Failure/Errored) - ${iosSuccessCount}/${iosFailureCount}/${iosErroredCount} `,
                });
              })
              .catch((err) => {
                logger.info(
                  "Error in getting the view notification data " +
                    JSON.stringify(err)
                );
                return sendResponse(res, httpCodes.OK, {
                  message: `Error in getting view notification data ${JSON.stringify(
                    err
                  )}`,
                });
              });
          }, 3000);

          logger.info(JSON.stringify(res.body) + " DAILY UPDATE");
        });
    } catch (err) {
      if (err instanceof OneSignal.HTTPError) {
        logger.error(err.body);
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: `Error in sending notifications ${JSON.stringify(err.body)}`,
        });
      } else {
        logger.error("Error in enabling Daily Update Notification");
        logger.error(JSON.stringify(err));
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: `Error in sending notifications ${JSON.stringify(err)}`,
        });
      }
    }
  },

  async getActiveDevicesList(req, res) {
    let allDevices = (await client.viewDevices()).body.players;
    let activeDevices = allDevices.filter((d) => !d.invalid_identifier);

    let users = await Users.find({})
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
      activeDevices: activeDevices,
      users: users,
    });
  },
};
