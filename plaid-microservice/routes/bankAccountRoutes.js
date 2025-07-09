const express = require("express");
const router = express.Router();

const {
  VerifyToken,
  VerifyPlaidWebhookSignature,
} = require("../helpers/AuthHelpers");
const {
  createLinkToken,
  getTransactions,
  publicTokenWebhookHandler,
  getLinkedAccounts,
  getAccountBalance,
  unlinkAccount,
  getAllRecurringTransactions,
} = require("../controllers/bankAccount/bankAccountController");
const {
  validateExchangeToken,
  validateGetTransactions,
  validatePublicTokenWebhook,
  validateGetAccountBalance,
  validateUnlinkAccount,
  validateBankingAccess,
  validateLinkToken,
} = require("../controllers/bankAccount/bankAccountValidator");
const { PLAID_SETTINGS_KEYS } = require("../config/plaidConfig");
const {
  TRANSACTIONS,
  LINK_ACCOUNT,
  ACCOUNTS,
  ACCOUNT_BALANCE,
  UNLINK_ACCOUNT,
} = PLAID_SETTINGS_KEYS;

router.post(
  "/link-token",
  VerifyToken,
  validateLinkToken,
  validateBankingAccess(LINK_ACCOUNT),
  createLinkToken
);

router.get(
  "/accounts",
  VerifyToken,
  validateBankingAccess(ACCOUNTS),
  getLinkedAccounts
);

router.post(
  "/transactions",
  VerifyToken,
  validateBankingAccess(TRANSACTIONS),
  validateGetTransactions,
  getTransactions
);

router.post(
  "/transactions/recurring",
  VerifyToken,
  validateBankingAccess(TRANSACTIONS),
  getAllRecurringTransactions
);

router.post(
  "/balance",
  VerifyToken,
  validateBankingAccess(ACCOUNT_BALANCE),
  validateGetAccountBalance,
  getAccountBalance
);

router.post(
  "/unlink",
  VerifyToken,
  validateBankingAccess(UNLINK_ACCOUNT),
  validateUnlinkAccount,
  unlinkAccount
);

router.post(
  "/publicTokenWebhook",
  VerifyPlaidWebhookSignature,
  validateBankingAccess(LINK_ACCOUNT),
  validatePublicTokenWebhook,
  publicTokenWebhookHandler
);

module.exports = router;
