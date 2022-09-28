/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';

import PINCode from '@haskkor/react-native-pincode';
import {SafeArea} from '../../../components/utility/safe-area.component';

import {useDispatch, useSelector} from 'react-redux';
import {applockActions} from '../../../store/applock-slice';

import {notificationActions} from '../../../store/notification-slice';
import {useTheme} from 'styled-components/native';

export const AppLockScreen = ({navigation, route}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const onSuccess = pin => {
    if (status === 'choose') {
      dispatch(
        applockActions.setEnabledStatus({
          enabled: true,
        }),
      );
    }
    dispatch(applockActions.finishProcess());
    if (route?.params?.callback) {
      let callback = route.params.callback;
      callback();
    }
  };

  const {show, status} = useSelector(state => state.applock);

  return (
    <SafeArea>
      {show && (
        <PINCode
          status={status}
          finishProcess={onSuccess}
          maxAttempts={5}
          timeLocked={60000 * 0.5}
          delayBetweenAttempts={1000}
          pinCodeKeychainName="@expenses-manager-app-lock"
          colorCircleButtons={theme.colors.brand.primary}
          colorPassword={theme.colors.brand.primary}
          numbersButtonOverlayColor={theme.colors.brand.secondary}
        />
      )}
    </SafeArea>
  );
};
