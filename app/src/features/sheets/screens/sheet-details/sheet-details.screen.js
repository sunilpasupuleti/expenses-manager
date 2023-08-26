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
import {FlexRow, Input, NotFoundContainer} from '../../../../components/styles';

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
import {fetchExchangeRates} from '../../../../store/service-slice';
import {useIsFocused} from '@react-navigation/native';
import {FadeInView} from '../../../../components/animations/fade.animation';
import Lottie from 'lottie-react-native';
import noTransactions from '../../../../../assets/lottie/no_transactions.json';

export const SheetDetailsScreen = ({navigation, route}) => {
  // for filtering purpose
  // original sheet without change

  const [refreshing, setRefreshing] = useState(false);

  const routeIsFocused = useIsFocused();

  const [groupedSheetDetails, setGroupedSheetDetails] = useState({});

  const [filterParams, setFilterParams] = useState(null);

  const theme = useTheme();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchBarFocused, setSearchBarFocused] = useState(false);

  const {
    currentSheet,
    onCheckUpcomingSheetDetails,
    onSmartScanReceipt,
    setCurrentSheet,
    calculateBalance,
    sheets,
  } = useContext(SheetsContext);
  let menuRef = useRef();
  let cameraRef = useRef();
  const dispatch = useDispatch();

  const menuOptionStyles = {
    optionWrapper: {padding: 15, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };
  useEffect(() => {
    onCheckUpcomingSheetDetails();
  }, [routeIsFocused]);

  const onGroupSheetDetails = s => {
    let sheetDetails = s.details;
    const groupByDate = item => moment(item.date).format('YYYY-MM-DD');
    if (sheetDetails) {
      let grouped = _(sheetDetails).groupBy(groupByDate).value();
      let keys = [];
      for (let key in grouped) {
        keys.push(key);
      }
      keys.sort();
      let groupedDetails = {};
      keys.reverse().forEach(key => {
        groupedDetails[key] = grouped[key];
      });
      setGroupedSheetDetails(groupedDetails);
    }
  };

  useEffect(() => {
    if (routeIsFocused && currentSheet) {
      if (route.params && route.params.filter) {
        setFilterParams(route.params.filter);
        onGroupSheetDetails(currentSheet);
      } else {
        onGroupSheetDetails(currentSheet);
      }

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
                  dispatch(
                    fetchExchangeRates({
                      showAlert: false,
                      BASE_CURRENCY: currentSheet.currency,
                      dispatch: dispatch,
                    }),
                  );
                  menuRef.current.close();
                  navigation.navigate('CurrencyRates', {
                    display: true,
                    selectedCurrency: currentSheet.currency,
                  });
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
    }
  }, [currentSheet, routeIsFocused]);

  useEffect(() => {
    if (searchBarFocused) {
      let fsheet;

      if (filterParams && filterParams.status) {
        fsheet = filterParams.filteredSheet;
      } else {
        fsheet = sheets.find(s => s.id === currentSheet.id);
      }
      fsheet = _.cloneDeep(fsheet);

      if (searchKeyword !== '' && fsheet.details) {
        let filteredDetails = fsheet.details.filter(sd => {
          let notesMatched = sd.notes
            ? sd.notes
                .toLowerCase()
                .includes(searchKeyword.trim().toLowerCase())
            : false;
          return (
            sd.category.name
              .toLowerCase()
              .includes(searchKeyword.trim().toLowerCase()) ||
            sd.amount.toString().includes(searchKeyword.trim().toLowerCase()) ||
            sd.type
              .toLowerCase()
              .includes(searchKeyword.trim().toLowerCase()) ||
            notesMatched
          );
        });
        fsheet.details = filteredDetails;
        let {totalIncome, totalExpense, totalBalance} =
          calculateBalance(fsheet);
        fsheet.totalIncome = totalIncome;
        fsheet.totalExpense = totalExpense;
        fsheet.totalBalance = totalBalance;
      }
      setCurrentSheet(fsheet);
    }
  }, [searchKeyword, searchBarFocused, filterParams]);

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
    onCheckUpcomingSheetDetails(() => {
      setRefreshing(false);
    });
  };

  return (
    <SafeArea
      style={{
        backgroundColor: theme.colors.bg.primary,
      }}>
      {currentSheet && (
        <>
          <FlexRow justifyContent="center">
            <SheetDetailsTotalBalance
              fontsize={'30px'}
              fontfamily="bodySemiBold">
              {GetCurrencySymbol(currentSheet.currency)}{' '}
              {GetCurrencyLocalString(currentSheet.totalBalance)}
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

          <SheetDetailsUnderline
            amount={currentSheet.totalBalance.toString().length}
          />

          <Input
            value={searchKeyword}
            onFocus={() => setSearchBarFocused(true)}
            style={{elevation: 2, margin: 10, marginBottom: 0}}
            placeholder="Search by Category/Name/Amt"
            onChangeText={k => setSearchKeyword(k)}
            clearButtonMode="while-editing"
          />
          {currentSheet.upcoming && currentSheet.upcoming.length > 0 && (
            <Spacer size={'large'}>
              <Pressable
                onPress={() => {
                  navigation.navigate('UpcomingSheetDetails');
                }}>
                <FlexRow
                  justifyContent="space-between"
                  style={{paddingLeft: 16, paddingRight: 16}}>
                  <Text fontsize="20px" color={theme.colors.brand.primary}>
                    Upcoming ({currentSheet.upcoming.length})
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
          {currentSheet.details && currentSheet.details.length > 0 && (
            <FlatList
              refreshControl={
                <RefreshControl
                  title="Checking upcoming transactions"
                  onRefresh={onRefresh}
                  refreshing={refreshing}
                />
              }
              data={Object.keys(groupedSheetDetails)}
              showsVerticalScrollIndicator={false}
              renderItem={({item, index}) => {
                let sheetDetails = groupedSheetDetails[item];
                var totalExpenseAmount = 0;
                var totalIncomeAmount = 0;
                sheetDetails = sheetDetails.filter(d => d.type);
                sheetDetails.filter(d => {
                  if (d.type === 'expense') {
                    totalExpenseAmount += d.amount;
                  } else if (d.type === 'income') {
                    totalIncomeAmount += d.amount;
                  }
                });
                let totalBalance = totalIncomeAmount - totalExpenseAmount;

                let sortedSheetDetails = _(sheetDetails)
                  .sortBy(item => item.createdAt)
                  .reverse()
                  .value();

                return (
                  <FadeInView>
                    <SheetDetailsInfo
                      totalBalance={totalBalance}
                      date={item}
                      sheetDetails={sortedSheetDetails}
                      navigation={navigation}
                      sheet={currentSheet}
                    />
                  </FadeInView>
                );
              }}
              keyExtractor={item => item}
              contentContainerStyle={{paddingBottom: 150}}
            />
          )}

          {currentSheet.details && currentSheet.details.length === 0 && (
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
