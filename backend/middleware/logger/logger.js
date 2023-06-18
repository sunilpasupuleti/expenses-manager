const path = require("path");
const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const moment = require("moment");

const timezoned = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Calcutta",
  });
};

const myCustomLevels = {
  colors: {
    info: "blue",
    error: "red",
  },
};

const fileDateFormat = moment().format("MM-DD-YYYY");

let metadata;
let customTransports;

const customFormat = format.printf(({ level, message, label, timestamp }) => {
  // return `${timestamp} [${level}] service : ${metadata.service}, version : ${metadata.version},  Message :  ${message}`;
  return `${timestamp} [${level}]  Message :  ${message}`;
});

let formats = format.combine(
  format.errors({ stack: true }),
  format.timestamp({
    format: timezoned,
  }),
  format.splat(),
  customFormat
  // format.json()
);

if (process.env.NODE_ENV === "production") {
  metadata = {
    service: "expenses-manager",
    version: "v1",
  };
  customTransports = [
    new transports.DailyRotateFile({
      filename: path.join(process.env.LOGPATH, "/error-%DATE%"),
      dirname: "logs",
      datePattern: fileDateFormat,
      level: "error",
      extension: ".log",
      maxFiles: "1d",
    }),

    new transports.DailyRotateFile({
      filename: path.join(process.env.LOGPATH, "/debug-%DATE%"),
      datePattern: fileDateFormat,
      dirname: "logs",
      maxFiles: "1d",
      extension: ".log",
      level: "debug",
      zippedArchive: true,
    }),
    new transports.Console({
      format: format.combine(format.colorize(), customFormat),
    }),
  ];
} else {
  metadata = {
    service: "expenses-manager",
    version: "v1",
  };

  customTransports = [
    // new transports.DailyRotateFile({
    //   filename: path.join(process.env.LOGPATH, "/debug-%DATE%"),
    //   datePattern: fileDateFormat,
    //   dirname: "logs",
    //   maxFiles: "1d",
    //   extension: ".log",
    //   level: "debug",
    //   zippedArchive: true,
    // }),
    // new transports.DailyRotateFile({
    //   filename: path.join(process.env.LOGPATH, "/error-%DATE%"),
    //   datePattern: fileDateFormat,
    //   dirname: "logs",
    //   maxFiles: "1d",
    //   extension: ".log",
    //   level: "error",
    //   zippedArchive: true,
    // }),
    new transports.Console({
      format: format.combine(format.colorize(), customFormat),
    }),
  ];
}
const logger = createLogger({
  level: "debug",
  format: formats,
  defaultMeta: metadata,
  transports: customTransports,
});

module.exports = logger;
