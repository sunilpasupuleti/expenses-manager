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
import './src/components/fcm/FCMService';
moment.suppressDeprecationWarnings = true;
if (Platform.OS === 'android') {
  require('intl');
  require('intl/locale-data/jsonp/en-IN');
}

const App = () => {
  LogBox.ignoreLogs([
    'Setting a timer',
    'Non-serializable values were found in the navigation state',
  ]);

  const themeType = useColorScheme();
  const appTheme = useSelector(state => state.service.theme);
  const dispatch = useDispatch();

  useEffect(() => {
    //  call all slices
    dispatch(fetchTheme());
    dispatch(fetchChangesMade());
    dispatch(fetchExchangeRates({}));
    SplashScreen.hide();
  }, []);

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