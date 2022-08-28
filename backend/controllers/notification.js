const httpstatus = require("http-status-codes");
const firebaseAdmin = require("firebase-admin");
const moment = require("moment");
const dotenv = require("dotenv");
const schedule = require("node-schedule");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

const fs = require("fs");

dotenv.config();

const sendDailyReminderNotification = async (data) => {
  console.log("sending daily reminder notification to  - " + data.displayName);
  console.log("-----------------------------------");
  let token = data.fcmToken;
  let payload = {
    data: { type: "expenses-daily-reminder", uid: data.uid },
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
};

module.exports = {
  async updateDailyReminder(req, res) {
    const { uid, enabled, time, fcmToken, update } = req.body;
    if (!uid || !enabled || !time || !fcmToken) {
      res.status(httpstatus.CONFLICT).json({ message: "All fields required" });
      return;
    }

    getFirestore()
      .collection(uid)
      .doc("user-data")
      .get()
      .then((result) => {
        let data = result.data();
        console.log(enabled, moment(time).format("HH:mm"));

        let jobs = schedule.scheduledJobs;
        let jobsLength = Object.keys(jobs).length;

        let alreadyReminderSet =
          data.dailyReminder && data.dailyReminder.enabled;

        function scheduleFunction() {
          let formatedTime = moment(time).format("HH:mm");
          let hr = moment(time).format("HH");
          let min = moment(time).format("mm");
          var rule = new schedule.RecurrenceRule();
          // rule.minute = new schedule.Range(0, 59, 1); //for every one minute
          rule.hour = hr;
          rule.minute = min;
          rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6, 7];
          let jobId = `${uid}-daily-reminder`;
          getFirestore()
            .collection(uid)
            .doc("user-data")
            .update({
              dailyReminder: {
                enabled: true,
                time: formatedTime,
              },
              fcmToken: fcmToken,
            })
            .then(() => {
              getFirestore()
                .collection(uid)
                .doc("user-data")
                .get()
                .then((response) => {
                  let returnData = response.data();
                  console.log("enabling daily reminder");
                  schedule.scheduleJob(jobId, rule, function () {
                    sendDailyReminderNotification(data);
                  });
                  return res.status(httpstatus.OK).json({
                    message: "Enabled daily reminder.",
                    userDetails: returnData,
                  });
                })
                .catch((err) => {
                  console.log("err in updating the data", err);
                  res.status(httpstatus.CONFLICT).json({
                    message: "Error occured in enabling daily reminder",
                  });
                  return;
                });
            })
            .catch((err) => {
              console.log("err in updating the data", err);
              res.status(httpstatus.CONFLICT).json({
                message: "Error occured in enabling daily reminder",
              });
              return;
            });
        }
        if (!alreadyReminderSet || jobsLength === 0) {
          scheduleFunction();
        }

        if (update && jobsLength > 0) {
          let jobs = schedule.scheduledJobs;
          Object.keys(jobs).map((key) => {
            let jobId = `${uid}-daily-reminder`;
            if (key === jobId) {
              let jobData = jobs[key];
              jobData.cancel();
              console.log("cancelled the previous job");
              scheduleFunction();
            }
          });
        }
      })
      .catch((err) => {
        res
          .status(httpstatus.CONFLICT)
          .json({ message: "Error occured in enabling daily reminder" });
        console.log("error occured", err);
        return;
      });
  },
};
