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
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import _ from 'lodash';
import XLSX from 'xlsx';
import moment from 'moment';
import {useTheme} from 'styled-components/native';
import {smsTransactionsActions} from '../../store/smsTransactions-slice';
import {getTransactionInfo} from 'transaction-sms-parser';
import SmsAndroid from 'react-native-get-sms-android';
import {
  cancelLocalNotification,
  excelSheetAccountColWidth,
  firebaseRemoveFolder,
  getDataFromRows,
  getExcelSheetAccountRows,
  getExcelSheetAccountSummary,
  getPdfAccountTableHtml,
  getEmiDates,
  sendLocalNotification,
} from '../../components/utility/helper';
import {SQLiteContext} from '../sqlite/sqlite.context';
import {transformSheetExcelExportData} from '../../components/utility/dataProcessHelper';
import {CategoriesContext} from '../categories/categories.context';
import PushNotification from 'react-native-push-notification';
import {GetCurrencySymbol} from '../../components/symbol.currency';
import {WatermelonDBContext} from '../watermelondb/watermelondb.context';
import {Model, Q} from '@nozbe/watermelondb';

export const SheetsContext = createContext({
  getSheets: searchKeyword => {},
  onGetAndSetCurrentSheet: sheetId => {},
  getAllSheets: (searchKeyword, excludedId) => {},
  onSaveSheet: (sheet, callback = () => null) => null,
  onEditSheet: (sheetModel, sheet, callback = () => {}) => null,
  onDeleteSheet: (sheetModel, sheet, callback) => null,
  onExportSheetDataToExcel: (config, data, callback) => null,
  onExportSheetDataToPdf: (config, sheet, callback) => null,
  onArchiveSheet: (sheetModel, sheet, callback) => null,
  onPinSheet: (sheetModel, sheet, callback) => null,
  calculateBalance: sheet => null,
  getMessages: () => null,
  currentSheet: null,
  setCurrentSheet: null,
});

const {SmsListener} = NativeModules;
const smsListenerEmitter =
  Platform.OS === 'android' ? new NativeEventEmitter(SmsListener) : null;

const scheduleLoanEmiNotifications = account => {
  if (!account.isLoanAccount || !account.loanStartDate) return;

  const {upcomingEmis} = getEmiDates(
    account.loanStartDate,
    account.repaymentFrequency,
    account.loanYears,
    account.loanMonths,
    account.totalPayments,
  );
  let testCount = 0;

  upcomingEmis.forEach((date, index) => {
    if (testCount > 2) {
      return;
    }
    const scheduleDate = moment(date, 'YYYY-MM-DD')
      .hour(9)
      .minute(0)
      .second(0)
      .toDate();

    const currencySymbol = GetCurrencySymbol(account.currency || 'INR');
    const emiAmount = account.emi || 0;
    sendLocalNotification(
      {
        title: '💰 EMI Due Reminder',
        message: `Your EMI of ${currencySymbol}${emiAmount} for "${account.name}" is due today. Don't forget to make the payment on time.`,
        notificationId: `${account.id}${index}`,
      },
      {
        accountId: account.id,
      },
      scheduleDate,
    );
  });
  testCount++;
};

const cancelLoanEmiNotifications = accountId => {
  return new Promise(resolve => {
    PushNotification.getScheduledLocalNotifications(notifications => {
      notifications.forEach(notification => {
        const id = notification?.id?.toString();
        const userInfoAccountId = notification?.data?.accountId;
        if (id?.startsWith(`${accountId}`) || userInfoAccountId === accountId) {
          PushNotification.cancelLocalNotification(id);
        }
      });
      resolve();
    });
  });
};

