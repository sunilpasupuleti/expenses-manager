import React from 'react';
import {createContext, useContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';
import useHttp from '../../hooks/use-http';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import XLSX from 'xlsx';
import moment from 'moment';
import {zip} from 'react-native-zip-archive';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../components/symbol.currency';
import {useTheme} from 'styled-components/native';
import {getTimeZone} from 'react-native-localize';

import {SheetsContext} from '../sheets/sheets.context';
import {getFirebaseAccessUrl} from '../../components/utility/helper';

export const SettingsContext = createContext({
  onExportData: () => null,
  onExportAllDataToPdf: () => null,
  onImportData: () => null,
  onExportAllSheetsToExcel: config => null,
  onUpdateDailyReminder: (dailyReminder, callback) => null,
  onUpdateDailyBackup: (enabled, callback) => null,
  onUpdateAutoFetchTransactions: (enabled, callback) => null,
  onUpdateBaseCurrency: (currency, callback) => null,
  baseCurrency: {},
  setBaseCurrency: null,
});

export const SettingsContextProvider = ({children}) => {
  const {userData, userAdditionalDetails, onSetUserAdditionalDetails} =
    useContext(AuthenticationContext);
  const {categories, getMessages, sheets} = useContext(SheetsContext);

  const {sendRequest} = useHttp();

  const dispatch = useDispatch();
  const theme = useTheme();

  const [baseCurrency, setBaseCurrency] = useState({
    dialog: false,
    currency: null,
  });

  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();

  useEffect(() => {
    let smsSubscription;
    if (userAdditionalDetails) {
      if (!userAdditionalDetails.baseCurrency) {
        setBaseCurrency({
          dialog: true,
          currency: null,
        });
      }
    }
    return () => {
      smsSubscription && smsSubscription.remove();
    };
  }, [userAdditionalDetails]);

  // helpers
  const showLoader = (loaderType, backdrop = true) => {
    let options = {};
    if (loaderType) {
      options.loaderType = loaderType;
    }
    if (backdrop) {
      options.backdrop = backdrop;
    }
    dispatch(loaderActions.showLoader(options));
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

  const onUpdateDailyReminder = async (
    dailyReminder,
    callback = () => null,
  ) => {
    showLoader();
    let jwtToken = await auth().currentUser.getIdToken();
    let fcmToken = null;
    await messaging()
      .getToken()
      .then(t => {
        fcmToken = t;
      })
      .catch(err => {});
    let timeZone = await getTimeZone();

    let data = {...dailyReminder, fcmToken: fcmToken, timeZone: timeZone};
    data.time = `${moment(data.time).format('HH')}:${moment(data.time).format(
      'mm',
    )}`;

    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/notification/update-daily-reminder/',
        data: {
          ...data,
          fcmToken: fcmToken,
        },
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: res => {
          callback();
          if (res.user) {
            onSetUserAdditionalDetails(res.user);
          } else {
            onSetUserAdditionalDetails(p => ({
              ...p,
              dailyReminder: dailyReminder,
            }));
          }
          hideLoader();
          showNotification('success', res.message);
        },
        errorCallback: err => {
          hideLoader();
          showNotification('error', err);
        },
      },
    );
  };

  const onUpdateDailyBackup = async (enabled, callback = () => null) => {
    showLoader();
    let jwtToken = await auth().currentUser.getIdToken();
    let fcmToken = null;
    await messaging()
      .getToken()
      .then(t => {
        fcmToken = t;
      })
      .catch(err => {});
    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/notification/update-daily-backup/',
        data: {
          enabled: enabled,
          fcmToken: fcmToken,
          timeZone: getTimeZone(),
        },
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },
      {
        successCallback: res => {
          callback();
          if (res.user) {
            onSetUserAdditionalDetails(res.user);
          } else {
            onSetUserAdditionalDetails(p => ({
              ...p,
              dailyBackup: enabled,
            }));
          }
          hideLoader();
          showNotification('success', res.message);
        },
        errorCallback: err => {
          hideLoader();
          showNotification('error', err);
        },
      },
    );
  };

  const onUpdateAutoFetchTransactions = async (
    enabled,
    callback = () => null,
  ) => {
    showLoader();
    let jwtToken = await auth().currentUser.getIdToken();
    let transformedData = {
      autoFetchTransactions: enabled,
    };

    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/user',
        data: transformedData,
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },

      {
        successCallback: res => {
          if (enabled && Platform.OS === 'android') {
            setTimeout(() => {
              getMessages();
            }, 1000 * 5);
          }
          callback();
          if (res.user) {
            onSetUserAdditionalDetails(res.user);
          } else {
            onSetUserAdditionalDetails(p => ({
              ...p,
              autoFetchTransactions: enabled,
            }));
          }
          hideLoader();
          showNotification(
            'success',
            'Auto Fetch Transactions updated successfully',
          );
        },
        errorCallback: err => {
          hideLoader();
          showNotification('error', err);
        },
      },
    );
  };

  const onUpdateBaseCurrency = async (
    currency,
    callback = () => null,
    errorCallback = () => null,
  ) => {
    let jwtToken = await auth().currentUser.getIdToken();
    let transformedData = {
      baseCurrency: currency,
    };
    sendRequest(
      {
        type: 'POST',
        url: BACKEND_URL + '/user',
        data: transformedData,
        headers: {
          authorization: 'Bearer ' + jwtToken,
        },
      },

      {
        successCallback: res => {
          callback();
          if (res.user) {
            onSetUserAdditionalDetails(res.user);
          } else {
            onSetUserAdditionalDetails(p => ({
              ...p,
              baseCurrency: currency,
            }));
          }
          showNotification('success', 'Base Currency updated successfully');
        },
        errorCallback: err => {
          errorCallback();
          showNotification('error', err);
        },
      },
    );
  };

  const onExportData = async () => {
    let data = {
      sheets,
      categories,
    };

    if (Platform.OS === 'ios') {
      var toSaveData = JSON.stringify(data);
      const dirs = RNFetchBlob.fs.dirs;
      var path = dirs.DocumentDir + `/transactions-${Date.now()}.json`;
      RNFetchBlob.fs
        .writeFile(path, toSaveData)
        .then(res => {
          console.log('successfully exported file ios - ' + res);
          Share.open({
            url: path,
            filename: `transactions-${Date.now()}.json`,
            saveToFiles: true,
            type: 'application/json',
          }).catch(err => {
            console.log(
              err.error?.message,
              'error while exporting the data - ios',
            );
          });
        })
        .catch(err => {
          console.log(err, 'err in exporting file in ios');
          showNotification(
            'error',
            'Something error occured while exporting the data',
          );
        });
    }
    if (Platform.OS === 'android') {
      var toSaveData = JSON.stringify(data);
      const dirs = RNFetchBlob.fs.dirs;
      var path = dirs.DownloadDir + `/transactions-${Date.now()}.json`;
      RNFetchBlob.fs
        .writeFile(path, toSaveData)
        .then(res => {
          showNotification(
            'success',
            'Your file is exported successfully. Please check the downloads folder for the file.',
          );
        })
        .catch(err => {
          console.log(err, 'err in exporting file');
          showNotification(
            'error',
            'Something error occured while exporting the data',
          );
        });
    }
  };

  const onImportData = async () => {
    await DocumentPicker.pickSingle({
      type: [DocumentPicker.types.allFiles],
      copyTo: 'documentDirectory',
    })
      .then(async r => {
        if (r.type === 'application/json') {
          let fileuri = r.uri;
          if (Platform.OS === 'ios') {
            fileuri = fileuri.replace('file:', '');
          }
          if (Platform.OS === 'android') {
            fileuri = r.fileCopyUri;
          }
          RNFetchBlob.fs
            .readFile(fileuri)
            .then(file => {
              let data = JSON.parse(file);
              if (data.sheets && data.categories) {
                onSaveExpensesData(data).then(() => {
                  onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
                  showNotification(
                    'success',
                    'Data has been imported successfully.',
                  );
                });
              } else {
                showNotification('error', 'Empty file or corrupted data file.');
              }
            })
            .catch(err => {
              console.log(err, 'error occured while reading file');
              Alert.alert('Error occured while reading file');
            });
        } else {
          showNotification('error', 'Only JSON files are allowed');
        }
      })
      .catch(err => {
        console.log(err, 'error in document picker');
      });
  };

  const onExportAllDataToPdf = async () => {
    try {
      showLoader('pdf');
      let folderName = `transaction-pdfs-${Date.now()}`;
      let fPath = RNFetchBlob.fs.dirs.DownloadDir + '/' + folderName;
      if (Platform.OS === 'ios') {
        fPath = RNFetchBlob.fs.dirs.DocumentDir + '/' + folderName;
      }
      await RNFetchBlob.fs.mkdir(fPath);

      for await (const sheet of sheets) {
        let tableHeads = `
        <th>S.NO</th>
        <th>TITLE</th>
        <th>CATEGORY</th>
        <th>IMAGE</th>
        <th>DATE</th>
        <th>AMOUNT ( ${GetCurrencySymbol(sheet.currency)} )</th>
      `;
        let styles = `
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
      </style>
      `;

        let tableBody = '';
        let totalIncome = 0;
        let totalExpense = 0;

        sheet.details.forEach((detail, index) => {
          let date = moment(detail.date).format('MMM DD, YYYY ');
          if (detail.showTime) {
            let time = moment(detail.time).format('hh:mm A');
            date += time;
          }
          if (detail.type === 'expense') {
            totalExpense += detail.amount;
          } else {
            totalIncome += detail.amount;
          }

          let imageUrl = null;
          if (detail.image && detail.image.url) {
            imageUrl = getFirebaseAccessUrl(detail.image.url);
          }

          let image =
            detail.image && detail.image.url ? `<img src='${imageUrl}'/>` : '';
          let tableRow = `
          <tr>
              <td>${index + 1}</td>
              <td>${detail.notes ? detail.notes : ''}</td>
              <td>${detail.category.name}</td>
              <td>
              ${image}
              </td>
              <td>${date}</td>
              <td>${
                detail.type === 'expense' ? -detail.amount : detail.amount
              }</td>
          </tr>
        `;
          tableBody += tableRow;
        });
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
          <td>${
            GetCurrencySymbol(sheet.currency) +
            ' ' +
            GetCurrencyLocalString(totalIncome)
          }</td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td>TOTAL EXPENSE</td>
          <td>${
            GetCurrencySymbol(sheet.currency) +
            ' ' +
            GetCurrencyLocalString(totalExpense)
          }</td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td>BALANCE</td>
          <td>${
            GetCurrencySymbol(sheet.currency) +
            ' ' +
            GetCurrencyLocalString(totalIncome - totalExpense)
          }</td>
         </tr>
  
  
      `;
        let html = `
      <!DOCTYPE html>
      <head>
       ${styles}
      </head>
      <body>
      <h3 class='title'>${sheet.name}</h3>
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
        let options = {
          html: html,
          fileName: sheet.name,
          directory: 'Documents', //for ios only Documents is allowed
        };

        let file = await RNHTMLtoPDF.convert(options);

        let toPath;
        if (Platform.OS === 'ios') {
          toPath =
            RNFetchBlob.fs.dirs.DocumentDir +
            `/${folderName}/${sheet.name}-${Date.now()}.pdf`;
        } else {
          toPath =
            RNFetchBlob.fs.dirs.DownloadDir +
            `/${folderName}/${sheet.name}-${Date.now()}.pdf`;
        }

        console.log(toPath, file.filePath);
        await RNFetchBlob.fs.mv(file.filePath, toPath);
        console.log(`successfully exported file  -  ${sheet.name} pdf`);
      }

      let targetPath = `${RNFetchBlob.fs.dirs.DownloadDir}/${folderName}.zip`;
      let sourcePath = RNFetchBlob.fs.dirs.DownloadDir + '/' + folderName;

      if (Platform.OS === 'ios') {
        targetPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${folderName}.zip`;
        sourcePath = RNFetchBlob.fs.dirs.DocumentDir + '/' + folderName;
      }
      let path = await zip(sourcePath, targetPath);
      RNFetchBlob.fs.unlink(sourcePath);
      hideLoader();

      if (Platform.OS === 'ios') {
        Share.open({
          url: path,
          saveToFiles: true,
          title: 'Transactions Pdf File',
          subject: 'Transaction file - Pdf',
        }).catch(err => {
          console.log(
            err.error.message,
            'error while exporting the all pdfs - ios',
          );
        });
        return;
      }
      showNotification(
        'success',
        'Your file is exported successfully. Please check the downloads folder for the file.',
      );
    } catch (e) {
      hideLoader();
      console.error(e);
      showNotification(
        'error',
        'Something error occured while exporting the pdf ' + e.toString(),
      );
    }
  };

  const onExportAllSheetsToExcel = async config => {
    showLoader('excel');

    let wb = XLSX.utils.book_new();

    sheets.forEach((sheet, index) => {
      let totalIncome = 0;
      let totalExpense = 0;
      let structuredDetails = [{}];

      sheet.details.forEach((d, i) => {
        let date = moment(d.date).format('MMM DD, YYYY ');
        if (d.showTime) {
          let time = moment(d.time).format('hh:mm A');
          date += time;
        }
        let amount = `AMOUNT ( ${GetCurrencySymbol(sheet.currency)} )`;
        if (d.type === 'expense') {
          totalExpense += d.amount;
        } else {
          totalIncome += d.amount;
        }
        let detail = {
          'S.NO': i + 1,
          TITLE: d.notes,
          CATEGORY: d.category.name,
          IMAGE: d.image?.url ? getFirebaseAccessUrl(d.image.url) : '-',
          DATE: date,
          [amount]: d.type === 'expense' ? -d.amount : d.amount,
        };
        structuredDetails.push(detail);
      });
      let config = {
        title: sheet.name.toUpperCase(),
      };
      let ws = XLSX.utils.json_to_sheet(structuredDetails);
      let wsCols = [{wch: 5}, {wch: 40}, {wch: 40}, {wch: 25}, {wch: 25}];
      ws['!cols'] = wsCols;

      XLSX.utils.sheet_add_aoa(
        ws,
        [
          ['', '', '', '', '', ''],
          [
            '',
            '',
            '',
            '',
            'TOTAL INCOME ',
            GetCurrencySymbol(sheet.currency) +
              ' ' +
              GetCurrencyLocalString(totalIncome),
          ],
          [
            '',
            '',
            '',
            '',
            'TOTAL EXPENSES ',
            GetCurrencySymbol(sheet.currency) +
              ' ' +
              GetCurrencyLocalString(totalExpense),
          ],
          [
            '',
            '',
            '',
            '',
            'BALANCE',
            GetCurrencySymbol(sheet.currency) +
              ' ' +
              GetCurrencyLocalString(sheet.totalBalance),
          ],
        ],
        {origin: -1},
      );

      XLSX.utils.book_append_sheet(wb, ws, config.title);
    });
    let opt = {
      type: 'binary',
      bookType: 'xlsx',
    };

    const wbout = XLSX.write(wb, opt);
    if (Platform.OS === 'ios') {
      const dirs = RNFetchBlob.fs.dirs;
      var path = dirs.DocumentDir + '/transactions.xlsx';
      RNFS.writeFile(path, wbout, 'ascii')
        .then(res => {
          hideLoader();

          console.log('successfully exported file ios - ' + res);
          Share.open({
            url: path,
            filename: 'transactions.xlsx',
            saveToFiles: true,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }).catch(err => {
            hideLoader();

            console.log(
              err.error.message,
              'error while exporting the data - ios',
            );
          });
        })
        .catch(err => {
          hideLoader();

          console.log(err, 'err in exporting file in ios');
          showNotification(
            'error',
            'Something error occured while exporting the data',
          );
        });
    }
    if (Platform.OS === 'android') {
      const dirs = RNFetchBlob.fs.dirs;

      let path = dirs.DownloadDir + `/transactions-${Date.now()}.xlsx`;
      RNFS.writeFile(path, wbout, 'ascii')
        .then(r => {
          hideLoader();
          showNotification(
            'success',
            'Your file is exported successfully. Please check the downloads folder for the file.',
          );
        })
        .catch(err => {
          hideLoader();
          showNotification(
            'error',
            'Something error occured while exporting the file.',
          );
          console.log(err, 'Error in exporting excel');
        });
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        onExportAllSheetsToExcel,
        onExportData,
        onImportData,
        onExportAllDataToPdf,
        onUpdateDailyReminder,
        onUpdateDailyBackup,
        onUpdateAutoFetchTransactions,
        baseCurrency,
        setBaseCurrency,
        onUpdateBaseCurrency,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};
