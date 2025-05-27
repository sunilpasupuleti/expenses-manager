const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const { database } = require("firebase-admin");
const moment = require("moment");
const _ = require("lodash");
const {
  sendResponse,
  httpCodes,
  decryptAES,
} = require("../../../helpers/utility");
const logger = require("../../../middleware/logger/logger");
const {
  PLAID_SETTINGS_KEYS,
  plaidClient,
} = require("../../../config/plaidConfig");

const {
  TRANSACTIONS,
  LINK_ACCOUNT,
  ACCOUNTS,
  ACCOUNT_BALANCE,
  UNLINK_ACCOUNT,
} = PLAID_SETTINGS_KEYS;

module.exports = {
  /**
   * Fetch Plaid Data
   */
  async getPlaidDashboardData(req, res) {
    try {
      const { fromDate, toDate } = req.body || {};

      const ref = database().ref("/admin/plaid");
      const snap = await ref.once("value");
      const data = snap.val() || {};
      const settings = data.settings || {};
      const logs = data.logs || {};
      const defaultSummary = data.summary || {};

      const filteredLogs = _.pickBy(logs, (_, date) => {
        return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
      });

      const summaryBase =
        fromDate && toDate
          ? _(filteredLogs)
              .values()
              .flatten()
              .groupBy("action")
              .mapValues((arr) => _.sumBy(arr, "count"))
              .mapKeys((_, key) => `${key}`)
              .value()
          : defaultSummary;

      const summary = {
        ...summaryBase,
        totalBalanceAndTransactionsAPICalls:
          (summaryBase.account_balance || 0) + (summaryBase.transactions || 0),
      };

      const logsGrouped = _.chain(filteredLogs)
        .entries()
        .map(([date, actions]) => ({
          date,
          actions: actions.map(({ action, count }) => ({ action, count })),
        }))
        .orderBy("date", "desc")
        .value();

      const chartData = logsGrouped.slice(0, 7).map((log) => {
        const row = { date: log.date };
        log.actions.forEach((a) => {
          row[a.action] = a.count;
        });
        return row;
      });

      const finalData = {
        summary,
        logsGrouped,
        chartData,
        settings,
      };
      return sendResponse(res, httpCodes.OK, {
        message: "Filtered Plaid Analytics",
        data: finalData,
      });
    } catch (error) {
      const errorMessage = logger.error(
        "Error getting analytics: " + error.message
      );
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: errorMessage,
      });
    }
  },

  /**
   * Update Plaid Settings
   */
  async updatePlaidSettings(req, res) {
    try {
      const { settings } = req.body || {};

      const ref = database().ref("/admin/plaid/settings");

      const allowedKeys = Object.values(PLAID_SETTINGS_KEYS);

      const cleanSettings = _.pick(settings, allowedKeys);

      const isEnabled = !!cleanSettings.enabled;

      if (!isEnabled) {
        _.assign(cleanSettings, {
          [LINK_ACCOUNT]: false,
          [UNLINK_ACCOUNT]: false,
          [ACCOUNT_BALANCE]: false,
          [TRANSACTIONS]: false,
          [ACCOUNTS]: false,
        });
      }
      await ref.update(cleanSettings);

      return sendResponse(res, httpCodes.OK, {
        message: "Plaid settings updated successfully",
      });
    } catch (error) {
      const errorMessage = logger.error(
        "Error updating plaid settings: " + error.message || error.toString()
      );
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: errorMessage,
      });
    }
  },

  /**
   * Update Webhook URL And Redirection Url
   */
  async updatePlaidUrls(req, res) {
    try {
      const { webhookUrl, OAuthRedirectionUrl } = req.body;
      await database().ref("/admin/plaid/settings/").update({
        webhook_url: webhookUrl,
        oauth_redirect_url: OAuthRedirectionUrl,
      });

      const usersSnap = await database().ref("/users").once("value");
      const users = usersSnap.val() || {};
      let updatedCount = 0;

      for (const [uid, userData] of Object.entries(users)) {
        const tokens = userData?.plaid?.accessTokens || [];

        for (const tokenObj of tokens) {
          try {
            const accessToken = decryptAES(tokenObj.token, uid);
            const encodedUid = encodeURIComponent(uid);
            const fullWebhookUrl = `${webhookUrl}?uid=${encodedUid}`;
            const response = await plaidClient.itemWebhookUpdate({
              access_token: accessToken,
              webhook: fullWebhookUrl,
            });
            updatedCount++;
          } catch (err) {
            logger.warn(`❌ Failed to update webhook for user ${uid}`, err);
          }
        }
      }

      return sendResponse(res, httpCodes.OK, {
        message: `✅ Webhook URL updated for ${updatedCount} access tokens.`,
      });
    } catch (error) {
      console.log(error);

      const errorMessage =
        error?.response?.data?.error_message ||
        "Update Webhook Failed: " + error.toString();
      logger.error("❌ updatePlaidUrls failed:", errorMessage);
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: errorMessage,
      });
    }
  },
};
