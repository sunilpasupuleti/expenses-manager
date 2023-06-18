require("dotenv").config({ path: __dirname + `/config/.env` });
const express = require("express");
const cors = require("cors");
const { getFirestore } = require("firebase-admin/firestore");
const moment = require("moment");
const logger = require("./middleware/logger/logger");
const connectDB = require("./config/db");
const morgan = require("morgan");
const app = express();
const fs = require("fs");
const rfs = require("rotating-file-stream");
const path = require("path");
const schedule = require("node-schedule");
const Users = require("./models/Users");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");

const {
  sendDailyReminderNotification,
  sendDailyBackupNotification,
} = require("./helpers/notificationHelpers");

/**
 * Morgon
 */
let apiLogsPath = __dirname + "/logs/api.log";
if (!fs.existsSync(apiLogsPath)) {
  fs.mkdirSync(path.join(__dirname, "logs"));
  fs.writeFileSync(apiLogsPath, "");
}
// Create rotating write stream
var accessLogStream = rfs.createStream("api.log", {
  interval: "1d",
  path: path.join(process.env.LOGPATH),
});

app.use(morgan("dev", {}));

app.use(morgan("combined", { stream: accessLogStream }));

/**
 * Connect to database
 */
connectDB();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN_URL.split(","),
    credentials: true,
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Content-Type",
      "Authorization",
      "x-csrf-token",
    ],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

/**
 * Serve Static files
 */

let debugLogsPath = path.join(
  __dirname + `/logs/debug-${moment().format("MM-DD-YYYY")}.log`
);
let errorLogsPath = path.join(
  __dirname + `/logs/error-${moment().format("MM-DD-YYYY")}.log`
);

app.use("/public", express.static(__dirname + "/public"));
app.use("/logs", express.static(__dirname + "/logs"));
app.use("/logs/server", express.static(debugLogsPath));
app.use("/logs/error", express.static(errorLogsPath));

/**
 * Routes
 */

app.use("/user", require("./routes/userRoutes"));
app.use("/notification", require("./routes/notificationRoutes"));
app.use("/backup", require("./routes/backupRoutes"));
app.use("/admin", require("./routes/adminRoutes"));

/**
 * Error handling
 */
process.on("uncaughtException", (error, promise) => {
  logger.error("----- uncaught exception  -----");
  logger.error(error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("----- Reason -----");
  logger.error(reason);
});

process.on("SIGINT", function () {
  schedule.gracefulShutdown().then(() => process.exit(0));
});
/**
 * Create Server
 */

const server = require("http").Server(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket"],
    credentials: true,
  },
  allowEIO3: true,
});

require("./sockets/socket")(io);

server.listen(process.env.PORT || 8080, async () => {
  logger.info(`server started on port number ${process.env.PORT}`);

  // In case if server restarts reschedule all the jobs with which user have dialy reminder and abckup enabled

  let jobs = schedule.scheduledJobs;

  let users = await Users.find().populate("backups");

  function activateNotifications() {
    users.forEach((d) => {
      let userData = d;
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
        rule.tz = "Asia/Calcutta";

        rule.dayOfWeek = new schedule.Range(0, 6);
        let jobId = `${userData.uid}-daily-reminder`;
        logger.info(
          `Enabling daily reminder for ${userData.displayName} at time - ${hr}:${min}`
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
        let hour = 00;
        let minute = 01;
        rule.hour = hour;
        rule.tz = "Asia/Calcutta";

        rule.minute = minute;
        rule.dayOfWeek = new schedule.Range(0, 6);
        let jobId = `${userData.uid}-daily-backup`;
        logger.info(`Enabling daily backup for ${userData.displayName} `);

        logger.info("-----------------------------------");
        schedule.scheduleJob(jobId, rule, function () {
          sendDailyBackupNotification(userData);
        });
      }
    });
  }

  // activateNotifications();
});

/**
 * Firebase config
 */
const { initializeApp, cert } = require("firebase-admin/app");
var serviceAccount = require("./config/expensesmanager.json");

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
