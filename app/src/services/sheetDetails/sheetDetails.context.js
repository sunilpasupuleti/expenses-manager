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
  getLinkedDbRecord,
  hashCode,
  sendLocalNotification,
} from '../../components/utility/helper';
import remoteConfig from '@react-native-firebase/remote-config';
import {Alert, NativeEventEmitter, NativeModules, Platform} from 'react-native';
import moment from 'moment';
import {SheetsContext} from '../sheets/sheets.context';
import useHttp from '../../hooks/use-http';
import {useNetInfo} from '@react-native-community/netinfo';
import {WatermelonDBContext} from '../watermelondb/watermelondb.context';
import {Q} from '@nozbe/watermelondb';

const {AlarmManagerModule} = NativeModules;
const alarmEmitter =
  Platform.OS === 'android' ? new NativeEventEmitter(AlarmManagerModule) : null;

export const SheetDetailsContext = createContext({
  onSmartScanReceipt: (base64, callback) => null,

  onSaveSheetDetail: (sheetDetail, callback = () => null) => null,
  onDuplicateSheetDetail: (sheet, sheetDetail, callback = () => null) => null,
  onMoveSheetDetail: (oldSheet, sheet, sheetDetail, callback = () => null) =>
    null,
  onEditSheetDetail: (
    sheet,
    sheetDetailModel,
    sheetDetail,
    callback = () => null,
  ) => null,
  onChangeSheetDetailType: (sheet, sheetDetail, callback = () => null) => null,
  onDeleteSheetDetail: (sheet, sheetDetail, callback) => null,
  onCheckUpcomingSheetDetails: (sheet, callback) => null,

  onGetSheetsAndTransactions: () => {},
});

