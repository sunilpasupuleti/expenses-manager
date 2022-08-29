const httpstatus = require("http-status-codes");
const firebaseAdmin = require("firebase-admin");
const moment = require("moment");
const dotenv = require("dotenv");
const schedule = require("node-schedule");
const { getFirestore } = require("firebase-admin/firestore");
const {
  sendDailyReminderNotification,
  sendDailyBackupNotification,
} = require("../helpers/notificationHelpers");
const logger = require("../logger");

dotenv.config();

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
                  logger.info(
                    `Enabling daily reminder for ${
                      data.displayName
                    } at time - ${moment(time).format("HH:mm")}`
                  );
                  logger.info("-----------------------------------");
                  schedule.scheduleJob(jobId, rule, function () {
                    sendDailyReminderNotification(returnData);
                  });
                  return res.status(httpstatus.OK).json({
                    message: "Daily Reminder enabled.",
                    userDetails: returnData,
                  });
                })
                .catch((err) => {
                  logger.error("err in updating the data");
                  logger.error(JSON.stringify(err));
                  res.status(httpstatus.CONFLICT).json({
                    message: "Error occured in enabling daily reminder",
                  });
                  return;
                });
            })
            .catch((err) => {
              console.error("err in updating the data", err);
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
          logger.info(
            "Updated time in daily reminder. Cancelling the previous one and scheduling new reminder"
          );
          logger.info("-----------------------------------");

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
            })
            .then(() => {
              logger.info(`Daily reminder disabled for - ${uid} `);
              logger.info("-----------------------------------");
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
              logger.error("error occured ");
              logger.error(JSON.stringify(err));
              return;
            });
        } else {
          res.status(httpstatus.OK).json({ message: "Updated Successfully" });
          logger.error("No if block conditions found");
        }
      })
      .catch((err) => {
        res
          .status(httpstatus.CONFLICT)
          .json({ message: "Error occured in enabling daily reminder" });
        logger.error("error occured");
        logger.error(JSON.stringify(err));
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
          rule.hour = 00;
          rule.minute = 01;
          rule.dayOfWeek = new schedule.Range(0, 6);
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
                  logger.info(`Enabling daily backup for ${data.displayName} `);

                  logger.info("-----------------------------------");
                  schedule.scheduleJob(jobId, rule, function () {
                    sendDailyBackupNotification(returnData);
                  });
                  return res.status(httpstatus.OK).json({
                    message: "Daily Backup enabled.",
                    userDetails: returnData,
                  });
                })
                .catch((err) => {
                  logger.error("err in updating the data");
                  logger.error(JSON.stringify(err));
                  res.status(httpstatus.CONFLICT).json({
                    message: "Error occured in enabling daily reminder",
                  });
                  return;
                });
            })
            .catch((err) => {
              logger.error("err in updating the data");
              logger.error(JSON.stringify(err));

              res.status(httpstatus.CONFLICT).json({
                message: "Error occured in enabling daily reminder",
              });
              return;
            });
        }

        if (enabled) {
          let jobDailyBackupId = `${uid}-daily-backup`;
          let jobKeyDailyBackupFound = Object.keys(jobs).filter(
            (key) => key === jobDailyBackupId
          )[0];
          let jobFoundDailyBackup = jobs[jobKeyDailyBackupFound];
          if (jobFoundDailyBackup) {
            jobFoundDailyBackup.cancel();
            scheduleFunction();
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
            })
            .then(() => {
              if (jobFound) {
                logger.info("cancelling the  backup ");
                jobFound.cancel();
              }

              logger.info(`Daily Backup disabled for - ${uid} `);
              logger.info("-----------------------------------");

              return res.status(httpstatus.OK).json({
                message: "Daily Backup Disabled.",
              });
            })
            .catch((err) => {
              res.status(httpstatus.CONFLICT).json({
                message: "Error occured in disabling daily backup",
              });
              logger.error("error occured");
              logger.error(JSON.stringify(err));
              return;
            });
        }
      })
      .catch((err) => {
        res
          .status(httpstatus.CONFLICT)
          .json({ message: "Error occured in enabling daily backup" });
        logger.error("error occured");
        logger.error(JSON.stringify(err));
        return;
      });
  },

  // this route called during logout
  async destroyNotifications(req, res) {
    let { uid } = req.user;
    let jobs = schedule.scheduledJobs;
    if (!uid) {
      return res
        .status(httpstatus.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    let jobDailyReminderId = `${uid}-daily-reminder`;
    let jobKeyDailyReminderFound = Object.keys(jobs).filter(
      (key) => key === jobDailyReminderId
    )[0];
    let jobFoundDailyReminder = jobs[jobKeyDailyReminderFound];

    let jobDailyBackupId = `${uid}-daily-backup`;
    let jobKeyDailyBackupFound = Object.keys(jobs).filter(
      (key) => key === jobDailyBackupId
    )[0];
    let jobFoundDailyBackup = jobs[jobKeyDailyBackupFound];

    if (jobFoundDailyBackup) {
      logger.info("Destroying daily backup " + uid);
      jobFoundDailyBackup.cancel();
    }
    if (jobFoundDailyReminder) {
      logger.info("Destroying daily reminder " + uid);
      jobFoundDailyReminder.cancel();
    }

    logger.info("---------------------");
    return res
      .status(httpstatus.OK)
      .json({ message: "Destroyed daily reminder and daily backup" });
  },

  // this route called during login
  async enableNotifications(req, res) {
    let { uid } = req.user;
    if (!uid) {
      return res
        .status(httpstatus.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }
    let jobs = schedule.scheduledJobs;

    let jobDailyReminderId = `${uid}-daily-reminder`;
    let jobKeyDailyReminderFound = Object.keys(jobs).filter(
      (key) => key === jobDailyReminderId
    )[0];
    let jobFoundDailyReminder = jobs[jobKeyDailyReminderFound];

    let jobDailyBackupId = `${uid}-daily-backup`;
    let jobKeyDailyBackupFound = Object.keys(jobs).filter(
      (key) => key === jobDailyBackupId
    )[0];
    let jobFoundDailyBackup = jobs[jobKeyDailyBackupFound];

    getFirestore()
      .collection(uid)
      .doc("user-data")
      .get()
      .then((response) => {
        let returnData = response.data();
        let dailyReminder = returnData.dailyReminder;
        let dailyBackup = returnData.dailyBackup;
        if (
          returnData.active &&
          dailyReminder &&
          dailyReminder.enabled &&
          dailyReminder.time
        ) {
          let hr = dailyReminder.time.split(":")[0];
          let min = dailyReminder.time.split(":")[1];

          var rule = new schedule.RecurrenceRule();
          // rule.minute = new schedule.Range(0, 59, 1); //for every one minute
          rule.hour = hr;
          rule.minute = min;
          rule.dayOfWeek = new schedule.Range(0, 6);
          let jobId = `${uid}-daily-reminder`;

          if (jobFoundDailyReminder) {
            logger.info("canceling the previous daily reminder notification");
            jobFoundDailyReminder.cancel();
          }
          logger.info(
            `Enabling daily reminder for ${returnData.displayName} at time - ${dailyReminder.time}`
          );

          schedule.scheduleJob(jobId, rule, function () {
            sendDailyReminderNotification(returnData);
          });
        }

        if (dailyBackup && returnData.active) {
          var rule = new schedule.RecurrenceRule();
          // rule.minute = new schedule.Range(0, 59, 1); //for every one minute
          rule.hour = 00;
          rule.minute = 01;
          rule.dayOfWeek = new schedule.Range(0, 6);
          let jobId = `${uid}-daily-backup`;

          if (jobFoundDailyBackup) {
            logger.info("canceling the previous backup notification");
            jobFoundDailyBackup.cancel();
          }

          logger.info(`Enabling daily backup for ${returnData.displayName} `);

          schedule.scheduleJob(jobId, rule, function () {
            sendDailyBackupNotification(returnData);
          });
        }
        logger.info("-----------------------------------");

        return res
          .status(httpstatus.OK)
          .json({ message: "Enabled notifications successfully" });
      })
      .catch((err) => {
        logger.error("err in getting the data");
        logger.error(JSON.stringify(err));
        res.status(httpstatus.CONFLICT).json({
          message: "Error occured in enabling daily reminder",
        });
        return;
      });
  },
};
