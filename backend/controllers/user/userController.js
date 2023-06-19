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
const schedule = require("node-schedule");

module.exports = {
  async saveUser(req, res) {
    let user = req.user;
    const { fcmToken, active, timeZone } = req.body;
    if (!user) {
      return sendResponse(res, httpCodes.NOT_FOUND, {
        message: "No User found",
      });
    }

    let data = {
      displayName: user.name,
      email: user.email,
      photoURL: user.picture,
      prodivderId: user.prodivderId,
      phoneNumber: user.phoneNumber,
      uid: user.uid,
      fcmToken: fcmToken,
      active: active,
      timeZone: timeZone,
    };

    Users.findOneAndUpdate(
      {
        uid: user.uid,
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
      prodivderId: 1,
      phoneNumber: 1,
      uid: 1,
      fcmToken: 1,
      active: 1,
      timeZone: 1,
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
