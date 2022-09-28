/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {useContext} from 'react';
import {AuthenticationContext} from '../../services/authentication/authentication.context';
import {AccountNavigator} from './account.navigator';
import {AppNavigator} from './app.navigator';
import {Loader} from '../../components/utility/Loader';
import {useEffect} from 'react';
import {navigationRef, navigate} from './rootnavigation';
import {hasUserSetPinCode} from '@haskkor/react-native-pincode';
import {applockActions} from '../../store/applock-slice';
import {useDispatch} from 'react-redux';

export const Navigation = () => {
  // const theme = useTheme();
  const {isAuthenticated} = useContext(AuthenticationContext);
  const dispatch = useDispatch();
  useEffect(() => {
    (async () => {
      let result = await hasUserSetPinCode('@expenses-manager-app-lock');
      dispatch(applockActions.setEnabledStatus({enabled: result}));
      if (result) {
        navigate('Applock', {
          callback: () => {
            // .goBack();
            navigationRef?.current?.goBack();
          },
        });
      }
    })();
  }, [navigationRef]);

  // const NotLoggedIn = () => {
  //   return (
  //     <NotLoggedInContainer>
  //       <View style={{padding: 10}}>
  //         <Text
  //           fontfamily="heading"
  //           style={{textAlign: 'center', letterSpacing: 1, lineHeight: 30}}>
  //           You need to authenticate to continue! Click on authenticate button
  //           to continue. In case of biometric sesnor disabled, try to unlock
  //           phone first.
  //         </Text>

  //         <Spacer size={'xlarge'}>
  //           <Button
  //             mode="contained"
  //             color={theme.colors.brand.primary}
  //             onPress={onLocalAuthenticate}>
  //             AUTHENTICATE
  //           </Button>
  //         </Spacer>
  //       </View>
  //     </NotLoggedInContainer>
  //   );
  // };

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        {isAuthenticated ? <AppNavigator /> : <AccountNavigator />}
      </NavigationContainer>
      <Loader />
    </>
  );
};
