import SQLite from 'react-native-sqlite-storage';
import {DB_PATH} from './config';
import {
  getDataFromRows,
  sendLocalNotification,
} from './src/components/utility/helper';
import moment from 'moment';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import axios from 'axios';
import remoteConfig from '@react-native-firebase/remote-config';
import auth from '@react-native-firebase/auth';

SQLite.enablePromise(true);

const openDatabase = async () => {
  try {
    const database = await SQLite.openDatabase({
      name: DB_PATH,
      location: 'Documents', // or 'default' depending on the platform
    });
    console.log('Database opened successfully.');
    return database;
  } catch (error) {
    console.log('Error opening database:', error);
    throw error;
  }
};

const onSetUpcomingSheetDetailFromEvent = async data => {
  try {
    if (!data) {
      throw 'No data';
    }
    let query = `
    SELECT t.*,
    t.id AS transaction_id,
    a.*,
    a.id AS account_id
    FROM Transactions AS t
    JOIN Accounts AS a ON t.accountId = a.id
    WHERE t.id = ${data.sheetDetailId};
`;
    const database = await openDatabase();

    let result = await database.executeSql(query);
    if (!result) {
      throw 'No database found';
    }

    let resultData = await getDataFromRows(result[0].rows);

    if (!resultData || !resultData[0]) {
      throw 'No Transaction Found';
    }

    const {transaction_id, notes, name, imageUrl, date} = resultData[0];
    const currentDate = moment().set({second: 0, millisecond: 0});
    let upcoming = moment(date).isSameOrAfter(currentDate);
    if (upcoming) {
      let updateQuery = `
      UPDATE Transactions
      SET upcoming = 0
      WHERE id = ${transaction_id}
      `;

      let updatedResult = await database.executeSql(updateQuery, []);

      const notificationInfo = {
        title: `New Transaction ${notes ? `:${notes}` : ''}`,
        message: `Added to - ${name} `,
        image: imageUrl,
      };
      sendLocalNotification(notificationInfo, resultData);
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
    if (!data) {
      throw 'No data';
    }

    const sourceDir =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : `${RNFS.DocumentDirectoryPath.replace('files', 'databases')}`;

    const srcFile = `${sourceDir}/${DB_PATH}`;
    const exists = await RNFS.exists(srcFile);

    if (!exists) {
      throw 'No file exists';
    }
    const base64File = await RNFS.readFile(srcFile, 'base64');
    const currentDate = new Date().toISOString();
    const payload = {
      file: base64File,
      uid: data.uid,
      date: currentDate,
      filename: `${currentDate}.db`,
    };

    const url = data.backendUrl + '/backup/upload';
    let jwtToken = await auth().currentUser.getIdToken();

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Bearer ' + jwtToken,
      },
    });

    if (response.status === 200) {
      console.log('Backup successful', response.data);
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
