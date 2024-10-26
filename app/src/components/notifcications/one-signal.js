import {OneSignal} from 'react-native-onesignal';
import {Linking} from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';

const ONE_SIGNAL_APP_ID = remoteConfig()
  .getValue('ONE_SIGNAL_APP_ID')
  .asString();

try {
  OneSignal.initialize(ONE_SIGNAL_APP_ID);
  OneSignal.Notifications.requestPermission(true);
} catch (e) {
  console.log(e, 'error in one signal');
}

OneSignal.Notifications.addEventListener(
  'foregroundWillDisplay',
  async notificationReceivedEvent => {
    notificationReceivedEvent.preventDefault();
    // do some aynsc work
    let notification = notificationReceivedEvent.getNotification();
    let data = notification.additionalData;
    notification.display();
    // console.log(data, 'Data recevied Notification foreground handler');
  },
);

const onBackup = async () => {
  Linking.openURL('expenses-manager://Settings/Sync');
};

OneSignal.Notifications.addEventListener('click', async event => {
  const data = event.notification;
  // onBackup();

  if (event?.result?.actionId === 'backup_now') {
    onBackup();
  }
  // console.log(data, 'Data recevied Notification click handler');
});
