import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, useContext, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {setChangesMade} from '../../store/service-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import {saveCategoryRequest, saveSheetRequest} from './sheets.service';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';

const defaultCategories = {
  expense: [
    {
      id: 'ex1',
      name: 'No Category',
      color: '#8e8e92',
      default: true,
    },
    {
      id: 'ex2',
      name: 'Groceries',
      color: '#2fb0c7',
    },
    {
      id: 'ex3',

      name: 'Food & Drink',
      color: '#5756d5',
    },

    {
      id: 'ex4',
      name: 'Transport',
      color: '#007aff',
    },
    {
      id: 'ex5',
      name: 'Rent',
      color: '#ffcc00',
    },
    {
      id: 'ex6',
      name: 'Entertainment',
      color: '#fe9500',
    },
    {
      id: 'ex7',
      name: 'Other',
      color: '#d1d1d5',
    },
  ],
  income: [
    {
      id: 'in1',
      name: 'No Category',
      color: '#8e8e92',
      default: true,
    },
    {
      id: 'in2',
      name: 'Salary',
      color: '#2fb0c7',
    },
    {
      id: 'in3',
      name: 'Budget',
      color: '#5756d5',
    },
    {
      id: 'ex7',
      name: 'Other',
      color: '#d1d1d5',
    },
  ],
};

export const SheetsContext = createContext({
  sheets: [],
  categories: defaultCategories,
  expensesData: {},
  onSaveSheet: () => null,
  onSaveCategory: () => null,
  onSaveSheetDetails: () => null,
  onSaveExpensesData: () => null,
  onEditSheet: () => null,
  onEditSheetDetails: () => null,
  onEditCategory: () => null,
  onDeleteSheet: () => null,
  onDeleteSheetDetails: () => null,
  onDeleteCategory: () => null,
  getSheetById: () => null,
  onMoveSheets: () => null,
  onDuplicateSheet: () => null,
  onChangeSheetType: () => null,
  onExportData: () => null,
  onImportData: () => null,
  onArchiveSheet: () => null,
  onPinSheet: () => null,
});

