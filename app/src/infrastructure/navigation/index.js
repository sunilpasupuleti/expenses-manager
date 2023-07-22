/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {useContext} from 'react';
import {AuthenticationContext} from '../../services/authentication/authentication.context';
import {AccountNavigator} from './account.navigator';
import {AppNavigator} from './app.navigator';
import {Loader} from '../../components/utility/Loader';
import {useEffect} from 'react';
import {navigate, navigationRef} from './rootnavigation';
import {useDispatch, useSelector} from 'react-redux';
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
import {useColorScheme} from 'react-native';
import {OnBoarding} from '../../features/onboarding/screens/onboarding.screen';

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
    <>
      <NavigationContainer
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
          <>
            <AppNavigator />
          </>
        ) : (
          <AccountNavigator />
        )}
      </NavigationContainer>
      <Loader />
    </>
  );
};
