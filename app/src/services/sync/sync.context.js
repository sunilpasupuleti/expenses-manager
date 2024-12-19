/* eslint-disable handle-callback-err */
/* eslint-disable quotes */
/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {createContext, useContext, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import database from '@react-native-firebase/database';
import useHttp from '../../hooks/use-http';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  defaultICloudContainerPath,
  isICloudAvailable,
  readFile,
  readDir,
  writeFile,
  unlink,
  download,
} from 'react-native-cloud-store';
import moment from 'moment';
import {SheetDetailsContext} from '../sheetDetails/sheetDetails.context';
import {SQLiteContext} from '../sqlite/sqlite.context';
import {
  firebaseRemoveFile,
  firebaseRemoveFiles,
  firebaseUploadFile,
  formatDate,
  getCurrentDate,
  getDataFromRows,
} from '../../components/utility/helper';
import _ from 'lodash';
import {Alert, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';
import {DB_PATH} from '../../../config';
import {getTimeZone} from 'react-native-localize';
import momentTz from 'moment-timezone';
import {navigate} from '../../infrastructure/navigation/rootnavigation';
import {
  useNetInfo,
  fetch as netInfoFetch,
} from '@react-native-community/netinfo';

export const SyncContext = createContext({
  backUpData: () => null,
  restoreData: () => null,
  onGetRestoreDates: () => null,
  onBackupToiCloud: () => null,
  onRestoreFromiCloud: () => null,
  onGetRestoresFromiCloud: successCallBack => null,
  onDeleteBackupFromiCloud: () => null,
});

export const SyncContextProvider = ({children}) => {
  const {userData} = useContext(AuthenticationContext);
  const {onGetSheetsAndTransactions} = useContext(SheetDetailsContext);
  const {onSetUserAdditionalDetails} = useContext(AuthenticationContext);
  const {
    onBackUpDatabase,
    closeDatabase,
    initializeDB,
    getData,
    restoreDbFromBackup,
    db,
  } = useContext(SQLiteContext);
  const dispatch = useDispatch();
  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();
  const appState = useSelector(state => state.service.appState);
  const {isConnected} = useNetInfo();

  useEffect(() => {
    if (userData && db) {
      onInitialRestoreCheck();
    }
  }, [userData, db]);

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

  const backUpData = async () => {
    return new Promise(async (resolve, reject) => {
      let fileUrl, uploadPath;
      try {
        if (!isConnected) {
          throw 'Check your internet connection & try again';
        }
        showLoader('backup', true);
        let {uid} = userData;
        let accounts = await onGetSheetsAndTransactions();
        if (accounts.length === 0) {
          throw {
            message:
              'There are no accounts or transactions in accounts to backup',
            error: 'noData',
          };
        }
        fileUrl = await onBackUpDatabase();

        const currentDate = new Date().toISOString();
        uploadPath = `users/${uid}/backups/${currentDate}.db`;
        await firebaseUploadFile(uploadPath, fileUrl);
        let snapshot = await database()
          .ref(`/users/${uid}/backups`)
          .once('value');
        let backups = snapshot.val() || {};
        const backupsLength = Object.keys(backups).length;

        const allowedBackups = 9;
        if (backupsLength > allowedBackups) {
          const formattedBackups = _.map(backups, (backup, key) => ({
            datetime: formatDate(backup.date),
            id: key,
          }));
          // Sort the array by the 'datetime' key
          const sortedBackups = _.orderBy(formattedBackups, ['datetime']);
          const backupKeys = _.map(sortedBackups, 'id');
          // delete old ones
          const numBackupsToDelete = backupsLength - allowedBackups;
          const backupsToDelete = backupKeys.slice(0, numBackupsToDelete);
          const removeFilePaths = [];
          for (const key of backupsToDelete) {
            const backupRef = database().ref(`/users/${uid}/backups/${key}`);
            await backupRef.remove();
            const value = backups[key];
            removeFilePaths.push(value.path);
          }
          await firebaseRemoveFiles(removeFilePaths);
        }
        const lastSynced = getCurrentDate();
        await database().ref(`/users/${uid}`).update({
          lastSynced: lastSynced,
        });
        await database().ref(`/users/${uid}/backups`).push({
          path: uploadPath,
          date: currentDate,
        });
        showNotification(
          'success',
          'Backup complete! Your data is now safely stored',
        );
        onSetUserAdditionalDetails(p => ({
          ...p,
          lastSynced: lastSynced,
        }));
        hideLoader();
        resolve(true);
      } catch (e) {
        reject(e);
        hideLoader();
        showNotification('error', e.message || e.toString());
        console.log(e);
        // delete uploaded file if error occurs
        if (e.error !== 'noData') {
          await firebaseRemoveFile(uploadPath);
        }
      }
    });
  };

  const onInitialRestoreCheck = async () => {
    try {
      const {uid} = userData;
      let accounts = await getData(`SELECT * From Accounts WHERE uid='${uid}'`);
      let snapshot = await database()
        .ref(`/users/${uid}/backups`)
        .once('value');
      let backups = snapshot.val() || {};
      const backupsLength = Object.keys(backups).length;
      const accountsLength = accounts?.rows?.length || 0;
      if (accountsLength === 0 && backupsLength > 0) {
        Alert.alert(
          `Restore Backup?`,
          `We found a backup of your data. Do you want to restore it now? You can't undo this action later.`,
          [
            {
              text: 'No, thanks',
              style: 'cancel',
            },
            {
              text: 'Restore',
              onPress: async () => {
                await navigate('Settings', {
                  screen: 'Sync',
                });
                await restoreData(null, false);
                await navigate('Sheets');
              },
              style: 'default',
            },
          ],
          {cancelable: false},
        );
      }
    } catch (e) {}
  };

  const removeFile = async path => {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }
  };

  const restoreData = async (backup = null, confirmation = true) => {
    const onRestore = async () => {
      return new Promise(async (resolve, reject) => {
        try {
          const netStatus = await netInfoFetch();
          if (!netStatus.isConnected) {
            throw 'Check your internet connection & try again';
          }

          showLoader('restore', true);
          const {uid} = userData;
          let pathRef = `users/${uid}/backups/`;

          if (backup) {
            pathRef += `${backup.id}`;
          } else {
            let snapshot = await database()
              .ref(`/users/${uid}/backups`)
              .once('value');
            let backups = snapshot.val() || {};
            const backupsLength = Object.keys(backups).length;
            if (backupsLength === 0) {
              throw 'No Backups Found to restore';
            }
            const formattedBackups = _.map(backups, (bk, key) => ({
              datetime: formatDate(bk.date),
              id: key,
            }));
            // Sort the array by the 'datetime' key
            const sortedBackups = _.orderBy(
              formattedBackups,
              ['datetime'],
              'desc',
            );
            const backupKeys = _.map(sortedBackups, 'id');
            pathRef += `${backupKeys[0]}`;
          }

          let snapshot = await database().ref(pathRef).once('value');
          const backupInfo = snapshot.val();

          if (!backupInfo) {
            throw 'No Backup Found';
          }
          const reference = storage().ref(backupInfo.path);

          const downloadURL = await reference.getDownloadURL();

          const basePath =
            Platform.OS === 'ios'
              ? RNFS.DocumentDirectoryPath
              : RNFS.DocumentDirectoryPath;
          const title = 'expenses-manager-restore.db';
          const downloadedPath = `${basePath}/${title}`;

          await removeFile(downloadedPath);

          const response = await RNFetchBlob.config({
            fileCache: true,
            path: downloadedPath,
          }).fetch('GET', downloadURL);
          if (response) {
            await restoreDbFromBackup(downloadedPath);
            await initializeDB(true);
          } else {
            throw ' No file fetched';
          }
          hideLoader();
          showNotification('success', 'Data restored successfully.');
          resolve(true);
        } catch (e) {
          hideLoader();
          showNotification('error', e.toString());
          console.error(e);
        }
      });
    };

    if (confirmation) {
      Alert.alert(
        'Restore Data Confirmation?',
        'This will replace all your current data in the app. Make sure to back up your data first to avoid losing any important information.',
        [
          {
            text: 'Cancel',
            style: 'destructive',
          },
          {
            text: 'Restore',
            onPress: async () => {
              await onRestore();
            },
            style: 'default',
          },
        ],
        {cancelable: false},
      );
    } else {
      await onRestore();
    }
  };

  const onGetRestoreDates = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!isConnected) {
          throw 'Check your internet connection & try again';
        }
        const {uid} = userData;
        showLoader('restore', true);
        let snapshot = await database()
          .ref(`/users/${uid}/backups`)
          .once('value');
        let backups = snapshot.val() || {};
        const backupsLength = Object.keys(backups).length;
        if (backupsLength === 0) {
          throw 'There were no backups to restore';
        }
        let timeZone = getTimeZone();
        const getDate = dt => momentTz(dt).tz(timeZone).format('DD MMM YYYY');
        const getTime = dt => momentTz(dt).tz(timeZone).format('hh:mm:ss A');
        const backupsArray = _.orderBy(
          _.map(backups, (backup, key) => ({
            date: getDate(backup.date),
            time: getTime(backup.date),
            path: backup.path,
            datetime: formatDate(backup.date),
            id: key,
          })),
          ['datetime'],
          'desc',
        );
        hideLoader();
        resolve(backupsArray);
      } catch (e) {
        hideLoader();
        showNotification('error', e.message || e.toString());
        console.log(e);
        reject(e);
      }
    });
  };

  const onBackupToiCloud = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        showLoader('backup', true);
        let accounts = await onGetSheetsAndTransactions();
        if (accounts.length === 0) {
          throw {
            message:
              'There are no accounts or transactions in accounts to backup',
            error: 'noData',
          };
        }

        if ((await isICloudAvailable()) && defaultICloudContainerPath) {
          const {uid} = userData;
          const fileUrl = await onBackUpDatabase();
          const currentDate = new Date().toISOString();
          const fileName = `transactions-${currentDate}.db`;
          let path = `${defaultICloudContainerPath}/Documents/${fileName}`;
          await RNFS.copyFile(fileUrl, path);
          const lastSynced = getCurrentDate();

          if (isConnected) {
            await database().ref(`/users/${uid}`).update({
              lastSynced: lastSynced,
            });
          }

          onSetUserAdditionalDetails(p => ({
            ...p,
            lastSynced: lastSynced,
          }));
          hideLoader();
          showNotification('success', 'Your data backed up safely to iCloud');
        } else {
          throw 'Error occured while backing up to iCloud : iCloud is not available';
        }
      } catch (e) {
        reject(e);
        hideLoader();
        showNotification('error', e.message || e.toString());
        console.error(e);
      }
    });
  };

  const onRestoreFromiCloud = async backup => {
    const onRestore = async () => {
      try {
        showLoader('restore', true);
        if ((await isICloudAvailable()) && defaultICloudContainerPath) {
          const {path} = backup;
          const basePath = RNFS.DocumentDirectoryPath;
          if (await RNFS.exists(path)) {
            await closeDatabase();
            const originalFile = `${basePath}/${DB_PATH}`;
            await removeFile(originalFile);
            await RNFS.copyFile(path, originalFile);
            await initializeDB(true);
          } else {
            throw 'File  does not exist ';
          }
          hideLoader();
          showNotification('success', 'Data restored successfully.');
        } else {
          throw 'Error occured while restoring data from iCloud';
        }
      } catch (e) {
        hideLoader();
        showNotification('error', e.message || e.toString());
        console.error(e);
      }
    };

    Alert.alert(
      'Restore Data Confirmation?',
      'This will replace all your current data in the app. Make sure to back up your data first to avoid losing any important information.',
      [
        {
          text: 'Cancel',
          style: 'destructive',
        },
        {
          text: 'Restore',
          onPress: async () => {
            await onRestore();
          },
          style: 'default',
        },
      ],
      {cancelable: false},
    );
  };

  const onDeleteBackupFromiCloud = async backup => {
    try {
      showLoader('backup', true);
      if ((await isICloudAvailable()) && defaultICloudContainerPath) {
        await unlink(backup.path);
        hideLoader();
        showNotification(
          'success',
          'Backup file deleted successfully from iCloud',
        );
      } else {
        throw 'Error occured while deleting data from iCloud  : iCloud not availble';
      }
    } catch (e) {
      hideLoader();
      showNotification('error', e.message || e.toString());
      console.error(e);
    }
  };

  const onGetRestoresFromiCloud = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        showLoader('restore', true);
        if (
          (await isICloudAvailable()) &&
          defaultICloudContainerPath + '/Documents'
        ) {
          const files = await readDir(
            defaultICloudContainerPath + '/Documents',
          );

          if (!files || files.length === 0) {
            showNotification('info', 'There were no backups found');
            resolve([]);
          } else {
            let timeZone = getTimeZone();
            const getDate = dt =>
              momentTz(dt).tz(timeZone).format('DD MMM YYYY');
            const getTime = dt =>
              momentTz(dt).tz(timeZone).format('hh:mm:ss A');
            let structuredFiles = [];
            files.map(file => {
              let fileName = file.split('/Documents/')[1];

              const regex = /(transactions-.*?\.db)\.?(?:icloud)?$/;
              const match = regex.exec(fileName);
              if (match && match[1]) {
                fileName = match[1];
              }

              const dateRegex = /transactions-(.*?)\.db/;
              const extensionRegex = /\.db$/;
              const dateMatch = dateRegex.exec(fileName);
              const extensionMatch = extensionRegex.exec(fileName);
              let date, extension;
              if (dateMatch) {
                date = dateMatch[1];
              }
              if (extensionMatch) {
                extension = extensionMatch[0];
              }
              if (date && extension) {
                const obj = {
                  date: getDate(date),
                  time: getTime(date),
                  path: file,
                  fileName: fileName,
                  datetime: formatDate(date),
                };
                structuredFiles.push(obj);
              }
            });

            structuredFiles = _.orderBy(structuredFiles, ['datetime'], 'desc');
            if (!structuredFiles || structuredFiles.length === 0) {
              showNotification('info', 'There were no backups found');
              resolve([]);
            } else {
              resolve(structuredFiles);
            }
          }
          hideLoader();
        } else {
          throw 'Error occured while reading files from iCloud : iCloud not available';
        }
      } catch (e) {
        reject(e);
        hideLoader();
        showNotification('error', e.message || e.toString());
        console.error(e);
      }
    });
  };

  return (
    <SyncContext.Provider
      value={{
        backUpData,
        restoreData,
        onGetRestoreDates,
        onBackupToiCloud,
        onGetRestoresFromiCloud,
        onRestoreFromiCloud,
        onDeleteBackupFromiCloud,
      }}>
      {children}
    </SyncContext.Provider>
  );
};
