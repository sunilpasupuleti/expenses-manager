const express = require("express");
const { VerifyToken } = require("../helpers/AuthHelpers");
const {
  saveUser,
  getUser,
  removeProfilePicture,
  updateProfilePicture,
  uploadSheetDetailPicture,
  removeSheetDetailPicture,
  moveSheetDetailPicture,
  duplicateSheetDetailPicture,
  deleteSheet,
} = require("../controllers/user/userController");
const {
  validateUpdateProfilePicture,
  validateUploadSheetDetailPicture,
  validateMoveSheetDetailPicture,
  validateDuplicateSheetDetailPicture,
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
router.put(
  "/upload-sheet-detail-picture",
  VerifyToken,
  validateUploadSheetDetailPicture,
  uploadSheetDetailPicture
);
router.put(
  "/move-sheet-detail-picture",
  VerifyToken,
  validateMoveSheetDetailPicture,
  moveSheetDetailPicture
);

router.put(
  "/duplicate-sheet-detail-picture",
  VerifyToken,
  validateDuplicateSheetDetailPicture,
  duplicateSheetDetailPicture
);

router.put(
  "/remove-sheet-detail-picture",
  VerifyToken,
  removeSheetDetailPicture
);

router.delete("/delete-sheet/:sheetId", VerifyToken, deleteSheet);

module.exports = router;
