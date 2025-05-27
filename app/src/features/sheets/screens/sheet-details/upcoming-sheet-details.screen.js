/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {useTheme} from 'styled-components/native';
import moment from 'moment';
import _ from 'lodash';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlatList, Pressable, SectionList, View} from 'react-native';

import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
import {useIsFocused} from '@react-navigation/native';
import {Text} from '../../../../components/typography/text.component';
import {searchKeywordRegex} from '../../../../components/utility/helper';
import {Input, MainWrapper} from '../../../../components/styles';
import {
  SheetDetailHeader,
  SheetDetailHeaderLabel,
} from '../../components/sheet-details/sheet-details.styles';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {SheetDetailsInfo} from '../../components/sheet-details/sheet-details-info.component';

export const UpcomingSheetDetails = ({navigation, route}) => {
  const {currentSheet} = useContext(SheetsContext);
  const {getSheetDetails, onCheckUpcomingSheetDetails} =
    useContext(SheetDetailsContext);
  const routeIsFocused = useIsFocused();
  const [searchKeyword, setSearchKeyword] = useState(null);

  const [sheetDetails, setSheetDetails] = useState({
    totalUpcomingCount: 0,
    upcomingTransactions: [],
  });
  const theme = useTheme();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Upcoming Transactions',
      headerLeft: () => null,
      headerRight: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{marginRight: 10}}>
          <Ionicons
            name="close-circle-outline"
            size={30}
            color={theme.colors.brand.primary}
          />
        </Pressable>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (routeIsFocused) {
      checkUpcomingDetails();
    }
  }, [routeIsFocused]);

  const onGetSheetDetails = async (sheet, keyword) => {
    let data = await getSheetDetails(sheet, keyword, null, true);
    if (data) {
      setSheetDetails(data);
    }
  };

  const checkUpcomingDetails = () => {
    onCheckUpcomingSheetDetails(currentSheet, () => {
      onGetSheetDetails(currentSheet);
    });
  };

  useEffect(() => {
    if (searchKeyword !== null && searchKeywordRegex.test(searchKeyword)) {
      onSearch();
    } else if (searchKeyword === '') {
      onGetSheetDetails(currentSheet, null);
    }
  }, [searchKeyword]);

  const onSearch = async () => {
    onGetSheetDetails(currentSheet, _.toLower(searchKeyword));
  };

  return (
    <SafeArea child={true}>
      {sheetDetails.totalUpcomingCount > 0 && (
        <>
          <Spacer size={'large'} />

          <Input
            value={searchKeyword}
            style={{elevation: 2, margin: 10, marginBottom: 0}}
            placeholder="Search by Category / Notes / Amount"
            onChangeText={k => setSearchKeyword(k)}
            clearButtonMode="while-editing"
          />
          <Spacer size={'xlarge'} />

          <SectionList
            sections={sheetDetails.upcomingTransactions.map(
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
            renderItem={({item, index, section}) => (
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
        </>
      )}

      {sheetDetails.totalUpcomingCount === 0 && (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>No upcoming transactions found.</Text>
        </View>
      )}
    </SafeArea>
  );
};
