const schedule = require("node-schedule");
const { database } = require("firebase-admin");
const moment = require("moment");
const logger = require("../../middleware/logger/logger");
const path = require("path");
const fs = require("fs");
const { sendEmail } = require("../mailHelpers");
const { sendSMS } = require("../smsHelpers");
const { decryptAES } = require("../utility");
const { plaidClient } = require("../../config/plaidConfig");
const { sendNotification } = require("../notificationHelpers");

const INACTIVE_BANK_ACCOUNT_NOTICE_TID =
  process.env.INACTIVE_BANK_ACCOUNT_NOTICE_TEMPLATEID;
const INACTIVE_BANK_ACCOUNT_FINAL_NOTICE_TID =
  process.env.INACTIVE_BANK_ACCOUNT_FINAL_NOTICE_TEMPLATEID;
const INACTIVITY_DAYS = 25;
const UNLINK_DAYS = 30;

const TEMPLATE_PATH = path.join(
  require.main.path,
  "helpers/email-templates/inactiveBankAccountNotice.html"
);

// 🔁 Helper to render template with data
function renderEmailTemplate(
  name,
  daysDiff,
  type = "inactive",
  institutions = []
) {
  const raw = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  let title = "";
  let message = "";

  switch (type) {
    case "final":
      title = "⚠️ Your bank account has been unlinked";
      message = `Your linked bank accounts were inactive for <strong>${daysDiff} days</strong> and have been <strong>automatically unlinked</strong> for your security.`;
      break;
    case "login":
      title = "🔐 Action Required: Re-authentication Needed";
      message =
        "One or more of your linked bank accounts require <strong>re-authentication</strong>. Please log in again to continue syncing your data.";
      break;
    default:
      title = "⚠️ Your bank account is inactive";
      message = `We noticed you haven't used your linked bank accounts in <strong>${daysDiff} days</strong>. If this inactivity continues, they will be unlinked after ${UNLINK_DAYS} days.`;
  }

  const institutionList = institutions.join(", ");

  return raw
    .replace(/{{name}}/g, name)
    .replace(/{{title}}/g, title)
    .replace(/{{message}}/g, message)
    .replace(/{{institutions}}/g, institutionList);
}

// 📱 Reusable function to send Email
async function sendInactivityEmail(
  email,
  name,
  daysDiff,
  type = "inactive", //inactive , final or login
  institutions = []
) {
  try {
    const html = renderEmailTemplate(name, daysDiff, type, institutions);
    let subject = "";
    switch (type) {
      case "final":
        subject =
          "Update: Linked bank accounts were unlinked due to inactivity";
        break;
      case "login":
        subject = "Action Required: Bank Login Needed";
        break;
      default:
        subject = "Reminder: Your linked bank accounts are inactive";
        break;
    }

    await sendEmail(subject, html, [email], true);
    logger.info(`📧 ${type} email sent to ${email}`);
  } catch (err) {
    logger.error("❌ Failed to send email", err);
  }
}

async function sendInactivityNotification(uid, institutions, days, type) {
  let title = "";
  let message = "";
  let image = "";
  switch (type) {
    case "final":
      title = "🔒 Bank Accounts Unlinked";
      message = `Your linked bank accounts were inactive for ${days} days and were automatically unlinked.`;
      image = "notification/bank_inactivity.png";
      break;

    case "login":
      title = "🔐 Bank Login Required";
      message = `We've lost connection to your linked bank accounts. Please re-authenticate to continue receiving updates.`;
      image = "notification/bank_login_required.png";
      break;

    default: // "inactive"
      title = "⏳ Bank Accounts Inactive";
      message = `You haven't used your bank accounts in ${days} days. They will be unlinked after ${UNLINK_DAYS} days of inactivity.`;
      image = "notification/bank_inactivity.png";
      break;
  }

  const institutionList = institutions.join(", ");
  const notificationData = {
    uid,
    title,
    channelId: process.env.ONE_SIGNAL_DAILY_UPDATES_CHANNEL_ID,
    body: `${message} (${institutionList})`,
    bigPictureUrl: image,
    notificationData: {
      type: "bank_inactivity",
      institutions,
      status: type,
    },
  };

  await sendNotification(notificationData);
}

