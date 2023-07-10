import OneSignal from 'react-native-onesignal';

import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import remoteConfig from '@react-native-firebase/remote-config';
import {Linking, Platform} from 'react-native';

//Prompt for push on iOS
OneSignal.promptForPushNotificationsWithUserResponse(response => {});

// called in foreground state when app is in open
OneSignal.setNotificationWillShowInForegroundHandler(
  async notificationReceivedEvent => {
    let notification = notificationReceivedEvent.getNotification();
    let data = notification.additionalData;
    console.log(data, 'Data recevied Notification foreground handler');
    if (data && data.type && data.type === 'daily-backup') {
      await onBackupData(data);
    } else {
      // immediately show notification
      notificationReceivedEvent.complete(notification);
    }
  },
);

export const onBackgroundMessageReceivedHandler = message => {
  // background handler onesignal notification data is received at data -> custom -> a
  let data = message?.data?.custom;
  console.log(data, 'Data received Background handler');
  if (data) {
    try {
      let parsedData = JSON.parse(data);
      if (
        parsedData &&
        parsedData.a &&
        parsedData.a.type &&
        parsedData.a.type === 'daily-backup'
      ) {
        onBackupData(parsedData.a);
      }
    } catch (e) {
      console.log(e, 'Error in notification');
    }
  }
};

const onBackupData = async data => {
  let uid = data.uid;
  let value = await AsyncStorage.getItem(`@expenses-manager-data-${uid}`);
  let BACKEND_URL = await AsyncStorage.getItem('@expenses-manager-backend-url');
  if (value) {
    value = JSON.parse(value);
  } else {
    value = null;
  }

  let url = BACKEND_URL + '/backup?sendNotification=yes';
  console.log(url, value ? value : {}, Platform.OS);
  let jwtToken = await auth().currentUser.getIdToken();
  axios
    .post(url, value ? value : {}, {
      headers: {
        authorization: 'Bearer ' + jwtToken,
      },
    })
    .then(ref => {
      console.log('data backed up successfully');
    })
    .catch(err => {
      console.log(err.message, ' error while backing up data');
    });
};

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
