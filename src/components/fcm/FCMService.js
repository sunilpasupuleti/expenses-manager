import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  TriggerType,
  EventType,
  RepeatFrequency,
} from '@notifee/react-native';
import {colors} from '../../infrastructure/theme/colors';
import messaging from '@react-native-firebase/messaging';

const date = new Date(Date.now());
date.setHours(23);
date.setMinutes(21);
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
    console.log('pressed no');
    await notifee.cancelNotification(notification.id);
    console.warn('Notification Cancelled', pressAction?.id);
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

export const showDailyNotification = async () => {
  notifee.createTriggerNotification(
    {
      title: 'Reminder 🔔',
      subtitle: '',
      body: `Have you recorded your  transactions.. 🤔? 
If not 😕 do it now.`,
      android: {
        channelId: 'transactions-reminder',
        color: colors.brand.primary,
        largeIcon: require('../../../assets/wallet.jpeg'),
        fullScreenAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Yes',
            pressAction: {id: 'yes'},
          },
          {
            title: 'No',
            pressAction: {id: 'no'},
          },
        ],
      },
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    },
    trigger,
  );
};

export async function onMessageReceived(message) {
  let type = message.data.type;
  if (type && type === 'daily-reminder') {
    notifee.displayNotification({
      title: 'Reminder 🔔',
      subtitle: '',
      body: `Have you recorded your  transactions.. 🤔? 
    If not 😕 do it now.`,
      android: {
        channelId: 'transactions-reminder',
        sound: 'notification',
        color: colors.brand.primary,
        largeIcon: require('../../../assets/wallet.jpeg'),
        fullScreenAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Yes',
            pressAction: {id: 'default'},
          },
          {
            title: 'No',
            pressAction: {id: 'no'},
          },
        ],
      },
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });
  }
}

messaging().onMessage(onMessageReceived);
messaging().setBackgroundMessageHandler(onMessageReceived);

async function onAppBootstrap() {
  // Register the device with FCM
  await messaging().requestPermission();
  let result = messaging().isDeviceRegisteredForRemoteMessages;

  if (!result) {
    await messaging()
      .registerDeviceForRemoteMessages()
      .then(r => {})
      .catch(err => {
        console.log(err, 'error in registering app token');
      });
  }

  // Get the token
  const token = await messaging().getToken();
  console.log(token, 'fcm token');
  // Save the token
  // await postToApi('/users/1234/tokens', { token });
}

onAppBootstrap();

// showDailyNotification();
