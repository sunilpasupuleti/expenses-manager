/* eslint-disable handle-callback-err */
/* eslint-disable quotes */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState} from 'react';
import {createContext, useContext, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {setChangesMade} from '../../store/service-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import {SheetsContext} from '../sheets/sheets.context';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'react-native-crypto-js';
import {Alert} from 'react-native';

export const SyncContext = createContext({
  backUpData: () => null,
  restoreData: () => null,
  backUpAndRestore: () => null,
  onGetRestoreDates: () => null,
  dataSecurity: {
    show: Boolean,
    value: String,
    type: String,
    callback: () => null,
  },
  setDataSecurity: null,
});

export const SyncContextProvider = ({children}) => {
  const {userData, onGetUserDetails, userAdditionalDetails} = useContext(
    AuthenticationContext,
  );
  const {expensesData, onSaveExpensesData} = useContext(SheetsContext);
  const changesMade = useSelector(state => state.service.changesMade);
  const dispatch = useDispatch();

  useEffect(() => {
    if (userData) {
      if (changesMade.loaded) {
        if (changesMade.status === false) {
          restoreData();
        }
      }
    }
  }, [userData, changesMade.status]);

  const backUpData = async () => {
    if (!expensesData) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'There is no data to create back up.',
        }),
      );
      return;
    }

    try {
      dispatch(
        loaderActions.showLoader({backdrop: true, loaderType: 'backup'}),
      );

      // Encrypt
      let encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(expensesData),
        userData.uid,
      ).toString();

      await firestore()
        .collection(userData.uid)
        .get()
        .then(async data => {
          if (data.docs && data.docs.length > 0) {
            let initialLength = 10;
            // let presentLength = data.docs.length;
            let docs = [];
            data.docs.filter(d => {
              if (d.id !== 'user-data') {
                docs.push(moment(d.id).format('YYYY-MM-DD A hh:mm:ss'));
              }
            });
            docs.sort();
            let toDeleteLength = Math.abs(initialLength - docs.length);
            dispatch(loaderActions.hideLoader());
            if (docs.length > initialLength) {
              for (let i = 0; i < toDeleteLength; i++) {
                let doc;
                data.docs.filter(d => {
                  if (
                    docs[i] === moment(d.id).format('YYYY-MM-DD A hh:mm:ss')
                  ) {
                    doc = d;
                  }
                });
                await doc.ref.delete();
              }
            }
          }
        });

      await firestore()
        .collection(userData.uid)
        .doc(moment().format('DD MMM YYYY hh:mm:ss a'))
        .set({
          encryptedData,
        })
        .then(ref => {
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message: 'Your data backed up safely.',
            }),
          );
          dispatch(setChangesMade({status: false}));
        });
    } catch (e) {
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Error in backing up your data.',
        }),
      );
      console.log(e, 'error in backup');
    }
  };

  const restoreData = async (docId = null) => {
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'restore'}));
    try {
      if (docId) {
        await firestore()
          .collection(userData.uid)
          .doc(docId)
          .get()
          .then(async doc => {
            if (doc.exists) {
              let docData = doc.data();
              // if data is encrypted decrypt it and load
              try {
                if (docData.encryptedData) {
                  // Decrypt
                  let bytes = CryptoJS.AES.decrypt(
                    docData.encryptedData,
                    userData.uid,
                  );
                  docData = bytes.toString(CryptoJS.enc.Utf8);
                  docData = JSON.parse(docData);
                }
                onSaveExpensesData(docData);
                dispatch(loaderActions.hideLoader());
                dispatch(
                  notificationActions.showToast({
                    status: 'success',
                    message: 'Data restored successfully.',
                  }),
                );
              } catch (e) {
                console.log(e);
                Alert.alert(
                  'Restore error',
                  'Error occured, in encrypting your data.',
                );
              }
            } else {
              dispatch(loaderActions.hideLoader());
              dispatch(
                notificationActions.showToast({
                  status: 'warning',
                  message: 'There is no data to restore.',
                }),
              );
            }
          });
      } else {
        await firestore()
          .collection(userData.uid)
          .get()
          .then(async data => {
            let docs = [];
            data.docs.filter(d => {
              if (d.id !== 'user-data') {
                docs.push(moment(d.id).format('YYYY-MM-DD A hh:mm:ss'));
              }
            });
            docs.sort();
            let latestDocName = docs[docs.length - 1];
            let doc;
            data.docs.filter(d => {
              if (
                moment(d.id).format('YYYY-MM-DD A hh:mm:ss') === latestDocName
              ) {
                doc = d;
              }
            });
            dispatch(loaderActions.hideLoader());

            // let doc = data.docs[data.docs.length - 1];
            if (doc && doc.exists) {
              let docData = doc.data();

              try {
                // if data is encrypted decrypt it and load
                if (docData.encryptedData) {
                  // Decrypt
                  let bytes = CryptoJS.AES.decrypt(
                    docData.encryptedData,
                    userData.uid,
                  );
                  docData = bytes.toString(CryptoJS.enc.Utf8);
                  docData = JSON.parse(docData);
                }
                onSaveExpensesData(docData);
                dispatch(setChangesMade({status: false}));
                dispatch(loaderActions.hideLoader());
                dispatch(
                  notificationActions.showToast({
                    status: 'success',
                    message: 'Data restored successfully.',
                  }),
                );
              } catch (e) {
                console.log(e);
                Alert.alert(
                  'Restore error',
                  'Error occured, in encrypting your data.',
                );
              }
            } else {
              dispatch(loaderActions.hideLoader());
              dispatch(
                notificationActions.showToast({
                  status: 'warning',
                  message: 'There is no data to restore.',
                }),
              );
            }
          });
      }
    } catch (e) {
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Error occured in restoring data.',
        }),
      );
      console.log(e);
    }
  };

  const onGetRestoreDates = async () => {
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'restore'}));

    return await firestore()
      .collection(userData.uid)
      .get()
      .then(data => {
        let docNames = [];
        let dupDocNames = [];
        data.docs.map(doc => {
          if (doc.id !== 'user-data') {
            docNames.push(doc.id);
            dupDocNames.push(moment(doc.id).format('YYYY-MM-DD A hh:mm:ss'));
          }
        });
        let sortedDocs = [];
        dupDocNames.sort().reverse();

        for (let i = 0; i < dupDocNames.length; i++) {
          let index = docNames.findIndex(
            d => moment(d).format('YYYY-MM-DD A hh:mm:ss') === dupDocNames[i],
          );
          sortedDocs.push(docNames[index]);
        }
        dispatch(loaderActions.hideLoader());
        if (docNames.length === 0) {
          dispatch(
            notificationActions.showToast({
              status: 'warning',
              message:
                'You have no backups to show your previous backup files.',
            }),
          );
        }
        return sortedDocs;
      })
      .catch(err => {
        dispatch(loaderActions.hideLoader());
        dispatch(
          notificationActions.showToast({
            status: 'error',
            message: 'Something error occured while fetching restore dates.',
          }),
        );
        console.log('error in fetching restore dates', err);
      });
  };

  const backUpAndRestore = async () => {
    await backUpData().then(async () => {
      restoreData();
    });
  };

  return (
    <SyncContext.Provider
      value={{
        backUpData,
        restoreData,
        backUpAndRestore,
        onGetRestoreDates,
      }}>
      {children}
    </SyncContext.Provider>
  );
};
