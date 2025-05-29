const express = require("express");

const router = express.Router();

router.use("/user", require("./userRoutes"));
router.use("/notification", require("./notificationRoutes"));
router.use("/backup", require("./backupRoutes"));
router.use("/admin", require("./admin/adminRoutes"));

module.exports = router;
