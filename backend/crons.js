const dotenv = require("dotenv");
const crons = require("node-cron");
const { getFirestore } = require("firebase-admin/firestore");

const fs = require("fs");
const moment = require("moment");

dotenv.config();

module.exports = {
  async cron() {
    scheduleDailyBackUpNotification();
    scheduleDailyReminderNotification();
  },
};

async function scheduleDailyBackUpNotification(data) {
  crons.schedule(
    "1 0 * * *", // daily at 12 am
    async () => {
      getFirestore()
        .listCollections()
        .then((snapshots) => {
          snapshots.forEach(async (snaps) => {
            let collectionId = snaps["_queryOptions"].collectionId;

            getFirestore()
              .collection(collectionId)
              .get()
              .then((data) => {
                let docs = data.docs;
                docs.forEach((d) => {
                  if (d.id === "user-data") {
                    let userData = d.data();
                    if (
                      userData.dailyBackup &&
                      userData.active &&
                      userData.fcmToken
                    ) {
                      sendDailyBackupNotification(userData);
                    }
                  }
                });
              });
          });
        });
    },
    {
      scheduled: true,
    }
  );
}

async function scheduleDailyReminderNotification(data) {
  crons.schedule(
    // "*/20 * * * * *",
    "0 21 * * *", // daily at 9 pm
    async () => {
      getFirestore()
        .listCollections()
        .then((snapshots) => {
          snapshots.forEach(async (snaps) => {
            let collectionId = snaps["_queryOptions"].collectionId;
            getFirestore()
              .collection(collectionId)
              .get()
              .then((data) => {
                let docs = data.docs;
                docs.forEach((d) => {
                  if (d.id === "user-data") {
                    let userData = d.data();
                    if (
                      userData.dailyReminder &&
                      userData.active &&
                      userData.fcmToken
                    ) {
                      sendDailyReminderNotification(userData);
                    }
                  }
                });
              });
          });
        });
    },
    {
      scheduled: true,
    }
  );
}

const sendDailyBackupNotification = async (data) => {
  console.log("sending daily backup notification to - " + data.displayName);
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
};
