import { OneSignal, LogLevel } from 'react-native-onesignal';
import { Linking } from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';

OneSignal.Debug.setLogLevel(LogLevel.Verbose);

const initializeOneSignal = async () => {
  const ONE_SIGNAL_APP_ID = remoteConfig()
    .getValue('ONE_SIGNAL_APP_ID')
    .asString();

  try {
    console.log(ONE_SIGNAL_APP_ID, 'One signal Id ----');
    await OneSignal.initialize(ONE_SIGNAL_APP_ID);
    // await OneSignal.Notifications.requestPermission(true);
  } catch (e) {
    console.log(e, 'error in one signal');
  }

  const onBackup = async () => {
    Linking.openURL('expenses-manager://Settings/Sync');
  };

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

  OneSignal.Notifications.addEventListener('click', async event => {
    const data = event.notification;
    // onBackup();

    if (event?.result?.actionId === 'backup_now') {
      onBackup();
    }
    // console.log(data, 'Data recevied Notification click handler');
  });
};

export default initializeOneSignal;
