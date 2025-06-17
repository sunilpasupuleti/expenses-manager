import React from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import _ from 'lodash';
import {StatsInfoCard} from './sheet-stats-info-card.components';

export const StatsInfo = ({
  sheetDetails,
  activeType,
  navigation,
  finalAmount,
  reportKey,
  sheet,
}) => {
  return (
    <>
      <StatsInfoCard
        category={{name: 'Total', color: 'transparent', total: true}}
        percentage={100}
        activeType={activeType}
        currency={sheet.currency}
        totalBalance={finalAmount}
      />

      <FlatList
        scrollEnabled={false}
        data={sheetDetails}
        keyExtractor={(item, i) =>
          item?.category?.id?.toString() || i.toString()
        }
        renderItem={({item, index}) => {
          let {category, totalPercentage, totalAmount} = item;
          return (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('SheetStatsDetails', {
                  category,
                  reportKey: reportKey,
                  analyticsScreen: true,
                  sheet: sheet,
                });
              }}>
              <StatsInfoCard
                category={category}
                percentage={totalPercentage}
                activeType={activeType}
                totalBalance={totalAmount}
                currency={sheet.currency}
              />
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
};
