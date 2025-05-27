const mongoose = require("mongoose");
const { String, ObjectId } = mongoose.SchemaTypes;

const accountDeletionSchema = mongoose.Schema(
  {
    reason: { type: String, required: true },
    uid: { type: String, required: true },
    user: { type: ObjectId, ref: "Users" },
    status: {
      type: String,
      default: "pending",
      required: true,
      enum: ["pending", "deleted", "rejected"],
    },
    rejectedReason: { type: String },
    referenceData: { type: Object },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AccountDeletion", accountDeletionSchema);
