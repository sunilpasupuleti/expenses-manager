/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {useTheme} from 'styled-components/native';
import moment from 'moment';
import _ from 'lodash';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlatList, Pressable, View} from 'react-native';
import {SheetDetailsInfo} from '../../components/sheet-details/sheet-details-info.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
import {useIsFocused} from '@react-navigation/native';
import {Text} from '../../../../components/typography/text.component';
import {searchKeywordRegex} from '../../../../components/utility/helper';
import {Input, MainWrapper} from '../../../../components/styles';

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

          <FlatList
            data={sheetDetails.upcomingTransactions}
            showsVerticalScrollIndicator={false}
            renderItem={({item, index}) => {
              let {totalExpense, totalIncome, transactions, date} = item;
              let totalBalance = totalIncome - totalExpense;
              return (
                <SheetDetailsInfo
                  totalBalance={totalBalance}
                  date={date}
                  onGetSheetDetails={onGetSheetDetails}
                  sheetDetails={transactions}
                  navigation={navigation}
                  sheet={currentSheet}
                />
              );
            }}
            keyExtractor={item => item.date}
            contentContainerStyle={{paddingBottom: 50}}
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
