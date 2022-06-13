import React from 'react';
import {createContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {setChangesMade} from '../../store/service-slice';
// import {Alert} from 'react-native';
import TouchID from 'react-native-touch-id';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {notificationActions} from '../../store/notification-slice';
import messaging from '@react-native-firebase/messaging';
import {loaderActions} from '../../store/loader-slice';

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId:
    '209649691146-ui8qcgo5biv5f3e3r3vp6jqabh0db50i.apps.googleusercontent.com',
});

const optionalConfigObject = {
  title: 'Authentication Required', // Android
  imageColor: '#5756d5', // Android
  imageErrorColor: '#5756d5', // Android
  sensorDescription: 'Touch sensor', // Android
  sensorErrorDescription: 'Failed', // Android
  cancelText: 'Cancel', // Android
  fallbackLabel: 'Show Passcode', // iOS (if empty, then label is hidden)
  unifiedErrors: false, // use unified error messages (default false)
  passcodeFallback: false, // iOS - allows the device to fall back to using the passcode, if faceid/touch is not available. this does not mean that if touchid/faceid fails the first few times it will revert to passcode, rather that if the former are not enrolled, then it will use the passcode.
};

export const AuthenticationContext = createContext({
  isLocalAuthenticated: false,
  userAdditionalDetails: null,
  onLocalAuthenticate: () => null,
  onGoogleAuthentication: () => null,
  onSignInWithEmail: () => null,
  onSignUpWithEmail: () => null,
  onSignInWithMobile: () => null,
  onSetUserData: () => null,
  onResetPassword: () => null,
  isAuthenticated: false,
  userData: null,
  onLogout: () => null,
  onUpdateUserDetails: () => null,
});

