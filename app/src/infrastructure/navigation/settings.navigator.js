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
import {useSelector} from 'react-redux';
import {ProfileScreen} from '../../features/profile/screens/profile.screen';
import {ProfileContextProvider} from '../../services/profile/profile.context';

const SettingsStack = createStackNavigator();

export const SettingsNavigator = () => {
  const theme = useTheme();

  const appState = useSelector(state => state.service.appState);

  let headerShown = appState === 'active' ? true : false;

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: headerShown,
        headerMode: 'screen',
        headerTitleAlign: 'center',
        headerTintColor: theme.colors.headerTintColor,
        headerShadowVisible: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}>
      <SettingsStack.Screen
        options={{
          headerShown: headerShown,
        }}
        name=" "
        component={SettingsScreen}
      />
      <SettingsStack.Screen name="Sync" component={SyncScreen} />
      <SettingsStack.Screen name="Profile" component={ProfileScreen} />
      <SettingsStack.Screen name="Appearance" component={AppearanceScreen} />
      <SettingsStack.Screen
        options={{headerShown: false, headerMode: 'screen'}}
        name="Categories"
        component={CategoriesNavigator}
      />
    </SettingsStack.Navigator>
  );
};
