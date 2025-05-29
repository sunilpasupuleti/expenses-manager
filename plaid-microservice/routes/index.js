const express = require("express");

const router = express.Router();

router.use("/bank-account", require("./bankAccountRoutes"));

module.exports = router;
