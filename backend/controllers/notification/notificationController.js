const httpstatus = require("http-status-codes");
const schedule = require("node-schedule");
const db = require("firebase-admin/database");

const {
  sendDailyReminderNotification,
  sendDailyBackupNotification,
} = require("../../helpers/notificationHelpers");
const Users = require("../../models/Users");
const { sendResponse, httpCodes } = require("../../helpers/utility");
const logger = require("../../middleware/logger/logger");

module.exports = {
  async updateDailyReminder(req, res) {
    try {
      const sendSuccessResponse = (message) => {
        sendResponse(res, httpCodes.OK, {
          message: message,
        });
      };
      let { fcmToken, timeZone, dailyReminderEnabled, dailyReminderTime } =
        req.body;

      dailyReminderEnabled = dailyReminderEnabled ? true : false;
      let { uid } = req.user;
      if (!uid || !dailyReminderTime || !fcmToken || !timeZone) {
        throw "UID , TIME , FCM TOKEN , TIME ZONE fields are required";
      }
      const dbRef = await db.getDatabase().ref(`/users/${uid}`);
      let snapshot = await dbRef.once("value");
      const userData = snapshot.val();
      if (!userData) {
        throw "No User Found";
      }
      await dbRef.update({
        dailyReminderEnabled: dailyReminderEnabled,
        dailyReminderTime: dailyReminderTime,
        fcmToken: fcmToken,
        timeZone: timeZone,
      });

      const jobId = `${uid}-daily-reminder`;
      const jobs = schedule.scheduledJobs;
      const jobKeyFound = Object.keys(jobs).find((key) => key === jobId);
      const jobFound = jobs[jobKeyFound];

      if (dailyReminderEnabled) {
        if (jobFound) {
          logger.info(
            "Updated time in daily reminder. Cancelling the previous one and scheduling new reminder"
          );
          logger.info("-----------------------------------");
          jobFound.cancel();
        }
        let hr = dailyReminderTime.split(":")[0];
        let min = dailyReminderTime.split(":")[1];
        const rule = new schedule.RecurrenceRule();
        // rule.minute = new schedule.Range(0, 59, 1); //for every one minute
        rule.hour = hr;
        rule.minute = min;
        rule.tz = timeZone;
        rule.dayOfWeek = new schedule.Range(0, 6);

        // get user data
        logger.info(
          `Enabling daily reminder for ${userData.displayName} at time - ${hr}:${min} - ${timeZone}`
        );
        logger.info("-----------------------------------");
        schedule.scheduleJob(jobId, rule, function () {
          sendDailyReminderNotification(userData);
        });
        return sendSuccessResponse(
          jobFound ? "Daily Reminder Updated" : "Daily Reminder Enabled"
        );
      } else {
        if (jobFound) {
          logger.info(`Daily reminder disabled for - ${uid} `);
          logger.info("-----------------------------------");
          jobFound.cancel();
        }
        return sendSuccessResponse("Daily Reminder Disabled");
      }
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Error occured in updating daily reminder : " + e.toString(),
      });
    }
  },

  async updateDailyBackUp(req, res) {
    try {
      const sendSuccessResponse = (message) => {
        sendResponse(res, httpCodes.OK, {
          message: message,
        });
      };
      let { fcmToken, dailyBackupEnabled, timeZone } = req.body;
      dailyBackupEnabled = dailyBackupEnabled ? true : false;

      let { uid } = req.user;
      if (!uid || !fcmToken || !timeZone) {
        throw "UID , timeZone, FCM Token required ";
      }
      const dbRef = await db.getDatabase().ref(`/users/${uid}`);
      let snapshot = await dbRef.once("value");
      const userData = snapshot.val();
      if (!userData) {
        throw "No User Found";
      }
      await dbRef.update({
        dailyBackupEnabled: dailyBackupEnabled,
        fcmToken: fcmToken,
        timeZone: timeZone,
      });
      const jobId = `${uid}-daily-backup`;
      const jobs = schedule.scheduledJobs;
      const jobKeyFound = Object.keys(jobs).find((key) => key === jobId);
      const jobFound = jobs[jobKeyFound];
      if (dailyBackupEnabled) {
        if (jobFound) {
          logger.info("Found daily backup and cancelling it");
          logger.info("-----------------------------------");
          jobFound.cancel();
        }

        const rule = new schedule.RecurrenceRule();
        let hour = 00;
        let minute = 01;
        rule.hour = hour;
        rule.minute = minute;
        rule.tz = timeZone;

        rule.dayOfWeek = new schedule.Range(0, 6);

        // rule.minute = new schedule.Range(0, 59, 2); //for every one minute
        // get user data
        logger.info(
          `Enabling daily backup for ${userData.displayName} at time - ${hour}:${minute} - ${timeZone}`
        );
        logger.info("-----------------------------------");
        schedule.scheduleJob(jobId, rule, function () {
          sendDailyBackupNotification(userData);
        });
        return sendSuccessResponse("Daily Backup Enabled");
      } else {
        if (jobFound) {
          logger.info(`Daily Backup disabled for - ${uid} `);
          logger.info("-----------------------------------");
          jobFound.cancel();
        }
        return sendSuccessResponse("Daily Backup Disabled");
      }
    } catch (e) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Error occured in updating daily backup : " + e.toString(),
      });
    }
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
    let jobKeyDailyReminderFound = Object.keys(jobs).find(
      (key) => key === jobDailyReminderId
    );
    let jobFoundDailyReminder = jobs[jobKeyDailyReminderFound];

    let jobDailyBackupId = `${uid}-daily-backup`;
    let jobKeyDailyBackupFound = Object.keys(jobs).find(
      (key) => key === jobDailyBackupId
    );
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
    try {
      let { uid } = req.user;
      let jobs = schedule.scheduledJobs;

      let jobDailyReminderId = `${uid}-daily-reminder`;
      let jobKeyDailyReminderFound = Object.keys(jobs).find(
        (key) => key === jobDailyReminderId
      );
      let jobFoundDailyReminder = jobs[jobKeyDailyReminderFound];

      let jobDailyBackupId = `${uid}-daily-backup`;
      let jobKeyDailyBackupFound = Object.keys(jobs).find(
        (key) => key === jobDailyBackupId
      );
      let jobFoundDailyBackup = jobs[jobKeyDailyBackupFound];

      const dbRef = await db.getDatabase().ref(`/users/${uid}`);
      let snapshot = await dbRef.once("value");
      const userData = snapshot.val();
      if (!userData) {
        throw "No User Data";
      }
      let {
        dailyBackupEnabled,
        dailyReminderEnabled,
        dailyReminderTime,
        timeZone,
        displayName,
        email,
        active,
        phoneNumber,
      } = userData;
      let display = displayName || email || phoneNumber;
      dailyReminderEnabled = dailyReminderEnabled ? true : false;
      dailyBackupEnabled = dailyBackupEnabled ? true : false;

      if (active && dailyReminderEnabled && dailyReminderTime) {
        let hr = dailyReminderTime.split(":")[0];
        let min = dailyReminderTime.split(":")[1];
        var rule = new schedule.RecurrenceRule();
        rule.hour = hr;
        rule.minute = min;
        rule.tz = timeZone || "Asia/Calcutta";
        rule.dayOfWeek = new schedule.Range(0, 6);
        if (jobFoundDailyReminder) {
          logger.info("canceling the previous daily reminder notification");
          jobFoundDailyReminder.cancel();
        }
        logger.info(
          `Enabling daily reminder for ${display} at time - ${hr}:${min} - ${timeZone}`
        );
        schedule.scheduleJob(jobDailyReminderId, rule, function () {
          sendDailyReminderNotification(userData);
        });
      }

      if (dailyBackupEnabled && active) {
        var rule = new schedule.RecurrenceRule();
        // rule.minute = new schedule.Range(0, 59, 1); //for every one minute
        let hour = 00;
        let minute = 01;
        rule.hour = hour;
        rule.minute = minute;
        rule.tz = timeZone;

        rule.dayOfWeek = new schedule.Range(0, 6);

        if (jobFoundDailyBackup) {
          logger.info("canceling the previous backup notification");
          jobFoundDailyBackup.cancel();
        }
        logger.info(
          `Enabling daily backup for ${display} at ${hour}:${minute} - ${timeZone}`
        );
        schedule.scheduleJob(jobDailyBackupId, rule, function () {
          sendDailyBackupNotification(userData);
        });
      }

      logger.info("-----------------------------------");
      return sendResponse(res, httpCodes.OK, {
        message: "Enabled notifications successfully",
      });
    } catch (err) {
      logger.error("err in getting the data" + err);
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Error occured in enabling notification",
      });
    }
  },
};
