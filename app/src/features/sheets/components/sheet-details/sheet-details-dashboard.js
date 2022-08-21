import React, {useContext, useEffect, useState} from 'react';
import {Text} from '../../../../components/typography/text.component';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {ScrollView, TouchableOpacity, View} from 'react-native';
import {
  FlexColumn,
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

  const getTotalIncome = () => {
    let sheetDetails = sheet.details;
    let totalIncome = 0;
    sheetDetails.forEach(d => {
      if (d.type === 'income') {
        totalIncome += d.amount;
      }
    });
    totalIncome = GetCurrencyLocalString(totalIncome);

    return totalIncome;
  };

  const getTotalExpense = () => {
    let sheetDetails = sheet.details;
    let totalExpense = 0;
    sheetDetails.forEach(d => {
      if (d.type === 'expense') {
        totalExpense += d.amount;
      }
    });
    totalExpense = GetCurrencyLocalString(totalExpense);

    return totalExpense;
  };

  useEffect(() => {
    if (routeIsFocused) {
      navigation.setOptions({
        headerTitle: '',
        headerStyle: {
          backgroundColor: theme.colors.bg.primary,
        },
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
        headerRight: () => null,
      });
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (sheet && sheet.details) {
      let sDetails = sheet.details;

      let expense = sDetails.filter(s => s.type === 'expense');
      let income = sDetails.filter(s => s.type === 'income');
      const groupByCategory = item => item.category.name;
      let expenseGrouped = _(expense).groupBy(groupByCategory).value();
      let incomeGrouped = _(income).groupBy(groupByCategory).value();

      if (activeType === 'expense') {
        setGroupedDetails(expenseGrouped);
      } else {
        setGroupedDetails(incomeGrouped);
      }
    }
  }, [activeType]);

  return (
    <SafeArea
      style={{
        backgroundColor: theme.colors.bg.primary,
      }}>
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
                    {getTotalIncome()}
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
                    {getTotalExpense()}
                  </Text>
                </InExAmount>
              </InEx>
            </FlexRow>
          </LinearGradient>
          <Spacer size={'large'} />
          {groupedDetails && Object.keys(groupedDetails).length > 0 && (
            <>
              <CategoryTabs
                activeType={activeType}
                setActiveType={setActiveType}
                tabReverse={true}
              />
              {Object.keys(groupedDetails).map(key => {
                let details = groupedDetails[key];
                let category = details[0].category;
                let allCategories = categories[activeType];
                // get the icon from categoires list
                let categoryObj = allCategories.filter(c => c.name === key)[0];
                let categoryIcon = null;
                if (categoryObj && categoryObj.icon) {
                  categoryIcon = categoryObj.icon;
                }
                let totalAmount = 0;
                details.forEach(d => (totalAmount += d.amount));
                return (
                  <Spacer size={'large'} key={key}>
                    <Card theme={{roundness: 10}} elevation={2}>
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
                                {key}
                              </Text>
                            </FlexRow>
                            <View>
                              <Text fontsize="14px" fontfamily="heading">
                                {GetCurrencySymbol(sheet.currency)}{' '}
                                {activeType === 'expense' && '-'}{' '}
                                {GetCurrencyLocalString(totalAmount)}
                                {/* -40,000.23 */}
                              </Text>
                              <Spacer />
                              <Text
                                fontsize="14px"
                                fontfamily="heading"
                                color="#aaa">
                                Yesterday
                              </Text>
                            </View>
                          </FlexRow>
                        </Card.Content>
                      </TouchableHighlightWithColor>
                    </Card>
                  </Spacer>
                );
              })}
            </>
          )}
        </MainWrapper>
      </ScrollView>
    </SafeArea>
  );
};
