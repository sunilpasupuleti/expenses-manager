/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {Text} from '../../../../components/typography/text.component';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {
  ScrollView,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
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
import {DashboardAddButton} from './sheet-details.styles';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';

export const SheetDetailsDashboard = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const {currentSheet} = useContext(SheetsContext);
  const {onCheckUpcomingSheetDetails, getSheetDetailsDashboard} =
    useContext(SheetDetailsContext);
  const [sheetDetails, setSheetDetails] = useState({
    transactions: [],
    totalCount: 0,
  });

  const [activeType, setActiveType] = useState('income');
  const {reRender} = route.params || {};

  useEffect(() => {
    if (routeIsFocused) {
      onSetNavigationOptions();
      checkUpcomingDetails();
      onGetSheetDetailsDashboard(currentSheet, activeType);
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (reRender) {
      onGetSheetDetailsDashboard(currentSheet, activeType);
      navigation.setParams({reRender: false});
    }
  }, [reRender]);

  useEffect(() => {
    if (currentSheet && currentSheet.details) {
      let sDetails = currentSheet.details;
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

  const onSetNavigationOptions = () => {
    navigation.setOptions({
      headerTitle:
        currentSheet?.name.length > 20
          ? currentSheet.name.substring(0, 14) + '...'
          : currentSheet.name,
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
          <TouchableOpacity onPress={() => navigation.navigate('SheetExport')}>
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
  };

  const checkUpcomingDetails = () => {
    onCheckUpcomingSheetDetails(currentSheet, transactionExists => {
      if (transactionExists) {
        onGetSheetDetailsDashboard(currentSheet, activeType);
      }
    });
  };

  const onSetActiveType = type => {
    setActiveType(type);
    onGetSheetDetailsDashboard(currentSheet, type);
  };

  const onGetSheetDetailsDashboard = async (sheet, type) => {
    let data = await getSheetDetailsDashboard(sheet, type);
    if (data) {
      setSheetDetails(data);
    }
  };

  return (
    <SafeArea child={true}>
      {currentSheet && (
        <ScrollView showsVerticalScrollIndicator={false}>
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
                  {GetCurrencySymbol(currentSheet.currency)}{' '}
                  {GetCurrencyLocalString(currentSheet.totalBalance)}
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
                      {GetCurrencyLocalString(currentSheet.totalIncome)}
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
                      {GetCurrencyLocalString(currentSheet.totalExpense)}
                    </Text>
                  </InExAmount>
                </InEx>
              </FlexRow>
            </LinearGradient>
            <Spacer size={'large'} />
            <CategoryTabs
              activeType={activeType}
              setActiveType={onSetActiveType}
              tabReverse={true}
              animation={false}
            />

            {sheetDetails.totalCount > 0 && (
              <>
                {sheetDetails.transactions.map((sd, index) => {
                  let {category, transactions, totalAmount, totalPercentage} =
                    sd;
                  let {icon, name, color} = category;
                  return (
                    <Spacer size={'large'} key={index}>
                      <Card
                        theme={{roundness: 0}}
                        elevation={2}
                        style={{
                          position: 'relative',
                          borderTopLeftRadius: 10,
                          borderTopRightRadius: 10,
                          backgroundColor: theme.colors.bg.card,
                          margin: 1,
                        }}>
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
                              sheetDetails: transactions,
                            })
                          }>
                          <>
                            <View
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                height: 2,
                                width: totalPercentage + '%',
                                backgroundColor: color,
                              }}
                            />
                            <Card.Content>
                              <FlexRow justifyContent="space-between">
                                <FlexRow>
                                  <CategoryColor
                                    color={category.color}
                                    style={{width: 50, height: 50}}>
                                    {icon && (
                                      <MaterialCommunityIcon
                                        name={icon}
                                        size={22}
                                        color="#fff"
                                      />
                                    )}
                                  </CategoryColor>
                                  <Spacer size={'large'} position="left" />
                                  <Text fontsize="16px" fontfamily="heading">
                                    {name}
                                  </Text>
                                </FlexRow>
                                <View>
                                  <Text fontsize="14px" fontfamily="heading">
                                    {GetCurrencySymbol(currentSheet.currency)}{' '}
                                    {activeType === 'expense' && '-'}{' '}
                                    {GetCurrencyLocalString(totalAmount)}
                                    {/* -40,000.23 */}
                                  </Text>
                                  <Spacer size={'medium'} />
                                  <FlexRow justifyContent="flex-end">
                                    <Text
                                      fontsize="16px"
                                      fontfamily="heading"
                                      color="grey">
                                      {totalPercentage}%
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
            {sheetDetails.totalCount === 0 && (
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
                  one from Transactions tab or Below.
                </Text>
              </View>
            )}
          </MainWrapper>
        </ScrollView>
      )}

      <DashboardAddButton>
        <TouchableNativeFeedback
          onPress={() => {
            navigation.navigate('AddSheetDetail', {
              activeType: activeType,
            });
          }}>
          <FlexRow>
            <AntDesign name="plus" size={20} color={'#fff'} />
          </FlexRow>
        </TouchableNativeFeedback>
      </DashboardAddButton>
    </SafeArea>
  );
};
