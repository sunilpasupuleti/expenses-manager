const { getMessaging } = require("firebase-admin/messaging");
const logger = require("../middleware/logger/logger");

module.exports = {
  async sendDailyReminderNotification(data) {
    logger.info(
      "sending daily reminder notification to  - " + data.displayName
    );
    let token = data.fcmToken;
    let title = "Reminder 🔔";
    let body = `Have you recorded your  transactions.. 🤔?
  If not 😕 do it now.`;
    let payload = {
      data: { type: "daily-reminder", uid: data.uid, title, body },
      notification: {
        title: title,
        body: body,
      },
    };
    getMessaging()
      .sendToDevice(token, payload, { priority: "high" })
      .then((r) => {
        let error = null;
        if (r.results[0] && r.results[0].error) {
          error = r.results[0].error;
        }
        if (error) {
          logger.error(
            `error in sending daily reminder notification ${error.code} ${error.message}`
          );
        } else {
          logger.info("successfully sent daily reminder notification");
          logger.info(JSON.stringify(r));
        }
      })
      .catch((err) => {
        logger.error(" error in sending the daily reminder notification ");
        logger.error(JSON.stringify(err));
      });
  },

  async sendDailyBackupNotification(data) {
    logger.info("sending daily backup notification to  - " + data.displayName);
    let token = data.fcmToken;
    let title = "Back Up 🔄";
    let body = `Please wait while we are backing up your data......`;
    let backupSuccessTitle = "Back up successfull 🥰";
    let backupSuccessBody = "Your data backed up safely ❤️";

    let backupFailedTitle = "Sorry ! Back up failed 😥";
    let backupFailedBody =
      "In case of backup failure, do it manually in the app.";

    let payload = {
      data: {
        type: "daily-backup",
        uid: data.uid,
        title,
        body,
        backupSuccessBody,
        backupSuccessTitle,
        backupFailedBody,
        backupFailedTitle,
      },
      notification: {
        title: title,
        body: body,
      },
    };
    getMessaging()
      .sendToDevice(token, payload, { priority: "high" })
      .then((r) => {
        let error = null;
        if (r.results[0] && r.results[0].error) {
          error = r.results[0].error;
        }
        if (error) {
          logger.error(
            `error in sending daily backup notification ${error.code} ${error.message}`
          );
        } else {
          logger.info("successfully sent daily backup notification ");
          logger.info(JSON.stringify(r));
        }
      })
      .catch((err) => {
        logger.error(" error in sending the daily backup notification ");
        logger.error(JSON.stringify(err));
      });
  },
};
