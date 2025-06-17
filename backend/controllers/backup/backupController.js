const httpstatus = require("http-status-codes");
const logger = require("../../middleware/logger/logger");
const _ = require("lodash");
const Users = require("../../models/Users");
const {
  sendResponse,
  httpCodes,
  decryptAES,
  encryptAES,
  getFirebaseAccessUrl,
  firebaseRemoveFiles,
  getCurrentDate,
  formatDate,
} = require("../../helpers/utility");
const Backups = require("../../models/Backups");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const admin = require("firebase-admin");
const OneSignal = require("onesignal-node");
const BackupsTemp = require("../../models/BackupsTemp");
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_API_KEY
);
const db = require("firebase-admin/database");
const fs = require("fs");
const { sendNotification } = require("../../helpers/notificationHelpers");

module.exports = {
  async getBackups(req, res) {
    let user = req.user;

    Users.findOne({
      uid: user.uid,
    })
      .populate("backups")
      .then((data) => {
        let result = data;
        let backups = [];
        if (result.backups && result.backups.length > 0) {
          result.backups.forEach((b) => {
            let backup = {
              _id: b._id,
              date: b.createdAt,
              time: b.createdAt,
            };
            backups.push(backup);
          });
        }

        return sendResponse(res, httpCodes.OK, {
          message: "Backups fetched successfully",
          backups: backups.reverse(),
        });
      })
      .catch((err) => {
        logger.error("error occured - " + err);
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message: "Error occured " + err,
        });
      });
  },

  async createBackup(req, res) {
    let user = req.user;

    let uid = user.uid;

    let structuredData = {};
    let { categories, sheets } = req.body;
    let incomeCategories = [];
    let expenseCategories = [];
    if (categories && sheets) {
      categories.income.forEach((c) => {
        let { id, color, name, icon } = c;
        name = encryptAES(name, user.uid);
        let income = {
          id: id,
          color: color,
          name: name,
        };
        if (c.default) income.default = c.default;
        if (icon) income.icon = icon;
        incomeCategories.push(income);
      });
      categories.expense.forEach((c) => {
        let { id, color, name, icon } = c;
        name = encryptAES(name, uid);
        let income = {
          id: id,
          color: color,
          name: name,
        };
        if (c.default) income.default = c.default;
        if (icon) income.icon = icon;
        expenseCategories.push(income);
      });
      structuredData.categories = {
        income: incomeCategories,
        expense: expenseCategories,
      };

      let structuredSheets = [];
      sheets.forEach((s) => {
        let {
          name,
          currency,
          updatedAt,
          id,
          showTotalBalance,
          totalBalance,
          archived,
          pinned,
        } = s;
        name = encryptAES(name, uid);
        currency = encryptAES(currency, uid);
        totalBalance = encryptAES(totalBalance, uid);
        let sheet = {
          name,
          currency,
          updatedAt,
          id,
          showTotalBalance,
          totalBalance,
        };
        if (typeof archived !== "undefined") {
          sheet.archived = archived;
        } else {
          sheet.archived = false;
        }

        if (typeof pinned !== "undefined") {
          sheet.pinned = pinned;
        } else {
          sheet.pinned = false;
        }
        let structuredSheetDetails = [];
        let structuredSheetUpcomingDetails = [];
        if (s.details) {
          s.details.forEach((sd) => {
            let {
              id,
              amount,
              notes,
              type,
              category,
              showTime,
              date,
              createdAt,
              image,
              time,
            } = sd;
            let structuredCategory = {
              id: category.id,
              name: encryptAES(category.name, uid),
              color: category.color,
            };
            if (category.icon) structuredCategory.icon = category.icon;
            amount = encryptAES(amount, uid);
            if (notes) {
              notes = encryptAES(notes, uid);
            }
            let sheetDetail = {
              id,
              amount,
              notes,
              type,
              category: structuredCategory,
              date,
              showTime,
              date,
              createdAt,
              image,
            };
            if (showTime && time) {
              sheetDetail.time = time;
            }
            structuredSheetDetails.push(sheetDetail);
          });
        }

        if (s.upcoming) {
          s.upcoming.forEach((sd) => {
            let {
              id,
              amount,
              notes,
              type,
              category,
              showTime,
              date,
              createdAt,
              image,
              time,
            } = sd;
            let structuredCategory = {
              id: category.id,
              name: encryptAES(category.name, uid),
              color: category.color,
            };
            if (category.icon) structuredCategory.icon = category.icon;
            amount = encryptAES(amount, uid);
            if (notes) {
              notes = encryptAES(notes, uid);
            }
            let sheetDetail = {
              id,
              amount,
              notes,
              type,
              category: structuredCategory,
              date,
              showTime,
              date,
              createdAt,
              image,
            };
            if (showTime && time) {
              sheetDetail.time = time;
            }
            structuredSheetUpcomingDetails.push(sheetDetail);
          });
        }

        sheet.details = structuredSheetDetails;
        sheet.upcoming = structuredSheetUpcomingDetails;
        structuredSheets.push(sheet);
      });
      structuredData.sheets = structuredSheets;

      let userData = await Users.findOne({ uid: uid });
      if (userData.backups && userData.backups.length >= 10) {
        let requiredLength = 10;
        let currentLength = userData.backups.length;
        let spliceUntil = currentLength - requiredLength;
        let lastBackups = userData.backups.splice(0, spliceUntil + 1);
        await Backups.deleteMany({
          _id: { $in: lastBackups },
        });
        await Users.findOneAndUpdate(
          {
            uid: user.uid,
          },
          {
            $pull: {
              backups: { $in: lastBackups },
            },
          }
        );
      }

      Backups.create(structuredData)
        .then((data) => {
          let backupId = data._id;

          Users.findOneAndUpdate(
            {
              uid: user.uid,
            },
            {
              $push: {
                backups: backupId,
              },
            }
          )
            .then((result) => {
              return sendResponse(res, httpCodes.OK, {
                message: "Backup created successfully",
              });
            })
            .catch((err) => {
              logger.error("error occured - " + err);
              return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
                message: "Error occured " + err,
              });
            });
        })
        .catch((err) => {
          logger.error("error occured - " + err);
          return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
            message: "Error occured " + err,
          });
        });
    }
  },

  async createDailyBackupFromTempData(data) {
    let user = data;
    let uid = user.uid;
    let backupSuccessTitle = "Backup successful 🥰";
    let backupSuccessBody = "Safely secured your data ❤️";
    let backupFailedTitle = "Apologies, backup didn't work 😥";
    let backupFailedBody =
      "If unsuccessful, proceed to handle it manually within the app";

    const onSendNotification = async (success = false, noBackup = false) => {
      let pictureName = success
        ? "daily_backup_success.jpeg"
        : "daily_backup_failure.jpeg";

      let bigPictureUrl = getFirebaseAccessUrl(`notification/${pictureName}`);
      let largeIconUrl = getFirebaseAccessUrl(`notification/backup.png`);
      let collapseId = "daily-backup";
      let title = success ? backupSuccessTitle : backupFailedTitle;
      let body = success ? backupSuccessBody : backupFailedBody;

      if (noBackup) {
        title = "Absolutely perfect!🤩";
        body = "Seems like there's nothing currently needing a backup";

        bigPictureUrl = getFirebaseAccessUrl(`notification/no_backup.jpg`);
      }

      try {
        const res = await client.createNotification({
          name: "Daily Backup",
          headings: {
            en: title,
          },
          priority: 7,
          android_accent_color: "5756d5",
          big_picture: bigPictureUrl,
          ios_sound: "notification_primary.wav",
          ios_attachments: {
            picture: bigPictureUrl,
          },
          content_available: true,
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
              value: uid,
            },
          ],
        });
        logger.info(JSON.stringify(res.body) + " BACKUP SUCCESS");
      } catch (err) {
        if (err instanceof OneSignal.HTTPError) {
          logger.error(err.body);
        } else {
          logger.error("Error in sending success/failure backup notification");
          logger.error(JSON.stringify(err));
        }
      }
    };

    let backupTempData = await BackupsTemp.findOne({
      uid: uid,
    });

    let categories = backupTempData?.categories;
    let sheets = backupTempData?.sheets;
    if (backupTempData && categories && sheets) {
      let userData = await Users.findOne({ uid: uid });
      if (userData.backups && userData.backups.length >= 10) {
        let requiredLength = 10;
        let currentLength = userData.backups.length;
        let spliceUntil = currentLength - requiredLength;
        let lastBackups = userData.backups.splice(0, spliceUntil + 1);
        await Backups.deleteMany({
          _id: { $in: lastBackups },
        });
        await Users.findOneAndUpdate(
          {
            uid: uid,
          },
          {
            $pull: {
              backups: { $in: lastBackups },
            },
          }
        );
      }

      Backups.create({
        categories: categories,
        sheets: sheets,
      })
        .then((data) => {
          let backupId = data._id;
          Users.findOneAndUpdate(
            {
              uid: user.uid,
            },
            {
              $push: {
                backups: backupId,
              },
            }
          )
            .then((result) => {
              onSendNotification(true);
              logger.info("Daily Backup created successfully");
            })
            .catch((err) => {
              onSendNotification(false);
              logger.error("error occured Daily backup from temp data- " + err);
            });
        })
        .catch((err) => {
          onSendNotification(false);
          logger.error("error occured Daily backup from temp data- " + err);
        });
    } else {
      onSendNotification(true, true);
    }
  },

  async getTempBackup(req, res) {
    let noBackup = false;
    try {
      let user = req.user;
      let uid = user.uid;
      const data = await BackupsTemp.findOne({
        uid: uid,
      });

      if (!data) {
        noBackup = true;
        throw "We are really! Our systems worked hard but unfortunately no data was found to recover!";
      }

      let result = _.cloneDeep(data._doc);
      // decrypt categories
      result.categories.income.forEach((c) => {
        c.name = decryptAES(c.name, uid);
      });

      result.categories.expense.forEach((c) => {
        c.name = decryptAES(c.name, uid);
      });
      // decrypt sheets
      result.sheets.forEach((sh, shIndex) => {
        let sheet = { ...sh };

        sheet.name = decryptAES(sheet.name, uid);
        sheet.currency = decryptAES(sheet.currency, uid);
        sheet.totalBalance = +decryptAES(sheet.totalBalance, uid);

        // decrypt transactions
        sheet.details.forEach((sd, sdIndex) => {
          let sheetDetail = {
            ...sd,
          };
          sheetDetail.amount = +decryptAES(sheetDetail.amount, uid);
          if (sheetDetail.notes) {
            sheetDetail.notes = decryptAES(sheetDetail.notes, uid);
          }
          let category = { ...sheetDetail.category };
          category.name = decryptAES(category.name, uid);
          sheetDetail.category = category;
          sheet.details[sdIndex] = sheetDetail;
        });
        result.sheets[shIndex] = sheet;
      });
      return sendResponse(res, httpCodes.OK, {
        message: "Backup fetched successfully",
        backup: result,
      });
    } catch (err) {
      logger.error("error occured - " + err);
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: err.toString(),
        noBackup: noBackup,
      });
    }
  },

  async getBackup(req, res) {
    let user = req.user;
    let uid = user.uid;
    let backupId = req.query.id;
    if (!backupId) {
      let userData = await Users.findOne({
        uid: uid,
      }).populate("backups");
      console.log(userData);

      let backUp = userData.backups[userData.backups.length - 1];
      if (backUp) {
        backupId = backUp._id;
      } else {
        return sendResponse(res, httpCodes.OK, {
          message: "There is no data to restore",
        });
      }
    } else {
      if (!ObjectId.isValid(backupId)) {
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: "Invalid Object Id cannot cast to mongoose",
        });
      }
    }

    Backups.findOne({
      _id: backupId,
    })
      .then((data) => {
        let result = _.cloneDeep(data._doc);
        // decrypt categories
        result.categories.income.forEach((c) => {
          c.name = decryptAES(c.name, uid);
        });

        result.categories.expense.forEach((c) => {
          c.name = decryptAES(c.name, uid);
        });
        // decrypt sheets
        result.sheets.forEach((sh, shIndex) => {
          let sheet = { ...sh };

          sheet.name = decryptAES(sheet.name, uid);
          sheet.currency = decryptAES(sheet.currency, uid);
          sheet.totalBalance = +decryptAES(sheet.totalBalance, uid);

          // decrypt transactions
          sheet.details.forEach((sd, sdIndex) => {
            let sheetDetail = {
              ...sd,
            };
            sheetDetail.amount = +decryptAES(sheetDetail.amount, uid);
            if (sheetDetail.notes) {
              sheetDetail.notes = decryptAES(sheetDetail.notes, uid);
            }
            let category = { ...sheetDetail.category };
            category.name = decryptAES(category.name, uid);
            sheetDetail.category = category;
            sheet.details[sdIndex] = sheetDetail;
          });
          result.sheets[shIndex] = sheet;
        });
        return sendResponse(res, httpCodes.OK, {
          message: "Backup fetched successfully",
          backup: result,
        });
      })
      .catch((err) => {
        logger.error("error occured - " + err);
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message: "Error occured " + err,
        });
      });
  },

  async createBackupTemp(req, res) {
    let user = req.user;
    let uid = user.uid;
    let structuredData = {
      _id: req.user._id,
      uid: uid,
    };
    let { categories, sheets } = req.body;
    let incomeCategories = [];
    let expenseCategories = [];
    if (categories && sheets) {
      categories.income.forEach((c) => {
        let { id, color, name, icon } = c;
        name = encryptAES(name, user.uid);
        let income = {
          id: id,
          color: color,
          name: name,
        };
        if (c.default) income.default = c.default;
        if (icon) income.icon = icon;
        incomeCategories.push(income);
      });
      categories.expense.forEach((c) => {
        let { id, color, name, icon } = c;
        name = encryptAES(name, uid);
        let income = {
          id: id,
          color: color,
          name: name,
        };
        if (c.default) income.default = c.default;
        if (icon) income.icon = icon;
        expenseCategories.push(income);
      });
      structuredData.categories = {
        income: incomeCategories,
        expense: expenseCategories,
      };

      let structuredSheets = [];
      sheets.forEach((s) => {
        let {
          name,
          currency,
          updatedAt,
          id,
          showTotalBalance,
          totalBalance,
          archived,
          pinned,
        } = s;
        name = encryptAES(name, uid);
        currency = encryptAES(currency, uid);
        totalBalance = encryptAES(totalBalance, uid);
        let sheet = {
          name,
          currency,
          updatedAt,
          id,
          showTotalBalance,
          totalBalance,
        };
        if (typeof archived !== "undefined") {
          sheet.archived = archived;
        } else {
          sheet.archived = false;
        }

        if (typeof pinned !== "undefined") {
          sheet.pinned = pinned;
        } else {
          sheet.pinned = false;
        }
        let structuredSheetDetails = [];
        let structuredSheetUpcomingDetails = [];
        if (s.details) {
          s.details.forEach((sd) => {
            let {
              id,
              amount,
              notes,
              type,
              category,
              showTime,
              date,
              createdAt,
              image,
              time,
            } = sd;
            let structuredCategory = {
              id: category.id,
              name: encryptAES(category.name, uid),
              color: category.color,
            };
            if (category.icon) structuredCategory.icon = category.icon;
            amount = encryptAES(amount, uid);
            if (notes) {
              notes = encryptAES(notes, uid);
            }
            let sheetDetail = {
              id,
              amount,
              notes,
              type,
              category: structuredCategory,
              date,
              showTime,
              date,
              createdAt,
              image,
            };
            if (showTime && time) {
              sheetDetail.time = time;
            }
            structuredSheetDetails.push(sheetDetail);
          });
        }

        if (s.upcoming) {
          s.upcoming.forEach((sd) => {
            let {
              id,
              amount,
              notes,
              type,
              category,
              showTime,
              date,
              createdAt,
              image,
              time,
            } = sd;
            let structuredCategory = {
              id: category.id,
              name: encryptAES(category.name, uid),
              color: category.color,
            };
            if (category.icon) structuredCategory.icon = category.icon;
            amount = encryptAES(amount, uid);
            if (notes) {
              notes = encryptAES(notes, uid);
            }
            let sheetDetail = {
              id,
              amount,
              notes,
              type,
              category: structuredCategory,
              date,
              showTime,
              date,
              createdAt,
              image,
            };
            if (showTime && time) {
              sheetDetail.time = time;
            }
            structuredSheetUpcomingDetails.push(sheetDetail);
          });
        }

        sheet.details = structuredSheetDetails;
        sheet.upcoming = structuredSheetUpcomingDetails;

        structuredSheets.push(sheet);
      });
      structuredData.sheets = structuredSheets;

      BackupsTemp.findOneAndUpdate(
        {
          uid: uid,
        },
        {
          $set: structuredData,
        },
        { upsert: true }
      )
        .then((data) => {
          return sendResponse(res, httpCodes.OK, {
            message: "Backup created successfully",
          });
        })
        .catch((err) => {
          logger.error("error occured while creating backup temp- " + err);
          return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
            message: "Error occured " + err,
          });
        });
    }
  },

  async dailyBackupFileUpload(req, res) {
    let title = "Backup Progressing 🔄";
    let body = `Please hold on, we're currently backing up your data.`;
    let notificationData = {
      type: "daily-backup",
    };
    let bigPictureUrl = "notification/daily_backup.jpeg";
    let largeIconUrl = "notification/backup.png";
    let collapseId = "daily-backup";

    try {
      const { file: base64File, uid, date, filename } = req.body;

      if (!base64File || !uid || !filename) {
        throw new Error("Missing required data");
      }

      const user = req.user;
      if (!user || !user.uid) {
        throw "Auth Failed";
      }
      //  to send notificaiton
      await sendNotification({
        title,
        body,
        notificationData,
        bigPictureUrl,
        largeIconUrl,
        collapseId,
        uid: user.uid,
      });

      const fileBuffer = Buffer.from(base64File, "base64");
      const uploadPath = `users/${user.uid}/backups/${filename}`;
      const bucket = admin.storage().bucket();
      const file = bucket.file(uploadPath);
      await file.save(fileBuffer, {
        metadata: {
          contentType: "application/json",
        },
      });

      let snapshot = await db
        .getDatabase()
        .ref(`/users/${user.uid}/backups`)
        .once("value");
      let backups = snapshot.val() || {};
      const backupsLength = Object.keys(backups).length;
      const allowedBackups = 9;
      if (backupsLength > allowedBackups) {
        const formattedBackups = _.map(backups, (backup, key) => ({
          datetime: formatDate(backup.date),
          id: key,
        }));
        // Sort the array by the 'datetime' key
        const sortedBackups = _.orderBy(formattedBackups, ["datetime"]);
        const backupKeys = _.map(sortedBackups, "id");
        // delete old ones
        const numBackupsToDelete = backupsLength - allowedBackups;
        const backupsToDelete = backupKeys.slice(0, numBackupsToDelete);
        const removeFilePaths = [];
        for (const key of backupsToDelete) {
          const backupRef = db
            .getDatabase()
            .ref(`/users/${uid}/backups/${key}`);
          await backupRef.remove();
          const value = backups[key];
          removeFilePaths.push(value.path);
        }
        await firebaseRemoveFiles(removeFilePaths);
      }

      const lastSynced = getCurrentDate();
      await db.getDatabase().ref(`/users/${uid}`).update({
        lastSynced: lastSynced,
        lastDailyBackup: date,
      });
      await db.getDatabase().ref(`/users/${uid}/backups`).push({
        path: uploadPath,
        date: date,
      });

      title = "Backup Successful ✅";
      body = `Your data backup is complete and securely stored.`;
      bigPictureUrl = "notification/daily_backup_success.jpeg";
      await sendNotification({
        title,
        body,
        notificationData,
        bigPictureUrl,
        largeIconUrl,
        collapseId,
        uid: user.uid,
      });
      return sendResponse(res, httpCodes.OK, {
        message: "Backup Successfull",
      });
    } catch (err) {
      console.log(err);

      title = "Backup Failed ❌";
      body = err.toString();
      bigPictureUrl = "notification/daily_backup_failure.jpeg";
      await sendNotification({
        title,
        body,
        notificationData,
        bigPictureUrl,
        largeIconUrl,
        collapseId,
        uid: req?.user?.uid,
      });
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: "Error occured " + err.toString(),
      });
    }
  },
};
