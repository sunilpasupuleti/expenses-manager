/* eslint-disable handle-callback-err */
/* eslint-disable quotes */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { createContext, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { loaderActions } from '../../store/loader-slice';
import { notificationActions } from '../../store/notification-slice';
import auth from '@react-native-firebase/auth';
import { WatermelonDBContext } from '../watermelondb/watermelondb.context';
import { Q } from '@nozbe/watermelondb';
import { AuthenticationContext } from '../authentication/authentication.context';
import useHttp from '../../hooks/use-http';
import remoteConfig from '@react-native-firebase/remote-config';
import { SheetsContext } from '../sheets/sheets.context';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { getFileExtension, getMimeType } from '../../components/utility/helper';

const colors = [
  '#ff3a30',
  '#ff5722',
  '#fe9500',
  '#ffcc00',
  // '#cddc39',
  '#35c759',
  '#00acc1',
  '#2fb0c7',
  '#007aff',
  '#5756d5',
  '#fe2c54',
  '#af52de',
  '#8a7250',
  '#8e8e92',
  '#aeaeb1',
  '#c7c7cb',
  // '#d1d1d5',
  '#ce948e',
];

export const ChatBotContext = createContext({
  onQueryChatBot: (query, callback, successCallback) => {},
  onVoiceChat: (audioFilePath, callback, successCallback, errorCallback) => {},
  onFormResponseChatBot: (question, data, callback, errorCallback) => {},
});

export const ChatBotContextProvider = ({ children }) => {
  const { userData } = useContext(AuthenticationContext);
  const { onUpdateSheet } = useContext(SheetsContext);

  const { sendRequest } = useHttp();
  const { db, createRecord, findRecordById } = useContext(WatermelonDBContext);
  const dispatch = useDispatch();
  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();

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

        sendRequest(
          {
            type: 'POST',
            url: BACKEND_URL + '/chat-bot/query/',
            data: { query, categories, accounts },
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

                const { collectionName, sqlQuery, params, joinTables, type } =
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
                  // console.log('AI Summarized Results:', summarizedRecords);

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
            data: { question, data },
            headers: { authorization: 'Bearer ' + jwtToken },
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

  const onVoiceChat = async (
    audioFilePath,
    callback = () => {},
    errorCallback = () => {},
  ) => {
    // const resolvedData = {
    //   transcription: 'hi how are you',
    //   audioData: '',
    //   operation: 'other_query',
    //   claudeResponse: {},
    //   audioMimeType: '',
    //   response_text: 'Good thanks for the info',
    // };

    // callback(resolvedData);
    // return;
    return new Promise(async (resolve, reject) => {
      try {
        let jwtToken = await auth().currentUser.getIdToken();
        let accounts = await db
          .get('accounts')
          .query(Q.where('isLoanAccount', false))
          .fetch();
        accounts = accounts
          .map(r => {
            let summary = `Account Id:${r.id}: name: ${r.name}, currency: ${r.currency}`;

            return summary;
          })
          .join('; ');
        let categories = await db
          .get('categories')
          .query(Q.where('isLoanRelated', false))
          .fetch();
        categories = categories
          .map(r => {
            let summary = `Category Id:${r.id}: name: ${r.name}`;

            return summary;
          })
          .join('; ');

        const extension = getFileExtension(audioFilePath);
        const mimeType = getMimeType(extension);

        const formData = new FormData();
        formData.append('audio', {
          uri:
            Platform.OS === 'android'
              ? audioFilePath
              : audioFilePath.replace('file://', ''),
          type: mimeType,
          name: `voice.${extension}`,
        });
        formData.append('categories', categories);
        formData.append('accounts', accounts);

        sendRequest(
          {
            type: 'POST',
            url: BACKEND_URL + '/chat-bot/voice/',
            data: formData,
            headers: {
              authorization: 'Bearer ' + jwtToken,
              'Content-Type': 'multipart/form-data',
            },
          },
          {
            successCallback: async res => {
              try {
                const { data } = res;

                if (!data) {
                  throw 'No Claude response found.';
                }

                const {
                  transcription,
                  claudeResponse,
                  audioData,
                  audioMimeType,
                  response_text,
                } = data;

                console.log(data);

                const operation = claudeResponse.operation;
                const claudeData = claudeResponse.data || {};

                const trData = claudeData;
                const resolvedData = {
                  transcription,
                  audioData,
                  operation,
                  claudeResponse,
                  audioMimeType,
                  response_text,
                };

                const allowedOperations = [
                  'create_transaction',
                  'create_account',
                  'create_category',
                ];
                if (!allowedOperations.includes(operation)) {
                  callback(resolvedData);
                  resolve(resolvedData);
                } else {
                  if (operation === 'create_transaction') {
                    const transactions = trData
                      .filter(t => t.accountId)
                      .map(tx => {
                        const {
                          amount,
                          accountId,
                          categoryId,
                          notes,
                          date,
                          time,
                          showTime,
                          type,
                        } = tx;
                        return {
                          amount: amount,
                          accountId: accountId,
                          categoryId: categoryId,
                          notes: notes,
                          date: date,
                          time: time,
                          showTime: showTime,
                          isEmiPayment: false,
                          emiDate: null,
                          type: type,
                        };
                      });

                    await createRecord('transactions', transactions);
                    try {
                      await Promise.all(
                        transactions.map(async t => {
                          const sheet = await db
                            .get('accounts')
                            .query(
                              Q.experimentalJoinTables(['transactions']),
                              Q.where('id', t.accountId),
                            )
                            .fetch();

                          await onUpdateSheet(sheet[0]);
                        }),
                      );
                    } catch (err) {
                      throw err.toString();
                    }
                    callback(resolvedData);
                    resolve(resolvedData);
                  } else if (operation === 'create_category') {
                    const ctgries = trData.map(t => {
                      const { name, type } = t;
                      return {
                        name: name,
                        userId: userData.id,
                        isLoanRelated: false,
                        type: type,
                        color:
                          colors[Math.floor(Math.random() * colors.length)],
                      };
                    });
                    await createRecord('categories', ctgries);
                    callback(resolvedData);
                    resolve(resolvedData);
                  } else if (operation === 'create_account') {
                    const accnts = trData.map(t => {
                      const { name } = t;
                      return {
                        userId: userData.id,
                        name: name,
                        showSummary: true,
                        totalIncome: 0,
                        totalExpense: 0,
                        totalBalance: 0,
                        archived: false,
                        pinned: false,
                        currency: userData.baseCurrency,
                      };
                    });

                    await createRecord('accounts', accnts);
                    callback(resolvedData);
                    resolve(resolvedData);
                  } else {
                    callback(resolvedData);
                    resolve(resolvedData);
                  }
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
              const errMessage = err.message || err.toString();
              console.log(errMessage, '--------------');

              errorCallback(errMessage);
              hideLoader();
              showNotification('error', errMessage);
            },
          },
        );
      } catch (err) {
        errorCallback(err.toString());
        reject(err);
        showNotification('error', err.toString());
      }
    });
  };
  return (
    <ChatBotContext.Provider
      value={{ onQueryChatBot, onFormResponseChatBot, onVoiceChat }}
    >
      {children}
    </ChatBotContext.Provider>
  );
};
