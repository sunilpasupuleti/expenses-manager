/* eslint-disable react-hooks/exhaustive-deps */
import React, {useContext} from 'react';
import {createContext, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {serviceActions} from '../../store/service-slice';
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
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  resetPinCodeInternalStates,
  deleteUserPinCode,
} from '@haskkor/react-native-pincode';
import NetInfo from '@react-native-community/netinfo';
import appleAuth from '@invertase/react-native-apple-authentication';
import {OneSignal} from 'react-native-onesignal';
import moment from 'moment';
import InAppReview from 'react-native-in-app-review';
import {getCurrencies, getLocales, getTimeZone} from 'react-native-localize';
import DeviceInfo from 'react-native-device-info';
import database from '@react-native-firebase/database';
import {
  cancelLocalNotification,
  formatDate,
  getCurrentDate,
  getDataFromRows,
} from '../../components/utility/helper';
import {SQLiteContext} from '../sqlite/sqlite.context';
import _ from 'lodash';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';
import defaultCategories from '../../components/utility/defaultCategories.json';
import {SocketContext} from '../socket/socket.context';
import * as Sentry from '@sentry/react-native';

GoogleSignin.configure({
  webClientId: remoteConfig().getValue('WEB_CLIENT_ID').asString(),
});

export const AuthenticationContext = createContext({
  userAdditionalDetails: null,
  userDetailsFirebase: null,
  onGoogleAuthentication: () => null,
  onAppleAuthentication: () => null,
  onSignInWithEmail: () => null,
  onSignUpWithEmail: () => null,
  onSignInWithMobile: (data, verify, successCallBack, errorCallback) => null,
  onSignInSuccess: () => null,
  onResetPassword: () => null,
  userData: null,
  setUserData: null,
  onLogout: (forceLogout = false) => null,
  onSetUserAdditionalDetails: data => null,
  onSetUserDetailsFirebase: data => null,
  onGetUserDetails: (successCallBack, errorCallback) => null,
  fetchedUserDetails: false,
});

let authStateTriggered = false;

