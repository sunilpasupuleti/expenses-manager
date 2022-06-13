const dotenv = require("dotenv");
const crons = require("node-cron");
const axios = require("axios");
const firebaseadmin = require("firebase-admin");
const fs = require("fs");
const moment = require("moment");
const nodemailer = require("nodemailer");

dotenv.config();

var smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const tasks = [];

module.exports = {
  async cron() {
    firebaseadmin
      .firestore()
      .listCollections()
      .then((snapshots) => {
        snapshots.forEach(async (snaps) => {
          let collectionId = snaps["_queryOptions"].collectionId;
          firebaseadmin
            .firestore()
            .collection(collectionId)
            .onSnapshot((querySnapshot) => {
              let changes = querySnapshot.docChanges();
              for (let change of changes) {
                var data = change.doc.data();
                let dailyReminder = data.dailyReminder;
                if (change.doc.id === "user-data") {
                  if (dailyReminder && dailyReminder.enabled) {
                    scheduleDailyReminderNotification(data);
                    // console.log(moment(data.dailyReminder.at).format("HH:mm"));
                  }
                }
              }
            });
        });
      });

    scheduleDailyBackUpNotification();
  },
};

async function scheduleDailyBackUpNotification(data) {
  crons.schedule(
    "1 0 * * *", // daily at 12 am
    async () => {
      firebaseadmin
        .firestore()
        .listCollections()
        .then((snapshots) => {
          snapshots.forEach(async (snaps) => {
            let collectionId = snaps["_queryOptions"].collectionId;
            firebaseadmin
              .firestore()
              .collection(collectionId)
              .get()
              .then((data) => {
                let docs = data.docs;
                docs.forEach((d) => {
                  if (d.id === "user-data") {
                    let userData = d.data();
                    if (
                      userData.dailyBackup &&
                      userData.active &&
                      userData.fcmToken
                    ) {
                      sendDailyBackupNotification(userData);
                    }
                  }
                });
              });
          });
        });
    },
    {
      scheduled: true,
    }
  );
}

async function scheduleDailyReminderNotification(data) {
  let time = data.dailyReminder.at.split(":");
  let atHour = time[0];
  let atMinute = time[1];
  let task = crons.schedule(
    `${atMinute} ${atHour} * * *`, //every day
    async () => {
      sendDailyReminderNotification(data);
    },
    {
      scheduled: true,
    }
  );
  let alreadyExists = tasks.findIndex((t) => t.id === data.uid);
  if (alreadyExists >= 0) {
    removeAndDestoryTask(alreadyExists);
  }
  tasks.push({
    id: data.uid,
    task: task,
  });

  let taskExists = tasks.findIndex((t) => t.id === data.uid);
  if (taskExists >= 0 && data.active) {
    console.log(`Scheduled at - ${atHour} hours - ${atMinute} minutes`);
    console.log("-----------------------------------");
    tasks[taskExists].task.start();
  } else {
    console.log("destroying previous task due to logout of user....");
    console.log("-----------------------------------");
    removeAndDestoryTask(taskExists);
  }
}

