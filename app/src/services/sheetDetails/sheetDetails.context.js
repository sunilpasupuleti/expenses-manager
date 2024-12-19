import React, {useEffect} from 'react';
import {createContext, useContext} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import _ from 'lodash';
import {
  firebaseCopyMoveFile,
  firebaseRemoveFile,
  firebaseUploadFile,
  getDataFromRows,
  sendLocalNotification,
} from '../../components/utility/helper';
import remoteConfig from '@react-native-firebase/remote-config';
import {SQLiteContext} from '../sqlite/sqlite.context';
import {Alert, NativeEventEmitter, NativeModules, Platform} from 'react-native';
import moment from 'moment';
import {SheetsContext} from '../sheets/sheets.context';
import useHttp from '../../hooks/use-http';
import {useNetInfo} from '@react-native-community/netinfo';
import {
  transformAccountAndTransactionData,
  transformSheetDetails,
  transformSheetDetailsAnalytics,
  transformSheetDetailsDashboard,
  transformSheetDetailsTrends,
} from '../../components/utility/dataProcessHelper';
import {navigationRef} from '../../infrastructure/navigation/rootnavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';

const {AlarmManagerModule} = NativeModules;
const alarmEmitter =
  Platform.OS === 'android' ? new NativeEventEmitter(AlarmManagerModule) : null;

export const SheetDetailsContext = createContext({
  getSheetDetails: (sheet, searchKeyword) => null,
  getSheetDetailsDashboard: (sheet, categoryType) => null,
  getSheetDetailsAnalytics: (sheet, categoryType, key) => null,
  getSheetDetailsTrends: (sheet, categoryType, key) => null,
  onSmartScanReceipt: (base64, callback) => null,

  onSaveSheetDetail: (sheetDetail, callback = () => null) => null,
  onDuplicateSheetDetail: (sheet, sheetDetail, callback = () => null) => null,
  onMoveSheetDetail: (sheet, sheetDetail, callback = () => null) => null,
  onEditSheetDetail: (sheet, sheetDetail, callback = () => null) => null,
  onChangeSheetDetailType: (sheet, sheetDetail, callback = () => null) => null,
  onDeleteSheetDetail: (sheet, sheetDetail, callback) => null,
  onCheckUpcomingSheetDetails: (sheet, callback) => null,

  onGetSheetsAndTransactions: () => {},
});

