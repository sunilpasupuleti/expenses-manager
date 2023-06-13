const httpstatus = require("http-status-codes");
const crypto = require("crypto-js");
const mongoose = require("mongoose");
const logger = require("../middleware/logger/logger");
const ObjectId = mongoose.Types.ObjectId;

module.exports = {
  httpCodes: { ...httpstatus.StatusCodes },
  sendResponse,
  encryptAES,
  decryptAES,
  validateParamsObjectId,
};

function sendResponse(response, code = httpstatus.StatusCodes, data = {}) {
  //check if it exists in code;
  let exists = Object.keys(httpstatus.StatusCodes).filter((c) => c == code);
  if (!exists || exists.length === 0) {
    logger.info("No response code found");
    return;
  }
  return response.status(code).json(data);
}

function encryptAES(data, key) {
  let cipherText = crypto.AES.encrypt(String(data), key).toString();
  return cipherText;
}

function decryptAES(cipherText, key) {
  var bytes = crypto.AES.decrypt(cipherText, key);
  var originalText = bytes.toString(crypto.enc.Utf8);
  return originalText;
}

function validateParamsObjectId(paramName) {
  return (req, res, next) => {
    let id = req.params.id;
    if (paramName) {
      id = req.params[paramName];
    }
    let validObjectId = ObjectId.isValid(id);
    if (validObjectId) {
      next();
    } else {
      return sendResponse(res, httpstatus.StatusCodes.BAD_REQUEST, {
        message: "Invalid Param Id Cannot cast to mongoose",
      });
    }
  };
}