export const AuthenticationContextProvider = ({children}) => {
  const [userData, setUserData] = useState(null);
  const {initializeWebSocket, initializePlaidWebSocket} =
    useContext(SocketContext);
  const [userAdditionalDetails, setUserAdditionalDetails] = useState(null);
  const [userDetailsFirebase, setUserDetailsFirebase] = useState(null);
  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();
  const dispatch = useDispatch();
  const {sendRequest} = useHttp();
  const {createOrReplaceData, getData, deleteAllTablesData, db, executeQuery} =
    useContext(SQLiteContext);
  const appUpdateNeeded = useSelector(state => state.service.appUpdateNeeded);

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
  }, []);

  useEffect(() => {
    if (appUpdateNeeded) {
      onLogout(true);
    }
  }, [appUpdateNeeded]);

  // Account deleteion automatic logout hook
  useEffect(() => {
    if (!userData?.uid) return;

    const deletionRef = database().ref(`/accountDeletions/${userData.uid}`);
    const listener = deletionRef.on('value', async snapshot => {
      const data = snapshot.val();

      if (data?.status === 'deleted') {
        console.log('Account deletion detected via listener. Logging out...');
        await onLogout(true, true);
      }
    });
    return () => deletionRef.off('value', listener);
  }, [userData?.uid]);

  useEffect(() => {
    if (db) {
      const unsubcribe = auth().onAuthStateChanged(async user => {
        try {
          if (!user) {
            onLogout(true);
          } else if (user && !authStateTriggered) {
            // auth flag is used to prevent calling auth change state multiple times
            authStateTriggered = true;
            await onSignInSuccess();
          }
        } catch (err) {
          onLogout(true);
          dispatch(
            notificationActions.showToast({
              message: err.toString() + ' Error in Sign in ',
              status: 'error',
            }),
          );
        }
      });

      const netEvent = NetInfo.addEventListener(async state => {
        let isConnected = state.isConnected;
        if (!isConnected && !userData) {
          const uid = await AsyncStorage.getItem('@expenses-manager-uid');
          if (uid) {
            const data = await getData(
              `SELECT * FROM Users WHERE uid='${uid}'`,
            );
            const result = await getDataFromRows(data.rows);
            const uData = result[0];
            if (!userData && uData) {
              setUserData(uData);
              setUserAdditionalDetails(uData);
            }
          }

          // setUserData(cachedUserData);
          // setUserAdditionalDetails(cachedUserData);
        }
      });

      return () => {
        unsubcribe();
        netEvent();
      };
    }
  }, [db]);

  useEffect(() => {
    if (userData) {
      checkNotificationPermission();

      dispatch(serviceActions.setAppStatus({authenticated: true}));
    }
  }, [userData]);

  const showLoader = (loaderType, backdrop = true, loaderText = null) => {
    let options = {};
    if (loaderType) {
      options.loaderType = loaderType;
    }
    if (backdrop) {
      options.backdrop = backdrop;
    }
    if (loaderText) {
      options.loaderText = loaderText;
    }
    dispatch(loaderActions.showLoader({...options}));
  };

  const hideLoader = () => {
    dispatch(loaderActions.hideLoader());
  };

  const showNotification = (status = 'error', message) => {
    dispatch(
      notificationActions.showToast({
        status: status,
        message: message,
      }),
    );
  };

  const hideNotification = () => {
    dispatch(notificationActions.hideToast());
  };

  const onSetUserAdditionalDetails = data => {
    setUserAdditionalDetails(data);
  };

  const onSetUserDetailsFirebase = data => {
    setUserDetailsFirebase(data);
  };

  const checkNotificationPermission = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  };

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
    showLoader();
    try {
      const signInResponse = await GoogleSignin.signIn();
      if (signInResponse.type && signInResponse.type === 'cancelled') {
        hideLoader();
        return;
      }

      const {idToken} = signInResponse?.data;

      if (!idToken) {
        throw 'Unable to get the Id token';
      }

      // const getToken = await GoogleSignin.getTokens();
      const googleCredentials = auth.GoogleAuthProvider.credential(idToken);

      if (!googleCredentials) {
        throw 'Something went wrong obtaining access token';
      }
      let res = await auth().signInWithCredential(googleCredentials);
    } catch (error) {
      let errorMessage;
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Cancelled Sign In Flow';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        const msg =
          'Google play services is not available ! Install and try again ';
        Alert.alert(msg);
        errorMessage = msg;
      } else {
        errorMessage = 'Error in signin ' + error.toString();
        // some other error happened
      }
      console.error(errorMessage);
      hideLoader();
      Alert.alert(errorMessage);
    }
  };

  const onAppleAuthentication = async () => {
    showLoader();
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
        .then(res => {})
        .catch(err => {
          hideLoader();
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
      hideLoader();
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

  const onSignInWithMobile = async (
    data,
    verify = false,
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    try {
      const url = `${BACKEND_URL}/user/${verify ? 'verify-otp' : 'send-otp'}`;

      sendRequest(
        {
          type: 'POST',
          url: url,
          data: data,
        },
        {
          successCallback: async res => {
            if (verify && res.firebaseToken) {
              try {
                await auth().signInWithCustomToken(res.firebaseToken);
                successCallBack(res);
              } catch (firebaseError) {
                errorCallback('Login Failed ' + firebaseError.toString());
              }
            } else {
              successCallBack(res);
            }
          },
          errorCallback: errorCallback,
        },
      );
    } catch (e) {
      return {status: false, message: e};
    }
  };

  const onSignInSuccess = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        let currentUser = await auth().currentUser;
        const uid = currentUser.uid;

        const accountDeletionRequest = (
          await database().ref(`/accountDeletions/${uid}`).once('value')
        ).val();

        if (accountDeletionRequest?.status === 'deleted') {
          console.log('Account is marked as deleted. Logging out...');
          await onLogout(true, true);
          resolve(false);
          return;
        }

        let jwtToken = await auth().currentUser.getIdToken();
        let token = await messaging()
          .getToken()
          .catch(() => {});
        let timeZone = await getTimeZone();

        let transformedData = {
          displayName: null,
          email: null,
          photoURL: null,
          providerId: null,
          uid: null,
          fcmToken: token,
          phoneNumber: null,
          active: 1,
          timeZone: timeZone,
          lastLogin: getCurrentDate(),
          platform: Platform.OS,
          model: DeviceInfo.getModel(),
          brand: DeviceInfo.getBrand(),
        };

        let snapshot = await database().ref(`/users/${uid}`).once('value');
        const dataFromFirebase = snapshot.val();

        // if there is no data that means  it's a new user so we will add
        if (!dataFromFirebase) {
          OneSignal.InAppMessages.addTrigger('onboarding_complete', 'true');
        }

        OneSignal.InAppMessages.addTrigger('new_announcement', 'true');

        if (dataFromFirebase && dataFromFirebase.uid) {
          onSetUserDetailsFirebase(dataFromFirebase);
          const {
            displayName,
            email,
            photoURL,
            uid: dbUid,
            baseCurrency,
            phoneNumber,
            providerId,
            dailyReminderEnabled,
            dailyBackupEnabled,
            autoFetchTransactions,
            dailyReminderTime,
            lastSynced,
          } = dataFromFirebase;
          transformedData.displayName = displayName;
          transformedData.email = email;
          transformedData.photoURL = photoURL;
          transformedData.providerId = providerId;
          transformedData.uid = dbUid;
          transformedData.phoneNumber = phoneNumber;
          transformedData.providerId = providerId;
          transformedData.baseCurrency = baseCurrency;
          transformedData.dailyReminderEnabled = dailyReminderEnabled;
          transformedData.autoFetchTransactions = autoFetchTransactions;
          transformedData.dailyBackupEnabled = dailyBackupEnabled;
          transformedData.dailyReminderTime = dailyReminderTime;
          transformedData.lastSynced = lastSynced || '';
        } else {
          let providerId = currentUser.providerData[0].providerId;
          const {displayName, email, photoURL, phoneNumber} = currentUser;
          transformedData.displayName = displayName;
          transformedData.email = email;
          transformedData.photoURL = photoURL;
          transformedData.providerId = providerId;
          transformedData.uid = uid;
          transformedData.phoneNumber = phoneNumber;
          transformedData.providerId = providerId;
          transformedData.lastSynced = '';
        }

        let oneSignalTags = {
          uid: uid,
        };
        if (transformedData.email) {
          oneSignalTags.email = transformedData.email;
        }
        Sentry.setUser({
          id: uid,
          email: transformedData.email || 'No Email',
          username: transformedData.displayName || 'No Display Name',
        });
        await OneSignal.login(uid);

        await OneSignal.User.addTags(oneSignalTags);

        // Initialize web socket
        initializeWebSocket(uid);
        initializePlaidWebSocket(uid);

        // console.log(transformedData, 'transformed');
        await createOrReplaceData('Users', transformedData, 'uid');

        // create default categories if not exists
        let query = `SELECT * FROM Categories WHERE uid='${uid}'`;
        let result = await getData(query);
        if (result.rows.length === 0) {
          let values = defaultCategories
            .map(category => {
              const {name, type, color, icon, isDefault} = category;
              return `('${name}', '${type}', '${color}','${icon}', ${
                isDefault ? 1 : 0
              },'${uid}') `;
            })
            .join(',');

          let insertQuery = `INSERT INTO Categories (name, type, color, icon, isDefault, uid) VALUES ${values}`;
          await executeQuery(insertQuery);
        }

        await database()
          .ref('/users/' + transformedData.uid)
          .update(transformedData);

        setUserData(transformedData);
        setUserAdditionalDetails(transformedData);
        resolve(true);
        hideLoader();
        await AsyncStorage.setItem(
          '@expenses-manager-logged',
          JSON.stringify(true),
        );
        await AsyncStorage.setItem('@expenses-manager-uid', uid);
        await AsyncStorage.removeItem('@expenses-manager-data');

        sendRequest({
          type: 'POST',
          url: BACKEND_URL + '/notification/enable-notifications/',
          data: {},
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        });
      } catch (err) {
        console.log(err);
        hideLoader();
        showNotification('error', 'Error in setting the app ' + err.toString());
        reject(err);
      }
    });
  };

  const onLogout = async (forceLogout = false, accountDeleted = false) => {
    const signOut = async () => {
      if (!forceLogout || (forceLogout && accountDeleted)) {
        await deleteAllTablesData(true);
        await deleteUserPinCode('@expenses-manager-app-lock');
        await resetPinCodeInternalStates();
        await AsyncStorage.removeItem('@expenses-manager-removed-transactions');
        await AsyncStorage.removeItem('@expenses-manager-uid');
        await AsyncStorage.removeItem('@expenses-manager-data');
        hideNotification();
      }
      cancelLocalNotification(null, true);
      await AsyncStorage.removeItem('@expenses-manager-recap');
      await AsyncStorage.removeItem('@expenses-manager-logged');
      authStateTriggered = false;
      setUserData(null);
      setUserAdditionalDetails(null);
      messaging().deleteToken();
      dispatch(serviceActions.setAppStatus({authenticated: false}));
    };
    OneSignal.logout();
    OneSignal.User.removeTags(['uid', 'email', 'dailyUpdateUid']);
    if (auth().currentUser) {
      let uid = await auth().currentUser.uid;
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
      let transformedData = {
        active: 0,
        fcmToken: null,
      };
      if (!accountDeleted) {
        await database().ref(`/users/${uid}`).update(transformedData);
      }
    } else {
      signOut();
    }
  };

  const onGetUserDetails = async (
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    let uid = await auth().currentUser.uid;
    let results = await getData(`SELECT * FROM Users  WHERE uid='${uid}'`);

    let data = results?.rows?.item(0);
    if (data) {
      setUserData(data);
      setUserAdditionalDetails(data);
    }
    successCallBack(data);
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
        onSetUserDetailsFirebase,
        userDetailsFirebase,
        userAdditionalDetails,
        onGetUserDetails,
      }}>
      {children}
    </AuthenticationContext.Provider>
  );
};
