import React, {useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, useContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import {
  Alert,
  Keyboard,
  Linking,
  PermissionsAndroid,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import Share from 'react-native-share';
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';
import useHttp from '../../hooks/use-http';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import _ from 'lodash';
import XLSX from 'xlsx';
import moment from 'moment';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../components/symbol.currency';
import {useTheme} from 'styled-components/native';
import storage from '@react-native-firebase/storage';
import {smsTransactionsActions} from '../../store/smsTransactions-slice';
import {getTransactionInfo} from 'transaction-sms-parser';
import SmsAndroid from 'react-native-get-sms-android';
import {
  accountSelectClause,
  categorySelectClause,
  excelSheetAccountColWidth,
  firebaseRemoveFolder,
  formatDate,
  getDataFromRows,
  getExcelSheetAccountRows,
  getExcelSheetAccountSummary,
  getPdfAccountTableHtml,
  transactionSelectClause,
} from '../../components/utility/helper';
import {SQLiteContext} from '../sqlite/sqlite.context';
import {transformSheetExcelExportData} from '../../components/utility/dataProcessHelper';
import {CategoriesContext} from '../categories/categories.context';

export const SheetsContext = createContext({
  getSheets: searchKeyword => {},
  onGetAndSetCurrentSheet: sheetId => {},
  getAllSheets: searchKeyword => {},
  onSaveSheet: (sheet, callback = () => null) => null,
  onEditSheet: (sheet, callback = () => {}) => null,
  onDeleteSheet: (sheet, callback) => null,
  onExportSheetDataToExcel: (config, data, callback) => null,
  onExportSheetDataToPdf: (config, sheet, callback) => null,
  onArchiveSheet: (sheet, callback) => null,
  onPinSheet: (sheet, callback) => null,
  calculateBalance: sheet => null,
  getMessages: () => null,
  currentSheet: null,
  setCurrentSheet: null,
});

const {SmsListener, AlarmManagerModule} = NativeModules;
const smsListenerEmitter =
  Platform.OS === 'android' ? new NativeEventEmitter(SmsListener) : null;
const alarmEmitter =
  Platform.OS === 'android' ? new NativeEventEmitter(AlarmManagerModule) : null;

export const SheetsContextProvider = ({children}) => {
  const [currentSheet, setCurrentSheet] = useState();
  const {userData, userAdditionalDetails} = useContext(AuthenticationContext);
  const {getCategories} = useContext(CategoriesContext);
  const {sendRequest} = useHttp();
  const [autoFetchTransactionsOpened, setAutoFetchTransactionsOpened] =
    useState(false);
  const {createOrReplaceData, updateData, getData, deleteData, db} =
    useContext(SQLiteContext);

  const dispatch = useDispatch();
  const theme = useTheme();

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
        smsSubscription = smsListenerEmitter.addListener(
          'onSmsReceived',
          message => {
            if (message) {
              getMessageFromListener(message);
            }
          },
        );
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
        let categoryName = 'miscellaneous';
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

        let amount =
          transactionInfo?.balance?.available ||
          transactionInfo.transaction.amount;
        let body = message.body;
        let receivedDate = message.timestamp;

        if (amount !== null && amount) {
          amount = parseFloat(amount);
          let categoryType =
            transactionInfo.transaction.type === 'debit' ? 'expense' : 'income';
          const categories = await getCategories(categoryType);

          let selectedCategory = categories.find(
            c => c.name.toLowerCase() === categoryName,
          );

          let obj = {
            body: body,
            date: receivedDate,
            amount: amount,
            category: selectedCategory,
            categoryType: categoryType,
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
        let categoryName = 'miscellaneous';
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
          async (count, smsList) => {
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
            const promises = uniqueMessages.map(async message => {
              let transactionInfo = getTransactionInfo(message.body);
              let amount =
                transactionInfo?.balance?.available ||
                transactionInfo.transaction.amount;
              let body = message.body;
              let receivedDate = message.date;

              if (amount !== null && amount) {
                amount = parseFloat(amount);
                let categoryType =
                  transactionInfo.transaction.type === 'debit'
                    ? 'expense'
                    : 'income';
                const categories = await getCategories(categoryType);
                let selectedCategory = categories.find(
                  c => c.name.toLowerCase() === categoryName,
                );

                let obj = {
                  body: body,
                  date: receivedDate,
                  amount: amount,
                  category: selectedCategory,
                  categoryType: categoryType,
                  id: index,
                };

                index++;
                finalMessages.push(obj);
              }
            });

            await Promise.all(promises).then();

            if (finalMessages && finalMessages.length > 0) {
              let messagesWithoutRemovedTransactions = [];

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

  const getSheets = async (searchKeyword = null) => {
    try {
      let uid = userData.uid;
      let query = `SELECT * FROM Accounts WHERE uid='${uid}'`;

      if (searchKeyword) {
        query += `AND LOWER(name) LIKE '%${searchKeyword}%'`;
      }
      let orderQuery = 'ORDER BY datetime(updatedAt) DESC';
      let regularQuery = `${query} AND pinned=0 AND archived=0 ${orderQuery}`;
      let pinnedQuery = `${query} AND pinned=1 ${orderQuery}`;
      let archivedQuery = `${query} AND archived=1 ${orderQuery}`;
      let totalCountQuery = `SELECT COUNT(*) AS totalCount FROM Accounts WHERE uid='${uid}'`;
      let regularResults = await getData(regularQuery);
      let regularData = await getDataFromRows(regularResults.rows);
      let pinnedResults = await getData(pinnedQuery);
      let pinnedData = await getDataFromRows(pinnedResults.rows);
      let archivedResults = await getData(archivedQuery);
      let archivedData = await getDataFromRows(archivedResults.rows);
      let totalCountResult = await getData(totalCountQuery);
      let totalCountData = await getDataFromRows(totalCountResult.rows);

      const data = {
        regular: regularData,
        pinned: pinnedData,
        archived: archivedData,
        totalCount: totalCountData[0].totalCount || 0,
      };
      return data;
    } catch (e) {
      console.log('error retrieving accounts data - ', e);
      hideLoader();
    }
  };

  const onGetAndSetCurrentSheet = async sheetId => {
    return new Promise(async (resolve, reject) => {
      try {
        let result = await getData(
          `SELECT * FROM Accounts WHERE id = ${sheetId} LIMIT 1`,
        );
        let resultData = await getDataFromRows(result.rows);
        if (resultData[0]) {
          setCurrentSheet(resultData[0]);
        }
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  };

  const getAllSheets = async (searchKeyword = null, excludedId = null) => {
    try {
      let uid = userData.uid;
      let query = `SELECT * FROM Accounts WHERE uid='${uid}'`;
      let totalCountQuery = `SELECT COUNT(*) AS totalCount FROM Accounts WHERE uid='${uid}'`;

      if (searchKeyword) {
        query += `AND LOWER(name) LIKE '%${searchKeyword}%'`;
      }
      if (excludedId !== null) {
        query += `AND id != ${excludedId}`;
        totalCountQuery += `AND id != ${excludedId}`;
      }
      let orderQuery = 'ORDER BY datetime(updatedAt) DESC';
      let finalQuery = `${query} ${orderQuery}`;
      let result = await getData(finalQuery);
      let resultData = await getDataFromRows(result.rows);

      let totalCountResult = await getData(totalCountQuery);
      let totalCountData = await getDataFromRows(totalCountResult.rows);

      const data = {
        sheets: resultData,
        totalCount: totalCountData[0].totalCount || 0,
      };
      return data;
    } catch (e) {
      console.log('error retrieving accounts data - ', e);
      hideLoader();
    }
  };

  const onSaveSheet = async (sheet, callback = () => null) => {
    try {
      let result = await getData(
        `SELECT * FROM Accounts WHERE LOWER(name) = '${_.toLower(sheet.name)}'`,
      );
      if (result?.rows?.length > 0) {
        throw 'Account name already exists!';
      }
      await createOrReplaceData('Accounts', sheet);
      callback();
    } catch (err) {
      Keyboard.dismiss();
      showNotification('error', err.message || err.toString());
    }
  };

  const onEditSheet = async (sheet, callback = () => null) => {
    try {
      let result = await getData(
        `SELECT * FROM Accounts WHERE uid = '${userData.uid}' AND id <> ${
          sheet.id
        } AND LOWER(name) = '${_.toLower(sheet.name)}'`,
      );
      if (result?.rows?.length > 0) {
        throw 'Account name already exists!';
      }

      await updateData('Accounts', sheet, 'WHERE uid=? AND id=?', [
        userData.uid,
        sheet.id,
      ]);
      callback();
    } catch (err) {
      showNotification('error', err.message || err.toString());
    }
  };

  const onDeleteSheet = async (sheet, callback = () => null) => {
    try {
      showLoader();
      await deleteData('Accounts', 'WHERE uid = ? AND id=?', [
        userData.uid,
        sheet.id,
      ]);
      firebaseRemoveFolder(`users/${userData.uid}/${sheet.id}`);
      hideLoader();
      callback();
    } catch (err) {
      hideLoader();
      showNotification('error', err.message || err.toString());
    }
  };

  const onArchiveSheet = async (sheet, callback = () => null) => {
    try {
      let data = {
        archived: sheet.archived ? 0 : 1,
        pinned: 0,
      };
      await updateData('Accounts', data, 'WHERE uid=? AND id=?', [
        userData.uid,
        sheet.id,
      ]);
      callback();
    } catch (err) {
      showNotification('error', err.message || err.toString());
    }
  };

  const onPinSheet = async (sheet, callback = () => null) => {
    try {
      let data = {
        pinned: sheet.pinned ? 0 : 1,
        archived: 0,
      };
      let result = await updateData('Accounts', data, 'WHERE uid=? AND id=?', [
        userData.uid,
        sheet.id,
      ]);
      callback();
    } catch (err) {
      showNotification('error', err.message || err.toString());
    }
  };

  const onGetDataForExcelSheetExport = async config => {
    return new Promise(async (resolve, reject) => {
      const {id, from, to, categoryType, selectedCategories} = config;
      let {uid} = userData;
      let searchCond = `
        WHERE a.uid = '${uid}' AND t.upcoming = 0 AND t.accountId = ${id}
      `;

      // Apply date filter if present
      if (from && to) {
        searchCond += ` AND DATE(t.date) BETWEEN '${from}' AND '${to}'`;
      }

      // Apply category type filter if present
      if (categoryType) {
        searchCond += ` AND c.type = '${categoryType}'`;
      }

      // Apply selected categories filter if present
      if (selectedCategories && selectedCategories.length > 0) {
        const categoryIds = selectedCategories.join(', ');
        searchCond += ` AND t.categoryId IN (${categoryIds})`;
      }

      try {
        // Constructing the SQL query
        let query = `
          SELECT 
            a.id AS accountId, 
            a.name AS accountName, 
            a.currency AS accountCurrency,
            t.id AS transactionId, 
            t.amount AS transactionAmount, 
            t.date AS transactionDate, 
            t.notes AS transactionNotes, 
            t.type AS transactionType,
            c.id AS categoryId, 
            c.name AS categoryName, 
            c.color AS categoryColor, 
            c.icon AS categoryIcon,
            SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS totalIncome,
            SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS totalExpense
          FROM Transactions t
          LEFT JOIN Accounts a ON t.accountId = a.id
          LEFT JOIN Categories c ON t.categoryId = c.id
          ${searchCond}
          GROUP BY t.accountId, t.id
          ORDER BY t.date ASC
        `;

        // Fetch data using getData
        let result = await getData(query);
        let data = await getDataFromRows(result.rows);

        // Process the rows using the reusable function
        const finalResult = transformSheetExcelExportData(data);

        // Resolve with the first result
        resolve(finalResult[0]);
      } catch (e) {
        reject(e);
      }
    });
  };

  const onExportSheetDataToExcel = async (config, callback = () => null) => {
    try {
      let result = await onGetDataForExcelSheetExport(config);
      if (!result) {
        throw 'There are no transactions to export';
      }
      const {transactions, account, totalExpense, totalIncome} = result;
      const {name} = account;
      account.totalIncome = totalIncome;
      account.totalExpense = totalExpense;
      account.totalBalance = totalIncome - totalExpense;
      if (!transactions || !account || transactions.length === 0) {
        throw 'There are no transactions to export';
      }
      showLoader('excel');
      let rows = getExcelSheetAccountRows(account, transactions);
      let wb = XLSX.utils.book_new();
      let ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = excelSheetAccountColWidth;
      XLSX.utils.sheet_add_aoa(ws, getExcelSheetAccountSummary(account), {
        origin: -1,
      });
      XLSX.utils.book_append_sheet(wb, ws, name.toUpperCase());
      let opt = {
        type: 'binary',
        bookType: 'xlsx',
      };
      const wbout = XLSX.write(wb, opt);
      const dirs = RNFetchBlob.fs.dirs;
      let path;
      if (Platform.OS === 'ios') {
        path = `${dirs.DocumentDir}/transactions-${Date.now()}.xlsx`;
      } else {
        path = `${dirs.DownloadDir}/transactions-${Date.now()}.xlsx`;
      }
      RNFS.writeFile(path, wbout, 'ascii').then(() => {
        hideLoader();
        callback();
        if (Platform.OS === 'ios') {
          console.log('successfully exported file ios');
          const shareOptions = {
            url: path,
          };
          if (config && config.sharing) {
            shareOptions.title = 'Transactions Excel File';
            shareOptions.subject = 'Transaction File - Excel';
          } else {
            shareOptions.filename = `transaction-${Date.now()}.xlsx`;
            shareOptions.saveToFiles = true;
            shareOptions.type =
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          }
          // Specific iOS sharing functionality
          Share.open(shareOptions).catch(err => {
            throw err.message || 'error while exporting the data - ios';
          });
        } else {
          let finalPath = 'file://' + path;
          if (config && config.sharing) {
            Share.open({
              url: finalPath,
              subject: 'Transaction file - Excel',
              title: 'Transactions Excel File',
            }).catch(err => {
              throw err || 'Error while sharing the data - android';
            });
          } else {
            showNotification(
              'success',
              'Your file is exported successfully. Please check the downloads folder for the file.',
            );
          }
        }
      });
    } catch (e) {
      showNotification('error', e.toString());
      hideLoader();
      console.error(e);
    }
  };

  const onExportSheetDataToPdf = async (config, callback = () => null) => {
    try {
      showLoader('pdf');
      let result = await onGetDataForExcelSheetExport(config);
      if (!result) {
        throw 'There are no transactions to export';
      }
      const {transactions, account, totalExpense, totalIncome} = result;
      account.totalIncome = totalIncome;
      account.totalExpense = totalExpense;
      account.totalBalance = totalIncome - totalExpense;
      if (!transactions || !account || transactions.length === 0) {
        throw 'There are no transactions to export';
      }
      let html = getPdfAccountTableHtml(theme, account, transactions);

      let options = {
        html: html,
        fileName: 'transactions',
        directory: 'Documents', //for ios only Documents is allowed
      };

      let file = await RNHTMLtoPDF.convert(options);

      let finalPath = 'file://' + file.filePath;
      let destinationPath = `${
        RNFetchBlob.fs.dirs.DownloadDir
      }/transactions-${Date.now()}.pdf`;

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
          }).catch(e => {});
        } else {
          await RNFetchBlob.fs.mv(file.filePath, destinationPath);
          showNotification(
            'success',
            'Your file is exported successfully. Please check the downloads folder for the file.',
          );
        }
      }
      hideLoader();
      callback();
    } catch (e) {
      hideLoader();
      console.error(e);
      showNotification('error', e.toString());
    }
  };

  return (
    <SheetsContext.Provider
      value={{
        currentSheet,
        setCurrentSheet,
        getSheets,
        getAllSheets,
        onSaveSheet,
        onDeleteSheet,
        onEditSheet,
        onArchiveSheet,
        onPinSheet,
        onExportSheetDataToExcel,
        calculateBalance,
        onExportSheetDataToPdf,
        getMessages,
        onGetAndSetCurrentSheet,
      }}>
      {children}
    </SheetsContext.Provider>
  );
};
