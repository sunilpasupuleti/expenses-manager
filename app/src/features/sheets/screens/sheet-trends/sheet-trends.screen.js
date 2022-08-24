import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useEffect, useRef, useState} from 'react';
import {useTheme} from 'styled-components/native';
import _, {keys} from 'lodash';
import {Dimensions, ScrollView, TouchableOpacity} from 'react-native';

import {View} from 'react-native';
import moment from 'moment';
import {LineChart} from 'react-native-chart-kit';
import Svg, {Line, Rect, Text as TextSVG} from 'react-native-svg';
import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {CategoryTabs} from '../../../categories/components/category-tabs.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {MainWrapper} from '../../../../components/styles';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {
  StatsTitle,
  ToolTip,
} from '../../components/sheet-stats/sheet-stats.styles';
export const SheetTrendsScreen = ({navigation, route}) => {
  const theme = useTheme();

  const chartConfig = {
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    fillShadowGradientOpacity: 0.3,
    color: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 2,
    useShadowColorFromDataset: true, // optional
    labelColor: () => theme.colors.text.primary,
    propsForDots: {
      r: '5',
      strokeWidth: '1',
    },
  };

  const [sheet, setSheet] = useState(null);
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
    if (route.params && route.params.sheet) {
      setSheet(route.params.sheet);
    }
    navigation.setOptions({
      headerTitle: 'Trends',
      headerRight: () => (
        <Ionicons
          onPress={() => navigation.goBack()}
          style={{marginRight: 10}}
          name="close-circle-outline"
          size={30}
          color={theme.colors.brand.primary}
        />
      ),
      headerLeft: () => null,
    });
  }, [navigation]);

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
    if (sheet && sheet.details) {
      let expense = sheet.details.filter(s => s.type === 'expense');
      let income = sheet.details.filter(s => s.type === 'income');

      const groupByCategory = item => item.category.name;
      let expenseGrouped = _(expense).groupBy(groupByCategory).value();
      let incomeGrouped = _(income).groupBy(groupByCategory).value();
      if (activeType === 'expense') {
        setGroupedDetails(expenseGrouped);
      } else {
        setGroupedDetails(incomeGrouped);
      }
    }
  }, [sheet, activeType]);

  useEffect(() => {
    if (groupedDetails) {
      onSetChartData();
    }
  }, [groupedDetails]);

  const onReturnLast14DaysDetails = () => {
    let sdetails = [];
    Object.keys(groupedDetails).map(key => {
      groupedDetails[key].forEach(element => {
        sdetails.push(element);
      });
    });
    let startOf = moment().format('YYYY-MM-DD');
    let endOf = moment()
      .subtract(14, 'days')
      .subtract(1, 'days')
      .format('YYYY-MM-DD');

    let duplicateEndOf = moment().subtract(14, 'days').format('YYYY-MM-DD');

    let betweenDateDetails = {};
    while (moment(duplicateEndOf).isBefore(startOf)) {
      betweenDateDetails[duplicateEndOf] = [];
      duplicateEndOf = moment(duplicateEndOf)
        .add(1, 'days')
        .format('YYYY-MM-DD');
    }
    sdetails.forEach(s => {
      let sheetDate = moment(s.date).format('YYYY-MM-DD');
      let exists = moment(sheetDate).isBetween(endOf, startOf);
      if (exists) {
        betweenDateDetails[sheetDate].push(s);
      }
    });
    return betweenDateDetails;
  };

  const onReturnLast12MonthsDetails = () => {
    let sdetails = [];
    Object.keys(groupedDetails).map(key => {
      groupedDetails[key].forEach(element => {
        sdetails.push(element);
      });
    });
    // last 12 months details
    let last12MonthsDetails = {};
    for (let i = 1; i <= 12; i++) {
      last12MonthsDetails[moment().subtract(i, 'months').format('YYYY-MM')] =
        [];
    }
    const groupByMonthAndYear = item => moment(item.date).format('YYYY-MM');
    let grouped = _(sdetails).groupBy(groupByMonthAndYear).value();
    Object.keys(grouped).map(key => {
      last12MonthsDetails[key] = grouped[key];
    });
    return last12MonthsDetails;
  };

  const onSetChartData = () => {
    let last14daysDetails = onReturnLast14DaysDetails();
    let last12MonthsDetails = onReturnLast12MonthsDetails();
    let data = {
      last14days: {
        datasets: [],
        labels: [],
        keys: [],
      },
      last12months: {
        datasets: [],
        labels: [],
      },
    };
    //  chart data for last 14 days

    Object.keys(last14daysDetails).map((key, index) => {
      data.last14days.keys.push(key);
      data.last14days.labels.push(moment(key).format('DD'));
      let details = last14daysDetails[key];
      let totalAmount = 0;
      details.forEach(element => {
        totalAmount += element.amount;
      });
      data.last14days.datasets.push(totalAmount);
    });
    // chart data for last 12 months
    Object.keys(last12MonthsDetails).map((key, index) => {
      data.last12months.labels.push(moment(key).format('YYYY-MM'));
      let details = last12MonthsDetails[key];
      let totalAmount = 0;
      details.forEach(element => {
        totalAmount += element.amount;
      });
      data.last12months.datasets.push(totalAmount);
    });
    let sortedlabels = [...data.last12months.labels].sort();
    let datasets = [];
    sortedlabels.forEach((l, index) => {
      let notSortedIndex = data.last12months.labels.findIndex(k => k === l);
      datasets[index] = data.last12months.datasets[notSortedIndex];
    });
    data.last12months.datasets = datasets;
    data.last12months.labels = sortedlabels;
    setChartData(data);
  };
  const onSetActiveType = type => {
    setActiveType(type);
  };

  return (
    <SafeArea>
      {chartData &&
        chartData.last14days &&
        chartData.last12months &&
        chartData.last14days.datasets &&
        chartData.last12months.datasets &&
        chartData.last14days.datasets.length > 0 &&
        chartData.last12months.datasets.length > 0 && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Spacer size={'large'} />
            <View style={{marginLeft: 10, marginRight: 10}}>
              <CategoryTabs
                setActiveType={onSetActiveType}
                activeType={activeType}
              />
            </View>
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
                            color: (opacity = 1) => `rgb(87,86,213 ,0.7)`, // optional
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
                          GetCurrencySymbol(sheet.currency) +
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
                            color: (opacity = 1) => `rgb(87,86,213 ,0.7)`, // optional
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
                          GetCurrencySymbol(sheet.currency) +
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
