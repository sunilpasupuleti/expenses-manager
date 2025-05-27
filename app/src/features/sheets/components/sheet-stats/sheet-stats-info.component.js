import React, {useContext, useEffect, useState} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import _ from 'lodash';
import {StatsInfoCard} from './sheet-stats-info-card.components';

import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {ScrollView} from 'react-native';
export const StatsInfo = ({
  sheetDetails,
  activeType,
  navigation,
  finalAmount,
  reportKey,
}) => {
  const {currentSheet} = useContext(SheetsContext);

  return (
    <>
      <StatsInfoCard
        category={{name: 'Total', color: 'transparent', total: true}}
        percentage={100}
        activeType={activeType}
        currency={currentSheet.currency}
        totalBalance={finalAmount}
      />

      <FlatList
        scrollEnabled={false}
        data={sheetDetails}
        keyExtractor={(item, i) => i}
        renderItem={({item, index}) => {
          let {category, totalPercentage, totalAmount} = item;
          return (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('SheetStatsDetails', {
                  category,
                  reportKey: reportKey,
                  analyticsScreen: true,
                });
              }}>
              <StatsInfoCard
                category={category}
                percentage={totalPercentage}
                activeType={activeType}
                totalBalance={totalAmount}
                currency={currentSheet.currency}
              />
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
};
