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
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");

module.exports = {
  async saveUser(req, res) {
    let uid = req.user.uid;
    let folderPath = path.join(__dirname, `../../public/users/${uid}`);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
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

  async removeProfilePicture(req, res) {
    const uid = req.user.uid;
    const user = await Users.findOne({ uid: uid });
    let photoURL = user.photoURL;
    if (photoURL && photoURL.startsWith(`public/users/${uid}`)) {
      let picturePath = path.join(process.cwd(), photoURL);
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
    }

    Users.findOneAndUpdate(
      {
        uid: uid,
      },
      {
        $set: {
          photoURL: null,
        },
      },
      {
        new: true,
      }
    )
      .then((result) => {
        return sendResponse(res, httpCodes.OK, {
          message: "Profile Picture Removed Successfully",
          user: result,
        });
      })
      .catch((err) => {
        logger.error(" Error occured while removing profile picture" + err);
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message: "Error occured while removing profile picture " + err,
        });
      });
  },

  async updateProfilePicture(req, res) {
    const uid = req.user.uid;
    let { photo } = req.body;
    // console.log(photo);
    var base64Data = photo.base64.split(";base64,").pop();
    let pictureExtension = photo.type.split("/")[1];
    let pictureName = `profile.${pictureExtension}`;

    // remove already existing photo
    const user = await Users.findOne({ uid: uid });
    let photoURL = user.photoURL;
    if (photoURL && photoURL.startsWith(`public/users/${uid}`)) {
      let picturePath = path.join(process.cwd(), photoURL);
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
    }

    let picturePath = `public/users/${uid}/${pictureName}`;

    fs.writeFile(picturePath, base64Data, { encoding: "base64" }, (err) => {
      if (err) {
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message:
            "Error occured while updating profile picture. Please try again later!",
        });
      }

      Users.findOneAndUpdate(
        {
          uid: uid,
        },
        {
          $set: {
            photoURL: picturePath,
          },
        },
        {
          new: true,
        }
      )
        .then((result) => {
          return sendResponse(res, httpCodes.OK, {
            message: "Profile Picture Updated Successfully",
            photoURL: result.photoURL,
          });
        })
        .catch((err) => {
          logger.error(" Error occured while updating profile picture" + err);
          return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
            message: "Error occured while updating profile picture " + err,
          });
        });
    });
  },

  async uploadSheetDetailPicture(req, res) {
    const uid = req.user.uid;
    let { photo, sheetId, sheetDetailId } = req.body;
    // console.log(photo);
    var base64Data = photo.base64.split(";base64,").pop();
    let pictureExtension = photo.type.split("/")[1];
    let pictureName = `${sheetDetailId}.${pictureExtension}`;

    let folderPath = `public/users/${uid}/${sheetId}`;
    let picturePath = `public/users/${uid}/${sheetId}/${pictureName}`;
    if (!fs.existsSync(folderPath)) {
      {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    }

    fs.writeFile(picturePath, base64Data, { encoding: "base64" }, (err) => {
      if (err) {
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message:
            "Error occured while uploading transaction picture. Please try again later!",
        });
      }
      return sendResponse(res, httpCodes.OK, {
        message: "Successfully uploaded transaction picture",
        photoURL: picturePath,
      });
    });
  },

  async removeSheetDetailPicture(req, res) {
    let { url } = req.body;
    let picturePath = path.join(process.cwd(), url);
    if (fs.existsSync(picturePath)) {
      fs.unlinkSync(picturePath);
    }

    return sendResponse(res, httpCodes.OK, {
      message: "Sheet Detail Picture Removed Successfully",
    });
  },

  async deleteSheet(req, res) {
    let { sheetId } = req.params;
    let uid = req.user.uid;
    let currentDirectory = process.cwd() + "/";
    let sheetFolderPath = path.join(
      currentDirectory,
      `/public/users/${uid}/${sheetId}`
    );
    if (fs.existsSync(sheetFolderPath)) {
      fsExtra.emptyDirSync(sheetFolderPath);
      fsExtra.rmdirSync(sheetFolderPath);
    }
    return sendResponse(res, httpCodes.OK, {
      message: "Successfully deleted sheet path",
    });
  },

  async moveSheetDetailPicture(req, res) {
    const uid = req.user.uid;
    let { photo, moveToSheetId, sheetDetailId, currentSheetId } = req.body;
    let currentDirectory = process.cwd() + "/";
    let oldPath = path.join(currentDirectory, photo.url);
    let pictureName = oldPath.split(
      currentDirectory + `public/users/${uid}/${currentSheetId}/`
    )[1];
    let photoURL = `public/users/${uid}/${moveToSheetId}/${pictureName}`;
    let newPath = path.join(
      currentDirectory,
      `public/users/${uid}/${moveToSheetId}/`
    );
    let picturePath = newPath + pictureName;

    if (!fs.existsSync(newPath)) {
      {
        fs.mkdirSync(newPath, { recursive: true });
      }
    }

    fsExtra.move(oldPath, picturePath, (err) => {
      if (err) {
        logger.error(JSON.stringify(err));
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message:
            "Error occured while moving transaction picture. Please try again later!",
        });
      }
      return sendResponse(res, httpCodes.OK, {
        message: "Successfully moved transaction picture",
        photoURL: photoURL,
      });
    });
  },

  async duplicateSheetDetailPicture(req, res) {
    const uid = req.user.uid;
    let { photo, newSheetDetailId, sheetDetailId, sheetId } = req.body;
    let currentDirectory = process.cwd() + "/";
    let oldPath = path.join(currentDirectory, photo.url);

    let pictureName = newSheetDetailId + "." + photo.extension;

    let photoURL = `public/users/${uid}/${sheetId}/${pictureName}`;
    let newPath = path.join(
      currentDirectory,
      `public/users/${uid}/${sheetId}/`
    );
    let picturePath = newPath + pictureName;

    if (!fs.existsSync(newPath)) {
      {
        fs.mkdirSync(newPath, { recursive: true });
      }
    }

    fsExtra.copy(oldPath, picturePath, (err) => {
      if (err) {
        logger.error(JSON.stringify(err));
        return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
          message:
            "Error occured while duplicating transaction picture. Please try again later!",
        });
      }
      return sendResponse(res, httpCodes.OK, {
        message: "Successfully duplicated transaction picture",
        photoURL: photoURL,
      });
    });
  },
};
