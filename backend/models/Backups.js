const mongoose = require("mongoose");
const { String, Number, Boolean, Date, ObjectId } = mongoose.SchemaTypes;

const backUpsSchema = mongoose.Schema(
  {},
  {
    timestamps: true,
    strict: false,
  }
);

const Backups = mongoose.model("Backups", backUpsSchema);

module.exports = Backups;
