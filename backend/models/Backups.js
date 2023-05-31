const mongoose = require("mongoose");

const backUpsSchema = mongoose.Schema(
  {},
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("Backups", backUpsSchema);
