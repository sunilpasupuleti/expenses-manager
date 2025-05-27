const express = require("express");
const { VerifyToken } = require("../../helpers/AuthHelpers");
const { getUsers } = require("../../controllers/admin/user/userController");

const router = express.Router();

router.route("/:version").get(getUsers);

module.exports = router;
