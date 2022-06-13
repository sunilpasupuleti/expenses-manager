import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useEffect, useState} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import {useTheme} from 'styled-components/native';
import {FlexRow, MainWrapper} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import moment from 'moment';
import _ from 'lodash';
import {SheetDetailsInfo} from '../sheet-details/sheet-details-info.component';
import {
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../sheet-details/sheet-details.styles';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {GetCurrencySymbol} from '../../../../components/symbol.currency';

export const SheetStatsDetailsScreen = ({navigation, route}) => {
  const [sheet, setSheet] = useState(null);
  const [sheetDetails, setSheetDetails] = useState(null);
  const [category, setCategory] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [groupedSheetDetails, setGroupedSheetDetails] = useState(null);
  const theme = useTheme();
  useEffect(() => {
    let {sheet: ps, sheetDetails: psd, category: pc} = route.params;
    if (ps && psd && pc) {
      setSheet(ps);
      setSheetDetails(psd);
      setCategory(pc);
      onGroupSheetDetails(psd);
    }
    navigation.setOptions({
      headerTitle: pc.name,
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

  const onGroupSheetDetails = sd => {
    const groupByDate = item => moment(item.date).format('YYYY-MM-DD');

    if (sd) {
      let totalAmount = 0;
      sd.map(d => {
        totalAmount += d.amount;
      });
      setTotalAmount(totalAmount);
      let grouped = _(sd).groupBy(groupByDate).value();
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

  return (
    <SafeArea>
      {sheetDetails && sheetDetails.length > 0 && (
        <>
          <SheetDetailsTotalBalance fontsize={'30px'} fontfamily="bodySemiBold">
            {/* {"\u20B9"}{" "} */}
            {GetCurrencySymbol(sheet.currency)}{' '}
            {totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </SheetDetailsTotalBalance>
          <SheetDetailsUnderline />
          <Spacer size={'xlarge'} />
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
        </>
      )}
    </SafeArea>
  );
};
