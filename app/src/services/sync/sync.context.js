/* eslint-disable handle-callback-err */
/* eslint-disable quotes */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState} from 'react';
import {createContext, useContext, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {setChangesMade} from '../../store/service-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import {SheetsContext} from '../sheets/sheets.context';
import useHttp from '../../hooks/use-http';
import auth from '@react-native-firebase/auth';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  defaultICloudContainerPath,
  isICloudAvailable,
  readFile,
  readDir,
  writeFile,
  unlink,
} from 'react-native-cloud-store';
import moment from 'moment';

export const SyncContext = createContext({
  backUpData: () => null,
  restoreData: () => null,
  backUpAndRestore: () => null,
  onGetRestoreDates: () => null,
  backUpTempData: () => null,
  onBackupToiCloud: () => null,
  onRestoreFromiCloud: () => null,
  onGetRestoresFromiCloud: successCallBack => null,
  onDeleteBackupFromiCloud: () => null,
});

export const SyncContextProvider = ({children}) => {
  const {userData} = useContext(AuthenticationContext);
  const {expensesData, onSaveExpensesData, categories} =
    useContext(SheetsContext);
  const changesMade = useSelector(state => state.service.changesMade);
  const dispatch = useDispatch();
  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();
  const appState = useSelector(state => state.service.appState);

  let {sendRequest} = useHttp();

  useEffect(() => {
    if (userData) {
      if (changesMade.loaded) {
        if (!changesMade.status) {
          restoreData(null, true);
        }
      }
    }
  }, [userData, changesMade.status]);

  useEffect(() => {
    if (userData && (appState === 'inactive' || appState === 'background')) {
      backUpTempData();
    }
  }, [appState]);

  const backUpData = async (notify = true) => {
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
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'POST',
          url: BACKEND_URL + '/backup',
          data: {
            ...expensesData,
            categories: categories,
          },
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async () => {
            dispatch(loaderActions.hideLoader());
            if (notify) {
              dispatch(
                notificationActions.showToast({
                  status: 'success',
                  message: 'Your data backed up safely.',
                }),
              );
            }
            dispatch(setChangesMade({status: false}));
          },
          errorCallback: err => {
            dispatch(loaderActions.hideLoader());
            if (notify) {
              dispatch(
                notificationActions.showToast({
                  status: 'error',
                  message: 'Error in backing up your data.',
                }),
              );
            }

            console.log(err, 'error in backup');
          },
        },
      );
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

  // store for automatic backup
  const backUpTempData = async (notify = true) => {
    try {
      let jwtToken = await auth().currentUser.getIdToken();
      sendRequest(
        {
          type: 'POST',
          url: BACKEND_URL + '/backup/temp',
          data: {
            ...expensesData,
            categories: categories,
          },
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async () => {
            console.log('Your data backed up temp data.');
          },
          errorCallback: err => {
            console.log(err, 'error in backup temp ');
          },
        },
      );
    } catch (e) {
      console.log(e, 'error in backup temp ');
    }
  };

  const restoreData = async (backupId = null, initialRestore = false) => {
    let jwtToken = await auth().currentUser.getIdToken();
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'restore'}));
    try {
      let url = BACKEND_URL + '/backup';

      if (backupId) {
        url += '?id=' + backupId;
      }

      sendRequest(
        {
          type: 'GET',
          url: url,
          headers: {
            authorization: 'Bearer ' + jwtToken,
          },
        },
        {
          successCallback: async result => {
            if (result.backup) {
              onSaveExpensesData(result.backup);
              dispatch(loaderActions.hideLoader());
              dispatch(
                notificationActions.showToast({
                  status: 'success',
                  message: 'Data restored successfully.',
                }),
              );
            } else {
              dispatch(loaderActions.hideLoader());
              if (!initialRestore) {
                dispatch(
                  notificationActions.showToast({
                    status: 'info',
                    message: 'There is no data to restore.',
                  }),
                );
              }
            }
          },
          errorCallback: err => {
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                status: 'error',
                message: 'Error in restoring up your data.',
              }),
            );
            console.log(err, 'error in restore');
          },
        },
      );
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

  const onGetRestoreDates = async (successCallBack = () => {}) => {
    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'restore'}));
    let jwtToken = await auth().currentUser.getIdToken();
    sendRequest(
      {
        type: 'GET',
        url: BACKEND_URL + '/backup/all',
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: successCallBack,
        errorCallback: err => {
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while fetching restore dates.',
            }),
          );
          console.log('error in fetching restore dates', err);
        },
      },
    );
  };

  const backUpAndRestore = async () => {
    await backUpData().then(async () => {
      restoreData();
    });
  };

  const onBackupToiCloud = async () => {
    if (!expensesData) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'There is no data to create back up.',
        }),
      );
      return;
    }

    let data = {
      ...expensesData,
      categories: categories,
    };

    dispatch(loaderActions.showLoader({backdrop: true, loaderType: 'backup'}));
    try {
      if ((await isICloudAvailable()) && defaultICloudContainerPath) {
        const fileName = `transactions-${Date.now()}.json`;
        let path = `${defaultICloudContainerPath}/Documents/${fileName}`;
        await writeFile(path, JSON.stringify(data))
          .then(() => {
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                status: 'success',
                message: 'Your data backed up safely to iCloud.',
              }),
            );

            console.log('Successfully backed up data to iCloud');
          })
          .catch(err => {
            console.log(err, 'Error occured while backing into iCloud');
            throw err.message;
          });
      } else {
        throw 'Error occured while backing up to iCloud';
      }
    } catch (e) {
      console.log(e, 'Error in syncing to iCloud');
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: JSON.stringify(e),
        }),
      );
    }
  };

  const onRestoreFromiCloud = async fileName => {
    try {
      dispatch(
        loaderActions.showLoader({backdrop: true, loaderType: 'backup'}),
      );

      if ((await isICloudAvailable()) && defaultICloudContainerPath) {
        await readFile(fileName)
          .then(content => {
            let data = JSON.parse(content);
            if (data.sheets && data.categories) {
              dispatch(loaderActions.hideLoader());

              onSaveExpensesData(data).then(() => {
                dispatch(setChangesMade({status: true})); // set changes made to true so that backup occurs only if some changes are made
                dispatch(
                  notificationActions.showToast({
                    status: 'success',
                    message: 'Data has been restored successfully from iCloud.',
                  }),
                );
              });
            } else {
              dispatch(
                notificationActions.showToast({
                  status: 'error',
                  message: 'Empty file or corrupted data file from iCloud.',
                }),
              );
            }
          })
          .catch(err => {
            console.log(err, 'Error occured while restoring from  iCloud');
            throw err.message;
          });
      } else {
        throw 'Error occured while restoring data from iCloud';
      }
    } catch (e) {
      console.log(e, 'Error in restoring from iCloud');
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: JSON.stringify(e),
        }),
      );
    }
  };

  const onDeleteBackupFromiCloud = async fileName => {
    try {
      dispatch(
        loaderActions.showLoader({backdrop: true, loaderType: 'backup'}),
      );

      if ((await isICloudAvailable()) && defaultICloudContainerPath) {
        await unlink(fileName)
          .then(() => {
            dispatch(loaderActions.hideLoader());
            dispatch(
              notificationActions.showToast({
                status: 'success',
                message: 'Backup file deleted successfully from iCloud.',
              }),
            );
          })
          .catch(err => {
            console.log(err, 'Error occured while restoring from  iCloud');
            throw err.message;
          });
      } else {
        throw 'Error occured while deleting data from iCloud';
      }
    } catch (e) {
      console.log(e, 'Error in deleting from iCloud');
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: JSON.stringify(e),
        }),
      );
    }
  };

  const onGetRestoresFromiCloud = async (successCallBack = () => {}) => {
    try {
      dispatch(
        loaderActions.showLoader({backdrop: true, loaderType: 'backup'}),
      );
      if (
        (await isICloudAvailable()) &&
        defaultICloudContainerPath + '/Documents'
      ) {
        await readDir(defaultICloudContainerPath + '/Documents')
          .then(files => {
            if (!files || files.length === 0) {
              dispatch(
                notificationActions.showToast({
                  status: 'info',
                  message: 'There are no files to show from iCloud',
                }),
              );
            } else {
              successCallBack(files.reverse());
            }

            dispatch(loaderActions.hideLoader());
          })
          .catch(e => {
            throw e;
          });
      } else {
        throw 'Error occured while reading files from iCloud ';
      }
    } catch (e) {
      console.log(e, 'Error in reading files from iCloud');
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: JSON.stringify(e),
        }),
      );
    }
  };

  return (
    <SyncContext.Provider
      value={{
        backUpData,
        backUpTempData,
        restoreData,
        backUpAndRestore,
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
