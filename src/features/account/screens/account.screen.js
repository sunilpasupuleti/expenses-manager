import React, {useEffect} from 'react';
import {useContext, useState} from 'react';
import {Image, Text} from 'react-native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {Title} from '../../sheets/components/sheets.styles';
import {
  AccountBackground,
  AccountContainer,
  AccountCover,
  AuthButton,
  GoogleButton,
  GoogleButtonImageWrapper,
  GoogleButtonText,
} from '../components/account.styles';

import Ionicons from 'react-native-vector-icons/Ionicons';

export const AccountScreen = () => {
  const {onGoogleAuthentication, onFacebookAuthentication} = useContext(
    AuthenticationContext,
  );

  return (
    <AccountBackground>
      <AccountCover />

      <Title>Expenses manager</Title>
      <AccountContainer>
        <AuthButton
          color={'#1B74E4'}
          icon={() => (
            <Ionicons name="ios-logo-facebook" size={25} color="#fff" />
          )}
          mode="contained"
          onPress={onFacebookAuthentication}>
          Sign in with facebook
        </AuthButton>

        <Spacer size={'large'}>
          <GoogleButton onPress={onGoogleAuthentication}>
            <GoogleButtonImageWrapper>
              <Image
                source={require('../../../../assets/google.png')}
                style={{
                  height: 25,
                  width: 30,
                }}
              />
            </GoogleButtonImageWrapper>

            <GoogleButtonText>Sign In With Google</GoogleButtonText>
          </GoogleButton>
        </Spacer>
      </AccountContainer>
    </AccountBackground>
  );
};
