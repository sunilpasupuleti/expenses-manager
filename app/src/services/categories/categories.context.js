import React, {useEffect} from 'react';
import {createContext, useContext, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import _ from 'lodash';
import {
  firebaseRemoveFiles,
  getDataFromRows,
} from '../../components/utility/helper';
import {SQLiteContext} from '../sqlite/sqlite.context';
import {Alert, Keyboard} from 'react-native';

export const CategoriesContext = createContext({
  getCategories: callback => null,
  onSaveCategory: (category, callback = () => null) => null,
  onEditCategory: (category, callback = () => null) => null,
  onDeleteCategory: (category, callback) => null,
  onSearchCategories: callback => null,
});

export const CategoriesContextProvider = ({children}) => {
  const {userData} = useContext(AuthenticationContext);

  const {createOrReplaceData, updateData, getData, deleteData} =
    useContext(SQLiteContext);

  const dispatch = useDispatch();

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

  const getCategories = async (categoryType, isLoanRelated = false) => {
    try {
      let uid = userData.uid;
      let orderQuery = 'ORDER BY name';
      let loanFilter = isLoanRelated ? 'AND isLoanRelated = 1' : '';
      let query = `SELECT * FROM Categories WHERE uid='${uid}' AND type='${categoryType}' ${loanFilter} ${orderQuery}`;
      let result = await getData(query);
      let resultData = await getDataFromRows(result.rows);
      const data = resultData;

      return data;
    } catch (e) {
      console.log('error retrieving categories data - ', e);
    }
  };

  const onSaveCategory = async (category, callback = () => null) => {
    try {
      let result = await getData(
        `SELECT * FROM Categories WHERE LOWER(name) = '${_.toLower(
          category.name,
        )}' AND type='${category.type}'`,
      );
      if (result?.rows?.length > 0) {
        throw 'Category already exists!';
      }
      let insertedRes = await createOrReplaceData('Categories', category);
      let insertedData = await getDataFromRows(insertedRes.rows);

      let insertedDoc = {
        ...insertedData[0],
      };
      callback(insertedDoc);
    } catch (err) {
      Keyboard.dismiss();
      showNotification('error', err.message || err.toString());
    }
  };

  const onEditCategory = async (category, callback = () => null) => {
    try {
      console.log(_.toLower(category.name), category.id);

      let result = await getData(
        `SELECT * FROM Categories WHERE uid = '${userData.uid}' AND id <> ${
          category.id
        } AND LOWER(name) = '${_.toLower(category.name)}' AND type = '${
          category.type
        }'`,
      );
      if (result?.rows?.length > 0) {
        throw 'Category with the same name already exists in the same type!';
      }

      await updateData('Categories', category, 'WHERE uid=? AND id=?', [
        userData.uid,
        category.id,
      ]);
      callback();
    } catch (err) {
      Keyboard.dismiss();
      showNotification('error', err.message || err.toString());
    }
  };

  const onDeleteCategory = async (category, callback = () => null) => {
    try {
      const deleteCategory = async () => {
        await deleteData('Categories', 'WHERE uid = ? AND id=?', [
          userData.uid,
          category.id,
        ]);
        callback();
      };
      let transactions = await getData(
        `SELECT * FROM Transactions WHERE categoryId = ${category.id}`,
      );
      if (transactions?.rows?.length > 0) {
        let transactionsData = await getDataFromRows(transactions.rows);
        let imageUrls = transactionsData
          .filter(t => t.imageUrl !== null)
          .map(t => t.imageUrl);
        Alert.alert(
          'Remove Category ?',
          `Are you sure you want to remove ${category.name}? This action will delete all transactions associated with this category`,
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: async () => {
                await deleteCategory();
                if (imageUrls.length > 0) {
                  await firebaseRemoveFiles(imageUrls);
                }
              },
              style: 'default',
            },
          ],
          {cancelable: false},
        );
      } else {
        await deleteCategory();
      }
    } catch (err) {
      showNotification('error', err.message || err.toString());
    }
  };

  const onSearchCategories = async (keyword, categoryType) => {
    try {
      let uid = userData.uid;
      let orderQuery = 'ORDER BY name';
      let query = `SELECT * FROM Categories WHERE uid = '${uid}' AND LOWER(name) LIKE '%${keyword}%' AND type='${categoryType}' ${orderQuery}`;
      let results = await getData(query);
      let data = await getDataFromRows(results.rows);
      return data;
    } catch (err) {
      showNotification('error', err.message || err.toString());
    }
  };

  return (
    <CategoriesContext.Provider
      value={{
        onSaveCategory,
        onEditCategory,
        onDeleteCategory,
        getCategories,
        onSearchCategories,
      }}>
      {children}
    </CategoriesContext.Provider>
  );
};
