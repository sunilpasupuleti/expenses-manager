/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useEffect, useRef, useState} from 'react';
import {useTheme} from 'styled-components/native';
import _ from 'lodash';
import {Dimensions, ScrollView, TouchableOpacity} from 'react-native';
import {View} from 'react-native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';

import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {StatsInfo} from '../../components/sheet-stats/sheet-stats-info.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlexRow} from '../../../../components/styles';
import {StatsTitle} from '../../components/sheet-stats/sheet-stats.styles';
import {PieChart} from 'react-native-chart-kit';
import {useIsFocused} from '@react-navigation/native';
import {TabsSwitcher} from '../../../../components/tabs-switcher/tabs-switcher.component';
import {ObservedSheetStats} from './sheet-stats.observed';
import {getLinkedDbRecord} from '../../../../components/utility/helper';
const menuOptions = [
  {key: 'daily', value: 'Daily'},
  {key: 'weekly', value: 'Weekly'},
  {key: 'lastweek', value: 'Last Week'},
  {key: 'monthly', value: 'Monthly'},
  {key: 'yearly', value: 'Yearly'},
  {key: 'allitems', value: 'All items'},
];

export const SheetStatsScreen = ({navigation, route, sheet}) => {
  const [activeType, setActiveType] = useState('expense');
  const [report, setReport] = useState({key: 'monthly', value: 'Monthly'});

  if (!sheet) return null;

  return (
    <ObservedSheetStats
      navigation={navigation}
      route={route}
      sheet={sheet}
      activeType={activeType}
      setActiveType={setActiveType}
      reportKey={report.key}
      report={report}
      setReport={setReport}
      accountId={sheet.id}
    />
  );
};

export const BaseSheetStatsScreen = ({
  navigation,
  route,
  sheet,
  lastTransactions,
  activeType,
  setActiveType,
  report,
  setReport,
}) => {
  const theme = useTheme();

  const [sheetDetails, setSheetDetails] = useState({});
  const [chartData, setChartData] = useState(null);
  const routeIsFocused = useIsFocused();

  let menuRef = useRef();
  const menuOptionStyles = {
    optionWrapper: {padding: 15, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };

  useEffect(() => {
    if (routeIsFocused) {
      onSetNavigationOptions();
    }
  }, [report, activeType, routeIsFocused]);

  useEffect(() => {
    if (!lastTransactions) return;

    const processTransactions = async () => {
      const grouped = _.groupBy(lastTransactions, t => t.category?.id);
      const totalBalance = _.sumBy(lastTransactions, t => t.amount);

      const transactions = await Promise.all(
        Object.keys(grouped).map(async key => {
          const entries = grouped[key];
          const category = await getLinkedDbRecord(entries[0], 'category');

          const totalAmount = _.sumBy(entries, t => t.amount);
          const totalPercentage =
            totalBalance === 0
              ? 0
              : parseFloat(((totalAmount / totalBalance) * 100).toFixed(2));

          return {
            category,
            totalAmount,
            totalPercentage,
          };
        }),
      );
      transactions.sort((a, b) => b.totalPercentage - a.totalPercentage);
      setSheetDetails({
        totalCount: lastTransactions.length,
        transactions,
        finalAmount: totalBalance,
      });

      onSetChartData(transactions);
    };

    processTransactions();
  }, [lastTransactions]);

  const onSetNavigationOptions = () => {
    navigation.setOptions({
      headerTitle:
        sheet?.name?.length > 25
          ? sheet.name.substring(0, 25) + '...'
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
        <Menu
          style={{marginRight: 10}}
          onBackdropPress={() => menuRef.current.close()}
          ref={element => (menuRef.current = element)}>
          <MenuTrigger
            customStyles={{
              triggerTouchable: {
                underlayColor: '#eee',
                onPress: () => {
                  menuRef.current.open();
                },
              },
              TriggerTouchableComponent: TouchableOpacity,
            }}>
            <Ionicons
              name="calendar-outline"
              size={25}
              color={theme.colors.brand.primary}
            />
          </MenuTrigger>

          <MenuOptions
            optionsContainerStyle={{
              marginRight: 10,
              marginTop: 35,
              borderRadius: 10,
              minWidth: 250,
            }}>
            {menuOptions.map(o => (
              <MenuOption
                key={o.key}
                customStyles={menuOptionStyles}
                onSelect={() => {
                  onSetReport(o);
                }}>
                <FlexRow justifyContent="space-between">
                  <Text color="#2f2f2f" fontfamily="heading">
                    {o.value}
                  </Text>
                  {report.key === o.key && (
                    <Ionicons name="checkmark-outline" size={22} />
                  )}
                </FlexRow>
              </MenuOption>
            ))}
          </MenuOptions>
          <Spacer size={'medium'} />
        </Menu>
      ),
    });
  };

  const onSetChartData = (data = []) => {
    let finalData = [];
    if (data.length === 0) {
      finalData.push({
        totalPercentage: 100,
        name: ' ',
        color: '#bbb',
      });
    } else {
      data.forEach(t => {
        let obj = {
          ...t,
          name: t.category.name,
          color: t.category.color,
        };
        finalData.push(obj);
      });
    }

    setChartData(finalData);
  };

  const onSetActiveType = type => {
    setActiveType(type);
  };

  const onSetReport = rep => {
    setReport(rep);
  };

  return (
    <SafeArea child={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        nestedScrollEnabled={true}>
        <Spacer size="xlarge">
          <Spacer position="bottom" size="xlarge">
            <StatsTitle>
              <Text color="#fff">{report.value}</Text>
            </StatsTitle>
            {!sheet.isLoanAccount && (
              <View style={{marginLeft: 10, marginRight: 10, marginTop: 20}}>
                <TabsSwitcher
                  tabs={[
                    {key: 'expense', label: 'Expense'},
                    {key: 'income', label: 'Income'},
                  ]}
                  setActiveKey={onSetActiveType}
                  activeKey={activeType}
                />
              </View>
            )}

            {sheetDetails.totalCount === 0 && (
              <View
                style={{
                  marginTop: 200,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text>No Data Found for Analysis.</Text>
              </View>
            )}

            {sheetDetails.totalCount > 0 && (
              <>
                {chartData && (
                  <View
                    style={{
                      position: 'relative',
                      height: 270,
                    }}>
                    <PieChart
                      data={chartData}
                      width={Dimensions.get('window').width}
                      height={270}
                      absolute
                      hasLegend={false}
                      paddingLeft="100"
                      chartConfig={{
                        decimalPlaces: 2,
                        color: (opacity = 1) =>
                          `rgba(255, 255, 255, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                      }}
                      accessor="totalPercentage"
                      backgroundColor="transparent"
                    />
                  </View>
                )}

                <StatsInfo
                  finalAmount={sheetDetails.finalAmount}
                  sheetDetails={sheetDetails.transactions}
                  navigation={navigation}
                  sheet={sheet}
                  activeType={activeType}
                  reportKey={report.key}
                />
              </>
            )}
          </Spacer>
        </Spacer>
      </ScrollView>
    </SafeArea>
  );
};
