const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV], // Change to production when approved
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
        "Plaid-Version": "2020-09-14",
      },
    },
  })
);

const PLAID_SETTINGS_KEYS = {
  ENABLED: "enabled",
  LINK_ACCOUNT: "link_account",
  UNLINK_ACCOUNT: "unlink_account",
  ACCOUNT_BALANCE: "account_balance",
  TRANSACTIONS: "transactions",
  ACCOUNTS: "accounts",
  MAX_LINKED_INSTITUTIONS: "max_linked_institutions",
  REFRESH_TRANSACTIONS_PER_DAY: "refresh_transactions_per_day",
  ACCOUNT_BALANCE_PER_HOUR: "account_balance_per_hour",
};

module.exports = {
  plaidClient,
  PLAID_SETTINGS_KEYS,
};