export const SheetsContextProvider = ({children}) => {
  const [currentSheet, setCurrentSheet] = useState();
  const {userData, userAdditionalDetails} = useContext(AuthenticationContext);
  const {getCategories} = useContext(CategoriesContext);
  const [autoFetchTransactionsOpened, setAutoFetchTransactionsOpened] =
    useState(false);
  const {createOrReplaceData, updateData, getData, deleteData} =
    useContext(SQLiteContext);
  const {createRecord, getChildRecords, db, findRecordById} =
    useContext(WatermelonDBContext);

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
      let regularQuery = `${query} AND pinned=0 AND archived=0 AND isLoanAccount = 0 ${orderQuery}`;
      let pinnedQuery = `${query} AND pinned=1 AND isLoanAccount = 0 ${orderQuery}`;
      let archivedQuery = `${query} AND archived=1 AND isLoanAccount = 0 ${orderQuery}`;
      let loanQuery = `${query} AND isLoanAccount=1 ${orderQuery}`;
      let totalCountQuery = `SELECT COUNT(*) AS totalCount FROM Accounts WHERE uid='${uid}'`;
      let regularResults = await getData(regularQuery);
      let regularData = await getDataFromRows(regularResults.rows);
      let pinnedResults = await getData(pinnedQuery);
      let pinnedData = await getDataFromRows(pinnedResults.rows);
      let archivedResults = await getData(archivedQuery);
      let archivedData = await getDataFromRows(archivedResults.rows);
      let loanResults = await getData(loanQuery);
      let loanData = await getDataFromRows(loanResults.rows);
      let totalCountResult = await getData(totalCountQuery);
      let totalCountData = await getDataFromRows(totalCountResult.rows);

      const data = {
        regular: regularData,
        pinned: pinnedData,
        archived: archivedData,
        loan: loanData,
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
      const sheetsCollection = await db.get('accounts');

      const conditions = [Q.where('userId', userData.id)];

      if (searchKeyword?.trim()) {
        const keyword = searchKeyword.toLowerCase();
        conditions.push(
          Q.where('name', Q.like(`%${Q.sanitizeLikeString(keyword)}%`)),
        );
      }

      if (excludedId) {
        conditions.push(Q.where('id', Q.notEq(excludedId)));
      }

      const results = await sheetsCollection.query(...conditions).fetch();
      return results;
    } catch (e) {
      console.log('error retrieving accounts data - ', e);
      showNotification('error', e.toString());
      hideLoader();
    }
  };

  const onSaveSheet = async (sheet, callback = () => null) => {
    try {
      const existingAccounts = await getChildRecords(
        'users',
        'id',
        userData.id,
        'accounts',
        {
          filters: [Q.where('name', sheet.name)],
        },
      );

      if (existingAccounts.length > 0) {
        throw 'Account name already exists!';
      }
      const newRecord = await createRecord('accounts', sheet);

      scheduleLoanEmiNotifications(sheet);
      callback();
    } catch (err) {
      Keyboard.dismiss();
      showNotification('error', err.message || err.toString());
    }
  };

  const onEditSheet = async (sheetModel, sheet, callback = () => null) => {
    try {
      const allSheets = await getChildRecords(
        'users',
        'id',
        userData.id,
        'accounts',
        {
          filters: [
            Q.where('name', sheet.name),
            Q.where('id', Q.notEq(sheetModel.id)),
          ],
        },
      );

      if (allSheets.length > 0) {
        throw 'Account name already exists!';
      }

      await db.write(async () => {
        await sheetModel.update(record => {
          Object.keys(sheet).forEach(key => {
            record[key] = sheet[key];
          });
        });
      });

      callback();
      await cancelLoanEmiNotifications(sheet.id);
      scheduleLoanEmiNotifications(sheet);
    } catch (err) {
      showNotification('error', err.message || err.toString());
    }
  };

  const onDeleteSheet = async (sheetModel, sheet, callback = () => null) => {
    try {
      showLoader();
      await db.write(async () => {
        await sheetModel.markAsDeleted();
        await sheetModel.destroyPermanently();
      });
      firebaseRemoveFolder(`users/${userData.uid}/${sheet.id}`);
      hideLoader();
      callback();
      await cancelLoanEmiNotifications(sheet.id);
    } catch (err) {
      hideLoader();
      showNotification('error', err.message || err.toString());
    }
  };

  const onArchiveSheet = async (sheetModel, sheet, callback = () => null) => {
    try {
      await db.write(async () => {
        await sheetModel.update(rec => {
          rec.archived = !rec.archived;
        });
      });

      callback();
    } catch (err) {
      showNotification('error', err.message || err.toString());
    }
  };

  const onPinSheet = async (sheetModel, sheet, callback = () => null) => {
    try {
      await db.write(async () => {
        await sheetModel.update(record => {
          record.pinned = !record.pinned;
          record.archived = false;
        });
      });

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
