const { sendResponse, httpCodes } = require("../../../helpers/utility");
const logger = require("../../../middleware/logger/logger");
const Users = require("../../../models/Users");
const database = require("firebase-admin/database");
const _ = require("lodash");
const moment = require("moment");

module.exports = {
  async getUsers(req, res) {
    try {
      const version = req.params?.version;
      const allowedVersions = ["old-version", "new-version"];
      if (!version || !allowedVersions.includes(version)) {
        throw "Param Type not allowed ";
      }
      let users = [];
      if (version === "old-version") {
        users = await Users.find({}).sort({ createdAt: -1 });
      } else {
        const usersData = database.getDatabase().ref("users");
        const userDataValue = await usersData.once("value");
        users = Object.values(userDataValue.val());
        users = _.orderBy(
          users,
          (user) => moment(user.lastLogin || 0).valueOf(),
          ["desc"]
        );
      }

      return sendResponse(res, httpCodes.OK, {
        message: "Users list",
        users: users,
      });
    } catch (err) {
      return sendResponse(res, httpCodes.INSUFFICIENT_STORAGE, {
        message: err.toString(),
      });
    }
  },
};
