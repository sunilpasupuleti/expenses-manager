const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
module.exports = createLogger({
  transports: [
    new transports.DailyRotateFile({
      filename: "server_%DATE%",
      dirname: "logs",
      datePattern: "MMM_YYYY",
      level: "info",
      maxFiles: "1d",
      zippedArchive: true,
      extension: ".log",
    }),
    new transports.DailyRotateFile({
      filename: "error_%DATE%",
      dirname: "logs",
      datePattern: "MMM_YYYY",
      level: "error",
      extension: ".log",
      maxFiles: "1d",
    }),

    new transports.Console(),
  ],
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp({
      format: "MMM-DD-YYYY HH:mm:ss",
    }),
    format.align(),
    format.splat(),
    format.json(),
    format.printf(
      (info) =>
        `${info.level} : ${[info.timestamp]} : ${
          typeof info.message === "string"
            ? info.message
            : JSON.stringify(info.message)
        } `
    )
  ),
});
