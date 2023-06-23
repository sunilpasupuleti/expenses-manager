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
      if (!fs.existsSync(picturePath)) {
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
};
