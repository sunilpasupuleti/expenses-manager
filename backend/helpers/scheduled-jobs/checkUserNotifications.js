const schedule = require("node-schedule");
const { database } = require("firebase-admin");
const logger = require("../../middleware/logger/logger");
const {
  sendDailyReminderNotification,
  sendDailyBackupNotification,
} = require("../notificationHelpers");

async function checkAndActivateUserNotifications() {
  try {
    const jobs = schedule.scheduledJobs;
    const snapshot = await database().ref("users").once("value");
    const users = snapshot.val();

    if (!users) {
      logger.info("🚫 No users found for activating notifications.");
      return;
    }

    Object.values(users).forEach((userData) => {
      if (!userData) return;

      const timeZone = userData.timeZone || "Asia/Kolkata";
      const display =
        userData.displayName || userData.email || userData.phoneNumber;

      // 💡 Daily Reminder
      const reminderJobId = `${userData.uid}-daily-reminder`;
      if (!jobs[reminderJobId] && userData?.dailyReminderEnabled) {
        const [hr, min] = (userData.dailyReminderTime || "08:00").split(":");
        const rule = new schedule.RecurrenceRule();
        rule.hour = parseInt(hr);
        rule.minute = parseInt(min);
        rule.tz = timeZone;
        rule.dayOfWeek = new schedule.Range(0, 6);

        logger.info(
          `🔔 Enabling daily reminder for ${display} at ${hr}:${min} (${timeZone})`
        );
        schedule.scheduleJob(reminderJobId, rule, () => {
          sendDailyReminderNotification(userData);
        });
      }

      // 💾 Daily Backup
      const backupJobId = `${userData.uid}-daily-backup`;
      if (!jobs[backupJobId] && userData?.dailyBackupEnabled) {
        const rule = new schedule.RecurrenceRule();
        rule.hour = 0;
        rule.minute = 1;
        rule.tz = timeZone;
        rule.dayOfWeek = new schedule.Range(0, 6);

        logger.info(`🧾 Enabling daily backup for ${display} (${timeZone})`);
        schedule.scheduleJob(backupJobId, rule, () => {
          sendDailyBackupNotification(userData);
        });
      }
    });
  } catch (error) {
    logger.error("❌ Error activating user notifications:", error);
  }
}

module.exports = { checkAndActivateUserNotifications };
