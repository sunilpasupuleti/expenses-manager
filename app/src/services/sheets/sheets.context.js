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
  excelSheetAccountColWidth,
  firebaseRemoveFolder,
  getExcelSheetAccountRows,
  getExcelSheetAccountSummary,
  getPdfAccountTableHtml,
  getEmiDates,
  sendLocalNotification,
  getLinkedDbRecord,
  calculateInterestFromAmortizationSchedule,
  hashCode,
} from '../../components/utility/helper';

import {CategoriesContext} from '../categories/categories.context';
import PushNotification from 'react-native-push-notification';
import {GetCurrencySymbol} from '../../components/symbol.currency';
import {WatermelonDBContext} from '../watermelondb/watermelondb.context';
import {Q} from '@nozbe/watermelondb';

export const SheetsContext = createContext({
  getAllSheets: (searchKeyword, excludedId) => {},
  onSaveSheet: (sheet, callback = () => null) => null,
  onUpdateSheet: sheet => null,
  onEditSheet: (sheetModel, sheet, callback = () => {}) => null,
  onDeleteSheet: (sheetModel, sheet, callback) => null,
  onExportSheetDataToExcel: (config, data, callback) => null,
  onExportSheetDataToPdf: (config, sheet, callback) => null,
  onArchiveSheet: (sheetModel, sheet, callback) => null,
  onPinSheet: (sheetModel, sheet, callback) => null,
  calculateBalance: sheet => null,
  getMessages: () => null,
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
  let processedEmis = 0;

  upcomingEmis.forEach((date, index) => {
    if (processedEmis > 2) {
      return;
    }
    const emiDate = moment(date, 'YYYY-MM-DD');
    const today = moment().startOf('day');
    const daysUntilEmi = emiDate.diff(today, 'days');

    if (daysUntilEmi >= 0 && daysUntilEmi <= 6) {
      const currencySymbol = GetCurrencySymbol(account.currency || 'INR');
      const emiAmount = account.emi || 0;

      // Schedule reminder 2 days before (if applicable)
      if (daysUntilEmi >= 2) {
        const reminderDate = moment(date, 'YYYY-MM-DD')
          .subtract(2, 'days')
          .hour(9)
          .minute(0)
          .second(0)
          .toDate();

        const reminderNotificationId = `emi_reminder_${account.id}_${index}`;

        sendLocalNotification(
          {
            title: '💰 EMI Reminder',
            message: `Reminder: Your EMI of ${currencySymbol}${emiAmount} for "${
              account.name
            }" is due in 2 days (${moment(date).format('MMM DD')}).`,
            notificationId: hashCode(reminderNotificationId),
          },
          {
            accountId: account.id,
            type: 'emi_reminder',
            originalId: reminderNotificationId,
          },
          reminderDate,
        );
      }

      // Schedule notification on the actual EMI date (if within 3 days)
      if (daysUntilEmi >= 0 && daysUntilEmi <= 3) {
        const scheduleDate = moment(date, 'YYYY-MM-DD')
          .hour(9)
          .minute(0)
          .second(0)
          .toDate();

        const notificationId = `emi_due_${account.id}_${index}`;

        sendLocalNotification(
          {
            title: '💰 EMI Due Today',
            message: `Your EMI of ${currencySymbol}${emiAmount} for "${
              account.name
            }" is due ${
              daysUntilEmi === 0
                ? 'today'
                : `in ${daysUntilEmi} day${daysUntilEmi > 1 ? 's' : ''}`
            }. Don't forget to make the payment on time.`,
            notificationId: hashCode(notificationId),
          },
          {
            accountId: account.id,
            type: 'emi_due',
            originalId: notificationId,
          },
          scheduleDate,
        );
      }

      processedEmis++; // Move this inside the if condition
    }
  });
};

const cancelLoanEmiNotifications = accountId => {
  return new Promise(resolve => {
    PushNotification.getScheduledLocalNotifications(notifications => {
      notifications.forEach(notification => {
        const id = notification?.id?.toString();
        const originalId =
          notification?.data?.originalId || notification?.userInfo?.originalId;

        const userInfoAccountId = notification?.data?.accountId;
        if (
          originalId?.startsWith(`${accountId}`) ||
          userInfoAccountId === accountId
        ) {
          PushNotification.cancelLocalNotification(id);
        }
      });
      resolve();
    });
  });
};

export const SheetsContextProvider = ({children}) => {
  const {userData} = useContext(AuthenticationContext);
  const {getCategories} = useContext(CategoriesContext);
  const [autoFetchTransactionsOpened, setAutoFetchTransactionsOpened] =
    useState(false);
  const {createRecord, getChildRecords, db, findRecordById} =
    useContext(WatermelonDBContext);

  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    let smsSubscription;
    if (userData) {
      if (
        Platform.OS === 'android' &&
        userData.autoFetchTransactions &&
        userData.baseCurrency &&
        !autoFetchTransactionsOpened
      ) {
        setTimeout(() => {
          setAutoFetchTransactionsOpened(true);
          getMessages();
        }, 1000 * 10);
      }

      if (
        Platform.OS === 'android' &&
        userData.autoFetchTransactions &&
        userData.baseCurrency
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
  }, [userData]);

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

  const onUpdateSheet = async sheet => {
    return new Promise(async (resolve, reject) => {
      try {
        if (sheet.isLoanAccount) {
          const refetchedSheet = await findRecordById(
            'accounts',
            'id',
            sheet.id,
          );

          let transactions = await getLinkedDbRecord(
            refetchedSheet,
            'transactions',
          );
          transactions = transactions.filter(t => !t.upcoming);
          const result = calculateInterestFromAmortizationSchedule({
            loanAmount: sheet.loanAmount,
            interestRate: sheet.interestRate,
            totalPayments: sheet.totalPayments,
            repaymentFrequency: sheet.repaymentFrequency,
            startDate: sheet.loanStartDate,
            transactions: transactions,
            totalRepayable: sheet.totalRepayable,
            useReducingBalance: sheet.useReducingBalance,
          });

          const {
            totalInterestPaid,
            totalInterest,
            remainingBalance,
            totalPaid,
            totalPrincipal,
          } = result;
          delete result.schedule;

          await db.write(async () => {
            await sheet.update(record => {
              record.totalPaid = totalPaid;
              record.totalInterest = totalInterest;
              record.totalBalance = remainingBalance;
              record.totalInterestPaid = totalInterestPaid;
              record.totalRepayable = sheet.useReducingBalance
                ? totalPrincipal + totalInterest
                : sheet.totalRepayable;
              record._raw.updated_at = Date.now();
            });
          });

          resolve(true);
          return;
        }
        // Fetch transactions before starting db.write
        const allTransactions = await getLinkedDbRecord(sheet, 'transactions');

        const transactions = allTransactions.filter(t => !t.upcoming);
        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach(t => {
          if (t.type === 'income') totalIncome += t.amount;
          else if (t.type === 'expense') totalExpense += t.amount;
        });

        await db.write(async () => {
          await sheet.update(record => {
            record.totalIncome = totalIncome;
            record.totalExpense = totalExpense;
            record.totalBalance = totalIncome - totalExpense;
            record._raw.updated_at = Date.now();
          });
        });

        resolve(true);
      } catch (e) {
        console.error('Error in updating accounts table:', e);
        reject(e);
      }
    });
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
      await onUpdateSheet(sheetModel);
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

  const onGetDataForSheetExport = async config => {
    return new Promise(async (resolve, reject) => {
      const {id, from, to, categoryType, selectedCategories} = config;
      try {
        const transactionsCollection = await db.get('transactions');
        let queryConditions = [
          Q.where('accountId', id),
          Q.where('upcoming', false),
        ];
        if (from && to) {
          queryConditions.push(
            Q.where('date', Q.gte(from)),
            Q.where('date', Q.lte(to)),
          );
        }

        if (categoryType) {
          queryConditions.push(
            Q.on('categories', Q.where('type', categoryType)),
          );
        }

        if (selectedCategories?.length > 0) {
          queryConditions.push(
            Q.where('categoryId', Q.oneOf(selectedCategories)),
          );
        }

        const transactionRecords = await transactionsCollection
          .query(
            Q.experimentalJoinTables(['categories', 'accounts']),
            ...queryConditions,
            Q.sortBy('date', Q.asc),
          )
          .fetch();

        // Convert WatermelonDB models to plain JS
        const transactions = await Promise.all(
          transactionRecords.map(async t => {
            const category = await getLinkedDbRecord(t, 'category');
            return {
              id: t.id,
              amount: t.amount,
              date: t.date,
              showTime: t.showTime,
              time: t.time,
              imageUrl: t.imageUrl,
              notes: t.notes,
              type: t.type,
              category: category,
            };
          }),
        );
        const accountFetch = await getLinkedDbRecord(
          transactionRecords[0],
          'account',
        );

        const account = {
          id: accountFetch?.id,
          name: accountFetch?.name,
          currency: accountFetch?.currency,
        };

        // Compute totals
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        account.totalIncome = totalIncome;
        account.totalExpense = totalExpense;
        account.totalBalance = totalIncome - totalExpense;

        const finalData = {
          transactions: transactions,
          account: account,
          totalExpense: totalExpense,
          totalIncome: totalIncome,
        };
        resolve(finalData);
      } catch (e) {
        reject(e);
      }
    });
  };

  const onExportSheetDataToExcel = async (config, callback = () => null) => {
    try {
      let result = await onGetDataForSheetExport(config);
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
      let result = await onGetDataForSheetExport(config);
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
        getAllSheets,
        onSaveSheet,
        onDeleteSheet,
        onEditSheet,
        onUpdateSheet,
        onArchiveSheet,
        onPinSheet,
        onExportSheetDataToExcel,
        calculateBalance,
        onExportSheetDataToPdf,
        getMessages,
      }}>
      {children}
    </SheetsContext.Provider>
  );
};
