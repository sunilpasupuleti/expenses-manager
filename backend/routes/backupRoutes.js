const express = require("express");
const router = express.Router();

const { VerifyToken } = require("../helpers/AuthHelpers");
const { validateParamsObjectId } = require("../helpers/utility");
const {
  getBackups,
  getBackup,
  createBackup,
} = require("../controllers/backup/backupController");

router.post("/", VerifyToken, createBackup);

router.get("/all", VerifyToken, getBackups);

router.get("/", VerifyToken, getBackup);

module.exports = router;
