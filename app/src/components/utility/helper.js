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
import SInfo from 'react-native-sensitive-info';

export const repaymentFrequencyOptions = [
  {key: 'daily', value: 'Every Day', unit: 'days', step: 1},
  {key: 'weekly', value: 'Every Week', unit: 'weeks', step: 1},
  {key: 'biweekly', value: 'Every 2 Weeks', unit: 'weeks', step: 2},
  {key: 'semi_monthly', value: 'Every Half Month', unit: 'days', step: 15},
  {key: 'monthly', value: 'Every Month', unit: 'months', step: 1},
  {key: 'quarterly', value: 'Every Quarter', unit: 'months', step: 3},
  {key: 'semi_annually', value: 'Every 6 Months', unit: 'months', step: 6},
  {key: 'yearly', value: 'Every Year', unit: 'years', step: 1},
];

export const getFrequencyInterval = frequencyKey => {
  const match = repaymentFrequencyOptions.find(opt => opt.key === frequencyKey);
  return match
    ? {unit: match.unit, step: match.step}
    : {unit: 'months', step: 1};
};

export const getNextEmiAcrossAccounts = (loanSheets = [], days = 10) => {
  const today = moment().startOf('day');
  const targetDate = moment().add(days, 'days').endOf('day');

  // console.log(today, targetDate);

  const emis = loanSheets
    .map(sheet => {
      const {upcomingEmis} = getEmiDates(
        sheet.loanStartDate,
        sheet.repaymentFrequency,
        sheet.loanYears,
        sheet.loanMonths,
        1,
      );
      return upcomingEmis.length
        ? {date: upcomingEmis[0], name: sheet.name, sheetId: sheet.id}
        : null;
    })
    .filter(Boolean)
    .filter(emi =>
      moment(emi.date, 'YYYY-MM-DD').isBetween(
        today,
        targetDate,
        undefined,
        '[]',
      ),
    )
    .sort((a, b) => moment(a.date).diff(moment(b.date)));

  return emis.length > 0 ? emis : [];
};

export const getEmiDates = (
  loanStartDate,
  repaymentFrequency,
  loanYears,
  loanMonths,
  count = 3,
) => {
  const {unit, step} = getFrequencyInterval(repaymentFrequency);
  const start = moment(loanStartDate).startOf('day');
  const end = start
    .clone()
    .add(loanYears || 0, 'years')
    .add(loanMonths || 0, 'months');
  const today = moment().startOf('day');

  const upcomingEmis = [];
  const allEmis = [];

  let i = 0;
  while (true) {
    // const emiDate = start.clone().add(i * step, unit);
    const emiDate = start.clone().add((i + 1) * step, unit);
    if (emiDate.isAfter(end)) break;

    allEmis.push(emiDate.format('YYYY-MM-DD'));

    if (emiDate.isAfter(today) && upcomingEmis.length < count) {
      upcomingEmis.push(emiDate.format('YYYY-MM-DD'));
    }

    i++;
  }

  return {
    upcomingEmis,
    allEmis,
  };
};

export const generateAmortizationSchedule = ({
  loanAmount,
  interestRate,
  totalPayments,
  repaymentFrequency,
  startDate,
  transactions = [],
}) => {
  const schedule = [];
  const {unit, step} = getFrequencyInterval(repaymentFrequency);
  const start = moment(startDate).startOf('day');

  const rateDivisor =
    {
      daily: 365,
      weekly: 52,
      biweekly: 26,
      semi_monthly: 24,
      monthly: 12,
      quarterly: 4,
      semi_annually: 2,
      yearly: 1,
    }[repaymentFrequency] || 12;

  const r = interestRate / 100 / rateDivisor;
  const P = loanAmount;
  const emi =
    r === 0
      ? P / totalPayments
      : (P * r * Math.pow(1 + r, totalPayments)) /
        (Math.pow(1 + r, totalPayments) - 1);

  let balance = P;

  for (let i = 0; i < totalPayments && balance > 0.01; i++) {
    const scheduledDate = start.clone().add((i + 1) * step, unit);
    const scheduledDateStr = scheduledDate.format('YYYY-MM-DD');
    let emiPaid = false;

    for (let tx of transactions) {
      if (
        tx.isEmiPayment &&
        tx.emiDate === scheduledDateStr &&
        moment(tx.date).format('YYYY-MM-DD') === scheduledDateStr
      ) {
        emiPaid = true;
        break;
      }
    }

    const interest = balance * r;
    let principal = emi - interest;

    if (principal > balance) {
      principal = balance;
    }
    const totalPayment = principal + interest;
    schedule.push({
      date: scheduledDate.format('YYYY-MM-DD'),
      principal: parseFloat(principal.toFixed(2)),
      interest: parseFloat(interest.toFixed(2)),
      totalPayment: parseFloat(totalPayment.toFixed(2)),
      emiPaid,
    });

    balance -= principal;
    if (balance < 0.01) {
      break;
    }
  }

  return schedule;
};

