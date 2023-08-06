const httpstatus = require("http-status-codes");
const logger = require("../../middleware/logger/logger");
const _ = require("lodash");
const Users = require("../../models/Users");
const { sendResponse, httpCodes } = require("../../helpers/utility");

module.exports = {
  async saveUser(req, res) {
    let uid = req.user.uid;
    let data = {};
    Object.keys(req.body).map((key) => {
      if (key) {
        let value = req.body[key];
        if (value !== undefined) {
          data[key] = value;
        }
      }
    });

    Users.findOneAndUpdate(
      {
        uid: uid,
      },
      {
        $set: data,
      },
      {
        upsert: true,
        new: true,
      }
    )
      .then((result) => {
        return sendResponse(res, httpCodes.OK, {
          message: "Login Successfull",
          user: result,
        });
      })
      .catch((err) => {
        logger.error(
          " Error occured while saving the user data to the database " + err
        );
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message: "Error occured while saving " + err,
        });
      });
  },

  async getUser(req, res) {
    let user = req.user;
    if (!user) {
      return sendResponse(res, httpCodes.NOT_FOUND, {
        message: " NO User found",
      });
    }

    let selectedFields = {
      displayName: 1,
      email: 1,
      photoURL: 1,
      providerId: 1,
      phoneNumber: 1,
      uid: 1,
      fcmToken: 1,
      active: 1,
      timeZone: 1,
      dailyReminder: 1,
      dailyBackup: 1,
      autoFetchTransactions: 1,
      platform: 1,
      model: 1,
      brand: 1,
      baseCurrency: 1,
    };
    Users.findOne({
      uid: user.uid,
    })
      .select(selectedFields)
      .then((result) => {
        return sendResponse(res, httpCodes.OK, {
          message: "User Data",
          user: result,
        });
      })
      .catch((err) => {
        logger.error(
          " Error occured while getting the user data from the database " + err
        );
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message: "Error occured while saving " + err,
        });
      });
  },
};
