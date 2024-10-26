/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState} from 'react';
import {AccountNavigator} from './account.navigator';
import {AppNavigator} from './app.navigator';
import {Loader} from '../../components/utility/Loader';
import {navigate, navigationRef} from './rootnavigation';
import {useSelector} from 'react-redux';
import {AppLockScreen} from '../../features/applock/screens/applock.screen';
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import merge from 'deepmerge';
import {Linking, useColorScheme} from 'react-native';
import {OnBoarding} from '../../features/onboarding/screens/onboarding.screen';
import {Notification} from '../../components/utility/Notification';

export const Navigation = () => {
  const {enabled: isAppLockEnabled, appAuthStatus} = useSelector(
    state => state.applock,
  );
  const appStatus = useSelector(state => state.service.appStatus);
  const appTheme = useSelector(state => state.service.theme);
  const {LightTheme, DarkTheme} = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });
  const themeType = useColorScheme();

  const CombinedLightTheme = merge(MD3LightTheme, LightTheme);
  const CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);
  return (
    <NavigationContainer
      linking={{
        prefixes: ['expenses-manager://'],
        config: {
          initialRouteName: 'Sheets',
          screens: {
            Sheets: 'Sheets',
            Settings: {
              path: 'Settings',
              screens: {
                Sync: 'Sync',
              },
            },
          },
        },
        getInitialURL: async () => {
          const url = await Linking.getInitialURL();
          if (url !== null) {
            return url;
          }
        },
        subscribe: listener => {
          const onReceiveURL = ({url}) => listener(url);
          Linking.addEventListener('url', onReceiveURL);

          return () => Linking.removeAllListeners('url');
        },
      }}
      ref={navigationRef}
      theme={
        appTheme === 'automatic'
          ? themeType === 'light'
            ? CombinedLightTheme
            : CombinedDarkTheme
          : appTheme === 'light'
          ? CombinedLightTheme
          : CombinedDarkTheme
      }>
      {!appStatus.onBoarded ? (
        <OnBoarding navigation={navigationRef} navigate={navigate} />
      ) : isAppLockEnabled && !appAuthStatus ? (
        <AppLockScreen purpose={'secureapp'} />
      ) : appStatus.authenticated ? (
        <AppNavigator />
      ) : (
        <AccountNavigator />
      )}
      <Loader />
      <Notification />
    </NavigationContainer>
  );
};
