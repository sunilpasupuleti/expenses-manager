const express = require("express");
const router = express.Router();

const { VerifyToken } = require("../helpers/AuthHelpers");
const { validateParamsObjectId } = require("../helpers/utility");
const {
  getBackups,
  getBackup,
  createBackup,
  createBackupTemp,
  dailyBackupFileUpload,
} = require("../controllers/backup/backupController");

router.post("/", VerifyToken, createBackup);

// to daily backup the data
router.post("/temp", VerifyToken, createBackupTemp);

router.get("/all", VerifyToken, getBackups);

router.get("/", VerifyToken, getBackup);

router.post("/upload", VerifyToken, dailyBackupFileUpload);

module.exports = router;
