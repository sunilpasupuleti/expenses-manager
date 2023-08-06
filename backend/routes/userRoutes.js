const express = require("express");
const { VerifyToken } = require("../helpers/AuthHelpers");
const { saveUser, getUser } = require("../controllers/user/userController");
const router = express.Router();

router.post("/", VerifyToken, saveUser);
router.get("/", VerifyToken, getUser);

module.exports = router;
