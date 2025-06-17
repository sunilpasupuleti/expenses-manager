/* eslint-disable react-hooks/exhaustive-deps */
import React, {useContext} from 'react';
import {createContext} from 'react';
import {useDispatch} from 'react-redux';
import auth from '@react-native-firebase/auth';
import remoteConfig from '@react-native-firebase/remote-config';
import {AuthenticationContext} from '../authentication/authentication.context';
import {notificationActions} from '../../store/notification-slice';
import {Alert} from 'react-native';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';
import {useNetInfo} from '@react-native-community/netinfo';
import {loaderActions} from '../../store/loader-slice';
import {getFirebaseAccessUrl} from '../../components/utility/helper';
import RNFetchBlob from 'rn-fetch-blob';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {WatermelonDBContext} from '../watermelondb/watermelondb.context';

export const ProfileContext = createContext({
  onUpdateProfile: (data, successCallBack, errorCallback) => null,
  onRemoveProfilePicture: (successCallBack, errorCallback) => null,
  onUpdateProfilePicture: (successCallBack, errorCallback) => null,
  onDownloadProfilePicture: (successCallBack, errorCallback) => null,
});

export const ProfileContextProvider = ({children}) => {
  const dispatch = useDispatch();
  const {db, findRecordById} = useContext(WatermelonDBContext);

  const {isConnected} = useNetInfo();

  const {onLogout, onGetUserDetails, userData} = useContext(
    AuthenticationContext,
  );

  const showLoader = (loaderType, backdrop = true) => {
    let options = {};
    if (loaderType) {
      options.loaderType = loaderType;
    }
    if (backdrop) {
      options.backdrop = backdrop;
    }
    dispatch(loaderActions.showLoader(options));
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

  const onUpdateProfile = async (
    data,
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    try {
      if (!isConnected) {
        throw 'No Internet Connection';
      }
      let currentUser = await auth().currentUser;
      let {displayName, email} = data;
      let updatedDetails = {};
      if (
        email === currentUser.email &&
        displayName === currentUser.displayName
      ) {
        successCallBack();
        return dispatch(
          notificationActions.showToast({
            status: 'warning',
            message: 'No changes made to update',
          }),
        );
      }
      if (email !== currentUser.email) {
        await currentUser.updateEmail(email);
        updatedDetails.email = email;
      }

      if (displayName !== currentUser.displayName) {
        await currentUser.updateProfile({
          displayName: displayName,
        });
        updatedDetails.displayName = displayName;
      }

      onSuccessUpdatingProfileData(
        updatedDetails,
        successCallBack,
        errorCallback,
      );
      successCallBack(updatedDetails);
      showNotification('success', 'Profile Updated');
    } catch (err) {
      let error = err.toString();
      console.log(`Error occurred in updating profile: ${err.code}`, err);

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
          error = 'Error Occured while updating ' + err.toString();
          showError();
          break;
      }
      errorCallback();
    }
  };

  //   calling this after updating the profile data in firebase to update details in backend
  const onSuccessUpdatingProfileData = async (
    details,
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    try {
      let currentUser = await auth().currentUser;
      const uid = currentUser.uid;
      const userRecord = await findRecordById('users', 'id', userData.id);

      if (!userRecord) {
        throw 'User not found in DB';
      }

      await db.write(async () => {
        await userData.update(record => {
          Object.keys(details).forEach(key => {
            if (key in record && typeof record[key] !== 'function') {
              record[key] = details[key];
            }
          });
        });
      });

      await database().ref(`/users/${uid}`).update(details);
      await onGetUserDetails();
      currentUser.reload();
      successCallBack();
    } catch (err) {
      errorCallback();
    }
  };

  const onRemoveProfilePicture = async (
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    try {
      if (!isConnected) {
        throw 'No Internet Connection';
      }
      let photoURL = userData.photoURL;
      let currentImageRef = storage().ref(photoURL);
      let currentImageExists = await currentImageRef
        .getMetadata()
        .then(() => true)
        .catch(() => false);
      if (currentImageExists) {
        await currentImageRef.delete();
      }
      await auth().currentUser.updateProfile({
        photoURL: null,
      });

      onSuccessUpdatingProfileData(
        {photoURL: null},
        successCallBack,
        errorCallback,
      );
      successCallBack();
      showNotification('success', 'Profile picture removed successfully');
    } catch (e) {
      errorCallback();
      hideLoader();
      showNotification('error', e.toString());
    }
  };

  const onUpdateProfilePicture = async (
    photo,
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    try {
      if (!isConnected) {
        throw 'No Internet Connection';
      }
      let {extension, uri} = photo;

      // delete if image already exists
      let currentImagePath = userData.photoURL;
      if (currentImagePath) {
        let currentImageRef = storage().ref(currentImagePath);
        let currentImageExists = await currentImageRef
          .getMetadata()
          .then(() => true)
          .catch(() => false);
        if (currentImageExists) {
          await currentImageRef.delete();
        }
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
        showNotification('success', 'Profile picture updated successfully');
      } else {
        throw 'Error occured while uploading profile picture';
      }
    } catch (e) {
      errorCallback();
      console.error('Error in updating profile picture', e);
      showNotification('error', e.toString());
    }
  };

  const onDownloadProfilePicture = async (
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    try {
      if (!userData || !userData.photoURL) {
        throw 'No Image Found';
      }
      if (!isConnected) {
        throw 'No Internet connection';
      }
      // Getting the extention of the file
      // get bytes
      let photoURL = userData.photoURL;
      let extension;
      if (photoURL && photoURL.startsWith('users/')) {
        photoURL = getFirebaseAccessUrl(userData.photoURL);
        let extRegex = /\.(png|jpe?g|gif|bmp|webp)/i;
        extension = photoURL.match(extRegex)?.[0];
      }

      showLoader('image_upload');

      const res = await RNFetchBlob.config({
        fileCache: true,
        appendExt: extension,
      }).fetch('GET', photoURL);
      await CameraRoll.saveToCameraRoll(res.data);
      showNotification(
        'success',
        'Profile Picture saved to your Gallery/Photos',
      );
      hideLoader();
      successCallBack();
    } catch (e) {
      errorCallback();
      hideLoader();
      showNotification('error', e.toString());
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        onUpdateProfile,
        onRemoveProfilePicture,
        onUpdateProfilePicture,
        onDownloadProfilePicture,
      }}>
      {children}
    </ProfileContext.Provider>
  );
};
