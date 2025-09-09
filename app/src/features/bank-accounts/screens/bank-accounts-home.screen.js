import React, { useEffect, useState } from 'react';
import { useTheme } from 'styled-components/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useSelector } from 'react-redux';
import { BankAccountsScreen } from './bank-accounts.screen';
import { BankSubscriptionsScreen } from './bank-subscriptions/bank-subscriptions.screen';
import { TouchableOpacity } from 'react-native';
import { FlexRow } from '../../../components/styles';
import { Text } from '../../../components/typography/text.component';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigationState } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
const Tab = createBottomTabNavigator();

export const BankAccountsHome = ({ navigation, route }) => {
  const theme = useTheme();
  const appState = useSelector(state => state.service.appState);

  const BankAccountsComponent = props => {
    return <BankAccountsScreen navigation={props.navigation} route={route} />;
  };

  const BankSubscriptionsComponent = () => {
    return <BankSubscriptionsScreen navigation={navigation} route={route} />;
  };

  return (
    <Tab.Navigator
      initialRouteName="Accounts"
      screenOptions={{
        headerTitleAlign: 'center',
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarItemStyle: {
          paddingBottom: 5,
        },

        tabBarBackground: () => (
          <LinearGradient
            colors={['#8B5CF6', '#A855F7', '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        ),
        tabBarStyle: {
          backgroundColor: '#8B5CF6',
          // backgroundColor: theme.colors.bg.primary,
          paddingBottom: 25,
          height: 80,
          // display: appState === 'active' ? 'flex' : 'none',
          display: 'flex',
        },
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FlexRow>
              <Ionicons
                name="chevron-back-outline"
                size={25}
                color={theme.colors.brand.primary}
              ></Ionicons>
              <Text color={theme.colors.brand.primary}>Back</Text>
            </FlexRow>
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="Accounts"
        options={{
          title: 'Bank Accounts',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name="bank"
              color={focused ? '#fff' : '#bbb'}
              size={27}
              style={{
                paddingTop: 2,
              }}
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                fontSize: 12,
                fontWeight: focused ? 'bold' : '400',
                color: focused ? '#fff' : '#bbb',
              }}
            >
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
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name="calendar-sync"
              color={focused ? '#fff' : '#bbb'}
              size={27}
              style={{
                paddingTop: 2,
              }}
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              fontsize="12px"
              style={{
                fontWeight: focused ? 'bold' : '400',
                color: focused ? '#fff' : '#bbb',
              }}
            >
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
