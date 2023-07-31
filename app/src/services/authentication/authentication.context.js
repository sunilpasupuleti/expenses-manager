/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {createContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {serviceActions, setChangesMade} from '../../store/service-slice';
import auth from '@react-native-firebase/auth';
import {notificationActions} from '../../store/notification-slice';
import messaging from '@react-native-firebase/messaging';
import {loaderActions} from '../../store/loader-slice';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import useHttp from '../../hooks/use-http';
import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  resetPinCodeInternalStates,
  deleteUserPinCode,
} from '@haskkor/react-native-pincode';
import NetInfo from '@react-native-community/netinfo';
import appleAuth from '@invertase/react-native-apple-authentication';
import OneSignal from 'react-native-onesignal';
import moment from 'moment';
import InAppReview from 'react-native-in-app-review';
import {getCurrencies, getLocales, getTimeZone} from 'react-native-localize';
import DeviceInfo from 'react-native-device-info';

GoogleSignin.configure({
  webClientId: remoteConfig().getValue('WEB_CLIENT_ID').asString(),
});

export const AuthenticationContext = createContext({
  userAdditionalDetails: null,
  onGoogleAuthentication: () => null,
  onAppleAuthentication: () => null,
  onSignInWithEmail: () => null,
  onSignUpWithEmail: () => null,
  onSignInWithMobile: (phone, resend) => null,
  onSignInSuccess: () => null,
  onResetPassword: () => null,
  userData: null,
  setUserData: null,
  onLogout: () => null,
  onSetUserAdditionalDetails: data => null,
  onGetUserDetails: (successCallBack, errorCallback) => null,
  fetchedUserDetails: false,
});

let authFlag = true;

