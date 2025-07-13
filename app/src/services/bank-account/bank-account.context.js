import React, {createContext, useState, useEffect} from 'react';
import {Alert} from 'react-native';
import axios from 'axios';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import remoteConfig from '@react-native-firebase/remote-config';
import useHttp from '../../hooks/use-http';
import auth from '@react-native-firebase/auth';
import {notificationActions} from '../../store/notification-slice';
import moment from 'moment';
import {GetCurrencySymbol} from '../../components/symbol.currency';
import {hashCode, sendLocalNotification} from '../../components/utility/helper';
import PushNotification from 'react-native-push-notification';
import plaidCategories from '../../components/utility/plaidCategories.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getShortDescription = detailedCategory => {
  const match = plaidCategories.find(cat => cat.detailed === detailedCategory);
  return match ? match.shortDescription : '';
};

export const BankAccountContext = createContext({
  fetchLinkToken: (data, callback, errorCallback) => {},
  getTransactions: (data, successCallback, errorCallback, loader) => {},
  getRecurringTransactions: (
    data,
    successCallback,
    errorCallback,
    loader,
  ) => {},
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

  const scheduleRecurringTransactionNotifications =
    async recurringTransactions => {
      if (!recurringTransactions) return;

      // Handle both inflow and outflow active transactions
      const allActiveTransactions = [
        ...(recurringTransactions.inflow?.active || []).map(service => ({
          ...service,
          type: 'inflow',
        })),
        ...(recurringTransactions.outflow?.active || []).map(service => ({
          ...service,
          type: 'outflow',
        })),
      ];

      if (allActiveTransactions.length === 0) return;
      const next5daysSubscriptions = [];

      allActiveTransactions.forEach(async (service, index) => {
        const predictedNextDate = moment(service.predictedNextDate)
          .format('YYYY-MM-DD')
          .toString();

        if (!predictedNextDate) return;

        const nextDate = moment(predictedNextDate);
        const today = moment().startOf('day');
        const daysUntilNext = nextDate.diff(today, 'days');

        // Only schedule if within next 5 days (to catch 2-day reminder)
        if (daysUntilNext >= 0 && daysUntilNext <= 5) {
          next5daysSubscriptions.push(service);

          const currencySymbol = GetCurrencySymbol(
            service.currencyCode || 'USD',
          );
          const amount =
            Math.abs(service.averageAmount || service.lastAmount) || 0;

          const shortDescription = getShortDescription(
            service.detailedCategory,
          );
          const serviceName =
            `${shortDescription} (${service.serviceName})` ||
            service.serviceName ||
            service.merchantName ||
            'Unknown Service';

          // Different messaging for inflow vs outflow
          const isInflow = service.type === 'inflow';

          // Schedule reminder 2 days before (if applicable)
          if (daysUntilNext >= 2) {
            const reminderDate = moment(predictedNextDate, 'YYYY-MM-DD')
              .subtract(2, 'days')
              .hour(9)
              .minute(0)
              .second(0)
              .toDate();

            const reminderTitle = isInflow
              ? 'Incoming Payment Reminder'
              : 'Payment Reminder';

            const reminderMessage = isInflow
              ? `Reminder: You should receive apprx ${currencySymbol}${amount.toFixed(
                  2,
                )} from ${serviceName} to your ${
                  service.institutionName
                } account in 2 days (${moment(predictedNextDate).format(
                  'MMM DD',
                )}).`
              : `Reminder: Your payment of ${currencySymbol}${amount.toFixed(
                  2,
                )} for ${serviceName} will be debited from your ${
                  service.institutionName
                } account in 2 days (${moment(predictedNextDate).format(
                  'MMM DD',
                )}).`;

            const notificationId = `recurring_reminder_${
              service.streamId || index
            }`;

            sendLocalNotification(
              {
                title: reminderTitle,
                message: reminderMessage,
                notificationId: hashCode(notificationId),
              },
              {
                streamId: service.streamId,
                type: 'recurring_reminder',
                serviceName: serviceName,
                isInflow: isInflow,
                originalId: notificationId,
                merchantLogo: service.merchantLogo,
              },
              reminderDate,
            );
          }

          // Schedule notification on the actual date (if within 3 days)
          if (daysUntilNext >= 0 && daysUntilNext <= 3) {
            const scheduleDate = moment(predictedNextDate)
              .hour(9)
              .minute(0)
              .second(0)
              .toDate();

            const notificationTitle = isInflow
              ? '💰 Payment Expected Today'
              : '💳 Payment Due';

            const notificationMessage = isInflow
              ? `You should receive apprx ${currencySymbol}${amount.toFixed(
                  2,
                )} from ${serviceName} to your ${
                  service.institutionName
                } account today. Check your account!`
              : `Your payment of ${currencySymbol}${amount.toFixed(
                  2,
                )} for ${serviceName} will be debited from your ${
                  service.institutionName
                } account ${
                  daysUntilNext === 0
                    ? 'today'
                    : daysUntilNext === 1
                    ? 'tomorrow'
                    : `in ${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''}`
                }.`;

            const notificationId = `recurring_due_${service.streamId || index}`;

            sendLocalNotification(
              {
                title: notificationTitle,
                message: notificationMessage,
                notificationId: hashCode(notificationId),
              },
              {
                streamId: service.streamId,
                type: 'recurring_due',
                serviceName: serviceName,
                isInflow: isInflow,
                originalId: notificationId,
                merchantLogo: service.merchantLogo,
              },
              scheduleDate,
            );
          }
        }
      });

      await AsyncStorage.setItem(
        '@expenses-manager-subscriptions',
        JSON.stringify(next5daysSubscriptions),
      );
    };

  const cancelRecurringTransactionNotifications = async () => {
    return new Promise(async resolve => {
      await AsyncStorage.removeItem('@expenses-manager-subscriptions');
      PushNotification.getScheduledLocalNotifications(notifications => {
        notifications.forEach(notification => {
          const id = notification?.id?.toString();
          const notificationType = notification?.data?.type;
          const originalId =
            notification?.data?.originalId ||
            notification?.userInfo?.originalId;

          // Cancel notifications that start with 'recurring_' or have type 'recurring_reminder' or 'recurring_due'
          if (
            originalId?.startsWith('recurring_') ||
            notificationType === 'recurring_reminder' ||
            notificationType === 'recurring_due'
          ) {
            PushNotification.cancelLocalNotification(id);
          }
        });
        resolve();
      });
    });
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

  const getRecurringTransactions = async (
    data,
    callback = () => {},
    errorCallback = () => {},
    loader = true,
  ) => {
    try {
      if (loader) {
        showLoader('', true, 'Getting Subscriptions Data');
      }
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'POST',
          data: data,
          url: PLAID_BACKEND_URL + '/bank-account/transactions/recurring',
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async res => {
            callback(res.recurring);
            await cancelRecurringTransactionNotifications();
            scheduleRecurringTransactionNotifications(res.recurring);
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
        getRecurringTransactions,
      }}>
      {children}
    </BankAccountContext.Provider>
  );
};
