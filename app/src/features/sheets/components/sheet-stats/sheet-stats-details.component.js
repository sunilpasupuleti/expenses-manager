/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {FlatList, SectionList, TouchableOpacity, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {FlexRow, Input, MainWrapper} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';

import moment from 'moment';
import _ from 'lodash';
import {
  SheetDetailHeader,
  SheetDetailHeaderLabel,
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../sheet-details/sheet-details.styles';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';

import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {searchKeywordRegex} from '../../../../components/utility/helper';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
import {useIsFocused} from '@react-navigation/native';
import {SheetDetailsInfo} from '../sheet-details/sheet-details-info.component';

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
  const [amountWidth, setAmountWidth] = useState(0);

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
    onGetSheetDetails(
      currentSheet,
      _.toLower(searchKeyword),
      analyticsScreenReportKey,
    );
  };

  return (
    <SafeArea child={true}>
      <>
        <View style={{alignItems: 'center'}}>
          <View
            onLayout={e => setAmountWidth(e.nativeEvent.layout.width)}
            style={{flexDirection: 'row'}}>
            <SheetDetailsTotalBalance
              fontsize={'30px'}
              fontfamily="bodySemiBold">
              {GetCurrencySymbol(currentSheet.currency)}{' '}
              {GetCurrencyLocalString(sheetDetails.totalBalance)}
            </SheetDetailsTotalBalance>
          </View>
          <SheetDetailsUnderline width={amountWidth} />
        </View>

        <Spacer size={'medium'} />
        <Input
          value={searchKeyword}
          style={{elevation: 2, margin: 10, marginBottom: 0}}
          placeholder="Search by Category / Notes / Amount"
          onChangeText={k => setSearchKeyword(k)}
          clearButtonMode="while-editing"
        />

        <Spacer size={'large'} />
        {sheetDetails.totalCount > 0 ? (
          <SectionList
            sections={sheetDetails.transactions.map(
              ({date, transactions, totalIncome, totalExpense}) => ({
                title: date,
                data: transactions,
                totalBalance: totalIncome - totalExpense,
              }),
            )}
            keyExtractor={(item, index) =>
              item?.id ? item.id.toString() : `index-${index}`
            }
            renderSectionHeader={({section}) => (
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
                  {GetCurrencySymbol(currentSheet.currency)}{' '}
                  {GetCurrencyLocalString(section.totalBalance)}
                </SheetDetailHeaderLabel>
              </SheetDetailHeader>
            )}
            renderItem={({item, index}) => (
              <SheetDetailsInfo
                transaction={item}
                sheet={currentSheet}
                navigation={navigation}
                onGetSheetDetails={onGetSheetDetails}
                index={index}
              />
            )}
            contentContainerStyle={{paddingBottom: 50}}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text>No Transactions found.</Text>
          </View>
        )}
      </>
    </SafeArea>
  );
};
