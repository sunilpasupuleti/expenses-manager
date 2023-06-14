import React, {useEffect, useState} from 'react';
import {useTheme} from 'styled-components/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SheetDetailsDashboard} from '../../components/sheet-details/sheet-details-dashboard';
import {SheetDetailsScreen} from './sheet-details.screen';
import {useSelector} from 'react-redux';

const Tab = createBottomTabNavigator();

export const SheetDetailsHome = ({navigation, route}) => {
  const theme = useTheme();
  const appState = useSelector(state => state.service.appState);

  // const [sheet, setSheet] = useState(route.params.sheet);

  const SheetDetailsDashboardComponent = () => {
    return <SheetDetailsDashboard route={route} navigation={navigation} />;
  };

  const SheetDetailsComponent = () => {
    return <SheetDetailsScreen navigation={navigation} route={route} />;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarStyle: {
          backgroundColor: theme.colors.bg.primary,
          paddingBottom: 10,
          display: appState === 'active' ? 'flex' : 'none',
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="dots-grid" color={color} size={30} />
          ),
        }}
        component={SheetDetailsDashboardComponent}
      />
      <Tab.Screen
        options={{
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons
              name="format-list-bulleted"
              color={color}
              size={30}
            />
          ),
        }}
        name="Transactions"
        component={SheetDetailsComponent}
      />
    </Tab.Navigator>
  );
};
