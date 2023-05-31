const httpstatus = require("http-status-codes");
const moment = require("moment");
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
        result.backups.forEach((b) => {
          let backup = {
            _id: b._id,
            date: moment(b.createdAt).format("DD MMM YYYY"),
            time: moment(b.createdAt).format("hh:mm:ss A"),
          };
          backups.push(backup);
        });
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
          } = sd;
          let structuredCategory = {
            id: category.id,
            name: encryptAES(category.name, uid),
            color: category.color,
          };
          if (category.icon) structuredCategory.icon = category.icon;
          amount = encryptAES(amount, uid);
          notes = encryptAES(notes, uid);
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
  },

  async getBackup(req, res) {
    let user = req.user;
    let uid = user.uid;
    let backupId = req.query.id;
    if (!backupId) {
      let userData = await Users.findOne({
        uid: uid,
      }).populate("backups");
      backupId = userData.backups[userData.backups.length - 1]._id;
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
