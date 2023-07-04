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

  async validateUploadSheetDetailPicture(req, res, next) {
    let { photo, sheetId, sheetDetailId } = req.body;
    if (!photo) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "There is no picture",
      });
    }

    if (!sheetId) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Sheet Id Required",
      });
    }

    if (!sheetDetailId) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Sheet Detail Id Required",
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

  async validateMoveSheetDetailPicture(req, res, next) {
    let { photo, moveToSheetId, sheetDetailId, currentSheetId } = req.body;
    if (!photo) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "There is no picture",
      });
    }

    if (!currentSheetId) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Current Sheet Id Required",
      });
    }

    if (!moveToSheetId) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Moving Sheet Id Required",
      });
    }

    if (!sheetDetailId) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Sheet Detail Id Required",
      });
    }

    next();
  },

  async validateDuplicateSheetDetailPicture(req, res, next) {
    let { photo, sheetDetailId, newSheetDetailId, sheetId } = req.body;
    if (!photo) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "There is no picture",
      });
    }

    if (!newSheetDetailId) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "New Sheet Detail Id Required",
      });
    }

    if (!sheetId) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Sheet Id Required",
      });
    }

    if (!sheetDetailId) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: "Sheet Detail Id Required",
      });
    }

    next();
  },
};
