/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { SafeArea } from '../../../../components/utility/safe-area.component';
import { useTheme } from 'styled-components/native';
import moment from 'moment';
import _ from 'lodash';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Spacer } from '../../../../components/spacer/spacer.component';
import {
  Alert,
  Pressable,
  SectionList,
  TouchableOpacity,
  View,
} from 'react-native';

import { SheetDetailsContext } from '../../../../services/sheetDetails/sheetDetails.context';
import { useIsFocused } from '@react-navigation/native';
import { Text } from '../../../../components/typography/text.component';
import { FlexRow, Input } from '../../../../components/styles';
import {
  DeleteBar,
  SheetDetailHeader,
  SheetDetailHeaderLabel,
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../../components/sheet-details/sheet-details.styles';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import { SheetDetailsInfo } from '../../components/sheet-details/sheet-details-info.component';
import { ObservedUpcomingSheetDetails } from './upcoming-sheet-details.observerd';

export const UpcomingSheetDetails = ({ navigation, route }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sheet, setSheet] = useState(null);
  const theme = useTheme();
  const routeIsFocused = useIsFocused();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Upcoming Transactions',
      headerLeft: () => null,
      headerRight: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginRight: 10 }}
        >
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
    if (!routeIsFocused) {
      setSearchKeyword('');
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (route.params?.sheet) {
      setSheet(route.params.sheet);
    }
  }, [route.params]);

  if (!sheet) return;

  return (
    <ObservedUpcomingSheetDetails
      navigation={navigation}
      route={route}
      sheet={sheet}
      accountId={sheet.id}
      searchKeyword={searchKeyword}
      setSearchKeyword={setSearchKeyword}
    />
  );
};

export const BaseUpcomingSheetDetails = ({
  navigation,
  route,
  upcomingTransactions = [],
  searchKeyword,
  setSearchKeyword,
  sheet,
}) => {
  const { onCheckUpcomingSheetDetails, onDeleteSheetDetail } =
    useContext(SheetDetailsContext);
  const routeIsFocused = useIsFocused();
  const [amountWidth, setAmountWidth] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);

  const theme = useTheme();

  useEffect(() => {
    if (routeIsFocused) {
      checkUpcomingDetails();
    }
  }, [routeIsFocused]);

  const checkUpcomingDetails = () => {
    onCheckUpcomingSheetDetails(sheet, () => {});
  };

  const groupedTransactions = useMemo(() => {
    let finalIncome = 0;
    let finalExpense = 0;
    let finalBalance = 0;

    const grouped = _.groupBy(upcomingTransactions, t => {
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
  }, [upcomingTransactions]);

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
              const txn = upcomingTransactions.find(t => t.id === id);
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
              if (selectedTransactions.length < upcomingTransactions.length) {
                setSelectedTransactions(upcomingTransactions.map(t => t.id));
              } else {
                setSelectedTransactions([]);
              }
            }}
          >
            <Text>
              {selectedTransactions.length < upcomingTransactions.length
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

      <FlexRow justifyContent="center">
        <View
          onLayout={e => setAmountWidth(e.nativeEvent.layout.width)}
          style={{
            alignItems: 'center',
          }}
        >
          <SheetDetailsTotalBalance fontsize={'30px'} fontfamily="bodySemiBold">
            {GetCurrencySymbol(sheet.currency)}{' '}
            {GetCurrencyLocalString(totalBalance)}
          </SheetDetailsTotalBalance>
        </View>
      </FlexRow>

      <SheetDetailsUnderline width={amountWidth} />

      <Spacer size={'large'} />
      <Input
        value={searchKeyword}
        style={{ elevation: 2, margin: 10, marginBottom: 0 }}
        placeholder="Search by Category / Notes / Amount"
        onChangeText={k => setSearchKeyword(k)}
        clearButtonMode="while-editing"
      />
      {upcomingTransactions.length > 0 && (
        <>
          <Spacer size={'xlarge'} />

          <SectionList
            sections={groupedTransactions.map(
              ({ transactions, title, totalBalance }) => ({
                title: title,
                data: transactions,
                totalBalance: totalBalance,
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
            renderItem={({ item, index, section }) => (
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
        </>
      )}

      {upcomingTransactions.length === 0 && (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text>No upcoming transactions found.</Text>
        </View>
      )}
    </SafeArea>
  );
};
