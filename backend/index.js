const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use("/public", express.static(__dirname + "/public"));

process.on("uncaughtException", (error, promise) => {
  console.log("----- uncaught exception -----");
  console.log(error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("----- Reason -----");
  console.log(reason);
});

const http = require("http").Server(app);

http.listen(process.env.PORT || 8080, () => {
  console.log(`server started on port number ${process.env.PORT}`);
});

const crons = require("./crons");

var firebaseadmin = require("firebase-admin");
var serviceAccount = require("./expenses-manager.json");

firebaseadmin.initializeApp({
  credential: firebaseadmin.credential.cert(serviceAccount),
  databaseURL: "https://expenses-manager-9b9e2-default-rtdb.firebaseio.com/",
  storageBucket: "expenses-manager-9b9e2.appspot.com",
});

crons.cron();
