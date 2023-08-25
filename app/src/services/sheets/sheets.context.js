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
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';
import useHttp from '../../hooks/use-http';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import _ from 'lodash';
import matchWords from '../../components/utility/category-match-words.json';
import XLSX from 'xlsx';
import moment from 'moment';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../components/symbol.currency';
import {useTheme} from 'styled-components/native';
import storage from '@react-native-firebase/storage';
import SmsListener from 'react-native-android-sms-listener';
import {smsTransactionsActions} from '../../store/smsTransactions-slice';
import {getTransactionInfo} from 'transaction-sms-parser';
import SmsAndroid from 'react-native-get-sms-android';
import {getFirebaseAccessUrl} from '../../components/utility/helper';

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
  onSaveSheetDetails: (sheetDetail, callback = () => null) => null,
  onSaveExpensesData: () => null,
  onEditSheet: (sheet, callback = () => {}) => null,
  onEditSheetDetails: (
    sheetDetail,
    editFromUpcomingScreen,
    callback = () => null,
  ) => null,
  onEditCategory: (category, type, callback = () => null) => null,
  onDeleteSheet: () => null,
  onDeleteSheetDetails: (
    sheetDetail,
    editFromUpcomingScreen,
    callback = () => null,
  ) => null,
  onDeleteCategory: () => null,
  getSheetById: () => null,
  onMoveSheetDetail: (
    moveToSheet,
    sheetDetail,
    editFromUpcomingScreen,
    callback = () => null,
  ) => null,
  onDuplicateSheetDetail: (
    sheetDetail,
    editFromUpcomingScreen,
    callback = () => null,
  ) => null,
  onChangeSheetDetailType: (
    sheetDetail,
    editFromUpcomingScreen,
    callback = () => null,
  ) => null,
  onExportSheetDataToExcel: (config, data, callback) => null,
  onExportSheetDataToPdf: (config, sheet, callback) => null,
  onArchiveSheet: () => null,
  onPinSheet: () => null,
  calculateBalance: sheet => null,
  onGoogleCloudVision: (base64, callback) => null,
  onSmartScanReceipt: (base64, callback) => null,
  getMessages: () => null,
  currentSheet: null,
  setCurrentSheet: null,
  onCheckUpcomingSheetDetails: callback => null,
});

