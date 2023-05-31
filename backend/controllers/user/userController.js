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
    const { fcmToken, active } = req.body;
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
      uid: user.uid,
      fcmToken: fcmToken,
      active: active,
    };
    Users.updateOne(
      {
        uid: user.uid,
      },
      {
        $set: data,
      },
      {
        upsert: true,
      }
    )
      .then((result) => {
        return sendResponse(res, httpCodes.OK, {
          message: "Login Successfull",
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
    Users.findOne({
      uid: user.uid,
    })
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
