const { Types, Schema, default: mongoose } = require("mongoose");
const { ObjectId } = Types;

const usersSchema = new Schema(
  {
    displayName: { type: String },
    dailyReminder: {
      enabled: { type: Boolean, default: false },
      time: { type: String },
    },

    dailyBackup: { type: Boolean, default: true },
    autoFetchTransactions: { type: Boolean, default: true },

    email: { type: String },
    phoneNumber: { type: String },
    uid: { type: String },
    platform: { type: String },
    model: { type: String },
    brand: { type: String },
    baseCurrency: { type: String },

    fcmToken: { type: String, default: null },
    photoURL: { type: String },
    active: { type: Boolean, default: false },
    backups: [
      {
        type: ObjectId,
        ref: "Backups",
      },
    ],
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("Users", usersSchema);
