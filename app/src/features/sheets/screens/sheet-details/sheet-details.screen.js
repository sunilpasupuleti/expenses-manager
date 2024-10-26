/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-shadow */
import React, {useContext, useEffect, useState, useRef} from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {
  FlatList,
  Pressable,
  RefreshControl,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from 'styled-components/native';

import moment from 'moment';
import _ from 'lodash';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import {useDispatch} from 'react-redux';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {
  FlexRow,
  Input,
  MainWrapper,
  NotFoundContainer,
} from '../../../../components/styles';

import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {
  BottomIconsContainer,
  CameraButton,
  CameraIcon,
  FilterIconContainer,
  SheetDetailsAddIcon,
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../../components/sheet-details/sheet-details.styles';
import {SheetDetailsInfo} from '../../components/sheet-details/sheet-details-info.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {useIsFocused} from '@react-navigation/native';
import {FadeInView} from '../../../../components/animations/fade.animation';
import Lottie from 'lottie-react-native';
import noTransactions from '../../../../../assets/lottie/no_transactions.json';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
import {searchKeywordRegex} from '../../../../components/utility/helper';
import {SheetStatsDetailsScreen} from '../../components/sheet-stats/sheet-stats-details.component';
import {fetchExchangeRates} from '../../../../store/service-slice';

export const SheetDetailsScreen = ({navigation, route}) => {
  // for filtering purpose
  // original sheet without change

  const [refreshing, setRefreshing] = useState(false);

  const routeIsFocused = useIsFocused();

  const [totalBalance, setTotalBalance] = useState(0);

  const [filterParams, setFilterParams] = useState({
    status: false,
    fromDate: null,
    toDate: null,
  });

  const theme = useTheme();
  const [searchKeyword, setSearchKeyword] = useState(null);
  const {getSheetDetails} = useContext(SheetDetailsContext);
  const [sheetDetails, setSheetDetails] = useState({
    totalCount: 0,
    totalUpcomingCount: 0,
    transactions: [],
    upcomingTransactions: [],
  });

  const {currentSheet} = useContext(SheetsContext);
  const {onSmartScanReceipt} = useContext(SheetDetailsContext);
  const {onCheckUpcomingSheetDetails} = useContext(SheetDetailsContext);
  let menuRef = useRef();
  let cameraRef = useRef();
  const dispatch = useDispatch();

  const menuOptionStyles = {
    optionWrapper: {padding: 15, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };

  useEffect(() => {
    if (routeIsFocused) {
      setNavigationOptions();
      let filterBy = null;
      if (route.params?.filter) {
        filterBy = route.params.filter;
        setFilterParams(filterBy);
      }
      checkUpcomingDetails(filterBy);
      onGetSheetDetails(currentSheet, null, filterBy);
    } else {
      setSearchKeyword(null);
    }
  }, [routeIsFocused]);

  const setNavigationOptions = () => {
    navigation.setOptions({
      headerTitle:
        currentSheet?.name?.length > 25
          ? currentSheet.name.substring(0, 25) + '...'
          : currentSheet.name,
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
      headerRight: () => (
        <Menu
          style={{marginRight: 20}}
          onBackdropPress={() => menuRef.current.close()}
          ref={element => (menuRef.current = element)}>
          <MenuTrigger
            customStyles={{
              triggerTouchable: {
                underlayColor: '#eee',
                onPress: () => {
                  menuRef.current.open();
                },
              },
              TriggerTouchableComponent: TouchableOpacity,
            }}>
            <MaterialCommunityIcons
              name="dots-horizontal-circle-outline"
              size={25}
              color={theme.colors.brand.primary}
            />
          </MenuTrigger>
          <MenuOptions
            optionsContainerStyle={{
              marginRight: 10,
              marginTop: 35,
              borderRadius: 10,
              minWidth: 250,
            }}>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                navigation.navigate('SheetStats');
                menuRef.current.close();
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Analytics
                </Text>
                <Ionicons
                  style={{paddingBottom: 8}}
                  name="pie-chart-outline"
                  size={20}
                  color={'#000'}
                />
              </FlexRow>
            </MenuOption>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                navigation.navigate('SheetTrends', {currentSheet});
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Trends
                </Text>
                <Ionicons
                  style={{paddingBottom: 8}}
                  name="trending-up-outline"
                  size={20}
                  color={'#000'}
                />
              </FlexRow>
            </MenuOption>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                navigation.navigate('CurrencyRates', {
                  display: true,
                  selectedCurrency: currentSheet.currency,
                });
                dispatch(
                  fetchExchangeRates({
                    showAlert: false,
                    BASE_CURRENCY: currentSheet.currency,
                    dispatch: dispatch,
                  }),
                );
                menuRef.current.close();
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Curreny Rates
                </Text>
                <FontAwesome
                  style={{paddingBottom: 8}}
                  name="money"
                  size={20}
                  color={'#000'}
                />
              </FlexRow>
            </MenuOption>

            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                navigation.navigate('SheetExport', {
                  sheet: currentSheet,
                });
                // onClickExportData();
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Export Account
                </Text>
                <FontAwesome5
                  style={{paddingBottom: 8}}
                  name="file-export"
                  size={18}
                  color={theme.colors.brand.primary}
                />
              </FlexRow>
            </MenuOption>
          </MenuOptions>
          <Spacer size={'medium'} />
        </Menu>
      ),
    });
  };

  const checkUpcomingDetails = filterBy => {
    onCheckUpcomingSheetDetails(currentSheet, transactionExists => {
      if (transactionExists) {
        onGetSheetDetails(currentSheet, null, filterBy);
      }
    });
  };

  const onGetSheetDetails = async (
    sheet,
    searchKeyword = null,
    filterBy = null,
  ) => {
    let data = await getSheetDetails(sheet, searchKeyword, filterBy, false);

    if (data) {
      typeof data?.totalBalance === 'number'
        ? setTotalBalance(data.totalBalance)
        : setTotalBalance(sheet.totalBalance);
      setSheetDetails(data);
    }
  };

  useEffect(() => {
    if (searchKeyword !== null && searchKeywordRegex.test(searchKeyword)) {
      onSearch();
    } else if (searchKeyword === '') {
      onGetSheetDetails(currentSheet, null, filterParams);
    }
  }, [searchKeyword]);

  const onSearch = async () => {
    onGetSheetDetails(currentSheet, _.toLower(searchKeyword), filterParams);
  };

  const onClickScanButton = async mode => {
    let options = {
      mediaType: 'photo',
      cameraType: 'back',
      includeBase64: true,
      presentationStyle: 'popover',
    };
    let callback = response => {
      if (
        response &&
        response.assets &&
        response.assets[0] &&
        response.assets[0].base64
      ) {
        let onlyBase64 = response.assets[0].base64;
        let pictureType = response.assets[0].type;
        let pictureExtension = pictureType.split('/')[1];
        let base64 = 'data:' + pictureType + ';base64,' + onlyBase64;
        let uri = response.assets[0].uri;

        onSmartScanReceipt(onlyBase64, fetchedData => {
          if (fetchedData) {
            fetchedData.image = {
              type: pictureType,
              uri: uri,
              url: base64,
              extension: pictureExtension,
            };
          }
          navigation.navigate('AddSheetDetail', {
            smartScan: true,
            sheetDetail: fetchedData,
          });
        });
      }
    };
    if (mode === 'camera') {
      await launchCamera(options, response => {
        callback(response);
      });
    } else {
      await launchImageLibrary(options, response => {
        callback(response);
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    onCheckUpcomingSheetDetails(currentSheet, transactionExists => {
      setRefreshing(false);
      if (transactionExists) {
        onGetSheetDetails(currentSheet, null);
      }
    });
  };

  return (
    <SafeArea child={true}>
      {currentSheet && (
        <>
          <FlexRow justifyContent="center">
            <SheetDetailsTotalBalance
              fontsize={'30px'}
              fontfamily="bodySemiBold">
              {GetCurrencySymbol(currentSheet.currency)}{' '}
              {GetCurrencyLocalString(totalBalance)}
            </SheetDetailsTotalBalance>

            <FilterIconContainer>
              <MaterialCommunityIcons
                onPress={() =>
                  navigation.navigate('SheetDetailsFilter', {
                    filter: filterParams ? filterParams : null,
                  })
                }
                name={
                  filterParams && filterParams.status
                    ? 'filter-remove-outline'
                    : 'filter-outline'
                }
                size={30}
                color={theme.colors.brand.primary}
              />
            </FilterIconContainer>
          </FlexRow>

          <SheetDetailsUnderline amount={totalBalance.toString().length} />

          <Input
            value={searchKeyword}
            style={{elevation: 2, margin: 10, marginBottom: 0}}
            placeholder="Search by Category / Notes / Amount"
            onChangeText={k => setSearchKeyword(k)}
            clearButtonMode="while-editing"
          />
          {sheetDetails.totalUpcomingCount > 0 && (
            <Spacer size={'large'}>
              <Pressable
                onPress={() => {
                  navigation.navigate('UpcomingSheetDetails', {
                    sheetDetails: sheetDetails,
                  });
                }}>
                <FlexRow
                  justifyContent="space-between"
                  style={{paddingLeft: 16, paddingRight: 16}}>
                  <Text fontsize="20px" color={theme.colors.brand.primary}>
                    Upcoming ({sheetDetails.totalUpcomingCount})
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={30}
                    color={theme.colors.text.primary}
                  />
                </FlexRow>
              </Pressable>
            </Spacer>
          )}

          <Spacer size={'xlarge'} />
          {sheetDetails.totalCount > 0 && (
            <FlatList
              refreshControl={
                <RefreshControl
                  title="Checking upcoming transactions"
                  onRefresh={onRefresh}
                  refreshing={refreshing}
                />
              }
              data={sheetDetails.transactions}
              showsVerticalScrollIndicator={false}
              renderItem={({item, index}) => {
                let {transactions, totalExpense, totalIncome, date} = item;
                let totalBalance = totalIncome - totalExpense;

                return (
                  <FadeInView>
                    <SheetDetailsInfo
                      totalBalance={totalBalance}
                      onGetSheetDetails={onGetSheetDetails}
                      date={date}
                      sheetDetails={transactions}
                      navigation={navigation}
                      sheet={currentSheet}
                    />
                  </FadeInView>
                );
              }}
              keyExtractor={item => item.date}
              contentContainerStyle={{paddingBottom: 150}}
            />
          )}

          {sheetDetails.totalCount === 0 && (
            <NotFoundContainer>
              <Lottie
                style={{
                  width: '100%',
                  height: 300,
                  marginBottom: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                source={noTransactions}
                autoPlay
                loop
              />
            </NotFoundContainer>
          )}

          <BottomIconsContainer>
            {/*  for camera option */}
            <Menu
              onBackdropPress={() => cameraRef.current.close()}
              ref={element => (cameraRef.current = element)}>
              <MenuTrigger
                customStyles={{
                  triggerTouchable: {
                    underlayColor: '#eee',
                    // onPress: () => {
                    //   console.log('pressed');
                    //   menuRef.current.open();
                    // },
                  },
                  TriggerTouchableComponent: TouchableOpacity,
                }}>
                <CameraButton onPress={() => cameraRef.current.open()}>
                  <FlexRow>
                    <CameraIcon
                      name="scan"
                      size={20}
                      color="#fff"
                      // color={theme.colors.brand.primary}
                    />
                    <Spacer position={'left'}>
                      <Text fontsize="12px" color={'#fff'}>
                        Smart Scan Receipt
                      </Text>
                    </Spacer>
                  </FlexRow>
                </CameraButton>
              </MenuTrigger>

              <MenuOptions
                optionsContainerStyle={{
                  marginLeft: 35,
                  marginTop: -80,
                  borderRadius: 10,
                  minWidth: 250,
                }}>
                <MenuOption
                  customStyles={menuOptionStyles}
                  onSelect={() => {
                    cameraRef.current.close();
                    onClickScanButton('camera');
                  }}>
                  <FlexRow justifyContent="space-between">
                    <Text color="#2f2f2f" fontfamily="heading">
                      Take a Photo
                    </Text>
                    <Ionicons name="camera-outline" size={20} color="#000" />
                  </FlexRow>
                </MenuOption>
                <MenuOption
                  customStyles={menuOptionStyles}
                  onSelect={() => {
                    cameraRef.current.close();
                    onClickScanButton('gallery');
                  }}>
                  <FlexRow justifyContent="space-between">
                    <Text color="#2f2f2f" fontfamily="heading">
                      Choose a Photo
                    </Text>
                    <FontAwesome name="photo" size={20} color="#000" />
                  </FlexRow>
                </MenuOption>
              </MenuOptions>
              <Spacer size={'medium'} />
            </Menu>
            <SheetDetailsAddIcon>
              <TouchableNativeFeedback
                onPress={() => {
                  navigation.navigate('AddSheetDetail', {
                    sheet: currentSheet,
                  });
                }}>
                <FlexRow>
                  <AntDesign name="plus" size={20} color={'#fff'} />
                  <Spacer position={'left'}>
                    <Text fontsize="12px" color={'#fff'}>
                      Add new
                    </Text>
                  </Spacer>
                </FlexRow>
              </TouchableNativeFeedback>
            </SheetDetailsAddIcon>
          </BottomIconsContainer>
        </>
      )}
    </SafeArea>
  );
};
