/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {useContext} from 'react';
import {AuthenticationContext} from '../../services/authentication/authentication.context';
import {AccountNavigator} from './account.navigator';
import {AppNavigator} from './app.navigator';
import {Loader} from '../../components/utility/Loader';
import {useEffect} from 'react';
import {navigationRef} from './rootnavigation';
import {useDispatch, useSelector} from 'react-redux';
import {useState} from 'react';
import {AppLockScreen} from '../../features/applock/screens/applock.screen';
import {applockActions} from '../../store/applock-slice';

export const Navigation = () => {
  // const theme = useTheme();
  const {isAuthenticated} = useContext(AuthenticationContext);
  const dispatch = useDispatch();
  const {enabled: isAppLockEnabled, appAuthStatus} = useSelector(
    state => state.applock,
  );

  const appLockSuccessCallback = () => {
    dispatch(applockActions.setAppAuthStatus());
    // setSuccessAuth(true);
  };

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        {isAppLockEnabled && !appAuthStatus ? (
          <AppLockScreen callback={appLockSuccessCallback} />
        ) : isAuthenticated ? (
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
