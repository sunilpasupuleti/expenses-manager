import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {useContext} from 'react';
import {View} from 'react-native';
import {Button} from 'react-native-paper';
import {Spacer} from '../../components/spacer/spacer.component';
import {NotLoggedInContainer} from '../../components/styles';
import {Text} from '../../components/typography/text.component';
import {AuthenticationContext} from '../../services/authentication/authentication.context';
import {AccountNavigator} from './account.navigator';
import {AppNavigator} from './app.navigator';
import {Loader} from '../../components/utility/Loader';
import {useTheme} from 'styled-components/native';

export const Navigation = () => {
  const theme = useTheme();
  const {isLocalAuthenticated, onLocalAuthenticate, isAuthenticated} =
    useContext(AuthenticationContext);
  const NotLoggedIn = () => {
    return (
      <NotLoggedInContainer>
        <View style={{padding: 10}}>
          <Text
            fontfamily="heading"
            style={{textAlign: 'center', letterSpacing: 1, lineHeight: 30}}>
            You have not signed in! Please re-open the app to sign in or click
            below to signin. Note : If biometric is disabled try to unlock your
            phone biometric senso
          </Text>

          <Spacer size={'xlarge'}>
            <Button
              mode="contained"
              color={theme.colors.brand.primary}
              onPress={onLocalAuthenticate}>
              Sign In
            </Button>
          </Spacer>
        </View>
      </NotLoggedInContainer>
    );
  };

  return (
    <>
      <NavigationContainer>
        {isLocalAuthenticated === 'success' && isAuthenticated ? (
          <AppNavigator />
        ) : isLocalAuthenticated === 'success' && !isAuthenticated ? (
          <AccountNavigator />
        ) : isLocalAuthenticated === 'failed' ? (
          <NotLoggedIn />
        ) : null}
      </NavigationContainer>
      <Loader />
    </>
  );
};
