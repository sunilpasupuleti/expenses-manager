const mongoose = require("mongoose");

const backUpsTempSchema = mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "Users" },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("BackupsTemp", backUpsTempSchema);
