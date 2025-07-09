import {createStackNavigator} from '@react-navigation/stack';
import React from 'react';
import {useTheme} from 'styled-components/native';
import {colors} from '../theme/colors';
import {useSelector} from 'react-redux';
import {BankAccountsScreen} from '../../features/bank-accounts/screens/bank-accounts.screen';
import {BankDetailsScreen} from '../../features/bank-accounts/screens/bank-details/bank-details.screen';
import {BankBalanceScreen} from '../../features/bank-accounts/screens/bank-details/bank-balance.screen';
import {BankTransactionsScreen} from '../../features/bank-accounts/screens/bank-transactions/bank-transactions.screen';
import {BankAccountsHome} from '../../features/bank-accounts/screens/bank-accounts-home.screen';

const BankAccountStack = createStackNavigator();

export const BankAccountNavigator = () => {
  const theme = useTheme();

  const appState = useSelector(state => state.service.appState);

  let headerShown = appState === 'active' ? true : false;

  return (
    <BankAccountStack.Navigator
      screenOptions={{
        headerShown: headerShown,
        headerMode: 'screen',
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        // headerStyle: {
        //   backgroundColor: theme.colors.ui.body,
        // },
        headerTintColor: theme.colors.headerTintColor,
      }}>
      <BankAccountStack.Screen
        name="BankAccountsHome"
        options={{
          headerShown: false,
        }}
        component={BankAccountsHome}
      />
      <BankAccountStack.Screen
        name="BankDetails"
        component={BankDetailsScreen}
      />
      <BankAccountStack.Screen
        name="BankBalance"
        options={{
          headerShown: false,
        }}
        component={BankBalanceScreen}
      />
      <BankAccountStack.Screen
        name="BankTransactions"
        component={BankTransactionsScreen}
      />
    </BankAccountStack.Navigator>
  );
};
