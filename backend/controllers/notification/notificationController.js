const httpstatus = require("http-status-codes");
const moment = require("moment");
const schedule = require("node-schedule");

const {
  sendDailyReminderNotification,
  sendDailyBackupNotification,
} = require("../../helpers/notificationHelpers");
const Users = require("../../models/Users");
const { sendResponse, httpCodes } = require("../../helpers/utility");
const logger = require("../../middleware/logger/logger");

module.exports = {
  async updateDailyReminder(req, res) {
    const { time, fcmToken, enable, update, disable } = req.body;

    console.log(req.body);

    let { uid } = req.user;
    if (!uid || !time || !fcmToken) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "UID , TIME , FCM TOKEN all fields are required",
      });
    }

    Users.findOne({
      uid: uid,
    })
      .then(async (data) => {
        let userData = data;
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
          Users.findOneAndUpdate(
            {
              uid: uid,
            },
            {
              $set: {
                dailyReminder: {
                  enabled: true,
                  time: formatedTime,
                },
                fcmToken: fcmToken,
              },
            },
            {
              new: true,
            }
          )
            .then(async (response) => {
              let returnData = response;
              // get user data
              logger.info(
                `Enabling daily reminder for ${
                  userData.displayName
                } at time - ${moment(time).format("HH:mm")}`
              );
              logger.info("-----------------------------------");
              schedule.scheduleJob(jobId, rule, function () {
                sendDailyReminderNotification(returnData);
              });
              return sendResponse(res, httpCodes.OK, {
                message: "Daily Reminder updated.",
                user: returnData,
              });
            })
            .catch((err) => {
              console.error("err in updating the data", err);
              return sendResponse(res, httpCodes.BAD_REQUEST, {
                message: "Error occured in enabling daily reminder",
              });
            });
        }
        let jobs = schedule.scheduledJobs;

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

          Users.findOneAndUpdate(
            {
              uid: uid,
            },
            {
              $set: {
                dailyReminder: {
                  enabled: false,
                },
              },
            }
          )
            .then(() => {
              logger.info(`Daily reminder disabled for - ${uid} `);
              logger.info("-----------------------------------");
              if (jobFound) {
                jobFound.cancel();
              }
              return sendResponse(res, httpCodes.OK, {
                message: "Daily Reminder Disabled.",
              });
            })
            .catch((err) => {
              logger.error("Error in disabling daily reminder " + err);
              return sendResponse(res, httpCodes.BAD_REQUEST, {
                message: "Error occured in disabling daily reminder",
              });
            });
        } else {
          logger.error("No if block conditions found");
          return sendResponse(res, httpCodes.OK, {
            message: "Updated successfully",
          });
        }
      })
      .catch((err) => {
        logger.error("Error in  daily reminder " + err);
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: "Error occured in  daily reminder",
        });
      });
  },

  async updateDailyBackUp(req, res) {
    const { fcmToken, enabled } = req.body;

    let { uid } = req.user;
    if (!uid || typeof enabled !== "boolean" || !fcmToken) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "all fields are required",
      });
    }

    Users.findOne({
      uid: uid,
    })
      .then(async (result) => {
        let data = result;
        let jobs = schedule.scheduledJobs;
        let jobsLength = Object.keys(jobs).length;
        function scheduleFunction() {
          var rule = new schedule.RecurrenceRule();
          let hour = 00;
          let minute = 01;
          rule.hour = hour;
          rule.minute = minute;
          rule.dayOfWeek = new schedule.Range(0, 6);
          let jobId = `${uid}-daily-backup`;
          Users.findOneAndUpdate(
            {
              uid: uid,
            },
            {
              $set: {
                dailyBackup: true,
                fcmToken: fcmToken,
              },
            },
            {
              new: true,
            }
          )
            .then((response) => {
              let returnData = response;
              logger.info(
                `Enabling daily backup for ${data.displayName} at ${hour}:${minute}`
              );

              logger.info("-----------------------------------");
              schedule.scheduleJob(jobId, rule, function () {
                sendDailyBackupNotification(returnData);
              });
              return res.status(httpstatus.OK).json({
                message: "Daily Backup enabled.",
                user: returnData,
              });
            })
            .catch((err) => {
              logger.error(
                "error occured in daily backup updating data - " + err
              );
              return sendResponse(res, httpCodes.BAD_REQUEST, {
                message: "Error occured in enabling daily backup updating data",
              });
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

          Users.findOneAndUpdate(
            {
              uid: uid,
            },
            {
              $set: {
                dailyBackup: false,
              },
            },
            {
              new: true,
            }
          )

            .then(() => {
              if (jobFound) {
                logger.info("cancelling the  backup ");
                jobFound.cancel();
              }

              logger.info(`Daily Backup disabled for - ${uid} `);
              logger.info("-----------------------------------");
              return sendResponse(res, httpCodes.OK, {
                message: "Daily Backup Disabled.",
              });
            })
            .catch((err) => {
              return sendResponse(res, httpCodes.BAD_REQUEST, {
                message: "Error occured in disabling daily backup",
              });
            });
        }
      })
      .catch((err) => {
        logger.error("error occured in daily backup - " + err);
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: "Error occured in  daily backup",
        });
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

    Users.findOne({
      uid: uid,
    })

      .then((response) => {
        let returnData = response;
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
          let hour = 00;
          let minute = 01;
          rule.hour = hour;
          rule.minute = minute;
          rule.dayOfWeek = new schedule.Range(0, 6);
          let jobId = `${uid}-daily-backup`;

          if (jobFoundDailyBackup) {
            logger.info("canceling the previous backup notification");
            jobFoundDailyBackup.cancel();
          }

          logger.info(
            `Enabling daily backup for ${returnData.displayName} at ${hour}:${minute}`
          );

          schedule.scheduleJob(jobId, rule, function () {
            sendDailyBackupNotification(returnData);
          });
        }
        logger.info("-----------------------------------");

        return sendResponse(res, httpCodes.OK, {
          message: "Enabled notifications successfully",
        });
      })
      .catch((err) => {
        logger.error("err in getting the data" + err);
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: "Error occured in enabling notification",
        });
      });
  },
};
