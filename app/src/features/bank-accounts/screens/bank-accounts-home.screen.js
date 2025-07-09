import React, {useEffect, useState} from 'react';
import {useTheme} from 'styled-components/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {useSelector} from 'react-redux';
import {BankAccountsScreen} from './bank-accounts.screen';
import {BankSubscriptionsScreen} from './bank-subscriptions/bank-subscriptions.screen';
import {TouchableOpacity} from 'react-native';
import {FlexRow} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigationState} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
const Tab = createBottomTabNavigator();

export const BankAccountsHome = ({navigation, route}) => {
  const theme = useTheme();
  const appState = useSelector(state => state.service.appState);

  const BankAccountsComponent = () => {
    return <BankAccountsScreen navigation={navigation} route={route} />;
  };

  const BankSubscriptionsComponent = () => {
    return <BankSubscriptionsScreen navigation={navigation} route={route} />;
  };

  const routeName = useNavigationState(state => {
    const tab = state.routes.find(r => r.name === 'BankAccountsHome');
    const tabState = tab?.state;
    if (tabState) {
      const activeTab = tabState.routes[tabState.index];
      return activeTab.name;
    }
    return tab?.params?.screen || null;
  });

  return (
    <Tab.Navigator
      initialRouteName="Accounts"
      screenOptions={{
        headerTitleAlign: 'center',
        headerShown: true,
        lazy: true,
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarItemStyle: {
          paddingBottom: 5,
        },

        tabBarBackground: () => (
          <LinearGradient
            colors={
              routeName === 'Subscriptions'
                ? ['#8B5CF6', '#A855F7', '#9333EA']
                : [theme.colors.bg.primary, theme.colors.bg.primary]
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{flex: 1}}
          />
        ),
        tabBarStyle: {
          // backgroundColor: theme.colors.bg.primary,
          backgroundColor: 'transparent',
          paddingBottom: 25,
          height: 80,
          display: appState === 'active' ? 'flex' : 'none',
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
      }}>
      <Tab.Screen
        name="Accounts"
        options={{
          title: 'Bank Accounts',
          tabBarIcon: ({focused, color, size}) => (
            <MaterialCommunityIcons
              name="bank"
              color={routeName === 'Subscriptions' ? '#bbb' : color}
              size={27}
              style={{
                paddingTop: 2,
              }}
            />
          ),
          tabBarLabel: ({focused, color}) => (
            <Text
              style={{
                fontSize: 12,
                color: routeName === 'Subscriptions' ? '#bbb' : color,
              }}>
              Bank Accounts
            </Text>
          ),
        }}
        component={BankAccountsComponent}
      />
      <Tab.Screen
        options={{
          headerShown: false,
          title: 'Subscriptions',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons
              name="calendar-sync"
              color={routeName === 'Subscriptions' ? '#fff' : color}
              size={27}
              style={{
                paddingTop: 2,
              }}
            />
          ),
          tabBarStyle: {
            backgroundColor: '#8B5CF6',
          },
          tabBarLabel: ({focused, color}) => (
            <Text
              fontsize="12px"
              style={{
                fontWeight: 'bold',
                color: routeName === 'Subscriptions' ? '#fff' : color,
              }}>
              Subscriptions
            </Text>
          ),
        }}
        name="Subscriptions"
        component={BankSubscriptionsComponent}
      />
    </Tab.Navigator>
  );
};
