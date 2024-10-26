import React from 'react';
import {createContext, useContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import {Alert, Platform} from 'react-native';
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
  accountSelectClause,
  categorySelectClause,
  excelSheetAccountColWidth,
  getDataFromRows,
  getExcelSheetAccountRows,
  getExcelSheetAccountSummary,
  getPdfAccountTableHtml,
  transactionSelectClause,
} from '../../components/utility/helper';
import database from '@react-native-firebase/database';
import {SQLiteContext} from '../sqlite/sqlite.context';
import {SheetDetailsContext} from '../sheetDetails/sheetDetails.context';

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
  const {
    userData,
    userAdditionalDetails,
    onGetUserDetails,
    onSetUserAdditionalDetails,
  } = useContext(AuthenticationContext);
  const {getMessages} = useContext(SheetsContext);
  const {
    updateData,
    db,
    onBackUpDatabase,
    onRestoreDatabase,
    deleteAllTablesData,
    getData,
    createOrReplaceData,
  } = useContext(SQLiteContext);
  const {sendRequest} = useHttp();
  const {onGetSheetsAndTransactions} = useContext(SheetDetailsContext);

  const dispatch = useDispatch();
  const theme = useTheme();

  const [baseCurrency, setBaseCurrency] = useState({
    dialog: false,
    currency: null,
  });

  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();

  useEffect(() => {
    if (db && userAdditionalDetails) {
      if (!userAdditionalDetails.baseCurrency) {
        setBaseCurrency({
          dialog: true,
          currency: null,
        });
      }
    }
  }, [db, userAdditionalDetails]);

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

  const onUpdateDailyReminder = async (
    dailyReminder,
    callback = () => null,
  ) => {
    try {
      showLoader();
      let currentUser = await auth().currentUser;
      let jwtToken = await currentUser.getIdToken();
      let fcmToken = null;
      await messaging()
        .getToken()
        .then(t => {
          fcmToken = t;
        })
        .catch(err => {});
      let timeZone = await getTimeZone();
      let transformedData = {
        dailyReminderEnabled: dailyReminder.enable ? 1 : 0,
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
          successCallback: res => {
            callback();
            onSetUserAdditionalDetails(p => ({
              ...p,
              dailyReminderEnabled: transformedData.dailyReminderEnabled,
              dailyReminderTime: transformedData.dailyReminderTime,
            }));
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

  const onUpdateDailyBackup = async (
    dailyBackupEnabled,
    callback = () => null,
  ) => {
    try {
      showLoader();
      let currentUser = await auth().currentUser;
      let jwtToken = await currentUser.getIdToken();
      let fcmToken = null;
      await messaging()
        .getToken()
        .then(t => {
          fcmToken = t;
        })
        .catch(err => {});
      let timeZone = await getTimeZone();
      let transformedData = {
        dailyBackupEnabled: dailyBackupEnabled ? 1 : 0,
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
          successCallback: res => {
            callback();
            onSetUserAdditionalDetails(p => ({
              ...p,
              dailyBackupEnabled: dailyBackupEnabled,
            }));
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
        autoFetchTransactions: enabled ? 1 : 0,
      };
      let results = await updateData('Users', transformedData, `WHERE uid=?`, [
        uid,
      ]);
      console.log(results);

      await database().ref(`/users/${uid}`).update(transformedData);
      if (enabled && Platform.OS === 'android') {
        setTimeout(() => {
          getMessages();
        }, 1000 * 5);
      }

      onGetUserDetails();
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
      let results = await updateData('Users', transformedData, `WHERE uid=?`, [
        uid,
      ]);
      await database().ref(`/users/${uid}`).update(transformedData);
      onGetUserDetails();
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
      let accountsQuery = `SELECT * FROM Accounts WHERE uid='${userData.uid}'`;
      let categoriesQuery = `SELECT * FROM Categories WHERE uid='${userData.uid}'`;
      let transactionsQuery = `SELECT * FROM Transactions`;
      const [accountsResult, categoriesResult, transactionsResult] =
        await Promise.all([
          getData(accountsQuery),
          getData(categoriesQuery),
          getData(transactionsQuery),
        ]);

      let [accounts, categories, transactions] = await Promise.all([
        getDataFromRows(accountsResult.rows),
        getDataFromRows(categoriesResult.rows),
        getDataFromRows(transactionsResult.rows),
      ]);
      if (accounts.length === 0) {
        throw 'No data to export';
      }

      accounts = accounts.map(a => {
        delete a.uid;
        return {...a};
      });
      categories = categories.map(c => {
        delete c.uid;
        return {...c};
      });

      let data = {
        accounts: accounts,
        categories: categories,
        transactions: transactions,
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
          let {accounts, categories, transactions} = data;
          const uid = userData.uid;

          if (accounts?.length > 0 && categories?.length > 0) {
            await onBackUpDatabase();
            await deleteAllTablesData();
            for (let category of categories) {
              category.uid = uid;
              await createOrReplaceData('Categories', category);
            }
            for (let account of accounts) {
              account.uid = uid;
              await createOrReplaceData('Accounts', account);
            }
            for (let transaction of transactions) {
              await createOrReplaceData('Transactions', transaction);
            }
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
          await onRestoreDatabase();
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
      let accounts = await onGetSheetsAndTransactions();
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

      for await (const data of accounts) {
        const {account, transactions} = data;
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
      let accounts = await onGetSheetsAndTransactions();
      if (accounts.length === 0) {
        throw 'There are no transactions to export';
      }
      showLoader('excel');
      let wb = XLSX.utils.book_new();

      accounts.forEach((data, index) => {
        const {account, transactions} = data;
        let {name} = account;
        let rows = getExcelSheetAccountRows(account, transactions);
        let ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = excelSheetAccountColWidth;
        XLSX.utils.sheet_add_aoa(ws, getExcelSheetAccountSummary(account), {
          origin: -1,
        });

        XLSX.utils.book_append_sheet(wb, ws, name.toUpperCase());
      });
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
