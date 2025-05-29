const httpstatus = require("http-status-codes");
const crypto = require("crypto-js");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const jwt = require("jsonwebtoken");
const moment = require("moment");
const storage = require("firebase-admin/storage");
const FIREBASE_STORAGE_URL = process.env.FIREBASE_STORAGE_URL;

module.exports = {
  httpCodes: { ...httpstatus.StatusCodes },
  sendResponse,
  encryptAES,
  decryptAES,
  validateParamsObjectId,
  getJwt,
  cryptoDecrypt,
  cryptoEncrypt,
  getFirebaseAccessUrl,
  firebaseRemoveFiles,
  formatDate,
  getCurrentDate,
  adminRole: "admin",
};

function getFirebaseAccessUrl(path = "") {
  let URL = FIREBASE_STORAGE_URL + path.replaceAll("/", "%2f") + "?alt=media";
  return URL;
}

function getJwt(data, expiry = "1h") {
  const token = jwt.sign({ data: data }, process.env.JWT_SECRET, {
    expiresIn: expiry,
  });
  return token;
}

function cryptoEncrypt(data) {
  const encryptToken = crypto.AES.encrypt(
    data,
    process.env.AES_ENCRYPTION_KEY
  ).toString();
  return encryptToken;
}

function cryptoDecrypt(data) {
  const decryptToken = crypto.AES.decrypt(
    data,
    process.env.AES_ENCRYPTION_KEY
  ).toString(crypto.enc.Utf8);
  return decryptToken;
}

function sendResponse(response, code = httpstatus.StatusCodes, data = {}) {
  //check if it exists in code;
  let exists = Object.keys(httpstatus.StatusCodes).filter((c) => c == code);
  if (!exists || exists.length === 0) {
    console.info("No response code found");
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

function formatDate(date) {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

function getCurrentDate() {
  return moment().format("YYYY-MM-DD HH:mm:ss");
}

async function firebaseRemoveFiles(paths) {
  return Promise.all(
    paths.map(async (path) => {
      try {
        const bucket = storage.getStorage().bucket();
        let file = bucket.file(path);

        let fileExists = await file.exists();

        if (fileExists[0]) {
          await file.delete();
        }
        return true;
      } catch (e) {
        // skip deletion if file not exists
        console.log(
          e.toString(),
          "Error occurred while removing firebase cloud file at path:",
          path
        );
        return false;
      }
    })
  );
}
