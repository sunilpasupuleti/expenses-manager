/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {
  Image,
  Platform,
  SectionList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useIsFocused} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {MotiView} from 'moti';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated from 'react-native-reanimated';
import Fuse from 'fuse.js';
import moment from 'moment';
import _ from 'lodash';

import {AuthenticationContext} from '../../../../services/authentication/authentication.context';
import {BankAccountContext} from '../../../../services/bank-account/bank-account.context';
import {FlexRow} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {notificationActions} from '../../../../store/notification-slice';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {GetCurrencySymbol} from '../../../../components/symbol.currency';
import {ActivityIndicator, Button, Modal, Portal} from 'react-native-paper';
import {View} from 'react-native';

// Import styled components
import {
  Container,
  Header,
  InstitutionHeader,
  InstitutionInfo,
  InstitutionName,
  AccountDetails,
  InstitutionLogo,
  ControlsCard,
  SearchContainer,
  SearchInput,
  FilterButton,
  RefreshButton,
  RefreshButtonText,
  DateRangeText,
  TransactionCard,
  Row,
  TransactionLeft,
  TransactionRight,
  Logo,
  TransactionInfo,
  TransactionTitle,
  TransactionSubText,
  TransactionAmount,
  SectionHeader,
  SectionTitle,
  SectionBalance,
  EmptyStateContainer,
  EmptyStateImage,
  EmptyStateText,
  LoadingFooter,
  LoadingText,
  PendingBadge,
  PendingText,
  BackButton,
  BackButtonText,
} from '../../components/bank-transactions/bank-transactions.styles';
import plaidCategories from '../../../../components/utility/plaidCategories.json';
import {RenderBlurView} from '../../../../components/utility/safe-area.component';

