const {
  sendResponse,
  httpCodes,
  getFirebaseAccessUrl,
} = require("../../../helpers/utility");
const logger = require("../../../middleware/logger/logger");
const OneSignal = require("onesignal-node");
const { storage, database } = require("firebase-admin");
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_API_KEY
);
const _ = require("lodash");
const axios = require("axios");
const zlib = require("zlib");
const Papa = require("papaparse");
const moment = require("moment");

function base64ToBuffer(base64String) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  return buffer;
}

module.exports = {
  async sendDailyUpdateNotificationsToUsers(req, res) {
    logger.info("sending daily update notifications to users  - ");

    let { title, body, users, bigPicture, largeIcon } = req.body;
    let bigPictureUrl = null;
    let bigPicturePath = null;

    let largeIconUrl = getFirebaseAccessUrl("notification/mike.png");
    let largeIconPath = null;

    // delete old uploaded daily update files from dashboard
    try {
      let [files] = await storage().bucket().getFiles({
        prefix: "notification",
      });
      for (const file of files) {
        const fileNameWithoutExtension = file.name
          .split(".")
          .slice(0, -1)
          .join(".");
        //  big picture images
        if (fileNameWithoutExtension.includes("daily_update_big_picture")) {
          await file.delete();
        }
        // large icon images
        if (fileNameWithoutExtension.includes("daily_update_large_icon")) {
          await file.delete();
        }
      }
    } catch (e) {
      logger.error("Error in reading files " + e);
    }

    if (bigPicture) {
      let pictureExtension = bigPicture.substring(
        "data:image/".length,
        bigPicture.indexOf(";base64")
      );
      let pictureName = `daily_update_big_picture.${pictureExtension}`;
      bigPicturePath = `notification/${pictureName}`;

      try {
        const buffer = base64ToBuffer(bigPicture);
        const file = storage().bucket().file(bigPicturePath);
        await file.save(buffer, {
          contentType: `image/${pictureExtension}`,
        });
        bigPictureUrl = getFirebaseAccessUrl(bigPicturePath);
      } catch (e) {
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message:
            "Error occured while uploading big picture. Please try again later!",
        });
      }
    }

    if (largeIcon) {
      let pictureExtension = largeIcon.substring(
        "data:image/".length,
        largeIcon.indexOf(";base64")
      );
      let pictureName = `daily_update_large_icon.${pictureExtension}`;
      largeIconPath = `notification/${pictureName}`;
      try {
        const buffer = base64ToBuffer(largeIcon);
        const file = storage().bucket().file(largeIconPath);
        await file.save(buffer, {
          contentType: `image/${pictureExtension}`,
        });
        largeIconUrl = getFirebaseAccessUrl(largeIconPath);
      } catch (e) {
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message:
            "Error occured while uploading big picture. Please try again later!",
        });
      }
    }

    let collapseId = "daily-update";

    let playerIds = users;

    try {
      client
        .createNotification({
          name: "Daily Update",
          headings: {
            en: title,
          },
          priority: 7,
          include_player_ids: playerIds,
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
    try {
      const csvResponse = await client.exportCSV({
        segment_name: "Subscribed Users",
      });
      const csvUrl = csvResponse?.body?.csv_file_url;

      if (!csvUrl) {
        throw "There was a problem in downloading the CSV file";
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await axios({
        url: csvUrl,
        method: "GET",
        responseType: "arraybuffer",
      });

      const decompressed = zlib.gunzipSync(response.data);
      const csvString = decompressed.toString();

      const { data } = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
      });

      const enrichedUsers = await Promise.all(
        _.compact(
          _.map(data, async (entry) => {
            try {
              const tags = entry.tags ? JSON.parse(entry.tags) : {};
              entry.tags = tags;
              const uid = tags?.uid;

              let userData = null;
              // Fetch user details from Firebase
              if (uid) {
                const userSnapshot = await database()
                  .ref(`users/${uid}`)
                  .once("value");
                const user = userSnapshot.val();

                if (user) {
                  userData = {
                    displayName: user.displayName || "",
                    email: user.email || "",
                    phoneNumber: user.phoneNumber || "",
                    photoURL: user.photoURL || "",
                    providerId: user.providerId || "",
                    uid: user.uid,
                    platform: user.platform || "",
                  };
                }
              }
              if (entry.last_active) {
                entry.last_active = moment
                  .utc(entry.last_active, "YYYY-MM-DD HH:mm")
                  .local() // Automatically converts to local timezone
                  .format("YYYY-MM-DD HH:mm:ss"); // Format properly
              }

              const structuredObj = {
                ...entry,
                userData,
              };

              return structuredObj;
            } catch (error) {
              console.error("Error processing entry:", error);
              return null;
            }
          })
        )
      );
      const sortedUsers = _.orderBy(enrichedUsers, ["last_active"], ["desc"]);
      return sendResponse(res, httpCodes.OK, {
        message: "Active users list",
        activeDevices: sortedUsers,
      });
    } catch (e) {
      console.log(e);
      logger.error(e);
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: e.toString(),
      });
    }
  },
};
