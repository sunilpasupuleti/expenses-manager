const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

const schedule = require("node-schedule");
const notification = require("./routes/notification-routes");
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use("/public", express.static(__dirname + "/public"));

app.use("/notification", notification);

process.on("uncaughtException", (error, promise) => {
  console.log("----- uncaught exception -----");
  console.log(error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("----- Reason -----");
  console.log(reason);
});

process.on("SIGINT", function () {
  console.log("Server is shutting down");
  schedule.gracefulShutdown().then(() => process.exit(0));
});

const http = require("http").Server(app);

http.listen(process.env.PORT || 8080, () => {
  console.log(`server started on port number ${process.env.PORT}`);
});

const { initializeApp, cert } = require("firebase-admin/app");
var serviceAccount = require("./expensesmanager.json");

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
