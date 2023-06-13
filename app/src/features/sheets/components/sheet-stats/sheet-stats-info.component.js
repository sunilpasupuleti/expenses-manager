import React, {useContext, useEffect, useState} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import _ from 'lodash';
import {StatsInfoCard} from './sheet-stats-info-card.components';
import {Text} from '../../../../components/typography/text.component';

import {useDispatch} from 'react-redux';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
export const StatsInfo = ({details, activeType, navigation, sheet}) => {
  const [finalTotal, setFinalTotal] = useState(0);
  const [getSheet, setGetSheet] = useState(sheet);
  const {categories} = useContext(SheetsContext);
  const [sortedByPercentages, setSortedByPercentages] = useState([]);

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
      // for sorting according to percentages
      let sortedPercentages = [];
      Object.keys(details).map(key => {
        let sds = details[key];
        let categoryTotal = 0;
        sds.forEach(e => (categoryTotal += e.amount));
        let percentage = (categoryTotal / total) * 100;
        // percentage = Math.round(percentage * 100);
        percentage = percentage.toFixed(2);
        sortedPercentages.push({
          key: key,
          percentage: Number(percentage),
        });
      });

      let finalSorted = _.chain(sortedPercentages)
        .sortBy('percentage')
        .reverse()
        .map((value, index) => {
          return value.key;
        })
        .value();

      setSortedByPercentages(finalSorted);
      // ending of sort by percentages
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
        data={
          sortedByPercentages && sortedByPercentages.length > 0
            ? sortedByPercentages
            : []
        }
        keyExtractor={item => item}
        renderItem={({item, index}) => {
          let sds = details[item];
          if (sds) {
            let allCategories = categories[activeType];
            let categoryObj = allCategories.filter(c => c.id === item)[0];
            if (!categoryObj) {
              categoryObj = sds.filter(sd => sd.category.id)[0].category;
            }
            let category = categoryObj;
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
                onPress={() => {
                  navigation.navigate('SheetStatsDetails', {
                    category,
                    sheetDetails: sds,
                    sheet: sheet,
                  });
                }}>
                <StatsInfoCard
                  category={category}
                  percentage={percentage}
                  activeType={activeType}
                  totalBalance={totalBalance}
                  currency={getSheet && getSheet.currency}
                />
              </TouchableOpacity>
            );
          }
        }}
      />
    </>
  );
};