const sendDailyReminderNotification = async (data) => {
  console.log(data.fcmToken);
  console.log("sending daily reminder notification..................");
  console.log("-----------------------------------");

  let token = data.fcmToken;
  let payload = {
    data: { type: "daily-reminder", uid: data.uid },
  };

  const presentTaskIndex = tasks.findIndex((t) => t.id === data.uid);
  firebaseadmin
    .messaging()
    .sendToDevice(token, payload, { priority: "high" })
    .then((r) => {
      let error = null;
      if (r.results[0] && r.results[0].error) {
        error = r.results[0].error;
      }
      if (error) {
        removeAndDestoryTask(presentTaskIndex);
        console.log(
          error.code,
          error.message,
          "error in sending daily reminder notification"
        );
        console.log("------------------------");
        var mailOptions = {
          subject: "Notification Failed Daily Reminder Expenses Manager",
          html: `
            <h3>Error in sending the daily reminder notification to the user with uid - ${
              data.uid
            } , ${data.email && "email - " + data.email} , ${
            data.displayName && "Name - " + data.displayName
          }</h3>
            <p>Fcm token : ${data.fcmToken}</p>
            <p>Reason is : ${error}</p>
            `,
        };
        onSendEmail(mailOptions);
      } else {
        console.log(r, "success");
        let messageId = r.results[0].messageId;

        var mailOptions = {
          subject: "Notification Delivered Daily Reminder Expenses Manager",
          html: `
            <h3>Daily reminder Notification was successfully delivered to the user with uid - ${
              data.uid
            } , ${data.email && "email - " + data.email} , ${
            data.displayName && "Name - " + data.displayName
          }</h3>
            <p>Fcm token : ${data.fcmToken}</p>
            <p>Success Message Id : ${messageId}</p>
            `,
        };
        onSendEmail(mailOptions);
        console.log("------------------------");
      }
    })
    .catch((err) => {
      removeAndDestoryTask(presentTaskIndex);

      var mailOptions = {
        subject: "Notification Failed Daily Reminder Expenses manager",
        html: `
          <h3>Error in sending the daily reminder notification </h3>
          <p>Reason is : ${err}</p>
          `,
      };
      onSendEmail(mailOptions);
      console.log(err, " error in sending the daily reminder notification");
    });
};

const sendDailyBackupNotification = async (data) => {
  console.log(data.fcmToken);
  console.log("sending daily backup notification..................");
  console.log("-----------------------------------");

  let token = data.fcmToken;
  let payload = {
    data: { type: "daily-backup", uid: data.uid },
  };

  firebaseadmin
    .messaging()
    .sendToDevice(token, payload, { priority: "high" })
    .then((r) => {
      let error = null;
      if (r.results[0] && r.results[0].error) {
        error = r.results[0].error;
      }
      if (error) {
        console.log(
          error.code,
          error.message,
          "error in sending daily backup notification"
        );
        console.log("------------------------");
        var mailOptions = {
          subject: "Notification Failed Daily Backup Expenses Manager",
          html: `
            <h3>Error in sending the daily backup notification to the user with uid - ${
              data.uid
            } , ${data.email && "email - " + data.email} , ${
            data.displayName && "Name - " + data.displayName
          }</h3>
            <p>Fcm token : ${data.fcmToken}</p>
            <p>Reason is : ${error}</p>
            `,
        };
        onSendEmail(mailOptions);
      } else {
        console.log(r, "success");
        let messageId = r.results[0].messageId;
        var mailOptions = {
          subject: "Notification Delivered Daily Backup Expenses Manager",
          html: `
            <h3>Daily Backup Notification was successfully delivered to the user with uid - ${
              data.uid
            } , ${data.email && "email - " + data.email} , ${
            data.displayName && "Name - " + data.displayName
          }</h3>
            <p>Fcm token : ${data.fcmToken}</p>
            <p>Success Message Id : ${messageId}</p>
            `,
        };
        onSendEmail(mailOptions);
        console.log("------------------------");
      }
    })
    .catch((err) => {
      var mailOptions = {
        subject: "Notification Failed Daily Backup Expenses manager",
        html: `
          <h3>Error in sending the daily backup notification </h3>
          <p>Reason is : ${err}</p>
          `,
      };
      onSendEmail(mailOptions);
      console.log(err, " error in sending the daily backup notification");
    });
};

const removeAndDestoryTask = (index) => {
  console.log("destroying task due to some reasons - " + tasks[index].id);
  console.log("-----------------------------------");
  tasks[index].task.stop();
  tasks.splice(index, 1);
};

const onSendEmail = (options) => {
  var mailOptions = {
    from: "contact@webwizard.in",
    to: "sunil.pandvd22@gmail.com",
    ...options,
  };

  smtpTransport.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err, "error in sending the mail");
    }
  });
};
