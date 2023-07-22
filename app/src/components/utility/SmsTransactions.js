import React, {useContext, useEffect, useState} from 'react';
import {Button, Dialog, Portal} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {smsTransactionsActions} from '../../store/smsTransactions-slice';
import {Text} from '../typography/text.component';
import {GetCurrencyLocalString, GetCurrencySymbol} from '../symbol.currency';
import {getCurrencies} from 'react-native-localize';
import moment from 'moment';
import {Spacer} from '../spacer/spacer.component';
import {useTheme} from 'styled-components/native';
import {useTheme as rnpUseTheme} from 'react-native-paper';
import {ButtonText, FlexRow} from '../styles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Alert, ScrollView, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SheetsContext} from '../../services/sheets/sheets.context';
import _ from 'lodash';
import {AuthenticationContext} from '../../services/authentication/authentication.context';
import {SelectList} from 'react-native-dropdown-select-list';

export const SmsTransactions = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const {dialogVisible, transactions} = useSelector(
    state => state.smsTransactions,
  );

  const {userAdditionalDetails} = useContext(AuthenticationContext);

  const {categories, sheets, onSaveSheetDetails} = useContext(SheetsContext);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryItems, setCategoryItems] = useState([]);

  const [sheetItems, setSheetItems] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);

  const [transaction, setTransaction] = useState(null);

  const [removedIndex, setRemovedIndex] = useState(null);

  const [bodyVisible, setBodyVisible] = useState(false);

  const [showHelp, setShowHelp] = useState(false);

  const onClickAddAndContinue = () => {
    if (selectedSheet && selectedCategory && transaction) {
      let date = new Date(transaction.date).toString();
      let time = new Date(transaction.date).toString();
      let categoryType = transaction.categoryType;
      let category = categories[categoryType].find(
        c => c.id === selectedCategory.key,
      );

      let sheet = sheets.find(s => s.id === selectedSheet.key);

      let sheetDetail = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        amount: parseFloat(transaction.amount),
        notes: '',
        type: categoryType,
        category: category,
        date: date,
        showTime: true,
        createdAt: Date.now(),
        image: {url: null},
        time: time,
      };

      setLoading(true);
      onSaveSheetDetails(sheet, sheetDetail, updatedSheet => {
        onRemoveTransaction();
        setLoading(false);
        // navigation.navigate('SheetDetails', {sheet: updatedSheet});
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
    if (
      transactions &&
      transactions.length > 0 &&
      sheets &&
      sheets.length > 0
    ) {
      let trns = null;
      if (removedIndex) {
        trns = transactions[removedIndex];
        setTransaction(trns);
      } else {
        trns = transactions[0];
        setTransaction(trns);
      }
    } else {
      onHideDialog();
    }
  }, [transactions, sheets]);

  useEffect(() => {
    if (transaction) {
      let cat = categories[transaction.categoryType];
      // console.log(cat);
      let values = [];
      let colors = [];
      cat.forEach(item => {
        let obj = {
          value: _.capitalize(item.name),
          key: item.id,
        };
        values.push(obj);
        let categoryObj = cat.filter(c => c.id === item.id)[0];
        if (!categoryObj) {
          colors.push(item.color);
        } else {
          colors.push(categoryObj.color);
        }
      });
      setCategoryItems(values);
      if (selectedCategory) {
        let categoryExists = cat.find(c => c.id === selectedCategory.key);
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
  }, [categories, transaction]);

  useEffect(() => {
    if (sheets && sheets.length > 0) {
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
    } else {
      onHideDialog();
    }
  }, [sheets]);

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
                  {moment(transaction.date).format('DD MMM YYYY, hh:mm:ss A')}
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
                      let category = categories[transaction.categoryType].find(
                        c => c.id === id,
                      );
                      setSelectedCategory({
                        key: id,
                        value: category.name,
                      });
                    }}
                    data={categoryItems}
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
                onPress={!loading ? onClickAddAndContinue : () => {}}
                icon={'plus'}
                buttonColor={theme.colors.brand.primary}
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
