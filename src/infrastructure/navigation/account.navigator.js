import React from 'react';

import {createStackNavigator} from '@react-navigation/stack';
import {AccountScreen} from '../../features/account/screens/account.screen';

const Stack = createStackNavigator();

export const AccountNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="login" component={AccountScreen} />
    </Stack.Navigator>
  );
};
