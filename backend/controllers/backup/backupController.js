const httpstatus = require("http-status-codes");
const moment = require("moment");
const logger = require("../../middleware/logger/logger");
const _ = require("lodash");
const Users = require("../../models/Users");
const {
  sendResponse,
  httpCodes,
  decryptAES,
} = require("../../helpers/utility");
const Backups = require("../../models/Backups");

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
            createdAt: b.createdAt,
          };
          backups.push(backup);
        });
        return sendResponse(res, httpCodes.OK, {
          message: "Backups fetched successfully",
          backups,
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
    Backups.save({
      ...req.body,
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
    let backupId = req.params.id;
    if (!backupId) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "No Backup Id found",
      });
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
          let sheet = { ...sh._doc };
          sheet.name = decryptAES(sheet.name, uid);
          sheet.totalBalance = +decryptAES(sheet.totalBalance, uid);
          // decrypt transactions
          sheet.transactions.forEach((tr, trIndex) => {
            let transaction = {
              ...tr._doc,
            };
            transaction.amount = +decryptAES(transaction.amount, uid);
            if (transaction.notes) {
              transaction.notes = decryptAES(transaction.notes, uid);
            }
            let category = { ...transaction.category._doc };
            category.name = decryptAES(category.name, uid);
            transaction.category = category;
            sheet.transactions[trIndex] = transaction;
          });
          result.sheets[shIndex] = sheet;
        });
        return sendResponse(res, httpCodes.OK, {
          message: "Backup fetched successfully",
          result,
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
