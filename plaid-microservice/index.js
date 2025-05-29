// require("dotenv").config({ path: `${__dirname}/config/.env` });

const express = require("express");
const cors = require("cors");
const moment = require("moment");
const logger = require("./middleware/logger/logger");
const morgan = require("morgan");
const app = express();
const fs = require("fs");
const rfs = require("rotating-file-stream");
const path = require("path");
const schedule = require("node-schedule");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { database, auth } = require("firebase-admin");
const _ = require("lodash");
const { getRedis } = require("./config/redisConfig");

/**
 * Morgon
 */
let logsPath = __dirname + "/logs";
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath);
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
app.use(
  express.json({
    limit: "100mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString(); // Save exact raw body string
    },
  })
);
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
app.use("/", require("./routes/index"));

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

const httpServer = require("http").Server(app);

let server = httpServer;

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
    transports: ["websocket"],
    credentials: true,
  },
  allowEIO3: true,
});
global.io = io;
require("./sockets/socket")(io);

server.listen(process.env.PORT || 8080, async () => {
  logger.info(`server started on port number ${process.env.PORT} }`);

  /**
   * Firebase config
   */
  const { initializeApp, cert } = require("firebase-admin/app");
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const serviceAccountJSON = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
  );

  initializeApp({
    credential: cert(serviceAccountJSON),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  /**
   * REDIS
   */
  const redis = await getRedis();
  global.redis = redis;
});