export const SheetDetailsContextProvider = ({children}) => {
  const {userData} = useContext(AuthenticationContext);
  const {onGetAndSetCurrentSheet, currentSheet} = useContext(SheetsContext);
  const {
    createOrReplaceData,
    updateData,
    getData,
    deleteData,
    db,
    initializeDB,
    executeQuery,
  } = useContext(SQLiteContext);
  const {isConnected} = useNetInfo();

  const MINDEE_API_KEY = remoteConfig().getValue('MINDEE_API_KEY').asString();
  const MINDEE_API_URL = remoteConfig().getValue('MINDEE_API_URL').asString();
  const {sendRequest} = useHttp();

  const dispatch = useDispatch();

  useEffect(() => {
    // Upcoming sheetdetail
    if (Platform.OS === 'android') {
      const subscription = alarmEmitter.addListener(
        'upcomingSheetDetail',
        async data => {
          if (!db) {
            console.log('no database exists intializing again');
            await initializeDB(true);
          }
          // Giving time to initialize and setting the db variable
          setTimeout(() => {
            onSetUpcomingSheetDetailFromEvent(JSON.parse(data));
          }, 3000);
        },
      );

      return () => {
        subscription.remove();
      };
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (db) {
        await onCheckUpcomingSheetDetails();
      }
    })();
  }, [db]);

  // helpers
  const showLoader = (loaderType, backdrop = true) => {
    let options = {};
    if (loaderType) {
      options.loaderType = loaderType;
    }
    if (backdrop) {
      options.backdrop = backdrop;
    }

    dispatch(loaderActions.showLoader({...options}));
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

  const getSheetDetails = async (
    sheet,
    searchKeyword = null,
    filterByDate = {status: false, fromDate: null, toDate: null},
    upcomingScreen = false,
    categoryId = null,
    analyticsScreenReportKey = null,
  ) => {
    try {
      let {id} = sheet;
      let searchCondition = '';
      const {status, fromDate, toDate} = filterByDate || {};

      if (searchKeyword) {
        searchCondition = `AND (
          t.notes LIKE '%${searchKeyword}%' OR
          CAST(t.amount AS TEXT) LIKE '%${searchKeyword}%' OR
          c.name LIKE '%${searchKeyword}%'
        )`;
      }

      if (status) {
        searchCondition += ` AND t.date >= '${fromDate}' AND t.date <= '${toDate}'`;
      }

      if (categoryId !== null) {
        searchCondition += ` AND c.id=${categoryId}`;
      }

      if (analyticsScreenReportKey) {
        searchCondition += getReportKeyConditions(analyticsScreenReportKey);
      }

      // Query for transactions
      const commonQuery = `
        SELECT t.*, c.id AS categoryId, c.name AS categoryName, c.color AS categoryColor, 
        c.type AS categoryType, c.icon AS categoryIcon, DATE(t.date) as date
        FROM Transactions t
        LEFT JOIN Categories c ON t.categoryId = c.id
        WHERE t.accountId = ${id} AND upcoming=${
        upcomingScreen ? 1 : 0
      } ${searchCondition}
        ORDER BY DATE(t.date) DESC;
      `;

      const result = await getData(commonQuery);
      const rows = await getDataFromRows(result.rows);

      // Use the transformSheetDetails function to group transactions by date
      const transactions = transformSheetDetails(rows);

      // Query for total balance and counts
      const balanceAndCountQuery = `
      SELECT 
        SUM(CASE WHEN t.type = 'income' AND t.upcoming = 0 THEN t.amount ELSE 0 END) AS totalIncome,
        SUM(CASE WHEN t.type = 'expense' AND t.upcoming = 0 THEN t.amount ELSE 0 END) AS totalExpense,
        (SELECT COUNT(*) FROM Transactions WHERE accountId=${id} AND upcoming=0 ${searchCondition}) AS totalCount,
        (SELECT COUNT(*) FROM Transactions WHERE accountId=${id} AND upcoming=1 ${searchCondition}) AS totalUpcomingCount
      FROM Transactions t
      LEFT JOIN Categories c ON t.categoryId = c.id
      WHERE t.accountId = ${id} ${searchCondition};
    `;

      const balanceAndCountResult = await getData(balanceAndCountQuery);
      const balanceAndCountData = await getDataFromRows(
        balanceAndCountResult.rows,
      );

      const {
        totalIncome = 0,
        totalExpense = 0,
        totalCount = 0,
        totalUpcomingCount = 0,
      } = balanceAndCountData[0] || {};

      // Final data object with the required information
      const data = {
        totalCount,
        totalUpcomingCount,
        totalExpense,
        totalIncome,
        totalBalance: totalIncome - totalExpense,
        ...(upcomingScreen
          ? {upcomingTransactions: transactions}
          : {transactions}),
      };

      return data;
    } catch (e) {
      console.log('error retrieving sheet details data - ', e);
    }
  };

  const getSheetDetailsDashboard = async (sheet, categoryType) => {
    try {
      let {id} = sheet;

      const query = `
      SELECT t.*, c.id AS categoryId, c.name AS categoryName, c.color AS categoryColor, 
      c.type AS categoryType, c.icon AS categoryIcon
      FROM Transactions t
      LEFT JOIN Categories c ON t.categoryId = c.id
      WHERE t.accountId = ${id} AND t.upcoming = 0 AND c.type = '${categoryType}'
      ORDER BY c.id DESC;
    `;

      const result = await getData(query);
      const rows = await getDataFromRows(result.rows);

      const transformedData = transformSheetDetailsDashboard(rows);

      let totalCountQuery = `SELECT COUNT(*) AS totalCount FROM Transactions t LEFT JOIN Categories c ON t.categoryId = c.id WHERE accountId='${id}' AND upcoming = 0 AND c.type='${categoryType}'`;

      const totalCountResult = await getData(totalCountQuery);
      const totalCountData = await getDataFromRows(totalCountResult.rows);

      const data = {
        totalCount: totalCountData[0].totalCount || 0,
        transactions: transformedData,
      };
      return data;
    } catch (e) {
      console.log('error retrieving sheet details dashboard data - ', e);
    }
  };

  const getReportKeyConditions = key => {
    const onFormatDate = date => moment(date).format('YYYY-MM-DD');
    switch (key) {
      case 'daily':
        return ` AND DATE(t.date) = '${moment().format('YYYY-MM-DD')}'`;
      case 'last14days':
        const last14Start = onFormatDate(moment().subtract(14, 'days'));
        const last14End = onFormatDate(moment());
        return `
          AND DATE(t.date) BETWEEN '${last14Start}' AND '${last14End}'
      `;
      case 'last12months':
        const last12Start = onFormatDate(
          moment().subtract(12, 'months').startOf('month'),
        );
        const last12End = onFormatDate(
          moment().subtract(1, 'months').endOf('month'),
        );
        return `
          AND DATE(t.date) BETWEEN '${last12Start}' AND '${last12End}'
      `;
      case 'monthly':
        const monthStart = onFormatDate(moment().startOf('month'));
        const monthEnd = onFormatDate(moment().endOf('month'));
        return `
          AND DATE(t.date) BETWEEN '${monthStart}' AND '${monthEnd}'
        `;
      case 'weekly':
        const weekStart = onFormatDate(moment().startOf('week'));
        const weekEnd = onFormatDate(moment().endOf('week'));
        return `
          AND DATE(t.date) BETWEEN '${weekStart}' AND '${weekEnd}'
        `;
      case 'lastweek':
        const lastWeekStart = onFormatDate(
          moment().subtract(7, 'days').startOf('week'),
        );
        const lastWeekEnd = onFormatDate(moment(lastWeekStart).endOf('week'));
        return `
          AND DATE(t.date) BETWEEN '${lastWeekStart}' AND '${lastWeekEnd}'
        `;
      case 'yearly':
        const yearStart = onFormatDate(moment().startOf('year'));
        const yearEnd = onFormatDate(moment().endOf('year'));
        return `
          AND DATE(t.date) BETWEEN '${yearStart}' AND '${yearEnd}'
        `;
      default:
        return '';
    }
  };

  const getSheetDetailsAnalytics = async (sheet, categoryType, key = null) => {
    try {
      const {id} = sheet;

      let searchCondition = `
        WHERE t.accountId = ${id} AND t.upcoming = 0 AND c.type='${categoryType}'
      `;
      searchCondition += getReportKeyConditions(key);

      // Query to fetch transactions
      const transactionQuery = `
        SELECT t.*, 
          c.id AS categoryId, 
          c.name AS categoryName,
          c.color AS categoryColor,
          c.type AS categoryType,
          c.icon AS categoryIcon,
          SUM(t.amount) as totalAmount
        FROM Transactions t
        LEFT JOIN Categories c ON t.categoryId = c.id
        ${searchCondition}
        GROUP BY c.id
        ORDER BY totalAmount DESC;
      `;

      // Query to get the total balance
      const balanceQuery = `
        SELECT SUM(t.amount) AS totalBalance
        FROM Transactions t
        LEFT JOIN Categories c ON t.categoryId = c.id
        ${searchCondition};
      `;

      const [transactionResult, balanceResult] = await Promise.all([
        getData(transactionQuery),
        getData(balanceQuery),
      ]);

      const transactionRows = await getDataFromRows(transactionResult.rows);
      const balanceData = await getDataFromRows(balanceResult.rows);

      // Ensure totalBalance has a valid value
      const totalBalance = balanceData[0]?.totalBalance || 0;

      // Transform the transaction data
      const transactions = transformSheetDetailsAnalytics(
        transactionRows,
        totalBalance,
      );

      // Query to get the total count of transactions
      const totalCountQuery = `
        SELECT COUNT(*) AS totalCount
        FROM Transactions t
        LEFT JOIN Categories c ON t.categoryId = c.id
        ${searchCondition};
      `;

      const [totalCountResult] = await Promise.all([getData(totalCountQuery)]);
      const totalCountData = await getDataFromRows(totalCountResult.rows);

      return {
        totalCount: totalCountData[0]?.totalCount || 0,
        transactions,
        finalAmount: totalBalance, // Include the total balance as finalAmount
      };
    } catch (e) {
      console.error('Error retrieving sheet details analytics data:', e);
    }
  };

  const getSheetDetailsTrends = async (sheet, categoryType) => {
    try {
      const {id} = sheet;

      // Define the base search condition
      const baseCondition = `
        WHERE t.accountId = ${id} AND t.upcoming = 0 AND c.type='${categoryType}'
      `;

      // Configuration for both 14 days and 12 months trends
      const trendsConfig = {
        last14days: {
          searchCondition: baseCondition + getReportKeyConditions('last14days'),
          groupBy: 'DATE(t.date)', // Group by date for 14 days
          dateKey: 'date', // Label for date grouping
        },
        last12months: {
          searchCondition:
            baseCondition + getReportKeyConditions('last12months'),
          groupBy: `strftime('%Y-%m', t.date)`, // Group by month for 12 months
          dateKey: 'month', // Label for month grouping
        },
      };

      // Base query structure to retrieve transactions
      const transactionQuery = (searchCondition, groupBy) => `
        SELECT t.*, 
          c.id AS categoryId, 
          c.name AS categoryName,
          c.color AS categoryColor,
          c.type AS categoryType,
          c.icon AS categoryIcon,
          ${groupBy} AS dateKey
        FROM Transactions t
        LEFT JOIN Categories c ON t.categoryId = c.id
        ${searchCondition}
        GROUP BY t.id, ${groupBy}
        ORDER BY ${groupBy} DESC;
      `;

      // Function to get total count query
      const totalCountQuery = searchCondition => `
        SELECT COUNT(*) AS totalCount
        FROM Transactions t
        LEFT JOIN Categories c ON t.categoryId = c.id
        ${searchCondition};
      `;

      // Execute queries for both 14 days and 12 months trends
      const [
        last14DaysTotalCountResult,
        last12MonthsTotalCountResult,
        last14DaysResult,
        last12MonthsResult,
      ] = await Promise.all([
        getData(totalCountQuery(trendsConfig.last14days.searchCondition)),
        getData(totalCountQuery(trendsConfig.last12months.searchCondition)),
        getData(
          transactionQuery(
            trendsConfig.last14days.searchCondition,
            trendsConfig.last14days.groupBy,
          ),
        ),
        getData(
          transactionQuery(
            trendsConfig.last12months.searchCondition,
            trendsConfig.last12months.groupBy,
          ),
        ),
      ]);

      // Convert results to usable data
      const last14DaysTotalCountData = await getDataFromRows(
        last14DaysTotalCountResult.rows,
      );
      const last12MonthsTotalCountData = await getDataFromRows(
        last12MonthsTotalCountResult.rows,
      );
      const last14DaysData = await getDataFromRows(last14DaysResult.rows);
      const last12MonthsData = await getDataFromRows(last12MonthsResult.rows);

      // Transform the data into trends format
      const last14DaysTransactions =
        transformSheetDetailsTrends(last14DaysData);
      const last12MonthsTransactions =
        transformSheetDetailsTrends(last12MonthsData);

      // Return the final structured data
      return {
        last14DaysTotalCount: last14DaysTotalCountData[0]?.totalCount || 0,
        last12MonthsTotalCount: last12MonthsTotalCountData[0]?.totalCount || 0,
        last14DaysTransactions,
        last12MonthsTransactions,
      };
    } catch (e) {
      console.error('Error retrieving sheet details trends:', e);
    }
  };

  const onSmartScanReceipt = async (base64, callback = () => null) => {
    if (!base64) {
      Alert.alert('Required base64 string');
      return;
    }
    showLoader('scanning');

    let url = MINDEE_API_URL;
    let formData = new FormData();
    formData.append('document', base64);

    sendRequest(
      {
        type: 'POST',
        url: url,
        headers: {
          Authorization: `Token ${MINDEE_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        data: formData,
        // extra data to use-http hook
      },
      {
        successCallback: async receivedResponse => {
          hideLoader();
          if (
            receivedResponse?.api_request?.status === 'success' &&
            receivedResponse?.document?.inference?.prediction
          ) {
            let {total_amount, date, supplier_name, category} =
              receivedResponse.document.inference.prediction;
            let amount = total_amount.value;
            if (amount === null) {
              showNotification('warning', 'No Text found !');
              return;
            } else {
              let fetchedDate = date.value;
              let notes = supplier_name.value;
              let fetchedCategory = category.value;
              if (!fetchedDate || !moment(fetchedDate).isValid()) {
                fetchedDate = null;
              }
              let extractedData = {
                amount: amount,
                date: fetchedDate,
                notes: notes,
                category: fetchedCategory,
                type: 'expense',
                newCategoryIdentified: true,
              };
              const query = `
                SELECT * FROM Categories 
                WHERE uid = '${userData.uid}' AND type='expense' AND (
                  name LIKE '%${fetchedCategory}%'
                );
              `;
              const result = await getData(query);
              const rows = await getDataFromRows(result.rows);
              if (rows[0]) {
                extractedData.category = rows[0];
                extractedData.newCategoryIdentified = false;
              }
              callback(extractedData);
            }
          } else {
            console.log(receivedResponse.api_request);
            hideLoader();
            showNotification(
              'warning',
              'Something error occured while extracting text!',
            );
          }
        },
        errorCallback: err => {
          console.log(err, ' Error in scanning receipt');
          hideLoader();
          showNotification(
            'warning',
            'Something error occured while extracting text!',
          );
        },
      },
    );
  };

  const onSaveSheetDetail = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    try {
      const saveSheetDetail = async () => {
        delete sheetDetail.image;
        let result = await createOrReplaceData('Transactions', sheetDetail);
        if (sheetDetail.upcoming) {
          const timeInMillis = new Date(sheetDetail.date).getTime();
          const uniqueCode = Number(`${sheet.id}${result.insertId}`);

          let data = {
            sheetDetailId: result.insertId,
            sheetId: sheet.id,
          };

          AlarmManagerModule.scheduleAlarm(
            timeInMillis,
            'upcomingSheetDetail',
            JSON.stringify(data),
            uniqueCode,
          );
        }

        await onGetAndSetCurrentSheet(sheet.id);
        hideLoader();
        callback();
      };
      let {date, image} = sheetDetail;

      let upcoming = moment(date).isAfter(moment());
      if (upcoming) {
        sheetDetail.upcoming = 1;
      }

      if (image && image.url) {
        if (!isConnected) {
          throw 'No Internet Connection to Upload the Image';
        }
        let imageTypesAllowed = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!imageTypesAllowed.includes(image.type)) {
          showNotification('error', 'Only JPEG, PNG images are allowed');
          return;
        }
        let pictureName = `${Date.now().toString()}.${image.extension}`;
        let uploadPath = `users/${userData.uid}/${sheet.id}/${pictureName}`;
        showLoader('image_upload');
        let downloadURL = await firebaseUploadFile(uploadPath, image.uri);
        sheetDetail.imageUrl = downloadURL;
        sheetDetail.imageType = image.type;
        sheetDetail.imageExtension = image.extension;
        await saveSheetDetail();
      } else {
        await saveSheetDetail();
      }
    } catch (err) {
      hideLoader();
      showNotification('error', err.message || err.toString());
    }
  };

  const onEditSheetDetail = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    try {
      const editSheetDetail = async () => {
        delete sheetDetail.imageChanged;
        delete sheetDetail.imageDeleted;
        delete sheetDetail.image;
        let result = await updateData(
          'Transactions',
          sheetDetail,
          `WHERE id=?`,
          [sheetDetail.id],
        );

        if (sheetDetail.upcoming) {
          const timeInMillis = new Date(sheetDetail.date).getTime();
          let data = {
            sheetDetailId: sheetDetail.id,
            sheetId: sheet.id,
          };
          const uniqueCode = Number(`${sheet.id}${sheetDetail.id}`);

          AlarmManagerModule.scheduleAlarm(
            timeInMillis,
            'upcomingSheetDetail',
            JSON.stringify(data),
            uniqueCode,
          );
        }

        await onGetAndSetCurrentSheet(sheet.id);
        hideLoader();
        callback();
      };

      let {date, image, imageChanged, imageDeleted} = sheetDetail;

      let upcoming = moment(date).isAfter(moment());

      if (upcoming) {
        sheetDetail.upcoming = 1;
      } else {
        sheetDetail.upcoming = 0;
      }

      // image chagned delete previous image
      if (imageChanged && image?.url) {
        if (!isConnected) {
          throw 'No Internet Connection to Upload the Image';
        }

        showLoader('image_upload');

        await firebaseRemoveFile(image.url);
        let imageTypesAllowed = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!imageTypesAllowed.includes(image.type)) {
          showNotification('error', 'Only JPEG, PNG images are allowed');
          return;
        }
        let pictureName = `${Date.now().toString()}.${image.extension}`;
        let uploadPath = `users/${userData.uid}/${sheet.id}/${pictureName}`;
        let downloadURL = await firebaseUploadFile(uploadPath, image.uri);
        sheetDetail.imageUrl = downloadURL;
        sheetDetail.imageType = image.type;
        sheetDetail.imageExtension = image.extension;
        await editSheetDetail();
      } else if (imageDeleted) {
        if (!isConnected) {
          throw 'No Internet Connection to delete the Image';
        }
        showLoader('image_upload');
        await firebaseRemoveFile(image.url);
        sheetDetail.imageUrl = null;
        sheetDetail.imageType = null;
        sheetDetail.imageExtension = null;
        hideLoader();
        await editSheetDetail();
      } else {
        await editSheetDetail();
      }
    } catch (err) {
      hideLoader();
      showNotification('error', err.message || err.toString());
    }
  };

  const onChangeSheetDetailType = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    try {
      if (sheetDetail.type === 'income') {
        sheetDetail.type = 'expense';
      } else {
        sheetDetail.type = 'income';
      }
      // assign default category
      let query = `SELECT id from Categories WHERE uid='${userData.uid}' AND type = '${sheetDetail.type}' AND isDefault = 1`;
      let queryResult = await getData(query);
      let queryData = await getDataFromRows(queryResult.rows);
      let defaultCategoryId = queryData[0]?.id;
      let result = await updateData(
        'Transactions',
        {
          type: sheetDetail.type,
          categoryId: defaultCategoryId,
        },
        `WHERE id=?`,
        [sheetDetail.id],
      );
      await onGetAndSetCurrentSheet(sheet.id);

      hideLoader();
      callback();
    } catch (err) {
      hideLoader();
      showNotification('error', err.message || err.toString());
    }
  };

  const onDuplicateSheetDetail = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    try {
      const duplicateSheetDetail = async () => {
        delete sheetDetail.category;
        delete sheetDetail.id;
        let result = await createOrReplaceData('Transactions', sheetDetail);
        await onGetAndSetCurrentSheet(sheet.id);
        hideLoader();
        callback();
      };

      let {imageUrl, imageType, imageExtension} = sheetDetail;

      if (imageUrl) {
        showLoader();
        let pictureName = `${Date.now().toString()}.${imageExtension}`;
        let uploadPath = `users/${userData.uid}/${sheet.id}/${pictureName}`;
        let downloadURL = await firebaseCopyMoveFile(
          'copy',
          imageType,
          imageUrl,
          uploadPath,
        );
        sheetDetail.imageUrl = downloadURL;
        await duplicateSheetDetail();
      } else {
        await duplicateSheetDetail();
      }
    } catch (err) {
      hideLoader();
      showNotification('error', err.message || err.toString());
    }
  };

  const onMoveSheetDetail = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    try {
      let currentSheetId = sheetDetail.accountId;
      let currentSheetDetailId = sheetDetail.id;
      let newSheetId = sheet.id;
      const moveSheetDetail = async () => {
        delete sheetDetail.category;
        delete sheetDetail.id;
        sheetDetail.accountId = newSheetId;
        // delete transaction from current account
        await deleteData('Transactions', 'WHERE id=?', [currentSheetDetailId]);
        // create new transaction
        await createOrReplaceData('Transactions', sheetDetail);
        await onGetAndSetCurrentSheet(currentSheetId);

        hideLoader();
        callback();
      };

      let {imageUrl, imageType, imageExtension} = sheetDetail;

      if (imageUrl) {
        showLoader();
        let pictureName = `${Date.now().toString()}.${imageExtension}`;
        let uploadPath = `users/${userData.uid}/${newSheetId}/${pictureName}`;
        let downloadURL = await firebaseCopyMoveFile(
          'move',
          imageType,
          imageUrl,
          uploadPath,
        );
        sheetDetail.imageUrl = downloadURL;
        await moveSheetDetail();
      } else {
        await moveSheetDetail();
      }
    } catch (err) {
      hideLoader();
      showNotification('error', err.message || err.toString());
    }
  };

  const onDeleteSheetDetail = async (
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    try {
      const deleteSheetDetail = async () => {
        await deleteData('Transactions', 'WHERE id=?', [sheetDetail.id]);
        await onGetAndSetCurrentSheet(sheet.id);
        callback();
      };

      await deleteSheetDetail();
      if (sheetDetail.imageUrl) {
        await firebaseRemoveFile(sheetDetail.imageUrl);
      }
    } catch (err) {
      showNotification('error', err.message || err.toString());
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

      let result = await getData(query);

      let resultData = await getDataFromRows(result.rows);

      if (!resultData[0]) {
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

        const updateResult = await executeQuery(updateQuery);

        const notificationInfo = {
          title: `New Transaction ${notes ? `:${notes}` : ''}`,
          message: `Added to - ${name} `,
          image: imageUrl,
        };
        const currentRoute = navigationRef?.current?.getCurrentRoute();
        const activeRoute = currentRoute?.name;

        if (activeRoute) {
          const reRenderSubRoutes = [
            'SheetStats',
            'SheetTrends',
            'Dashboard',
            'Transactions',
          ];
          if (
            reRenderSubRoutes.includes(activeRoute) &&
            currentSheet?.id === data?.sheetId
          ) {
            return navigationRef.current.setParams({reRender: true});
          }

          navigationRef.current.setParams({reRender: true});
        }

        sendLocalNotification(notificationInfo, resultData);
      }
    } catch (err) {
      console.log(err.message);

      // showNotification('error', err.message || err.toString());
    }
  };

  const onCheckUpcomingSheetDetails = async (
    sheet = null,
    callback = () => null,
  ) => {
    try {
      let query = `SELECT * FROM Transactions
      WHERE upcoming = 1
      AND CASE
            WHEN showTime = 1 THEN datetime(time) < datetime('now', 'localtime')
            ELSE date(date) < date('now', 'localtime')
      END`;
      if (sheet) {
        query += ` AND accountId=${sheet.id}`;
      }
      let result = await getData(query);
      let data = await getDataFromRows(result.rows);
      // if there are upcoming transactions
      if (data.length > 0) {
        let updateQuery = `
        UPDATE Transactions
        SET upcoming = 0
        WHERE CASE
                WHEN showTime = 1 THEN datetime(time) < datetime('now', 'localtime')
                ELSE date(date) < date('now', 'localtime')
        END
        AND upcoming = 1
        `;
        if (sheet) {
          query += ` AND accountId=${sheet.id}`;
        }

        await executeQuery(updateQuery);
        data.forEach(async transaction => {
          let {accountId} = transaction;
          let accountResult = await getData(
            `SELECT * FROM Accounts WHERE id=${accountId}`,
          );
          let accountData = await getDataFromRows(accountResult.rows)?.[0];
          const notificationInfo = {
            title: `New Transaction ${
              transaction.notes ? `:${transaction.notes}` : ''
            }`,
            message: `Added to - ${accountData.name} `,
            image: transaction.imageUrl,
          };
          sendLocalNotification(notificationInfo, transaction);
        });
        if (sheet) {
          let exists = data.find(d => d.accountId === sheet.id);
          exists ? callback(true) : callback();
        } else {
          callback();
        }
      } else {
        callback();
      }
    } catch (err) {
      showNotification('error', err.message || err.toString());
    }
  };

  const onGetSheetsAndTransactions = async () => {
    return new Promise(async (resolve, reject) => {
      let {uid} = userData;

      try {
        let query = `
          SELECT 
            a.id AS accountId, 
            a.name AS accountName,
            a.totalBalance AS accountBalance,
            t.id AS transactionId, 
            t.amount AS transactionAmount, 
            t.date AS transactionDate, 
            t.notes AS transactionNotes,
            t.type AS transactionType,
            c.id AS categoryId, 
            c.name AS categoryName, 
            c.color AS categoryColor, 
            c.type AS categoryType,
            c.icon AS categoryIcon
          FROM Transactions t
          LEFT JOIN Accounts a ON t.accountId = a.id
          LEFT JOIN Categories c ON t.categoryId = c.id
          WHERE a.uid = '${uid}' AND t.upcoming = 0
          ORDER BY t.accountId, t.date;
        `;

        let result = await getData(query);
        let data = await getDataFromRows(result.rows);

        // Use the reusable helper function to transform the data
        let finalResult = transformAccountAndTransactionData(data);

        resolve(finalResult);
      } catch (e) {
        reject(e);
      }
    });
  };

  return (
    <SheetDetailsContext.Provider
      value={{
        onSaveSheetDetail,
        onEditSheetDetail,
        onDeleteSheetDetail,
        getSheetDetails,
        getSheetDetailsDashboard,
        getSheetDetailsAnalytics,
        getSheetDetailsTrends,
        onChangeSheetDetailType,
        onDuplicateSheetDetail,
        onMoveSheetDetail,
        onCheckUpcomingSheetDetails,
        onSmartScanReceipt,
        onGetSheetsAndTransactions,
      }}>
      {children}
    </SheetDetailsContext.Provider>
  );
};
