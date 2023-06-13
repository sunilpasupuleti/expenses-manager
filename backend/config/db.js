const mongoose = require("mongoose");
const logger = require("../middleware/logger/logger");

module.exports = () => {
  const DATABASE =
    process.env.NODE_ENV === "production"
      ? process.env.MONGO_DATABASE_PRODUCTION
      : process.env.MONGO_DATABASE_DEV;
  mongoose.connect(
    String(process.env.MONGO_DATABASE_URL).replace("<database>", DATABASE),
    {}
  );
  const db = mongoose.connection;
  db.on("error", logger.error.bind(logger, " Connection Error : ")),
    db.once("open", () => {
      logger.info(`Database Connected (${db.name}) : ${db.host}`);
    });
};
