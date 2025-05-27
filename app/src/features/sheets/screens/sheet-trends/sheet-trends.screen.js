/* eslint-disable react-hooks/exhaustive-deps */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {useTheme} from 'styled-components/native';
import _ from 'lodash';
import {Dimensions, ScrollView, TouchableOpacity} from 'react-native';

import {View} from 'react-native';
import moment from 'moment';
import {LineChart} from 'react-native-chart-kit';
import Svg, {Line, Rect, Text as TextSVG} from 'react-native-svg';
import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlexRow, MainWrapper} from '../../../../components/styles';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {
  StatsTitle,
  ToolTip,
} from '../../components/sheet-stats/sheet-stats.styles';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {useIsFocused} from '@react-navigation/native';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
import {TabsSwitcher} from '../../../../components/tabs-switcher/tabs-switcher.component';

const getLast12MonthsDates = () => {
  const dates = [];
  for (let i = 11; i >= 0; i--) {
    const date = moment().subtract(i, 'months').format('YYYY-MM-DD');
    dates.push(date);
  }
  return dates;
};

const getLast14DaysDates = () => {
  const dates = [];
  for (let i = 13; i >= 0; i--) {
    const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
    dates.push(date);
  }
  return dates;
};

const last12MonthsDates = getLast12MonthsDates();
const last14DaysDates = getLast14DaysDates();

// const last14DaysDates = getDatesInRange(last14DaysStart, last14DaysEnd);

