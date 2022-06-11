import React, {useEffect, useState} from 'react';
import 'react-native-gesture-handler';
import {ThemeProvider} from 'styled-components/native';
import {darkTheme, lightTheme} from './src/infrastructure/theme';
import {Navigation} from './src/infrastructure/navigation';
import {DarkTheme, DefaultTheme, Provider} from 'react-native-paper';
import {AuthenticationContextProvider} from './src/services/authentication/authentication.context';
import {LogBox, Platform, StatusBar, useColorScheme} from 'react-native';
import {ActionSheetProvider} from '@expo/react-native-action-sheet';
import {MenuProvider} from 'react-native-popup-menu';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchChangesMade,
  fetchExchangeRates,
  fetchTheme,
} from './src/store/service-slice';
import moment from 'moment';
import SplashScreen from 'react-native-splash-screen';

import {colors} from './src/infrastructure/theme/colors';

import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  TimestampTrigger,
  TriggerType,
  TimeUnit,
  RepeatFrequency,
} from '@notifee/react-native';

moment.suppressDeprecationWarnings = true;
if (Platform.OS === 'android') {
  require('intl');
  require('intl/locale-data/jsonp/en-IN');
}

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

const App = () => {
  LogBox.ignoreLogs([
    'Setting a timer',
    'Non-serializable values were found in the navigation state',
  ]);

  const themeType = useColorScheme();
  const appTheme = useSelector(state => state.service.theme);
  const dispatch = useDispatch();

  notifee.getNotificationSettings().then(settings => {
    if (settings.android.alarm == AndroidNotificationSetting.ENABLED) {
      //Create timestamp trigger
    } else {
      // Show some user information to educate them on what exact alarm permission is,
      // and why it is necessary for your app functionality, then send them to system preferences:
      notifee.openAlarmPermissionSettings();
    }
  });

  useEffect(() => {
    //  call all slices
    dispatch(fetchTheme());
    dispatch(fetchChangesMade());
    dispatch(fetchExchangeRates({}));
    SplashScreen.hide();
    showNotification();
  }, []);
  const date = new Date(Date.now());
  date.setHours(1);
  date.setMinutes(45);
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
    alarmManager: {
      allowWhileIdle: true,
    },
  };

  const showNotification = async () => {
    notifee.createTriggerNotification(
      {
        title: 'Reminder 🔔',
        subtitle: '',
        body: `Have you recorded your  transactions.. 🤔? 
If not 😕 do it now.`,
        android: {
          channelId: 'transactions-reminder',
          color: colors.brand.primary,
          largeIcon: require('./assets/wallet.jpeg'),
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

  return (
    <>
      <ThemeProvider
        theme={
          appTheme === 'automatic'
            ? themeType === 'light'
              ? lightTheme
              : darkTheme
            : appTheme === 'light'
            ? lightTheme
            : darkTheme
        }>
        <ActionSheetProvider>
          <MenuProvider>
            <Provider
              theme={
                appTheme === 'automatic'
                  ? themeType === 'light'
                    ? {...DefaultTheme}
                    : {...DarkTheme}
                  : appTheme === 'light'
                  ? {...DefaultTheme}
                  : {...DarkTheme}
              }>
              <AuthenticationContextProvider>
                <Navigation />
              </AuthenticationContextProvider>
            </Provider>
          </MenuProvider>
        </ActionSheetProvider>
      </ThemeProvider>
      <StatusBar
        barStyle={
          appTheme === 'automatic'
            ? themeType === 'light'
              ? 'dark-content'
              : 'light-content'
            : appTheme === 'light'
            ? 'dark-content'
            : 'light-content'
        }
        showHideTransition="slide"
        backgroundColor={
          appTheme === 'automatic'
            ? themeType === 'light'
              ? '#fff'
              : '#000'
            : appTheme === 'light'
            ? '#fff'
            : '#000'
        }
      />
    </>
  );
};

export default App;
