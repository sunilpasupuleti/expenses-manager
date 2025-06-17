import React from 'react';
import {createContext, useContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import {Alert, NativeModules, Platform} from 'react-native';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';
import useHttp from '../../hooks/use-http';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import XLSX from 'xlsx';
import moment from 'moment';
import {zip} from 'react-native-zip-archive';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import remoteConfig from '@react-native-firebase/remote-config';
import {useTheme} from 'styled-components/native';
import {getTimeZone} from 'react-native-localize';
import _ from 'lodash';
import {SheetsContext} from '../sheets/sheets.context';
import {
  excelSheetAccountColWidth,
  getExcelSheetAccountRows,
  getExcelSheetAccountSummary,
  getLinkedDbRecord,
  getPdfAccountTableHtml,
} from '../../components/utility/helper';
import database from '@react-native-firebase/database';
import {WatermelonDBContext} from '../watermelondb/watermelondb.context';
import {Q} from '@nozbe/watermelondb';

const {AlarmManagerModule} = NativeModules;

export const SettingsContext = createContext({
  onExportData: () => null,
  onExportAllDataToPdf: () => null,
  onImportData: () => null,
  onExportAllSheetsToExcel: config => null,
  onUpdateDailyReminder: (dailyReminder, callback) => null,
  onUpdateDailyBackup: (enabled, callback) => null,
  onUpdateAutoFetchTransactions: (enabled, callback) => null,
  onUpdateBaseCurrency: (currency, callback) => null,
  baseCurrency: {},
  setBaseCurrency: null,
});

export const SettingsContextProvider = ({children}) => {
  const {userData} = useContext(AuthenticationContext);
  const {getMessages} = useContext(SheetsContext);
  const {db, deleteAllRecords} = useContext(WatermelonDBContext);
  const {sendRequest} = useHttp();

  const dispatch = useDispatch();
  const theme = useTheme();

  const [baseCurrency, setBaseCurrency] = useState({
    dialog: false,
    currency: null,
  });

  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();

  useEffect(() => {
    if (db && userData) {
      if (!userData.baseCurrency) {
        setBaseCurrency({
          dialog: true,
          currency: null,
        });
      }
    }
  }, [db, userData]);

  // helpers
  const showLoader = (loaderType, backdrop = true) => {
    let options = {};
    if (loaderType) {
      options.loaderType = loaderType;
    }
    if (backdrop) {
      options.backdrop = backdrop;
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

  const onUpdateUserData = async data => {
    try {
      await db.write(async () => {
        await userData.update(record => {
          Object.keys(data).forEach(key => {
            if (key in record && typeof record[key] !== 'function') {
              record[key] = data[key];
            }
          });
        });
      });
    } catch (error) {
      showNotification('error', error.toString());
    }
  };

  const onUpdateDailyReminder = async (
    dailyReminder,
    callback = () => null,
  ) => {
    try {
      showLoader();
      let currentUser = await auth().currentUser;
      let jwtToken = await currentUser.getIdToken();
      await messaging().registerDeviceForRemoteMessages();

      let fcmToken = await messaging().getToken();
      let timeZone = await getTimeZone();
      let transformedData = {
        dailyReminderEnabled: dailyReminder.enable ? true : false,
        dailyReminderTime: dailyReminder.time,
        timeZone: timeZone,
        fcmToken: fcmToken,
      };
      let time = dailyReminder.time;
      const formattedTime = `${moment(time).format('HH')}:${moment(time).format(
        'mm',
      )}`;
      transformedData.dailyReminderTime = formattedTime;

      sendRequest(
        {
          type: 'POST',
          url: BACKEND_URL + '/notification/update-daily-reminder/',
          data: transformedData,
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async res => {
            callback();
            await onUpdateUserData(transformedData);
            hideLoader();
            showNotification('success', res.message);
          },
          errorCallback: err => {
            hideLoader();
            showNotification('error', err);
          },
        },
      );
    } catch (err) {
      console.log(err);

      hideLoader();
      showNotification('error', err.toString());
    }
  };

  const onUpdateDailyBackup = async (
    dailyBackupEnabled,
    callback = () => null,
  ) => {
    try {
      showLoader();
      let currentUser = await auth().currentUser;
      let jwtToken = await currentUser.getIdToken();
      let fcmToken = await messaging().getToken();
      let timeZone = await getTimeZone();
      let transformedData = {
        dailyBackupEnabled: !!dailyBackupEnabled,
        timeZone: timeZone,
        fcmToken: fcmToken,
      };
      sendRequest(
        {
          type: 'POST',
          url: BACKEND_URL + '/notification/update-daily-backup/',
          data: transformedData,
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async res => {
            callback();
            await onUpdateUserData(transformedData);
            hideLoader();
            showNotification('success', res.message);
          },
          errorCallback: err => {
            hideLoader();
            showNotification('error', err);
          },
        },
      );
    } catch (err) {
      hideLoader();
      showNotification('error', err);
    }
  };

  const onUpdateAutoFetchTransactions = async (
    enabled,
    callback = () => null,
  ) => {
    try {
      showLoader();

      let uid = await auth().currentUser.uid;
      let transformedData = {
        autoFetchTransactions: enabled ? true : false,
      };

      await onUpdateUserData(transformedData);

      await database().ref(`/users/${uid}`).update(transformedData);
      if (enabled && Platform.OS === 'android') {
        setTimeout(() => {
          getMessages();
        }, 1000 * 5);
      }
      showNotification(
        'success',
        'Auto Fetch Transactions updated successfully',
      );
      hideLoader();
      callback();
    } catch (err) {
      hideLoader();
      showNotification('error', err);
    }
  };

  const onUpdateBaseCurrency = async (
    currency,
    callback = () => null,
    errorCallback = () => null,
  ) => {
    try {
      let uid = await auth().currentUser.uid;
      let transformedData = {
        baseCurrency: currency,
      };
      await database().ref(`/users/${uid}`).update(transformedData);
      await onUpdateUserData(transformedData);
      callback();
      showNotification('success', 'Base Currency updated successfully');
    } catch (err) {
      errorCallback(err);
      showNotification('error', err);
    }
  };

  const onExportData = async () => {
    try {
      showLoader();
      const accountsCollection = await db.get('accounts');
      const accounts = await accountsCollection
        .query(Q.where('userId', userData.id))
        .fetch();

      const categoriesCollection = await db.get('categories');
      const categories = await categoriesCollection
        .query(Q.where('userId', userData.id))
        .fetch();

      if (accounts.length === 0) {
        throw 'No data to export';
      }

      const accountsWithTransactions = await Promise.all(
        accounts.map(async account => {
          const transactions = await getLinkedDbRecord(account, 'transactions');
          const sanitizedAccount = {...account._raw};
          delete sanitizedAccount.userId;
          delete sanitizedAccount._status;
          delete sanitizedAccount._changed;
          const sanitizedTransactions = transactions.map(({_raw}) => {
            const {accountId, ...rest} = _raw;
            delete rest._status;
            delete rest._changed;
            return rest;
          });
          return {
            ...sanitizedAccount,
            transactions: sanitizedTransactions,
          };
        }),
      );

      const sanitizedCategories = categories.map(({_raw}) => {
        const {userId, ...rest} = _raw;
        delete rest._status;
        delete rest._changed;
        return rest;
      });

      const data = {
        accounts: accountsWithTransactions,
        categories: sanitizedCategories,
      };

      const toSaveData = JSON.stringify(data);
      const dirs = RNFetchBlob.fs.dirs;
      let path;
      if (Platform.OS === 'ios') {
        path = `${dirs.DocumentDir}/transactions-${Date.now()}.json`;
      } else {
        path = `${dirs.DownloadDir}/transactions-${Date.now()}.json`;
      }

      RNFetchBlob.fs
        .writeFile(path, toSaveData)
        .then(() => {
          hideLoader();
          // Platform-specific actions post file write
          if (Platform.OS === 'ios') {
            Share.open({
              url: path,
              filename: `transactions-${Date.now()}.json`,
              saveToFiles: true,
              type: 'application/json',
            }).catch(err => {
              throw (
                err.error?.message || 'error while exporting the data - ios'
              );
            });
          } else {
            showNotification(
              'success',
              'Your file is exported successfully. Please check the downloads folder for the file.',
            );
          }
        })
        .catch(err => {
          throw err.message || err;
        });
    } catch (e) {
      hideLoader();
      console.error(e);
      showNotification(
        'error',
        'Something error occured while exporting the pdf ' + e.toString(),
      );
    }
  };

  const onImportData = async () => {
    const onImport = async () => {
      return new Promise(async (resolve, reject) => {
        try {
          showLoader();
          let res = await DocumentPicker.pickSingle({
            type: [DocumentPicker.types.allFiles],
            copyTo: 'documentDirectory',
          }).catch(() => {});
          const {type: fileType, uri, fileCopyUri} = res;
          if (fileType !== 'application/json') {
            throw 'Only JSON files are allowed';
          }
          let fileuri = uri;
          if (Platform.OS === 'ios') {
            fileuri = fileuri.replace('file:', '');
          }
          if (Platform.OS === 'android') {
            fileuri = fileCopyUri;
          }
          let file = await RNFetchBlob.fs.readFile(fileuri);
          let data = JSON.parse(file);
          let {accounts, categories} = data;

          if (!accounts?.length || !categories?.length) {
            throw 'Empty or corrupted file';
          }

          if (accounts?.length > 0 && categories?.length > 0) {
            await deleteAllRecords(false);
            const enrichedCategories = categories.map(c => {
              return {
                ...c,
                userId: userData.id,
              };
            });

            const categoryIdMap = {};
            // Insert accounts and linked transactions and categories
            await db.write(async () => {
              for (let c of enrichedCategories) {
                const newRecord = await db.get('categories').create(cat => {
                  Object.keys(c).forEach(key => {
                    if (key !== 'id') cat[key] = c[key];
                  });
                  cat.userId = userData.id;
                });
                categoryIdMap[c.id] = newRecord.id;
              }
              for (const a of accounts) {
                const {transactions = [], ...accountData} = a;

                const createdAccount = await db.get('accounts').create(acc => {
                  Object.keys(accountData).forEach(key => {
                    if (key !== 'id') acc[key] = accountData[key];
                  });
                  acc.userId = userData.id;
                });

                // Insert linked transactions
                for (const t of transactions) {
                  await db.get('transactions').create(txn => {
                    Object.keys(t).forEach(key => {
                      if (key !== 'id') txn[key] = t[key];
                    });
                    txn.accountId = createdAccount.id;
                    if (t.categoryId && categoryIdMap[t.categoryId]) {
                      txn.categoryId = categoryIdMap[t.categoryId];
                    }
                  });
                }
              }
            });
            showNotification('success', 'Data Imported Successfully');
            hideLoader();
            resolve(true);
          } else {
            throw 'Empty file or corrupted data file.';
          }
        } catch (e) {
          hideLoader();
          reject(e);
          showNotification('error', e.message || e.toString());
        }
      });
    };
    Alert.alert(
      'Import Data Confirmation',
      'Are you sure you want to import data from the selected JSON file? This action will replace all existing data in the app.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Import',
          onPress: async () => {
            await onImport();
          },
          style: 'default',
        },
      ],
      {cancelable: false},
    );
  };

  const onExportAllDataToPdf = async () => {
    try {
      const accountsCollection = await db.get('accounts');
      const accounts = await accountsCollection
        .query(
          Q.where('userId', userData.id),
          Q.where('isLoanAccount', false),
          Q.sortBy('updated_at', Q.desc),
        )
        .fetch();

      if (accounts.length === 0) {
        throw 'There are no transactions to export';
      }
      showLoader('pdf');
      let folderName = `transaction-pdfs-${Date.now()}`;
      const fPath =
        Platform.OS === 'ios'
          ? RNFetchBlob.fs.dirs.DocumentDir + '/' + folderName
          : RNFetchBlob.fs.dirs.DownloadDir + '/' + folderName;
      await RNFetchBlob.fs.mkdir(fPath);

      for (const account of accounts) {
        let transactions =
          (await getLinkedDbRecord(account, 'transactions')) || [];
        if (!transactions.length) continue;

        transactions = await Promise.all(
          transactions
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(async t => {
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

        let {name} = account;
        let html = getPdfAccountTableHtml(theme, account, transactions);
        let options = {
          html: html,
          fileName: name,
          directory: 'Documents', //for ios only Documents is allowed
        };
        let file = await RNHTMLtoPDF.convert(options);
        const toPath = `${
          RNFetchBlob.fs.dirs[
            Platform.OS === 'ios' ? 'DocumentDir' : 'DownloadDir'
          ]
        }/${folderName}/${name}-${Date.now()}.pdf`;

        await RNFetchBlob.fs.mv(file.filePath, toPath);
      }

      const baseDir =
        RNFetchBlob.fs.dirs[
          Platform.OS === 'ios' ? 'DocumentDir' : 'DownloadDir'
        ];
      const targetPath = `${baseDir}/${folderName}.zip`;
      const sourcePath = `${baseDir}/${folderName}`;

      let path = await zip(sourcePath, targetPath);
      RNFetchBlob.fs.unlink(sourcePath);
      hideLoader();

      if (Platform.OS === 'ios') {
        Share.open({
          url: path,
          saveToFiles: true,
          title: 'Transactions Pdf File',
          subject: 'Transaction file - Pdf',
        }).catch(err => {
          throw (
            err.error?.message || 'error while exporting the all pdfs - ios'
          );
        });
        return;
      }
      showNotification(
        'success',
        'Your file is exported successfully. Please check the downloads folder for the file.',
      );
    } catch (e) {
      hideLoader();
      console.error(e);
      showNotification('error', e.toString());
    }
  };

  const onExportAllSheetsToExcel = async config => {
    try {
      showLoader('excel');

      const accountsCollection = await db.get('accounts');
      const accounts = await accountsCollection
        .query(
          Q.where('userId', userData.id),
          Q.where('isLoanAccount', false),
          Q.sortBy('updated_at', Q.desc),
        )
        .fetch();

      if (accounts.length === 0) {
        throw 'There are no transactions to export';
      }
      let wb = XLSX.utils.book_new();

      for (const account of accounts) {
        let transactions = await getLinkedDbRecord(account, 'transactions');
        if (!transactions.length) continue;
        transactions = await Promise.all(
          transactions
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(async t => {
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

        const {name} = account;
        const rows = getExcelSheetAccountRows(account, transactions); // custom formatter
        const ws = XLSX.utils.json_to_sheet(rows);

        ws['!cols'] = excelSheetAccountColWidth;

        XLSX.utils.sheet_add_aoa(ws, getExcelSheetAccountSummary(account), {
          origin: -1,
        });

        XLSX.utils.book_append_sheet(wb, ws, name.toUpperCase());
      }

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
        if (Platform.OS === 'ios') {
          console.log('successfully exported file ios');
          // Specific iOS sharing functionality
          Share.open({
            url: path,
            filename: 'transactions.xlsx',
            saveToFiles: true,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }).catch(err => {
            throw err.message || 'error while exporting the data - ios';
          });
        } else {
          showNotification(
            'success',
            'Your file is exported successfully. Please check the downloads folder for the file.',
          );
        }
      });
    } catch (e) {
      hideLoader();
      console.error(e);
      showNotification('error', e.toString());
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        onExportAllSheetsToExcel,
        onExportData,
        onImportData,
        onExportAllDataToPdf,
        onUpdateDailyReminder,
        onUpdateDailyBackup,
        onUpdateAutoFetchTransactions,
        baseCurrency,
        setBaseCurrency,
        onUpdateBaseCurrency,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};
