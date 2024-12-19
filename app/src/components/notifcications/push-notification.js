import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification, {Importance} from 'react-native-push-notification';

const initializePushNotification = async () => {
  PushNotification.configure({
    onRegister: token => {
      console.log('PUSH NOTIFICATION TOKEN', token);
    },

    onNotification: notification => {
      // console.log(notification, 'NOTIFICATIOn');
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    },

    onAction: notification => {
      console.log('ACTION : ', notification.action);
      console.log('NOTIFICATION : ', notification);
      // notification.finish();
    },

    onRegistrationError: err => {
      console.error(err.message, err);
    },

    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    popInitialNotification: true,
    requestPermissions: true,
  });

  PushNotification.createChannel(
    {
      channelId: 'expenses-manager-local-notification',
      channelName: 'Local Notification',
      channelDescription:
        'A channel to send local notification Ex : while upcoming transactions detected and added to list etc...',
      playSound: true,
      soundName: 'notification_primary.wav',
      importance: Importance.HIGH,
      vibrate: true,
    },
    created => console.log(`CreateChannel returned '${created}'`),
  );

  PushNotification.getChannels(function (channel_ids) {
    console.log(channel_ids);
  });
};

export default initializePushNotification;
