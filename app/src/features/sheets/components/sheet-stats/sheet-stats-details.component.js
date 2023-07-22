import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import {useTheme} from 'styled-components/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {FlexRow, MainWrapper} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

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
import {SheetsContext} from '../../../../services/sheets/sheets.context';

import {SheetDetailsInfo} from '../sheet-details/sheet-details-info.component';
import {SheetExport} from '../sheet-export/sheet-export.component';
import {AuthenticationContext} from '../../../../services/authentication/authentication.context';

export const SheetStatsDetailsScreen = ({navigation, route}) => {
  const [sheet, setSheet] = useState(null);
  const [sheetDetails, setSheetDetails] = useState(null);
  const [category, setCategory] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [groupedSheetDetails, setGroupedSheetDetails] = useState(null);
  const {onExportDataToExcel} = useContext(SheetsContext);
  const theme = useTheme();
  const {userAdditionalDetails} = useContext(AuthenticationContext);

  useEffect(() => {
    let {sheet: ps, sheetDetails: psd, category: pc} = route.params;
    if (ps && psd && pc) {
      setSheet(ps);
      setSheetDetails(psd);
      setCategory(pc);
      onGroupSheetDetails(psd);
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
    }
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

  const onClickExportData = (sh, sds, cat) => {
    let structuredDetails = [{}];
    let totalIncome = 0;
    let totalExpense = 0;
    sds.forEach((d, i) => {
      let date = moment(d.date).format('MMM DD, YYYY ');
      if (d.showTime) {
        let time = moment(d.time).format('hh:mm A');
        date += time;
      }
      if (d.type === 'expense') {
        totalExpense += d.amount;
      } else {
        totalIncome += d.amount;
      }
      let amount = `AMOUNT ( ${GetCurrencySymbol(sh.currency)} )`;
      let detail = {
        'S.NO': i + 1,
        TITLE: d.notes,
        DATE: date,
        [amount]: d.type === 'expense' ? -d.amount : d.amount,
      };

      structuredDetails.push(detail);
    });
    let extraCells = [
      ['', '', '', '', ''],
      [
        '',
        '',
        'TOTAL INCOME ',
        GetCurrencySymbol(sh.currency) +
          ' ' +
          GetCurrencyLocalString(totalIncome),
      ],
      [
        '',
        '',
        'TOTAL EXPENSES ',
        GetCurrencySymbol(sh.currency) +
          ' ' +
          GetCurrencyLocalString(totalExpense),
      ],
      [
        '',
        '',
        'BALANCE',
        GetCurrencySymbol(sh.currency) +
          ' ' +
          GetCurrencyLocalString(totalIncome - totalExpense),
      ],
    ];

    let config = {
      title: cat.name.toUpperCase(),
      type: 'category',
      extraCells,
      sheet: {...sh},
      wscols: [{wch: 5}, {wch: 40}, {wch: 40}, {wch: 30}],
    };
    onExportDataToExcel(config, structuredDetails);
  };

  return (
    <SafeArea>
      {sheetDetails && sheetDetails.length > 0 && (
        <>
          <SheetDetailsTotalBalance fontsize={'30px'} fontfamily="bodySemiBold">
            {/* {"\u20B9"}{" "} */}
            {GetCurrencySymbol(sheet.currency)}{' '}
            {GetCurrencyLocalString(totalAmount)}
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
