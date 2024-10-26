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
import {AddSheetDetailScreen} from '../../features/sheets/screens/add-sheet/add-sheet-detail.screen';
import {AddSheetScreen} from '../../features/sheets/screens/add-sheet/add-sheet.screen';
import {MoveSheetScreen} from '../../features/sheets/screens/move-sheet/move-sheet.screen';
import {SelectCategoryScreen} from '../../features/sheets/screens/select-category/select-category.screen';

import {SheetsScreen} from '../../features/sheets/screens/sheets.screen';
import {SheetDetailsHome} from '../../features/sheets/screens/sheet-details/sheet-details-home.screen';
import {useSelector} from 'react-redux';
import {SheetExport} from '../../features/sheets/components/sheet-export/sheet-export.component';
import {SheetDetailsFilter} from '../../features/sheets/components/sheet-details/sheet-details-filter.component';
import {UpcomingSheetDetails} from '../../features/sheets/screens/sheet-details/upcoming-sheet-details.screen';
import {SelectRepeatScreen} from '../../features/sheets/screens/select-repeat/select-repeat.screen';

const SheetStack = createStackNavigator();

export const SheetsNavigator = () => {
  const theme = useTheme();
  const appState = useSelector(state => state.service.appState);

  const headerStyles = {
    headerTintColor: theme.colors.text.primary,
    headerTitleAlign: 'center',
    headerShadowVisible: false,
  };

  if (appState !== 'active') {
    headerStyles.headerShown = false;
  }
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
        name="SheetDetailsHome"
        component={SheetDetailsHome}
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
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...headerStyles,
          ...TransitionPresets.ModalPresentationIOS,
        }}
        name="SheetExport"
        component={SheetExport}
      />

      <SheetStack.Screen
        options={{
          headerShown: true,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...headerStyles,
          ...TransitionPresets.ModalPresentationIOS,
        }}
        name="SheetDetailsFilter"
        component={SheetDetailsFilter}
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
          title: 'Stats',
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
          headerMode: 'screen',
          ...headerStyles,
          gestureResponseDistance: Dimensions.get('window').height - 200,
          ...TransitionPresets.ModalPresentationIOS,
        }}
        name="UpcomingSheetDetails"
        component={UpcomingSheetDetails}
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
          headerTitle: 'Repeat',
          ...headerStyles,
        }}
        name="SelectRepeat"
        component={SelectRepeatScreen}
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
