const { sendResponse, httpCodes } = require("../../../helpers/utility");
const Users = require("../../../models/Users");

module.exports = {
  async sendNotificationToUsers(req, res) {
    console.log(req.body);

    return sendResponse(res, httpCodes.OK, {
      message: "Notifications Sent Successfully",
    });
  },

  async getActiveUsersList(req, res) {
    let activeUsers = await Users.find({
      active: true,
      fcmToken: { $ne: null },
    })
      .select({ email: 1, displayName: 1, photoUrl: 1, fcmToken: 1, _id: 1 })
      .sort({ displayName: 1 });
    return sendResponse(res, httpCodes.OK, {
      message: "Active users list",
      activeUsers: activeUsers,
    });
  },
};
