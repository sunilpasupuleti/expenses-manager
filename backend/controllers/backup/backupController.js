const httpstatus = require("http-status-codes");
const moment = require("moment");
const momentTz = require("moment-timezone");
const logger = require("../../middleware/logger/logger");
const _ = require("lodash");
const Users = require("../../models/Users");
const {
  sendResponse,
  httpCodes,
  decryptAES,
  encryptAES,
} = require("../../helpers/utility");
const Backups = require("../../models/Backups");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const OneSignal = require("onesignal-node");
const client = new OneSignal.Client(
  process.env.ONE_SIGNAL_APP_ID,
  process.env.ONE_SIGNAL_API_KEY
);

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
    // send succesfull backup notification to user
    let sendNotification = req.query?.sendNotification;

    let backupSuccessTitle = "Back up successfull 🥰";
    let backupSuccessBody = "Your data backed up safely ❤️";

    let backupFailedTitle = "We are Sorry ! Back up failed 😥";
    let backupFailedBody =
      "In case of backup failure, do it manually in the app.";

    const onSendNotification = async (success = false) => {
      let pictureName = success
        ? "daily_backup_success.jpeg"
        : "daily_backup_failure.jpeg";
      let bigPictureUrl = `${process.env.BACKEND_URL}/public/notification/${pictureName}`;
      let largeIconUrl = `${process.env.BACKEND_URL}/public/notification/daily_backup.jpeg`;
      let collapseId = "daily-backup";
      let title = success ? backupSuccessTitle : backupFailedTitle;
      let body = success ? backupSuccessBody : backupFailedBody;
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
        logger.info(JSON.stringify(res.body));
      } catch (err) {
        if (err instanceof OneSignal.HTTPError) {
          logger.error(err.body);
        } else {
          logger.error("Error in sending usscess/failure backup notification");
          logger.error(JSON.stringify(err));
        }
      }
    };
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
        sheet.details = structuredSheetDetails;
        structuredSheets.push(sheet);
      });
      structuredData.sheets = structuredSheets;

      let userData = await Users.findOne({ uid: uid }).populate("backups");

      if (userData.backups && userData.backups.length >= 10) {
        let lastBackup = userData.backups[0];
        await Backups.findOneAndDelete({
          _id: lastBackup._id,
        });
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
              if (sendNotification && sendNotification === "yes") {
                onSendNotification(true);
              }
              return sendResponse(res, httpCodes.OK, {
                message: "Backup created successfully",
              });
            })
            .catch((err) => {
              if (sendNotification && sendNotification === "yes") {
                onSendNotification(false);
              }
              logger.error("error occured - " + err);
              return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
                message: "Error occured " + err,
              });
            });
        })
        .catch((err) => {
          if (sendNotification && sendNotification === "yes") {
            onSendNotification(false);
          }
          logger.error("error occured - " + err);
          return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
            message: "Error occured " + err,
          });
        });
    } else {
      onSendNotification(true);
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
};
