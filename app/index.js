import {AppRegistry} from 'react-native';
import {Provider} from 'react-redux';
import React from 'react';
import App from './App';
import {name as appName} from './app.json';
import store from './src/store';
import messaging from '@react-native-firebase/messaging';
import AppFake from './AppFake';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('HEADLESS BACKGROUND');
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
