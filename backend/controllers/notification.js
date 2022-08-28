const httpstatus = require("http-status-codes");
const firebaseAdmin = require("firebase-admin");
const moment = require("moment");
const dotenv = require("dotenv");
const schedule = require("node-schedule");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

dotenv.config();

const sendDailyReminderNotification = async (data) => {
  console.log("sending daily reminder notification to  - " + data.displayName);
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
};

const sendDailyBackupNotification = async (data) => {
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
};

module.exports = {
  async updateDailyReminder(req, res) {
    const { time, fcmToken, enable, update, disable } = req.body;
    let { uid } = req.user;
    if (!uid || !time || !fcmToken) {
      res.status(httpstatus.CONFLICT).json({ message: "All fields required" });
      return;
    }
    getFirestore()
      .collection(uid)
      .doc("user-data")
      .get()
      .then((result) => {
        let data = result.data();

        let jobs = schedule.scheduledJobs;

        function scheduleFunction() {
          let formatedTime = moment(time).format("HH:mm");
          let hr = moment(time).format("HH");
          let min = moment(time).format("mm");
          var rule = new schedule.RecurrenceRule();
          // rule.minute = new schedule.Range(0, 59, 1); //for every one minute
          rule.hour = hr;
          rule.minute = min;
          rule.dayOfWeek = new schedule.Range(0, 6);
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
                  console.log(
                    `Enabling daily reminder for ${
                      data.displayName
                    } at time - ${moment(time).format("HH:mm")}`
                  );
                  console.log("-----------------------------------");
                  schedule.scheduleJob(jobId, rule, function () {
                    sendDailyReminderNotification(returnData);
                  });
                  return res.status(httpstatus.OK).json({
                    message: "Daily Reminder enabled.",
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

        if (enable) {
          scheduleFunction();
        } else if (update) {
          let jobId = `${uid}-daily-reminder`;
          let jobKeyFound = Object.keys(jobs).filter((key) => key === jobId)[0];
          let jobFound = jobs[jobKeyFound];
          console.log(
            "Updated time in daily reminder. Cancelling the previous one and scheduling new reminder"
          );
          console.log("-----------------------------------");

          if (jobFound) {
            jobFound.cancel();
            scheduleFunction();
          } else {
            scheduleFunction();
          }
        } else if (disable) {
          let jobId = `${uid}-daily-reminder`;
          let jobs = schedule.scheduledJobs;
          let jobKeyFound = Object.keys(jobs).filter((key) => key === jobId)[0];
          let jobFound = jobs[jobKeyFound];

          getFirestore()
            .collection(uid)
            .doc("user-data")
            .update({
              dailyReminder: {
                enabled: false,
              },
              fcmToken: null,
            })
            .then(() => {
              console.log(`Daily reminder disabled for - ${uid} `);
              console.log("-----------------------------------");
              if (jobFound) {
                jobFound.cancel();
              }
              return res.status(httpstatus.OK).json({
                message: "Daily Reminder Disabled.",
              });
            })
            .catch((err) => {
              res.status(httpstatus.CONFLICT).json({
                message: "Error occured in disabling daily reminder",
              });
              console.log("error occured", err);
              return;
            });
        } else {
          res.status(httpstatus.OK).json({ message: "Updated Successfully" });
          console.log("No if block conditions found", err);
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

  async updateDailyBackUp(req, res) {
    const { fcmToken, enabled } = req.body;
    let { uid } = req.user;
    if (!uid || typeof enabled !== "boolean" || !fcmToken) {
      res.status(httpstatus.CONFLICT).json({ message: "All fields required" });
      return;
    }

    getFirestore()
      .collection(uid)
      .doc("user-data")
      .get()
      .then((result) => {
        let data = result.data();
        let jobs = schedule.scheduledJobs;
        let jobsLength = Object.keys(jobs).length;

        function scheduleFunction() {
          var rule = new schedule.RecurrenceRule();
          // rule.minute = new schedule.Range(0, 59, 1); //for every one minute
          rule.hour = 00;
          rule.minute = 01;
          rule.dayOfWeek = new schedule.Range(0, 6);
          console.log(new schedule.Range(0, 6));
          let jobId = `${uid}-daily-backup`;
          getFirestore()
            .collection(uid)
            .doc("user-data")
            .update({
              dailyBackup: true,
              fcmToken: fcmToken,
            })
            .then(() => {
              getFirestore()
                .collection(uid)
                .doc("user-data")
                .get()
                .then((response) => {
                  let returnData = response.data();
                  console.log(`Enabling daily backup for ${data.displayName} `);

                  console.log("-----------------------------------");
                  schedule.scheduleJob(jobId, rule, function () {
                    sendDailyBackupNotification(returnData);
                  });
                  return res.status(httpstatus.OK).json({
                    message: "Daily Backup enabled.",
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

        if (enabled) {
          if (jobsLength > 0) {
            let jobs = schedule.scheduledJobs;
            Object.keys(jobs).map((key) => {
              let jobId = `${uid}-daily-backup`;
              if (key === jobId) {
                let jobData = jobs[key];
                jobData.cancel();
                scheduleFunction();
              }
            });
          } else {
            scheduleFunction();
          }
        } else if (!enabled) {
          let jobId = `${uid}-daily-backup`;
          let jobs = schedule.scheduledJobs;
          let jobKeyFound = Object.keys(jobs).filter((key) => key === jobId)[0];
          let jobFound = jobs[jobKeyFound];
          getFirestore()
            .collection(uid)
            .doc("user-data")
            .update({
              dailyBackup: false,
              fcmToken: null,
            })
            .then(() => {
              console.log(`Daily Backup disabled for - ${uid} `);
              console.log("-----------------------------------");
              if (jobFound) {
                jobFound.cancel();
              }
              return res.status(httpstatus.OK).json({
                message: "Daily Backup Disabled.",
              });
            })
            .catch((err) => {
              res.status(httpstatus.CONFLICT).json({
                message: "Error occured in disabling daily backup",
              });
              console.log("error occured", err);
              return;
            });
        }
      })
      .catch((err) => {
        res
          .status(httpstatus.CONFLICT)
          .json({ message: "Error occured in enabling daily backup" });
        console.log("error occured", err);
        return;
      });
  },
};
