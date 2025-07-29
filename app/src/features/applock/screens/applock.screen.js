/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect } from 'react';

import PINCode from '@haskkor/react-native-pincode';
import { SafeArea } from '../../../components/utility/safe-area.component';

import { useDispatch, useSelector } from 'react-redux';
import { applockActions } from '../../../store/applock-slice';

import { useTheme } from 'styled-components/native';
import { notificationActions } from '../../../store/notification-slice';
import { AuthenticationContext } from '../../../services/authentication/authentication.context';
import { Alert } from 'react-native';
import { MainWrapper } from '../../../components/styles';
export const AppLockScreen = ({ navigation, route, purpose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { type } = useSelector(state => state.applock);

  const { userData } = useContext(AuthenticationContext);

  const onSuccess = pin => {
    if (type === 'choose') {
      dispatch(
        applockActions.setEnabledStatus({
          enabled: true,
        }),
      );
    }
    dispatch(applockActions.finishProcess());

    let purposeType = route?.params?.purpose || purpose;

    if (purposeType === 'secretKey') {
      navigation.goBack();
      Alert.alert(
        userData.uid,
        `This is the secrey key of your account in order to contact with admin in case of any issues with your account. Please, do Not share this ID with anyone.`,
      );
    }

    if (purposeType === 'setpin') {
      navigation.goBack();
      dispatch(
        notificationActions.showToast({
          status: 'success',
          message: 'App Lock enabled successfully',
        }),
      );
    }

    if (purposeType === 'secureapp') {
      dispatch(applockActions.setAppAuthStatus());
    }
  };

  return (
    <MainWrapper>
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
        onClickButtonLockedPage={() => {}}
      />
    </MainWrapper>
  );
};
