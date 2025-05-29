const express = require("express");

const router = express.Router();

router.use("/bank-account", require("./bankAccountRoutes"));
router.use("/health", require("./healthCheckRoutes"));

module.exports = router;