/**
 * Calculate total principal paid and outstanding balance
 * @param {Array} schedule - Amortization schedule [{ date, principal, interest }]
 * @param {Array} transactions - User payments [{ date, amount }]
 * @param {number} loanAmount - Original loan amount
 * @returns {Object} { totalPrincipalPaid, outstandingPrincipal }
 */
export function calculatePrincipalPaid(
  schedule,
  transactions,
  loanAmount,
  totalRepayable,
) {
  const today = moment().format('YYYY-MM-DD');
  // Step 1: Calculate total amount paid across all transactions
  const totalAmountPaid = transactions.reduce(
    (sum, txn) => sum + txn.amount,
    0,
  );

  let remainingAmount = totalAmountPaid;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalPrepayments = 0;
  let scheduleIndex = 0;

  console.log('=== LOAN CALCULATION START ===');
  console.log('Loan Amount:', loanAmount);
  console.log('Total Repayable:', totalRepayable);
  console.log('Total Transactions Made:', transactions.length);
  console.log('Total Amount Paid:', totalAmountPaid);
  console.log('Now allocating through EMI schedule...');
  console.log('=====================================\n');

  // Step 2: Allocate the total amount through EMI schedule
  while (remainingAmount > 0 && scheduleIndex < schedule.length) {
    const emi = schedule[scheduleIndex];
    const emiDate = emi.date;
    const interestDue = emi.interest;
    const principalDue = emi.principal;
    const isFutureEmi = moment(emiDate).isAfter(today);

    console.log(`📋 Processing EMI ${scheduleIndex + 1}:`);
    console.log(
      `   EMI Date: ${emiDate} (${isFutureEmi ? 'FUTURE' : 'PAST/TODAY'})`,
    );
    console.log(`   Interest Due: ₹${interestDue}`);
    console.log(`   Principal Due: ₹${principalDue}`);
    console.log(`   Remaining Amount: ₹${remainingAmount}`);

    // If EMI is in the future, treat any payment as prepayment
    if (isFutureEmi) {
      totalPrepayments = remainingAmount;
      totalPrincipalPaid += remainingAmount;
      console.log(
        `💰 FUTURE EMI - Treating ₹${remainingAmount} as PREPAYMENT (directly reduces principal)`,
      );
      remainingAmount = 0;
      break; // Stop processing further EMIs
    }

    if (remainingAmount >= interestDue) {
      // Pay interest first
      totalInterestPaid += interestDue;
      remainingAmount -= interestDue;
      console.log(`   ✅ Interest Paid: ₹${interestDue}`);

      if (remainingAmount >= principalDue) {
        // Pay full scheduled principal
        totalPrincipalPaid += principalDue;
        remainingAmount -= principalDue;
        console.log(`   ✅ Principal Paid: ₹${principalDue}`);
        console.log(`   🎉 EMI ${scheduleIndex + 1} COMPLETED!`);
        scheduleIndex++; // Move to next EMI
      } else if (remainingAmount > 0) {
        // Pay partial principal
        totalPrincipalPaid += remainingAmount;
        console.log(`   ⚠️  Partial Principal Paid: ₹${remainingAmount}`);
        remainingAmount = 0;
        // Don't increment scheduleIndex - EMI partially paid
      }
    } else if (remainingAmount > 0) {
      // Can only pay partial interest
      totalInterestPaid += remainingAmount;
      console.log(`   ⚠️  Partial Interest Paid: ₹${remainingAmount}`);
      remainingAmount = 0;
      // Don't increment scheduleIndex - EMI partially paid
    }

    console.log(
      `   Remaining after EMI ${scheduleIndex + 1}: ₹${remainingAmount}`,
    );
    console.log('   ─────────────────────────────────────\n');
  }

  // Step 3: Any remaining amount is prepayment (directly reduces principal)
  if (remainingAmount > 0) {
    totalPrepayments += remainingAmount;
    totalPrincipalPaid += remainingAmount;
    console.log(
      `💰 ADDITIONAL PREPAYMENT: ₹${remainingAmount} (directly reduces principal)\n`,
    );
  }

  // For reducing balance method: Remaining Balance = Total Repayable - Total Paid
  const outstandingPrincipal = Math.max(0, loanAmount - totalPrincipalPaid);
  const remainingBalance = Math.max(0, totalRepayable - totalPrincipalPaid);

  const result = {
    totalPrincipalPaid: Number(totalPrincipalPaid.toFixed(2)),
    totalInterestPaid: Number(totalInterestPaid.toFixed(2)),
    outstandingPrincipal: Number(outstandingPrincipal.toFixed(2)),
    remainingBalance: Number(remainingBalance.toFixed(2)),
    totalPrepayments: Number(totalPrepayments.toFixed(2)),
    emisCompleted: scheduleIndex,
    transactionsProcessed: transactions.length,
    totalAmountProcessed: Number(totalAmountPaid.toFixed(2)),
  };

  console.log('🏁 FINAL CALCULATION RESULT:');
  console.log('═══════════════════════════════════════');
  console.log(`💳 Total Amount Paid: ₹${result.totalAmountProcessed}`);
  console.log(`📈 Interest Portion: ₹${result.totalInterestPaid}`);
  console.log(`🏠 Principal Portion: ₹${result.totalPrincipalPaid}`);
  console.log(`💰 Prepayments Made: ₹${result.totalPrepayments}`);
  console.log(`✅ EMIs Completed: ${result.emisCompleted}`);
  console.log(`💸 Outstanding Principal: ₹${result.outstandingPrincipal}`);
  console.log(`Remaining Balance: ₹${result.remainingBalance}`);
  console.log('═══════════════════════════════════════');

  // Verification
  const totalSplit = result.totalInterestPaid + result.totalPrincipalPaid;
  console.log(`\n🔍 VERIFICATION:`);
  console.log(`Interest + Principal = ₹${totalSplit.toFixed(2)}`);
  console.log(`Should equal Total Paid: ₹${result.totalAmountProcessed}`);
  console.log(
    `✅ Match: ${
      totalSplit.toFixed(2) === result.totalAmountProcessed.toFixed(2)
        ? 'YES'
        : 'NO'
    }`,
  );
  const fixedEmi = schedule[0].principal + schedule[0].interest;
  const newSchedule = generateAmortizationSchedule({
    loanAmount: outstandingPrincipal,
    interestRate: 7,
    totalPayments: 500,
    repaymentFrequency: 'monthly',
    startDate: moment().format('YYYY-MM-DD'),
  });
  return result;
}

