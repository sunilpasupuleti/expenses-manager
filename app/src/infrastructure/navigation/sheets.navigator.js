import React from 'react';
import {
  CardStyleInterpolators,
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';
import {Dimensions} from 'react-native';
import {useTheme} from 'styled-components/native';
import {CurrenciesScreen} from '../../features/currencies/screens/currencies.screen';
import {SheetStatsDetailsScreen} from '../../features/sheets/components/sheet-stats/sheet-stats-details.component';
import {AddSheetDetailScreen} from '../../features/sheets/screens/add-sheet-detail.screen';
import {AddSheetScreen} from '../../features/sheets/screens/add-sheet.screen';
import {MoveSheetScreen} from '../../features/sheets/screens/move-sheet.screen';
import {SelectCategoryScreen} from '../../features/sheets/screens/select-category.screen';
import {SheetDetailsScreen} from '../../features/sheets/screens/sheet-details.screen';
import {SheetStatsScreen} from '../../features/sheets/screens/sheet-stats.screen';
import {SheetTrendsScreen} from '../../features/sheets/screens/sheet-trends.screen';
import {SheetsScreen} from '../../features/sheets/screens/sheets.screen';

const SheetStack = createStackNavigator();

export const SheetsNavigator = () => {
  const theme = useTheme();
  const headerStyles = {
    headerStyle: {
      backgroundColor: theme.colors.ui.body,
    },
    headerTintColor: theme.colors.headerTintColor,
    headerTitleAlign: 'center',
    headerShadowVisible: false,
  };
  return (
    <SheetStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <SheetStack.Screen name=" " component={SheetsScreen} />
      <SheetStack.Screen
        options={{
          headerShown: true,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...headerStyles,
          ...TransitionPresets.ModalPresentationIOS,
        }}
        name="AddSheet"
        component={AddSheetScreen}
      />
      <SheetStack.Screen
        options={{
          headerShown: true,
          headerMode: 'screen',
          ...headerStyles,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
        name="SheetDetails"
        component={SheetDetailsScreen}
      />

      <SheetStack.Screen
        options={{
          headerShown: true,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...headerStyles,
          ...TransitionPresets.ModalPresentationIOS,
        }}
        name="AddSheetDetail"
        component={AddSheetDetailScreen}
      />

      <SheetStack.Screen
        options={{
          headerShown: true,
          ...headerStyles,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...TransitionPresets.ModalPresentationIOS,
        }}
        name="MoveSheet"
        component={MoveSheetScreen}
      />

      <SheetStack.Screen
        options={{
          headerShown: true,
          ...headerStyles,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...TransitionPresets.ModalPresentationIOS,
        }}
        name="SheetStats"
        component={SheetStatsScreen}
      />

      <SheetStack.Screen
        options={{
          headerShown: true,
          headerMode: 'screen',
          ...headerStyles,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...TransitionPresets.ModalPresentationIOS,
        }}
        name="SheetStatsDetails"
        component={SheetStatsDetailsScreen}
      />

      <SheetStack.Screen
        options={{
          headerShown: true,
          ...headerStyles,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...TransitionPresets.ModalPresentationIOS,
        }}
        name="SheetTrends"
        component={SheetTrendsScreen}
      />

      <SheetStack.Screen
        options={{
          headerShown: true,
          ...TransitionPresets.ModalPresentationIOS,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          headerTitle: 'Select Category',
          ...headerStyles,
        }}
        name="SelectCategory"
        component={SelectCategoryScreen}
      />

      <SheetStack.Screen
        options={{
          headerShown: true,
          ...TransitionPresets.ModalPresentationIOS,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...headerStyles,
        }}
        name="SelectCurrency"
        component={CurrenciesScreen}
      />

      <SheetStack.Screen
        options={{
          headerShown: true,
          ...TransitionPresets.ModalPresentationIOS,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...headerStyles,
        }}
        name="CurrencyRates"
        component={CurrenciesScreen}
      />
    </SheetStack.Navigator>
  );
};
