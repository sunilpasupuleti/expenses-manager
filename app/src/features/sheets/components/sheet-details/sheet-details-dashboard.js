import React, {useContext, useEffect, useState} from 'react';
import {Text} from '../../../../components/typography/text.component';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {ScrollView, TouchableOpacity, View} from 'react-native';
import {
  FlexRow,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'styled-components/native';
import {useIsFocused} from '@react-navigation/native';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {
  InEx,
  InExAmount,
  InExIcon,
  SheetSummaryTotalBalance,
} from './sheet-details-dashboard.styles';
import LinearGradient from 'react-native-linear-gradient';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {CategoryTabs} from '../../../categories/components/category-tabs.component';
import {Card} from 'react-native-paper';
import {CategoryColor} from '../../../categories/components/categories.styles';
import _ from 'lodash';
import {SheetsContext} from '../../../../services/sheets/sheets.context';

export const SheetDetailsDashboard = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const {categories} = useContext(SheetsContext);
  const [sheet, setSheet] = useState(route.params.sheet);
  const [activeType, setActiveType] = useState('income');
  const [groupedDetails, setGroupedDetails] = useState(null);
  const [sortedByPercentages, setSortedByPercentages] = useState(null);

  const getTotalIncome = () => {
    let sheetDetails = sheet.details;
    let totalIncome = 0;
    sheetDetails.forEach(d => {
      if (d.type === 'income') {
        totalIncome += d.amount;
      }
    });
    let data = {
      amount: totalIncome,
      localStringAmount: GetCurrencyLocalString(totalIncome),
    };

    return data;
  };

  const getTotalExpense = () => {
    let sheetDetails = sheet.details;
    let totalExpense = 0;
    sheetDetails.forEach(d => {
      if (d.type === 'expense') {
        totalExpense += d.amount;
      }
    });

    let data = {
      amount: totalExpense,
      localStringAmount: GetCurrencyLocalString(totalExpense),
    };
    return data;
  };

  useEffect(() => {
    if (routeIsFocused) {
      navigation.setOptions({
        headerTitle:
          sheet?.name.length > 20
            ? sheet.name.substring(0, 20) + '...'
            : sheet.name,
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
        headerRight: () => (
          <Spacer position={'right'} size="large">
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('SheetExport', {
                  sheet: sheet,
                })
              }>
              <FlexRow>
                <FontAwesome5
                  name="file-export"
                  size={16}
                  color={theme.colors.brand.primary}
                />
                <Spacer position={'right'} size="medium" />
                <Text color={theme.colors.brand.primary}>Export</Text>
              </FlexRow>
            </TouchableOpacity>
          </Spacer>
        ),
      });
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (sheet && sheet.details) {
      let sDetails = sheet.details;

      let expense = sDetails.filter(s => s.type === 'expense');
      let income = sDetails.filter(s => s.type === 'income');
      const groupByCategory = item => item.category.id;
      let expenseGrouped = _(expense).groupBy(groupByCategory).value();
      let incomeGrouped = _(income).groupBy(groupByCategory).value();

      let sortedPercentages = [];

      Object.keys(
        activeType === 'expense' ? expenseGrouped : incomeGrouped,
      ).map(key => {
        let details =
          activeType === 'expense' ? expenseGrouped[key] : incomeGrouped[key];
        let total = 0;
        details.forEach(detail => {
          total += detail.amount;
        });
        let categoryTotal =
          activeType === 'expense'
            ? getTotalExpense().amount
            : getTotalIncome().amount;
        let percentage = (total / categoryTotal) * 100;
        let allCategories = categories[activeType];
        let categoryObj = allCategories.filter(c => c.id === key)[0];
        if (!categoryObj) {
          categoryObj = details.filter(c => c.category.id)[0].category;
        }

        // details.percentage = Math.round(percentage);
        details.percentage = Number(percentage.toFixed(2));
        details.category = categoryObj;

        details.totalAmount = total;
        sortedPercentages.push({
          key: key,
          percentage: percentage,
        });
        activeType === 'expense'
          ? (expenseGrouped[key] = details)
          : (incomeGrouped[key] = details);
      });

      let finalSorted = _.chain(sortedPercentages)
        .sortBy('percentage')
        .reverse()
        .map((value, index) => {
          return value.key;
        })
        .value();

      if (activeType === 'expense') {
        setGroupedDetails(expenseGrouped);
      } else {
        setGroupedDetails(incomeGrouped);
      }
      setSortedByPercentages(finalSorted);
    }
  }, [activeType]);

  return (
    <SafeArea
      style={{
        backgroundColor: theme.colors.bg.primary,
      }}>
      {sheet && (
        <ScrollView
          style={{marginBottom: 60}}
          showsHorizontalScrollIndicator={false}>
          <MainWrapper>
            <LinearGradient
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              colors={['#4D9DE9', '#D06AF0', '#F9907D']}
              style={{borderRadius: 15, padding: 20}}>
              <SheetSummaryTotalBalance>
                <Text color="#fff" fontfamily="headingSemiBold" fontsize="16px">
                  Total Balance
                </Text>
                <Spacer size={'large'} />
                <Text color="#fff" fontfamily="headingBold" fontsize="38px">
                  {GetCurrencySymbol(sheet.currency)}{' '}
                  {GetCurrencyLocalString(sheet.totalBalance)}
                </Text>
              </SheetSummaryTotalBalance>
              <Spacer size={'large'} />
              <FlexRow justifyContent="space-between">
                <InEx>
                  <InExIcon>
                    <Ionicons
                      name="arrow-down-outline"
                      size={20}
                      color="#32B896"
                    />
                  </InExIcon>
                  <InExAmount>
                    <Text color="#fff" fontfamily="heading" fontsize="16px">
                      Income
                    </Text>
                    <Spacer />
                    <Text color="#fff" fontfamily="headingBold" fontsize="16px">
                      {getTotalIncome().localStringAmount}
                    </Text>
                  </InExAmount>
                </InEx>

                <InEx>
                  <InExIcon>
                    <Ionicons
                      name="arrow-up-outline"
                      size={20}
                      color={'tomato'}
                    />
                  </InExIcon>
                  <InExAmount>
                    <Text color="#fff" fontfamily="heading" fontsize="16px">
                      Expenses
                    </Text>
                    <Spacer />
                    <Text color="#fff" fontfamily="headingBold" fontsize="16px">
                      {getTotalExpense().localStringAmount}
                    </Text>
                  </InExAmount>
                </InEx>
              </FlexRow>
            </LinearGradient>
            <Spacer size={'large'} />
            <CategoryTabs
              activeType={activeType}
              setActiveType={setActiveType}
              tabReverse={true}
              animation={false}
            />

            {sortedByPercentages && sortedByPercentages.length > 0 && (
              <>
                {sortedByPercentages.map(key => {
                  let details = groupedDetails[key];

                  let category = details.category;
                  // get the icon from categoires list
                  // let categoryObj = allCategories.filter(c => c.name === key)[0];
                  let categoryIcon = null;
                  if (category && category.icon) {
                    categoryIcon = category.icon;
                  }

                  return (
                    <Spacer size={'large'} key={key}>
                      <Card
                        theme={{roundness: 5}}
                        elevation={2}
                        style={{position: 'relative'}}>
                        <TouchableHighlightWithColor
                          style={{
                            paddingTop: 12,
                            paddingBottom: 12,
                            paddingLeft: 0,
                            paddingRight: 0,
                          }}
                          onPress={() =>
                            navigation.navigate('SheetStatsDetails', {
                              category,
                              sheetDetails: details,
                              sheet: sheet,
                            })
                          }>
                          <>
                            <View
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                height: 2,
                                width: details.percentage + '%',
                                backgroundColor: category.color,
                              }}
                            />
                            <Card.Content>
                              <FlexRow justifyContent="space-between">
                                <FlexRow>
                                  <CategoryColor
                                    color={category.color}
                                    style={{width: 50, height: 50}}>
                                    {categoryIcon && (
                                      <MaterialCommunityIcon
                                        name={categoryIcon}
                                        size={22}
                                        color="#fff"
                                      />
                                    )}
                                  </CategoryColor>
                                  <Spacer size={'large'} position="left" />
                                  <Text fontsize="16px" fontfamily="heading">
                                    {category.name}
                                  </Text>
                                </FlexRow>
                                <View>
                                  <Text fontsize="14px" fontfamily="heading">
                                    {GetCurrencySymbol(sheet.currency)}{' '}
                                    {activeType === 'expense' && '-'}{' '}
                                    {GetCurrencyLocalString(
                                      details.totalAmount,
                                    )}
                                    {/* -40,000.23 */}
                                  </Text>
                                  <Spacer size={'medium'} />
                                  <FlexRow justifyContent="flex-end">
                                    <Text
                                      fontsize="16px"
                                      fontfamily="heading"
                                      color="#292929">
                                      {details.percentage}%
                                    </Text>
                                  </FlexRow>
                                </View>
                              </FlexRow>
                            </Card.Content>
                          </>
                        </TouchableHighlightWithColor>
                      </Card>
                    </Spacer>
                  );
                })}
              </>
            )}
            {!sortedByPercentages ||
              (sortedByPercentages.length === 0 && (
                <View
                  style={{
                    marginTop: 100,
                  }}>
                  <Text
                    fontfamily="heading"
                    style={{
                      textAlign: 'center',
                      letterSpacing: 1,
                      lineHeight: 30,
                    }}>
                    There are no {_.capitalize(activeType)}s to display. Create
                    one from Transactions tab.
                  </Text>
                </View>
              ))}
          </MainWrapper>
        </ScrollView>
      )}
    </SafeArea>
  );
};
