const mongoose = require("mongoose");
const logger = require("../middleware/logger/logger");
const Users = require("../models/Users");
const { lowercase } = require("../helpers/typography");

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
    db.once("open", async () => {
      let superAdminExists = await Users.findOne({
        role: "admin",
      });

      if (!superAdminExists) {
        Users.create({
          name: process.env.ADMIN_NAME,
          email: lowercase(process.env.ADMIN_EMAIL),
          password: process.env.ADMIN_PASSWORD,
          role: "admin",
        })
          .then(() => {
            logger.info("Admin created successfully");
          })
          .catch((err) => console.log(err));
      }

      logger.info(`Database Connected (${db.name}) : ${db.host}`);
    });
};
