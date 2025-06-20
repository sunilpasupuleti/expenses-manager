import React, {useContext, useEffect, useState} from 'react';
import {Button, Dialog, Portal} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {smsTransactionsActions} from '../../store/smsTransactions-slice';
import {Text} from '../typography/text.component';
import {GetCurrencyLocalString, GetCurrencySymbol} from '../symbol.currency';
import {getCurrencies, getTimeZone} from 'react-native-localize';
import moment from 'moment';
import {Spacer} from '../spacer/spacer.component';
import {useTheme} from 'styled-components/native';
import {ButtonText, FlexRow} from '../styles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Alert, ScrollView, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import _ from 'lodash';
import {AuthenticationContext} from '../../services/authentication/authentication.context';
import {SelectList} from 'react-native-dropdown-select-list';
import {CategoriesContext} from '../../services/categories/categories.context';
import {formatDateTz} from './helper';
import {SheetDetailsContext} from '../../services/sheetDetails/sheetDetails.context';
import {WatermelonDBContext} from '../../services/watermelondb/watermelondb.context';
import {Q} from '@nozbe/watermelondb';

const formatDateTzReadable = timestamp => {
  const timezone = getTimeZone(); // e.g., 'America/Toronto'
  return moment.utc(timestamp).tz(timezone).format('DD MMM YYYY, hh:mm:ss A');
};