export const compoundingOptions = [
  {key: 'annually', value: 'Annually (APY)'},
  {key: 'semi_annually', value: 'Semi-annually'},
  {key: 'quarterly', value: 'Quarterly'},
  {key: 'monthly', value: 'Monthly (APR)'},
  {key: 'semi_monthly', value: 'Semi-monthly'},
  {key: 'biweekly', value: 'Biweekly'},
  {key: 'weekly', value: 'Weekly'},
  {key: 'daily', value: 'Daily'},
  {key: 'continuously', value: 'Continuously'},
];

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

export const getLinkedDbRecord = (data = {}, key = '') => {
  return new Promise(async (resolve, reject) => {
    try {
      const record = await data[key]?.fetch();
      resolve(record);
    } catch (err) {
      reject(err);
    }
  });
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
    notificationId: Math.floor(Math.random() * 100000).toString(),
  },
  data,
  scheduleDate = null,
) => {
  let {title, subtitle, message, image, notificationId} = notification;
  let picturePath = image || 'notification/local_transaction_added.png';
  let pictureUrl = getFirebaseAccessUrl(picturePath);

  const baseNotification = {
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
  };
  if (notificationId) {
    baseNotification.id = notificationId;
  }
  if (scheduleDate) {
    baseNotification.date = new Date(scheduleDate);

    PushNotification.localNotificationSchedule(baseNotification);
  } else {
    PushNotification.localNotification(baseNotification);
  }
};

export const cancelLocalNotification = (notificationId, cancelAll = false) => {
  if (cancelAll) {
    PushNotification.cancelAllLocalNotifications();
  } else {
    PushNotification.cancelLocalNotification(notificationId);
  }
};

export const saveSensitiveInfo = async (name, data) => {
  await SInfo.setItem(name, data, {
    sharedPreferencesName: 'expensesmanager_secure_storage',
    keychainService: 'expensesmanager_secure_keychain',
  });
};

export const getSensitiveInfo = async name => {
  return await SInfo.getItem(name, {
    sharedPreferencesName: 'expensesmanager_secure_storage',
    keychainService: 'expensesmanager_secure_keychain',
  });
};
