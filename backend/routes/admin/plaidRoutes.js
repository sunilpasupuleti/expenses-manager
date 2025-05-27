const express = require("express");
const { VerifyToken } = require("../../helpers/AuthHelpers");
const {
  validateGetPlaidDashboardData,
  validateUpdatePlaidSettings,
  validateUpdatePlaidUrls,
} = require("../../controllers/admin/plaid/plaidValidator");
const {
  getPlaidDashboardData,
  updatePlaidSettings,
  updatePlaidUrls,
} = require("../../controllers/admin/plaid/plaidController");

const router = express.Router();

router.route("/").post(validateGetPlaidDashboardData, getPlaidDashboardData);

router
  .route("/settings/")
  .post(validateUpdatePlaidSettings, updatePlaidSettings);

router.route("/url/").put(validateUpdatePlaidUrls, updatePlaidUrls);

module.exports = router;
