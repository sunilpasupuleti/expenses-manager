const { sendEmail } = require("../../../helpers/mailHelpers");
const { sendSMS } = require("../../../helpers/smsHelpers");
const logger = require("../../../middleware/logger/logger");
const momentTz = require("moment-timezone");

const ADMIN_REQUESTED_TID =
  process.env.ADMIN_ACCOUNT_DELETION_REQUEST_TEMPLATEID;
const REQUESTED_TID = process.env.ACCOUNT_DELETION_REQUESTED_TEMPLATEID;
const REJECTED_TID = process.env.ACCOUNT_DELETION_REJECTED_TEMPLATEID;
const DELETED_TID = process.env.ACCOUNT_DELETION_DELETED_TEMPLATEID;
const ADMIN_PHONE = process.env.ADMIN_PHONE;
const ADMIN_NAME = process.env.ADMIN_NAME;

async function notifyUserStatusChange({ status, user, rejectedReason = "" }) {
  const { email, phoneNumber, displayName, uid } = user;
  const timestamp = new Date().toISOString();

  const URL = `${process.env.FRONTEND_URL}/account-deletion/status`;
  const REQUEST_ID = `?id=${uid}`;
  const TRACK_URL = `${URL}${REQUEST_ID}`;

  let subject = "";
  let htmlMessage = "";
  let templateId = "";
  let variables = {
    user: displayName || "User",
  };
  if (["requested", "rejected"].includes(status)) {
    variables.link = URL;
    variables.requestId = REQUEST_ID;
  } else {
    variables.email = process.env.ADMIN_EMAIL;
  }

  if (status === "requested") {
    templateId = REQUESTED_TID;
    subject = "Account Deletion Request Received";
    htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #d9534f;">Account Deletion Request Received</h2>
      <p>Hello ${displayName || ""},</p>
      <p>We have received your account deletion request. Your request is currently <strong>in progress</strong>.</p>
      <p>We will notify you once there is any update regarding your request.</p>
      <p>You can also track your request status here:</p>
      <p><a href="${TRACK_URL}" style="color: #5bc0de; text-decoration: none; font-weight: bold;">
        Track Your Request</a></p>
      <br/>
       <p style="font-size: 12px; color: #888;">
        Email Sent (UTC Time): <strong>${timestamp}</strong>
       </p>
      <p>Thank you,<br/>Expenses Aura Support Team</p>
    </div>
    `;
  } else if (status === "rejected") {
    templateId = REJECTED_TID;
    subject = "Your Account Deletion Request Has Been Rejected";
    htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #d9534f;">Account Deletion Request Rejected</h2>
        <p>Hello ${displayName || "User"},</p>
        <p>We have reviewed your account deletion request and unfortunately, we were unable to process it due to the following reason:</p>
        <blockquote style="background: #f8d7da; padding: 10px; border-left: 4px solid #d9534f;">
            ${rejectedReason}
        </blockquote>
        <p>If you believe this is a mistake or need further clarification, please reach out to our support team.</p>
        <p>You can also track your request status here:</p>
        <p>
            <a href="${TRACK_URL}" 
               style="color: #5bc0de; text-decoration: none; font-weight: bold;">
                Track Your Request</a>
        </p>
        <br/>
        <p style="font-size: 12px; color: #888;">
        Email Sent (UTC Time): <strong>${timestamp}</strong>
        </p>
        <p>Thank you,<br/>Expenses Manager Support Team</p>
    </div>
    `;
  } else if (status === "deleted") {
    templateId = DELETED_TID;
    subject = "Your Account and Data Have Been Successfully Deleted";
    htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #28a745;">Your Account Has Been Closed</h2>
      <p>👋 Hello <strong>${displayName || "User"}</strong>,</p>
      <p>We want to confirm that your account has been <strong style="color: #28a745;">successfully closed</strong> as per your request.</p>
      <p>All associated data, including encrypted information, has been securely removed from our system. 🔒 This process is final and cannot be undone.</p>
      <p>Access to your account is no longer available, and any stored information has been erased from our records.</p>
      <br/>
      <p style="font-weight: bold; color: #ff9800;">😢 We’ll Miss You!</p>
      <p>If you choose to return in the future, you're always welcome to create a new account. 🚀</p>
      <br/>
      <p>If you did not request this action or need assistance, please <a href="mailto:support@expensesmanager.app" style="color: #5bc0de; text-decoration: none; font-weight: bold;">reach out to our support team</a>.</p>
      <br/>
      <p style="font-size: 12px; color: #888;">
        📅 Email Sent (UTC Time): <strong>${timestamp}</strong>
      </p>
      <p>Thank you,<br/>💙 <strong>Expenses Aura Support Team</strong></p>
    </div>
    `;
  }
  //Send sms to admin as well
  if (status === "requested") {
    sendSMS(ADMIN_PHONE, ADMIN_REQUESTED_TID, {
      name: ADMIN_NAME,
      user: uid,
      datetime:
        momentTz().tz("Asia/Kolkata").format("MMM DD, YYYY hh:mm A") + " IST",
    });
  }

  if (email) {
    try {
      await sendEmail(subject, htmlMessage, [email], true);
      logger.info(`Email sent for ${status} status to ${email}`);
    } catch (err) {
      logger.error("Email error: " + err.toString());
    }
  } else if (phoneNumber) {
    try {
      await sendSMS(phoneNumber, templateId, variables);
      logger.info(`SMS sent for ${status} status to ${phoneNumber}`);
    } catch (err) {
      logger.error("SMS error: " + err.toString());
    }
  }
}

module.exports = {
  notifyUserStatusChange,
};