export const SheetTrendsScreen = ({navigation, route}) => {
  const theme = useTheme();
  const {currentSheet} = useContext(SheetsContext);
  const {onCheckUpcomingSheetDetails, getSheetDetailsTrends} =
    useContext(SheetDetailsContext);
  const {reRender} = route.params || {};

  const chartConfig = {
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    fillShadowGradientOpacity: 0.3,
    color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 2,
    useShadowColorFromDataset: true, // optional
    labelColor: () => theme.colors.text.primary,
    propsForDots: {
      r: '5',
      strokeWidth: '1',
    },
  };
  const routeIsFocused = useIsFocused();
  const [sheetDetails, setSheetDetails] = useState({
    last14DaysTotalCount: 0,
    last12MonthsTotalCount: 0,
    last12MonthsTransactions: [],
    last14DaysTransactions: [],
  });
  const [groupedDetails, setGroupedDetails] = useState(null);
  const [activeType, setActiveType] = useState('expense');
  const [chartData, setChartData] = useState({
    last14days: null,
    last12months: null,
  });
  let [tooltipPos, setTooltipPos] = useState({
    last14days: {
      x: 0,
      y: 0,
      visible: false,
      value: 0,
    },
    last12months: {
      x: 0,
      y: 0,
      visible: false,
      value: 0,
    },
  });

  let menuRef = useRef();

  const menuOptionStyles = {
    optionWrapper: {padding: 15, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };

  useEffect(() => {
    if (routeIsFocused) {
      onSetNavigationOptions();
      onGetSheetDetailsTrends(currentSheet, activeType);
      checkUpcomingDetails();
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (reRender) {
      onGetSheetDetailsTrends(currentSheet, activeType);
      navigation.setParams({reRender: false});
    }
  }, [reRender]);

  useEffect(() => {
    setTooltipPos(prevstate => ({
      last14days: {
        ...prevstate.last14days,
        visible: false,
      },
      last12months: {
        ...prevstate.last12months,
        visible: false,
      },
    }));
  }, [activeType]);

  useEffect(() => {
    if (groupedDetails) {
      onSetChartData();
    }
  }, [groupedDetails]);

  const checkUpcomingDetails = () => {
    onCheckUpcomingSheetDetails(currentSheet, transactionExists => {
      if (transactionExists) {
        onGetSheetDetailsTrends(currentSheet, activeType);
      }
    });
  };

  const onSetNavigationOptions = () => {
    navigation.setOptions({
      headerTitle:
        currentSheet?.name?.length > 25
          ? currentSheet.name.substring(0, 25) + '...'
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
      headerRight: () => null,
    });
  };

  const onGetSheetDetailsTrends = async (sheet, type) => {
    const data = await getSheetDetailsTrends(sheet, type);
    // console.log(data);
    if (data) {
      setSheetDetails(data);
      onSetChartData(data);
      // onSetChartData(data.transactions);
    }
  };

  const onSetChartData = result => {
    const onFormatMonth = date => moment(date).format('YYYY-MM');
    const onFormatDate = date => moment(date).format('DD');

    let {last14DaysTransactions, last12MonthsTransactions} = result;

    let data = {
      last14days: {
        datasets: [],
        labels: [],
        keys: [],
      },
      last12months: {
        datasets: [],
        labels: [],
        keys: [],
      },
    };

    last12MonthsDates.forEach(dt => {
      let dataFound = last12MonthsTransactions.find(
        t => onFormatMonth(t.date) === onFormatMonth(dt),
      );
      let label, amount;
      if (dataFound) {
        let {date, totalAmount} = dataFound;
        label = onFormatMonth(date);
        amount = totalAmount;
      } else {
        label = onFormatMonth(dt);
        amount = 0;
      }
      data.last12months.labels.push(label);
      data.last12months.datasets.push(amount);
      data.last12months.keys.push(dt);
    });

    last14DaysDates.forEach(dt => {
      let dataFound = last14DaysTransactions.find(
        t => onFormatDate(t.date) === onFormatDate(dt),
      );
      let label, amount;
      if (dataFound) {
        let {date, totalAmount} = dataFound;
        label = onFormatDate(date);
        amount = totalAmount;
      } else {
        label = onFormatDate(dt);
        amount = 0;
      }
      data.last14days.labels.push(label);
      data.last14days.datasets.push(amount);
      data.last14days.keys.push(dt);
    });

    let sortedlabels = [...data.last12months.labels].sort();
    let datasets = [];
    sortedlabels.forEach((l, index) => {
      let notSortedIndex = data.last12months.labels.findIndex(k => k === l);
      datasets[index] = data.last12months.datasets[notSortedIndex];
    });
    data.last12months.datasets = datasets;
    data.last12months.labels = sortedlabels;
    let last12monthsVal = moment(data.last12months.keys[0]).format(
      'MMM, YYYY - ',
    );
    last12monthsVal +=
      GetCurrencySymbol(currentSheet.currency) +
      ' ' +
      GetCurrencyLocalString(data.last12months.datasets[0]);

    let last12months = {
      x: 20,
      y: 166,
      value: last12monthsVal,
      visible: true,
    };
    let last14daysVal = moment(data.last14days.keys[0]).format(
      'ddd, DD MMM, YYYY - ',
    );
    last14daysVal +=
      GetCurrencySymbol(currentSheet.currency) +
      ' ' +
      GetCurrencyLocalString(data.last14days.datasets[0]);
    let last14days = {
      x: 20,
      y: 166,
      value: last14daysVal,
      visible: true,
    };

    setTooltipPos({
      last14days: last14days,
      last12months: last12months,
    });
    setChartData(data);
  };

  const onSetActiveType = type => {
    setActiveType(type);
    onGetSheetDetailsTrends(currentSheet, type);
  };

  return (
    <SafeArea child={true}>
      {chartData &&
        chartData.last14days &&
        chartData.last12months &&
        chartData.last14days.datasets &&
        chartData.last12months.datasets &&
        chartData.last14days.datasets.length > 0 &&
        chartData.last12months.datasets.length > 0 && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {!currentSheet.isLoanAccount && (
              <>
                <Spacer size={'large'} />
                <View style={{marginLeft: 10, marginRight: 10}}>
                  <TabsSwitcher
                    tabs={[
                      {key: 'expense', label: 'Expense'},
                      {key: 'income', label: 'Income'},
                    ]}
                    setActiveKey={onSetActiveType}
                    activeKey={activeType}
                  />
                </View>
              </>
            )}

            <Spacer size={'xlarge'} />

            {/* last 14 days */}
            <View last14days>
              <StatsTitle>
                <Text color="#fff">Last 14 days</Text>
              </StatsTitle>

              {tooltipPos.last14days.visible ? (
                <ToolTip>
                  <Text fontfamily="headingSemiBold" fontsize={'12px'}>
                    {tooltipPos.last14days.value}
                  </Text>
                </ToolTip>
              ) : (
                <Spacer size={'xlarge'} />
              )}

              <MainWrapper>
                {chartData.last14days && (
                  <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}>
                    <LineChart
                      withHorizontalLabels={false}
                      withInnerLines={false}
                      withOuterLines={false}
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderRadius: 15,
                        paddingRight: 20,
                      }}
                      data={{
                        labels: chartData.last14days.labels,
                        datasets: [
                          {
                            data: chartData.last14days.datasets,
                            color: (opacity = 1) => `rgba(87,86,213,0.7)`, // optional
                            strokeWidth: 2, // optional
                          },
                        ],
                      }}
                      width={Dimensions.get('window').width}
                      height={200}
                      chartConfig={chartConfig}
                      onDataPointClick={data => {
                        let key = chartData.last14days.keys[data.index];

                        let value = moment(key).format('ddd, DD MMM, YYYY - ');
                        value +=
                          GetCurrencySymbol(currentSheet.currency) +
                          ' ' +
                          GetCurrencyLocalString(data.value);
                        let isSamePoint =
                          tooltipPos.last14days.x === data.x &&
                          tooltipPos.last14days.y === data.y;

                        isSamePoint
                          ? setTooltipPos(previousState => {
                              return {
                                ...previousState,
                                last14days: {
                                  ...previousState.last14days,
                                  visible: !previousState.last14days.visible,
                                },
                              };
                            })
                          : setTooltipPos(prevState => ({
                              ...prevState,
                              last14days: {
                                x: data.x,
                                y: data.y,
                                value: value,
                                visible: true,
                              },
                            }));
                      }}
                      decorator={() => {
                        return tooltipPos.last14days.visible ? (
                          <View>
                            <Svg>
                              <Line
                                x1={tooltipPos.last14days.x}
                                y1="0"
                                x2={tooltipPos.last14days.x}
                                y2="170"
                                stroke={theme.colors.brand.primaryHex}
                                strokeWidth="2"
                              />
                            </Svg>
                          </View>
                        ) : null;
                      }}
                    />
                  </ScrollView>
                )}
              </MainWrapper>
            </View>

            {/* last 12 months */}
            <View last12months>
              <Spacer size={'large'} />
              <StatsTitle>
                <Text color="#fff">Last 12 months</Text>
              </StatsTitle>

              {tooltipPos.last12months.visible ? (
                <ToolTip>
                  <Text fontfamily="headingSemiBold" fontsize={'12px'}>
                    {tooltipPos.last12months.value}
                  </Text>
                </ToolTip>
              ) : (
                <Spacer size={'xlarge'} />
              )}

              <MainWrapper>
                {chartData.last12months && (
                  <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}>
                    <LineChart
                      withHorizontalLabels={false}
                      withInnerLines={false}
                      withOuterLines={false}
                      style={{
                        backgroundColor: theme.colors.bg.secondary,
                        borderRadius: 15,
                        paddingRight: 20,
                      }}
                      data={{
                        labels: chartData.last12months.labels,
                        datasets: [
                          {
                            data: chartData.last12months.datasets,
                            color: (opacity = 1) => `rgba(87,86,213,0.7)`, // optional
                            strokeWidth: 2, // optional
                          },
                        ],
                      }}
                      formatXLabel={xValue => moment(xValue).format('MMM')}
                      width={Dimensions.get('window').width}
                      height={200}
                      chartConfig={chartConfig}
                      onDataPointClick={data => {
                        let key = chartData.last12months.labels[data.index];
                        key = moment(key).format('MMM, YYYY - ');
                        let value = key;
                        value +=
                          GetCurrencySymbol(currentSheet.currency) +
                          '  ' +
                          GetCurrencyLocalString(data.value);

                        let isSamePoint =
                          tooltipPos.last12months.x === data.x &&
                          tooltipPos.last12months.y === data.y;

                        isSamePoint
                          ? setTooltipPos(previousState => {
                              return {
                                ...previousState,
                                last12months: {
                                  ...previousState.last12months,
                                  visible: !previousState.last12months.visible,
                                },
                              };
                            })
                          : setTooltipPos(prevState => ({
                              ...prevState,
                              last12months: {
                                x: data.x,
                                y: data.y,
                                value: value,
                                visible: true,
                              },
                            }));
                      }}
                      decorator={() => {
                        return tooltipPos.last12months.visible ? (
                          <View>
                            <Svg>
                              <Line
                                x1={tooltipPos.last12months.x}
                                y1="0"
                                x2={tooltipPos.last12months.x}
                                y2="170"
                                stroke={theme.colors.brand.primaryHex}
                                strokeWidth="2"
                              />
                            </Svg>
                          </View>
                        ) : null;
                      }}
                    />
                  </ScrollView>
                )}
              </MainWrapper>
            </View>
          </ScrollView>
        )}
    </SafeArea>
  );
};
