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
  DeviceEventEmitter,
  Linking,
  LogBox,
  Platform,
  StatusBar,
  useColorScheme,
} from 'react-native';
import RNExitApp from 'react-native-exit-app';
import {ActionSheetProvider} from '@expo/react-native-action-sheet';
import {MenuProvider} from 'react-native-popup-menu';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchExchangeRates,
  fetchTheme,
  loadAppStatus,
  setAppState,
  setAppUpdateNeeded,
} from './src/store/service-slice';
import moment from 'moment';
import SplashScreen from 'react-native-splash-screen';
import {fetchAppLock} from './src/store/applock-slice';
import VersionCheck from 'react-native-version-check';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {colors} from './src/infrastructure/theme/colors';
import {SQLiteContextProvider} from './src/services/sqlite/sqlite.context';
import {SocketContextProvider} from './src/services/socket/socket.context';
import {WatermelonDBContextProvider} from './src/services/watermelondb/watermelondb.context';
import {APP_STORE_URL, PLAY_STORE_URL} from './config';

moment.suppressDeprecationWarnings = true;
if (Platform.OS === 'android') {
  require('intl');
  require('intl/locale-data/jsonp/en-IN');
}
LogBox.ignoreAllLogs(true);
if (__DEV__) {
  console.warn = () => {};
}
const App = () => {
  // LogBox.ignoreLogs([
  //   'Setting a timer',
  //   'Non-serializable values were found in the navigation state',
  //   'new NativeEventEmitter()',
  // ]);

  const themeType = useColorScheme();
  const appTheme = useSelector(state => state.service.theme);
  const dispatch = useDispatch();
  const appStatus = useSelector(state => state.service.appStatus);

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
        // dispatch(setAppUpdateNeeded(true));
        Alert.alert(
          `Plese Update the app from ${currentVersion} to ${latestVersion} `,
          'You will have to update your app to the latest version to continue using.',
          [
            {
              text: 'Update',
              onPress: () => {
                Linking.openURL(updateNeeded.storeUrl)
                  .then(() => {
                    RNExitApp.exitApp();
                  })
                  .catch(err => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL(APP_STORE_URL);
                    } else if (Platform.OS === 'android') {
                      Linking.openURL(PLAY_STORE_URL);
                    } else {
                    }
                  });
              },
              style: 'cancel',
            },
          ],
          {cancelable: false},
        );
      } else {
        dispatch(setAppUpdateNeeded(false));
      }
    } catch (error) {}
  };

  const MD3MergedLightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      background: lightTheme.colors.ui.body,
      primary: colors.brand.primary,
      secondary: colors.brand.secondary,
      text: lightTheme.colors.text.primary,
    },
  };

  const MD3MergedDarkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      background: darkTheme.colors.ui.body,
      primary: colors.brand.primary,
      secondary: colors.brand.secondary,
      text: darkTheme.colors.text.primary,
    },
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
                    ? MD3MergedLightTheme
                    : MD3MergedDarkTheme
                  : appTheme === 'light'
                  ? MD3MergedLightTheme
                  : MD3MergedDarkTheme
              }>
              {appStatus && appStatus.hideSplashScreen && (
                <SQLiteContextProvider>
                  <WatermelonDBContextProvider>
                    <SocketContextProvider>
                      <AuthenticationContextProvider>
                        <Navigation />
                      </AuthenticationContextProvider>
                    </SocketContextProvider>
                  </WatermelonDBContextProvider>
                </SQLiteContextProvider>
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
