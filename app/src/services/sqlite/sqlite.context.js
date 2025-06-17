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
  LoanAccountEditTrigger,
  triggerNames,
} from './sqliteTriggers';
import {DB_BACKUP_PATH, DB_PATH} from '../../../config';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';

SQLite.enablePromise(true);

export const SQLiteContext = createContext({
  db: null,
  dbError: null,
  initializeDB: () => {},

  getData: query => {},
  executeQuery: query => {},
  restoreDbFromBackup: backupFilePath => {},
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
          name: DB_PATH,
          // effect for ios only
          location: 'Documents',
        });
        const version = await database.executeSql('SELECT sqlite_version()');

        console.log(version[0].rows.item(0));

        await enableForeignKeyCheck(database);

        await createTables(database);

        //   Migrate db
        await migrateDb(database);

        // create tables
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

  const migrateDb = async database => {
    try {
      const MIGRATION_KEY = 'add_loan_fields_to_accountsv11';
      await database.executeSql(`
        CREATE TABLE IF NOT EXISTS Migrations (
          key TEXT PRIMARY KEY,
          executed INTEGER DEFAULT 0
        )
      `);

      const [res] = await database.executeSql(
        'SELECT executed FROM Migrations WHERE key = ?',
        [MIGRATION_KEY],
      );
      if (res.rows.length > 0 && res.rows.item(0).executed === 1) {
        console.log('Migration already done skipping');
        return;
      }

      const migrationPlan = {
        Accounts: [
          {name: 'isLoanAccount', type: 'INTEGER DEFAULT 0'},
          {name: 'loanAmount', type: 'REAL DEFAULT 0'},
          {name: 'interestRate', type: 'REAL DEFAULT 0'},
          {name: 'interestRateMode', type: 'TEXT'},

          {name: 'useReducingBalance', type: 'REAL DEFAULT 0'},
          {name: 'useEndDate', type: 'REAL DEFAULT 0'},
          {name: 'totalPaid', type: 'REAL DEFAULT 0'},

          {name: 'repaymentFrequency', type: 'TEXT'},
          {name: 'loanStartDate', type: 'TEXT'},
          {name: 'loanEndDate', type: 'TEXT'},
          {name: 'loanYears', type: 'INTEGER DEFAULT 0'},
          {name: 'loanMonths', type: 'INTEGER DEFAULT 0'},
          {name: 'emi', type: 'REAL DEFAULT 0'},
          {name: 'totalRepayable', type: 'REAL DEFAULT 0'},
          {name: 'totalInterest', type: 'REAL DEFAULT 0'},
          {name: 'totalPayments', type: 'REAL DEFAULT 0'},
        ],
        Transactions: [
          {
            name: 'isEmiPayment',
            type: 'INTEGER DEFAULT 0',
          },
          {
            name: 'emiDate',
            type: 'TEXT',
          },
        ],
        Categories: [{name: 'isLoanRelated', type: 'INTEGER DEFAULT 0'}],
      };

      const addColumnIfNotExists = async (tableName, column) => {
        const [result] = await database.executeSql(
          `PRAGMA table_info(${tableName});`,
        );
        const columnExists = Array.from({length: result.rows.length})
          .map((_, i) => result.rows.item(i).name)
          .includes(column.name);

        if (!columnExists) {
          await database.executeSql(
            `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type};`,
          );
          console.log(`✅ Added ${column.name} to ${tableName}`);
        } else {
          console.log(`ℹ️ ${column.name} already exists in ${tableName}`);
        }
      };

      // Perform all migrations
      for (const [table, columns] of Object.entries(migrationPlan)) {
        for (const column of columns) {
          await addColumnIfNotExists(table, column);
        }
      }

      await database.executeSql(
        'INSERT OR REPLACE INTO Migrations (key, executed) VALUES (?, 1);',
        [MIGRATION_KEY],
      );
      console.log('✅ Migration completed successfully.');
    } catch (e) {
      console.log(e);
      setDbError(e);
    }
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
        if (!db) {
          await initializeDB(true);
        }
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
        await db.executeSql('PRAGMA foreign_keys = OFF;');

        const attachQuery = `ATTACH DATABASE '${backupFilePath}' AS backupDB;`;
        await db.executeSql(attachQuery);

        const getMainTableColumns = async tableName => {
          const [res] = await db.executeSql(`PRAGMA table_info(${tableName});`);
          const columns = [];

          for (let i = 0; i < res.rows.length; i++) {
            const row = res.rows.item(i);
            columns.push(row.name);
          }

          return columns;
        };

        const getBackupTableColumns = async tableName => {
          const [res] = await db.executeSql(
            `SELECT * FROM backupDB.${tableName} LIMIT 1`,
          );
          const row = res.rows.length > 0 ? res.rows.item(0) : {};
          return Object.keys(row); // Handles empty tables too
        };

        const restoreTable = async tableName => {
          const mainCols = await getMainTableColumns(tableName);
          const backupCols = await getBackupTableColumns(tableName);
          const commonCols = backupCols.filter(c => mainCols.includes(c));
          const colList = commonCols.join(', ');

          await db.executeSql(`DELETE FROM ${tableName};`);
          await db.executeSql(
            `INSERT INTO ${tableName} (${colList}) SELECT ${colList} FROM backupDB.${tableName};`,
          );
        };
        await restoreTable('Categories');
        await restoreTable('Accounts');
        await restoreTable('Transactions');
        // Detach the backup database
        await db.executeSql(`DETACH DATABASE backupDB;`);
        await db.executeSql('PRAGMA foreign_keys = ON;');
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
        getData,
        executeQuery,
        restoreDbFromBackup,
      }}>
      {children}
    </SQLiteContext.Provider>
  );
};
