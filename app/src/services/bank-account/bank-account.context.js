import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { loaderActions } from '../../store/loader-slice';
import remoteConfig from '@react-native-firebase/remote-config';
import useHttp from '../../hooks/use-http';
import auth from '@react-native-firebase/auth';
import { notificationActions } from '../../store/notification-slice';
import moment from 'moment';
import { GetCurrencySymbol } from '../../components/symbol.currency';
import {
  hashCode,
  sendLocalNotification,
} from '../../components/utility/helper';
import PushNotification from 'react-native-push-notification';
import plaidCategories from '../../components/utility/plaidCategories.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthenticationContext } from '../authentication/authentication.context';
import { WatermelonDBContext } from '../watermelondb/watermelondb.context';

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
export const BankAccountContextProvider = ({ children }) => {
  const PLAID_BACKEND_URL = remoteConfig()
    .getValue('PLAID_BACKEND_URL')
    .asString();
  const { userData } = useContext(AuthenticationContext);
  const { db } = useContext(WatermelonDBContext);
  const dispatch = useDispatch();
  const { sendRequest } = useHttp();

  useEffect(() => {
    if (userData && db) {
      getRecurringTransactions(
        {},
        () => {},
        () => {},
        false,
        false,
      );
    }
  }, [userData, db]);

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
    dispatch(loaderActions.showLoader({ ...options }));
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

        // Schedule overdue notifications for missed payments
        if (daysUntilNext < 0) {
          next5daysSubscriptions.push(service);

          const daysOverdue = Math.abs(daysUntilNext);

          // Only schedule for payments overdue by 1-30 days (avoid spam for very old predictions)
          if (daysOverdue >= 1 && daysOverdue <= 30) {
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

            const isInflow = service.type === 'inflow';

            const now = moment();
            let overdueDate = moment().hour(10).minute(0).second(0);

            // If current time is already past 10 AM today, schedule for tomorrow at 10 AM
            if (now.isAfter(overdueDate)) {
              overdueDate = overdueDate.add(1, 'day');
            }

            overdueDate = overdueDate.toDate();
            ``;
            const overdueTitle = isInflow
              ? '⏰ Expected Payment Overdue'
              : '🚨 Payment Overdue';

            const overdueMessage = isInflow
              ? `Expected payment of ${currencySymbol}${amount.toFixed(
                  2,
                )} from ${serviceName} is ${daysOverdue} day${
                  daysOverdue === 1 ? '' : 's'
                } overdue. Check your ${
                  service.institutionName
                } account or contact ${serviceName}.`
              : `Your payment of ${currencySymbol}${amount.toFixed(
                  2,
                )} for ${serviceName} is ${daysOverdue} day${
                  daysOverdue === 1 ? '' : 's'
                } overdue! Please check your ${
                  service.institutionName
                } account.`;

            const overdueNotificationId = `recurring_overdue_${
              service.streamId || index
            }`;

            sendLocalNotification(
              {
                title: overdueTitle,
                message: overdueMessage,
                notificationId: hashCode(overdueNotificationId),
              },
              {
                streamId: service.streamId,
                type: 'recurring_overdue',
                serviceName: serviceName,
                isInflow: isInflow,
                originalId: overdueNotificationId,
                merchantLogo: service.merchantLogo,
                daysOverdue: daysOverdue,
              },
              overdueDate,
            );

            // Schedule follow-up reminders for severely overdue payments (7, 14 days)
            if (daysOverdue === 7 || daysOverdue === 14) {
              const followUpDate = moment()
                .hour(14) // 2 PM for follow-up
                .minute(0)
                .second(0)
                .add(1, 'hour')
                .toDate();

              const followUpTitle = isInflow
                ? '⚠️ Payment Still Missing'
                : '🚨 Urgent: Payment Still Overdue';

              const followUpMessage = isInflow
                ? `Expected payment from ${serviceName} is now ${daysOverdue} days overdue. You may want to contact them directly.`
                : `URGENT: Your ${serviceName} payment is ${daysOverdue} days overdue. Please take immediate action to avoid late fees.`;

              const followUpNotificationId = `recurring_followup_${daysOverdue}_${
                service.streamId || index
              }`;

              sendLocalNotification(
                {
                  title: followUpTitle,
                  message: followUpMessage,
                  notificationId: hashCode(followUpNotificationId),
                },
                {
                  streamId: service.streamId,
                  type: 'recurring_followup',
                  serviceName: serviceName,
                  isInflow: isInflow,
                  originalId: followUpNotificationId,
                  merchantLogo: service.merchantLogo,
                  daysOverdue: daysOverdue,
                },
                followUpDate,
              );
            }
          }
        }

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
    notify = true,
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
            if (notify) {
              showNotification('error', err);
            }
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
      }}
    >
      {children}
    </BankAccountContext.Provider>
  );
};
