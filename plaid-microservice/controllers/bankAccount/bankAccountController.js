const {
  sendResponse,
  httpCodes,
  encryptAES,
  decryptAES,
} = require("../../helpers/utility");
const { firebaseAdmin } = require("../../config/firebase");
const database = firebaseAdmin.database;
const moment = require("moment");
const _ = require("lodash");
const {
  plaidClient,
  PLAID_SETTINGS_KEYS,
} = require("../../config/plaidConfig");

const { getRedis } = require("../../config/redisConfig");
const { PlaidEnvironments } = require("plaid");
const {
  notifyInactiveBankUser,
  notifyTransactionRefreshReady,
} = require("../../helpers/plaidNotificationHelper");

const { UNLINK_ACCOUNT, LINK_ACCOUNT, TRANSACTIONS, ACCOUNT_BALANCE } =
  PLAID_SETTINGS_KEYS;
const APP_PACKAGE_NAME = process.env.APP_PACKAGE_NAME;

function logPlaidUsage(uid, apiName, extraFields = {}, accessToken = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const today = nowIso.split("T")[0];
      // const today = "2025-03-25";

      // user specific logs
      const userRef = database().ref(`/users/${uid}/plaid`);
      const snap = await userRef.once("value");
      const existing = snap.val() || {};

      let updatedAccessTokens = existing.accessTokens || [];

      // when unlinking no need user level logs
      if (accessToken) {
        updatedAccessTokens = updatedAccessTokens.map((tokenObj) => {
          const decrypted = decryptAES(tokenObj.token, uid);
          if (decrypted === accessToken) {
            return {
              ...tokenObj,
              lastUsedAt: nowIso,
            };
          }
          return tokenObj;
        });
      }

      const usageLogs = existing.usageLogs || [];
      usageLogs.push({
        api: apiName,
        date: nowIso,
      });

      const trimmedLogs = usageLogs.slice(-20);
      const totalApiCalls = (existing.totalApiCalls || 0) + 1;

      const updatePayload = {
        accessTokens: updatedAccessTokens,
        usageLogs: trimmedLogs,
        totalApiCalls: totalApiCalls,
        lastApiUsed: apiName,
        lastUsedAt: nowIso,
      };

      if (!existing.createdAt) {
        updatePayload.createdAt = nowIso;
      }

      await userRef.update({
        ...updatePayload,
        ...extraFields,
      });

      // Admin level logs for analytics
      const adminRef = database().ref("/admin/plaid");
      const adminSnap = await adminRef.once("value");
      const adminData = adminSnap.val() || {};

      const logs = adminData.logs || {};
      const summary = adminData.summary || {};

      const todayLogs = logs[today] || [];

      const existingAction = todayLogs.find(
        (entry) => entry.action === apiName
      );
      if (existingAction) {
        existingAction.count += 1;
      } else {
        todayLogs.push({ action: apiName, count: 1 });
      }

      // Update summary
      const totalKey = `${apiName.replace(/-/g, "_")}`;

      if (apiName === UNLINK_ACCOUNT) {
        summary[LINK_ACCOUNT] = Math.max((summary[LINK_ACCOUNT] || 1) - 1, 0);
      }

      summary[totalKey] = (summary[totalKey] || 0) + 1;

      await adminRef.update({
        logs: {
          ...logs,
          [today]: todayLogs,
        },
        summary,
      });

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  /**
   * Generate a Link Token for the client
   */
  async createLinkToken(req, res) {
    try {
      const { webhookUrl, OAuthRedirectionUrl } = req.urls;

      const uid = req.user.uid;
      const { updateMode = false, accessToken = null, platform } = req.body;

      const mainUserSnapshot = await database()
        .ref(`/users/${uid}`)
        .once("value");
      const mainUserData = mainUserSnapshot.val() || {};
      const { email = "", phoneNumber = "" } = mainUserData;

      const userRef = await database().ref(`/users/${uid}/plaid`);
      const userSnapshot = await userRef.once("value");
      const userValue = userSnapshot.val() || {};
      let userToken = userValue?.userToken;
      if (!userToken) {
        const userTokenResponse = await plaidClient.userCreate({
          client_user_id: req.user.uid,
        });
        userToken = userTokenResponse.data.user_token;
        const encryptedToken = encryptAES(userToken, uid);
        await userRef.update({
          userToken: encryptedToken,
        });
        await logPlaidUsage(uid, "user_token", {
          createdAt: new Date().toISOString(),
        });
      } else {
        userToken = decryptAES(userToken, uid);
      }

      const userData = {
        client_user_id: uid,
      };
      if (email) {
        userData.email_address = email;
      }
      if (phoneNumber) {
        userData.phone_number = phoneNumber;
      }
      const fullWebhookUrl = `${webhookUrl}?uid=${encodeURIComponent(uid)}`;

      const updateRequest = updateMode && accessToken ? true : false;
      let requestPayload = {
        user: userData,
        client_id: uid,
        user_token: userToken,
        enable_multi_item_link: !updateRequest ? true : false, //multi item link not supported in update mode
        client_name: "Expenses Manager",
        webhook: fullWebhookUrl,
        products: ["transactions"],
        country_codes: ["US", "CA"],
        language: "en",
      };

      const isAndroid = platform === "android";
      const isIOS = platform === "ios";

      if (isAndroid) {
        requestPayload.android_package_name = APP_PACKAGE_NAME;
      } else if (isIOS) {
        requestPayload.redirect_uri = OAuthRedirectionUrl;
      }

      if (updateRequest) {
        requestPayload.access_token = accessToken;
        requestPayload.update = {
          account_selection_enabled: true,
        };
      }
      const response = await plaidClient.linkTokenCreate({
        ...requestPayload,
      });

      return sendResponse(res, httpCodes.OK, {
        message: "Multi Item Link Token Generated",
        linkToken: response.data.link_token,
      });
    } catch (error) {
      console.log(error?.response?.data || error);
      const errorMessage =
        error?.response?.data?.error_message ||
        "Failed to generate link token " + error.toString();
      console.error(errorMessage + " error in creating link token");
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: errorMessage,
      });
    }
  },

  /**
   * Exchange Public Token for Access Token
   */
  async publicTokenWebhookHandler(req, res) {
    try {
      const {
        webhook_code,
        webhook_type,
        public_tokens,
        link_session_id,
        error,
        item_id,
      } = req.body;
      const user = req.user;
      const uid = req.query.uid;
      const userRef = database().ref(`/users/${uid}/plaid`);
      console.log(webhook_code, webhook_type);

      if (
        webhook_type === "ITEM" &&
        webhook_code === "ERROR" &&
        error?.error_code === "ITEM_LOGIN_REQUIRED"
      ) {
        const redisKey = `plaid:item_login_required:${item_id}`;
        const redis = await getRedis();
        const isProcessed = await redis.get(redisKey);
        if (isProcessed) {
          throw "Duplicate ITEM_LOGIN_REQUIRED webhook ignored " + item_id;
        }
        await redis.set(redisKey, "1", { EX: 60 * 10 });
        const name = user?.displayName || "User";
        const institutionName = "a linked bank account";

        await notifyInactiveBankUser(
          uid,
          user.email,
          user.phoneNumber,
          name,
          [institutionName],
          0,
          "login"
        );

        return sendResponse(res, httpCodes.OK, {
          message: "Done Notifycing User about unlinked account",
        });
        // }
      } else if (
        webhook_type === "TRANSACTIONS" &&
        webhook_code === "DEFAULT_UPDATE"
      ) {
        const { item_id } = req.body;
        const snapshot = await database()
          .ref(`/users/${uid}/plaid/accessTokens`)
          .once("value");

        const accessTokens = snapshot.val() || [];
        let matchedToken = null;

        for (const tokenObj of accessTokens) {
          try {
            const token = decryptAES(tokenObj.token, uid);
            const { data } = await plaidClient.itemGet({ access_token: token });
            if (data.item.item_id === item_id) {
              matchedToken = token;
              break;
            }
          } catch (err) {
            console.warn("🔍 Failed to match item_id:", err?.message || err);
          }
        }
        let institutionName = "your bank";
        if (matchedToken) {
          try {
            const { data } = await plaidClient.accountsGet({
              access_token: matchedToken,
            });
            institutionName = data.item.institution_name || institutionName;
          } catch (err) {
            console.warn(
              "⚠️ Failed to get institution name:",
              err?.message || err
            );
          }
        }

        notifyTransactionRefreshReady(uid, institutionName);
        return sendResponse(res, httpCodes.OK, {
          message: "User has been notified about refreshed transactions",
        });
      } else if (
        webhook_type !== "LINK" ||
        webhook_code !== "SESSION_FINISHED"
      ) {
        throw {
          type: "INVALID_WEBHOOK",
          message: "Invalid webhook event " + webhook_code,
        };
      }

      // deduplication
      const redisKey = `plaid:session:${link_session_id}`;
      const redis = await getRedis();
      const isProcessed = await redis.get(redisKey);

      if (isProcessed) {
        console.warn(`Duplicate webhook ignored : ${link_session_id}`);
        return;
      }

      const existingData = user;
      let accessTokens = existingData?.accessTokens || [];

      const newAccountsToSave = [];
      const linkedInstitutions = new Set();
      let existingInsitutions = [];
      const skippedInstitutions = [];
      // Gather existing account signatures
      for (const tokenObj of accessTokens) {
        try {
          const token = decryptAES(tokenObj.token, uid);
          const { data } = await plaidClient.accountsGet({
            access_token: token,
          });
          const institutionId = data.item.institution_id;
          if (institutionId) existingInsitutions.push(institutionId);
        } catch (err) {
          console.warn("Failed to fetch existing accounts:", err.message);
        }
      }

      for (const publicToken of public_tokens) {
        try {
          const exchangeRes = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken,
          });

          const accessToken = exchangeRes.data.access_token;
          const { data } = await plaidClient.accountsGet({
            access_token: accessToken,
          });
          const institutionId = data.item.institution_id;
          const institutionName = data.item.institution_name || "Unknown Bank";
          // If this institution is already linked, remove old token(s)
          if (existingInsitutions.includes(institutionId)) {
            skippedInstitutions.push(institutionName);
            continue;
          }
          const encryptedAccessToken = encryptAES(accessToken, uid);
          newAccountsToSave.push({
            token: encryptedAccessToken,
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
          });
          linkedInstitutions.add(institutionName);
        } catch (err) {
          console.error(
            "Token exchange failed:",
            err?.response?.data || err.message
          );
        }
      }

      // Save new tokens
      let success = false;
      let messageParts = [];
      if (newAccountsToSave.length > 0) {
        accessTokens = [...accessTokens, ...newAccountsToSave];
        await userRef.update({ accessTokens });
        await logPlaidUsage(uid, LINK_ACCOUNT);
        success = true;
        const linked = [...linkedInstitutions];
        messageParts.push(
          `✅ Successfully linked ${
            linked.length > 1 ? "accounts" : "account"
          } from: ${linked.join(", ")}.`
        );
      }

      if (skippedInstitutions.length > 0) {
        skippedInstitutions.forEach((name) => {
          messageParts.push(
            `⚠️ ${name} is already linked. Please use 'Bank Details' screen to add more accounts.`
          );
        });
      }

      // Final message construction
      const finalMessage = messageParts.join("\n");

      // Always emit only once, after processing all tokens
      if (global.io) {
        global.io.emit(`plaid_linked_${uid}`, {
          success: success,
          message: finalMessage,
          accessTokens: success ? accessTokens : [],
        });
      }
      await redis.set(redisKey, "1", {
        EX: 60 * 5, // 5 minutes
      });

      return sendResponse(res, success ? httpCodes.OK : httpCodes.BAD_REQUEST, {
        accessTokens: success ? accessTokens : [],
        message: finalMessage,
      });
    } catch (error) {
      const webhookType = error?.type || null;
      const errorMessage =
        error?.response?.data?.error_message ||
        error?.message ||
        "Token Handler: " + error.toString();
      if (global.io && !webhookType) {
        global.io.emit(`plaid_linked_${req.query.uid || "unknown_user"}`, {
          success: false,
          message: errorMessage,
          accessTokens: [],
        });
      }
      console.error("webhook exchange failed " + errorMessage);
      if (webhookType !== "INVALID_WEBHOOK") {
        // sendErrorNotification(
        //   req.query.uid,
        //   "⛔ Unexpected Issue",
        //   errorMessage
        // );
      }
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: errorMessage,
      });
    }
  },

  /**
   * Fetch User Transactions
   */
  async getTransactions(req, res) {
    try {
      const { uid } = req.user;
      const {
        accessToken,
        accountId,
        startDate,
        endDate,
        offset = 0,
        count = 50,
        refresh,
      } = req.body;

      if (refresh) {
        await plaidClient.transactionsRefresh({
          access_token: accessToken,
        });
        return sendResponse(res, httpCodes.OK, {
          transactions: [],
          groupedTransactions: [],
          message:
            "🔁 Refresh request sent successfully. You'll be notified once the latest transactions are available.",
        });
      }

      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          account_ids: [accountId],
          count: Number(count),
          offset: Number(offset),
          include_original_description: true,
        },
      });

      const transactions = response.data.transactions || [];
      const groupedTransactions = _(transactions)
        .groupBy((tx) => moment(tx.date).format("MMM DD, YYYY"))
        .map((items, date) => ({
          title: date,
          data: items,
        }))
        .orderBy((group) => moment(group.title, "MMM DD, YYYY"), "desc")
        .value();

      await logPlaidUsage(uid, TRANSACTIONS, {}, accessToken);

      return sendResponse(res, httpCodes.OK, {
        transactions: transactions,
        groupedTransactions: groupedTransactions,
        message: "Fetched transactions successfully",
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error_message ||
        "Failed to get transactions " + error.toString();

      console.error("Error fetching transactions: " + errorMessage);
      return sendResponse(res, httpCodes.BAD_REQUEST, {
        message: errorMessage,
      });
    }
  },

  /**
   * Fetch Linked Bank Accounts
   */
  async getLinkedAccounts(req, res) {
    try {
      const { uid } = req.user;

      // Fetch access tokens from Firebase
      const snapshot = await database()
        .ref(`/users/${uid}/plaid/accessTokens`)
        .once("value");
      const accessTokens = snapshot.val() || [];

      let groupedAccounts = {};

      // Fetch all account details for each access token
      const accountPromises = accessTokens.map(async (accessToken) => {
        try {
          const decryptedAccessToken = decryptAES(accessToken.token, uid);
          const createdAt = accessToken.createdAt;

          let institutionId = "unknown";
          let institutionName = "Unknown Institution";
          let institutionLogo = null;
          let accounts = [];
          let needsUpdate = false;
          try {
            const accountResponse = await plaidClient.accountsGet({
              access_token: decryptedAccessToken,
            });
            institutionId = _.get(
              accountResponse,
              "data.item.institution_id",
              "Unknown"
            );
            accounts = accountResponse.data.accounts;
          } catch (error) {
            const errorCode = error?.response?.data?.error_code;
            const errorMessage = error?.response?.data?.error_message;
            if (errorCode === "ITEM_LOGIN_REQUIRED") {
              needsUpdate = true;
              institutionId = _.get(
                error,
                "response.data.item.institution_id",
                "Unknown"
              );
            } else {
              console.error("Error fetching accounts:", errorMessage);
              return;
            }
          }

          //  Fetch institution details even if login required
          try {
            const institutionResponse = await plaidClient.institutionsGetById({
              institution_id: institutionId,
              country_codes: ["US", "CA"],
              options: {
                include_optional_metadata: true,
              },
            });
            institutionName = _.get(
              institutionResponse,
              "data.institution.name",
              institutionName
            );

            institutionLogo = _.get(
              institutionResponse,
              "data.institution.logo",
              null
            );
          } catch (instError) {
            console.warn(
              `Failed to fetch institution details for ${institutionId}`
            );
          }

          // Group accounts under institutions
          groupedAccounts[institutionId] = groupedAccounts[institutionId] || {
            institutionId,
            institutionName,
            institutionLogo,
            accessToken: decryptedAccessToken,
            createdAt: createdAt,
            accounts: accounts,
            needsUpdate,
          };
        } catch (error) {
          console.log(error);

          console.error("Error fetching accounts:", error?.data?.message);
        }
      });

      await Promise.all(accountPromises); // Wait for all API requests

      const institutions = _.orderBy(_.values(groupedAccounts), ["createdAt"]);

      return sendResponse(res, httpCodes.OK, {
        institutions: institutions, // Convert object to array for easy frontend handling
        message: "Fetched linked accounts successfully",
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error_message ||
        "Failed to getting linked accounts " + error.toString();
      console.error("Error fetching linked accounts:", errorMessage);
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: errorMessage,
      });
    }
  },

  /**
   * Get account balance
   */
  async getAccountBalance(req, res) {
    try {
      const { accessToken, accountId } = req.body;
      const { uid } = req.user;
      const response = await plaidClient.accountsBalanceGet({
        access_token: accessToken,
        options: {
          account_ids: [accountId],
        },
      });
      const accountResponse = response?.data.accounts;

      if (!accountResponse || accountResponse.length === 0) {
        throw "Sorry we could not find your account";
      }

      await logPlaidUsage(uid, ACCOUNT_BALANCE, {}, accessToken);

      return sendResponse(res, httpCodes.OK, {
        account: accountResponse[0],
        message: "Fetched linked accounts successfully",
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error_message ||
        "Failed to fetch account balance " + error.toString();
      console.error("Error fetching account balance:", errorMessage);
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: errorMessage,
      });
    }
  },

  /**
   * Unlink account
   */
  async unlinkAccount(req, res) {
    try {
      const { uid } = req.user;
      const { accessToken } = req.body;

      await plaidClient.itemRemove({
        access_token: accessToken,
      });
      const userRef = database().ref(`/users/${uid}/plaid`);
      const snapshot = await userRef.once("value");
      const data = snapshot.val();
      const oldTokens = data?.accessTokens || [];
      const newTokens = _.filter(oldTokens, (tokenObj) => {
        return decryptAES(tokenObj.token, uid) !== accessToken;
      });

      await userRef.update({
        accessTokens: newTokens,
      });

      await logPlaidUsage(uid, UNLINK_ACCOUNT, {});

      return sendResponse(res, httpCodes.OK, {
        message: "Bank account successfully unlinked.",
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error_message ||
        "Failed to delete account " + error.toString();
      console.error("Error unlinking account:", errorMessage);
      return sendResponse(res, httpCodes.INTERNAL_SERVER_ERROR, {
        message: errorMessage,
      });
    }
  },
};
