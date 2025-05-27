import {AppRegistry} from 'react-native';
import {Provider} from 'react-redux';
import React from 'react';
import App from './App';
import {name as appName} from './app.json';
import store from './src/store';
import {headlessTask} from './headlessTask';

const Redux = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

AppRegistry.registerComponent(appName, () => Redux);
AppRegistry.registerHeadlessTask('AlarmTask', () => headlessTask);
