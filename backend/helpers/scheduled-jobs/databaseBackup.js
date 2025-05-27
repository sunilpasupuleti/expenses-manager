const { database, storage } = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const schedule = require("node-schedule");
const logger = require("../../middleware/logger/logger");
const moment = require("moment");
const { sendEmail } = require("../mailHelpers");
const BUCKET_FOLDER = "admin/database_backups";
const BACKUP_PREFIX = "backup";
const MAX_DAYS = 7; // delete backups older than 7 days

const backupDatabase = async () => {
  try {
    const ref = database().ref("/");
    const snap = await ref.once("value");
    const data = snap.val();

    if (!data) throw new Error("No data found in database");

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${BACKUP_PREFIX}-${timestamp}.json`;
    const rootDir = process.cwd();
    const backupDir = path.join(rootDir, "database-backups");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const localPath = path.join(backupDir, filename);

    fs.writeFileSync(localPath, JSON.stringify(data, null, 2));

    const bucket = storage().bucket();
    await bucket.upload(localPath, {
      destination: `${BUCKET_FOLDER}/${filename}`,
      metadata: {
        contentType: "application/json",
      },
    });

    logger.info(`✅ Backup uploaded to Firebase Storage: ${filename}`);

    // Optionally delete local file after upload
    fs.unlinkSync(localPath);
    // Clean up old backups
    await deleteOldBackups(bucket);

    sendStatusBackup("success", {
      filename,
      date: timestamp,
    });
  } catch (error) {
    sendStatusBackup("error", {
      errorMessage: error.message || error.toString(),
    });
    logger.error("❌ Failed to back up database: " + error.message);
  }
};

const deleteOldBackups = async (bucket) => {
  const [files] = await bucket.getFiles({ prefix: BUCKET_FOLDER });

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - MAX_DAYS);
  const thresholdDateStr = moment(thresholdDate).format("YYYY-MM-DD");

  for (const file of files) {
    const fileName = path.basename(file.name);
    const match = fileName.match(/^backup-(\d{4}-\d{2}-\d{2})\.json$/);
    if (!match) continue;

    const fileDateStr = match[1];
    const fileDate = new Date(fileDateStr);
    const fileDateThresholdStr = moment(fileDate).format("YYYY-MM-DD");

    if (fileDateThresholdStr < thresholdDateStr) {
      await file.delete();
      logger.info(`🗑️ Deleted old backup: ${file.name}`);
    }
  }
};

const initializeDatabaseBackupJob = () => {
  // For testing: Run every minute -> "* * * * *"
  const cronExpression = "19 3 * * *";
  schedule.scheduleJob(cronExpression, () => {
    logger.info("⏰ Scheduled database backup triggered...");
    backupDatabase();
  });
};

const sendStatusBackup = async (status, options = {}) => {
  const rootDir = process.cwd();

  const templatePath = path.join(
    rootDir,
    "helpers/email-templates/backupStatus.html"
  );

  let html = fs.readFileSync(templatePath, "utf-8");

  const year = new Date().getFullYear();

  let subject = "";
  let statusClass = "";
  let statusTitle = "";
  let statusMessage = "";

  if (status === "success") {
    subject = "✅ Firebase Database Backup Successful";
    statusClass = "success";
    statusTitle = "Backup Completed Successfully!";
    statusMessage = `
        <strong>Backup File:</strong> ${options.filename}<br/>
        <strong>Date:</strong> ${options.date}
      `;
  } else {
    subject = "❌ Firebase Database Backup Failed";
    statusClass = "error";
    statusTitle = "Backup Failed!";
    statusMessage = `
        <strong>Reason:</strong> ${options.errorMessage || "Unknown Error"}<br/>
        <strong>Attempted On:</strong> ${moment().format("YYYY-MM-DD HH:mm:ss")}
      `;
  }

  html = html
    .replace(/{{year}}/g, year)
    .replace(/{{statusClass}}/g, statusClass)
    .replace(/{{statusTitle}}/g, statusTitle)
    .replace(/{{statusMessage}}/g, statusMessage);

  await sendEmail(
    subject,
    html,
    process.env.NOTIFY_ADMIN_EMAILS.split(","),
    true
  );
};

module.exports = { backupDatabase, initializeDatabaseBackupJob };
