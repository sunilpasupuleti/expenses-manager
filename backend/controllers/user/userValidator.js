const { sendResponse, httpCodes } = require("../../helpers/utility");

module.exports = {
  async validateUpdateProfilePicture(req, res, next) {
    let { photo } = req.body;
    if (!photo) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "There is no profile picture",
      });
    }

    let imageTypesAllowed = ["image/jpeg", "image/jpg", "image/png"];

    if (!imageTypesAllowed.includes(photo.type)) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "only JPEG, PNG images are supported",
      });
    }

    next();
  },
};