export const AuthenticationContextProvider = ({children}) => {
  const [userData, setUserData] = useState(null);
  const [userAdditionalDetails, setUserAdditionalDetails] = useState(null);
  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();

  const dispatch = useDispatch();
  const {sendRequest} = useHttp();

  const onSetUserAdditionalDetails = data => {
    setUserAdditionalDetails(data);
  };

  useEffect(() => {
    console.log(
      'BACKEND URL -',
      BACKEND_URL,
      '- TIMEZONE -',
      getTimeZone(),
      '- CURRENCIES -',
      getCurrencies(),
      '- LANGUAGE -',
      getLocales()[0] && getLocales()[0].languageTag,
    );

    if (Platform.OS === 'android') {
      checkSmsReadPermission();
      checkSmsReceivePermission();
    }

    checkFirstLaunch();

    const unsubcribe = auth().onAuthStateChanged(async user => {
      if (user && authFlag) {
        // auth flag is used to prevent calling auth change state multiple times
        authFlag = false;
        let loggedIn = await AsyncStorage.getItem('@expenses-manager-logged');
        loggedIn = JSON.parse(loggedIn);
        if (loggedIn) {
          onGetUserDetails(async data => {
            await AsyncStorage.setItem(
              '@expenses-manager-user',
              JSON.stringify(data.user),
            );
          });
        }
        dispatch(serviceActions.setAppStatus({authenticated: true}));
        await AsyncStorage.setItem(
          '@expenses-manager-logged',
          JSON.stringify(true),
        );
      } else if (user && !authFlag) {
        dispatch(serviceActions.setAppStatus({authenticated: true}));
      }
    });

    const netEvent = NetInfo.addEventListener(async state => {
      let isConnected = state.isConnected;
      if (!isConnected && !userData) {
        let cachedUserData = await AsyncStorage.getItem(
          '@expenses-manager-user',
        );
        if (cachedUserData) {
          cachedUserData = JSON.parse(cachedUserData);
          setUserData(cachedUserData);
          setUserAdditionalDetails(cachedUserData);
        }
      }
    });

    return () => {
      unsubcribe();
      netEvent();
    };
  }, []);

  const checkSmsReadPermission = async () => {
    try {
      let granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('READ_SMS permissions granted Check Sms', granted);
      } else {
        // Alert.alert(
        //   'READ_SMS permissions denied',
        //   'Please enable it from permissions -> SMS > Allow to automatically add transactions by auto-reading SMS, Please restart the app after granting permission.',
        //   [
        //     {
        //       text: 'No Thanks!',
        //       style: 'cancel',
        //     },

        //     {
        //       text: 'Grant Permission',
        //       onPress: () => {
        //         Linking.openSettings();
        //       },
        //     },
        //   ],
        // );
        console.log('READ_SMS permissions denied');
      }
    } catch (err) {
      Alert.alert(err);
    }
  };

  const checkSmsReceivePermission = async () => {
    try {
      let granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log(
          'RECEIVE_SMS permissions granted Check Sms Received',
          granted,
        );
      } else {
        // Alert.alert(
        //   'RECEIVE_SMS permissions denied',
        //   'Please enable it from permissions -> SMS > Allow to automatically add transactions by auto-reading SMS, Please restart the app after granting permission.',
        //   [
        //     {
        //       text: 'No Thanks!',
        //       style: 'cancel',
        //     },

        //     {
        //       text: 'Grant Permission',
        //       onPress: () => {
        //         Linking.openSettings();
        //       },
        //     },
        //   ],
        // );
        console.log('RECEIVE_SMS permissions denied');
      }
    } catch (err) {
      Alert.alert(err);
    }
  };

  const checkFirstLaunch = () => {
    DeviceInfo.getFirstInstallTime()
      .then(dte => {
        let firstInstallDate = dte;
        let dateAfter3Days = moment(firstInstallDate).add(3, 'days');
        let isAfter3Days = moment().isAfter(dateAfter3Days);
        if (isAfter3Days) {
          requestAppReview();
        }
      })
      .catch(err => {
        console.log(err, 'Error in getting first install time');
      });
  };

  const requestAppReview = async () => {
    let appReviewAvailable = InAppReview.isAvailable();
    if (appReviewAvailable) {
      InAppReview.RequestInAppReview()
        .then(hasFlowFinishedSuccessfully => {
          // when return true in android it means user finished or close review flow
          if (Platform.OS === 'ios') {
            // when return true in ios it means review flow lanuched to user.
            console.log(
              'InAppReview in ios has launched successfully',
              hasFlowFinishedSuccessfully,
            );
          } else {
            console.log('InAppReview in android', hasFlowFinishedSuccessfully);
          }

          if (hasFlowFinishedSuccessfully) {
            // again set the variable to current Date
            AsyncStorage.setItem('@expenses-manager-review', 'reviewed');

            // do something for ios
            // do something for android
          }
        })
        .catch(err => {
          console.log(error, 'Error while in app review');
        });
    } else {
      Alert.alert(
        'Does not support',
        'In App Review not supported by this device',
      );
    }
  };

  const onGoogleAuthentication = async () => {
    dispatch(loaderActions.showLoader({backdrop: true}));
    try {
      const {idToken} = await GoogleSignin.signIn();
      // const getToken = await GoogleSignin.getTokens();
      const googleCredentials = auth.GoogleAuthProvider.credential(idToken);

      if (!googleCredentials) {
        dispatch(loaderActions.hideLoader());
        throw 'Something went wrong obtaining access token';
      }

      auth()
        .signInWithCredential(googleCredentials)
        .then(res => {
          onSignInSuccess(res);
        })
        .catch(err => {
          dispatch(loaderActions.hideLoader());
          console.log('error in google sign in ', err);
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: err.toString(),
            }),
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
        Alert.alert(
          'Google play services is not available ! Install and try again ',
        );
        console.warn(
          'Google play services is not available ! Install and try again ',
        );
      } else {
        console.log('Error in signin huff', error);
        // some other error happened
      }
    }
  };

  const onAppleAuthentication = async () => {
    dispatch(loaderActions.showLoader({backdrop: true}));
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple SIgn-In Failed - no identity token returned');
      }
      const {identityToken, nonce} = appleAuthRequestResponse;
      const appleCredentials = auth.AppleAuthProvider.credential(
        identityToken,
        nonce,
      );
      if (!appleCredentials) {
        throw new Error(
          'Apple SIgn-In Failed - no apple credentials  returned',
        );
      }
      auth()
        .signInWithCredential(appleCredentials)
        .then(res => {
          onSignInSuccess(res);
        })
        .catch(err => {
          dispatch(loaderActions.hideLoader());
          console.log('error in google sign in ', err);
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: err.toString(),
            }),
          );
        });
    } catch (error) {
      console.log(error, 'Error in sign in huff APPLE');
      dispatch(loaderActions.hideLoader());
    }
  };

  const onSignInWithEmail = async (email, password) => {
    try {
      let result = await auth().signInWithEmailAndPassword(email, password);
      onSignInSuccess(result);
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
      onSignInSuccess(result);
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
          'Password reset link has been sent to your email. If not received ,please check your spam box.',
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

  const onSignInWithMobile = async (phone, resend = false) => {
    try {
      let result = await auth().signInWithPhoneNumber(phone, resend);
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
        case 'auth/too-many-requests':
          error =
            'We have blocked all requests from this device due to unusual activity. Try again later.] error in initializing the phone base auhentication';
          break;
        case 'auth/network-request-failed':
          error = 'No Internet Connection!';
          break;
        default:
          error = 'An error occured , please try again later';
      }
      return {status: false, message: error};
    }
  };

  const onSignInSuccess = async data => {
    let currentUser = await auth().currentUser;
    let providerId = currentUser.providerData[0].providerId;
    let jwtToken = await auth().currentUser.getIdToken();
    let token = null;
    await messaging()
      .getToken()
      .then(t => {
        token = t;
      })
      .catch(err => {
        console.log(err);
      });
    let user = data.user;
    let timeZone = await getTimeZone();
    let transformedData = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      providerId: providerId,
      uid: user.uid,
      fcmToken: token,
      phoneNumber: user.phoneNumber,
      active: true,
      timeZone: timeZone,
      lastLogin: new Date(),
      platform: Platform.OS,
      model: DeviceInfo.getModel(),
      brand: DeviceInfo.getBrand(),
    };
    let oneSignalTags = {
      uid: user.uid,
    };
    if (transformedData.email) {
      oneSignalTags.email = transformedData.email;
    }
    OneSignal.sendTags(oneSignalTags);

    console.log(transformedData, 'transformed');
    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/user',
        data: transformedData,
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: async result => {
          if (result.user) {
            setUserData(result.user);
            setUserAdditionalDetails(result.user);
            await AsyncStorage.setItem(
              '@expenses-manager-user',
              JSON.stringify(result.user),
            );
          }
          sendRequest({
            type: 'POST',
            url: BACKEND_URL + '/notification/enable-notifications/',
            data: {},
            headers: {
              authorization: 'Bearer ' + jwtToken,
            },
          });
          dispatch(loaderActions.hideLoader());
        },
        errorCallback: err => {
          dispatch(loaderActions.hideLoader());
          console.log(err, ' error while storing user details to backend.');
        },
      },
    );
  };

  const onLogout = async () => {
    const signOut = async () => {
      await deleteUserPinCode('@expenses-manager-app-lock');
      await resetPinCodeInternalStates();
      await AsyncStorage.removeItem('@expenses-manager-user');
      await AsyncStorage.removeItem('@expenses-manager-logged');
      await AsyncStorage.removeItem('@expenses-manager-removed-transactions');
      authFlag = true;
      setUserData(null);
      setUserAdditionalDetails(null);
      messaging().deleteToken();
      dispatch(serviceActions.setAppStatus({authenticated: false}));
      dispatch(setChangesMade({status: false, loaded: true}));
    };
    OneSignal.deleteTags(['uid', 'email', 'dailyUpdateUid']);
    if (auth().currentUser) {
      let jwtToken = await auth().currentUser.getIdToken();
      auth()
        .signOut()
        .then(async () => {
          signOut();
        })
        .catch(err => {
          console.log(err, 'no user');
          dispatch(
            notificationActions.showToast({status: 'error', message: err}),
          );
        });
      // destroy the daily reminder notification and daily backup notification
      sendRequest({
        type: 'POST',
        url: BACKEND_URL + '/notification/destroy-notifications/',
        data: {},
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      });

      sendRequest({
        type: 'POST',
        url: BACKEND_URL + '/user/',
        data: {
          active: false,
          fcmToken: null,
        },
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      });
    } else {
      signOut();
    }
  };

  const onGetUserDetails = async (
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    let jwtToken = await auth().currentUser.getIdToken();
    sendRequest(
      {
        type: 'GET',
        url: BACKEND_URL + '/user/',
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: data => {
          setUserAdditionalDetails(data.user);
          setUserData(data.user);
          successCallBack(data);
        },
        errorCallback: () => {
          errorCallback();
          dispatch(loaderActions.hideLoader());
        },
      },
    );
  };

  return (
    <AuthenticationContext.Provider
      value={{
        onGoogleAuthentication,
        onAppleAuthentication,
        userData,
        onLogout,
        onSignInWithEmail,
        onSignUpWithEmail,
        onResetPassword,
        onSignInWithMobile,
        onSignInSuccess,
        setUserData,
        setUserAdditionalDetails,
        onSetUserAdditionalDetails,
        userAdditionalDetails,
        onGetUserDetails,
      }}>
      {children}
    </AuthenticationContext.Provider>
  );
};
