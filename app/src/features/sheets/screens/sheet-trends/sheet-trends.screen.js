/* eslint-disable react-hooks/exhaustive-deps */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useEffect, useRef, useState} from 'react';
import {useTheme} from 'styled-components/native';
import _ from 'lodash';
import {Dimensions, ScrollView, TouchableOpacity} from 'react-native';

import {View} from 'react-native';
import moment from 'moment';
import {LineChart} from 'react-native-chart-kit';
import Svg, {Line, Text as TextSVG} from 'react-native-svg';
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
import {useIsFocused} from '@react-navigation/native';
import {TabsSwitcher} from '../../../../components/tabs-switcher/tabs-switcher.component';
import {ObservedSheetTrends} from './sheet-trends.observerd';

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

export const SheetTrendsScreen = ({navigation, route, sheet}) => {
  const [sheetModel, setSheetModel] = useState(null);
  const [activeType, setActiveType] = useState('expense');
  const routeIsFocused = useIsFocused();
  const theme = useTheme();
  useEffect(() => {
    if (sheet) {
      setSheetModel(sheet);
    }
  }, [sheet]);

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
      headerRight: () => null,
    });
  };

  useEffect(() => {
    if (routeIsFocused) {
      onSetNavigationOptions();
    }
  }, [routeIsFocused]);

  if (!sheetModel) return;
  return (
    <ObservedSheetTrends
      navigation={navigation}
      route={route}
      activeType={activeType}
      setActiveType={setActiveType}
      accountId={sheetModel.id}
      sheet={sheetModel}
    />
  );
};

export const BaseSheetTrendsScreen = ({
  navigation,
  route,
  activeType,
  setActiveType,
  sheet,
  last14DaysTransactions,
  last12MonthsTransactions,
}) => {
  const theme = useTheme();

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
    if (activeType && last12MonthsTransactions && last14DaysTransactions) {
      onSetChartData();
    }
  }, [activeType, last12MonthsTransactions, last14DaysTransactions]);

  const onSetChartData = () => {
    const onFormatMonth = date => moment(date).format('YYYY-MM');
    const onFormatDate = date => moment(date).format('YYYY-MM-DD');

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

    const grouped14Days = _.groupBy(last14DaysTransactions, t =>
      onFormatDate(t.date),
    );

    const grouped12Months = _.groupBy(last12MonthsTransactions, t =>
      onFormatMonth(t.date),
    );

    last14DaysDates.forEach(dt => {
      const key = onFormatDate(dt);
      const entries = grouped14Days[key] || [];
      const totalAmount = _.sumBy(entries, 'amount');
      data.last14days.labels.push(moment(dt).format('DD'));
      data.last14days.datasets.push(totalAmount);
      data.last14days.keys.push(dt);
    });

    last12MonthsDates.forEach(dt => {
      const key = onFormatMonth(dt);
      const entries = grouped12Months[key] || [];
      const totalAmount = _.sumBy(entries, 'amount');

      data.last12months.labels.push(moment(dt).format('MMM'));
      data.last12months.datasets.push(totalAmount);
      data.last12months.keys.push(dt);
    });
    // ✅ Focus tooltips on highest data point
    const max14 = Math.max(...data.last14days.datasets);
    const max14Index = data.last14days.datasets.findIndex(v => v === max14);
    const max14Key = data.last14days.keys[max14Index];
    const max14Value =
      moment(max14Key).format('ddd, DD MMM, YYYY - ') +
      GetCurrencySymbol(sheet.currency) +
      ' ' +
      GetCurrencyLocalString(max14);

    const max12 = Math.max(...data.last12months.datasets);
    const max12Index = data.last12months.datasets.findIndex(v => v === max12);
    const max12Key = data.last12months.keys[max12Index];
    const max12Value =
      moment(max12Key).format('MMM, YYYY - ') +
      GetCurrencySymbol(sheet.currency) +
      ' ' +
      GetCurrencyLocalString(max12);

    const last12months = {
      x: max12Index,
      y: 166,
      value: max12Value,
      visible: true,
    };

    const last14days = {
      x: max14Index,
      y: 166,
      value: max14Value,
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
  };

  if (!last14DaysTransactions || !last12MonthsTransactions) return;
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
            {!sheet.isLoanAccount && (
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
                    width={Dimensions.get('window').width - 32}
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
                    // formatXLabel={xValue => moment(xValue).format('MMM')}
                    width={Dimensions.get('window').width - 32}
                    height={200}
                    chartConfig={chartConfig}
                    onDataPointClick={data => {
                      let key = chartData.last12months.keys[data.index];
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
                )}
              </MainWrapper>
            </View>
          </ScrollView>
        )}
    </SafeArea>
  );
};
