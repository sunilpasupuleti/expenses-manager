/* eslint-disable react-hooks/exhaustive-deps */
import React, {useContext} from 'react';
import {createContext} from 'react';
import {useDispatch} from 'react-redux';
import auth from '@react-native-firebase/auth';
import remoteConfig from '@react-native-firebase/remote-config';
import useHttp from '../../hooks/use-http';
import {AuthenticationContext} from '../authentication/authentication.context';
import {notificationActions} from '../../store/notification-slice';
import {Alert} from 'react-native';
import {setChangesMade} from '../../store/service-slice';
import storage from '@react-native-firebase/storage';

export const ProfileContext = createContext({
  onUpdateProfile: (data, successCallBack, errorCallback) => null,
  onRemoveProfilePicture: (successCallBack, errorCallback) => null,
  onUpdateProfilePicture: (successCallBack, errorCallback) => null,
});

export const ProfileContextProvider = ({children}) => {
  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();
  const dispatch = useDispatch();
  const {sendRequest} = useHttp();

  const {
    onLogout,
    onGetUserDetails,
    userData,
    setUserData,
    onSetUserAdditionalDetails,
  } = useContext(AuthenticationContext);

  const onUpdateProfile = async (
    data,
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    let currentUser = await auth().currentUser;
    let providerId = currentUser.providerData[0].providerId;
    let updatedDetails = {};
    let {displayName, email} = data;

    currentUser
      .updateEmail(email)
      .then(() => {
        updatedDetails.email = email;
        currentUser
          .updateProfile({
            displayName: displayName,
          })
          .then(() => {
            updatedDetails.displayName = displayName;
            onSuccessUpdatingProfileData(
              updatedDetails,
              successCallBack,
              errorCallback,
            );
          })
          .catch(err => {
            errorCallback();
            console.log('Error occured in updating profile data ' + err);
            dispatch(
              notificationActions.showToast({
                message: 'Error in updating profile',
                status: 'error',
              }),
            );
          });
      })
      .catch(err => {
        let error = '';
        console.log(err.code, 'man error');
        const showError = () => {
          dispatch(
            notificationActions.showToast({
              message: error,
              status: 'error',
            }),
          );
        };
        switch (err.code) {
          case 'auth/invalid-email':
            error = 'Invalid email address';
            showError();
            break;
          case 'auth/email-already-in-use':
            error = 'Email-address is already in use! Try another email.';
            showError();
            break;
          case 'auth/requires-recent-login':
            Alert.alert(
              'We have to identify its you?',
              `For the security reasons, we should identify its you, so please re-login into our app again`,
              [
                {
                  text: 'RE-LOGIN',
                  onPress: () => {
                    onLogout();
                  },
                  style: 'default',
                },
                {
                  text: 'CANCEL',
                  onPress: () => {},
                  style: 'cancel',
                },
              ],
            );
            break;
          default:
            error = 'Error Occured while updating email-address.';
            showError();
            break;
        }
        errorCallback();
        console.log('Error occured in updating profile data email' + error);
      });
  };

  //   calling this after updating the profile data in firebase to update details in backend
  const onSuccessUpdatingProfileData = async (
    details,
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    let currentUser = await auth().currentUser;

    let jwtToken = await auth().currentUser.getIdToken();
    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/user/',
        data: {
          ...details,
        },
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: data => {
          dispatch(setChangesMade({status: true}));
          onSetUserAdditionalDetails(data.user);
          setUserData(data.user);
          currentUser.reload();
          successCallBack();
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message: 'Updated Profile Successfully',
            }),
          );
        },
        errorCallback: error => {
          errorCallback();
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: error,
            }),
          );
        },
      },
    );
  };

  const onRemoveProfilePicture = async (
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    let jwtToken = await auth().currentUser.getIdToken();
    sendRequest(
      {
        type: 'DELETE',
        url: BACKEND_URL + '/user/remove-profile-picture',
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: async result => {
          const onSuccess = () => {
            dispatch(setChangesMade({status: true}));
            successCallBack();
            dispatch(
              notificationActions.showToast({
                message: result.message,
                status: 'success',
              }),
            );
          };
          // call onsucces irrespective of geting user details failed or succefull
          onGetUserDetails(onSuccess, onSuccess);
        },
        errorCallback: err => {
          errorCallback();
          console.log('Error in removing profile picture', err);
          dispatch(
            notificationActions.showToast({
              message: err,
              status: 'error',
            }),
          );
        },
      },
    );
  };

  const onUpdateProfilePicture = async (
    photo,
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    let {extension, uri} = photo;
    try {
      // delete if image already exists
      let currentImagePath = userData.photoURL;
      let currentImageRef = storage().ref(currentImagePath);
      let currentImageExists = await currentImageRef
        .getMetadata()
        .then(() => true)
        .catch(() => false);
      if (currentImageExists) {
        await currentImageRef.delete();
      }

      let pictureName = `profile.${extension}`;
      let path = `users/${userData.uid}/${pictureName}`;
      let storageRef = storage().ref(path);
      let response = await storageRef.putFile(uri);
      let state = response.state;
      if (state === 'success') {
        let photoURL = path;
        await auth().currentUser.updateProfile({
          photoURL: photoURL,
        });

        onSuccessUpdatingProfileData(
          {photoURL: photoURL},
          successCallBack,
          errorCallback,
        );
      } else {
        throw 'Error occured while uploading profile picture';
      }
    } catch (e) {
      errorCallback();
      console.log('Error in updating profile picture', e);
      dispatch(
        notificationActions.showToast({
          message: e.toString(),
          status: 'error',
        }),
      );
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        onUpdateProfile,
        onRemoveProfilePicture,
        onUpdateProfilePicture,
      }}>
      {children}
    </ProfileContext.Provider>
  );
};
