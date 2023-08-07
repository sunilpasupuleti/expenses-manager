const { getMessaging } = require("firebase-admin/messaging");
const logger = require("../middleware/logger/logger");

const OneSignal = require("onesignal-node");
const {
  createDailyBackupFromTempData,
} = require("../controllers/backup/backupController");
const { getFirebaseAccessUrl } = require("./utility");
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_API_KEY
);

module.exports = {
  async sendDailyReminderNotification(data) {
    let display = data.displayName || data.email || data.phoneNumber;
    logger.info("sending daily reminder notification to  - " + display);
    let title = "Reminder 🔔";
    let body = `Have you recorded your transactions..🤔? If not 😕 do it now.`;
    let notificationData = {
      type: "daily-reminder",
      uid: data.uid,
    };
    let bigPictureUrl = getFirebaseAccessUrl("notification/daily_reminder.jpg");
    let largeIconUrl = getFirebaseAccessUrl("notification/wallet.jpeg");
    let collapseId = "daily-reminder";
    try {
      const res = await client.createNotification({
        name: "Daily Reminder",
        headings: {
          en: title,
        },
        priority: 7,

        android_accent_color: "5756d5",
        ios_sound: "notification_primary.wav",
        ios_attachments: {
          picture: bigPictureUrl,
        },
        content_available: true,
        big_picture: bigPictureUrl,
        android_channel_id: process.env.ONE_SIGNAL_DAILY_REMINDER_CHANNEL_ID,
        large_icon: largeIconUrl,
        contents: {
          en: body,
        },
        collapse_id: collapseId,
        // buttons: [
        //   {
        //     id: "daily_reminder_yes",
        //     text: "Do it now",
        //   },
        //   {
        //     id: "no",
        //     text: "Later",
        //   },
        // ],
        filters: [
          {
            field: "tag",
            key: "uid",
            relation: "=",
            value: data.uid,
          },
        ],
        data: notificationData,
      });
      logger.info(JSON.stringify(res.body));
    } catch (err) {
      if (err instanceof OneSignal.HTTPError) {
        logger.error(err.body);
      } else {
        console.error(" Error in enabling daily reminder ");
        logger.error(JSON.stringify(err));
      }
    }
  },

  async sendDailyBackupNotification(data) {
    let display = data.displayName || data.email || data.phoneNumber;

    logger.info("sending daily backup notification to  - " + display);

    let title = "Backup Progressing 🔄";
    let body = `Please hold on, we're currently backing up your data.`;
    let notificationData = {
      type: "daily-backup",
      uid: data.uid,
    };
    let bigPictureUrl = getFirebaseAccessUrl("notification/daily_backup.jpeg");
    let largeIconUrl = getFirebaseAccessUrl("notification/backup.png");

    let collapseId = "daily-backup";

    try {
      const res = await client.createNotification({
        name: "Daily Backup",
        headings: {
          en: title,
        },
        priority: 7,
        android_accent_color: "5756d5",
        ios_sound: "notification_primary.wav",
        ios_attachments: {
          picture: bigPictureUrl,
        },
        content_available: true,
        big_picture: bigPictureUrl,
        android_channel_id: process.env.ONE_SIGNAL_DAILY_BACKUP_CHANNEL_ID,
        large_icon: largeIconUrl,
        contents: {
          en: body,
        },
        collapse_id: collapseId,
        buttons: [],
        filters: [
          {
            field: "tag",
            key: "uid",
            relation: "=",
            value: data.uid,
          },
        ],
        data: notificationData,
      });
      createDailyBackupFromTempData(data);
      logger.info(JSON.stringify(res.body));
    } catch (err) {
      if (err instanceof OneSignal.HTTPError) {
        logger.error(err.body);
      } else {
        logger.error("Error in enabling Daily Backup");
        logger.error(JSON.stringify(err));
      }
    }
  },
};
