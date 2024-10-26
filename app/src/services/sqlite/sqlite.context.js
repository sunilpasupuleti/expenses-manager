/* eslint-disable handle-callback-err */
/* eslint-disable quotes */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from 'react';
import {createContext} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {notificationActions} from '../../store/notification-slice';
import SQLite from 'react-native-sqlite-storage';
import {
  AccountsSchema,
  CategoriesSchema,
  TransactionsSchema,
  UserSchema,
} from './sqliteSchemas';
import {
  AccountsDeleteTrigger,
  AccountsInsertTrigger,
  AccountsUpdateTrigger,
} from './sqliteTriggers';
import {dbBackupPath, dbPath} from '../../../config';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';

SQLite.enablePromise(true);

export const SQLiteContext = createContext({
  db: null,
  dbError: null,
  initializeDB: () => {},
  onBackUpDatabase: () => {},
  onRestoreDatabase: () => {},
  deleteAllTablesData: () => {},
  createOrReplaceData: (schema, data, key) => {},
  getData: query => {},
  executeQuery: query => {},
  updateData: (schema, data, condition, conditionValues) => {},
  closeDatabase: () => {},
  restoreDbFromBackup: backupFilePath => {},
  deleteData: (schema, condition, conditionValues) => {},
});

export const SQLiteContextProvider = ({children}) => {
  const [db, setDb] = useState(null);
  const [dbError, setDbError] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (dbError) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message:
            dbError?.message?.toString() ||
            dbError.toString() ||
            'Error in database',
        }),
      );
    }
  }, [dbError]);

  useEffect(() => {
    initializeDB();
  }, []);

  const initializeDB = async (reinitilize = false) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (db && !reinitilize) {
          return;
        }
        const database = await SQLite.openDatabase({
          name: dbPath,
          // effect for ios only
          location: 'Documents',
        });
        const version = await database.executeSql('SELECT sqlite_version()');
        console.log(version[0].rows.item(0));

        //   Migrate db
        await migrateDb(database);

        await enableForeignKeyCheck(database);
        // create tables
        await createTables(database);
        await createTriggers(database);
        setDb(database);
        resolve(database);
      } catch (error) {
        reject(error);
        setDbError(error);
      }
    });
  };

  const createTables = async database => {
    try {
      // Execute table creation statements sequentially using a loop
      const tableSchemas = [
        UserSchema,
        CategoriesSchema,
        AccountsSchema,
        TransactionsSchema,
      ];
      for (const schema of tableSchemas) {
        await database.transaction(async tx => {
          let result = await tx.executeSql(schema);
        });
      }
    } catch (err) {
      setDbError(err);
    }
  };

  const onBackUpDatabase = async () => {
    return new Promise(async (resolve, reject) => {
      await closeDatabase();
      try {
        const sourceDir =
          Platform.OS === 'ios'
            ? RNFS.DocumentDirectoryPath
            : `${RNFS.DocumentDirectoryPath.replace('files', 'databases')}`;

        const srcFile = `${sourceDir}/${dbPath}`;
        const exists = await RNFS.exists(srcFile);

        if (exists) {
          const backupDir =
            Platform.OS === 'ios'
              ? RNFS.DocumentDirectoryPath
              : RNFS.DocumentDirectoryPath;
          const backupFile = `${backupDir}/${dbBackupPath}`; // Change this to your desired backup file name
          if (await RNFS.exists(backupFile)) {
            await RNFS.unlink(backupFile);
          }
          await RNFS.copyFile(srcFile, backupFile);
          await initializeDB(true);
          resolve(backupFile);
        } else {
          throw ' No File to make backup';
        }
      } catch (e) {
        await initializeDB(true);
        reject(e);
      }
    });
  };

  const onRestoreDatabase = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        await closeDatabase();
        const sourceDir =
          Platform.OS === 'ios'
            ? RNFS.DocumentDirectoryPath
            : RNFS.DocumentDirectoryPath;
        const backupFile = `${sourceDir}/${dbBackupPath}`;
        const backupExists = await RNFS.exists(backupFile);

        if (backupExists) {
          const originalDir =
            Platform.OS === 'ios'
              ? RNFS.DocumentDirectoryPath
              : RNFS.DocumentDirectoryPath;

          const originalFile = `${originalDir}/${dbPath}`; // Adjust this to your database file name
          if (await RNFS.exists(originalFile)) {
            await RNFS.unlink(originalFile);
          }
          await RNFS.copyFile(backupFile, originalFile);
          await initializeDB(true);
          resolve(true);
        } else {
          throw 'No Backup Exists';
        }
      } catch (e) {
        reject(e);
      }
    });
  };

  const deleteAllTablesData = async (includeUserTable = false) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (includeUserTable) {
          await db.executeSql('DELETE FROM Users;');
        }
        await db.executeSql('DELETE FROM Categories;');
        await db.executeSql('DELETE FROM Accounts;');
        await db.executeSql('DELETE FROM Transactions;');
        resolve(true);
      } catch (e) {
        reject(e);
        setDbError(e);
      }
    });
  };

  const createTriggers = async database => {
    try {
      // Execute table creation statements sequentially using a loop
      const tableTriggers = [
        AccountsInsertTrigger,
        AccountsUpdateTrigger,
        AccountsDeleteTrigger,
      ];
      for (const trigger of tableTriggers) {
        await database.transaction(async tx => {
          let result = await tx.executeSql(trigger);
        });
      }
    } catch (err) {
      setDbError(err);
    }
  };

  const migrateDb = async database => {
    return;
    try {
      // const ALTER_TABLE_QUERY = `ALTER TABLE User Rename To User_old;
      //     ${UserSchema}
      // `;
      // let cols =
      //   'uid, active, autoFetchTransactions, brand, dailyBackup, displayName, email, fcmToken, lastLogin, model, phoneNumber, photoURL, platform, timezone, baseCurrency, createdAt, dailyReminderEnabled';
      // migrate data

      // await tx.executeSql(ALTER_TABLE_QUERY);
      // await tx.executeSql(
      //   `INSERT INTO User(${cols}) SELECT ${cols} From User_old`,
      // );
      // let result = await database.executeSql('DROP TABLE User');
      // await database.executeSql('DROP TRIGGER update_accounts_insert');
      await database.executeSql('DROP TABLE Users');
      await database.executeSql('DROP TABLE Transactions');
      await database.executeSql('DROP TABLE Accounts');
      await database.executeSql('DROP TABLE Categories');

      // console.log(database, '---------------------------');
    } catch (e) {
      console.log(e);
      setDbError(e);
    }
  };

  const createOrReplaceData = async (schema, data, key) => {
    return new Promise(async (resolve, reject) => {
      try {
        let keys = Object.keys(data);
        const placeholders = Array(keys.length).fill('?').join(',');
        let query;
        let queryValues;
        if (key) {
          const updateSet = keys.map(key => `${key}=?`).join(',');
          query = `INSERT INTO ${schema} (${keys.join(
            ',',
          )}) VALUES (${placeholders}) ON CONFLICT(${key}) DO UPDATE SET ${updateSet}`;
          queryValues = [...Object.values(data), ...Object.values(data)];
        } else {
          query = `INSERT INTO ${schema} (${keys.join(
            ',',
          )}) VALUES (${placeholders})`;
          queryValues = [...Object.values(data)];
        }

        let results = await db.executeSql(query, queryValues);
        resolve(results[0]);
      } catch (e) {
        setDbError(e);
        reject(e);
      }
    });
  };

  const getData = async query => {
    return new Promise(async (resolve, reject) => {
      try {
        let results = await db.executeSql(query, []);
        resolve(results[0]);
      } catch (e) {
        setDbError(e);
        reject(e);
      }
    });
  };

  const executeQuery = async (query, values = []) => {
    return new Promise(async (resolve, reject) => {
      try {
        let results = await db.executeSql(
          query,
          values.length > 0 ? values : [],
        );
        resolve(results[0]);
      } catch (e) {
        setDbError(e);
        reject(e);
      }
    });
  };

  const updateData = async (schema, data, condition, conditionValues) => {
    return new Promise(async (resolve, reject) => {
      try {
        let keys = Object.keys(data);
        const updateSet = keys.map(key => `${key}=?`).join(',');
        let query = `UPDATE ${schema} SET ${updateSet} ${condition}`;
        let results = await db.executeSql(query, [
          ...Object.values(data),
          ...conditionValues,
        ]);
        resolve(results[0]);
      } catch (e) {
        setDbError(e);
        reject(e);
      }
    });
  };

  const deleteData = async (schema, condition, conditionValues) => {
    return new Promise(async (resolve, reject) => {
      try {
        let query = `DELETE FROM ${schema} ${condition}`;
        let results = await db.executeSql(query, [...conditionValues]);
        resolve(results[0]);
      } catch (e) {
        setDbError(e);
        reject(e);
      }
    });
  };

  const closeDatabase = async () => {
    if (db) {
      await db.close();
      setDb(null);
    }
  };

  const enableForeignKeyCheck = async database => {
    try {
      // Check if foreign keys are enabled
      const fkEnabledResult = await database.executeSql(
        'PRAGMA foreign_keys;',
        [],
      );
      // console.log(
      //   'Foreign keys enabled:',
      //   fkEnabledResult[0].rows.item(0),
      //   '---------',
      // );
      if (fkEnabledResult[0].rows.item(0).foreign_keys === 0) {
        // Enable foreign keys
        await database.executeSql('PRAGMA foreign_keys = ON;', []);
        // console.log('Foreign keys enforcement enabled.');
      }
    } catch (error) {
      console.error('Error with foreign key pragma:', error);
      setDbError(error);
    }
  };

  const restoreDbFromBackup = backupFilePath => {
    return new Promise(async (resolve, reject) => {
      try {
        // Attach the backup database (expenses-manager-restore.db)
        const attachQuery = `ATTACH DATABASE '${backupFilePath}' AS backupDB;`;
        await db.executeSql(attachQuery);

        // Copy data from backup database to the main database (replace 'Accounts' with other table names as needed)
        await db.executeSql(
          `INSERT OR REPLACE INTO Categories SELECT * FROM backupDB.Categories;`,
        );
        await db.executeSql(
          `INSERT OR REPLACE INTO Accounts SELECT * FROM backupDB.Accounts;`,
        );
        await db.executeSql(
          `INSERT OR REPLACE INTO Transactions SELECT * FROM backupDB.Transactions;`,
        );
        // Detach the backup database
        await db.executeSql(`DETACH DATABASE backupDB;`);
        // Resolve the promise on successful completion
        resolve('Database restored successfully');
      } catch (error) {
        // Reject the promise with the error if something goes wrong
        console.error('Error during manual restore:', error);
        reject(error);
      }
    });
  };

  return (
    <SQLiteContext.Provider
      value={{
        db,
        dbError,
        initializeDB,
        createOrReplaceData,
        updateData,
        getData,
        closeDatabase,
        executeQuery,
        deleteData,
        deleteAllTablesData,
        onRestoreDatabase,
        onBackUpDatabase,
        restoreDbFromBackup,
      }}>
      {children}
    </SQLiteContext.Provider>
  );
};
