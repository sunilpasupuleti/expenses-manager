import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  EventType,
} from '@notifee/react-native';
import {colors} from '../../infrastructure/theme/colors';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import {BACKEND_URL} from '../../../config';
import {Platform} from 'react-native';

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
  let title = message.data?.title;
  let body = message.data?.body;
  let backupSuccessTitle = message.data?.backupSuccessTitle;
  let backupSuccessBody = message.data?.backupSuccessBody;

  let backupFailedTitle = message.data?.backupFailedTitle;
  let backupFailedBody = message.data?.backupFailedBody;

  if (type && type === 'daily-reminder') {
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
    showNotification(title, body, 'daily-reminder', false, type, actions);
  }

  if (type && type === 'daily-update') {
    let actions = [];
    showNotification(title, body, 'daily-update', false, type, actions);
  }

  if (type && type === 'daily-backup') {
    let value = await AsyncStorage.getItem(`@expenses-manager-data-${uid}`);
    value = JSON.parse(value);
    // Encrypt
    if (!value) {
      showNotification(
        'No Data',
        'There is no data to backup.',
        'daily-backup-success',
        false,
        type,
      );
      return;
    }

    showNotification(title, body, 'daily-backup', true, type);

    let jwtToken = await auth().currentUser.getIdToken();

    axios
      .post(BACKEND_URL + '/backup', value, {
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      })
      .then(ref => {
        cancelNotification('daily-backup');
        showNotification(
          backupSuccessTitle,
          backupSuccessBody,
          'daily-backup-success',
          false,
          type,
        );
        console.log('data backed up successfully');
      })
      .catch(err => {
        cancelNotification('daily-backup');
        showNotification(
          backupFailedTitle,
          backupFailedBody,
          'daily-backup-failed',
          false,
          type,
        );
        console.log(err, ' error while backing up data');
      });
  }
}

const showNotification = (
  title,
  body,
  id,
  ongoing = false,
  type,
  actions = [],
) => {
  notifee.displayNotification({
    title: title,
    id: id,
    body: body,
    android: {
      channelId: 'transactions-reminder',
      sound: 'notification',
      color: colors.brand.primary,
      ongoing: ongoing,
      largeIcon:
        type && type === 'daily-update'
          ? require('../../../assets/mike.png')
          : require('../../../assets/wallet.jpeg'),
      actions: actions,
      pressAction: {
        id: 'default',
      },
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
  notifee
    .cancelNotification(id)
    .catch(err => console.log('Error in cancelling notification ', err));
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