export const BankTransactionsScreen = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const {institution, account} = route.params;

  const [transactions, setTransactions] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const {userData} = useContext(AuthenticationContext);
  const {getTransactions} = useContext(BankAccountContext);
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
      moment(item.date).format('MMM DD, YYYY - dddd'),
    );

    let totalIncome = 0,
      totalExpense = 0;

    const sections = Object.keys(grouped).map(date => {
      let txns = grouped[date];
      txns.map(t => {
        const amount = t.amount;
        const isExpense = amount > 0 ? true : false;

        if (isExpense) {
          totalExpense += Math.abs(amount);
        } else {
          totalIncome += Math.abs(amount);
        }
      });

      return {
        title: date,
        data: txns,
        totalBalance: totalIncome - totalExpense,
        iso_currency_code: txns[0]?.iso_currency_code,
      };
    });

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

  const getShortDescription = detailedCategory => {
    const match = plaidCategories.find(
      cat => cat.detailed === detailedCategory,
    );
    return match ? match.shortDescription : '';
  };

  const renderTransaction = ({item, index}) => {
    const isExpense = item.amount > 0 ? true : false;
    const amountColor = isExpense ? '#ffb3b3' : '#b3ffb3';
    const isPending = item.pending;
    const merchantName = item.merchant_name || item.name;
    const truncatedName = _.truncate(merchantName, {
      length: 25,
      separator: ' ',
    });

    return (
      <TransactionCard>
        <Row>
          <TransactionLeft>
            <Logo
              source={
                item.logo_url
                  ? {uri: item.logo_url}
                  : item.personal_finance_category_icon_url
                  ? {uri: item.personal_finance_category_icon_url}
                  : require('../../../../../assets/bank.png')
              }
            />
            <TransactionInfo>
              <TransactionTitle numberOfLines={2} ellipsizeMode="tail">
                {truncatedName}
              </TransactionTitle>
              <TransactionSubText>
                {getShortDescription(
                  item.personal_finance_category?.detailed,
                ) || 'Category'}{' '}
              </TransactionSubText>
            </TransactionInfo>
          </TransactionLeft>

          <TransactionRight>
            {isPending && (
              <PendingBadge>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={12}
                  color="#ffd700"
                />
                <PendingText>Pending</PendingText>
              </PendingBadge>
            )}
            <TransactionAmount color={amountColor}>
              {isExpense ? '-' : '+'}{' '}
              {GetCurrencySymbol(item.iso_currency_code)}{' '}
              {Math.abs(item.amount).toFixed(2)}
            </TransactionAmount>
          </TransactionRight>
        </Row>
      </TransactionCard>
    );
  };

  return (
    <>
      <Container>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="#8B5CF6"
        />

        <SafeAreaView edges={['top']}>
          <BackButton onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
            <BackButtonText>Accounts</BackButtonText>
          </BackButton>
        </SafeAreaView>

        <Header>
          <MotiView
            from={{opacity: 0, translateX: 50}}
            animate={{opacity: 1, translateX: 0}}
            transition={{type: 'timing', duration: 600}}>
            <InstitutionHeader>
              <InstitutionInfo>
                <InstitutionName>{institution.institutionName}</InstitutionName>
                <AccountDetails>
                  {account.name} - XXXX-{account.mask}
                </AccountDetails>
              </InstitutionInfo>
              <InstitutionLogo
                source={
                  institution.institutionLogo
                    ? {
                        uri: `data:image/png;base64,${institution.institutionLogo}`,
                      }
                    : require('../../../../../assets/bank.png')
                }
              />
            </InstitutionHeader>
          </MotiView>
        </Header>

        <MotiView
          from={{opacity: 0, translateY: 20}}
          animate={{opacity: 1, translateY: 0}}
          transition={{delay: 200, type: 'timing', duration: 600}}>
          <ControlsCard>
            <RefreshButton onPress={onHardRefreshTransactions}>
              <Ionicons name="refresh" size={18} color="white" />
              <RefreshButtonText>Refresh</RefreshButtonText>
            </RefreshButton>

            <SearchContainer>
              <SearchInput
                editable={!isLoadingMore}
                placeholder={`Search ${transactions.length} transactions`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
              />
              <FilterButton onPress={() => setModalVisible(true)}>
                <Ionicons name="filter" size={22} color="white" />
              </FilterButton>
            </SearchContainer>

            <DateRangeText>
              {moment(fromDate).format('MMM DD, YYYY')} -{' '}
              {moment(toDate).format('MMM DD, YYYY')}
            </DateRangeText>
          </ControlsCard>
        </MotiView>

        <Portal>
          <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}>
            <View style={{margin: 10}}>
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
                  textColor="#fff"
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
          <SectionList
            scrollEnabled={!isLoadingMore}
            sections={groupedData}
            keyExtractor={item => item.transaction_id}
            renderItem={renderTransaction}
            renderSectionHeader={({
              section: {title, totalBalance, iso_currency_code},
            }) => (
              <SectionHeader>
                <SectionTitle>{title}</SectionTitle>
                <SectionBalance
                  color={totalBalance < 0 ? '#ffb3b3' : '#b3ffb3'}>
                  {totalBalance < 0 ? '-' : ''}{' '}
                  {GetCurrencySymbol(iso_currency_code)}{' '}
                  {Math.abs(totalBalance).toFixed(2)}
                </SectionBalance>
              </SectionHeader>
            )}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={true}
            contentContainerStyle={{paddingBottom: 80}}
            onEndReached={handleEndReached}
            ListFooterComponent={
              isLoadingMore && (
                <LoadingFooter>
                  <ActivityIndicator animating={true} color="white" />
                  <LoadingText>Loading more transactions...</LoadingText>
                </LoadingFooter>
              )
            }
            onEndReachedThreshold={0.6}
          />
        ) : (
          <EmptyStateContainer>
            <EmptyStateImage
              source={require('../../../../../assets/no_accounts.png')}
            />
            <EmptyStateText>No Recent Transactions Found</EmptyStateText>
          </EmptyStateContainer>
        )}
      </Container>
      <RenderBlurView />
    </>
  );
};
