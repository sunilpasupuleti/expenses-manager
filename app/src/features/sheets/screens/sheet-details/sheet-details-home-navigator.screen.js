import React, {useEffect, useState} from 'react';
import {useTheme} from 'styled-components/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SheetDetailsDashboard} from '../../components/sheet-details/sheet-details-dashboard';
import {SheetDetailsScreen} from './sheet-details.screen';
import {useSelector} from 'react-redux';
import {SheetStatsScreen} from '../sheet-stats/sheet-stats.screen';
import {SheetTrendsScreen} from '../sheet-trends/sheet-trends.screen';
import {ObservedSheetDetails} from './sheet-details.observed';
import SheetDetailsHome from './sheet-details-home.screen';

const Tab = createBottomTabNavigator();

export const SheetDetailsHomeNavigatorScreen = ({navigation, route}) => {
  const theme = useTheme();
  const appState = useSelector(state => state.service.appState);
  const [sheet, setSheet] = useState(route.params.sheet);

  const SheetDetailsDashboardComponent = () => {
    return <SheetDetailsDashboard route={route} navigation={navigation} />;
  };

  const SheetDetailsComponent = () => {
    return (
      <SheetDetailsHome navigation={navigation} route={route} sheet={sheet} />
    );
  };

  const SheetStatusComponent = () => {
    return <SheetStatsScreen navigation={navigation} route={route} />;
  };

  const SheetTrendsComponent = () => {
    return <SheetTrendsScreen navigation={navigation} route={route} />;
  };

  if (!sheet) return null;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarStyle: {
          backgroundColor: theme.colors.bg.primary,
          paddingBottom: 30,
          height: 80,
          display: appState === 'active' ? 'flex' : 'none',
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="dots-grid" color={color} size={30} />
          ),
        }}
        component={SheetDetailsDashboardComponent}
      />
      <Tab.Screen
        options={{
          title: 'Transactions',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="cash" color={color} size={30} />
          ),
        }}
        name="Transactions"
        component={SheetDetailsComponent}
      />

      <Tab.Screen
        options={{
          title: 'Analytics',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="chart-pie" color={color} size={30} />
          ),
        }}
        name="SheetStats"
        component={SheetStatusComponent}
      />

      <Tab.Screen
        options={{
          title: 'Trends',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons
              name="trending-up"
              color={color}
              size={30}
            />
          ),
        }}
        name="SheetTrends"
        component={SheetTrendsComponent}
      />
    </Tab.Navigator>
  );
};
