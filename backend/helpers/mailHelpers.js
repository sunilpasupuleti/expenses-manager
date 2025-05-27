const nodemailer = require("nodemailer");

let transportOptions = {
  host: process.env.SMTP_HOST,
  port: 587,
  // port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
};

const sendEmail = async (
  subject = "",
  message = "",
  recipients = [],
  html = false
) => {
  return new Promise((resolve, reject) => {
    try {
      let mailOptions = {
        from: `SUPPORT EXPENSES MANAGER <${process.env.SMTP_FROM}>`,
        to: recipients,
        subject: subject,
        [html ? "html" : "text"]: message,
      };
      smtpTransport.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error, "Mail sent error");

          reject(error);
        } else {
          console.log(info, "Mail sent Information");

          resolve(info);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

const smtpTransport = nodemailer.createTransport(transportOptions);

module.exports = {
  transportOptions,
  smtpTransport,
  sendEmail,
};
