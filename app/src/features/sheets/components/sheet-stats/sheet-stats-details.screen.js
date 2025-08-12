/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, SectionList, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { FlexRow, Input } from '../../../../components/styles';
import { Text } from '../../../../components/typography/text.component';
import { SafeArea } from '../../../../components/utility/safe-area.component';

import moment from 'moment';
import _ from 'lodash';
import {
  DeleteBar,
  SheetDetailHeader,
  SheetDetailHeaderLabel,
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../sheet-details/sheet-details.styles';
import { Spacer } from '../../../../components/spacer/spacer.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';

import { SheetDetailsInfo } from '../sheet-details/sheet-details-info.component';
import { ObservedSheetStatsDetails } from './sheet-stats-details.observed';
import { useIsFocused } from '@react-navigation/native';
import { SheetDetailsContext } from '../../../../services/sheetDetails/sheetDetails.context';
export const SheetStatsDetailsScreen = ({ navigation, route }) => {
  const [sheet, setSheet] = useState(null);
  const [category, setCategory] = useState('');
  const [reportKey, setReportKey] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const onSetNavigationOptions = cat => {
    navigation.setOptions({
      headerTitle: cat.name,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FlexRow>
            <Ionicons
              name="chevron-back-outline"
              size={25}
              color={theme.colors.brand.primary}
            ></Ionicons>
            <Text color={theme.colors.brand.primary}>Back</Text>
          </FlexRow>
        </TouchableOpacity>
      ),
    });
  };

  useEffect(() => {
    if (!routeIsFocused) {
      setSearchKeyword('');
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (route.params?.sheet && route?.params?.category) {
      const { sheet: sh, category: cat, reportKey: repKey } = route.params;

      setSheet(sh);
      setCategory(cat);
      setReportKey(repKey);
      onSetNavigationOptions(cat);
    }
  }, [route.params]);

  useEffect(() => {
    if (route?.params?.reportKey) {
      setReportKey(route?.params?.reportKey);
    }
  }, [route.params]);

  if (!sheet || !category) return null;

  return (
    <ObservedSheetStatsDetails
      navigation={navigation}
      route={route}
      accountId={sheet.id}
      sheet={sheet}
      category={category}
      searchKeyword={searchKeyword}
      setSearchKeyword={setSearchKeyword}
      reportKey={reportKey}
    />
  );
};

export const BaseSheetStatsDetailsScreen = ({
  navigation,
  sheet,
  setSearchKeyword,
  searchKeyword,
  transactions = [],
}) => {
  const [amountWidth, setAmountWidth] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const { onDeleteSheetDetail } = useContext(SheetDetailsContext);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);

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

  const onDeleteTransactions = () => {
    Alert.alert(
      'Confirm Delete',
      `Delete ${selectedTransactions.length} transactions?`,
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: () => {
            selectedTransactions.forEach(id => {
              const txn = transactions.find(t => t.id === id);
              if (txn) onDeleteSheetDetail(sheet, txn, () => {});
            });
            setSelectedTransactions([]);
            setMultiSelectMode(false);
          },
          style: 'destructive',
        },
      ],
    );
  };

  return (
    <SafeArea child={true}>
      {multiSelectMode && (
        <DeleteBar style={{ bottom: 50 }}>
          <TouchableOpacity onPress={onDeleteTransactions}>
            <Text color="red">Delete ({selectedTransactions.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // Select All if not all selected, else clear all
              if (selectedTransactions.length < transactions.length) {
                setSelectedTransactions(transactions.map(t => t.id));
              } else {
                setSelectedTransactions([]);
              }
            }}
          >
            <Text>
              {selectedTransactions.length < transactions.length
                ? 'Select All'
                : 'Deselect All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedTransactions([]);
              setMultiSelectMode(false);
            }}
          >
            <Text>Cancel</Text>
          </TouchableOpacity>
        </DeleteBar>
      )}

      <>
        <View style={{ alignItems: 'center' }}>
          <View
            onLayout={e => setAmountWidth(e.nativeEvent.layout.width)}
            style={{ flexDirection: 'row' }}
          >
            <SheetDetailsTotalBalance
              fontsize={'30px'}
              fontfamily="bodySemiBold"
            >
              {GetCurrencySymbol(sheet.currency)}{' '}
              {GetCurrencyLocalString(totalBalance)}
            </SheetDetailsTotalBalance>
          </View>
          <SheetDetailsUnderline width={amountWidth} />
        </View>

        <Spacer size={'medium'} />
        <Input
          value={searchKeyword}
          style={{ elevation: 2, margin: 10, marginBottom: 0 }}
          placeholder="Search by Category / Notes / Amount"
          onChangeText={k => setSearchKeyword(k)}
          clearButtonMode="while-editing"
        />

        <Spacer size={'large'} />
        {transactions.length > 0 ? (
          <SectionList
            sections={groupedTransactions.map(
              ({ transactions: txns, title, totalBalance: totalBal }) => ({
                title: title,
                data: txns,
                totalBalance: totalBal,
              }),
            )}
            keyExtractor={(item, index) =>
              item?.id ? item.id.toString() : `index-${index}`
            }
            renderSectionHeader={({ section }) => (
              <SheetDetailHeader>
                <SheetDetailHeaderLabel>
                  {moment(section.title).calendar(null, {
                    lastDay: '[Yesterday]',
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    lastWeek: 'DD MMM YYYY - dddd',
                    nextWeek: 'DD MMM YYYY - dddd',
                    sameElse: 'DD MMM YYYY - dddd',
                  })}
                </SheetDetailHeaderLabel>
                <SheetDetailHeaderLabel>
                  {GetCurrencySymbol(sheet.currency)}{' '}
                  {GetCurrencyLocalString(section.totalBalance)}
                </SheetDetailHeaderLabel>
              </SheetDetailHeader>
            )}
            renderItem={({ item, index }) => (
              <SheetDetailsInfo
                selectedTransactions={selectedTransactions}
                setSelectedTransactions={setSelectedTransactions}
                multiSelectMode={multiSelectMode}
                setMultiSelectMode={setMultiSelectMode}
                transaction={item}
                sheet={sheet}
                navigation={navigation}
                index={index}
              />
            )}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text>No Transactions found.</Text>
          </View>
        )}
      </>
    </SafeArea>
  );
};
