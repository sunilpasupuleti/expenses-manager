import React, {useEffect, useState} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import {StatsInfoCard} from './sheet-stats-info-card.components';

export const StatsInfo = ({details, activeType, navigation, sheet}) => {
  const [finalTotal, setFinalTotal] = useState(0);
  const [getSheet, setGetSheet] = useState(sheet);
  useEffect(() => {
    if (sheet) {
      setGetSheet(sheet);
    }
  }, [sheet]);
  useEffect(() => {
    if (details) {
      let total = 0;
      Object.keys(details).map(key => {
        let sds = details[key];
        sds.map(d => (total += d.amount));
      });
      setFinalTotal(total);
    }
  }, [details]);
  return (
    <>
      <StatsInfoCard
        category={{name: 'Total', color: 'transparent', total: true}}
        percentage={1}
        activeType={activeType}
        currency={getSheet && getSheet.currency}
        totalBalance={finalTotal}
      />

      <FlatList
        data={details ? Object.keys(details) : {}}
        keyExtractor={item => item}
        renderItem={({item, index}) => {
          let sds = details[item];
          let category = sds[0].category;
          let categoryTotal = 0;
          let totalAmount = 0;
          Object.keys(details).map(key => {
            details[key].forEach(element => {
              totalAmount += element.amount;
            });
          });

          sds.forEach(e => (categoryTotal += e.amount));
          let percentage = categoryTotal / totalAmount;
          let totalBalance = 0;
          details[item].map(d => {
            totalBalance += d.amount;
          });
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('SheetStatsDetails', {
                  category,
                  sheetDetails: sds,
                  sheet: sheet,
                })
              }>
              <StatsInfoCard
                category={category}
                percentage={percentage}
                activeType={activeType}
                totalBalance={totalBalance}
                currency={getSheet && getSheet.currency}
              />
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
};
