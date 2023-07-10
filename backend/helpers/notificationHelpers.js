const { getMessaging } = require("firebase-admin/messaging");
const logger = require("../middleware/logger/logger");

const OneSignal = require("onesignal-node");
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_API_KEY
);

module.exports = {
  async sendDailyReminderNotification(data) {
    logger.info(
      "sending daily reminder notification to  - " + data.displayName
    );
    let title = "Reminder 🔔";
    let body = `Have you recorded your transactions.. 🤔? If not 😕 do it now.`;
    let notificationData = {
      type: "daily-reminder",
      uid: data.uid,
    };
    let bigPictureUrl = `${process.env.BACKEND_URL}/public/notification/daily_reminder.jpg`;
    let largeIconUrl = `${process.env.BACKEND_URL}/public/notification/wallet.jpeg`;
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
        buttons: [
          {
            id: "yes",
            text: "Do it now",
          },
          {
            id: "no",
            text: "Later",
          },
        ],
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
    logger.info("sending daily backup notification to  - " + data.displayName);

    let title = "Back Up 🔄";
    let body = `Please wait while we are backing up your data......`;
    let notificationData = {
      type: "daily-backup",
      uid: data.uid,
    };
    let bigPictureUrl = `${process.env.BACKEND_URL}/public/notification/daily_backup.jpeg`;
    let largeIconUrl = `${process.env.BACKEND_URL}/public/notification/wallet.jpeg`;
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
