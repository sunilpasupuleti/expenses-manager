const logger = require("../middleware/logger/logger");
const OneSignal = require("onesignal-node");
const db = require("firebase-admin/database");

const { getFirebaseAccessUrl } = require("./utility");
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_API_KEY
);

module.exports = {
  async sendDailyReminderNotification(data) {
    try {
      let display = data.displayName || data.email || data.phoneNumber;
      logger.info("sending daily reminder notification to  - " + display);
      let title = "Reminder 🔔";
      let body = `Have you recorded your transactions..🤔? If not 😕 do it now.`;
      let notificationData = {
        type: "daily-reminder",
        uid: data.uid,
        backendUrl: process.env.BACKEND_URL,
      };
      let bigPictureUrl = getFirebaseAccessUrl(
        "notification/daily_reminder.jpg"
      );
      let largeIconUrl = getFirebaseAccessUrl("notification/wallet.jpeg");
      let collapseId = "daily-reminder";

      const res = await client.createNotification({
        name: "Daily Reminder",
        headings: {
          en: title,
        },
        priority: 7,
        mutable_content: true,
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
    try {
      let display = data.displayName || data.email || data.phoneNumber;
      let platform = data.platform;
      let buttons = [];

      logger.info("sending daily backup notification to  - " + display);

      let title = "Backup Progressing 🔄";
      let body = `Please hold on, we're currently backing up your data.`;
      let notificationData = {
        type: "daily-backup",
        uid: data.uid,
        uniqueCode: data.uid,
        backendUrl: process.env.BACKEND_URL,
      };
      let bigPictureUrl = getFirebaseAccessUrl(
        "notification/daily_backup.jpeg"
      );
      let largeIconUrl = getFirebaseAccessUrl("notification/backup.png");

      let collapseId = "daily-backup";

      const manualBackupNotification = async () => {
        title = "Backup Needed 📲";
        body = "Please backup your data to ensure it's safe.";
        buttons = [
          {
            id: "backup_now",
            text: "Backup Now",
          },
          {
            id: "no",
            text: "Dismiss",
          },
        ];

        const res = await client.createNotification({
          name: "Daily Backup",
          headings: {
            en: "Backup",
          },
          app_url: "expenses-manager://Settings/Sync/",
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
          collapse_id: collapseId,
          buttons: buttons,
          contents: {
            en: body,
          },
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
        logger.info(JSON.stringify(res.body) + " Sent manual notification");
      };

      if (platform === "ios") {
        manualBackupNotification();
      } else {
        // notification wihtout content to background task trigger
        const res = await client.createNotification({
          name: "Daily Backup",
          headings: {
            en: "Backup",
          },
          app_url: "expenses-manager://Settings/Sync/",
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
          collapse_id: collapseId,
          buttons: buttons,
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

        setTimeout(async () => {
          try {
            const dbRef = db
              .getDatabase()
              .ref(`users/${data.uid}/lastDailyBackup`);
            const snapshot = await dbRef.once("value");
            let lastBackup = snapshot.val();
            lastBackup = new Date().toISOString().split("T")[0];

            const today = new Date().toISOString().split("T")[0];

            if (!lastBackup || lastBackup !== today) {
              manualBackupNotification();
            }
          } catch (e) {}
        }, 60 * 1000 * 3);
      }
    } catch (err) {
      if (err instanceof OneSignal.HTTPError) {
        logger.error(err.body);
      } else {
        logger.error("Error in enabling Daily Backup");
        logger.error(JSON.stringify(err));
      }
    }
  },

  async sendNotification(data) {
    try {
      let buttons = [];

      let {
        name,
        title,
        body,
        notificationData,
        bigPictureUrl,
        largeIconUrl,
        collapseId,
        uid,
        app_url,
      } = data;
      bigPictureUrl = getFirebaseAccessUrl(bigPictureUrl);
      largeIconUrl = getFirebaseAccessUrl(largeIconUrl);
      // "expenses-manager://Settings/Sync/"
      const res = await client.createNotification({
        name: name,
        headings: {
          en: title,
        },
        app_url: app_url,
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
        buttons: buttons,
        filters: [
          {
            field: "tag",
            key: "uid",
            relation: "=",
            value: uid,
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