async function sendInactivitySMS() {}

async function detectInactivePlaidUsers() {
  try {
    const now = moment.utc().startOf("day");
    const usersSnap = await database().ref("/users").once("value");
    const users = usersSnap.val() || {};

    for (const [uid, user] of Object.entries(users)) {
      const { plaid, email, phoneNumber, displayName = "User" } = user;
      if (!plaid?.accessTokens?.length) continue;

      const tokensToKeep = [];
      const warnInstitutions = new Set();
      const unlinkInstitutions = new Set();

      for (const tokenObj of plaid.accessTokens) {
        const token = decryptAES(tokenObj.token, uid);
        const lastUsed = moment
          .utc(tokenObj.lastUsedAt || "2000-01-01")
          .startOf("day");
        const daysDiff = now.diff(lastUsed, "days");
        console.log(lastUsed, daysDiff);

        try {
          const { data } = await plaidClient.accountsGet({
            access_token: token,
          });
          const name = data.item.institution_name || "Unknown Bank";

          if (daysDiff >= UNLINK_DAYS) {
            await unlinkToken(uid, token, name, unlinkInstitutions);
          } else if (daysDiff >= INACTIVITY_DAYS) {
            warnInstitutions.add(name);
            tokensToKeep.push(tokenObj);
          } else {
            tokensToKeep.push(tokenObj);
          }
        } catch (err) {
          const code = err?.response?.data?.error_code;
          const name =
            err?.response?.data?.item?.institution_name || "Unknown Bank";

          if (code === "ITEM_LOGIN_REQUIRED" && daysDiff >= UNLINK_DAYS) {
            await unlinkToken(uid, token, name, unlinkInstitutions);
          } else {
            tokensToKeep.push(tokenObj); // Retain token on unknown error or before unlink threshold
          }
        }
      }

      await database()
        .ref(`/users/${uid}/plaid/accessTokens`)
        .set(tokensToKeep);

      const maxDays = Math.max(
        ...plaid.accessTokens.map((t) =>
          now.diff(moment.utc(t.lastUsedAt || "2000-01-01"), "days")
        )
      );

      if (unlinkInstitutions.size)
        await notifyInactiveBankUser(
          uid,
          email,
          phoneNumber,
          displayName,
          [...unlinkInstitutions],
          maxDays,
          "final"
        );
      else if (warnInstitutions.size)
        await notifyInactiveBankUser(
          uid,
          email,
          phoneNumber,
          displayName,
          [...warnInstitutions],
          maxDays,
          "inactive"
        );
    }

    logger.info("✅ Finished processing inactive Plaid users");
  } catch (err) {
    logger.error("❌ detectInactivePlaidUsers failed:", err);
  }
}

// ⛔ Unlink Helper
async function unlinkToken(uid, token, institutionName, trackerSet) {
  try {
    await plaidClient.itemRemove({ access_token: token });
    trackerSet.add(institutionName);
    logger.info(`✅ Unlinked token (${institutionName}) for ${uid}`);
  } catch (err) {
    logger.warn(
      `❌ Failed to unlink token (${institutionName}) for ${uid}`,
      err
    );
  }
}

// 📩 Notify Helper
async function notifyInactiveBankUser(
  uid,
  email,
  phone,
  name,
  institutions,
  days,
  type = "inactive"
) {
  sendInactivityNotification(uid, institutions, days, type);
  if (email) {
    await sendInactivityEmail(email, name, days, type, institutions);
  } else if (phone) {
    await sendInactivitySMS(phone, name, days, type);
  }
}

// ⏰ Schedule: Run every day at 2:00 AM
function scheduleInactivePlaidUsers() {
  const rule = new schedule.RecurrenceRule();
  rule.second = new schedule.Range(0, 59, 38); // Every 20 seconds

  // schedule.scheduleJob(rule, detectInactivePlaidUsers);
  schedule.scheduleJob("0 2 * * *", detectInactivePlaidUsers); // every day at 2 AM
  console.log("📆 Scheduled inactive user detection job (daily @ 2AM)");
}

module.exports = { scheduleInactivePlaidUsers, notifyInactiveBankUser };
