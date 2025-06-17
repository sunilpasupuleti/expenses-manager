/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-shadow */
import React, {useContext, useEffect, useState, useRef, useMemo} from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SectionList,
  TouchableNativeFeedback,
  TouchableOpacity,
  useColorScheme,
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
import {useDispatch, useSelector} from 'react-redux';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {FlexRow, Input, NotFoundContainer} from '../../../../components/styles';

import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {
  BottomIconsContainer,
  CameraButton,
  CameraIcon,
  FilterIconContainer,
  SheetDetailHeader,
  SheetDetailHeaderLabel,
  SheetDetailsAddIcon,
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../../components/sheet-details/sheet-details.styles';

import {Spacer} from '../../../../components/spacer/spacer.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import Lottie from 'lottie-react-native';
import noTransactions from '../../../../../assets/lottie/no_transactions.json';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
import {Divider} from 'react-native-paper';
import {SheetDetailsInfo} from '../../components/sheet-details/sheet-details-info.component';

export const SheetDetailsScreen = ({
  navigation,
  route,
  sheet,
  filterParams,
  searchKeyword,
  setSearchKeyword,
  transactions = [],
  upcomingTransactions = [],
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const [totalBalance, setTotalBalance] = useState(0);

  const theme = useTheme();
  const [amountWidth, setAmountWidth] = useState(0);
  const {onSmartScanReceipt} = useContext(SheetDetailsContext);
  const {onCheckUpcomingSheetDetails} = useContext(SheetDetailsContext);
  let cameraRef = useRef();
  const menuOptionStyles = {
    optionWrapper: {padding: 15, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };

  const appTheme = useSelector(state => state.service.theme);
  const themeType = useColorScheme();

  let darkMode =
    appTheme === 'automatic'
      ? themeType === 'light'
        ? false
        : true
      : appTheme === 'light'
      ? false
      : true;

  const groupedTransactions = useMemo(() => {
    let finalIncome = 0;
    let finalExpense = 0;
    let finalBalance = 0;
    const grouped = _.groupBy(transactions, t => {
      return moment(t.date).format('YYYY-MM-DD');
    });

    const finalEntries = Object.entries(grouped).map(([date, txns]) => {
      const totalIncome = _.sumBy(txns, t =>
        t.type === 'income' ? t.amount : 0,
      );
      const totalExpense = _.sumBy(txns, t =>
        t.type === 'expense' ? t.amount : 0,
      );
      finalIncome += totalIncome;
      finalExpense += totalExpense;
      return {
        title: date,
        transactions: txns,
        totalBalance: totalIncome - totalExpense,
      };
    });

    finalBalance = finalIncome - finalExpense;
    setTotalBalance(finalBalance);

    return finalEntries;
  }, [transactions]);

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
          const paramsData = {
            smartScan: true,
            sheetDetail: fetchedData,
            sheet: sheet,
          };
          if (!fetchedData.newCategoryIdentified) {
            paramsData.selectedCategory = fetchedData.category;
          }

          navigation.navigate('AddSheetDetail', paramsData);
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

    onCheckUpcomingSheetDetails(sheet, transactionExists => {
      setRefreshing(false);
      if (transactionExists) {
      }
    });
  };

  return (
    <SafeArea child={true}>
      <>
        <FlexRow justifyContent="center">
          <View
            onLayout={e => setAmountWidth(e.nativeEvent.layout.width)}
            style={{
              alignItems: 'center',
            }}>
            <SheetDetailsTotalBalance
              fontsize={'30px'}
              fontfamily="bodySemiBold">
              {GetCurrencySymbol(sheet.currency)}{' '}
              {GetCurrencyLocalString(totalBalance)}
            </SheetDetailsTotalBalance>
          </View>

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

        <SheetDetailsUnderline width={amountWidth} />

        <Input
          value={searchKeyword}
          style={{elevation: 2, margin: 10, marginBottom: 0}}
          placeholder="Search by Category / Notes / Amount"
          onChangeText={k => setSearchKeyword(k)}
          clearButtonMode="while-editing"
        />
        {upcomingTransactions.length > 0 && (
          <Spacer size={'large'}>
            <Pressable
              onPress={() => {
                navigation.navigate('UpcomingSheetDetails', {
                  sheet: sheet,
                });
              }}>
              <FlexRow
                justifyContent="space-between"
                style={{paddingLeft: 16, paddingRight: 16}}>
                <Text fontsize="20px" color={theme.colors.brand.primary}>
                  Upcoming ({upcomingTransactions.length})
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

        <Spacer size={'large'} />

        <SectionList
          refreshControl={
            <RefreshControl
              title="Checking upcoming transactions"
              onRefresh={onRefresh}
              tintColor={darkMode ? '#fff' : '#000'} // spinner color
              titleColor={darkMode ? '#fff' : '#000'} // title text color
              colors={[darkMode ? '#fff' : '#000']} // Android spinner color
              refreshing={refreshing}
            />
          }
          sections={groupedTransactions.map(
            ({title, transactions, totalBalance}) => ({
              title: title,
              data: transactions,
              totalBalance: totalBalance,
            }),
          )}
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString() : `index-${index}`
          }
          renderSectionHeader={({section}) => {
            return (
              <SheetDetailHeader>
                <SheetDetailHeaderLabel>
                  {moment(section.title).calendar(null, {
                    lastDay: '[Yesterday]',
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    lastWeek: 'DD MMM YYYY',
                    nextWeek: 'DD MMM YYYY',
                    sameElse: 'DD MMM YYYY',
                  })}
                </SheetDetailHeaderLabel>
                <SheetDetailHeaderLabel>
                  {GetCurrencySymbol(sheet.currency)}{' '}
                  {GetCurrencyLocalString(section.totalBalance)}
                </SheetDetailHeaderLabel>
              </SheetDetailHeader>
            );
          }}
          maxToRenderPerBatch={20}
          ItemSeparatorComponent={Divider}
          renderItem={({item, index, section}) => (
            <SheetDetailsInfo
              transaction={item}
              sheet={sheet}
              navigation={navigation}
              index={index}
            />
          )}
          contentContainerStyle={{paddingBottom: 150}}
          stickySectionHeadersEnabled
        />

        {transactions.length === 0 && (
          <NotFoundContainer>
            <Lottie
              style={{
                width: '100%',
                height: 300,
                marginBottom: 350,
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
          {!sheet.isLoanAccount ? (
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
          ) : (
            <View></View>
          )}
          <SheetDetailsAddIcon>
            <TouchableNativeFeedback
              onPress={() => {
                navigation.navigate('AddSheetDetail', {
                  sheet: sheet,
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
    </SafeArea>
  );
};
