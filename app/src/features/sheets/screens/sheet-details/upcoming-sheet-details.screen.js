/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {useTheme} from 'styled-components/native';
import moment from 'moment';
import _ from 'lodash';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlatList, Pressable} from 'react-native';
import {SheetDetailsInfo} from '../../components/sheet-details/sheet-details-info.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';

export const UpcomingSheetDetails = ({navigation, route}) => {
  const {currentSheet} = useContext(SheetsContext);
  const [groupedSheetDetails, setGroupedSheetDetails] = useState(null);
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
    if (currentSheet) {
      onGroupSheetDetails(currentSheet.upcoming);
    }
  }, [currentSheet]);

  const onGroupSheetDetails = sd => {
    const groupByDate = item => moment(item.date).format('YYYY-MM-DD');
    if (sd) {
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
      {groupedSheetDetails &&
        Object.keys(groupedSheetDetails).map.length > 0 && (
          <>
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
                    sheet={currentSheet}
                    editFromUpcomingScreen={true}
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
