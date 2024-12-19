import remoteConfig from '@react-native-firebase/remote-config';
import moment from 'moment';
import storage from '@react-native-firebase/storage';
import {
  accountColumns,
  categoryColumns,
  transactionColumns,
} from '../../services/sqlite/sqliteSchemas';
import {GetCurrencyLocalString, GetCurrencySymbol} from '../symbol.currency';
import momentTz from 'moment-timezone';
import {getTimeZone} from 'react-native-localize';
import PushNotification from 'react-native-push-notification';

const FIREBASE_STORAGE_URL = remoteConfig()
  .getValue('FIREBASE_STORAGE_URL')
  .asString();

export const getFirebaseAccessUrl = (path = '') => {
  let URL = FIREBASE_STORAGE_URL + path.replaceAll('/', '%2f') + '?alt=media';
  return URL;
};

export const transactionSelectClause = transactionColumns
  .map(column => `'${column}', t.${column}`)
  .join(', ');

export const accountSelectClause = accountColumns
  .map(column => `'${column}', a.${column}`)
  .join(', ');

export const categorySelectClause = categoryColumns
  .map(column => `'${column}', c.${column}`)
  .join(', ');

export const firebaseUploadFile = async (path, uri) => {
  return new Promise(async (resolve, reject) => {
    try {
      let storageRef = storage().ref(path);
      let response = await storageRef.putFile(uri);
      let state = response.state;
      if (state === 'success') {
        let downloadURL = path;
        resolve(downloadURL);
      } else {
        throw 'Error occured while uploading file';
      }
    } catch (e) {
      console.log(
        e.toString(),
        'hey man error occured in uploading firebase cloud file',
      );
      reject(e);
    }
  });
};

export const firebaseRemoveFile = async path => {
  return new Promise(async (resolve, reject) => {
    try {
      let storageRef = storage().ref(path);
      let fileExists = await storageRef
        .getMetadata()
        .then(() => true)
        .catch(() => false);
      if (fileExists) {
        await storageRef.delete();
      }
      resolve(true);
    } catch (e) {
      // skip deletion if file not exists
      console.log(
        e.toString(),
        'hey man error occured in removing firebase cloud file',
      );
      reject(e);
    }
  });
};

export const firebaseRemoveFiles = async paths => {
  return Promise.all(
    paths.map(async path => {
      try {
        let storageRef = storage().ref(path);
        let fileExists = await storageRef
          .getMetadata()
          .then(() => true)
          .catch(() => false);
        if (fileExists) {
          await storageRef.delete();
        }
        return true;
      } catch (e) {
        // skip deletion if file not exists
        console.log(
          e.toString(),
          'Error occurred while removing firebase cloud file at path:',
          path,
        );
        return false;
      }
    }),
  );
};

export const firebaseCopyMoveFile = async (
  actionType,
  imageType,
  sourcePath,
  destinationPath,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let sourceRef = storage().ref(sourcePath);
      let destinationRef = storage().ref(destinationPath);

      const downloadURL = await sourceRef.getDownloadURL();

      // Use the 'fetch' function to get the file data from the download URL
      const response = await fetch(downloadURL);
      const fileData = await response.arrayBuffer();

      await destinationRef.put(fileData, {
        contentType: imageType,
      });
      // remove file if move
      if (actionType && actionType === 'move') {
        await sourceRef.delete();
      }
      resolve(destinationPath);
    } catch (e) {
      console.log(e.toString());
      reject(e);
    }
  });
};

