import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, useContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {setChangesMade} from '../../store/service-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import {saveCategoryRequest, saveSheetRequest} from './sheets.service';
import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';
import useHttp from '../../hooks/use-http';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import _ from 'lodash';
import matchWords from '../../components/utility/category-match-words.json';
import XLSX from 'xlsx';
import moment from 'moment';
import {zip} from 'react-native-zip-archive';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../components/symbol.currency';
import {useTheme} from 'styled-components/native';
import SmsAndroid from 'react-native-get-sms-android';
import {smsTransactionsActions} from '../../store/smsTransactions-slice';
import {getTimeZone} from 'react-native-localize';
import {getTransactionInfo} from 'transaction-sms-parser';
import SmsListener from 'react-native-android-sms-listener';
import exampleData from '../../components/utility/mindee-response.json';

const defaultCategories = {
  expense: [
    {
      id: 'ex1',
      name: 'No Category',
      color: '#8e8e92',
      default: true,
      icon: 'close',
    },
    {
      id: 'ex2',
      name: 'Groceries',
      color: '#2fb0c7',
      icon: 'store-settings',
    },
    {
      id: 'ex3',
      name: 'Food & Drink',
      color: '#5756d5',
      icon: 'food',
    },

    {
      id: 'ex4',
      name: 'Transport',
      color: '#007aff',
      icon: 'road-variant',
    },
    {
      id: 'ex5',
      name: 'Rent',
      color: '#ffcc00',
      icon: 'greenhouse',
    },
    {
      id: 'ex6',
      name: 'Entertainment',
      color: '#fe9500',
      icon: 'movie',
    },
    {
      id: 'ex7',
      name: 'Others',
      color: '#d1d1d5',
      icon: 'dots-horizontal',
    },
  ],
  income: [
    {
      id: 'in1',
      name: 'No Category',
      color: '#8e8e92',
      default: true,
      icon: 'close',
    },
    {
      id: 'in2',
      name: 'Salary',
      color: '#FE6667',
      icon: 'laptop',
    },
    {
      id: 'in3',
      name: 'Budget',
      color: '#0F9F08',
      icon: 'calculator',
    },
    {
      id: 'ex7',
      name: 'Others',
      color: '#d1d1d5',
      icon: 'dots-horizontal',
    },
  ],
};

export const SheetsContext = createContext({
  sheets: [],
  categories: defaultCategories,
  expensesData: {},
  onSaveSheet: (sheet, callback = () => null) => null,
  onSaveCategory: (category, type, callback = () => null) => null,
  onSaveSheetDetails: (sheet, sheetDetail, callback = () => null) => null,
  onSaveExpensesData: () => null,
  onEditSheet: () => null,
  onEditSheetDetails: (sheet, sheetDetail, callback = () => null) => null,
  onEditCategory: (category, type, callback = () => null) => null,
  onDeleteSheet: () => null,
  onDeleteSheetDetails: (sheet, sheetDetail, callback = () => null) => null,
  onDeleteCategory: () => null,
  getSheetById: () => null,
  onMoveSheets: (sheet, moveToSheet, sheetDetail, callback = () => null) =>
    null,
  onDuplicateSheet: (sheet, sheetDetail, callback = () => null) => null,
  onChangeSheetType: (sheet, sheetDetail, callback = () => null) => null,
  onExportData: () => null,
  onExportDataToExcel: (config, data, callback) => null,
  onExportAllDataToPdf: () => null,
  onExportDataToPdf: (config, sheet, callback) => null,
  onImportData: () => null,
  onArchiveSheet: () => null,
  onPinSheet: () => null,
  calculateBalance: sheet => null,
  onExportAllSheetsToExcel: config => null,
  onGoogleCloudVision: (base64, callback) => null,
  onUpdateDailyReminder: (dailyReminder, callback) => null,
  onUpdateDailyBackup: (enabled, callback) => null,
  onUpdateAutoFetchTransactions: (enabled, callback) => null,
  onUpdateBaseCurrency: (currency, callback) => null,
  onSmartScanReceipt: (base64, callback) => null,
  getMessages: () => {},
  baseCurrency: {},
  setBaseCurrency: null,
});

