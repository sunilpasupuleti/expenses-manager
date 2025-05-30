const schedule = require("node-schedule");
const { firebaseAdmin } = require("../config/firebase");
const database = firebaseAdmin.database;
const moment = require("moment");
const path = require("path");
const fs = require("fs");
const { sendEmail } = require("./mailHelpers");
const { decryptAES } = require("./utility");
const { plaidClient } = require("../config/plaidConfig");
const { sendNotification } = require("./notificationHelpers");

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
    console.info(`📧 ${type} email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send email", err);
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

/**
 * 🔔 Notify user that their transactions are refreshed and ready
 */
async function notifyTransactionRefreshReady(
  uid,
  institutionName = "your bank",
  submittedNotification = false
) {
  try {
    const title = submittedNotification
      ? "📤 Transaction Refresh Submitted"
      : "✅ Transactions Updated";

    const message = submittedNotification
      ? `We’ve submitted a refresh request for your transactions from ${institutionName}. You’ll be notified once they’re updated.`
      : `We’ve successfully synced your latest transactions from ${institutionName}. Head over to your bank details to view the updated data.`;

    const notificationData = {
      uid,
      title,
      channelId: process.env.ONE_SIGNAL_DAILY_UPDATES_CHANNEL_ID,
      body: message,
      bigPictureUrl: "notification/transactions_ready.png",
      notificationData: {
        type: "transactions_ready",
        institution: institutionName,
      },
    };

    await sendNotification(notificationData);
    console.info(
      `📲 ${
        submittedNotification ? "Refresh submitted" : "Transactions ready"
      } notification sent to ${uid}`
    );
  } catch (err) {
    console.error("❌ Failed to send transactions ready notification", err);
  }
}

module.exports = { notifyInactiveBankUser, notifyTransactionRefreshReady };
