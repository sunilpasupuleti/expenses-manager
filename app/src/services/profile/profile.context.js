/* eslint-disable react-hooks/exhaustive-deps */
import React, {useContext} from 'react';
import {createContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import auth from '@react-native-firebase/auth';
import {loaderActions} from '../../store/loader-slice';
import remoteConfig from '@react-native-firebase/remote-config';
import useHttp from '../../hooks/use-http';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthenticationContext} from '../authentication/authentication.context';
import {notificationActions} from '../../store/notification-slice';

export const ProfileContext = createContext({
  onUpdateProfile: (data, successCallBack, errorCallback) => null,
});

export const ProfileContextProvider = ({children}) => {
  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();
  const dispatch = useDispatch();
  const {sendRequest} = useHttp();

  const {userData, onGetUserDetails} = useContext(AuthenticationContext);

  const onUpdateProfile = async (
    data,
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    let currentUser = await auth().currentUser;
    let providerId = currentUser.providerData[0].providerId;
    let updatedDetails = {};
    let {displayName, email, phoneNumber} = data;
    let error = null;
    console.log(providerId);
    const updateData = async () => {
      if (displayName && displayName !== userData.displayName) {
        await currentUser
          .updateProfile({
            displayName: displayName,
          })
          .then(() => (updatedDetails.displayName = displayName))
          .catch(err => {
            error = 'Error in updating name ' + err;
            throw new Error(error);
          });
      }
      // if (email && email !== userData.email && !error) {
      await currentUser
        .updateEmail(email)
        .then(() => (updatedDetails.email = email))
        .catch(err => {
          switch (err.code) {
            case 'auth/invalid-email':
              error = 'Invalid email address';
              break;
            case 'auth/email-already-in-use':
              error = 'Email-address is already in use! Try another email.';
              break;
            case 'auth/requires-recent-login':
              error = 'Email-address is already in use! Try another email.';
              currentUser.reauthenticateWithCredential();
              onUpdateProfile(data, successCallBack, errorCallback);
              break;
            default:
              error = 'Error Occured while updating email-address.';
              break;
          }
          console.log(err.code, 'Error in updating email-address');
          throw new Error(error);
        });
      // }
    };

    updateData()
      .then(() => {
        onSuccessUpdatingProfileData(
          updatedDetails,
          successCallBack,
          errorCallback,
        );
      })
      .catch(e => {
        errorCallback();
        console.log('Error occured while updating profile ', error);
        dispatch(
          notificationActions.showToast({
            message: error,
            status: 'error',
          }),
        );
      });
  };

  //   calling this after updating the profile data in firebase to update details in backend
  const onSuccessUpdatingProfileData = async (
    details,
    successCallBack = () => {},
    errorCallback = () => {},
  ) => {
    let currentUser = await auth().currentUser;

    console.log(details);

    let jwtToken = await auth().currentUser.getIdToken();
    sendRequest(
      {
        type: 'POST',
        url: 'http://192.168.29.104:3000' + '/user/',
        data: {
          ...details,
        },
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: () => {
          currentUser.reload();
          successCallBack();
          onGetUserDetails();
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

  return (
    <ProfileContext.Provider
      value={{
        onUpdateProfile,
      }}>
      {children}
    </ProfileContext.Provider>
  );
};
