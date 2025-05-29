// config/firebase.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const { initializeApp, cert } = require("firebase-admin/app");
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const serviceAccountJSON = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
  );

  initializeApp({
    credential: cert(serviceAccountJSON),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

module.exports = {
  firebaseAdmin: admin,
};
