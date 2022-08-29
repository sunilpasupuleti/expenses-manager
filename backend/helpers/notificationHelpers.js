const dotenv = require("dotenv");
const { getMessaging } = require("firebase-admin/messaging");

dotenv.config();

module.exports = {
  async sendDailyReminderNotification(data) {
    console.log(
      "sending daily reminder notification to  - " + data.displayName
    );
    console.log("-----------------------------------");
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
          console.log(
            error.code,
            error.message,
            "error in sending daily reminder notification"
          );
          console.log("------------------------");
        } else {
          console.log(r, "success");
          console.log("------------------------");
        }
      })
      .catch((err) => {
        console.log(err, " error in sending the daily reminder notification");
      });
  },

  async sendDailyBackupNotification(data) {
    console.log(data);
    console.log("sending daily backup notification to  - " + data.displayName);
    console.log("-----------------------------------");
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
          console.log(
            error.code,
            error.message,
            "error in sending daily backup notification"
          );
          console.log("------------------------");
        } else {
          console.log(r, "success");
          console.log("------------------------");
        }
      })
      .catch((err) => {
        console.log(err, " error in sending the daily backup notification");
      });
  },
};
