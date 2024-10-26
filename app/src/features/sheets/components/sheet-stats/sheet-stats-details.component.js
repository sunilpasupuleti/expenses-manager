/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {FlatList, TouchableOpacity, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {FlexRow, Input, MainWrapper} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';

import moment from 'moment';
import _ from 'lodash';
import {
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../sheet-details/sheet-details.styles';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';

import {SheetDetailsInfo} from '../sheet-details/sheet-details-info.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {searchKeywordRegex} from '../../../../components/utility/helper';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
import {useIsFocused} from '@react-navigation/native';

export const SheetStatsDetailsScreen = ({navigation, route}) => {
  const {currentSheet} = useContext(SheetsContext);
  const [sheetDetails, setSheetDetails] = useState({
    totalCount: 0,
    totalBalance: 0,
    transactions: [],
  });
  const routeIsFocused = useIsFocused();
  const {getSheetDetails} = useContext(SheetDetailsContext);
  const [searchKeyword, setSearchKeyword] = useState(null);
  const [category, setCategory] = useState(null);
  const [analyticsScreenReportKey, setAnalyticsScreenReportKey] =
    useState(null);

  const theme = useTheme();

  useEffect(() => {
    if (route.params?.category) {
      setCategory(route.params?.category);
    }
    if (route.params?.analyticsScreen) {
      setAnalyticsScreenReportKey(route.params?.reportKey || null);
    }
  }, [route.params]);

  useEffect(() => {
    if (category && routeIsFocused && !analyticsScreenReportKey) {
      onSetNavigationOptions();
      onGetSheetDetails(currentSheet, null);
    }
    if (category && routeIsFocused && analyticsScreenReportKey) {
      onSetNavigationOptions();
      onGetSheetDetails(currentSheet, null, analyticsScreenReportKey);
    }
  }, [category, routeIsFocused, analyticsScreenReportKey]);

  useEffect(() => {
    if (searchKeyword !== null && searchKeywordRegex.test(searchKeyword)) {
      onSearch();
    } else if (searchKeyword === '') {
      onGetSheetDetails(currentSheet, null, analyticsScreenReportKey);
    }
  }, [searchKeyword]);

  const onSetNavigationOptions = () => {
    navigation.setOptions({
      headerTitle: category.name,
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
  };

  const onGetSheetDetails = async (sheet, keyword, analyticsScreenRepKey) => {
    let data = await getSheetDetails(
      sheet,
      keyword,
      null,
      false,
      category.id,
      analyticsScreenRepKey,
    );
    if (data) {
      setSheetDetails(data);
    }
  };

  const onSearch = async () => {
    onGetSheetDetails(currentSheet, _.toLower(searchKeyword));
  };

  return (
    <SafeArea child={true}>
      {sheetDetails.totalCount > 0 && (
        <>
          <SheetDetailsTotalBalance fontsize={'30px'} fontfamily="bodySemiBold">
            {/* {"\u20B9"}{" "} */}
            {GetCurrencySymbol(currentSheet.currency)}{' '}
            {GetCurrencyLocalString(sheetDetails.totalBalance)}
          </SheetDetailsTotalBalance>
          <SheetDetailsUnderline
            amount={sheetDetails.totalBalance.toString().length}
          />
          <Spacer size={'medium'} />
          <Input
            value={searchKeyword}
            style={{elevation: 2, margin: 10, marginBottom: 0}}
            placeholder="Search by Category / Notes / Amount"
            onChangeText={k => setSearchKeyword(k)}
            clearButtonMode="while-editing"
          />

          <Spacer size={'xlarge'} />
          <FlatList
            data={sheetDetails.transactions}
            showsVerticalScrollIndicator={false}
            renderItem={({item, index}) => {
              let {totalExpense, totalIncome, transactions, date} = item;
              let totalBalance = totalIncome - totalExpense;
              return (
                <SheetDetailsInfo
                  totalBalance={totalBalance}
                  date={date}
                  sheetDetails={transactions}
                  navigation={navigation}
                  sheet={currentSheet}
                  onGetSheetDetails={onGetSheetDetails}
                  analyticsScreenReportKey={analyticsScreenReportKey}
                />
              );
            }}
            keyExtractor={item => item.date}
            contentContainerStyle={{paddingBottom: 50}}
          />
        </>
      )}

      {sheetDetails.totalCount === 0 && (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>No Transactions found.</Text>
        </View>
      )}
    </SafeArea>
  );
};