export const firebaseRemoveFolder = async folderPath => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get a reference to the folder in Firebase Cloud Storage
      const folderRef = storage().ref().child(folderPath);
      // Get a list of all items (files/folders) inside the folder
      const folderItems = await folderRef.listAll();
      // Recursively delete each item inside the folder
      await Promise.all(
        folderItems.items.map(async item => {
          if (item.isDirectory) {
            // Recursively delete sub-folders
            await firebaseRemoveFolder(item.fullPath);
          } else {
            // Delete individual file
            let fileExists = await item
              .getMetadata()
              .then(() => true)
              .catch(() => false);
            if (fileExists) {
              await item.delete();
            }
            console.log(`File deleted: ${item.fullPath}`);
          }
        }),
      );

      // Delete the empty folder itself
      await folderRef.delete();
      console.log(`Folder deleted: ${folderPath}`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const getCurrentDate = () => {
  return moment().format('YYYY-MM-DD HH:mm:ss');
};

export const formatDate = date => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatDateTz = date => {
  let timeZone = getTimeZone();
  return momentTz(date).tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
};

export const formatDateTzReadable = date => {
  let timeZone = getTimeZone();

  return moment(date).format('DD MMM YYYY, hh:mm:ss A');
};

export const getDataFromRows = rows => {
  let rowsArray = [];
  if (rows.length && rows.item) {
    for (let i = 0; i < rows.length; i++) {
      rowsArray.push(rows.item(i));
    }
  }
  return rowsArray;
};

export const getExcelSheetAccountRows = (account, transactions) => {
  const {currency} = account;
  const structuredDetails = [];
  transactions.forEach((transaction, i) => {
    let {date, showTime, time, type, amount, imageUrl, notes, category} =
      transaction;
    let dt = moment(date).format('MMM DD, YYYY ');
    if (showTime) {
      let tm = moment(time).format('hh:mm A');
      dt += tm;
    }

    let amnt = `AMOUNT ( ${GetCurrencySymbol(currency)} )`;
    let detail = {
      'S.NO': i + 1,
      DATE: dt,
      CATEGORY: category.name,
      NOTES: notes,
      IMAGE: imageUrl ? getFirebaseAccessUrl(imageUrl) : '-',
      [amnt]: type === 'expense' ? -amount : amount,
    };
    structuredDetails.push(detail);
  });
  return structuredDetails;
};

export const getExcelSheetAccountSummary = account => {
  let {totalIncome, totalExpense, totalBalance, currency} = account;
  totalIncome =
    GetCurrencySymbol(currency) + ' ' + GetCurrencyLocalString(totalIncome);
  totalExpense =
    GetCurrencySymbol(currency) + ' ' + GetCurrencyLocalString(totalExpense);
  totalBalance =
    GetCurrencySymbol(currency) + ' ' + GetCurrencyLocalString(totalBalance);
  let data = [
    ['', '', '', '', '', ''],
    ['', '', '', '', 'TOTAL INCOME ', totalIncome],
    ['', '', '', '', 'TOTAL EXPENSES ', totalExpense],
    ['', '', '', '', 'BALANCE', totalBalance],
  ];
  return data;
};

export const getPdfAccountTableHtml = (theme, account, transactions) => {
  let {totalIncome, totalExpense, totalBalance, currency, name} = account;
  let tableHeads = `
  <th>S.NO</th>
  <th>DATE</th>
  <th>CATEGORY</th>
  <th>NOTES</th>
  <th>IMAGE</th>
  <th>AMOUNT ( ${GetCurrencySymbol(currency)} )</th>
`;
  let styles = getPdfAccountStyles(theme);
  let tableBody = '';
  transactions.forEach((transaction, index) => {
    let {date, showTime, time, type, amount, imageUrl, notes, category} =
      transaction;
    let dt = moment(date).format('MMM DD, YYYY ');
    if (showTime) {
      let tm = moment(time).format('hh:mm A');
      dt += tm;
    }

    if (imageUrl) {
      imageUrl = getFirebaseAccessUrl(imageUrl);
    }

    let image = imageUrl ? `<img src='${imageUrl}'/>` : '';
    let tableRow = `
    <tr>
        <td>${index + 1}</td>
        <td>${dt}</td>
        <td>${category.name}</td>
        <td>${notes ? notes : ''}</td>
        <td>
        ${image}
        </td>
        <td>
          <span class="${type}">
          ${GetCurrencySymbol(currency)} 
          ${
            type === 'expense'
              ? `-${GetCurrencyLocalString(amount)}`
              : GetCurrencyLocalString(amount)
          }</span>
        </td>
    </tr>
  `;
    tableBody += tableRow;
  });

  totalIncome =
    GetCurrencySymbol(currency) + ' ' + GetCurrencyLocalString(totalIncome);
  totalExpense =
    GetCurrencySymbol(currency) + ' ' + GetCurrencyLocalString(totalExpense);
  totalBalance =
    GetCurrencySymbol(currency) + ' ' + GetCurrencyLocalString(totalBalance);

  tableBody += `
  <tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td>TOTAL INCOME</td>
    <td><span class='income bold'>${totalIncome}</span></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td>TOTAL EXPENSE</td>
    <td><span class='expense bold'>${totalExpense}</span></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td>BALANCE</td>
    <td><span class='${totalBalance < 0 ? 'expense' : 'income'} bold'>
    ${totalBalance}</span></td>
   </tr>


`;

  let html = `
<!DOCTYPE html>
<head>
 ${styles}
</head>
<body>
<h3 class='title'>${name}</h3>
  <table class="styled-table">
      <thead>
          <tr>
              ${tableHeads}
          </tr>
      </thead>
      <tbody>
          ${tableBody}
      </tbody>
   </table>
</body>

`;

  return html;
};

export const excelSheetAccountColWidth = [
  {wch: 5},
  {wch: 40},
  {wch: 40},
  {wch: 40},
  {wch: 40},
  {wch: 40},
];

export const getPdfAccountStyles = theme => `
      <style>
      .title{
        text-align : center;
      }
      img{
        height : 100px;
        widht : 100px;
        object-fit : contain;
      }
      .styled-table {
        border-collapse: collapse;
        margin: 25px 0;
        font-size: 0.9em;
        font-family: sans-serif;
        min-width: 400px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
      }
      .styled-table thead tr {
        background-color: ${theme.colors.brand.primary};
        color: #ffffff;
        text-align: left;
      }
      .styled-table th,
      .styled-table td {
          padding: 12px 15px;
      }

      .styled-table tbody tr {
        border-bottom: 1px solid #dddddd;
      }
    
      .styled-table tbody tr:nth-of-type(even) {
        background-color: #f3f3f3;
      }
    
      .styled-table tbody tr:last-of-type {
        border-bottom: 2px solid #009879;
      }

      .styled-table tbody tr.active-row {
        font-weight: bold;
        color: #009879;
      }
      .income{
        color : #198652;
      }
      .expense{
        color : tomato;
      }
      .bold{
        font-weight : bolder;
      }
    </style>
    `;

export const searchKeywordRegex = /^[^\s].*$/;

export const sendLocalNotification = (
  notification = {
    title: '',
    subtitle: '',
    message: '',
    image: null,
  },
  data,
) => {
  let {title, subtitle, message, image} = notification;
  let picturePath = image || 'notification/local_transaction_added.png';
  let pictureUrl = getFirebaseAccessUrl(picturePath);
  PushNotification.localNotification(
    {
      channelId: 'expenses-manager-local-notification',
      title: title,
      message: message,
      userInfo: data,
      ongoing: false,
      playSound: true,
      vibrate: true,
      vibration: 300,
      priority: 'high',
      invokeApp: false,
      allowWhileIdle: true,
      soundName: 'notification_primary.wav',
      picture: pictureUrl,
      bigPictureUrl: pictureUrl,
      largeIconUrl: pictureUrl,
      // only ios
      subtitle: subtitle,
      actions: ['Dismiss'],
    },
    scheduled => {},
  );
};
