const { database } = require("firebase-admin");
const { sendResponse, httpCodes } = require("../../../helpers/utility");
const _ = require("lodash");
const { PLAID_SETTINGS_KEYS } = require("../../../config/plaidConfig");

module.exports = {
  async validateGetPlaidDashboardData(req, res, next) {
    try {
      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateUpdatePlaidUrls(req, res, next) {
    try {
      const { webhookUrl, OAuthRedirectionUrl } = req.body;
      if (!webhookUrl) {
        throw "Webhook Url Required";
      }
      if (!OAuthRedirectionUrl) {
        throw "OAuth Redirection Url Required";
      }
      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateUpdatePlaidSettings(req, res, next) {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== "object") {
        throw "Invalid or missing 'settings' object in request body.";
      }
      const validKeys = Object.values(PLAID_SETTINGS_KEYS);

      const unknownKeys = _.difference(_.keys(settings), validKeys);

      if (!_.isEmpty(unknownKeys)) {
        throw `Invalid setting keys: ${unknownKeys.join(", ")}`;
      }
      const invalid = _.pickBy(settings, (value, key) => {
        if (key === PLAID_SETTINGS_KEYS.MAX_LINKED_INSTITUTIONS) {
          return !_.isInteger(value) || value <= 0;
        } else if (key === PLAID_SETTINGS_KEYS.REFRESH_TRANSACTIONS_PER_DAY) {
          return !_.isInteger(value) || value <= 0;
        } else if (key === PLAID_SETTINGS_KEYS.ACCOUNT_BALANCE_PER_HOUR) {
          return !_.isInteger(value) || value <= 0;
        } else {
          return !_.isBoolean(value);
        }
      });

      if (!_.isEmpty(invalid)) {
        const invalidKeys = _.keys(invalid).join(", ");
        throw `Invalid values for: ${invalidKeys}. Booleans are required for toggle settings, and max_linked_institutions must be a positive integer.`;
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },
};
