import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {useTheme} from 'styled-components/native';
import _ from 'lodash';
import {Dimensions, TouchableOpacity} from 'react-native';
import {VictoryPie} from 'victory-native';
import {View} from 'react-native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';

import moment from 'moment';
import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {CategoryTabs} from '../../../categories/components/category-tabs.component';
import {StatsInfo} from '../../components/sheet-stats/sheet-stats-info.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlexRow} from '../../../../components/styles';
import {StatsTitle} from '../../components/sheet-stats/sheet-stats.styles';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../../../store/loader-slice';
import {ActivityIndicator} from 'react-native-paper';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
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
  const [sheet, setSheet] = useState(null);
  const [groupedDetails, setGroupedDetails] = useState(null);
  const [activeType, setActiveType] = useState('expense');
  const [report, setReport] = useState({key: 'allitems', value: 'All items'});
  const [chartData, setChartData] = useState(null);
  const {categories} = useContext(SheetsContext);
  const dispatch = useDispatch();

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
      headerTitle: 'Stats',
      headerRight: () => (
        <Ionicons
          onPress={() => navigation.goBack()}
          style={{marginRight: 10}}
          name="close-circle-outline"
          size={30}
          color={theme.colors.brand.primary}
        />
      ),
      headerLeft: () => (
        <Menu
          style={{marginLeft: 10}}
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
                  setReport(o);
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
  }, [navigation, report]);

  useEffect(() => {
    if (sheet && sheet.details) {
      let sDetails = [];
      if (report.key === 'allitems') {
        sDetails = sheet.details;
      } else if (report.key === 'daily') {
        sDetails = sheet.details.filter(
          d =>
            moment(d.date).format('YYYY-MM-DD') ===
            moment().format('YYYY-MM-DD'),
        );
      } else {
        sDetails = onReturnFilteredDetails(sheet.details, report.key);
      }
      let expense = sDetails.filter(s => s.type === 'expense');
      let income = sDetails.filter(s => s.type === 'income');
      const groupByCategory = item => item.category.id;
      let expenseGrouped = _(expense).groupBy(groupByCategory).value();
      let incomeGrouped = _(income).groupBy(groupByCategory).value();
      if (activeType === 'expense') {
        setGroupedDetails(expenseGrouped);
      } else {
        setGroupedDetails(incomeGrouped);
      }
    }
  }, [sheet, activeType, report]);

  useEffect(() => {
    if (groupedDetails) {
      onSetChartData();
    }
  }, [groupedDetails]);

  const onReturnFilteredDetails = (sdetails, type) => {
    let details = [];
    let types = {
      weekly: 'week',
      yearly: 'year',
      monthly: 'month',
    };
    sdetails.forEach(s => {
      let sheetDate = moment(s.date).format('YYYY-MM-DD');
      let startOf = moment()
        .startOf(types[type])
        .subtract(1, 'days')
        .format('YYYY-MM-DD');
      let endOf = moment().endOf(types[type]).format('YYYY-MM-DD');
      if (type === 'lastweek') {
        endOf = moment()
          .subtract(1, 'weeks')
          .endOf('week')
          .add(1, 'days')
          .format('YYYY-MM-DD');
        startOf = moment()
          .startOf('week')
          .subtract(1, 'weeks')
          .subtract(1, 'days')
          .format('YYYY-MM-DD');
      }
      let exists = moment(sheetDate).isBetween(startOf, endOf);
      if (exists) {
        details.push(s);
      }
    });
    return details;
  };

  const onSetChartData = () => {
    //  chart data format is x and y
    let data = {datasets: [], colors: []};
    Object.keys(groupedDetails).map((key, index) => {
      let details = groupedDetails[key];
      let categoryAmount = 0;
      details.forEach(element => {
        categoryAmount += element.amount;
      });
      let dataset = {
        y: categoryAmount,
        x: ' ',
      };

      let allCategories = categories[activeType];
      let categoryObj = allCategories.filter(c => c.id === key)[0];
      if (!categoryObj) {
        categoryObj = details.filter(sd => sd.category.id)[0].category;
      }

      data.colors.push(categoryObj.color);
      data.datasets.push(dataset);
    });
    // if empty push something as 100%
    if (data.datasets.length === 0) {
      data.datasets.push({
        y: 1,
        x: ' ',
      });
      data.colors.push('#bbb');
    }
    setChartData(data);
  };
  const onSetActiveType = type => {
    setActiveType(type);
  };

  useEffect(() => {
    if (!chartData) {
      dispatch(loaderActions.showLoader({backdrop: true}));
    } else {
      dispatch(loaderActions.hideLoader());
    }
  }, [chartData]);
  return (
    <SafeArea>
      {chartData && chartData.datasets.length > 0 && (
        <>
          <StatsTitle>
            <Text color="#fff">{report.value}</Text>
          </StatsTitle>
          <VictoryPie
            data={chartData.datasets}
            width={Dimensions.get('window').width}
            height={280}
            innerRadius={50}
            colorScale={chartData.colors}
            style={{
              labels: {
                fill: theme.colors.text.primary,
                fontSize: 15,
                padding: 7,
              },
            }}
          />
          <View style={{marginLeft: 10, marginRight: 10}}>
            <CategoryTabs
              setActiveType={onSetActiveType}
              activeType={activeType}
            />
          </View>
          <Spacer size={'xlarge'} />
          <StatsInfo
            details={groupedDetails}
            navigation={navigation}
            activeType={activeType}
            sheet={sheet}
          />
        </>
      )}
    </SafeArea>
  );
};