export const SheetsContextProvider = ({children}) => {
  const [sheets, setSheets] = useState([]);
  const [currentSheet, setCurrentSheet] = useState();
  const [categories, setCategories] = useState(defaultCategories);
  const [expensesData, setExpensesData] = useState(null);

  const {userData, userAdditionalDetails} = useContext(AuthenticationContext);
  const {sendRequest} = useHttp();
  const [autoFetchTransactionsOpened, setAutoFetchTransactionsOpened] =
    useState(false);

  const dispatch = useDispatch();
  const theme = useTheme();

  const MINDEE_API_KEY = remoteConfig().getValue('MINDEE_API_KEY').asString();
  const MINDEE_API_URL = remoteConfig().getValue('MINDEE_API_URL').asString();

  const GOOGLE_API_KEY = remoteConfig().getValue('GOOGLE_API_KEY').asString();
  const GOOGLE_CLOUD_VISION_API_URL = remoteConfig()
    .getValue('GOOGLE_CLOUD_VISION_API_URL')
    .asString();

  useEffect(() => {
    retrieveExpensesData();
  }, []);

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

  // helpers
  const showLoader = (loaderType, backdrop = true) => {
    let options = {};
    if (loaderType) {
      options.loaderType = loaderType;
    }
    if (backdrop) {
      options.backdrop = backdrop;
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

  const firebaseUploadFile = async (path, uri) => {
    return new Promise(async (resolve, reject) => {
      try {
        let storageRef = storage().ref(path);
        let response = await storageRef.putFile(uri);
        let state = response.state;
        if (state === 'success') {
          let downloadURL = path;
          resolve(downloadURL);
        } else {
          throw 'Error occured while uploading profile picture';
        }
      } catch (e) {
        console.log(
          e.toString(),
          'hey man error occured in uploading firebase cloud file',
        );
        reject(e);
      }
    });
  };

  const firebaseRemoveFile = async path => {
    return new Promise(async (resolve, reject) => {
      try {
        let storageRef = storage().ref(path);
        let fileExists = await storageRef
          .getMetadata()
          .then(() => true)
          .catch(() => false);
        if (fileExists) {
          await storageRef.delete();
        }
        resolve(true);
      } catch (e) {
        // skip deletion if file not exists
        console.log(
          e.toString(),
          'hey man error occured in removing firebase cloud file',
        );
        reject(e);
      }
    });
  };

  const firebaseCopyMoveFile = async (type, sourcePath, destinationPath) => {
    return new Promise(async (resolve, reject) => {
      try {
        let sourceRef = storage().ref(sourcePath);
        let destinationRef = storage().ref(destinationPath);

        const downloadURL = await sourceRef.getDownloadURL();

        // Use the 'fetch' function to get the file data from the download URL
        const response = await fetch(downloadURL);
        const fileData = await response.arrayBuffer();

        await destinationRef.put(fileData);
        // remove file if move
        if (type && type === 'move') {
          await sourceRef.delete();
        }
        resolve(destinationPath);
      } catch (e) {
        console.log(e.toString());
        reject(e);
      }
    });
  };

  const firebaseRemoveFolder = async folderPath => {
    return new Promise(async (resolve, reject) => {
      try {
        // Get a reference to the folder in Firebase Cloud Storage
        const folderRef = storage().ref().child(folderPath);
        // Get a list of all items (files/folders) inside the folder
        const folderItems = await folderRef.listAll();
        // Recursively delete each item inside the folder
        await Promise.all(
          folderItems.items.map(async item => {
            if (item.isDirectory) {
              // Recursively delete sub-folders
              await firebaseRemoveFolder(item.fullPath);
            } else {
              // Delete individual file
              let fileExists = await item
                .getMetadata()
                .then(() => true)
                .catch(() => false);
              if (fileExists) {
                await item.delete();
              }
              console.log(`File deleted: ${item.fullPath}`);
            }
          }),
        );

        // Delete the empty folder itself
        await folderRef.delete();
        console.log(`Folder deleted: ${folderPath}`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  const onGoogleCloudVision = async (base64, callback = () => null) => {
    if (!base64) {
      Alert.alert('Required base64 string');
      return;
    }
    showLoader('scanning');

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
          hideLoader();
          let resultObj = receivedResponse.responses[0];
          if (_.isEmpty(resultObj)) {
            hideLoader();
            showNotification('warning', 'No text detected from the Image!');
          } else {
            let finalResult = onExtractAndFilterText(resultObj);
            callback(finalResult); // callback with data handler
          }
        },
        errorCallback: err => {
          hideLoader();
          showNotification(
            'warning',
            'Something error occured while extracting text!',
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
    showLoader('scanning');

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
          hideLoader();
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
            let amount = total_amount.value;
            if (amount === null) {
              hideLoader();
              showNotification('warning', 'No Text found !');
              return;
            } else {
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
            }
          } else {
            console.log(receivedResponse.api_request);
            hideLoader();
            showNotification(
              'warning',
              'Something error occured while extracting text!',
            );
          }
        },
        errorCallback: err => {
          console.log(err, ' Error in scanning receipt');
          hideLoader();
          showNotification(
            'warning',
            'Something error occured while extracting text!',
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
    return {
      totalIncome: totalIncomeAmount,
      totalExpense: totalExpenseAmount,
      totalBalance: totalBalance,
    };
  };

  const onCheckUpcomingSheetDetails = (callback = () => {}) => {
    if (currentSheet.upcoming && currentSheet.upcoming.length > 0) {
      let presentSheets = [...sheets];
      let sheetIndex = presentSheets.findIndex(s => s.id === currentSheet.id);
      currentSheet.upcoming.forEach((sd, index) => {
        let date = sd.date;
        let upcoming = moment(date).isAfter(moment());
        if (!upcoming) {
          currentSheet.upcoming.splice(index, 1);
          currentSheet.details.push(sd);
        }
      });
      let {totalExpense, totalIncome, totalBalance} =
        calculateBalance(currentSheet);
      currentSheet.totalExpense = totalExpense;
      currentSheet.totalIncome = totalIncome;
      currentSheet.totalBalance = totalBalance;
      presentSheets[sheetIndex] = currentSheet;
      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };
      onSaveExpensesData(updatedExpensesData).then(() => {
        onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
        setCurrentSheet(currentSheet);
        callback();
      });
    } else {
      callback();
    }
  };

  const onSaveExpensesData = async passedExpensesData => {
    if (passedExpensesData.sheets) {
      let sortedSheets = passedExpensesData.sheets.sort(
        (a, b) => b.updatedAt - a.updatedAt,
      );
      passedExpensesData.sheets.forEach(sheet => {
        if (!sheet.totalIncome || !sheet.totalExpense || !sheet.totalBalance) {
          let {totalExpense, totalIncome, totalBalance} =
            calculateBalance(sheet);
          sheet.totalBalance = totalBalance;
          sheet.totalExpense = totalExpense;
          sheet.totalIncome = totalIncome;
        }
      });
      setSheets(sortedSheets);
    }

    if (passedExpensesData.categories) {
      let changedCategories = {...passedExpensesData.categories};
      setCategories(changedCategories);
    }

    if (passedExpensesData) {
      setExpensesData(passedExpensesData);
    }

    try {
      const jsonValue = JSON.stringify(passedExpensesData);
      await AsyncStorage.setItem('@expenses-manager-data', jsonValue);
      // retrieveExpensesData();
    } catch (e) {
      hideLoader();
    }
  };

  const retrieveExpensesData = async () => {
    try {
      let value = await AsyncStorage.getItem('@expenses-manager-data');
      value = JSON.parse(value);
      if (value != null) {
        setExpensesData(value);
        // set sheets accoring to updated date wise
        if (value.sheets) {
          let sortedSheets = value.sheets.sort(
            (a, b) => b.updatedAt - a.updatedAt,
          );

          sortedSheets.forEach(sheet => {
            if (
              !sheet.totalIncome ||
              !sheet.totalExpense ||
              !sheet.totalBalance
            ) {
              let {totalExpense, totalIncome, totalBalance} =
                calculateBalance(sheet);
              sheet.totalBalance = totalBalance;
              sheet.totalExpense = totalExpense;
              sheet.totalIncome = totalIncome;
            }
          });

          setSheets(sortedSheets);
        }
        if (value.categories) {
          setCategories(value.categories);
        }
      }
    } catch (e) {
      console.log('error retrieving expenses data - ', e);
      hideLoader();
    }
  };

  const onSaveSheet = async (sheet, callback = () => null) => {
    let showTransactions = false;
    if (!sheets || sheets.length === 0) {
      showTransactions = true;
    }
    let sh = {...sheet, totalIncome: 0, totalExpense: 0, totalBalance: 0};
    console.log(sh);
    saveSheetRequest(sh, sheets)
      .then(async result => {
        const updatedSheets = [...sheets, sh];
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
        showNotification('error', err);
        hideLoader();
      });
  };

  const onSaveSheetDetails = async (sheetDetail, callback = () => null) => {
    const saveSheet = () => {
      var presentSheets = _.cloneDeep(sheets);
      var sheetIndex = presentSheets.findIndex(s => s.id === currentSheet.id);
      var presentSheet = presentSheets[sheetIndex];
      if (!presentSheet.details) {
        presentSheet.details = [];
      }
      let upcoming = moment(sheetDetail.date).isAfter(moment());
      if (upcoming) {
        if (!presentSheet.upcoming) {
          presentSheet.upcoming = [];
        }
        presentSheet.upcoming.push(sheetDetail);
      } else {
        presentSheet.details.push(sheetDetail);
        let {totalExpense, totalIncome, totalBalance} =
          calculateBalance(presentSheet);
        presentSheet.totalExpense = totalExpense;
        presentSheet.totalIncome = totalIncome;
        presentSheet.totalBalance = totalBalance;
      }
      presentSheet.updatedAt = Date.now();
      presentSheets[sheetIndex] = presentSheet;
      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };
      onSaveExpensesData(updatedExpensesData).then(() => {
        setCurrentSheet(presentSheet);
        onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
        callback();
      });
    };

    if (sheetDetail.image && sheetDetail.image.url) {
      let imageTypesAllowed = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!imageTypesAllowed.includes(sheetDetail.image.type)) {
        showNotification('error', 'Only JPEG, PNG images are allowed');
        return;
      }
      let pictureName = `${sheetDetail.id}.${sheetDetail.image.extension}`;

      let uploadPath = `users/${userData.uid}/${currentSheet.id}/${pictureName}`;
      showLoader('image_upload');

      await firebaseUploadFile(uploadPath, sheetDetail.image.uri)
        .then(downloadURL => {
          hideLoader();
          let imageObj = {
            url: downloadURL,
            type: sheetDetail.image.type,
            extension: sheetDetail.image.extension,
          };
          sheetDetail.image = imageObj;
          saveSheet();
        })
        .catch(err => {
          hideLoader();
          showNotification('error', err.toString());
        });
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
        showNotification('error', err);

        hideLoader();
      });
  };

  const onEditSheet = async (sheet, callback) => {
    let ifAlreadyExists = sheets.filter(
      s =>
        s.name.toLowerCase() === sheet.name.toLowerCase() && s.id !== sheet.id,
    );
    if (ifAlreadyExists && ifAlreadyExists.length) {
      showNotification('error', 'Sheet name already exists');
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
    sheetDetail,
    editFromUpcomingScreen = false,
    callback = () => null,
  ) => {
    const editSheet = () => {
      delete sheetDetail.imageChanged;
      delete sheetDetail.imageDeleted;
      sheetDetails[sheetDetailIndex] = sheetDetail;
      let upcoming = moment(sheetDetail.date).isAfter(moment());
      if (upcoming) {
        if (!presentSheet.upcoming) {
          presentSheet.upcoming = [];
        }
        if (!editFromUpcomingScreen) {
          // remove from details
          sheetDetails.splice(sheetDetailIndex, 1);
          // add to upcoming
          presentSheet.upcoming.push(sheetDetail);
        }
      } else {
        if (editFromUpcomingScreen) {
          // remove from upcoming
          sheetDetails.splice(sheetDetailIndex, 1);
          // add to details
          presentSheet.details.push(sheetDetail);
        }
      }
      let {totalExpense, totalIncome, totalBalance} =
        calculateBalance(presentSheet);
      presentSheet.totalExpense = totalExpense;
      presentSheet.totalIncome = totalIncome;
      presentSheet.totalBalance = totalBalance;
      presentSheet.updatedAt = Date.now();
      presentSheets[sheetIndex] = presentSheet;
      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };
      onSaveExpensesData(updatedExpensesData).then(() => {
        setCurrentSheet(presentSheet);
        onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
        callback();
      });
    };

    var presentSheets = _.cloneDeep(sheets);
    var sheetIndex = presentSheets.findIndex(s => s.id === currentSheet.id);
    var presentSheet = presentSheets[sheetIndex];
    let sheetDetails = editFromUpcomingScreen
      ? presentSheet.upcoming
      : presentSheet.details;
    let sheetDetailIndex = sheetDetails.findIndex(
      sd => sd.id === sheetDetail.id,
    );

    // if image changed delete the image and upload new image
    if (sheetDetail.imageChanged) {
      if (sheetDetail.image && sheetDetail.image.url) {
        // delete previous image
        let previousImageUrl = sheetDetails[sheetDetailIndex].image.url;

        if (previousImageUrl) {
          await firebaseRemoveFile(previousImageUrl);
        }

        let imageTypesAllowed = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!imageTypesAllowed.includes(sheetDetail.image.type)) {
          showNotification('error', 'Only JPEG, PNG images are allowed');
          return;
        }

        let pictureName = `${sheetDetail.id}.${sheetDetail.image.extension}`;

        let uploadPath = `users/${userData.uid}/${currentSheet.id}/${pictureName}`;
        showLoader('image_upload');

        await firebaseUploadFile(uploadPath, sheetDetail.image.uri)
          .then(downloadURL => {
            hideLoader();
            let imageObj = {
              url: downloadURL,
              type: sheetDetail.image.type,
              extension: sheetDetail.image.extension,
            };
            sheetDetail.image = imageObj;
            editSheet();
          })
          .catch(err => {
            hideLoader();
            showNotification('error', err.toString());
          });
      }
    }
    // if image delete request
    else if (sheetDetail.imageDeleted) {
      showLoader('image_upload');
      await firebaseRemoveFile(sheetDetails[sheetDetailIndex].image.url)
        .then(() => {
          sheetDetail.image = {url: null};
          hideLoader();
          editSheet();
        })
        .catch(err => {
          hideLoader();
          showNotification('error', err.toString());
        });
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
      showNotification('error', 'Category name already exists');
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
    try {
      await firebaseRemoveFolder(`users/${userData.uid}/${sheet.id}`);
    } catch (e) {
      console.log(e);
    }
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
    sheetDetail,
    editFromUpcomingScreen = false,
    callback = () => null,
  ) => {
    let presentSheets = _.cloneDeep(sheets);
    let presentSheetIndex = presentSheets.findIndex(
      s => s.id === currentSheet.id,
    );
    let sheetDetails = editFromUpcomingScreen
      ? presentSheets[presentSheetIndex].upcoming
      : presentSheets[presentSheetIndex].details;

    let sheetDetailIndex = sheetDetails.findIndex(d => d.id === sheetDetail.id);
    sheetDetails.splice(sheetDetailIndex, 1);

    if (editFromUpcomingScreen) {
      presentSheets[presentSheetIndex].upcoming = sheetDetails;
    } else {
      presentSheets[presentSheetIndex].details = sheetDetails;
    }

    let {totalExpense, totalIncome, totalBalance} = calculateBalance(
      presentSheets[presentSheetIndex],
    );

    presentSheets[presentSheetIndex].totalExpense = totalExpense;
    presentSheets[presentSheetIndex].totalIncome = totalIncome;
    presentSheets[presentSheetIndex].totalBalance = totalBalance;

    presentSheets[presentSheetIndex].updatedAt = Date.now();
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
      categories: categories,
    };
    // callback
    onSaveExpensesData(updatedExpensesData).then(() => {
      setCurrentSheet(presentSheets[presentSheetIndex]);
      callback(presentSheets[presentSheetIndex]);
      onSetChangesMade(true);
    });
    // delete bill
    if (sheetDetail.image && sheetDetail.image.url) {
      await firebaseRemoveFile(sheetDetail.image.url);
    }
  };

  const onMoveSheetDetail = async (
    moveToSheet,
    sheetDetail,
    editFromUpcomingScreen = false,
    callback = () => null,
  ) => {
    let photo = sheetDetail?.image;

    const moveSheet = () => {
      let presentSheets = [...sheets];
      let moveFromSheetIndex = presentSheets.findIndex(
        s => s.id === currentSheet.id,
      );
      let moveFromSheet = presentSheets[moveFromSheetIndex];
      let sheetDetails = editFromUpcomingScreen
        ? moveFromSheet.upcoming
        : moveFromSheet.details;
      let moveFromremainingSheetDetails = sheetDetails.filter(
        s => s.id !== sheetDetail.id,
      );
      if (editFromUpcomingScreen) {
        moveFromSheet.upcoming = moveFromremainingSheetDetails;
      } else {
        moveFromSheet.details = moveFromremainingSheetDetails;
      }
      let {totalExpense, totalIncome, totalBalance} =
        calculateBalance(moveFromSheet);
      moveFromSheet.totalExpense = totalExpense;
      moveFromSheet.totalIncome = totalIncome;
      moveFromSheet.totalBalance = totalBalance;
      moveFromSheet.updatedAt = Date.now();
      presentSheets[moveFromSheetIndex] = moveFromSheet;
      // to move sheet into
      let moveToIndex = presentSheets.findIndex(s => s.id === moveToSheet.id);
      var moveTo = presentSheets[moveToIndex];
      if (!moveTo.details) {
        moveTo.details = [];
      }
      if (editFromUpcomingScreen) {
        if (!moveTo.upcoming) {
          moveTo.upcoming = [];
        }
        moveTo.upcoming.push(sheetDetail);
      } else {
        moveTo.details.push(sheetDetail);
      }
      let {
        totalExpense: moveToTotalExpense,
        totalIncome: moveToTotalIncome,
        totalBalance: moveToTotalBalance,
      } = calculateBalance(moveTo);
      moveTo.totalExpense = moveToTotalExpense;
      moveTo.totalIncome = moveToTotalIncome;
      moveTo.totalBalance = moveToTotalBalance;
      presentSheets[moveToIndex] = moveTo;
      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };
      onSaveExpensesData(updatedExpensesData).then(() => {
        onSetChangesMade(true);
        setCurrentSheet(moveFromSheet);
        callback(moveFromSheet);
      });
    };

    if (photo && photo.url) {
      showLoader();
      let extRegex = /\.(png|jpe?g|gif|bmp|webp)$/i;
      let extension = photo.url.match(extRegex)?.[0];
      let pictureName = sheetDetail.id + '.' + extension;
      let moveToPath = `users/${userData.uid}/${moveToSheet.id}/${pictureName}`;
      await firebaseCopyMoveFile('move', photo.url, moveToPath)
        .then(downloadURL => {
          hideLoader();
          sheetDetail.image.url = downloadURL;
          moveSheet();
        })
        .catch(err => {
          console.log('Error in moving the transaction ', err);
          hideLoader();
          showNotification('error', err.toString());
        });
    } else {
      moveSheet();
    }
  };

  const onDuplicateSheetDetail = async (
    sheetDetail,
    editFromUpcomingScreen = false,
    callback = () => null,
  ) => {
    let presentSheets = [...sheets];
    let dupSheetIndex = presentSheets.findIndex(s => s.id === currentSheet.id);
    let dupSheet = {...presentSheets[dupSheetIndex]};
    let newSheetDetail = _.cloneDeep(sheetDetail);
    newSheetDetail.id =
      Date.now().toString(36) + Math.random().toString(36).substring(2);

    let photo = sheetDetail?.image;

    const duplicateSheet = () => {
      if (editFromUpcomingScreen) {
        dupSheet.upcoming.push(newSheetDetail);
      } else {
        dupSheet.details.push(newSheetDetail);
      }
      dupSheet.updatedAt = Date.now();
      let {totalExpense, totalIncome, totalBalance} =
        calculateBalance(dupSheet);
      dupSheet.totalExpense = totalExpense;
      dupSheet.totalIncome = totalIncome;
      dupSheet.totalBalance = totalBalance;
      presentSheets[dupSheetIndex] = dupSheet;

      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
        categories: categories,
      };

      onSaveExpensesData(updatedExpensesData).then(() => {
        onSetChangesMade(true);
        setCurrentSheet(dupSheet);
        callback(dupSheet);
      });
    };

    if (photo && photo.url) {
      showLoader();
      let extRegex = /\.(png|jpe?g|gif|bmp|webp)$/i;
      let extension = photo.url.match(extRegex)?.[0];
      let pictureName = newSheetDetail.id + '.' + extension;
      let copyToPath = `users/${userData.uid}/${currentSheet.id}/${pictureName}`;
      await firebaseCopyMoveFile('copy', photo.url, copyToPath)
        .then(downloadURL => {
          hideLoader();
          newSheetDetail.image.url = downloadURL;
          duplicateSheet();
        })
        .catch(err => {
          console.log('Error in duplicating the transaction ', err);
          hideLoader();
          showNotification('error', err.toString());
        });
    } else {
      duplicateSheet();
    }
  };

  const onChangeSheetDetailType = async (
    sheetDetail,
    editFromUpcomingScreen = false,
    callback = () => null,
  ) => {
    let presentSheets = [...sheets];
    let changeSheetIndex = presentSheets.findIndex(
      s => s.id === currentSheet.id,
    );
    let changeSheet = presentSheets[changeSheetIndex];
    let sheetDetails = editFromUpcomingScreen
      ? changeSheet.upcoming
      : changeSheet.details;

    let detailIndex = sheetDetails.findIndex(d => d.id === sheetDetail.id);

    if (editFromUpcomingScreen) {
      changeSheet.upcoming[detailIndex].type =
        sheetDetail.type === 'income' ? 'expense' : 'income';
    } else {
      changeSheet.details[detailIndex].type =
        sheetDetail.type === 'income' ? 'expense' : 'income';
    }

    changeSheet.updatedAt = Date.now();
    let {totalExpense, totalIncome, totalBalance} =
      calculateBalance(changeSheet);
    changeSheet.totalExpense = totalExpense;
    changeSheet.totalIncome = totalIncome;
    changeSheet.totalBalance = totalBalance;
    presentSheets[changeSheetIndex] = changeSheet;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
      categories: categories,
    };

    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
      setCurrentSheet(changeSheet);
      callback(changeSheet);
    });
  };

  const getSheetById = id => {
    return sheets.filter(s => s.id === id)[0];
  };

  const onExportSheetDataToExcel = async (
    config,
    data,
    callback = () => null,
  ) => {
    showLoader('excel');
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.json_to_sheet(data);
    // add extracells
    XLSX.utils.sheet_add_aoa(ws, config.extraCells, {origin: -1});

    ws['!cols'] = config.wscols;

    XLSX.utils.book_append_sheet(wb, ws, config.title);
    const wbout = XLSX.write(wb, {type: 'binary', bookType: 'xlsx'});

    if (Platform.OS === 'ios') {
      const dirs = RNFetchBlob.fs.dirs;
      var path = dirs.DocumentDir + `/transactions-${Date.now()}.xlsx`;
      RNFS.writeFile(path, wbout, 'ascii')
        .then(res => {
          hideLoader();
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
            hideLoader();
            return;
          }

          Share.open({
            url: path,
            filename: `transactions-${Date.now()}.xlsx`,
            saveToFiles: true,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }).catch(err => {
            hideLoader();
            console.log(
              err.error.message,
              'error while exporting the data - ios',
            );
          });
        })
        .catch(err => {
          hideLoader();

          console.log(err, 'err in exporting file in ios');
          showNotification(
            'error',
            'Something error occured while exporting the data',
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

      path = dirs.DownloadDir + `/transactions-${Date.now()}.xlsx`;
      if (config && config.sharing) {
        path = dirs.CacheDir + `/transactions-${Date.now()}.xlsx`;
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

          hideLoader();
          callback();
          if (!config || !config.sharing) {
            showNotification(
              'success',
              'Your file is exported successfully. Please check the downloads folder for the file.',
            );
          }
        })
        .catch(err => {
          hideLoader();
          console.log(err, 'Error in exporting excel');
          showNotification(
            'error',
            'Something error occured while exporting the file.',
          );
        });
      // } else {
      //   hideLoader();
      //   showAlertStoragePermission();
      // }
    }
  };

  const onExportSheetDataToPdf = async (
    config,
    sheet,
    callback = () => null,
  ) => {
    try {
      showLoader('pdf');

      let tableHeads = `
      <th>S.NO</th>
      <th>TITLE</th>
      <th>CATEGORY</th>
      <th>IMAGE</th>
      <th>DATE</th>
      <th>AMOUNT ( ${GetCurrencySymbol(currentSheet.currency)} )</th>
    `;
      let styles = `
      <style>
      .title{
        text-align : center;
      }
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
          imageUrl = getFirebaseAccessUrl(detail.image.url);
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
      <h3 class='title'>${sheet.name}</h3>
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
        }).catch(e => {});
        hideLoader();
        return;
      }
      if (file.filePath) {
        if (Platform.OS === 'ios') {
          Share.open({
            url: finalPath,
            filename: `transactions.pdf`,
            saveToFiles: true,
            type: 'application/pdf',
          });
          hideLoader();
        } else {
          if (!config || !config.sharing) {
            let filePath = file.filePath;
            if (filePath) {
              let toPath =
                RNFetchBlob.fs.dirs.DownloadDir +
                `/transactions-${Date.now()}.pdf`;
              if (Platform.OS === 'ios') {
                let r = await RNFetchBlob.fs.mv(filePath, toPath);
                hideLoader();
                callback();
                console.log('successfully exported file ios - pdf' + r);
                Share.open({
                  url: toPath,
                  filename: `transactions-${Date.now()}.json`,
                  saveToFiles: true,
                  type: 'application/json',
                });
              }

              if (Platform.OS === 'android') {
                let r = await RNFetchBlob.fs.mv(filePath, toPath);

                hideLoader();
                callback();
                console.log('successfully exported file android - pdf' + r);
                showNotification(
                  'success',
                  'Your file is exported successfully. Please check the downloads folder for the file.',
                );
              }
            }
          }
        }
      }
    } catch (e) {
      showNotification(
        'error',
        'Something error occured while exporting the pdf ' + e.toString(),
      );
      hideLoader();
      console.warn(e, 'error occured storage');
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
        currentSheet,
        setCurrentSheet,
        onSaveSheet,
        onSaveSheetDetails,
        onSaveCategory,
        onDeleteSheet,
        onSaveExpensesData,
        onEditSheet,
        onEditCategory,
        onDeleteCategory,
        getSheetById,
        onEditSheetDetails,
        onDeleteSheetDetails,
        onMoveSheetDetail,
        onDuplicateSheetDetail,
        onChangeSheetDetailType,
        onArchiveSheet,
        onPinSheet,
        onExportSheetDataToExcel,
        calculateBalance,
        onGoogleCloudVision,
        onExportSheetDataToPdf,
        onSmartScanReceipt,
        onCheckUpcomingSheetDetails,
        getMessages,
      }}>
      {children}
    </SheetsContext.Provider>
  );
};