export const SheetsContextProvider = ({children}) => {
  const [sheets, setSheets] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [expensesData, setExpensesData] = useState(null);

  const [autoFetchTransactionsOpened, setAutoFetchTransactionsOpened] =
    useState(false);

  const {userData, onSetUserAdditionalDetails, userAdditionalDetails} =
    useContext(AuthenticationContext);
  const {sendRequest} = useHttp();

  const dispatch = useDispatch();
  const theme = useTheme();

  const [baseCurrency, setBaseCurrency] = useState({
    dialog: false,
    currency: null,
  });

  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();
  const MINDEE_API_KEY = remoteConfig().getValue('MINDEE_API_KEY').asString();
  const MINDEE_API_URL = remoteConfig().getValue('MINDEE_API_URL').asString();

  const GOOGLE_API_KEY = remoteConfig().getValue('GOOGLE_API_KEY').asString();
  const GOOGLE_CLOUD_VISION_API_URL = remoteConfig()
    .getValue('GOOGLE_CLOUD_VISION_API_URL')
    .asString();

  useEffect(() => {
    if (userData) {
      retrieveExpensesData();
    }
  }, [userData]);

  useEffect(() => {
    let smsSubscription;
    if (userAdditionalDetails) {
      if (
        Platform.OS === 'android' &&
        userAdditionalDetails.autoFetchTransactions &&
        userAdditionalDetails.baseCurrency &&
        !autoFetchTransactionsOpened
      ) {
        setTimeout(() => {
          setAutoFetchTransactionsOpened(true);
          getMessages();
        }, 1000 * 10);
      }

      if (
        Platform.OS === 'android' &&
        userAdditionalDetails.autoFetchTransactions &&
        userAdditionalDetails.baseCurrency
      ) {
        smsSubscription = SmsListener.addListener(message => {
          if (message) {
            getMessageFromListener(message);
          }
        });
      }
      if (!userAdditionalDetails.baseCurrency) {
        setBaseCurrency({
          dialog: true,
          currency: null,
        });
      }
    }

    return () => {
      smsSubscription && smsSubscription.remove();
    };
  }, [userAdditionalDetails]);

  const getMessageFromListener = async message => {
    try {
      let granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('READ_SMS permissions granted', granted);
        var todayStartDate = new Date();
        var todayEndDate = new Date();

        todayStartDate.setHours(0);
        todayStartDate.setMinutes(0);
        todayStartDate.setSeconds(0);
        todayStartDate = Date.parse(todayStartDate.toISOString());

        todayEndDate.setHours(23);
        todayEndDate.setMinutes(59);
        todayEndDate.setSeconds(0);
        todayEndDate = Date.parse(todayEndDate.toISOString());

        // create transactions category
        let categoryName = 'no category';

        let removedTransactionsData = JSON.parse(
          await AsyncStorage.getItem('@expenses-manager-removed-transactions'),
        );

        if (removedTransactionsData && removedTransactionsData.date) {
          let todayDate = moment().format('DD-MM-YYYY').toString();
          let date = removedTransactionsData.date;
          if (todayDate !== date) {
            await AsyncStorage.removeItem(
              '@expenses-manager-removed-transactions',
            );
          }
        }

        let removedTransactions =
          removedTransactionsData && removedTransactionsData.transactions
            ? removedTransactionsData.transactions
            : [];
        let finalMessages = [];
        let index = 0;

        let transactionInfo = getTransactionInfo(message.body);
        let amount = transactionInfo.transactionAmount;
        let body = message.body;
        let receivedDate = message.timestamp;
        if (amount !== null && amount) {
          amount = parseFloat(amount);
          let categoryType =
            transactionInfo.transactionType === 'debit' ? 'expense' : 'income';

          let selectedCategory = categories[categoryType].find(
            c => c.name.toLowerCase() === categoryName,
          );

          let obj = {
            body: body,
            date: receivedDate,
            amount: amount,
            category: selectedCategory,
            address: message.address,
            categoryType: categoryType,
            _id: message._id,
            id: index,
          };
          finalMessages.push(obj);
        }

        if (finalMessages && finalMessages.length > 0) {
          let messagesWithoutRemovedTransactions = [];

          // console.log(finalMessages, removedTransactions);
          finalMessages.forEach((m, index) => {
            let alreadyExists = removedTransactions.find(
              t => t.body === m.body,
            );

            if (!alreadyExists) {
              messagesWithoutRemovedTransactions.push(m);
            }
          });
          if (messagesWithoutRemovedTransactions.length > 0) {
            dispatch(
              smsTransactionsActions.setTransactions(
                messagesWithoutRemovedTransactions,
              ),
            );
          }
        }
      } else {
        console.log('READ_SMS permissions denied');
      }
    } catch (err) {
      Alert.alert(err);
    }
  };

  const getMessages = async () => {
    try {
      let granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('READ_SMS permissions granted', granted);
        var todayStartDate = new Date();
        var todayEndDate = new Date();

        todayStartDate.setHours(0);
        todayStartDate.setMinutes(0);
        todayStartDate.setSeconds(0);
        todayStartDate = Date.parse(todayStartDate.toISOString());

        todayEndDate.setHours(23);
        todayEndDate.setMinutes(59);
        todayEndDate.setSeconds(0);
        todayEndDate = Date.parse(todayEndDate.toISOString());

        // create transactions category
        let categoryName = 'no category';

        let removedTransactionsData = JSON.parse(
          await AsyncStorage.getItem('@expenses-manager-removed-transactions'),
        );

        if (removedTransactionsData && removedTransactionsData.date) {
          let todayDate = moment().format('DD-MM-YYYY').toString();
          let date = removedTransactionsData.date;
          if (todayDate !== date) {
            await AsyncStorage.removeItem(
              '@expenses-manager-removed-transactions',
            );
          }
        }

        SmsAndroid.list(
          JSON.stringify({
            box: 'inbox',
            minDate: todayStartDate,
            maxDate: todayEndDate,
          }),
          fail => {
            console.log('failed with error : ' + fail);
          },
          (count, smsList) => {
            var messages = JSON.parse(smsList);
            let removedTransactions =
              removedTransactionsData && removedTransactionsData.transactions
                ? removedTransactionsData.transactions
                : [];
            let finalMessages = [];
            let index = 0;
            // remove if any duplicates
            let uniqueMessages = _.uniqBy(messages, m => {
              return m.body;
            });

            uniqueMessages.forEach(message => {
              let transactionInfo = getTransactionInfo(message.body);
              let amount = transactionInfo.transactionAmount;
              let body = message.body;
              let receivedDate = message.date;

              if (amount !== null && amount) {
                amount = parseFloat(amount);
                let categoryType =
                  transactionInfo.transactionType === 'debit'
                    ? 'expense'
                    : 'income';

                let selectedCategory = categories[categoryType].find(
                  c => c.name.toLowerCase() === categoryName,
                );

                let obj = {
                  body: body,
                  date: receivedDate,
                  amount: amount,
                  category: selectedCategory,
                  address: message.address,
                  categoryType: categoryType,
                  _id: message._id,
                  id: index,
                };
                index++;
                finalMessages.push(obj);
              }
            });

            if (finalMessages && finalMessages.length > 0) {
              let messagesWithoutRemovedTransactions = [];

              // console.log(finalMessages, removedTransactions);
              finalMessages.forEach((m, index) => {
                let alreadyExists = removedTransactions.find(
                  t => t.body === m.body,
                );

                if (!alreadyExists) {
                  messagesWithoutRemovedTransactions.push(m);
                }
              });
              if (messagesWithoutRemovedTransactions.length > 0) {
                dispatch(
                  smsTransactionsActions.setTransactions(
                    messagesWithoutRemovedTransactions,
                  ),
                );
              }
            }
          },
        );
      } else {
        Alert.alert(
          'READ_SMS permissions denied',
          'Please enable it from permissions -> SMS > Allow to automatically add transactions by auto-reading SMS, Please restart the app after granting permission.',
          [
            {
              text: 'No Thanks!',
              style: 'cancel',
            },

            {
              text: 'Grant Permission',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ],
        );
        console.log('READ_SMS permissions denied');
      }
    } catch (err) {
      Alert.alert(err);
    }
  };

  const onUpdateDailyReminder = async (
    dailyReminder,
    callback = () => null,
  ) => {
    dispatch(loaderActions.showLoader({backdrop: true}));
    let jwtToken = await auth().currentUser.getIdToken();
    let fcmToken = null;
    await messaging()
      .getToken()
      .then(t => {
        fcmToken = t;
      })
      .catch(err => {});
    let timeZone = await getTimeZone();

    let data = {...dailyReminder, fcmToken: fcmToken, timeZone: timeZone};
    data.time = `${moment(data.time).format('HH')}:${moment(data.time).format(
      'mm',
    )}`;

    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/notification/update-daily-reminder/',
        data: {
          ...data,
          fcmToken: fcmToken,
        },
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: res => {
          callback();
          if (res.user) {
            onSetUserAdditionalDetails(res.user);
          } else {
            onSetUserAdditionalDetails(p => ({
              ...p,
              dailyReminder: dailyReminder,
            }));
          }
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message: res.message,
            }),
          );
        },
        errorCallback: err => {
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: err,
            }),
          );
        },
      },
    );
  };

  const onUpdateDailyBackup = async (enabled, callback = () => null) => {
    dispatch(loaderActions.showLoader({backdrop: true}));
    let jwtToken = await auth().currentUser.getIdToken();
    let fcmToken = null;
    await messaging()
      .getToken()
      .then(t => {
        fcmToken = t;
      })
      .catch(err => {});
    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/notification/update-daily-backup/',
        data: {
          enabled: enabled,
          fcmToken: fcmToken,
          timeZone: getTimeZone(),
        },
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: res => {
          callback();
          if (res.user) {
            onSetUserAdditionalDetails(res.user);
          } else {
            onSetUserAdditionalDetails(p => ({
              ...p,
              dailyBackup: enabled,
            }));
          }
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message: res.message,
            }),
          );
        },
        errorCallback: err => {
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: err,
            }),
          );
        },
      },
    );
  };

  const onUpdateAutoFetchTransactions = async (
    enabled,
    callback = () => null,
  ) => {
    dispatch(loaderActions.showLoader({backdrop: true}));
    let jwtToken = await auth().currentUser.getIdToken();
    let transformedData = {
      autoFetchTransactions: enabled,
    };

    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/user',
        data: transformedData,
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },

      {
        successCallback: res => {
          if (enabled && Platform.OS === 'android') {
            setTimeout(() => {
              getMessages();
            }, 1000 * 5);
          }
          callback();
          if (res.user) {
            onSetUserAdditionalDetails(res.user);
          } else {
            onSetUserAdditionalDetails(p => ({
              ...p,
              autoFetchTransactions: enabled,
            }));
          }
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message: 'Auto Fetch Transactions updated successfully',
            }),
          );
        },
        errorCallback: err => {
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: err,
            }),
          );
        },
      },
    );
  };

  const onUpdateBaseCurrency = async (
    currency,
    callback = () => null,
    errorCallback = () => null,
  ) => {
    let jwtToken = await auth().currentUser.getIdToken();
    let transformedData = {
      baseCurrency: currency,
    };
    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/user',
        data: transformedData,
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },

      {
        successCallback: res => {
          callback();
          if (res.user) {
            onSetUserAdditionalDetails(res.user);
          } else {
            onSetUserAdditionalDetails(p => ({
              ...p,
              baseCurrency: currency,
            }));
          }
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message: 'Base Currency updated successfully',
            }),
          );
        },
        errorCallback: err => {
          errorCallback();
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: err,
            }),
          );
        },
      },
    );
  };

  const onGoogleCloudVision = async (base64, callback = () => null) => {
    // let resultObj = test.response2.responses[0];
    // let finalResult = onExtractAndFilterText(resultObj);
    // callback(finalResult); // callback with data handler
    // return;
    if (!base64) {
      Alert.alert('Required base64 string');
      return;
    }
    dispatch(
      loaderActions.showLoader({backdrop: true, loaderType: 'scanning'}),
    );

    let url = GOOGLE_CLOUD_VISION_API_URL + '?key=' + GOOGLE_API_KEY;
    sendRequest(
      {
        type: 'POST',
        url: url,
        data: {
          requests: {
            image: {
              content: base64,
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        },
        // extra data to use-http hook
      },
      {
        successCallback: receivedResponse => {
          dispatch(loaderActions.hideLoader());
          let resultObj = receivedResponse.responses[0];
          if (_.isEmpty(resultObj)) {
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                status: 'warning',
                message: 'No text detected from the Image!',
              }),
            );
          } else {
            let finalResult = onExtractAndFilterText(resultObj);
            callback(finalResult); // callback with data handler
          }
        },
        errorCallback: err => {
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'warning',
              message: 'Something error occured while extracting text!',
            }),
          );
          console.log(err);
        },
      },
    );
  };

  const onSmartScanReceipt = async (base64, callback = () => null) => {
    if (!base64) {
      Alert.alert('Required base64 string');
      return;
    }
    dispatch(
      loaderActions.showLoader({backdrop: true, loaderType: 'scanning'}),
    );

    let url = MINDEE_API_URL;
    let formData = new FormData();
    formData.append('document', base64);

    sendRequest(
      {
        type: 'POST',
        url: url,
        headers: {
          Authorization: `Token ${MINDEE_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        data: formData,
        // extra data to use-http hook
      },
      {
        successCallback: receivedResponse => {
          dispatch(loaderActions.hideLoader());
          if (
            receivedResponse.api_request &&
            receivedResponse.api_request.status &&
            receivedResponse.api_request.status === 'success' &&
            receivedResponse.document &&
            receivedResponse.document.inference &&
            receivedResponse.document.inference.prediction
          ) {
            let {total_amount, date, supplier_name, category} =
              receivedResponse.document.inference.prediction;
            let amount = total_amount.value ? total_amount.value : 0;
            let fetchedDate = date.value;
            let notes = supplier_name.value;
            let fetchedCategory = category.value;
            let extractedData = {
              amount: amount,
              date: fetchedDate,
              notes: notes,
              category: fetchedCategory,
              type: 'expense',
            };
            callback(extractedData);
          } else {
            console.log(receivedResponse.api_request);
            dispatch(
              notificationActions.showToast({
                status: 'warning',
                message: 'Something error occured while extracting text!',
              }),
            );
          }
        },
        errorCallback: err => {
          console.log(err, ' Error in scanning receipt');
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'warning',
              message: 'Something error occured while extracting text!',
            }),
          );
        },
      },
    );
  };

  // for google cloud vision
  const onExtractAndFilterText = result => {
    let text = result.fullTextAnnotation.text;
    function findTotalAmount() {
      let pattern = /\d+\,?(?:\.\d{1,2})/g;
      // changed pattern
      // let pattern = /\d+(?:,?(\d+\.\d{1,2})|(\.\d{1,2}))/g;
      let amounts = text.match(pattern);
      let total = 0.0;
      if (amounts) {
        amounts = amounts.map(n => parseFloat(n.replace(/,/g, '')));
        total = Math.max(...amounts);
      }
      return total;
    }

    function findDate() {
      let pattern = /\d+[/.-]\S{2,3}[/.-]\d{2,4}/g;
      let dates = text.match(pattern);
      // to check include space patterns likd 16 jul 2022
      let spattern = /\d{2}[ /.-]\S{2,3}[ /.-]\d{2,4}/g;
      let sdates = text.match(spattern);
      let date = new Date();
      if (dates) {
        date = dates[0];
      } else {
        if (sdates) {
          date = sdates[0];
        }
      }
      return date;
    }

    function findTitle() {
      const splitLines = text.split(/\r?\n/);
      let title = 'New title';
      if (splitLines) {
        title = splitLines[0];
      }
      return title;
    }

    function findCategory() {
      let filteredCategories = [];
      Object.keys(matchWords).map(key => {
        let words = matchWords[key];
        let matched = [];
        words.forEach(obj => {
          if (text.toLowerCase().includes(obj.word)) {
            // let index = text.indexOf(obj.word);
            // let subStrIndex = index + obj.word.length
            // let matchedWord = text.substring(index , subStrIndex)
            matched.push(obj.word);
          }
        });
        filteredCategories.push({
          name: key,
          matchedWords: matched,
        });
      });
      console.log(filteredCategories, 'matched words');
      const categoryWithHighestMatchedWords = filteredCategories.reduce(
        (prev, current) =>
          prev.matchedWords.length > current.matchedWords.length
            ? prev
            : current,
      );
      let category = 'Others';
      if (
        categoryWithHighestMatchedWords &&
        categoryWithHighestMatchedWords.matchedWords.length > 0
      ) {
        category = categoryWithHighestMatchedWords.name;
      }
      return category;
    }

    let total = findTotalAmount();
    let date = findDate();
    let title = findTitle();
    let category = findCategory();
    let sheetData = {
      amount: total,
      date: date,
      notes: title,
      category: category,
      type: 'expense',
    };
    return sheetData;
  };

  const onSetChangesMade = (status = true) => {
    dispatch(setChangesMade({status}));
  };

  const calculateBalance = sheet => {
    var totalExpenseAmount = 0;
    var totalIncomeAmount = 0;
    sheet.details.filter(d => {
      if (d.type === 'expense') {
        totalExpenseAmount += d.amount;
      } else if (d.type === 'income') {
        totalIncomeAmount += d.amount;
      }
    });
    let totalBalance = totalIncomeAmount - totalExpenseAmount;
    return totalBalance;
  };

  const onSaveExpensesData = async passedExpensesData => {
    if (passedExpensesData) {
      setExpensesData(passedExpensesData);
    }

    if (passedExpensesData.sheets) {
      let sortedSheets = passedExpensesData.sheets.sort(
        (a, b) => b.updatedAt - a.updatedAt,
      );
      setSheets(sortedSheets);
    }

    if (passedExpensesData.categories) {
      let changedCategories = {...passedExpensesData.categories};
      setCategories(changedCategories);
    }

    try {
      const jsonValue = JSON.stringify(passedExpensesData);
      await AsyncStorage.setItem(
        `@expenses-manager-data-${userData.uid}`,
        jsonValue,
      );
      // retrieveExpensesData();
    } catch (e) {
      dispatch(loaderActions.hideLoader());
    }
  };

  const retrieveExpensesData = async () => {
    // dispatch(loaderActions.showLoader({backdrop: true}));
    try {
      let value = await AsyncStorage.getItem(
        `@expenses-manager-data-${userData.uid}`,
      );
      value = JSON.parse(value);
      if (value != null) {
        setExpensesData(value);
        // set sheets accoring to updated date wise
        if (value.sheets) {
          let sortedSheets = value.sheets.sort(
            (a, b) => b.updatedAt - a.updatedAt,
          );

          setSheets(sortedSheets);
        }
        if (value.categories) {
          setCategories(value.categories);
        }
      }
      // dispatch(loaderActions.hideLoader());
    } catch (e) {
      console.log('error retrieving expenses data - ', e);
      dispatch(loaderActions.hideLoader());
    }
  };

  const onSaveSheet = async (sheet, callback = () => null) => {
    let showTransactions = false;
    if (!sheets || sheets.length === 0) {
      showTransactions = true;
    }
    saveSheetRequest(sheet, sheets)
      .then(async result => {
        const updatedSheets = [...sheets, sheet];
        let updatedExpensesData = {
          ...expensesData,
          sheets: updatedSheets,
          categories: categories,
        };
        onSaveExpensesData(updatedExpensesData).then(() => {
          onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
          callback();
          // show transaction messages if new sheet added
          if (
            showTransactions &&
            Platform.OS === 'android' &&
            userAdditionalDetails.autoFetchTransactions
          ) {
            setTimeout(() => {
              getMessages();
            }, 1000 * 5);
          }
        });
      })
      .catch(err => {
        dispatch(
          notificationActions.showToast({
            status: 'error',
            message: err,
          }),
        );
        dispatch(loaderActions.hideLoader());
      });
  };

  const onSaveSheetDetails = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    const saveSheet = () => {
      var presentSheets = [...sheets];
      var sheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
      var presentSheet = presentSheets[sheetIndex];
      if (!presentSheet.details) {
        presentSheet.details = [];
      }

      presentSheet.details.push(sheetDetail);
      presentSheet.totalBalance = calculateBalance(presentSheet);
      presentSheet.updatedAt = Date.now();
      presentSheets[sheetIndex] = presentSheet;
      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };
      onSaveExpensesData(updatedExpensesData).then(() => {
        onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
        callback(presentSheet);
      });
    };

    if (sheetDetail.image && sheetDetail.image.url) {
      var Base64Code = sheetDetail.image.url.split(/,\s*/);
      let prefix = Base64Code[0]; //data:image/png;base64,
      let format = prefix.match(/image\/(jpeg|png|jpg)/); //at 0 index image/jpeg at 1 index it shows png or jpeg

      let data = {
        photo: sheetDetail.image,
        sheetId: sheet.id,
        sheetDetailId: sheetDetail.id,
      };
      let jwtToken = await auth().currentUser.getIdToken();
      dispatch(
        loaderActions.showLoader({
          backdrop: true,
          loaderType: 'image_upload',
        }),
      );

      sendRequest(
        {
          type: 'PUT',
          url: BACKEND_URL + '/user/upload-sheet-detail-picture',
          data: data,
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async result => {
            dispatch(loaderActions.hideLoader());
            let imageObj = {
              url: result.photoURL,
              type: format[0],
              extension: format[1],
            };
            sheetDetail.image = imageObj;
            saveSheet();
          },
          errorCallback: err => {
            console.log('Error in uploading the bill ', err);
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                message: 'Error in uploading the bill ' + err,
                status: 'error',
              }),
            );
          },
        },
      );
    } else {
      saveSheet();
    }
  };

  const onSaveCategory = async (category, type, callback = () => null) => {
    saveCategoryRequest(
      category,
      type === 'expense' ? categories.expense : categories.income,
    )
      .then(async result => {
        let updatedCategories = categories;
        if (type === 'expense') {
          updatedCategories.expense = [...updatedCategories.expense, category];
        } else if (type === 'income') {
          updatedCategories.income = [...updatedCategories.income, category];
        }
        let updatedExpensesData = {
          ...expensesData,
          categories: updatedCategories,
        };
        onSaveExpensesData(updatedExpensesData);
        onSetChangesMade(true);
        callback();
      })
      .catch(err => {
        dispatch(
          notificationActions.showToast({
            status: 'error',
            message: err,
          }),
        );
        dispatch(loaderActions.hideLoader());
      });
  };

  const onEditSheet = async (sheet, callback) => {
    let ifAlreadyExists = sheets.filter(
      s =>
        s.name.toLowerCase() === sheet.name.toLowerCase() && s.id !== sheet.id,
    );
    if (ifAlreadyExists && ifAlreadyExists.length) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Sheet name already exists',
        }),
      );
    } else {
      let presentSheets = [...sheets];
      let index = presentSheets.findIndex(s => s.id === sheet.id);
      presentSheets[index] = {...sheets[index], ...sheet};

      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };
      let presentSheet = presentSheets[index];
      onSaveExpensesData(updatedExpensesData).then(() => {
        onSetChangesMade(true);
        callback(presentSheet);
        // navigation.goBack();
      });
    }
  };

  const onEditSheetDetails = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    const editSheet = () => {
      delete sheetDetail.imageChanged;
      delete sheetDetail.imageDeleted;

      presentSheet.details[sheetDetailIndex] = sheetDetail;
      presentSheet.totalBalance = calculateBalance(presentSheet);
      presentSheet.updatedAt = Date.now();
      presentSheets[sheetIndex] = presentSheet;
      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };
      onSaveExpensesData(updatedExpensesData).then(() => {
        onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
        callback(presentSheet);
      });
    };

    var presentSheets = [...sheets];
    var sheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    var presentSheet = presentSheets[sheetIndex];
    let sheetDetailIndex = presentSheet.details.findIndex(
      sd => sd.id === sheetDetail.id,
    );
    // if image changed delete the image
    if (sheetDetail.imageChanged) {
      if (sheetDetail.image && sheetDetail.image.url) {
        let data = {
          photo: sheetDetail.image,
          sheetId: sheet.id,
          sheetDetailId: sheetDetail.id,
        };

        var Base64Code = sheetDetail.image.url.split(/,\s*/);
        let prefix = Base64Code[0]; //data:image/png;base64,
        let format = prefix.match(/image\/(jpeg|png|jpg)/); //at 0 index image/jpeg at 1 index it shows png or jpeg
        let jwtToken = await auth().currentUser.getIdToken();
        dispatch(
          loaderActions.showLoader({
            backdrop: true,
            loaderType: 'image_upload',
          }),
        );

        sendRequest(
          {
            type: 'PUT',
            url: BACKEND_URL + '/user/upload-sheet-detail-picture',
            data: data,
            headers: {
              authorization: 'Bearer ' + jwtToken,
            },
          },
          {
            successCallback: async result => {
              dispatch(loaderActions.hideLoader());
              let imageObj = {
                url: result.photoURL,
                type: format[0],
                extension: format[1],
              };
              sheetDetail.image = imageObj;
              editSheet();
            },
            errorCallback: err => {
              console.log('Error in uploading the bill ', err);
              dispatch(loaderActions.hideLoader());
              dispatch(
                notificationActions.showToast({
                  message: 'Error in uploading the bill ' + err,
                  status: 'error',
                }),
              );
            },
          },
        );
      }
    }
    // if image delete request
    else if (sheetDetail.imageDeleted) {
      dispatch(
        loaderActions.showLoader({
          backdrop: true,
          loaderType: 'image_upload',
        }),
      );
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'PUT',
          url: BACKEND_URL + '/user/remove-sheet-detail-picture',
          data: {
            url: presentSheet.details[sheetDetailIndex].image.url,
          },
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async result => {
            sheetDetail.image = {url: null};
            editSheet();
            dispatch(loaderActions.hideLoader());
          },
          errorCallback: err => {
            console.log('Error in deleting the picture ', err);
            dispatch(loaderActions.hideLoader());
            Alert.alert('Error in deleting the picture ' + err);
          },
        },
      );
    } else {
      editSheet();
    }
  };

  const onEditCategory = async (category, type, callback = () => null) => {
    let index;
    let updatedCategories = categories;

    let toCheckCategories;
    if (type === 'expense') {
      index = updatedCategories.expense.findIndex(s => s.id === category.id);
      toCheckCategories = [...updatedCategories.expense];
      updatedCategories.expense[index] = category;
    } else if (type === 'income') {
      index = updatedCategories.income.findIndex(s => s.id === category.id);
      toCheckCategories = [...updatedCategories.income];
      updatedCategories.income[index] = category;
    }
    let ifAlreadyExists = toCheckCategories.filter(
      c =>
        c.name.toLowerCase() === category.name.toLowerCase() &&
        c.id !== category.id,
    );
    if (ifAlreadyExists && ifAlreadyExists.length) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Category name already exists',
        }),
      );
    } else {
      let updatedExpensesData = {
        ...expensesData,
        categories: updatedCategories,
      };
      onSaveExpensesData(updatedExpensesData);
      onSetChangesMade(true);
      callback();
    }
  };

  const onDeleteSheet = async sheet => {
    const remainingSheets = sheets.filter(s => s.id != sheet.id);
    let updatedExpensesData = {
      ...expensesData,
      sheets: remainingSheets,
      categories: categories,
    };
    onSaveExpensesData(updatedExpensesData);
    onSetChangesMade(true);
    let jwtToken = await auth().currentUser.getIdToken();
    sendRequest(
      {
        type: 'DELETE',
        url: BACKEND_URL + `/user/delete-sheet/${sheet.id}`,
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: async result => {},
        errorCallback: err => {
          console.log('Error in deleting sheet pictured ', err);
        },
      },
    );
  };

  const onDeleteCategory = async (category, type) => {
    let presentCategories = categories;
    if (type === 'income') {
      presentCategories.income = categories.income.filter(
        c => c.id != category.id,
      );
    } else if (type === 'expense') {
      presentCategories.expense = categories.expense.filter(
        c => c.id != category.id,
      );
    }
    let updatedExpensesData = {
      ...expensesData,
      categories: presentCategories,
    };
    onSaveExpensesData(updatedExpensesData);
    onSetChangesMade(true);
  };

  const onDeleteSheetDetails = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    let presentSheets = [...sheets];
    let presentSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    // delete bill
    if (sheetDetail.image && sheetDetail.image.url) {
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'PUT',
          url: BACKEND_URL + '/user/remove-sheet-detail-picture',
          data: {
            url: sheetDetail.image.url,
          },
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async result => {},
          errorCallback: err => {
            console.log('Error in deleting the picture ', err);
          },
        },
      );
    }

    let remainingSheetDetails = presentSheets[presentSheetIndex].details.filter(
      s => s.id != sheetDetail.id,
    );
    presentSheets[presentSheetIndex].details = remainingSheetDetails;
    presentSheets[presentSheetIndex].totalBalance = calculateBalance(
      presentSheets[presentSheetIndex],
    );
    presentSheets[presentSheetIndex].updatedAt = Date.now();
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
      categories: categories,
    };
    // callback
    onSaveExpensesData(updatedExpensesData).then(() => {
      callback(presentSheets[presentSheetIndex]);
      onSetChangesMade(true);
    });
  };

  const onMoveSheets = async (
    sheet,
    moveToSheet,
    sheetDetail,
    callback = () => null,
  ) => {
    let jwtToken = await auth().currentUser.getIdToken();

    let data = {
      currentSheetId: sheet.id,
      moveToSheetId: moveToSheet.id,
      sheetDetailId: sheetDetail.id,
      photo: sheetDetail?.image,
    };

    const moveSheet = () => {
      let presentSheets = [...sheets];
      let moveFromSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
      let moveFromSheet = presentSheets[moveFromSheetIndex];
      let moveFromremainingSheetDetails = moveFromSheet.details.filter(
        s => s.id != sheetDetail.id,
      );
      moveFromSheet.details = moveFromremainingSheetDetails;
      moveFromSheet.totalBalance = calculateBalance(moveFromSheet);
      moveFromSheet.updatedAt = Date.now();
      presentSheets[moveFromSheetIndex] = moveFromSheet;
      // to move sheet into
      let moveToIndex = presentSheets.findIndex(s => s.id === moveToSheet.id);
      var moveTo = presentSheets[moveToIndex];
      if (!moveTo.details) {
        moveTo.details = [];
      }

      moveTo.details.push(sheetDetail);
      moveTo.totalBalance = calculateBalance(moveTo);
      presentSheets[moveToIndex] = moveTo;
      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };
      onSaveExpensesData(updatedExpensesData).then(() => {
        onSetChangesMade(true);
        callback(moveFromSheet);
      });
    };

    if (data.photo && data.photo.url) {
      dispatch(
        loaderActions.showLoader({
          backdrop: true,
        }),
      );
      sendRequest(
        {
          type: 'PUT',
          url: BACKEND_URL + '/user/move-sheet-detail-picture',
          data: data,
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async result => {
            dispatch(loaderActions.hideLoader());
            sheetDetail.image.url = result.photoURL;
            moveSheet();
          },
          errorCallback: err => {
            console.log('Error in moving the transaction ', err);
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                message: 'Error occured while moving the transaction.',
                status: 'error',
              }),
            );
          },
        },
      );
    } else {
      moveSheet();
    }
  };

  const onDuplicateSheet = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    let presentSheets = [...sheets];
    let dupSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let dupSheet = {...presentSheets[dupSheetIndex]};
    let newSheetDetail = _.cloneDeep(sheetDetail);
    newSheetDetail.id =
      Date.now().toString(36) + Math.random().toString(36).substring(2);

    let jwtToken = await auth().currentUser.getIdToken();

    let data = {
      newSheetDetailId: newSheetDetail.id,
      sheetId: sheet.id,
      sheetDetailId: sheetDetail.id,
      photo: sheetDetail?.image,
    };

    const duplicateSheet = () => {
      dupSheet.details.push(newSheetDetail);
      dupSheet.updatedAt = Date.now();
      dupSheet.totalBalance = calculateBalance(dupSheet);
      presentSheets[dupSheetIndex] = dupSheet;

      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };

      onSaveExpensesData(updatedExpensesData).then(() => {
        onSetChangesMade(true);
        callback(dupSheet);
      });
    };

    if (data.photo && data.photo.url) {
      dispatch(
        loaderActions.showLoader({
          backdrop: true,
        }),
      );
      sendRequest(
        {
          type: 'PUT',
          url: BACKEND_URL + '/user/duplicate-sheet-detail-picture',
          data: data,
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async result => {
            dispatch(loaderActions.hideLoader());
            newSheetDetail.image.url = result.photoURL;
            duplicateSheet();
          },
          errorCallback: err => {
            console.log('Error in duplicating the transaction ', err);
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                message: 'Error occured while duplciating the transaction.',
                status: 'error',
              }),
            );
          },
        },
      );
    } else {
      duplicateSheet();
    }
  };

  const onChangeSheetType = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    let presentSheets = [...sheets];
    let changeSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let changeSheet = presentSheets[changeSheetIndex];
    let detailIndex = changeSheet.details.findIndex(
      d => d.id === sheetDetail.id,
    );
    changeSheet.details[detailIndex].type =
      sheetDetail.type === 'income' ? 'expense' : 'income';
    changeSheet.updatedAt = Date.now();
    changeSheet.totalBalance = calculateBalance(changeSheet);
    presentSheets[changeSheetIndex] = changeSheet;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
      categories: categories,
    };

    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
      callback(changeSheet);
    });
  };

  const getSheetById = id => {
    return sheets.filter(s => s.id === id)[0];
  };

  const onExportData = async () => {
    let data = {
      sheets,
      categories,
    };

    if (Platform.OS === 'ios') {
      var toSaveData = JSON.stringify(data);
      const dirs = RNFetchBlob.fs.dirs;
      var path = dirs.DocumentDir + `/transactions-${moment()}.json`;
      RNFetchBlob.fs
        .writeFile(path, toSaveData)
        .then(res => {
          console.log('successfully exported file ios - ' + res);
          Share.open({
            url: path,
            filename: `transactions-${moment()}.json`,
            saveToFiles: true,
            type: 'application/json',
          }).catch(err => {
            console.log(
              err.error.message,
              'error while exporting the data - ios',
            );
          });
        })
        .catch(err => {
          console.log(err, 'err in exporting file in ios');
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while exporting the data',
            }),
          );
        });
    }
    if (Platform.OS === 'android') {
      // const granted = await PermissionsAndroid.request(
      //   PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      // );

      // if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      var toSaveData = JSON.stringify(data);
      const dirs = RNFetchBlob.fs.dirs;
      var path = dirs.DownloadDir + `/transactions-${moment()}.json`;
      RNFetchBlob.fs
        .writeFile(path, toSaveData)
        .then(res => {
          console.log('successfully exported file');
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message:
                'Your file is exported successfully. Please check the downloads folder for the file.',
            }),
          );
        })
        .catch(err => {
          console.log(err, 'err in exporting file');
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while exporting the data',
            }),
          );
        });
      // } else {
      //   showAlertStoragePermission();
      // }
    }
  };

  const onImportData = async () => {
    await DocumentPicker.pickSingle({
      type: [DocumentPicker.types.allFiles],
      copyTo: 'documentDirectory',
    })
      .then(async r => {
        if (r.type === 'application/json') {
          let fileuri = r.uri;
          if (Platform.OS === 'ios') {
            fileuri = fileuri.replace('file:', '');
          }
          if (Platform.OS === 'android') {
            fileuri = r.fileCopyUri;
          }
          RNFetchBlob.fs
            .readFile(fileuri)
            .then(file => {
              let data = JSON.parse(file);
              if (data.sheets && data.categories) {
                onSaveExpensesData(data).then(() => {
                  onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
                  dispatch(
                    notificationActions.showToast({
                      status: 'success',
                      message: 'Data has been imported successfully.',
                    }),
                  );
                });
              } else {
                dispatch(
                  notificationActions.showToast({
                    status: 'error',
                    message: 'Empty file or corrupted data file.',
                  }),
                );
              }
            })
            .catch(err => {
              console.log(err, 'error occured while reading file');
              Alert.alert('Error occured while reading file');
            });
        } else {
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Only JSON files are allowed',
            }),
          );
        }
      })
      .catch(err => {
        console.log(err, 'error in document picker');
      });
  };

  const onExportDataToExcel = async (config, data, callback = () => null) => {
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'excel'}));

    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.json_to_sheet(data);
    // add extracells
    XLSX.utils.sheet_add_aoa(ws, config.extraCells, {origin: -1});

    ws['!cols'] = config.wscols;

    XLSX.utils.book_append_sheet(wb, ws, config.title);
    const wbout = XLSX.write(wb, {type: 'binary', bookType: 'xlsx'});

    if (Platform.OS === 'ios') {
      const dirs = RNFetchBlob.fs.dirs;
      var path = dirs.DocumentDir + `/transactions-${moment()}.xlsx`;
      RNFS.writeFile(path, wbout, 'ascii')
        .then(res => {
          dispatch(loaderActions.hideLoader());
          callback();
          console.log('successfully exported file ios - ' + res);

          if (config && config.sharing) {
            Share.open({
              url: path,
              title: 'Transactions Excel File',
              subject: 'Transaction file - Excel',
            }).catch(err => {
              console.log(err, 'error while sharing the data - ios excel');
            });
            dispatch(loaderActions.hideLoader());
            return;
          }

          Share.open({
            url: path,
            filename: `transactions-${moment()}.xlsx`,
            saveToFiles: true,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }).catch(err => {
            dispatch(loaderActions.hideLoader());
            console.log(
              err.error.message,
              'error while exporting the data - ios',
            );
          });
        })
        .catch(err => {
          dispatch(loaderActions.hideLoader());

          console.log(err, 'err in exporting file in ios');
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while exporting the data',
            }),
          );
        });
    }
    if (Platform.OS === 'android') {
      // const granted = await PermissionsAndroid.request(
      //   PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      //   {
      //     title: 'Expenses Manager wants to save your transactions file',
      //     message: 'Your app needs permission.',
      //     buttonNeutral: 'Ask Me Later',
      //     buttonNegative: 'Cancel',
      //     buttonPositive: 'OK',
      //   },
      // );

      // if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      const dirs = RNFetchBlob.fs.dirs;

      let path;

      path = dirs.DownloadDir + `/transactions-${moment()}.xlsx`;
      if (config && config.sharing) {
        path = dirs.CacheDir + `/transactions-${moment()}.xlsx`;
      }

      RNFS.writeFile(path, wbout, 'ascii')
        .then(r => {
          let finalPath = 'file://' + path;
          if (config && config.sharing) {
            Share.open({
              url: finalPath,
              subject: 'Transaction file - Excel',
              title: 'Transactions Excel File',
            }).catch(err => {
              console.log(err, 'error while sharing the data - android');
            });
          }

          dispatch(loaderActions.hideLoader());
          callback();
          if (!config || !config.sharing) {
            dispatch(
              notificationActions.showToast({
                status: 'success',
                message:
                  'Your file is exported successfully. Please check the downloads folder for the file.',
              }),
            );
          }
        })
        .catch(err => {
          dispatch(loaderActions.hideLoader());
          console.log(err, 'Error in exporting excel');
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while exporting the file.',
            }),
          );
        });
      // } else {
      //   dispatch(loaderActions.hideLoader());
      //   showAlertStoragePermission();
      // }
    }
  };

  const onExportDataToPdf = async (config, sheet, callback = () => null) => {
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'pdf'}));
    let tableHeads = `
      <th>S.NO</th>
      <th>TITLE</th>
      <th>CATEGORY</th>
      <th>IMAGE</th>
      <th>DATE</th>
      <th>AMOUNT ( ${GetCurrencySymbol(sheet.currency)} )</th>
    `;
    let styles = `
      <style>
      img{
        height : 100px;
        widht : 100px;
        object-fit : contain;
      }
      .styled-table {
        border-collapse: collapse;
        margin: 25px 0;
        font-size: 0.9em;
        font-family: sans-serif;
        min-width: 400px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
      }
      .styled-table thead tr {
        background-color: ${theme.colors.brand.primary};
        color: #ffffff;
        text-align: left;
      }
      .styled-table th,
      .styled-table td {
          padding: 12px 15px;
      }

      .styled-table tbody tr {
        border-bottom: 1px solid #dddddd;
      }
    
      .styled-table tbody tr:nth-of-type(even) {
        background-color: #f3f3f3;
      }
    
      .styled-table tbody tr:last-of-type {
        border-bottom: 2px solid #009879;
      }

      .styled-table tbody tr.active-row {
        font-weight: bold;
        color: #009879;
      }
    </style>
    `;

    let tableBody = '';
    let totalIncome = 0;
    let totalExpense = 0;

    sheet.details.forEach((detail, index) => {
      let date = moment(detail.date).format('MMM DD, YYYY ');
      if (detail.showTime) {
        let time = moment(detail.time).format('hh:mm A');
        date += time;
      }
      if (detail.type === 'expense') {
        totalExpense += detail.amount;
      } else {
        totalIncome += detail.amount;
      }
      // ${detail.image && `<img src='${detail.image}'/>`}
      let imageUrl = null;
      if (detail.image && detail.image.url) {
        if (
          detail.image.url.startsWith(
            `public/users/${userData.uid}/${sheet.id}/${detail.id}`,
          )
        ) {
          imageUrl = `${BACKEND_URL}/${detail.image.url}`;
        } else {
          imageUrl = detail.image.url;
        }
      }
      let image =
        detail.image && detail.image.url ? `<img src='${imageUrl}'/>` : '';
      let tableRow = `
        <tr>
            <td>${index + 1}</td>
            <td>${detail.notes ? detail.notes : ''}</td>
            <td>${detail.category.name}</td>
            <td>
            ${image}
            </td>
            <td>${date}</td>
            <td>${
              detail.type === 'expense' ? -detail.amount : detail.amount
            }</td>
        </tr>
      `;
      tableBody += tableRow;
    });
    tableBody += `
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>TOTAL INCOME</td>
        <td>${
          GetCurrencySymbol(sheet.currency) +
          ' ' +
          GetCurrencyLocalString(totalIncome)
        }</td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>TOTAL EXPENSE</td>
        <td>${
          GetCurrencySymbol(sheet.currency) +
          ' ' +
          GetCurrencyLocalString(totalExpense)
        }</td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>BALANCE</td>
        <td>${
          GetCurrencySymbol(sheet.currency) +
          ' ' +
          GetCurrencyLocalString(totalIncome - totalExpense)
        }</td>
       </tr>


    `;
    let html = `
    <!DOCTYPE html>
    <head>
     ${styles}
    </head>
    <body>
      <table class="styled-table">
          <thead>
              <tr>
                  ${tableHeads}
              </tr>
          </thead>
          <tbody>
              ${tableBody}
          </tbody>
       </table>
    </body>

    `;
    let options = {
      html: html,
      fileName: 'transactions',
      directory: 'Documents', //for ios only Documents is allowed
    };

    let file = await RNHTMLtoPDF.convert(options);

    let finalPath = 'file://' + file.filePath;

    if (config && config.sharing) {
      Share.open({
        url: finalPath,
        title: 'Transactions Pdf File',
        subject: 'Transaction file - Pdf',
      }).catch(err => {
        console.log(err, 'error while sharing the data - ios pdf');
      });
      dispatch(loaderActions.hideLoader());
      return;
    }
    if (file.filePath) {
      if (Platform.OS === 'ios') {
        Share.open({
          url: finalPath,
          filename: `transactions.pdf`,
          saveToFiles: true,
          type: 'application/pdf',
        }).catch(err => {
          console.log(
            err.error.message,
            'error while exporting the data pdf - ios',
          );
        });
        dispatch(loaderActions.hideLoader());
      } else {
        try {
          // const granted = await PermissionsAndroid.request(
          //   PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          // );
          // if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          if (!config || !config.sharing) {
            downloadPdf(file.filePath, callback);
          }
          // } else {
          //   dispatch(loaderActions.hideLoader());

          //   showAlertStoragePermission();
          // }
        } catch (err) {
          dispatch(loaderActions.hideLoader());
          console.warn(err, 'error occured storage');
        }
      }
    }
  };

  const onExportAllDataToPdf = async () => {
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'pdf'}));
    let folderName = `transaction-pdfs-${moment()}`;
    let fPath = RNFetchBlob.fs.dirs.DownloadDir + '/' + folderName;
    if (Platform.OS === 'ios') {
      fPath = RNFetchBlob.fs.dirs.DocumentDir + '/' + folderName;
    }
    await RNFetchBlob.fs.mkdir(fPath).catch(err => {
      console.log('Error in creating folder', err);
      dispatch(loaderActions.hideLoader());
      return;
    });

    for await (const sheet of sheets) {
      let tableHeads = `
      <th>S.NO</th>
      <th>TITLE</th>
      <th>CATEGORY</th>
      <th>IMAGE</th>
      <th>DATE</th>
      <th>AMOUNT ( ${GetCurrencySymbol(sheet.currency)} )</th>
    `;
      let styles = `
      <style>
      img{
        height : 100px;
        widht : 100px;
        object-fit : contain;
      }
      .styled-table {
        border-collapse: collapse;
        margin: 25px 0;
        font-size: 0.9em;
        font-family: sans-serif;
        min-width: 400px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
      }
      .styled-table thead tr {
        background-color: ${theme.colors.brand.primary};
        color: #ffffff;
        text-align: left;
      }
      .styled-table th,
      .styled-table td {
          padding: 12px 15px;
      }

      .styled-table tbody tr {
        border-bottom: 1px solid #dddddd;
      }
    
      .styled-table tbody tr:nth-of-type(even) {
        background-color: #f3f3f3;
      }
    
      .styled-table tbody tr:last-of-type {
        border-bottom: 2px solid #009879;
      }

      .styled-table tbody tr.active-row {
        font-weight: bold;
        color: #009879;
      }
    </style>
    `;

      let tableBody = '';
      let totalIncome = 0;
      let totalExpense = 0;

      sheet.details.forEach((detail, index) => {
        let date = moment(detail.date).format('MMM DD, YYYY ');
        if (detail.showTime) {
          let time = moment(detail.time).format('hh:mm A');
          date += time;
        }
        if (detail.type === 'expense') {
          totalExpense += detail.amount;
        } else {
          totalIncome += detail.amount;
        }

        let imageUrl = null;
        if (detail.image && detail.image.url) {
          if (
            detail.image.url.startsWith(
              `public/users/${userData.uid}/${sheet.id}/${detail.id}`,
            )
          ) {
            imageUrl = `${BACKEND_URL}/${detail.image.url}`;
          } else {
            imageUrl = detail.image.url;
          }
        }

        let image =
          detail.image && detail.image.url ? `<img src='${imageUrl}'/>` : '';
        let tableRow = `
        <tr>
            <td>${index + 1}</td>
            <td>${detail.notes ? detail.notes : ''}</td>
            <td>${detail.category.name}</td>
            <td>
            ${image}
            </td>
            <td>${date}</td>
            <td>${
              detail.type === 'expense' ? -detail.amount : detail.amount
            }</td>
        </tr>
      `;
        tableBody += tableRow;
      });
      tableBody += `
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>TOTAL INCOME</td>
        <td>${
          GetCurrencySymbol(sheet.currency) +
          ' ' +
          GetCurrencyLocalString(totalIncome)
        }</td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>TOTAL EXPENSE</td>
        <td>${
          GetCurrencySymbol(sheet.currency) +
          ' ' +
          GetCurrencyLocalString(totalExpense)
        }</td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>BALANCE</td>
        <td>${
          GetCurrencySymbol(sheet.currency) +
          ' ' +
          GetCurrencyLocalString(totalIncome - totalExpense)
        }</td>
       </tr>


    `;
      let html = `
    <!DOCTYPE html>
    <head>
     ${styles}
    </head>
    <body>
      <table class="styled-table">
          <thead>
              <tr>
                  ${tableHeads}
              </tr>
          </thead>
          <tbody>
              ${tableBody}
          </tbody>
       </table>
    </body>

    `;
      let options = {
        html: html,
        fileName: sheet.name,
        directory: 'Documents', //for ios only Documents is allowed
      };

      let file = await RNHTMLtoPDF.convert(options);

      let toPath;
      if (Platform.OS === 'ios') {
        toPath =
          RNFetchBlob.fs.dirs.DocumentDir +
          `/${folderName}/${sheet.name}-${moment()}.pdf`;
      } else {
        toPath =
          RNFetchBlob.fs.dirs.DownloadDir +
          `/${folderName}/${sheet.name}-${moment()}.pdf`;
      }

      await RNFetchBlob.fs
        .mv(file.filePath, toPath)
        .then(r => {
          console.log(`successfully exported file  -  ${sheet.name} pdf`);
        })
        .catch(err => {
          console.log('Error in moving the pdf ', err);
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while exporting the pdf',
            }),
          );
          dispatch(loaderActions.hideLoader());
        });
    }

    let targetPath = `${RNFetchBlob.fs.dirs.DownloadDir}/${folderName}.zip`;
    let sourcePath = RNFetchBlob.fs.dirs.DownloadDir + '/' + folderName;

    if (Platform.OS === 'ios') {
      targetPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${folderName}.zip`;
      sourcePath = RNFetchBlob.fs.dirs.DocumentDir + '/' + folderName;
    }
    zip(sourcePath, targetPath)
      .then(path => {
        RNFetchBlob.fs.unlink(sourcePath);
        dispatch(loaderActions.hideLoader());
        console.log(`zip completed at ${path}`);

        if (Platform.OS === 'ios') {
          Share.open({
            url: path,
            saveToFiles: true,
            title: 'Transactions Pdf File',
            subject: 'Transaction file - Pdf',
          }).catch(err => {
            console.log(
              err.error.message,
              'error while exporting the all pdfs - ios',
            );
          });
          return;
        }
        dispatch(
          notificationActions.showToast({
            status: 'success',
            message:
              'Your file is exported successfully. Please check the downloads folder for the file.',
          }),
        );
      })
      .catch(error => {
        dispatch(loaderActions.hideLoader());
        console.error(error);
      });
  };

  const downloadPdf = async (filePath, callback) => {
    if (filePath) {
      let toPath =
        RNFetchBlob.fs.dirs.DownloadDir + `/transactions-${moment()}.pdf`;
      if (Platform.OS === 'ios') {
        RNFetchBlob.fs
          .mv(filePath, toPath)
          .then(r => {
            dispatch(loaderActions.hideLoader());
            callback();
            console.log('successfully exported file ios - pdf' + r);
            Share.open({
              url: toPath,
              filename: `transactions-${moment()}.json`,
              saveToFiles: true,
              type: 'application/json',
            }).catch(err => {
              dispatch(loaderActions.hideLoader());
              console.log(
                err.error.message,
                'error while exporting the data pdf - ios',
              );
            });
          })
          .catch(err => {
            dispatch(loaderActions.hideLoader());
            console.log(err, 'err in exporting file in ios pdf');
            dispatch(
              notificationActions.showToast({
                status: 'error',
                message: 'Something error occured while exporting the pdf',
              }),
            );
          });
      }

      if (Platform.OS === 'android') {
        RNFetchBlob.fs
          .mv(filePath, toPath)
          .then(r => {
            dispatch(loaderActions.hideLoader());
            callback();
            console.log('successfully exported file android - pdf' + r);
            dispatch(
              notificationActions.showToast({
                status: 'success',
                message:
                  'Your file is exported successfully. Please check the downloads folder for the file.',
              }),
            );
          })
          .catch(err => {
            dispatch(loaderActions.hideLoader());
            console.log(err, 'err in exporting file in anroid pdf', err);
            dispatch(
              notificationActions.showToast({
                status: 'error',
                message: 'Something error occured while exporting the pdf',
              }),
            );
          });
      }
    }
  };

  const onExportAllSheetsToExcel = async config => {
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'excel'}));

    let wb = XLSX.utils.book_new();

    sheets.forEach((sheet, index) => {
      let totalIncome = 0;
      let totalExpense = 0;
      let structuredDetails = [{}];

      sheet.details.forEach((d, i) => {
        let date = moment(d.date).format('MMM DD, YYYY ');
        if (d.showTime) {
          let time = moment(d.time).format('hh:mm A');
          date += time;
        }
        let amount = `AMOUNT ( ${GetCurrencySymbol(sheet.currency)} )`;
        if (d.type === 'expense') {
          totalExpense += d.amount;
        } else {
          totalIncome += d.amount;
        }
        let detail = {
          'S.NO': i + 1,
          TITLE: d.notes,
          CATEGORY: d.category.name,
          DATE: date,
          [amount]: d.type === 'expense' ? -d.amount : d.amount,
        };
        structuredDetails.push(detail);
      });
      let config = {
        title: sheet.name.toUpperCase(),
      };
      let ws = XLSX.utils.json_to_sheet(structuredDetails);
      let wsCols = [{wch: 5}, {wch: 40}, {wch: 40}, {wch: 25}, {wch: 25}];
      ws['!cols'] = wsCols;

      XLSX.utils.sheet_add_aoa(
        ws,
        [
          ['', '', '', '', ''],
          [
            '',
            '',
            '',
            'TOTAL INCOME ',
            GetCurrencySymbol(sheet.currency) +
              ' ' +
              GetCurrencyLocalString(totalIncome),
          ],
          [
            '',
            '',
            '',
            'TOTAL EXPENSES ',
            GetCurrencySymbol(sheet.currency) +
              ' ' +
              GetCurrencyLocalString(totalExpense),
          ],
          [
            '',
            '',
            '',
            'BALANCE',
            GetCurrencySymbol(sheet.currency) +
              ' ' +
              GetCurrencyLocalString(sheet.totalBalance),
          ],
        ],
        {origin: -1},
      );

      XLSX.utils.book_append_sheet(wb, ws, config.title);
    });
    let opt = {
      type: 'binary',
      bookType: 'xlsx',
    };

    const wbout = XLSX.write(wb, opt);
    if (Platform.OS === 'ios') {
      const dirs = RNFetchBlob.fs.dirs;
      var path = dirs.DocumentDir + '/transactions.xlsx';
      RNFS.writeFile(path, wbout, 'ascii')
        .then(res => {
          dispatch(loaderActions.hideLoader());

          console.log('successfully exported file ios - ' + res);
          Share.open({
            url: path,
            filename: 'transactions.xlsx',
            saveToFiles: true,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }).catch(err => {
            dispatch(loaderActions.hideLoader());

            console.log(
              err.error.message,
              'error while exporting the data - ios',
            );
          });
        })
        .catch(err => {
          dispatch(loaderActions.hideLoader());

          console.log(err, 'err in exporting file in ios');
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while exporting the data',
            }),
          );
        });
    }
    if (Platform.OS === 'android') {
      // const granted = await PermissionsAndroid.request(
      //   PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      //   {
      //     title: 'Expenses Manager wants to save your transactions file',
      //     message: 'Your app needs permission.',
      //     buttonNeutral: 'Ask Me Later',
      //     buttonNegative: 'Cancel',
      //     buttonPositive: 'OK',
      //   },
      // );

      // if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      const dirs = RNFetchBlob.fs.dirs;

      let path = dirs.DownloadDir + `/transactions-${moment()}.xlsx`;
      RNFS.writeFile(path, wbout, 'ascii')
        .then(r => {
          dispatch(loaderActions.hideLoader());

          dispatch(
            notificationActions.showToast({
              status: 'success',
              message:
                'Your file is exported successfully. Please check the downloads folder for the file.',
            }),
          );
        })
        .catch(err => {
          dispatch(loaderActions.hideLoader());

          console.log(err, 'Error in exporting excel');
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while exporting the file.',
            }),
          );
        });
      // } else {
      //   dispatch(loaderActions.hideLoader());
      //   showAlertStoragePermission();
      // }
    }
  };

  const onArchiveSheet = async sheet => {
    let presentSheets = [...sheets];
    let changeSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let changeSheet = presentSheets[changeSheetIndex];
    changeSheet.archived = changeSheet.archived ? !changeSheet.archived : true;
    changeSheet.pinned = false;
    presentSheets[changeSheetIndex] = changeSheet;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
      categories: categories,
    };
    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
    });
  };

  const onPinSheet = async sheet => {
    let presentSheets = [...sheets];
    let changeSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let changeSheet = presentSheets[changeSheetIndex];
    changeSheet.pinned = changeSheet.pinned ? !changeSheet.pinned : true;
    changeSheet.archived = false;
    presentSheets[changeSheetIndex] = changeSheet;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
      categories: categories,
    };
    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
    });
  };

  return (
    <SheetsContext.Provider
      value={{
        sheets,
        expensesData,
        categories,
        onSaveSheet,
        onSaveSheetDetails,
        onExportAllSheetsToExcel,
        onSaveCategory,
        onDeleteSheet,
        onSaveExpensesData,
        onEditSheet,
        onEditCategory,
        onDeleteCategory,
        getSheetById,
        onEditSheetDetails,
        onDeleteSheetDetails,
        onMoveSheets,
        onDuplicateSheet,
        onChangeSheetType,
        onExportData,
        onImportData,
        onArchiveSheet,
        onPinSheet,
        onExportDataToExcel,
        calculateBalance,
        onGoogleCloudVision,
        onExportDataToPdf,
        onExportAllDataToPdf,
        onUpdateDailyReminder,
        onUpdateDailyBackup,
        onUpdateAutoFetchTransactions,
        getMessages,
        baseCurrency,
        setBaseCurrency,
        onUpdateBaseCurrency,
        onSmartScanReceipt,
      }}>
      {children}
    </SheetsContext.Provider>
  );
};
