const { getMessaging } = require("firebase-admin/messaging");
const logger = require("../middleware/logger/logger");

module.exports = {
  async sendDailyReminderNotification(data) {
    logger.info(
      "sending daily reminder notification to  - " + data.displayName
    );
    let token = data.fcmToken;
    let payload = {
      data: { type: "daily-reminder", uid: data.uid },
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
    let payload = {
      data: { type: "daily-backup", uid: data.uid },
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
