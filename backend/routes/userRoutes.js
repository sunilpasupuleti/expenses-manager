const express = require("express");
const { VerifyToken } = require("../helpers/AuthHelpers");
const {
  saveUser,
  getUser,
  removeProfilePicture,
  updateProfilePicture,
} = require("../controllers/user/userController");
const {
  validateUpdateProfilePicture,
} = require("../controllers/user/userValidator");
const router = express.Router();

router.post("/", VerifyToken, saveUser);
router.get("/", VerifyToken, getUser);
router.delete("/remove-profile-picture", VerifyToken, removeProfilePicture);
router.put(
  "/update-profile-picture",
  VerifyToken,
  validateUpdateProfilePicture,
  updateProfilePicture
);

module.exports = router;
