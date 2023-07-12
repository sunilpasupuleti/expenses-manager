import OneSignal from 'react-native-onesignal';
import {Linking, Platform} from 'react-native';

//Prompt for push on iOS
OneSignal.promptForPushNotificationsWithUserResponse(response => {});

// called in foreground state when app is in open
OneSignal.setNotificationWillShowInForegroundHandler(
  async notificationReceivedEvent => {
    let notification = notificationReceivedEvent.getNotification();
    let data = notification.additionalData;
    console.log(data, 'Data recevied Notification foreground handler');
    // immediately show notification
    notificationReceivedEvent.complete(notification);
  },
);

OneSignal.setNotificationOpenedHandler(async notification => {
  let data = notification?.notification?.additionalData;
  let action = notification.action;
  let actionID = Platform.OS === 'android' ? action.actionId : action.actionID;
  console.log(`Action Type : ${actionID} with ${data.type}`);
  if (data && data.type && data.type === 'daily-reminder') {
    if (actionID === 'yes') {
      Linking.openURL('expenses-manager://');
    }
  }
});
