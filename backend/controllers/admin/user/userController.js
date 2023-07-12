const { sendResponse, httpCodes } = require("../../../helpers/utility");
const logger = require("../../../middleware/logger/logger");
const Users = require("../../../models/Users");

module.exports = {
  async getUsers(req, res) {
    let users = await Users.find({})
    .sort({ displayName: 1 });
    return sendResponse(res, httpCodes.OK, {
      message: "Users list",
      users: users,
    });
  },
};
