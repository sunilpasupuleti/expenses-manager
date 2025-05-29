import {AppRegistry} from 'react-native';
import {Provider} from 'react-redux';
import React from 'react';
import App from './App';
import {name as appName} from './app.json';
import store from './src/store';
import {headlessTask} from './headlessTask';

import * as Sentry from '@sentry/react-native';
import {SENTRY_DSN} from './config';

// 🔐 Initialize Sentry
Sentry.init({
  dsn: SENTRY_DSN,
  sendDefaultPii: true,
});

const Redux = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

const SentryWrappedRedux = Sentry.wrap(Redux);
AppRegistry.registerComponent(appName, () => SentryWrappedRedux);
AppRegistry.registerHeadlessTask('AlarmTask', () => headlessTask);
