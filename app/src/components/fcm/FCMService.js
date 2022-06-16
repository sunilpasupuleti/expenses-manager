import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  TriggerType,
  EventType,
  RepeatFrequency,
} from '@notifee/react-native';
import {colors} from '../../infrastructure/theme/colors';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

const date = new Date(Date.now());
date.setHours(14);
date.setMinutes(26);
const trigger = {
  type: TriggerType.TIMESTAMP,
  timestamp: date.getTime(),
  repeatFrequency: RepeatFrequency.DAILY,
  alarmManager: {
    allowWhileIdle: true,
  },
};

notifee.onForegroundEvent(event => {
  //   console.log('Foreground event', event);
  console.log('Foreground event');
});

notifee.onBackgroundEvent(async ({type, detail}) => {
  console.log('onBackgroundEvent');
  //   console.log('Background', {type, detail});

  const {notification, pressAction} = detail;
  //   console.log('notification', detail);

  if (type === EventType.ACTION_PRESS && pressAction.id === 'no') {
    await notifee.cancelNotification(notification.id);
    console.log('Notification Cancelled', pressAction?.id);
  }
});

notifee.registerForegroundService(notification => {
  return new Promise(resolve => {
    async function stopService(id) {
      console.warn('Stopping service, using notification id: ' + id);
      if (id) {
        await notifee.cancelNotification(id).then(r => console.log(r));
      }
      return resolve();
    }

    async function handleStopActionEvent({type, detail}) {
      if (detail?.pressAction?.id === 'no') {
        console.log('Stop action was pressed');
        await stopService(detail.notification?.id);
      }
    }

    notifee.onForegroundEvent(handleStopActionEvent);
    notifee.onBackgroundEvent(handleStopActionEvent);
  });
});

notifee.requestPermission({
  sound: false,
  announcement: true,
  inAppNotificationSettings: false,
});

notifee.createChannel({
  id: 'transactions-reminder',
  name: 'Transactions Reminder',
  importance: AndroidImportance.HIGH,
  sound: 'notification',
  vibration: true,
  vibrationPattern: [300, 500],
});

notifee.getNotificationSettings().then(settings => {
  if (settings.android.alarm == AndroidNotificationSetting.ENABLED) {
  } else {
    notifee.openAlarmPermissionSettings();
  }
});

export async function onMessageReceived(message) {
  let type = message.data.type;
  let uid = message.data?.uid;
  if (type && type === 'daily-reminder') {
    let title = 'Reminder 🔔';
    let body = `Have you recorded your  transactions.. 🤔? 
If not 😕 do it now.`;
    let actions = [
      {
        title: 'Yes',
        pressAction: {id: 'default'},
      },
      {
        title: 'No',
        pressAction: {id: 'no'},
      },
    ];
    showNotification(title, body, 'daily-reminder', false, actions);
  }

  if (type && type === 'daily-backup') {
    let title = 'Back Up 🔄';
    let body = `Please wait while we are backing up your data......`;

    let successTitle = 'Back up successfull 🥰';
    let successBody = 'Your data backed up safely ❤️';

    let failedTitle = 'Sorry ! Back up failed 😥';
    let failedBody = 'In case of backup failure, do it manually in the app.';

    showNotification(title, body, 'daily-backup', true);
    let value = await AsyncStorage.getItem(`@expenses-manager-data-${uid}`);
    value = JSON.parse(value);
    if (!value) {
      cancelNotification('daily-backup');
      showNotification(
        'No Date',
        'There is not data to backup.',
        'daily-backup-success',
        false,
      );
      return;
    }

    await firestore()
      .collection(uid)
      .get()
      .then(async data => {
        if (data.docs && data.docs.length > 0) {
          let initialLength = 10;
          // let presentLength = data.docs.length;
          let docs = [];
          data.docs.filter(d => {
            if (d.id !== 'user-data') {
              docs.push(moment(d.id).format('YYYY-MM-DD A hh:mm:ss'));
            }
          });
          docs.sort();
          let toDeleteLength = Math.abs(initialLength - docs.length);
          if (docs.length > initialLength) {
            for (let i = 0; i < toDeleteLength; i++) {
              let doc;
              data.docs.filter(d => {
                if (docs[i] === moment(d.id).format('YYYY-MM-DD A hh:mm:ss')) {
                  doc = d;
                }
              });
              await doc.ref.delete();
            }
          }
        }
      })
      .catch(err => {
        showNotification(failedTitle, failedBody, 'daily-backup-failed', false);
        cancelNotification('daily-backup');

        console.log(
          'error in deleting previous documents - from daily backup',
          err,
        );
      });

    await firestore()
      .collection(uid)
      .doc(moment().format('DD MMM YYYY hh:mm:ss a'))
      .set(value)
      .then(ref => {
        cancelNotification('daily-backup');
        showNotification(
          successTitle,
          successBody,
          'daily-backup-success',
          false,
        );
        console.log('data backed up successfully');
      })
      .catch(err => {
        cancelNotification('daily-backup');
        showNotification(failedTitle, failedBody, 'daily-backup-failed', false);
        console.log(err, ' error while backing up data');
      });
  }
}

const showNotification = (title, body, id, ongoing = false, actions = []) => {
  notifee.displayNotification({
    title: title,
    id: id,
    body: body,
    android: {
      channelId: 'transactions-reminder',
      sound: 'notification',
      color: colors.brand.primary,
      ongoing: ongoing,
      largeIcon: require('../../../assets/wallet.jpeg'),
      actions: actions,
    },
    ios: {
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
    },
  });
};

const cancelNotification = id => {
  notifee.cancelNotification(id);
};

async function onAppBootstrap() {
  // Register the device with FCM
  await messaging().requestPermission();
  let result = messaging().isDeviceRegisteredForRemoteMessages;

  if (!result) {
    await messaging()
      .registerDeviceForRemoteMessages()
      .then(r => {
        getToken();
      })
      .catch(err => {
        console.log(err, 'error in registering app token', err);
      });
  } else {
    getToken();
  }
}

const getToken = async () => {
  // Get the token
  const token = await messaging().getToken();
  console.log(token, 'fcm token');
  return token;
};

onAppBootstrap();

messaging().onMessage(onMessageReceived);
messaging().setBackgroundMessageHandler(onMessageReceived);
