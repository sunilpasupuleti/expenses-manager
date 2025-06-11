/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  SectionList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useIsFocused} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AuthenticationContext} from '../../../../services/authentication/authentication.context';
import {BankAccountContext} from '../../../../services/bank-account/bank-account.context';
import {FlexColumn, FlexRow, MainWrapper} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {notificationActions} from '../../../../store/notification-slice';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {
  ActivityIndicator,
  Button,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Searchbar,
} from 'react-native-paper';
import {View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Spacer} from '../../../../components/spacer/spacer.component';
import Animated from 'react-native-reanimated';
import {
  Logo,
  Row,
  SearchContainer,
  SearchInput,
  TransactionAmount,
  TransactionCard,
  TransactionSubText,
  TransactionTitle,
} from '../../components/bank-transactions/bank-transactions.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import _ from 'lodash';
import Fuse from 'fuse.js';
import {GetCurrencySymbol} from '../../../../components/symbol.currency';

export const BankTransactionsScreen = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const {institution, account} = route.params;
  const [transactions, setTransactions] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const {userData} = useContext(AuthenticationContext);
  const {getTransactions} = useContext(BankAccountContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [fromDate, setFromDate] = useState(
    moment().subtract(30, 'days').toDate(),
  );
  const [toDate, setToDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState({from: false, to: false});
  const [pickerTarget, setPickerTarget] = useState(null);

  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;

  const dispatch = useDispatch();

  useEffect(() => {
    if (routeIsFocused) {
    } else {
    }
  }, [routeIsFocused]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <FlexRow>
          {route.params?.institution?.institutionLogo && (
            <Image
              source={{
                uri: `data:image/png;base64,${route.params.institution.institutionLogo}`,
              }}
              style={{
                width: 30,
                height: 30,
                marginRight: 10,
                resizeMode: 'contain',
              }}
            />
          )}
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.colors.text.primary,
            }}>
            {route.params?.institution?.institutionName || 'Bank Details'}
          </Text>
        </FlexRow>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FlexRow>
            <Ionicons
              name="chevron-back-outline"
              size={25}
              color={theme.colors.brand.primary}></Ionicons>
            <Text color={theme.colors.brand.primary}>Back</Text>
          </FlexRow>
        </TouchableOpacity>
      ),
    });
  }, [route.params]);

  useEffect(() => {
    onGetTransactions();
  }, []);

  useEffect(() => {
    const fuse = new Fuse(transactions, {
      keys: ['merchant_name', 'name', 'amount'],
      threshold: 0.3,
      ignoreLocation: true,
      includeScore: true,
      useExtendedSearch: false,
      isCaseSensitive: false,
      findAllMatches: true,
    });

    const filtered =
      searchQuery.trim().length > 0
        ? fuse.search(searchQuery).map(result => result.item)
        : transactions;

    const grouped = _.groupBy(filtered, item =>
      moment(item.date).format('MMM DD, YYYY'),
    );
    const sections = Object.keys(grouped).map(date => ({
      title: date,
      data: grouped[date],
    }));

    setGroupedData(sections);
  }, [searchQuery, transactions]);

  const showNotification = (status = 'error', message) => {
    dispatch(
      notificationActions.showToast({
        status: status,
        message: message,
      }),
    );
  };

  const renderTransaction = ({item}) => {
    // plaid handles reverse
    const isExpense = item.amount > 0 ? true : false; //money moving out treated as positive in plaid
    const amountColor = isExpense ? 'tomato' : theme.colors.text.success;
    const isPending = item.pending;

    return (
      <Animated.View entering={Animated.FadeInUp} exiting={Animated.FadeOutUp}>
        <TransactionCard>
          <Row>
            <Row>
              <Logo
                source={
                  item.logo_url
                    ? {uri: item.logo_url}
                    : item.personal_finance_category_icon_url
                    ? {uri: item.personal_finance_category_icon_url}
                    : require('../../../../../assets/bank.png')
                }
              />
              <View>
                <TransactionTitle
                  numberOfLines={5}
                  ellipsizeMode="tail"
                  style={{maxWidth: 180, fontSize: 14}}>
                  {item.merchant_name || item.name}
                </TransactionTitle>

                <TransactionSubText>
                  {moment(item.date).format('MMM DD, YYYY')}
                </TransactionSubText>
                <TransactionSubText>
                  {item.personal_finance_category?.primary || 'Category'}
                </TransactionSubText>

                <TransactionSubText>
                  Transaction Channel - {item.payment_channel}
                </TransactionSubText>
              </View>
            </Row>
            <View>
              {isPending && (
                <FlexRow gap={5} style={{marginTop: 2}}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color="orange"
                  />
                  <Text style={{fontSize: 12, color: 'orange'}}>Pending</Text>
                </FlexRow>
              )}
              <TransactionAmount style={{color: amountColor}}>
                {isExpense ? '-' : '+'}{' '}
                {GetCurrencySymbol(item.iso_currency_code)}{' '}
                {Math.abs(item.amount).toFixed(2)}
              </TransactionAmount>
            </View>
          </Row>
        </TransactionCard>
      </Animated.View>
    );
  };

  const handleDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowPicker({from: false, to: false});
      return;
    }

    if (event.type === 'set') {
      if (pickerTarget === 'from') {
        setFromDate(selectedDate || fromDate);
      } else {
        setToDate(selectedDate || toDate);
      }
      setShowPicker({from: false, to: false});
    }
  };

  const onHardRefreshTransactions = () => {
    onGetTransactions(true, true);
  };

  const onGetTransactions = (reset = true, refresh = false) => {
    const startDate = moment(fromDate).format('YYYY-MM-DD');
    console.log(reset, refresh);

    const endDate = moment(toDate).format('YYYY-MM-DD');

    const data = {
      accessToken: institution.accessToken,
      accountId: account.account_id,
      startDate: startDate,
      endDate: endDate,
      offset: reset ? 0 : offset,
      count: LIMIT,
      refresh: refresh,
    };

    getTransactions(
      data,
      res => {
        if (res.refreshedTransactions) {
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message: res.message,
            }),
          );

          return navigation.goBack();
        }
        if (res.transactions) {
          const newTxns = reset
            ? res.transactions
            : [...transactions, ...res.transactions];

          setTransactions(newTxns);
          setOffset(prev => prev + res.transactions.length);
          setHasMore(res.transactions.length === LIMIT);
        }
        setIsLoadingMore(false);
      },

      err => {
        console.log(err);
        setIsLoadingMore(false);
        navigation.goBack();
      },
      reset ? true : false,
    );
  };

  const handleEndReached = () => {
    if (
      !isLoadingMore &&
      hasMore &&
      transactions.length >= LIMIT &&
      searchQuery.trim().length === 0
    ) {
      setIsLoadingMore(true);
      onGetTransactions(false);
    }
  };

  return (
    <SafeArea child={true}>
      <MainWrapper>
        <>
          <FlexRow
            style={{alignItems: 'center', justifyContent: 'space-between'}}>
            <Button mode="outlined" style={{width: '85%', marginRight: 10}}>
              {account.name} - {account.mask}
            </Button>
            <IconButton
              icon="reload"
              mode="contained"
              containerColor={theme.colors.brand.primary}
              iconColor="#fff"
              size={20}
              onPress={onHardRefreshTransactions}
            />
          </FlexRow>

          <Text
            fontsize="12px"
            variantType="caption"
            color={'#888'}
            style={{
              marginTop: 6,
              textAlign: 'center',
            }}>
            If you think the data isn't up to date, tap to fetch real-time
            transactions. Limited to 3 times/day.
          </Text>

          <Spacer size="large">
            <FlexRow justifyContent="space-between">
              <SearchContainer>
                <SearchInput
                  editable={!isLoadingMore}
                  placeholder={`Search ${transactions.length} transactions`}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999"
                />
              </SearchContainer>

              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{marginLeft: 10}}>
                <MaterialCommunityIcons
                  name="filter"
                  size={24}
                  color={theme.colors.brand.primary}
                />
              </TouchableOpacity>
            </FlexRow>
            <Text
              fontsize="12px"
              style={{
                marginTop: 8,
                marginBottom: 10,
              }}>
              Showing results from {moment(fromDate).format('MMM DD, YYYY')} to{' '}
              {moment(toDate).format('MMM DD, YYYY')}
            </Text>
          </Spacer>
        </>

        <Portal>
          <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}>
            <View
              style={{
                margin: 10,
              }}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  padding: 20,
                }}>
                <Text fontfamily="heading">Filter by Date</Text>
                <Spacer size="large" />
                <Button
                  icon="calendar"
                  mode="outlined"
                  onPress={() => {
                    setPickerTarget('from');
                    setShowPicker({from: true, to: false});
                  }}>
                  From: {moment(fromDate).format('DD MMM YYYY')}
                </Button>
                {/* Platform-specific pickers */}
                {showPicker.from && Platform.OS === 'android' && (
                  <Spacer size="large">
                    <DateTimePicker
                      value={fromDate}
                      mode="date"
                      onChange={handleDateChange}
                      display="default"
                    />
                  </Spacer>
                )}
                {Platform.OS === 'ios' && showPicker.from && (
                  <Spacer size="large">
                    <DateTimePicker
                      value={fromDate}
                      mode="date"
                      onChange={handleDateChange}
                    />
                  </Spacer>
                )}
                <Spacer size="large" />
                <Button
                  icon="calendar"
                  mode="outlined"
                  onPress={() => {
                    setPickerTarget('to');
                    setShowPicker({from: false, to: true});
                  }}>
                  To: {moment(toDate).format('DD MMM YYYY')}
                </Button>
                {showPicker.to && Platform.OS === 'android' && (
                  <Spacer size="large">
                    <DateTimePicker
                      value={toDate}
                      mode="date"
                      onChange={handleDateChange}
                      display="default"
                    />
                  </Spacer>
                )}

                {Platform.OS === 'ios' && showPicker.to && (
                  <Spacer size="large">
                    <DateTimePicker
                      value={toDate}
                      mode="date"
                      onChange={handleDateChange}
                    />
                  </Spacer>
                )}

                <Spacer size="large" />
                <Button
                  mode="contained"
                  onPress={() => {
                    setModalVisible(false);
                    setOffset(0);
                    setHasMore(true);
                    setTransactions([]);
                    onGetTransactions();
                  }}>
                  Apply
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
        {transactions && transactions.length > 0 ? (
          <>
            <Spacer size="large">
              <SectionList
                scrollEnabled={!isLoadingMore}
                sections={groupedData}
                keyExtractor={item => item.transaction_id}
                renderItem={renderTransaction}
                renderSectionHeader={({section: {title}}) => (
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 5,
                      backgroundColor: theme.colors.bg.sectionListCard,
                    }}>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: theme.colors.bg.sectionListCardLabel,
                      }}>
                      {title}
                    </Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={true}
                ItemSeparatorComponent={Divider}
                contentContainerStyle={{paddingBottom: 150}}
                onEndReached={handleEndReached}
                ListFooterComponent={
                  isLoadingMore && (
                    <View style={{paddingVertical: 20, alignItems: 'center'}}>
                      <ActivityIndicator
                        animating={true}
                        color={theme.colors.brand.primary}
                      />
                      <Text style={{marginTop: 10}}>
                        Fetching more transactions...
                      </Text>
                    </View>
                  )
                }
                onEndReachedThreshold={0.6}
              />
            </Spacer>
          </>
        ) : (
          <FlexColumn
            style={{
              marginBottom: 200,
            }}>
            <Image
              source={require('../../../../../assets/no_accounts.png')}
              style={{
                width: '80%',
                height: '80%',
                resizeMode: 'contain',
              }}
            />
            <Text fontsize="20px">No Recent Transactions Found</Text>
          </FlexColumn>
        )}
      </MainWrapper>
    </SafeArea>
  );
};
