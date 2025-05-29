import React, {createContext, useState, useEffect} from 'react';
import {Alert} from 'react-native';
import axios from 'axios';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import remoteConfig from '@react-native-firebase/remote-config';
import useHttp from '../../hooks/use-http';
import auth from '@react-native-firebase/auth';
import {notificationActions} from '../../store/notification-slice';

export const BankAccountContext = createContext({
  fetchLinkToken: (data, callback, errorCallback) => {},
  getTransactions: (data, successCallback, errorCallback, loader) => {},
  getLinkedBankAccounts: (callback, errorCallback) => {},
  getAccountBalance: (data, successCallback, errorCallback) => {},
  unlinkAccount: (data, successCallback, errorCallback) => {},
});

// BankAccountContext Provider
export const BankAccountContextProvider = ({children}) => {
  const PLAID_BACKEND_URL = remoteConfig()
    .getValue('PLAID_BACKEND_URL')
    .asString();

  const dispatch = useDispatch();
  const {sendRequest} = useHttp();

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

  const fetchLinkToken = async (
    data,
    callback = () => {},
    errorCallback = () => {},
  ) => {
    try {
      showLoader(
        'linkBank',
        true,
        data ? 'Update Bank Account' : 'Link New Account',
      );
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'POST',
          url: PLAID_BACKEND_URL + '/bank-account/link-token/',
          data: data,
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: res => {
            callback(res);
            hideLoader();
          },
          errorCallback: err => {
            errorCallback(err);
            hideLoader();
            showNotification('error', err);
          },
        },
      );
    } catch (error) {
      hideLoader();
      showNotification('error', error);
    }
  };

  const getLinkedBankAccounts = async (
    callback = () => {},
    errorCallback = () => {},
  ) => {
    try {
      showLoader('linkBank', true, 'Fetching Bank Accounts');
      let jwtToken = await auth().currentUser.getIdToken();

      sendRequest(
        {
          type: 'GET',
          url: PLAID_BACKEND_URL + '/bank-account/accounts/',
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async res => {
            callback(res);
            hideLoader();
          },
          errorCallback: err => {
            hideLoader();
            errorCallback();
            showNotification('error', err);
          },
        },
      );
    } catch (error) {
      hideLoader();
      showNotification('error', error);
    }
  };

  const getAccountBalance = async (
    data,
    callback = () => {},
    errorCallback = () => {},
  ) => {
    try {
      showLoader('bankBalance', true, 'Fetching Account Balance');
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'POST',
          data: data,
          url: PLAID_BACKEND_URL + '/bank-account/balance/',
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async res => {
            callback(res);
            hideLoader();
          },
          errorCallback: err => {
            hideLoader();
            errorCallback();
            showNotification('error', err);
          },
        },
      );
    } catch (error) {
      hideLoader();
      showNotification('error', error);
    }
  };

  const getTransactions = async (
    data,
    callback = () => {},
    errorCallback = () => {},
    loader = true,
  ) => {
    try {
      if (loader) {
        showLoader('security', false, 'Getting Transactions');
      }
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'POST',
          data: data,
          url: PLAID_BACKEND_URL + '/bank-account/transactions/',
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async res => {
            callback(res);
            hideLoader();
          },
          errorCallback: err => {
            hideLoader();
            errorCallback();
            showNotification('error', err);
          },
        },
      );
    } catch (error) {
      hideLoader();
      showNotification('error', error);
    }
  };

  const unlinkAccount = async (
    data,
    callback = () => {},
    errorCallback = () => {},
  ) => {
    try {
      console.log(data);

      showLoader('delete', true, 'Deleting Account');
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'POST',
          data: data,
          url: PLAID_BACKEND_URL + '/bank-account/unlink/',
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async res => {
            callback(res);
            hideLoader();
          },
          errorCallback: err => {
            hideLoader();
            errorCallback();
            showNotification('error', err);
          },
        },
      );
    } catch (error) {
      hideLoader();
      showNotification('error', error);
    }
  };

  return (
    <BankAccountContext.Provider
      value={{
        fetchLinkToken,
        getLinkedBankAccounts,
        getAccountBalance,
        unlinkAccount,
        getTransactions,
      }}>
      {children}
    </BankAccountContext.Provider>
  );
};
