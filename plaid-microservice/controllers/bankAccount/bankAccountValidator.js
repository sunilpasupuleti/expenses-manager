const { firebaseAdmin } = require("../../config/firebase");
const database = firebaseAdmin.database;
const {
  sendResponse,
  httpCodes,
  decryptAES,
} = require("../../helpers/utility");
const {
  PLAID_SETTINGS_KEYS,
  plaidClient,
} = require("../../config/plaidConfig");
const { getRedis } = require("../../config/redisConfig");
const moment = require("moment");

const {
  TRANSACTIONS,
  LINK_ACCOUNT,
  ACCOUNTS,
  ACCOUNT_BALANCE,
  UNLINK_ACCOUNT,
  MAX_LINKED_INSTITUTIONS,
  REFRESH_TRANSACTIONS_PER_DAY,
  ACCOUNT_BALANCE_PER_HOUR,
  ENABLED,
} = PLAID_SETTINGS_KEYS;

module.exports = {
  validateBankingAccess(actionKey) {
    const actionMessages = {
      [LINK_ACCOUNT]: "Linking bank accounts is currently disabled by admin.",
      [UNLINK_ACCOUNT]:
        "Unlinking bank accounts is currently disabled by admin.",
      [ACCOUNT_BALANCE]:
        "Fetching account balance is currently disabled by admin.",
      [TRANSACTIONS]: "Fetching transactions is currently disabled by admin.",
      [ACCOUNTS]: "Fetching linked accounts is currently disabled by admin.",
      [ENABLED]: "Banking service is currently disabled by admin.",
    };

    return async (req, res, next) => {
      try {
        const ref = database().ref("/admin/plaid/settings");
        const snap = await ref.once("value");
        const settings = snap.val() || {};

        if (!settings[PLAID_SETTINGS_KEYS.ENABLED]) {
          throw actionMessages[PLAID_SETTINGS_KEYS.ENABLED];
        }

        if (!settings[actionKey]) {
          throw (
            actionMessages[actionKey] ||
            `${actionKey} is currently disabled by admin.`
          );
        }

        if (actionKey === LINK_ACCOUNT && settings[MAX_LINKED_INSTITUTIONS]) {
          const maxAllowed = settings[MAX_LINKED_INSTITUTIONS];
          const uid = req.query.uid;
          if (uid) {
            const userSnap = await database()
              .ref(`/users/${uid}/plaid/accessTokens`)
              .once("value");
            const accessTokens = userSnap.val() || [];
            const uniqueInstitutions = new Set();
            for (const tokenObj of accessTokens) {
              try {
                const token = decryptAES(tokenObj.token, uid);
                const { data } = await plaidClient.accountsGet({
                  access_token: token,
                });
                const institutionId = data?.item?.institution_id;
                if (institutionId) uniqueInstitutions.add(institutionId);
              } catch (err) {}
            }
            if (uniqueInstitutions.size >= maxAllowed) {
              throw `You can only link ${maxAllowed} bank institutions! If you need additional access please contact support team`;
            }
          }
        }

        if (
          actionKey === TRANSACTIONS &&
          settings[REFRESH_TRANSACTIONS_PER_DAY]
        ) {
          const uid = req.user.uid;
          const refreshLimit = settings[REFRESH_TRANSACTIONS_PER_DAY];
          if (req.body?.refresh && uid) {
            const redis = await getRedis();
            const redisKey = `plaid:refresh_usage:${uid}:${moment().format(
              "YYYY-MM-DD"
            )}`;
            const currentCount = parseInt((await redis.get(redisKey)) || 0);
            if (currentCount >= refreshLimit) {
              throw `⚠️ You've reached the daily limit of ${refreshLimit} transaction refreshes. Please try again tomorrow.`;
            }
            await redis.set(redisKey, currentCount + 1, {
              EX: 24 * 60 * 60, //Expires in 24 hours
            });
          }
        }

        if (
          actionKey === ACCOUNT_BALANCE &&
          settings[ACCOUNT_BALANCE_PER_HOUR]
        ) {
          const uid = req.user.uid;
          const balanceLimit = settings[ACCOUNT_BALANCE_PER_HOUR];

          if (uid) {
            const redis = await getRedis();

            // Hourly limit key
            const hourlyKey = `plaid:balance_check:${uid}:${moment().format(
              "YYYY-MM-DD-HH"
            )}`;
            const hourlyCount = parseInt((await redis.get(hourlyKey)) || 0);

            if (hourlyCount >= balanceLimit) {
              throw `⚠️ You can only check account balance ${balanceLimit} times per hour. Please wait and try again later.`;
            }

            // Short burst limits (anti-spam)
            const minuteKey = `plaid:balance_burst:${uid}:${moment().format(
              "YYYY-MM-DD-HH-mm"
            )}`;
            const minuteLimit = 1;
            const minuteCount = parseInt((await redis.get(minuteKey)) || 0);

            if (minuteCount >= minuteLimit) {
              throw `⏱️ Too many balance checks in 1 minute. Please wait a moment.`;
            }
            // Increment usage counters
            await redis.set(hourlyKey, hourlyCount + 1, { EX: 60 * 60 }); // 1 hour
            await redis.set(minuteKey, minuteCount + 1, { EX: 60 }); // 1 min
          }
        }

        next();
      } catch (err) {
        return sendResponse(res, httpCodes.BAD_REQUEST, {
          message: err.toString(),
        });
      }
    };
  },

  async validateExchangeToken(req, res, next) {
    try {
      const { publicToken } = req.body;

      if (!publicToken) {
        throw "Plublic token is required";
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateGetAccountBalance(req, res, next) {
    try {
      const { accessToken, accountId } = req.body;

      if (!accessToken) {
        throw "Access token is required";
      }

      if (!accountId) {
        throw "Account Id is required";
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateUnlinkAccount(req, res, next) {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        throw "Access token is required";
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateGetTransactions(req, res, next) {
    try {
      const { accessToken, accountId, startDate, endDate } = req.body;

      if (!accessToken) {
        throw "Access token is required";
      }
      if (!accountId) {
        throw "Account Id is required";
      }
      if (!startDate) {
        throw "Start Date is required";
      }
      if (!endDate) {
        throw "End Date is required";
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validatePublicTokenWebhook(req, res, next) {
    try {
      const { uid } = req.query;
      const { public_tokens, link_session_id, webhook_code, webhook_type } =
        req.body;

      if (!uid) {
        throw "No uid found";
      }

      const userSnapshot = await database()
        .ref(`/users/${uid}/plaid`)
        .once("value");
      if (!userSnapshot.exists()) {
        throw "No User Found";
      }

      const userValue = userSnapshot.val();
      req.user = userValue;

      if (
        webhook_type === "LINK" &&
        webhook_code === "SESSION_FINISHED" &&
        (!public_tokens || public_tokens.length === 0)
      ) {
        throw "No Public Tokens Found";
      }

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },

  async validateLinkToken(req, res, next) {
    try {
      const { platform } = req.body;

      const allowedPlatforms = ["android", "ios"];
      if (!allowedPlatforms.includes(platform)) {
        throw "No Platform Specified Android or IOS";
      }

      const settingsSnap = await database()
        .ref("/admin/plaid/settings")
        .once("value");
      const settings = settingsSnap.val();
      const webhookUrl = settings?.webhook_url;
      const OAuthRedirectionUrl = settings?.oauth_redirect_url;
      if (!webhookUrl) {
        throw "❌ Webhook URL is not configured in admin settings.";
      }
      if (!OAuthRedirectionUrl) {
        throw "❌ OAuth Redirection URL is not configured in admin settings.";
      }
      req.urls = {
        webhookUrl,
        OAuthRedirectionUrl,
      };

      next();
    } catch (err) {
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: err.toString(),
      });
    }
  },
};
