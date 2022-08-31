const express = require("express");
const cors = require("cors");
const { getFirestore } = require("firebase-admin/firestore");
const dotenv = require("dotenv");
const moment = require("moment");
const logger = require("./logger");

dotenv.config();
const app = express();

const schedule = require("node-schedule");
const notification = require("./routes/notification-routes");

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use("/public", express.static(__dirname + "/public"));
app.use("/logs", express.static(__dirname + "/logs"));
app.use(
  "/logs/server",
  express.static(__dirname + `/logs/server_${moment().format("MMM_YYYY")}.log`)
);

app.use(
  "/logs/error",
  express.static(__dirname + `/logs/error_${moment().format("MMM_YYYY")}.log`)
);

app.use("/notification", notification);

process.on("uncaughtException", (error, promise) => {
  logger.error("----- uncaught exception -----");
  logger.error(error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("----- Reason -----");
  logger.error(reason);
});

process.on("SIGINT", function () {
  logger.info("Server is shutting down");
  schedule.gracefulShutdown().then(() => process.exit(0));
});

const http = require("http").Server(app);

http.listen(process.env.PORT || 8080, () => {
  logger.info(`server started on port number ${process.env.PORT}`);
});

const { initializeApp, cert } = require("firebase-admin/app");
var serviceAccount = require("./expensesmanager.json");
const {
  sendDailyReminderNotification,
  sendDailyBackupNotification,
} = require("./helpers/notificationHelpers");

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// in case if server restarts reschedule all the jobs with which user have dialy reminder and abckup enabled

let jobs = schedule.scheduledJobs;

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

              let jobDailyReminderId = `${userData.uid}-daily-reminder`;
              let jobKeyDailyReminderFound = Object.keys(jobs).filter(
                (key) => key === jobDailyReminderId
              )[0];
              let jobFoundDailyReminder = jobs[jobKeyDailyReminderFound];

              let jobDailyBackupId = `${userData.uid}-daily-backup`;
              let jobKeyDailyBackupFound = Object.keys(jobs).filter(
                (key) => key === jobDailyBackupId
              )[0];
              let jobFoundDailyBackup = jobs[jobKeyDailyBackupFound];
              if (
                !jobFoundDailyReminder &&
                userData.dailyReminder &&
                userData.active &&
                userData.dailyReminder.enabled &&
                userData.dailyReminder.time &&
                userData.fcmToken
              ) {
                let dailyReminder = userData.dailyReminder;
                let hr = dailyReminder.time.split(":")[0];
                let min = dailyReminder.time.split(":")[1];
                var rule = new schedule.RecurrenceRule();
                rule.hour = hr;
                rule.minute = min;
                rule.dayOfWeek = new schedule.Range(0, 6);
                let jobId = `${userData.uid}-daily-reminder`;
                logger.info(
                  `Enabling daily reminder for ${userData.displayName} at time - ${dailyReminder.time}`
                );

                schedule.scheduleJob(jobId, rule, function () {
                  sendDailyReminderNotification(userData);
                });
              }

              if (
                !jobFoundDailyBackup &&
                userData.dailyBackup &&
                userData.active &&
                userData.fcmToken
              ) {
                var rule = new schedule.RecurrenceRule();
                // rule.minute = new schedule.Range(0, 59, 1); //for every one minute
                rule.hour = 00;
                rule.minute = 01;
                rule.dayOfWeek = new schedule.Range(0, 6);
                let jobId = `${userData.uid}-daily-backup`;
                logger.info(
                  `Enabling daily backup for ${userData.displayName} `
                );

                logger.info("-----------------------------------");
                schedule.scheduleJob(jobId, rule, function () {
                  sendDailyBackupNotification(userData);
                });
              }
            }
          });
        });
    });
  });
