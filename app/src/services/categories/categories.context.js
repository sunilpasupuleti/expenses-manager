import React, {useEffect} from 'react';
import {createContext, useContext, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../store/loader-slice';
import {notificationActions} from '../../store/notification-slice';
import {AuthenticationContext} from '../authentication/authentication.context';
import _ from 'lodash';
import {firebaseRemoveFiles} from '../../components/utility/helper';
import {Alert, Keyboard} from 'react-native';
import {WatermelonDBContext} from '../watermelondb/watermelondb.context';
import {Q} from '@nozbe/watermelondb';

export const CategoriesContext = createContext({
  getCategories: (categoryType, isLoanRelated) => null,
  onSaveCategory: (category, callback = () => null) => null,
  onEditCategory: (categoryModel, editedCategroy, callback = () => null) =>
    null,
  onDeleteCategory: (category, callback) => null,
});

export const CategoriesContextProvider = ({children}) => {
  const {userData} = useContext(AuthenticationContext);
  const {getChildRecords, db, createRecord, updateRecord, deleteRecord} =
    useContext(WatermelonDBContext);

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
      const filters = [Q.where('type', categoryType)];
      filters.push(Q.where('isLoanRelated', !!isLoanRelated));

      const data = await getChildRecords(
        'users',
        'id',
        userData.id,
        'categories',
        {
          filters: filters,
          sortBy: {column: 'name', order: 'asc'},
          mapRaw: true,
        },
      );

      return data;
    } catch (e) {
      console.log('error retrieving categories data - ', e);
    }
  };

  const onSaveCategory = async (category, callback = () => null) => {
    try {
      const allCategories = await getChildRecords(
        'users',
        'id',
        userData.id,
        'categories',
        {
          filters: [
            Q.where('type', category.type),
            Q.where('name', category.name),
          ],
        },
      );
      if (allCategories.length > 0) {
        throw 'Category already exists!';
      }
      const insertedRecord = await createRecord('categories', category);

      callback(insertedRecord._raw);
    } catch (err) {
      Keyboard.dismiss();
      showNotification('error', err.message || err.toString());
    }
  };

  const onEditCategory = async (
    categoryModel,
    category,
    callback = () => null,
  ) => {
    try {
      const allCategories = await getChildRecords(
        'users',
        'id',
        userData.id,
        'categories',
        {
          filters: [
            Q.where('type', category.type),
            Q.where('name', category.name),
            Q.where('id', Q.notEq(categoryModel.id)),
          ],
        },
      );

      if (allCategories.length > 0) {
        throw `Category with the same name already exists in ${category.type}!`;
      }

      await db.write(async () => {
        await categoryModel.update(record => {
          record.name = category.name;
          record.color = category.color;
          record.icon = category.icon;
          record.type = category.type;
          record.isLoanRelated = category.isLoanRelated;
        });
      });

      callback();
    } catch (err) {
      Keyboard.dismiss();
      showNotification('error', err.message || err.toString());
    }
  };

  const onDeleteCategory = async (category, callback = () => null) => {
    try {
      const relatedTransactions = await category.transactions.fetch();

      const deleteCategoryAndTransactions = async () => {
        await db.write(async () => {
          if (relatedTransactions.length > 0) {
            for (const tx of relatedTransactions) {
              await tx.markAsDeleted();
              await tx.destroyPermanently();
            }
          }

          await category.markAsDeleted();
          await category.destroyPermanently();
        });
        let imageUrls = relatedTransactions
          .filter(t => t.imageUrl !== null)
          .map(t => t.imageUrl);
        if (imageUrls.length > 0) {
          await firebaseRemoveFiles(imageUrls);
        }
      };
      if (relatedTransactions?.length > 0) {
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
                await deleteCategoryAndTransactions();
              },
              style: 'default',
            },
          ],
          {cancelable: false},
        );
      } else {
        await deleteCategoryAndTransactions();
      }
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
      }}>
      {children}
    </CategoriesContext.Provider>
  );
};
