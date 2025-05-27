import React, {useEffect} from 'react';
import {Linking} from 'react-native';

export const PlaidOAuthRedirectScreen = ({navigation}) => {
  useEffect(() => {
    const redirectIfOAuth = async () => {
      const url = await Linking.getInitialURL();
      if (url && url.includes('oauth_state_id')) {
        navigation.replace('BankAccounts', {
          updateAccountMode: true,
          institution: null,
        });
      } else {
        navigation.replace('Sheets');
      }
    };
    redirectIfOAuth();
  }, []);

  return null; // just invisible pass-through
};
