import {AppRegistry} from 'react-native';
import {Provider} from 'react-redux';
import React from 'react';
import App from './App';
import {name as appName} from './app.json';
import store from './src/store';
import messaging from '@react-native-firebase/messaging';
import AppFake from './AppFake';
import {onBackgroundMessageReceivedHandler} from './src/components/fcm/one-signal';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  // use backgroundmessage handler from firebase because one signal does not support background listener
  console.log('HEADLESS BACKGROUND');
  onBackgroundMessageReceivedHandler(remoteMessage);

  // console.log('HEADLESS BACKGROUND: ', remoteMessage);
});

function HeadlessCheck({isHeadless}) {
  if (isHeadless) {
    console.log('Headless');
    return <AppFake />;
    /* Notice this component, it is not the App Component but a different one*/
  }

  return <Redux />;
}

const Redux = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

AppRegistry.registerComponent(appName, () => HeadlessCheck);
