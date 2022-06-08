import React from 'react';
import {createContext, useContext, useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as LocalAuthentication from 'expo-local-authentication';
import {useDispatch} from 'react-redux';
import {setChangesMade} from '../../store/service-slice';
// import {Alert} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {AccessToken, LoginManager} from 'react-native-fbsdk';
import {notificationActions} from '../../store/notification-slice';

import {loaderActions} from '../../store/loader-slice';

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId:
    '209649691146-ui8qcgo5biv5f3e3r3vp6jqabh0db50i.apps.googleusercontent.com',
});

export const AuthenticationContext = createContext({
  isLocalAuthenticated: false,
  onLocalAuthenticate: () => null,
  onFacebookAuthentication: () => null,
  onGoogleAuthentication: () => null,
  isAuthenticated: false,
  userData: null,
  onLogout: () => null,
});

export const AuthenticationContextProvider = ({children}) => {
  const [isLocalAuthenticated, setIsLocalAuthenticated] = useState('pending');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const dispatch = useDispatch();

  // for push notifications

  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    (async () => {
      const result = await AsyncStorage.getItem(
        `@expenses-manager-screenlock`,
      ).then(d => {
        return JSON.parse(d);
      });
      if (result) {
        onLocalAuthenticate();
      } else {
        setIsLocalAuthenticated('success');
      }
      // checkLoggedIn();s
    })();

    const unsubcribe = auth().onAuthStateChanged(user => {
      setUserData(user);
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      unsubcribe();
    };
  }, []);

  const onLocalAuthenticate = () => {
    // setIsLocalAuthenticated('pending');
    // (async () => {
    //   const compatible = await LocalAuthentication.hasHardwareAsync();
    //   setIsBiometricSupported(compatible);
    //   const auth = LocalAuthentication.authenticateAsync({
    //     promptMessage: 'Authenticate',
    //     fallbackLabel: 'Enter Password',
    //   });
    //   auth.then(result => {
    //     setIsLocalAuthenticated(result.success ? 'success' : 'failed');
    //   });
    // })();
  };
  const onGoogleAuthentication = async () => {
    dispatch(loaderActions.showLoader({backdrop: true}));
    try {
      const {idToken} = await GoogleSignin.signIn();
      const getToken = await GoogleSignin.getTokens();
      const googleCredentials = auth.GoogleAuthProvider.credential(idToken);
      if (!googleCredentials) {
        dispatch(loaderActions.hideLoader());
        throw 'Something went wrong obtaining access token';
      }
      auth()
        .signInWithCredential(googleCredentials)
        .then(res => {
          let user = res.user;
          let email = res.additionalUserInfo.profile.email;
          onSetUserData(
            user.displayName,
            email,
            user.uid,
            user.photoURL,
            'google',
          );
        })
        .catch(err => {
          dispatch(loaderActions.hideLoader());
          console.log('error in google sign in ', err);
          dispatch(
            notificationActions.showToast({status: 'error', message: err}),
          );
        });
    } catch (error) {
      dispatch(loaderActions.hideLoader());

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('---------- cancelled google sign in --------------');
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.warn(
          'Google play services is not available ! Install and try again ',
        );
      } else {
        // some other error happened
      }
    }
  };

  const onFacebookAuthentication = async () => {
    dispatch(loaderActions.showLoader({backdrop: true}));

    try {
      const result = await LoginManager.logInWithPermissions([
        'public_profile',
        'email',
      ]);
      if (result.isCancelled) {
        dispatch(loaderActions.hideLoader());
        throw 'Login process cancelled';
      }
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) {
        dispatch(loaderActions.hideLoader());
        throw 'Something went wrong obtaining access token';
      }
      const facebookCredential = auth.FacebookAuthProvider.credential(
        data.accessToken,
      );
      auth()
        .signInWithCredential(facebookCredential)
        .then(res => {
          let user = res.user;
          let email = res.additionalUserInfo.profile.email;
          onSetUserData(
            user.displayName,
            email,
            user.uid,
            user.photoURL,
            'facebook',
          );
        })
        .catch(err => {
          dispatch(loaderActions.hideLoader());
          console.warn('error in facebook sign in ', err);
          dispatch(
            notificationActions.showToast({status: 'error', message: err}),
          );
        });
    } catch (error) {
      console.log(error, ' facebook process error ');
    }
  };
  const onSetUserData = async (name, email, uid, photoURL, loginType) => {
    let transformedData = {
      name,
      email,
      uid,
      picture: photoURL,
      loginType: loginType,
      expoPushToken,
    };
    onStoreUserDataToFirebase(transformedData)
      .then(async () => {
        dispatch(loaderActions.hideLoader());
      })
      .catch(err => {
        dispatch(loaderActions.hideLoader());
        console.log(err, ' error while storing user details to backend.');
      });
  };

  const onStoreUserDataToFirebase = async userData => {
    return firestore().collection(userData.uid).doc('user-data').set(userData);
  };

  const onLogout = async () => {
    // let userDataCopy = {...userData};
    auth()
      .signOut()
      .then(async () => {
        // await AsyncStorage.removeItem(`@expenses-manager-user-data`);
        // setUserData(null);
        // setIsAuthenticated(false);
        dispatch(setChangesMade({status: false, loaded: true}));
      })
      .catch(err => {
        console.log(err, 'no user');
        dispatch(
          notificationActions.showToast({status: 'error', message: err}),
        );
      });

    //   firestore()
    //   .collection(userDataCopy.id)
    //   .doc('user-data')
    //   .update({
    //     expoPushToken: null,
    //   })
    //   .then(() => {})
    //   .catch(err => {
    //     console.log(err, 'In setting the expo push token to null ');
    //   });
  };

  return (
    <AuthenticationContext.Provider
      value={{
        isLocalAuthenticated,
        onLocalAuthenticate,
        onFacebookAuthentication,
        onGoogleAuthentication,
        isAuthenticated,
        userData,
        onLogout,
      }}>
      {children}
    </AuthenticationContext.Provider>
  );
};