export const SmsTransactions = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const {dialogVisible, transactions} = useSelector(
    state => state.smsTransactions,
  );
  const {db} = useContext(WatermelonDBContext);
  const {userAdditionalDetails} = useContext(AuthenticationContext);

  const {onSaveSheetDetail} = useContext(SheetDetailsContext);
  const {userData} = useContext(AuthenticationContext);

  const {getCategories} = useContext(CategoriesContext);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryItems, setCategoryItems] = useState([]);

  const [sheetItems, setSheetItems] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);

  const [transaction, setTransaction] = useState(null);

  const [removedIndex, setRemovedIndex] = useState(null);

  const [bodyVisible, setBodyVisible] = useState(false);

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    (async () => {
      if (userData && db && dialogVisible) {
        await onGetSheets();
      }
    })();
  }, [userData, db, dialogVisible]);

  const onGetSheets = async () => {
    setSheetsLoading(true);
    const sheetsCollection = await db.get('accounts');
    const allSheets = await sheetsCollection
      .query(Q.where('userId', userData.id), Q.where('isLoanAccount', false))
      .fetch();

    const pinned = allSheets.filter(sheet => sheet.pinned && !sheet.archived);
    const archived = allSheets.filter(sheet => sheet.archived);
    const regular = allSheets.filter(sheet => !sheet.pinned && !sheet.archived);
    const data = [...pinned, ...archived, ...regular];

    setSheets(data);
    setSheetsLoading(false);
  };

  const onGetCategories = async catType => {
    let catData = await getCategories(catType);
    if (catData) {
      return catData;
    }
  };

  const onClickAddAndContinue = () => {
    if (selectedSheet && selectedCategory && transaction) {
      const time = formatDateTz(transaction.date);
      const date = formatDateTz(transaction.date);
      let categoryType = transaction.categoryType;
      const sheet = sheets.find(s => s.id === selectedSheet.key);
      const category = categories.find(c => c.id === selectedCategory.key);

      let sheetDetail = {
        amount: parseFloat(transaction.amount),
        notes: '',
        type: categoryType,
        categoryId: category.id,
        date: date,
        showTime: true,
        time: time,
        accountId: sheet.id,
        image: {url: null},
      };
      setLoading(true);
      onSaveSheetDetail(sheet, sheetDetail, () => {
        console.log('callback called');

        onRemoveTransaction();
        setLoading(false);
      });
    } else {
      Alert.alert('Please select ACCOUNT and CATEGORY to continue');
    }
  };

  const onHideDialog = () => {
    setTransaction(null);
    setRemovedIndex(null);
    setBodyVisible(false);
    setShowHelp(false);
    dispatch(smsTransactionsActions.hideDialog());
  };

  const onSkipTransacton = () => {
    let nextTransaction = [...transactions].find(
      t => t.id === transaction.id + 1,
    );

    if (nextTransaction) {
      setTransaction(nextTransaction);
    } else {
      onHideDialog();
    }
  };

  const onRemoveTransaction = async () => {
    let removedTransactionsData = JSON.parse(
      await AsyncStorage.getItem('@expenses-manager-removed-transactions'),
    );
    if (removedTransactionsData && removedTransactionsData.transactions) {
      let trns = removedTransactionsData.transactions;
      if (trns && trns.length > 0) {
        let alreadyExists = trns.find(t => t.body === transaction.body);
        if (!alreadyExists) {
          removedTransactionsData.transactions.push(transaction);
        }
      }
    } else {
      let obj = {
        date: moment().format('DD-MM-YYYY'),
        transactions: [transaction],
      };
      removedTransactionsData = obj;
    }

    await AsyncStorage.setItem(
      '@expenses-manager-removed-transactions',
      JSON.stringify(removedTransactionsData),
    );

    setRemovedIndex(transaction.id);
    let currentTransactions = [...transactions];
    let remainingTransactions = currentTransactions.filter(
      t => t.id !== transaction.id,
    );
    remainingTransactions.forEach((t, index) => (t.id = index));
    if (remainingTransactions.length === 0) {
      onHideDialog();
    }

    dispatch(smsTransactionsActions.setTransactions(remainingTransactions));
  };

  const onPreviousTransaction = () => {
    let previousTransaction = [...transactions].find(
      t => t.id === transaction.id - 1,
    );

    if (previousTransaction) {
      setTransaction(previousTransaction);
    }
  };

  const onClickShowMessage = () => {
    setBodyVisible(!bodyVisible);
  };

  const onClickShowHelp = () => {
    setShowHelp(!showHelp);
  };

  const onRemoveAllTransactions = async () => {
    let removedTransactionsData = JSON.parse(
      await AsyncStorage.getItem('@expenses-manager-removed-transactions'),
    );
    if (removedTransactionsData && removedTransactionsData.transactions) {
      let trns = removedTransactionsData.transactions;
      if (trns && trns.length > 0) {
        transactions.forEach(tns => {
          let alreadyExists = trns.find(t => t.body === tns.body);
          if (!alreadyExists) {
            removedTransactionsData.transactions.push(tns);
          }
        });
      }
    } else {
      let obj = {
        date: moment().format('DD-MM-YYYY'),
        transactions: [...transactions],
      };
      removedTransactionsData = obj;
    }

    await AsyncStorage.setItem(
      '@expenses-manager-removed-transactions',
      JSON.stringify(removedTransactionsData),
    );

    onHideDialog();
  };
  const onSkipAllTransactions = () => {
    dispatch(smsTransactionsActions.setTransactions([]));
    onHideDialog();
  };

  useEffect(() => {
    (async () => {
      if (
        transactions?.length > 0 &&
        sheets?.length > 0 &&
        dialogVisible &&
        !sheetsLoading
      ) {
        let trns = null;

        if (removedIndex) {
          trns = transactions[removedIndex];
        } else {
          trns = transactions[0];
        }

        const catData = await onGetCategories(trns.categoryType);

        setCategories(catData || []);
        setTransaction(trns);
      }
    })();
  }, [transactions, sheets, dialogVisible, sheetsLoading]);

  useEffect(() => {
    (async () => {
      if (transaction) {
        let values = [];
        let colors = [];
        categories.forEach(item => {
          let obj = {
            value: _.capitalize(item.name),
            key: item.id,
          };
          values.push(obj);
          colors.push(item.color);
        });
        setCategoryItems(values);

        if (selectedCategory) {
          let categoryExists = categories.find(
            c => c.id === selectedCategory.key,
          );
          if (categoryExists) {
            setSelectedCategory({
              key: categoryExists.id,
              value: categoryExists.name,
            });
          } else {
            setSelectedCategory({
              key: transaction.category.id,
              value: transaction.category.name,
            });
          }
        } else {
          setSelectedCategory({
            key: transaction.category.id,
            value: transaction.category.name,
          });
        }
      }
    })();
  }, [transaction]);

  useEffect(() => {
    if (!sheetsLoading && sheets && sheets.length > 0) {
      let values = [];
      sheets.forEach(item => {
        let obj = {
          value: _.capitalize(item.name),
          key: item.id,
        };
        values.push(obj);
      });
      setSheetItems(values);
      setSelectedSheet({
        key: values[0].key,
        value: values[0].value,
      });
    } else if (!sheetsLoading && (!sheets || sheets.length === 0)) {
      // Only hide if loading is done and still no sheets
      onHideDialog();
    }
  }, [sheets, sheetsLoading]);

  return transaction ? (
    <Portal>
      <Dialog
        visible={dialogVisible}
        dismissable={false}
        theme={{
          colors: {
            backdrop: 'rgba(0, 0, 0, 0.5)',
          },
        }}>
        <Dialog.ScrollArea>
          <View
            style={{
              position: 'absolute',
              right: -10,
              top: -40,
            }}>
            <MaterialCommunityIcons
              onPress={onRemoveTransaction}
              name={'trash-can'}
              size={20}
              style={{backgroundColor: 'red', padding: 10, borderRadius: 50}}
              color={'#fff'}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Dialog.Title style={{alignSelf: 'center', fontWeight: 'bold'}}>
              Transactions Found({transactions.length})
            </Dialog.Title>
            <View>
              <>
                <Text
                  fontfamily="heading"
                  fontsize="16px"
                  style={{textAlign: 'center', fontWeight: 'bold'}}>
                  {formatDateTzReadable(transaction.date)}
                </Text>
                <Spacer size={'large'} />
                <FlexRow style={{alignSelf: 'center'}}>
                  <Text
                    fontfamily="monospace"
                    fontsize="34px"
                    style={{fontWeight: 'bold'}}
                    color={
                      transaction.categoryType === 'income'
                        ? '#4BB543'
                        : 'tomato'
                    }>
                    {transaction.categoryType === 'expense' ? '-' : '+'}{' '}
                    {GetCurrencySymbol(
                      userAdditionalDetails &&
                        userAdditionalDetails.baseCurrency
                        ? userAdditionalDetails.baseCurrency
                        : getCurrencies()[0]
                        ? getCurrencies()[0]
                        : 'INR',
                    )}{' '}
                    {GetCurrencyLocalString(transaction.amount)}
                  </Text>
                  <Spacer position={'left'} size={'large'}>
                    <MaterialCommunityIcons
                      onPress={onClickShowMessage}
                      name={bodyVisible ? 'eye-off' : 'eye'}
                      size={20}
                      color={theme.colors.brand.primary}
                    />
                  </Spacer>
                </FlexRow>
              </>

              <>
                {bodyVisible && (
                  <>
                    <Text
                      fontfamily="monospace"
                      style={{fontSize: 14, marginTop: 10}}>
                      Text Read From : {transaction.body}
                    </Text>
                  </>
                )}

                <View style={{marginTop: 10}}>
                  <Text>Add to account</Text>
                  <Spacer size="medium" />

                  <SelectList
                    setSelected={id => {
                      let sheet = sheets.find(s => s.id === id);
                      setSelectedSheet({
                        key: id,
                        value: sheet.name,
                      });
                    }}
                    data={sheetItems}
                    label="Accounts"
                    placeholder="Select Account"
                    notFoundText="No Accounts Found"
                    defaultOption={selectedSheet}
                    dropdownTextStyles={{color: theme.colors.text.primary}}
                    inputStyles={{
                      color: theme.colors.text.primary,
                    }}
                    searchPlaceholder="Search Account"
                  />

                  <Spacer size="medium" />
                  <Text>Add to category</Text>

                  <Spacer size="medium" />
                  <SelectList
                    setSelected={id => {
                      if (selectedCategory?.key !== id) {
                        const category = categories.find(c => c.id === id);
                        setSelectedCategory({
                          key: id,
                          value: category?.name || '',
                        });
                      }
                    }}
                    data={categoryItems}
                    key={selectedCategory?.key || 'default'}
                    label="Categories"
                    placeholder="Select Category"
                    notFoundText="No Categories Found"
                    defaultOption={selectedCategory}
                    dropdownTextStyles={{color: theme.colors.text.primary}}
                    inputStyles={{
                      color: theme.colors.text.primary,
                    }}
                    searchPlaceholder="Search Category"
                  />
                </View>
                <Spacer size="large" />

                <FlexRow justifyContent="center">
                  <Button
                    theme={{roundness: 10}}
                    mode="text"
                    onPress={onRemoveAllTransactions}
                    icon={'trash-can'}
                    textColor="grey">
                    <ButtonText color="grey">Remove All</ButtonText>
                  </Button>

                  <Button
                    theme={{roundness: 10}}
                    mode="text"
                    onPress={onSkipAllTransactions}
                    icon={'skip-next'}
                    textColor={'grey'}>
                    <ButtonText color={'grey'}>Skip All</ButtonText>
                  </Button>
                </FlexRow>
                <FlexRow justifyContent="center">
                  <Button
                    theme={{roundness: 10}}
                    mode="text"
                    onPress={onClickShowHelp}
                    icon={'help-circle'}
                    textColor="#5bc0de">
                    <ButtonText color="#5bc0de">Help ?</ButtonText>
                  </Button>
                </FlexRow>

                {showHelp && (
                  <Spacer size="xlarge">
                    <FlexRow>
                      <MaterialCommunityIcons
                        name={'skip-next'}
                        size={20}
                        color={'grey'}
                      />
                      <Spacer position={'left'} size="medium">
                        <Text style={{fontSize: 14, fontWeight: '500'}}>
                          When you reopen the app, SKIP will enable you to
                          display the dialogue for the transaction you skipped.
                        </Text>
                      </Spacer>
                    </FlexRow>
                    <Spacer size="large" />
                    <FlexRow>
                      <MaterialCommunityIcons
                        name={'trash-can'}
                        size={20}
                        color={'red'}
                      />
                      <Spacer position={'left'} size="medium">
                        <Text style={{fontSize: 14, fontWeight: '500'}}>
                          When you select Remove, the transaction will be
                          deleted and this dialogue box won't appear when you
                          open the app again.
                        </Text>
                      </Spacer>
                    </FlexRow>
                    <Spacer position={'bottom'} size="large" />
                  </Spacer>
                )}
              </>
            </View>
            <Dialog.Actions>
              <Button
                mode="text"
                onPress={onPreviousTransaction}
                icon={'arrow-left'}
                disabled={transaction.id === 0}
                textColor={'grey'}>
                <ButtonText color={'grey'}>Prev</ButtonText>
              </Button>

              <Button
                theme={{roundness: 10}}
                mode="text"
                onPress={onSkipTransacton}
                icon={'skip-next'}
                disabled={transactions.length - 1 === transaction.id}
                textColor={theme.colors.brand.primary}>
                <ButtonText
                  color={
                    transactions.length - 1 === transaction.id
                      ? 'grey'
                      : theme.colors.brand.primary
                  }>
                  Skip
                </ButtonText>
              </Button>

              <Button
                mode="contained"
                style={{padding: 5, marginLeft: 5, marginRight: -10}}
                // onPress={!loading ? onClickAddAndContinue : () => {}}
                onPressIn={onClickAddAndContinue}
                icon={'plus'}
                textColor="#fff"
                loading={loading}>
                Add
              </Button>
            </Dialog.Actions>
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  ) : null;
};
