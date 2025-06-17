import {DB_NAME} from './config';
import {
  calculateInterestFromAmortizationSchedule,
  getLinkedDbRecord,
  sendLocalNotification,
} from './src/components/utility/helper';
import moment from 'moment';
import RNFS from 'react-native-fs';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {Database, Q} from '@nozbe/watermelondb';
import User from './src/services/watermelondb/models/User.model';
import Account from './src/services/watermelondb/models/Account.model';
import Transaction from './src/services/watermelondb/models/Transaction.model';
import Category from './src/services/watermelondb/models/Category.model';
import schema from './src/services/watermelondb/watermelondb_schema';
import migrations from './src/services/watermelondb/watermelondb_migrations';
import Aes from 'react-native-aes-crypto';

const openDatabase = async () => {
  return new Promise((resolve, reject) => {
    try {
      const adapter = new SQLiteAdapter({
        schema: schema,
        migrations: migrations,
        dbName: DB_NAME,
        jsi: true,

        onSetUpError: error => {
          throw error;
        },
      });

      const database = new Database({
        adapter: adapter,
        modelClasses: [User, Account, Transaction, Category],
      });
      resolve(database);
    } catch (err) {
      reject(err);
    }
  });
};

const onUpdateSheet = async (sheet, database) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (sheet.isLoanAccount) {
        const collection = await database.get('accounts');
        const records = await collection.query(Q.where('id', sheet.id)).fetch();

        const refetchedSheet = records[0];

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

        await database.write(async () => {
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

      await database.write(async () => {
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

const onSetUpcomingSheetDetailFromEvent = async data => {
  try {
    if (!data) {
      throw 'No data';
    }
    const database = await openDatabase();

    if (!database) {
      throw ' No database found';
    }

    const txnCollection = await database
      .get('transactions')
      .query(Q.where('id', data.sheetDetailId))
      .fetch();

    const txn = txnCollection[0];
    const account = await txn.account.fetch();

    if (!txn || !account) throw 'No transaction found';

    const {id: transaction_id, notes, imageUrl, date, type, amount} = txn;
    const {name} = account;
    const currentDate = moment().set({second: 0, millisecond: 0});
    let upcoming = moment(date).isSameOrAfter(currentDate);
    if (upcoming) {
      await database.write(async () => {
        await txn.update(t => {
          t.upcoming = false;
        });

        await account.update(a => {
          if (type === 'income') {
            a.totalIncome += amount;
            a.totalBalance += amount;
          } else if (type === 'expense') {
            a.totalExpense += amount;
            a.totalBalance -= amount;
          }
        });
      });

      await onUpdateSheet(account, database);
      const notificationInfo = {
        title: `New Transaction ${notes ? `:${notes}` : ''}`,
        message: `Added to - ${name} `,
        image: imageUrl,
      };
      sendLocalNotification(notificationInfo, txn._raw);
    }
  } catch (err) {
    console.log(err);

    const notificationInfo = {
      title: `Error Occured in adding the new transaction`,
      message: `${err.toString()} Id - ${data.sheetDetailId} `,
    };
    sendLocalNotification(notificationInfo, {});
  }
};

const onDailyBackup = async data => {
  try {
    if (!data || !data.backendUrl || !data.uid) {
      throw 'Invalid data for backup';
    }
    const {uid, backendUrl} = data;

    const database = await openDatabase();
    const usersCollection = await database
      .get('users')
      .query(Q.where('uid', data.uid))
      .fetch();
    const user = usersCollection[0];
    if (!user) {
      throw ' No User Found';
    }
    const accountsCollection = await database.get('accounts');
    const accounts = await accountsCollection
      .query(Q.where('userId', user.id))
      .fetch();

    const categoriesCollection = await database.get('categories');
    const categories = await categoriesCollection
      .query(Q.where('userId', user.id))
      .fetch();

    if (accounts.length === 0) {
      throw 'No data to export';
    }

    const accountsWithTransactions = await Promise.all(
      accounts.map(async account => {
        const transactions = await account.transactions.fetch();
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

    // Step 2: Encrypt with AES
    const jsonString = JSON.stringify(finalData);
    const salt = uid.slice(0, 8);
    const key = await Aes.pbkdf2(uid, salt, 5000, 256, 'sha256');
    const iv = await Aes.randomKey(16);
    const cipher = await Aes.encrypt(jsonString, key, iv, 'aes-256-cbc');
    const encryptedPayload = JSON.stringify({cipher, iv});

    // Step 3: Upload encrypted file
    const fileName = `transactions-${Date.now()}.json`;
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    await RNFS.writeFile(filePath, encryptedPayload, 'utf8');
    const base64File = await RNFS.readFile(filePath, 'base64');
    const currentDate = new Date().toISOString();

    const payload = {
      file: base64File,
      uid: uid,
      date: currentDate,
      filename: fileName,
    };

    const url = backendUrl + '/backup/upload';
    let jwtToken = await auth().currentUser.getIdToken();

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Bearer ' + jwtToken,
      },
    });

    if (response.status === 200) {
      console.log('Backup successful', response.data);
      await RNFS.unlink(filePath);
    } else {
      throw 'Backup failed';
    }
  } catch (err) {
    console.log(err);
  }
};

export const headlessTask = async data => {
  // You can perform any task you need here. For example:
  console.log(data);

  if (data) {
    const eventName = data.event_name;
    const eventData = JSON.parse(data.event_data);

    console.log('Processed event name:', eventName);
    console.log('Processed event data:', eventData);

    if (eventName && eventName === 'upcomingSheetDetail') {
      await onSetUpcomingSheetDetailFromEvent(eventData);
    }

    if (eventName && eventName === 'dailyBackup') {
      await onDailyBackup(eventData);
    }

    // Run any background logic or dispatch actions
    // For example, updating state, showing notifications, etc.
  }

  // Return a resolved promise to indicate the task is done
  return Promise.resolve();
};
