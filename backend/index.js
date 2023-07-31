require("dotenv").config({ path: __dirname + `/config/.env` });
const express = require("express");
const cors = require("cors");
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
let logsPath = __dirname + "/logs";
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath);
  fs.writeFileSync(logsPath, "");
}

let apiLogsPath = __dirname + "/logs/api.log";
if (!fs.existsSync(apiLogsPath)) {
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
      "Access-Control-Allow-Headers",
      "Content-Type",
      "Authorization",
      "x-csrf-token",
      "Accept",
      "form-data",
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

let productionMode = true;

const https_options = {
  ca: fs.readFileSync("./config/ssl/ca_bundle.crt"),
  key: fs.readFileSync("./config/ssl/private.key"),
  cert: fs.readFileSync("./config/ssl/certificate.crt"),
};

const httpServer = require("http").Server(app);

const httpsServer = require("https").createServer(https_options, app);

let server = productionMode ? httpsServer : httpServer;

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
  logger.info(`server started on port number ${process.env.PORT} }`);

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

  // In case if server restarts reschedule all the jobs with which user have dialy reminder and abckup enabled

  let jobs = schedule.scheduledJobs;

  let users = await Users.find().populate("backups");
  function activateNotifications() {
    users.forEach((d) => {
      let userData = d;
      let timeZone = userData.timeZone ? userData.timeZone : "Asia/Kolkata";
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

      let display =
        userData.displayName || userData.email || userData.phoneNumber;
      let dailyReminder = userData.dailyReminder;

      if (dailyReminder && dailyReminder.enabled) {
        let hr = dailyReminder.time.split(":")[0];
        let min = dailyReminder.time.split(":")[1];
        var rule = new schedule.RecurrenceRule();
        rule.hour = hr;
        rule.minute = min;
        rule.tz = timeZone;

        rule.dayOfWeek = new schedule.Range(0, 6);
        let jobId = `${userData.uid}-daily-reminder`;
        logger.info(
          `Enabling daily reminder for ${display} at time - ${hr}:${min} - ${timeZone}`
        );

        schedule.scheduleJob(jobId, rule, function () {
          sendDailyReminderNotification(userData);
        });
      }

      if (!jobFoundDailyBackup && userData.dailyBackup) {
        var rule = new schedule.RecurrenceRule();
        // rule.minute = new schedule.Range(0, 59, 1); //for every one minute
        let hour = 00;
        let minute = 01;
        rule.hour = hour;
        rule.tz = timeZone;

        rule.minute = minute;
        rule.dayOfWeek = new schedule.Range(0, 6);
        let jobId = `${userData.uid}-daily-backup`;
        logger.info(`Enabling daily backup for ${display} - ${timeZone}`);

        logger.info("-----------------------------------");
        schedule.scheduleJob(jobId, rule, function () {
          sendDailyBackupNotification(userData);
        });
      }
    });
  }

  if (productionMode) {
    activateNotifications();
  }
});