export const SheetDetailsContextProvider = ({children}) => {
  const {userData} = useContext(AuthenticationContext);
  const {onUpdateSheet} = useContext(SheetsContext);
  const {db, createRecord, findRecordById} = useContext(WatermelonDBContext);
  const {isConnected} = useNetInfo();

  const MINDEE_API_KEY = remoteConfig().getValue('MINDEE_API_KEY').asString();
  const MINDEE_API_URL = remoteConfig().getValue('MINDEE_API_URL').asString();
  const {sendRequest} = useHttp();

  const dispatch = useDispatch();

  useEffect(() => {
    // Upcoming sheetdetail
    if (Platform.OS === 'android' && db) {
      const subscription = alarmEmitter.addListener(
        'upcomingSheetDetail',
        async data => {
          if (!db) {
            console.log('no database exists intializing again');
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
  }, [db]);

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

              const matchingCategories = await db
                .get('categories')
                .query(
                  Q.where('userId', userData.id),
                  Q.where('type', 'expense'),
                  Q.where(
                    'name',
                    Q.like(`%${Q.sanitizeLikeString(extractedData.category)}%`),
                  ),
                )
                .fetch();

              if (matchingCategories.length > 0) {
                extractedData.category = matchingCategories[0]._raw;
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
        const newRecord = await createRecord('transactions', sheetDetail);

        if (sheetDetail.upcoming) {
          const timeInMillis = new Date(sheetDetail.date).getTime();

          const sheetIdHash = Math.abs(hashCode(sheet.id));
          const sheetDetailIdHash = Math.abs(hashCode(newRecord.id));
          const uniqueCode = Number(
            `${timeInMillis}${sheetIdHash % 1000}${sheetDetailIdHash % 1000}`,
          );

          let data = {
            sheetDetailId: newRecord.id,
            sheetId: sheet.id,
          };

          AlarmManagerModule?.scheduleAlarm(
            timeInMillis,
            'upcomingSheetDetail',
            JSON.stringify(data),
            uniqueCode,
          );
        }
        await onUpdateSheet(sheet);

        hideLoader();
        callback();
      };
      let {date, image} = sheetDetail;

      let upcoming = moment(date).isAfter(moment());
      sheetDetail.upcoming = upcoming ? true : false;

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
    sheetDetailModel,
    sheetDetail,
    callback = () => null,
  ) => {
    try {
      const editSheetDetail = async () => {
        delete sheetDetail.imageChanged;
        delete sheetDetail.imageDeleted;
        delete sheetDetail.image;
        await db.write(async () => {
          await sheetDetailModel.update(record => {
            Object.keys(sheetDetail).forEach(key => {
              record[key] = sheetDetail[key];
            });
          });
        });

        if (sheetDetail.upcoming) {
          const timeInMillis = new Date(sheetDetail.date).getTime();
          let data = {
            sheetDetailId: sheetDetail.id,
            sheetId: sheet.id,
          };
          const sheetIdHash = Math.abs(hashCode(sheet.id));
          const sheetDetailIdHash = Math.abs(hashCode(sheetDetail.id));
          const uniqueCode = Number(
            `${timeInMillis}${sheetIdHash % 1000}${sheetDetailIdHash % 1000}`,
          );

          AlarmManagerModule?.scheduleAlarm(
            timeInMillis,
            'upcomingSheetDetail',
            JSON.stringify(data),
            uniqueCode,
          );
        }
        await onUpdateSheet(sheet);
        hideLoader();
        callback();
      };

      let {date, image, imageChanged, imageDeleted} = sheetDetail;

      let upcoming = moment(date).isAfter(moment());

      sheetDetail.upcoming = upcoming ? true : false;

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
      const newType = sheetDetail.type === 'income' ? 'expense' : 'income';

      const categories = await db.get('categories');
      const defaultCategories = await categories
        .query(
          Q.where('userId', userData.id),
          Q.where('type', newType),
          Q.where('isDefault', true),
        )
        .fetch();
      const defaultCategoryId = defaultCategories[0]?.id;
      if (!defaultCategoryId) {
        throw `Default ${newType} category not found.`;
      }
      await db.write(async () => {
        await sheetDetail.update(record => {
          record.type = newType;
          record.categoryId = defaultCategoryId;
        });
      });

      await onUpdateSheet(sheet);
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
      const duplicateSheetDetail = async imageUrl => {
        const finalData = {
          ...sheetDetail._raw,
          imageUrl: imageUrl || null,
        };
        delete finalData._changed;
        delete finalData._status;
        delete finalData.id;
        delete finalData.created_at;
        delete finalData.updated_at;

        const newRecord = await createRecord('transactions', finalData);
        await onUpdateSheet(sheet);
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
        await duplicateSheetDetail(downloadURL);
      } else {
        await duplicateSheetDetail(null);
      }
    } catch (err) {
      hideLoader();
      showNotification('error', err.message || err.toString());
    }
  };

  const onMoveSheetDetail = async (
    oldSheet,
    sheet,
    sheetDetail,
    callback = () => null,
  ) => {
    try {
      let newSheetId = sheet.id;
      const moveSheetDetail = async (imageUrl = null) => {
        await db.write(async () => {
          await sheetDetail.markAsDeleted();
          await sheetDetail.destroyPermanently();
        });
        const finalData = {
          ...sheetDetail._raw,
          imageUrl: imageUrl || null,
          accountId: newSheetId,
        };
        delete finalData._changed;
        delete finalData._status;
        delete finalData.id;
        delete finalData.created_at;
        delete finalData.updated_at;

        // create new transaction
        await createRecord('transactions', finalData);
        await onUpdateSheet(oldSheet);
        await onUpdateSheet(sheet);

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
        await moveSheetDetail(downloadURL);
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
        await db.write(async () => {
          await sheetDetail.markAsDeleted();
          await sheetDetail.destroyPermanently();
        });
        await onUpdateSheet(sheet);
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
      const txn = await findRecordById(
        'transactions',
        'id',
        data.sheetDetailId,
      );
      const account = await getLinkedDbRecord(txn, 'account');

      if (!txn || !account) throw 'No transaction found';

      const {id: transaction_id, notes, imageUrl, date} = txn;
      const {name} = account;
      const currentDate = moment().set({second: 0, millisecond: 0});
      let upcoming = moment(date).isSameOrAfter(currentDate);
      if (upcoming) {
        await db.write(async () => {
          await txn.update(t => {
            t.upcoming = false;
          });

          // 🔁 Recalculate account totals
          const linkedTxns = await getLinkedDbRecord(account, 'transactions');
          const {
            income = 0,
            expense = 0,
            balance = 0,
          } = linkedTxns.reduce(
            (acc, t) => {
              if (t.upcoming) return acc; // Skip upcoming
              if (t.type === 'income') {
                acc.income += t.amount;
                acc.balance += t.amount;
              } else if (t.type === 'expense') {
                acc.expense += t.amount;
                acc.balance -= t.amount;
              }
              return acc;
            },
            {income: 0, expense: 0, balance: 0},
          );

          await account.update(a => {
            a.totalIncome = income;
            a.totalExpense = expense;
            a.totalBalance = balance;
          });
        });

        const notificationInfo = {
          title: `New Transaction ${notes ? `:${notes}` : ''}`,
          message: `Added to - ${name} `,
          image: imageUrl,
        };

        sendLocalNotification(notificationInfo, txn._raw);
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
      const now = moment();
      const query = sheet
        ? Q.and(Q.where('upcoming', true), Q.where('accountId', sheet.id))
        : Q.where('upcoming', true);

      const allUpcoming = await db.get('transactions').query(query).fetch();

      const toUpdate = allUpcoming.filter(t => {
        if (t.showTime) {
          return moment(t.time).isBefore(now);
        } else {
          return moment(t.date).isBefore(now, 'day');
        }
      });

      if (toUpdate.length > 0) {
        await db.write(async () => {
          for (const transaction of toUpdate) {
            await transaction.update(t => {
              t.upcoming = false;
            });
          }
        });

        // Send local notifications (if needed)
        for (const transaction of toUpdate) {
          const account = await transaction.account.fetch();
          const notificationInfo = {
            title: `New Transaction${
              transaction.notes ? `: ${transaction.notes}` : ''
            }`,
            message: `Added to - ${account.name}`,
            image: transaction.imageUrl,
          };

          sendLocalNotification(
            {...notificationInfo},
            {
              id: transaction.id,
              notes: transaction.notes,
              imageUrl: transaction.imageUrl,
              accountId: transaction.accountId,
            },
          );
        }

        // Callback only if the updated ones include this sheet
        if (sheet) {
          const exists = toUpdate.find(d => d.accountId === sheet.id);
          exists ? callback(true) : callback(false);
        } else {
          callback(true);
        }
      } else {
        callback(false);
      }

      if (sheet) {
        onUpdateSheet(sheet);
      } else {
        // If no sheet was passed, update all related sheets
        const accountIds = [...new Set(toUpdate.map(tx => tx.accountId))];

        for (const id of accountIds) {
          const account = await findRecordById('accounts', 'id', id);
          if (account) await onUpdateSheet(account);
        }
      }
    } catch (err) {
      showNotification('error', err.message || err.toString());
    }
  };

  const onGetSheetsAndTransactions = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!userData?.uid) return resolve([]);

        // Get all accounts for the user
        const accounts = await db
          .get('accounts')
          .query(Q.where('userId', userData.id))
          .fetch();

        const result = [];

        // Loop through each account and get related transactions
        for (let acc of accounts) {
          // Filter out upcoming = 1 transactions
          const transactions = await getLinkedDbRecord(acc, 'transactions');
          result.push(...transactions);
        }

        resolve(result);
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
