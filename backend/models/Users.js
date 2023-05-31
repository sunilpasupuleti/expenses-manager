const mongoose = require("mongoose");
const { String, Number, Boolean, Date, ObjectId } = mongoose.SchemaTypes;

const usersSchema = mongoose.Schema(
  {
    displayName: { type: String },
    dailyReminder: {
      enabled: { type: Boolean, default: false },
      time: { type: String },
    },

    email: { type: String },
    uid: { type: String },
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
