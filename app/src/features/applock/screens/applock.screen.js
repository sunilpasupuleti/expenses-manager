/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';

import PINCode from '@haskkor/react-native-pincode';
import {SafeArea} from '../../../components/utility/safe-area.component';

import {useDispatch, useSelector} from 'react-redux';
import {applockActions} from '../../../store/applock-slice';

import {useTheme} from 'styled-components/native';

export const AppLockScreen = ({navigation, route, callback = () => null}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const {type} = useSelector(state => state.applock);

  const onSuccess = pin => {
    if (type === 'choose') {
      dispatch(
        applockActions.setEnabledStatus({
          enabled: true,
        }),
      );
    }
    dispatch(applockActions.finishProcess());
    let callbackFunction = route?.params?.callback;
    if (callbackFunction) {
      callbackFunction();
    } else {
      callback();
    }
  };

  return (
    <SafeArea>
      <PINCode
        status={type}
        finishProcess={onSuccess}
        maxAttempts={5}
        timeLocked={60000 * 1}
        delayBetweenAttempts={1000}
        pinCodeKeychainName="@expenses-manager-app-lock"
        colorCircleButtons={theme.colors.brand.primary}
        colorPassword={theme.colors.brand.primary}
        numbersButtonOverlayColor={theme.colors.brand.secondary}
      />
    </SafeArea>
  );
};
