/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useRef, useState} from 'react';
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
import {CategoryTabs} from '../../../categories/components/category-tabs.component';
import {StatsInfo} from '../../components/sheet-stats/sheet-stats-info.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlexRow, MainWrapper} from '../../../../components/styles';
import {StatsTitle} from '../../components/sheet-stats/sheet-stats.styles';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {PieChart} from 'react-native-chart-kit';
import {useIsFocused} from '@react-navigation/native';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
const menuOptions = [
  {key: 'daily', value: 'Daily'},
  {key: 'weekly', value: 'Weekly'},
  {key: 'lastweek', value: 'Last Week'},
  {key: 'monthly', value: 'Monthly'},
  {key: 'yearly', value: 'Yearly'},
  {key: 'allitems', value: 'All items'},
];

export const SheetStatsScreen = ({navigation, route}) => {
  const theme = useTheme();
  const {currentSheet} = useContext(SheetsContext);
  const {onCheckUpcomingSheetDetails, getSheetDetailsAnalytics} =
    useContext(SheetDetailsContext);
  const [sheetDetails, setSheetDetails] = useState({
    totalCount: 0,
    finalAmount: 0,
    transactions: [],
  });
  const [activeType, setActiveType] = useState('expense');
  const [report, setReport] = useState({key: 'monthly', value: 'Monthly'});
  const [chartData, setChartData] = useState(null);
  const routeIsFocused = useIsFocused();

  let menuRef = useRef();
  const menuOptionStyles = {
    optionWrapper: {padding: 15, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };

  useEffect(() => {
    if (routeIsFocused) {
      onGetSheetDetailsAnalytics(currentSheet, activeType, report.key);
      checkUpcomingDetails();
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (routeIsFocused) {
      onSetNavigationOptions();
    }
  }, [report, activeType, routeIsFocused]);

  const checkUpcomingDetails = () => {
    onCheckUpcomingSheetDetails(currentSheet, transactionExists => {
      if (transactionExists) {
        onGetSheetDetailsAnalytics(currentSheet, activeType, report.key);
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
    onGetSheetDetailsAnalytics(currentSheet, type, report.key);
  };

  const onSetReport = rep => {
    setReport(rep);
    onGetSheetDetailsAnalytics(currentSheet, activeType, rep.key);
  };

  const onGetSheetDetailsAnalytics = async (sheet, type, reportKey) => {
    const data = await getSheetDetailsAnalytics(sheet, type, reportKey);
    if (data) {
      setSheetDetails(data);
      onSetChartData(data.transactions);
    }
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
            <View style={{marginLeft: 10, marginRight: 10, marginTop: 20}}>
              <CategoryTabs
                setActiveType={onSetActiveType}
                activeType={activeType}
              />
            </View>

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
