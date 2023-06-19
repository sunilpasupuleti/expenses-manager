/* eslint-disable handle-callback-err */
/* eslint-disable quotes */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState} from 'react';
import {createContext, useContext, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {setChangesMade} from '../../store/service-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import {SheetsContext} from '../sheets/sheets.context';
import useHttp from '../../hooks/use-http';
import auth from '@react-native-firebase/auth';
import remoteConfig from '@react-native-firebase/remote-config';

export const SyncContext = createContext({
  backUpData: () => null,
  restoreData: () => null,
  backUpAndRestore: () => null,
  onGetRestoreDates: () => null,
});

export const SyncContextProvider = ({children}) => {
  const {userData, onGetUserDetails, userAdditionalDetails} = useContext(
    AuthenticationContext,
  );
  const {expensesData, onSaveExpensesData, categories} =
    useContext(SheetsContext);
  const changesMade = useSelector(state => state.service.changesMade);
  const dispatch = useDispatch();
  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();

  let {sendRequest} = useHttp();

  useEffect(() => {
    if (userData) {
      if (changesMade.loaded) {
        if (!changesMade.status) {
          restoreData(null, true);
        }
      }
    }
  }, [userData, changesMade.status]);

  const backUpData = async () => {
    if (!expensesData) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'There is no data to create back up.',
        }),
      );
      return;
    }

    try {
      dispatch(
        loaderActions.showLoader({backdrop: true, loaderType: 'backup'}),
      );
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'POST',
          url: BACKEND_URL + '/backup',
          data: {
            ...expensesData,
            categories: categories,
          },
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async () => {
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                status: 'success',
                message: 'Your data backed up safely.',
              }),
            );
            dispatch(setChangesMade({status: false}));
          },
          errorCallback: err => {
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                status: 'error',
                message: 'Error in backing up your data.',
              }),
            );
            console.log(err, 'error in backup');
          },
        },
      );
    } catch (e) {
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Error in backing up your data.',
        }),
      );
      console.log(e, 'error in backup');
    }
  };

  const restoreData = async (backupId = null, initialRestore = false) => {
    let jwtToken = await auth().currentUser.getIdToken();
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'restore'}));
    try {
      let url = BACKEND_URL + '/backup';
      if (backupId) {
        url += '?id=' + backupId;
      }
      sendRequest(
        {
          type: 'GET',
          url: url,
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async result => {
            console.log('hehehe');
            if (result.backup) {
              onSaveExpensesData(result.backup);
              dispatch(loaderActions.hideLoader());
              dispatch(
                notificationActions.showToast({
                  status: 'success',
                  message: 'Data restored successfully.',
                }),
              );
            } else {
              dispatch(loaderActions.hideLoader());
              if (!initialRestore) {
                dispatch(
                  notificationActions.showToast({
                    status: 'info',
                    message: 'There is no data to restore.',
                  }),
                );
              }
            }
          },
          errorCallback: err => {
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                status: 'error',
                message: 'Error in restoring up your data.',
              }),
            );
            console.log(err, 'error in restore');
          },
        },
      );
    } catch (e) {
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Error occured in restoring data.',
        }),
      );
      console.log(e);
    }
  };

  const onGetRestoreDates = async (successCallBack = () => {}) => {
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'restore'}));
    let jwtToken = await auth().currentUser.getIdToken();
    sendRequest(
      {
        type: 'GET',
        url: BACKEND_URL + '/backup/all',
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: successCallBack,
        errorCallback: err => {
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while fetching restore dates.',
            }),
          );
          console.log('error in fetching restore dates', err);
        },
      },
    );
  };

  const backUpAndRestore = async () => {
    await backUpData().then(async () => {
      restoreData();
    });
  };

  return (
    <SyncContext.Provider
      value={{
        backUpData,
        restoreData,
        backUpAndRestore,
        onGetRestoreDates,
      }}>
      {children}
    </SyncContext.Provider>
  );
};