export const AuthenticationContextProvider = ({children}) => {
  const [isLocalAuthenticated, setIsLocalAuthenticated] = useState('pending');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userAdditionalDetails, setUserAdditionalDetails] = useState(null);
  const dispatch = useDispatch();

  // for push notifications

  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    const unsubcribe = auth().onAuthStateChanged(async user => {
      setUserData(user);
      if (user) {
        setIsAuthenticated(true);

        onGetUserDetails(user.uid).then(details => {
          if (details && details.applock) {
            onLocalAuthenticate();
          } else {
            setIsLocalAuthenticated('success');
          }
        });
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      unsubcribe();
    };
  }, []);

  const onLocalAuthenticate = () => {
    TouchID.authenticate(
      'Authenticate to continue to the app.',
      optionalConfigObject,
    )
      .then(success => {
        // Success code
        setIsLocalAuthenticated('success');
      })
      .catch(error => {
        setIsLocalAuthenticated('failed');
        console.log(error, 'error in biometric');
        // Failure code
      });
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
          onSetUserData(res);
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

  const onSignInWithEmail = async (email, password) => {
    try {
      let result = await auth().signInWithEmailAndPassword(email, password);
      return {status: true};
    } catch (e) {
      console.log(e, 'error with sign in with email and password');
      let error = '';
      switch (e.code) {
        case 'auth/invalid-email':
          error = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          error = 'The requested user was disabled by admin!';
          break;
        case 'auth/user-not-found':
          error = 'No user found with the provided details!';
          break;
        case 'auth/wrong-password':
          error = 'Password is incorrect';
          break;
      }
      return {status: false, message: error};
    }
  };

  const onSignUpWithEmail = async (email, password) => {
    try {
      let result = await auth().createUserWithEmailAndPassword(email, password);

      onSetUserData(result);

      return {status: true};
    } catch (e) {
      console.log(e, 'error with sign in with email and password');
      let error = '';
      switch (e.code) {
        case 'auth/invalid-email':
          error = 'Invalid email address';
        case 'auth/email-already-in-use':
          error = 'Email-address is already in use! Try another email.';
          break;
        case 'auth/weak-password':
          error = 'Password is not strong enough';
          break;
      }
      return {status: false, message: error};
    }
  };

  const onResetPassword = async email => {
    try {
      let result = await auth().sendPasswordResetEmail(email);
      return {
        status: true,
        message:
          'Password reset link has been sent to your email. If not received ,please check your spam folder also',
      };
    } catch (e) {
      console.log(e, 'error in sending password reset link');
      let error = '';
      switch (e.code) {
        case 'auth/invalid-email':
          error = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          error = 'There is no user with the email-address you have provided.';
          break;
      }
      return {status: false, message: error};
    }
  };

  const onSignInWithMobile = async phone => {
    try {
      let result = await auth().signInWithPhoneNumber(phone);
      return {
        status: true,
        result: result,
        message:
          'Enter the one time password (OTP) sent to your mobile number.',
      };
    } catch (e) {
      console.log(e, 'error in initializing the phone base auhentication');
      let error = '';
      switch (e.code) {
        case 'auth/captcha-check-failed':
          error = 'Verification failed reCaptcha';
          break;
        case 'auth/invalid-phone-number':
          error = 'Invalid mobile number';
          break;
        case 'auth/quota-exceeded':
          error = 'Sms quota exceeded';
          break;
        case 'auth/user-disabled':
          error =
            'Unable to send because the user with this number is disabled!';
          break;
        case 'auth/network-request-failed':
          error = 'No Internet Connection!';
          break;
      }
      return {status: false, message: error};
    }
  };

  const onSetUserData = async data => {
    const token = await messaging().getToken();

    let user = data.user;
    let transformedData = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      providerId: user.providerId,
      uid: user.uid,
      fcmToken: token,
      active: true,
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
    return firestore()
      .collection(userData.uid)
      .doc('user-data')
      .set(userData, {merge: true});
  };

  const onLogout = async () => {
    let uid = userData.uid;
    auth()
      .signOut()
      .then(async () => {
        setIsAuthenticated(false);
        setIsLocalAuthenticated('pending');
        dispatch(setChangesMade({status: false, loaded: true}));
      })
      .catch(err => {
        console.log(err, 'no user');
        dispatch(
          notificationActions.showToast({status: 'error', message: err}),
        );
      });
    firestore()
      .collection(uid)
      .doc('user-data')
      .update({
        active: false,
      })
      .then(() => {})
      .catch(err => {
        console.log(err, 'In setting logout value to false');
      });
  };

  const onUpdateUserDetails = async details => {
    const token = await messaging().getToken();
    dispatch(loaderActions.showLoader({backdrop: true}));
    firestore()
      .collection(userData.uid)
      .doc('user-data')
      .update({
        ...details,
        fcmToken: token,
      })
      .then(() => {
        onGetUserDetails(userData.uid)
          .then(() => {
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                status: 'success',
                message: 'Updated successfully',
              }),
            );
          })
          .catch(err => {
            dispatch(loaderActions.hideLoader());
          });
      })
      .catch(err => {
        dispatch(loaderActions.hideLoader());
        dispatch(
          notificationActions.showToast({
            status: 'error',
            message: 'Error in updating the details!',
          }),
        );
        console.log(err, 'Error while updating the user details');
      });
  };

  const onGetUserDetails = async uid => {
    return firestore()
      .collection(uid)
      .doc('user-data')
      .get()
      .then(doc => {
        if (doc.exists) {
          setUserAdditionalDetails(doc.data());
        }
        return doc.data();
      });
  };

  return (
    <AuthenticationContext.Provider
      value={{
        isLocalAuthenticated,
        onLocalAuthenticate,
        onGoogleAuthentication,
        isAuthenticated,
        userData,
        onLogout,
        onSignInWithEmail,
        onSignUpWithEmail,
        onResetPassword,
        onSignInWithMobile,
        onSetUserData,
        onUpdateUserDetails,
        userAdditionalDetails,
      }}>
      {children}
    </AuthenticationContext.Provider>
  );
};