export const SheetsContextProvider = ({children}) => {
  const [sheets, setSheets] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [expensesData, setExpensesData] = useState(null);
  const {userData} = useContext(AuthenticationContext);
  const dispatch = useDispatch();

  useEffect(() => {
    if (userData) {
      retrieveExpensesData();
    }
  }, [userData]);

  const onSetChangesMade = (status = true) => {
    dispatch(setChangesMade({status}));
  };

  const calculateBalance = sheet => {
    var totalExpenseAmount = 0;
    var totalIncomeAmount = 0;
    sheet.details.filter(d => {
      if (d.type === 'expense') {
        totalExpenseAmount += d.amount;
      } else if (d.type === 'income') {
        totalIncomeAmount += d.amount;
      }
    });
    let totalBalance = totalIncomeAmount - totalExpenseAmount;
    return totalBalance;
  };

  const onSaveExpensesData = async passedExpensesData => {
    if (passedExpensesData) {
      setExpensesData(passedExpensesData);
    }

    if (passedExpensesData.sheets) {
      let sortedSheets = passedExpensesData.sheets.sort(
        (a, b) => b.updatedAt - a.updatedAt,
      );
      setSheets(sortedSheets);
    }
    if (passedExpensesData.categories) {
      let changedCategories = {...passedExpensesData.categories};
      setCategories(changedCategories);
    }

    try {
      dispatch(loaderActions.hideLoader());
      const jsonValue = JSON.stringify(passedExpensesData);
      await AsyncStorage.setItem(
        `@expenses-manager-data-${userData.uid}`,
        jsonValue,
      );
      // retrieveExpensesData();
    } catch (e) {
      console.log('error saving expenses data to local storage - ', e);
      dispatch(loaderActions.hideLoader());
    }
  };

  const retrieveExpensesData = async () => {
    dispatch(loaderActions.showLoader({backdrop: true}));
    try {
      let value = await AsyncStorage.getItem(
        `@expenses-manager-data-${userData.uid}`,
      );
      value = JSON.parse(value);

      if (value != null) {
        setExpensesData(value);
        // set sheets accoring to updated date wise
        if (value.sheets) {
          let sortedSheets = value.sheets.sort(
            (a, b) => b.updatedAt - a.updatedAt,
          );

          setSheets(sortedSheets);
        }

        if (value.categories) {
          setCategories(value.categories);
        }
      }
      dispatch(loaderActions.hideLoader());
    } catch (e) {
      console.log('error retrieving expenses data - ', e);
      dispatch(loaderActions.hideLoader());
    }
  };

  const onSaveSheet = async (sheet, navigation) => {
    saveSheetRequest(sheet, sheets)
      .then(async result => {
        const updatedSheets = [...sheets, sheet];
        let updatedExpensesData = {
          ...expensesData,
          sheets: updatedSheets,
        };
        onSaveExpensesData(updatedExpensesData).then(() => {
          onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
          navigation.goBack();
        });
      })
      .catch(err => {
        dispatch(
          notificationActions.showToast({
            status: 'error',
            message: err,
          }),
        );
        dispatch(loaderActions.hideLoader());
      });
  };

  const onSaveSheetDetails = async (sheet, sheetDetail, navigation) => {
    var presentSheets = [...sheets];
    var sheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    var presentSheet = presentSheets[sheetIndex];
    if (!presentSheet.details) {
      presentSheet.details = [];
    }

    presentSheet.details.push(sheetDetail);
    presentSheet.totalBalance = calculateBalance(presentSheet);
    presentSheet.updatedAt = Date.now();
    presentSheets[sheetIndex] = presentSheet;

    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
    };
    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
      navigation.navigate('SheetDetails', {sheet: presentSheet});
    });
  };

  const onSaveCategory = async (category, type, navigation) => {
    saveCategoryRequest(
      category,
      type === 'expense' ? categories.expense : categories.income,
    )
      .then(async result => {
        let updatedCategories = categories;
        if (type === 'expense') {
          updatedCategories.expense = [...updatedCategories.expense, category];
        } else if (type === 'income') {
          updatedCategories.income = [...updatedCategories.income, category];
        }
        let updatedExpensesData = {
          ...expensesData,
          categories: updatedCategories,
        };
        onSaveExpensesData(updatedExpensesData);
        onSetChangesMade(true);
        navigation.goBack();
      })
      .catch(err => {
        dispatch(
          notificationActions.showToast({
            status: 'error',
            message: err,
          }),
        );
        dispatch(loaderActions.hideLoader());
      });
  };

  const onEditSheet = async (sheet, callback) => {
    let ifAlreadyExists = sheets.filter(
      s =>
        s.name.toLowerCase() === sheet.name.toLowerCase() && s.id !== sheet.id,
    );
    if (ifAlreadyExists && ifAlreadyExists.length) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Sheet name already exists',
        }),
      );
    } else {
      let presentSheets = [...sheets];
      let index = presentSheets.findIndex(s => s.id === sheet.id);
      presentSheets[index] = {...sheets[index], ...sheet};
      let updatedExpensesData = {
        ...expensesData,
        sheets: presentSheets,
      };
      let presentSheet = presentSheets[index];
      onSaveExpensesData(updatedExpensesData).then(() => {
        onSetChangesMade(true);
        callback(presentSheet);
        // navigation.goBack();
      });
    }
  };

  const onEditSheetDetails = async (sheet, sheetDetail, navigation) => {
    var presentSheets = [...sheets];
    var sheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    var presentSheet = presentSheets[sheetIndex];
    let sheetDetailIndex = presentSheet.details.findIndex(
      sd => sd.id === sheetDetail.id,
    );
    presentSheet.details[sheetDetailIndex] = sheetDetail;
    presentSheet.totalBalance = calculateBalance(presentSheet);
    presentSheet.updatedAt = Date.now();
    presentSheets[sheetIndex] = presentSheet;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
    };
    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
      navigation.navigate('SheetDetails', {sheet: presentSheet});
    });
  };

  const onEditCategory = async (category, type, navigation) => {
    let index;
    let updatedCategories = categories;

    let toCheckCategories;
    if (type === 'expense') {
      index = updatedCategories.expense.findIndex(s => s.id === category.id);
      toCheckCategories = [...updatedCategories.expense];
      updatedCategories.expense[index] = category;
    } else if (type === 'income') {
      index = updatedCategories.income.findIndex(s => s.id === category.id);
      toCheckCategories = [...updatedCategories.income];
      updatedCategories.income[index] = category;
    }
    let ifAlreadyExists = toCheckCategories.filter(
      c =>
        c.name.toLowerCase() === category.name.toLowerCase() &&
        c.id !== category.id,
    );
    if (ifAlreadyExists && ifAlreadyExists.length) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Category name already exists',
        }),
      );
    } else {
      let updatedExpensesData = {
        ...expensesData,
        categories: updatedCategories,
      };
      onSaveExpensesData(updatedExpensesData);
      onSetChangesMade(true);
      navigation.goBack();
    }
  };

  const onDeleteSheet = async sheet => {
    const remainingSheets = sheets.filter(s => s.id != sheet.id);
    let updatedExpensesData = {
      ...expensesData,
      sheets: remainingSheets,
    };
    onSaveExpensesData(updatedExpensesData);
    onSetChangesMade(true);
  };

  const onDeleteCategory = async (category, type) => {
    let presentCategories = categories;
    if (type === 'income') {
      presentCategories.income = categories.income.filter(
        c => c.id != category.id,
      );
    } else if (type === 'expense') {
      presentCategories.expense = categories.expense.filter(
        c => c.id != category.id,
      );
    }
    let updatedExpensesData = {
      ...expensesData,
      categories: presentCategories,
    };
    onSaveExpensesData(updatedExpensesData);
    onSetChangesMade(true);
  };

  const onDeleteSheetDetails = async (sheet, sheetDetail, navigation) => {
    let presentSheets = [...sheets];
    let presentSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let remainingSheetDetails = presentSheets[presentSheetIndex].details.filter(
      s => s.id != sheetDetail.id,
    );
    presentSheets[presentSheetIndex].details = remainingSheetDetails;
    presentSheets[presentSheetIndex].totalBalance = calculateBalance(
      presentSheets[presentSheetIndex],
    );
    presentSheets[presentSheetIndex].updatedAt = Date.now();
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
    };
    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
      navigation.navigate('SheetDetails', {
        sheet: presentSheets[presentSheetIndex],
      });
    });
  };

  const onMoveSheets = async (sheet, moveToSheet, sheetDetail, navigation) => {
    let presentSheets = [...sheets];
    let moveFromSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let moveFromSheet = presentSheets[moveFromSheetIndex];
    let moveFromremainingSheetDetails = moveFromSheet.details.filter(
      s => s.id != sheetDetail.id,
    );
    moveFromSheet.details = moveFromremainingSheetDetails;
    moveFromSheet.totalBalance = calculateBalance(moveFromSheet);
    moveFromSheet.updatedAt = Date.now();
    presentSheets[moveFromSheetIndex] = moveFromSheet;
    // to move sheet into
    let moveToIndex = presentSheets.findIndex(s => s.id === moveToSheet.id);
    var moveTo = presentSheets[moveToIndex];
    if (!moveTo.details) {
      moveTo.details = [];
    }

    moveTo.details.push(sheetDetail);
    moveTo.totalBalance = calculateBalance(moveTo);
    presentSheets[moveToIndex] = moveTo;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
    };
    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
      navigation.navigate('SheetDetails', {sheet: moveFromSheet});
    });
  };

  const onDuplicateSheet = async (sheet, sheetDetail, navigation) => {
    let presentSheets = [...sheets];
    let dupSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let dupSheet = presentSheets[dupSheetIndex];
    dupSheet.details.push({
      ...sheetDetail,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    });
    dupSheet.updatedAt = Date.now();
    dupSheet.totalBalance = calculateBalance(dupSheet);
    presentSheets[dupSheetIndex] = dupSheet;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
    };

    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
      navigation.navigate('SheetDetails', {sheet: dupSheet});
    });
  };

  const onChangeSheetType = async (sheet, sheetDetail, navigation) => {
    let presentSheets = [...sheets];
    let changeSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let changeSheet = presentSheets[changeSheetIndex];
    let detailIndex = changeSheet.details.findIndex(
      d => d.id === sheetDetail.id,
    );
    changeSheet.details[detailIndex].type =
      sheetDetail.type === 'income' ? 'expense' : 'income';
    changeSheet.updatedAt = Date.now();
    changeSheet.totalBalance = calculateBalance(changeSheet);
    presentSheets[changeSheetIndex] = changeSheet;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
    };

    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
      navigation.navigate('SheetDetails', {sheet: changeSheet});
    });
  };

  const getSheetById = id => {
    return sheets.filter(s => s.id === id)[0];
  };

  const onExportData = async () => {
    let data = {
      sheets,
      categories,
    };

    if (Platform.OS === 'ios') {
      const path = RNFS.DocumentDirectoryPath + '/transactions.json';
      RNFS.writeFile(path, JSON.stringify(data))
        .then(res => {
          console.log('successfully exported the file ');
        })
        .catch(e => {
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while exporting the data',
            }),
          );
        });
      Share.open({
        url: path,
        filename: 'Transactions.json',
        saveToFiles: true,
        type: 'application/json',
      }).catch(err => {
        console.log(err.error.message, 'error while exporting the data - ios');
      });
    }
    if (Platform.OS === 'android') {
      let uri = RNFS.DownloadDirectoryPath + '/transactions.json';
      let exists = await RNFS.exists(
        RNFS.DownloadDirectoryPath + '/transactions.json',
      );
      if (exists) {
        await RNFS.unlink(uri)
          .then()
          .catch(err => console.log('error in unlinkg previous file'));
      }
      RNFS.writeFile(uri, JSON.stringify(data))
        .then(res => {
          console.log('successfully exported the file ');
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message:
                'Your file is exported successfully. Please check the downloads folder for the file.',
            }),
          );
        })
        .catch(e => {
          console.log(e, 'error while exporting the data - android');
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Something error occured while exporting the data',
            }),
          );
        });
    }
  };

  const onImportData = async () => {
    await DocumentPicker.pickSingle({type: [DocumentPicker.types.allFiles]})
      .then(async r => {
        if (r.type === 'application/json') {
          let fileuri = r.uri;
          RNFS.readFile(fileuri)
            .then(file => {
              let data = JSON.parse(file);
              if (data.sheets && data.categories) {
                onSaveExpensesData(data).then(() => {
                  onSetChangesMade(true); // set changes made to true so that backup occurs only if some changes are made
                  dispatch(
                    notificationActions.showToast({
                      status: 'success',
                      message: 'Data has been imported successfully.',
                    }),
                  );
                });
              } else {
                dispatch(
                  notificationActions.showToast({
                    status: 'error',
                    message: 'Empty file or corrupted data file.',
                  }),
                );
              }
            })
            .catch(err => {
              console.log('error in reading file');
            });
        } else {
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: 'Only JSON files are allowed',
            }),
          );
        }
      })
      .catch(err => {
        console.log(err);
      });
  };

  const onArchiveSheet = async sheet => {
    let presentSheets = [...sheets];
    let changeSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let changeSheet = presentSheets[changeSheetIndex];
    changeSheet.archived = changeSheet.archived ? !changeSheet.archived : true;
    changeSheet.pinned = false;
    presentSheets[changeSheetIndex] = changeSheet;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
    };
    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
    });
  };

  const onPinSheet = async sheet => {
    let presentSheets = [...sheets];
    let changeSheetIndex = presentSheets.findIndex(s => s.id === sheet.id);
    let changeSheet = presentSheets[changeSheetIndex];
    changeSheet.pinned = changeSheet.pinned ? !changeSheet.pinned : true;
    changeSheet.archived = false;
    presentSheets[changeSheetIndex] = changeSheet;
    let updatedExpensesData = {
      ...expensesData,
      sheets: presentSheets,
    };
    onSaveExpensesData(updatedExpensesData).then(() => {
      onSetChangesMade(true);
    });
  };

  return (
    <SheetsContext.Provider
      value={{
        sheets,
        expensesData,
        categories,
        onSaveSheet,
        onSaveSheetDetails,
        onSaveCategory,
        onDeleteSheet,
        onSaveExpensesData,
        onEditSheet,
        onEditCategory,
        onDeleteCategory,
        getSheetById,
        onEditSheetDetails,
        onDeleteSheetDetails,
        onMoveSheets,
        onDuplicateSheet,
        onChangeSheetType,
        onExportData,
        onImportData,
        onArchiveSheet,
        onPinSheet,
      }}>
      {children}
    </SheetsContext.Provider>
  );
};
