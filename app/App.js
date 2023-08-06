/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect} from 'react';
import 'react-native-gesture-handler';
import {ThemeProvider} from 'styled-components/native';
import {darkTheme, lightTheme} from './src/infrastructure/theme';
import {Navigation} from './src/infrastructure/navigation';
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import {AuthenticationContextProvider} from './src/services/authentication/authentication.context';
import {
  Alert,
  AppState,
  BackHandler,
  DeviceEventEmitter,
  Linking,
  LogBox,
  Platform,
  StatusBar,
  useColorScheme,
} from 'react-native';
import {ActionSheetProvider} from '@expo/react-native-action-sheet';
import {MenuProvider} from 'react-native-popup-menu';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchChangesMade,
  fetchExchangeRates,
  fetchTheme,
  loadAppStatus,
  setAppState,
} from './src/store/service-slice';
import moment from 'moment';
import SplashScreen from 'react-native-splash-screen';
import {fetchAppLock} from './src/store/applock-slice';
import VersionCheck from 'react-native-version-check';
import './src/components/notifcications/one-signal';
import OneSignal from 'react-native-onesignal';
import remoteConfig from '@react-native-firebase/remote-config';
import {GetCurrencySymbol} from './src/components/symbol.currency';
import {TourGuideProvider} from 'rn-tourguide';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

moment.suppressDeprecationWarnings = true;
if (Platform.OS === 'android') {
  require('intl');
  require('intl/locale-data/jsonp/en-IN');
}

const App = () => {
  LogBox.ignoreAllLogs(); //Ignore all log notifications
  // LogBox.ignoreLogs([
  //   'Setting a timer',
  //   'Non-serializable values were found in the navigation state',
  //   'new NativeEventEmitter',
  // ]);

  const themeType = useColorScheme();
  const appTheme = useSelector(state => state.service.theme);
  const dispatch = useDispatch();
  const appStatus = useSelector(state => state.service.appStatus);
  const ONE_SIGNAL_APP_ID = remoteConfig()
    .getValue('ONE_SIGNAL_APP_ID')
    .asString();

  try {
    OneSignal.setAppId(ONE_SIGNAL_APP_ID);
    // OneSignal.setLogLevel(6, 0);
  } catch (e) {
    console.log(e);
  }

  useEffect(() => {
    let iosStateListener = null;
    let androidStateListener = null;
    if (Platform.OS === 'ios') {
      iosStateListener = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
          checkAppUpdateNeeded();
        }
        dispatch(setAppState({state: nextAppState}));
      });
    }
    if (Platform.OS === 'android') {
      androidStateListener = DeviceEventEmitter.addListener(
        'ActivityStateChange',
        e => {
          if (e.event === 'active') {
            checkAppUpdateNeeded();
          }
          dispatch(setAppState({state: e.event}));
        },
      );
    }
    //  call all slices
    dispatch(fetchAppLock());
    dispatch(fetchTheme());
    dispatch(loadAppStatus());
    dispatch(fetchChangesMade());
    dispatch(fetchExchangeRates({}));
    return () => {
      iosStateListener?.remove();
      androidStateListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (appStatus && appStatus.hideSplashScreen) {
      SplashScreen.hide();
    }
  }, [appStatus]);

  const checkAppUpdateNeeded = async () => {
    try {
      const latestVersion = await VersionCheck.getLatestVersion();
      const currentVersion = await VersionCheck.getCurrentVersion();
      console.log(
        `App versions - Current Version ${currentVersion} - Latest Version ${latestVersion}`,
      );

      let updateNeeded = await VersionCheck.needUpdate();
      if (updateNeeded && updateNeeded.isNeeded) {
        Alert.alert(
          `Plese Update the app from ${currentVersion} to ${latestVersion} `,
          'You will have to update your app to the latest version to continue using.',
          [
            {
              text: 'Update',
              onPress: () => {
                BackHandler.exitApp();
                Linking.openURL(updateNeeded.storeUrl);
              },
              style: 'cancel',
            },
          ],
          {cancelable: false},
        );
      }
    } catch (error) {}
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
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
            <PaperProvider
              theme={
                appTheme === 'automatic'
                  ? themeType === 'light'
                    ? MD3LightTheme
                    : MD3DarkTheme
                  : appTheme === 'light'
                  ? MD3LightTheme
                  : MD3DarkTheme
              }>
              {appStatus && appStatus.hideSplashScreen && (
                <AuthenticationContextProvider>
                  <Navigation />
                </AuthenticationContextProvider>
              )}
            </PaperProvider>
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
    </GestureHandlerRootView>
  );
};

export default App;
