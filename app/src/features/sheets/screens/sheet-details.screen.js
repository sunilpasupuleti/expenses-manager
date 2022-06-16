import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import React, {useContext, useEffect, useState, useRef} from 'react';
import {
  FlatList,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from 'styled-components/native';
import {FlexRow, MainWrapper} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {
  SheetDetailsAddIcon,
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../components/sheet-details/sheet-details.styles';
import moment from 'moment';
import _ from 'lodash';
import {SheetDetailsInfo} from '../components/sheet-details/sheet-details-info.component';
import {Spacer} from '../../../components/spacer/spacer.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {Searchbar} from 'react-native-paper';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import {GetCurrencySymbol} from '../../../components/symbol.currency';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../../store/loader-slice';
import {fetchExchangeRates} from '../../../store/service-slice';

export const SheetDetailsScreen = ({navigation, route}) => {
  const [sheet, setSheet] = useState(route.params.sheet);
  const [filteredSheet, setFilteredSheet] = useState(route.params.sheet);
  const [groupedSheetDetails, setGroupedSheetDetails] = useState({});
  const theme = useTheme();
  const [searchKeyword, setSearchKeyword] = useState('');

  const {getSheetById, sheets} = useContext(SheetsContext);
  let menuRef = useRef();
  const dispatch = useDispatch();

  const menuOptionStyles = {
    optionWrapper: {padding: 15, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };

  useEffect(() => {
    if (route.params.sheet) {
      setSheet(route.params.sheet);
      setFilteredSheet(route.params.sheet);
      onGroupSheetDetails(getSheetById(route.params.sheet.id));
    }
  }, [route.params]);

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
    navigation.setOptions({
      headerTitle: '',
      headerStyle: {
        backgroundColor: theme.colors.bg.primary,
      },
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
          style={{marginRight: 10}}
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
                menuRef.current.close();
                navigation.navigate('SheetStats', {sheet});
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Stats
                </Text>
                <Ionicons name="pie-chart-outline" size={22} />
              </FlexRow>
            </MenuOption>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                navigation.navigate('SheetTrends', {sheet});
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Trends
                </Text>
                <Ionicons name="trending-up-outline" size={22} />
              </FlexRow>
            </MenuOption>

            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                dispatch(
                  fetchExchangeRates({
                    showAlert: false,
                    BASE_CURRENCY: sheet.currency,
                    dispatch: dispatch,
                  }),
                );
                menuRef.current.close();
                navigation.navigate('CurrencyRates', {
                  display: true,
                  selectedCurrency: sheet.currency,
                });
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Curreny Rate
                </Text>
                <FontAwesome name="money" size={20} />
              </FlexRow>
            </MenuOption>

            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                navigation.navigate('AddSheet', {
                  sheet,
                  edit: true,
                  callback: sheet =>
                    navigation.navigate('SheetDetails', {sheet}),
                });
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Edit Sheet
                </Text>
                <Ionicons name="pencil-outline" size={22} />
              </FlexRow>
            </MenuOption>
          </MenuOptions>
          <Spacer size={'medium'} />
        </Menu>
      ),
    });
  }, [navigation, sheet]);

  useEffect(() => {
    let fsheet = {...filteredSheet};
    if (searchKeyword !== '' && fsheet.details) {
      let filteredDetails = fsheet.details.filter(sd => {
        return (
          sd.category.name
            .toLowerCase()
            .includes(searchKeyword.trim().toLowerCase()) ||
          sd.amount.toString().includes(searchKeyword.trim().toLowerCase()) ||
          sd.type.toLowerCase().includes(searchKeyword.trim().toLowerCase())
        );
      });
      fsheet.details = filteredDetails;
    }
    setSheet(fsheet);
    onGroupSheetDetails(fsheet);
  }, [searchKeyword]);

  return (
    <SafeArea
      style={{
        backgroundColor: theme.colors.bg.primary,
      }}>
      <Text fontsize={'30px'} fontfamily="headingBold" style={{padding: 10}}>
        {sheet.name}
      </Text>
      <Searchbar
        value={searchKeyword}
        theme={{roundness: 10}}
        style={{elevation: 2, margin: 10, marginBottom: 0}}
        placeholder="Search"
        onChangeText={k => setSearchKeyword(k)}
        clearIcon={() =>
          searchKeyword !== '' && (
            <Ionicons
              onPress={() => setSearchKeyword('')}
              name="close-circle-outline"
              size={25}
              color={theme.colors.brand.primary}
            />
          )
        }
      />

      <SheetDetailsTotalBalance fontsize={'30px'} fontfamily="bodySemiBold">
        {GetCurrencySymbol(sheet.currency)}{' '}
        {sheet.totalBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </SheetDetailsTotalBalance>

      <SheetDetailsUnderline />

      <Spacer size={'xlarge'} />
      {sheet.details && sheet.details.length > 0 && (
        <FlatList
          data={Object.keys(groupedSheetDetails)}
          showsVerticalScrollIndicator={false}
          renderItem={({item, index}) => {
            let sheetDetails = groupedSheetDetails[item];
            var totalExpenseAmount = 0;
            var totalIncomeAmount = 0;
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
              <SheetDetailsInfo
                totalBalance={totalBalance}
                date={item}
                sheetDetails={sortedSheetDetails}
                navigation={navigation}
                sheet={sheet}
              />
            );
          }}
          keyExtractor={item => item}
          contentContainerStyle={{paddingBottom: 50}}
        />
      )}

      {sheet.details && sheet.details.length === 0 && (
        <View>
          <Text style={{textAlign: 'center', fontStyle: 'italic'}}>
            Tap the plus button to create a new expense.
          </Text>
        </View>
      )}

      <SheetDetailsAddIcon>
        <TouchableNativeFeedback
          onPress={() => {
            navigation.navigate('AddSheetDetail', {
              sheet: sheet,
            });
          }}>
          <AntDesign name="plus" size={40} color={'#fff'} />
        </TouchableNativeFeedback>
      </SheetDetailsAddIcon>
    </SafeArea>
  );
};
