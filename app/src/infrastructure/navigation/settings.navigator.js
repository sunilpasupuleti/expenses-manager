import {
  CardStyleInterpolators,
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import React from 'react';
import {Dimensions} from 'react-native';
import {useTheme} from 'styled-components/native';
import {AppearanceScreen} from '../../features/appearance/screens/appearance.screen';
import {SettingsScreen} from '../../features/settings/screens/settings.screen';
import {SyncScreen} from '../../features/sync/screens/sync.screen';
import {CategoriesNavigator} from './categories.navigator';

const SettingsStack = createStackNavigator();

export const SettingsNavigator = () => {
  const theme = useTheme();
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerMode: 'screen',
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: theme.colors.ui.body,
        },
        headerTintColor: theme.colors.headerTintColor,
        headerShadowVisible: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}>
      <SettingsStack.Screen
        options={{
          headerShown: true,
        }}
        name=" "
        component={SettingsScreen}
      />
      <SettingsStack.Screen name="Sync" component={SyncScreen} />
      <SettingsStack.Screen name="Appearance" component={AppearanceScreen} />
      <SettingsStack.Screen
        options={{headerShown: false, headerMode: 'screen'}}
        name="Categories"
        component={CategoriesNavigator}
      />
    </SettingsStack.Navigator>
  );
};
