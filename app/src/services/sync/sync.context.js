/* eslint-disable handle-callback-err */
/* eslint-disable quotes */
/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {createContext, useContext, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  defaultICloudContainerPath,
  isICloudAvailable,
  readDir,
  unlink,
} from 'react-native-cloud-store';
import {SheetDetailsContext} from '../sheetDetails/sheetDetails.context';
import {SQLiteContext} from '../sqlite/sqlite.context';
import {
  firebaseRemoveFile,
  firebaseRemoveFiles,
  firebaseUploadFile,
  formatDate,
  getCurrentDate,
  getDataFromRows,
  getLinkedDbRecord,
} from '../../components/utility/helper';
import _ from 'lodash';
import {Alert, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';
import {getTimeZone} from 'react-native-localize';
import momentTz from 'moment-timezone';
import {navigate} from '../../infrastructure/navigation/rootnavigation';
import {
  useNetInfo,
  fetch as netInfoFetch,
} from '@react-native-community/netinfo';

import {WatermelonDBContext} from '../watermelondb/watermelondb.context';
import Aes from 'react-native-aes-crypto';
import {Q} from '@nozbe/watermelondb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SheetsContext} from '../sheets/sheets.context';

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
  const {onUpdateSheet} = useContext(SheetsContext);

  const {
    initializeDB,
    getData,
    restoreDbFromBackup,
    db: sqliteDb,
  } = useContext(SQLiteContext);
  const {db, deleteAllRecords} = useContext(WatermelonDBContext);
  const dispatch = useDispatch();
  const {isConnected} = useNetInfo();

  useEffect(() => {
    if (userData && db) {
      onInitialRestoreCheck();
    }
  }, [userData, db]);

  useEffect(() => {
    if (sqliteDb && db && userData) {
      fallbackSQLiteRestore(null, true);
    }
  }, [db, sqliteDb, userData]);

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

  const onBackUpDatabase = async () => {
    try {
      const {uid} = userData;
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

      const finalData = {
        accounts: accountsWithTransactions,
        categories: sanitizedCategories,
      };

      const jsonString = JSON.stringify(finalData);

      // Aes encrypt

      const salt = uid.slice(0, 8);
      const key = await Aes.pbkdf2(uid, salt, 5000, 256, 'sha256');
      const iv = await Aes.randomKey(16);
      const cipher = await Aes.encrypt(jsonString, key, iv, 'aes-256-cbc');

      const encryptedPayload = JSON.stringify({cipher, iv});

      const fileName = `transactions-${Date.now()}.json`;
      const path =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/${fileName}`
          : `${RNFS.DownloadDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, encryptedPayload, 'utf8');
      return path;
    } catch (error) {
      console.error('🔴 Backup encryption failed:', error);
      throw error;
    }
  };

  const restoreEncryptedJsonBackup = async (filePath, uid, userId) => {
    try {
      const encryptedString = await RNFS.readFile(filePath, 'utf8');
      const {cipher, iv} = JSON.parse(encryptedString);

      const salt = uid.slice(0, 8);
      const key = await Aes.pbkdf2(uid, salt, 5000, 256, 'sha256');
      const decrypted = await Aes.decrypt(cipher, key, iv, 'aes-256-cbc');
      const parsedData = JSON.parse(decrypted);

      const {accounts = [], categories = []} = parsedData;
      if (accounts.length === 0 || categories.length === 0) {
        throw 'Parsed backup is empty or corrupted';
      }

      await deleteAllRecords(false); // optional param to avoid deleting user object

      const enrichedCategories = categories.map(c => ({
        ...c,
        userId: userId,
      }));

      const categoryIdMap = {};
      const createdAccounts = [];
      await db.write(async () => {
        for (let c of enrichedCategories) {
          const newRecord = await db.get('categories').create(cat => {
            Object.keys(c).forEach(key => {
              if (key !== 'id') cat[key] = c[key];
            });
            cat.userId = userId;
          });
          categoryIdMap[c.id] = newRecord.id;
        }

        for (const a of accounts) {
          const {transactions = [], ...accountData} = a;
          let totalIncome = 0;
          let totalExpense = 0;

          for (const t of transactions) {
            if (t.type === 'income') {
              totalIncome += Number(t.amount || 0);
            } else if (t.type === 'expense') {
              totalExpense += Number(t.amount || 0);
            }
          }

          const totalBalance = totalIncome - totalExpense;

          const createdAccount = await db.get('accounts').create(acc => {
            Object.keys(accountData).forEach(key => {
              if (key !== 'id') acc[key] = accountData[key];
            });
            acc.totalIncome = totalIncome;
            acc.totalExpense = totalExpense;
            acc.totalBalance = totalBalance;
            acc.userId = userId;
          });

          createdAccounts.push(createdAccount);

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

      await Promise.all(
        createdAccounts.map(async acc => {
          await onUpdateSheet(acc);
        }),
      );

      return true;
    } catch (e) {
      console.error('🧨 Restore failed:', e);
      throw e;
    }
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

  const backUpData = async () => {
    return new Promise(async (resolve, reject) => {
      let fileUrl, uploadPath;
      try {
        if (!isConnected) {
          throw 'Check your internet connection & try again';
        }
        showLoader('backup', true);
        let {uid} = userData;
        let transactions = await onGetSheetsAndTransactions();
        if (transactions.length === 0) {
          throw {
            message: 'There are no transactions in accounts to backup',
            error: 'noData',
          };
        }
        fileUrl = await onBackUpDatabase();

        const currentDate = new Date().toISOString();
        uploadPath = `users/${uid}/backups/${currentDate}.json`;
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
          'Backup complete! Your data is now safely stored & completely encrypted',
        );
        await removeFile(fileUrl);

        onUpdateUserData({
          lastSynced: lastSynced,
        });

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
      const {uid, id} = userData;
      const accountsCollection = await db.get('accounts');
      const accounts = await accountsCollection
        .query(Q.where('userId', id))
        .fetch();
      const accountsLength = accounts.length;

      let snapshot = await database()
        .ref(`/users/${uid}/backups`)
        .once('value');
      let backups = snapshot.val() || {};
      const backupsLength = Object.keys(backups).length;
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

  const fallbackSQLiteRestore = async (
    filePath = null,
    forceRestore = false,
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!filePath && !forceRestore) throw 'No file fetched';

        if (!forceRestore) {
          await restoreDbFromBackup(filePath);
          await initializeDB(true);
        } else {
          const alreadyRestored = await AsyncStorage.getItem(
            'hasRestoredSQLiteBackup',
          );

          if (alreadyRestored === 'true') {
            resolve(true);
            return;
          }
        }

        const rawAccounts = await getData(`SELECT * FROM Accounts;`);

        const accounts = await getDataFromRows(rawAccounts.rows);

        const rawCategories = await getData(`SELECT * FROM Categories;`);
        const categories = await getDataFromRows(rawCategories.rows);

        const rawTransactions = await getData(`SELECT * FROM Transactions;`);
        const transactions = await getDataFromRows(rawTransactions.rows);

        if (accounts.length === 0 && categories.length === 0) {
          throw 'No records found in backup database.';
        }
        await deleteAllRecords(false);
        const getModelWritableFields = model => {
          const dummy = model.prepareCreate(() => {});
          return Object.keys(dummy._raw).filter(
            key =>
              !['_status', '_changed', 'id', 'createdAt', 'updatedAt'].includes(
                key,
              ),
          );
        };
        const enrichedCategories = categories.map(c => ({
          ...c,
          userId: userData.id,
        }));
        const categoryIdMap = {};
        await db.write(async () => {
          // Step 1: Categories
          const categoryFields = getModelWritableFields(db.get('categories'));
          for (let c of enrichedCategories) {
            const newRecord = await db.get('categories').create(cat => {
              categoryFields.forEach(field => {
                if (c[field] !== undefined) cat[field] = c[field];
              });
              cat.userId = userData.id;
            });
            categoryIdMap[c.id] = newRecord.id;
          }

          // Step 2: Accounts
          const accountFields = getModelWritableFields(db.get('accounts'));
          const txnFields = getModelWritableFields(db.get('transactions'));

          for (const a of accounts) {
            const linkedTransactions = transactions.filter(
              t => t.accountId === a.id,
            );
            const {id, ...accountData} = a;

            const totalIncome = linkedTransactions
              .filter(t => t.type === 'income' && !t.upcoming)
              .reduce((sum, t) => sum + (t.amount || 0), 0);
            const totalExpense = linkedTransactions
              .filter(t => t.type === 'expense' && !t.upcoming)
              .reduce((sum, t) => sum + (t.amount || 0), 0);
            const totalBalance = totalIncome - totalExpense;

            const createdAccount = await db.get('accounts').create(acc => {
              accountFields.forEach(field => {
                if (accountData[field] !== undefined)
                  acc[field] = accountData[field];
              });
              acc.totalIncome = totalIncome;
              acc.totalExpense = totalExpense;
              acc.totalBalance = totalBalance;
              acc.userId = userData.id;
            });

            // Step 3: Transactions
            for (const t of linkedTransactions) {
              await db.get('transactions').create(txn => {
                txnFields.forEach(field => {
                  if (t[field] !== undefined) txn[field] = t[field];
                });
                txn.accountId = createdAccount.id;
                if (t.categoryId && categoryIdMap[t.categoryId]) {
                  txn.categoryId = categoryIdMap[t.categoryId];
                }
              });
            }
          }
        });
        if (forceRestore) {
          await AsyncStorage.setItem('hasRestoredSQLiteBackup', 'true');
        }
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
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

          const filePath = `${
            RNFS.DocumentDirectoryPath
          }/restore-${Date.now()}.json`;

          await removeFile(filePath);

          const response = await RNFetchBlob.config({
            fileCache: true,
            path: filePath,
          }).fetch('GET', downloadURL);
          if (response) {
            if (backupInfo.path.endsWith('.db')) {
              await fallbackSQLiteRestore(filePath);
            } else if (backupInfo.path.endsWith('.json')) {
              await restoreEncryptedJsonBackup(filePath, uid, userData.id);
            }

            hideLoader();
            showNotification('success', 'Legacy backup restored successfully.');
            resolve(true);
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
        let transactions = await onGetSheetsAndTransactions();
        if (transactions.length === 0) {
          throw {
            message: 'There are no transactions in accounts to backup',
            error: 'noData',
          };
        }
        if ((await isICloudAvailable()) && defaultICloudContainerPath) {
          const {uid} = userData;
          const fileUrl = await onBackUpDatabase();
          const currentDate = new Date().toISOString();
          const fileName = `transactions-${currentDate}.json`;
          let path = `${defaultICloudContainerPath}/Documents/${fileName}`;
          await RNFS.copyFile(fileUrl, path);
          const lastSynced = getCurrentDate();

          if (isConnected) {
            await database().ref(`/users/${uid}`).update({
              lastSynced: lastSynced,
            });
          }
          onUpdateUserData({
            lastSynced: lastSynced,
          });

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
            const extension = path.split('.').pop();
            // Check for legacy .db file
            if (extension === 'db') {
              await fallbackSQLiteRestore(path);
            } else if (extension === 'json') {
              await restoreEncryptedJsonBackup(path, userData.uid, userData.id);
            } else {
              throw 'Unsupported file format';
            }
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

              const dateRegex = /transactions-(.*?)\.(json|db)/;
              const extensionRegex = /\.(json|db)$/;
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
