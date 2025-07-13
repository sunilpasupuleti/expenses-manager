/* eslint-disable handle-callback-err */
/* eslint-disable quotes */
/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {createContext, useContext} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import auth from '@react-native-firebase/auth';
import {WatermelonDBContext} from '../watermelondb/watermelondb.context';
import {Q} from '@nozbe/watermelondb';
import {AuthenticationContext} from '../authentication/authentication.context';
import useHttp from '../../hooks/use-http';
import remoteConfig from '@react-native-firebase/remote-config';

export const ChatBotContext = createContext({
  onQueryChatBot: (query, callback, successCallback) => {},
  onFormResponseChatBot: (question, data, callback, errorCallback) => {},
});

export const ChatBotContextProvider = ({children}) => {
  const {userData} = useContext(AuthenticationContext);
  const {sendRequest} = useHttp();
  const {db} = useContext(WatermelonDBContext);
  const dispatch = useDispatch();
  const BACKEND_URL = remoteConfig().getValue('PLAID_BACKEND_URL').asString();

  const showLoader = (loaderType, backdrop = true, loaderText = '') => {
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

  const onSummarizeRecords = (records, collectionName) => {
    if (!records || records.length === 0) {
      return `No records found in ${collectionName}.`;
    }

    // Utility: Format key-value pairs into readable string
    const formatRecord = r =>
      Object.entries(r)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

    // For transactions example, extract top key info per record
    if (collectionName === 'transactions') {
      return records
        .map(r => {
          // Start with standard transaction fields
          let summary = `Transaction ${r.id}: amount: ${r.amount} ${r.currency}, date: ${r.date}, categoryName: ${r.categoryName}, accountName: ${r.accountName}, notes: ${r.notes}, type: ${r.type}`;

          // Include any extra computed fields dynamically
          const standardKeys = [
            'id',
            'amount',
            'currency',
            'date',
            'categoryName',
            'accountName',
            'notes',
            'type',
          ];
          Object.keys(r).forEach(key => {
            if (!standardKeys.includes(key)) {
              summary += `, ${key}: ${r[key]}`;
            }
          });

          return summary;
        })
        .join('; ');
    }

    // For accounts
    if (collectionName === 'accounts') {
      return records
        .map(r => {
          let summary = `Account ${r.id}: name: ${r.name}, currency: ${r.currency}, balance: ${r.totalBalance}, income: ${r.totalIncome}, expense: ${r.totalExpense}`;

          // Include any extra computed fields dynamically
          const standardKeys = [
            'id',
            'name',
            'currency',
            'totalBalance',
            'totalIncome',
            'totalExpense',
          ];
          Object.keys(r).forEach(key => {
            if (!standardKeys.includes(key)) {
              summary += `, ${key}: ${r[key]}`;
            }
          });

          return summary;
        })
        .join('; ');
    }

    // For categories
    if (collectionName === 'categories') {
      return records
        .map(r => {
          let summary = `Category ${r.id}: name: ${r.name}, type: ${r.type}`;

          // Include any extra computed fields dynamically
          const standardKeys = ['id', 'name', 'type'];
          Object.keys(r).forEach(key => {
            if (!standardKeys.includes(key)) {
              summary += `, ${key}: ${r[key]}`;
            }
          });

          return summary;
        })
        .join('; ');
    }

    // Default fallback for unknown collection types
    return records.map(formatRecord).join('; ');
  };

  const onQueryChatBot = async (
    query,
    callback = () => {},
    errorCallback = () => {},
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        let jwtToken = await auth().currentUser.getIdToken();
        let categories = (await userData.categories.fetch()) || [];
        categories = categories.map(c => `${c.name}`).join(',');
        let accounts = (await userData.accounts.fetch()) || [];
        accounts = accounts.map(a => `${a.name}`).join(',');

        // const records = await db
        //   .get('transactions')
        //   .query(
        //     Q.unsafeSqlQuery(
        //       `SELECT transactions.type, SUM(transactions.amount) as total FROM transactions WHERE transactions.date >= '2025-07-01 00:00:00' AND transactions.date <= '2025-07-08 00:00:00' GROUP BY transactions.type`,
        //     ),
        //   )
        //   .unsafeFetchRaw();
        // console.log(records);
        // throw 'err';

        sendRequest(
          {
            type: 'POST',
            url: BACKEND_URL + '/chat-bot/query/',
            data: {query, categories, accounts},
            headers: {
              authorization: 'Bearer ' + jwtToken,
            },
          },
          {
            successCallback: async res => {
              try {
                const claudeResponse = res?.claudeResponse; // Adjust based on actual API response key

                if (!claudeResponse) {
                  throw 'No Claude response found.';
                }

                const {collectionName, sqlQuery, params, joinTables, type} =
                  claudeResponse;

                if (type === 'query') {
                  // 🔥 Execute DB query dynamically
                  const records = await db
                    .get(collectionName)
                    .query(
                      ...(joinTables && joinTables.length > 0
                        ? [Q.experimentalJoinTables(joinTables)]
                        : []),
                      Q.unsafeSqlQuery(
                        sqlQuery,
                        params && params.length > 0 ? params : [],
                      ),
                    )
                    .unsafeFetchRaw();

                  const summarizedRecords = onSummarizeRecords(
                    records,
                    collectionName,
                  );
                  console.log('AI Summarized Results:', summarizedRecords);

                  callback({
                    html: null,
                    formatting: true,
                  });

                  const finalAnswer = await onFormResponseChatBot(
                    query,
                    summarizedRecords,
                  );
                  // console.log(finalAnswer);

                  // Return results to caller
                  callback(finalAnswer);
                  resolve(finalAnswer);
                } else {
                  callback(claudeResponse);
                  resolve(claudeResponse);
                }
              } catch (err) {
                console.error('DB Query Error:', err);
                errorCallback(err);
                reject(
                  'There was some error occured while reading the data. Please try again later!',
                );
              }
            },
            errorCallback: err => {
              errorCallback(
                'Error occured for the following query, can you please try again!',
              );
              hideLoader();
              showNotification('error', err);
            },
          },
        );
      } catch (err) {
        reject(err);
        showNotification('error', err.toString());
      }
    });
  };

  const onFormResponseChatBot = async (
    question,
    data,
    callback = () => {},
    errorCallback = () => {},
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        let jwtToken = await auth().currentUser.getIdToken();

        sendRequest(
          {
            type: 'POST',
            url: BACKEND_URL + '/chat-bot/form-response/',
            data: {question, data},
            headers: {authorization: 'Bearer ' + jwtToken},
          },
          {
            successCallback: res => {
              const finalAnswer = res;
              callback(finalAnswer);
              resolve(finalAnswer);
            },
            errorCallback: err => {
              errorCallback(err);
              showNotification('error', err);
              reject(err);
            },
          },
        );
      } catch (err) {
        reject(err);
        showNotification('error', err.toString());
      }
    });
  };

  return (
    <ChatBotContext.Provider value={{onQueryChatBot, onFormResponseChatBot}}>
      {children}
    </ChatBotContext.Provider>
  );
};
