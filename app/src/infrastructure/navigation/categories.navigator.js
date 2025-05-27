import {createStackNavigator} from '@react-navigation/stack';
import React from 'react';
import {useTheme} from 'styled-components/native';
import {AddCategoryScreen} from '../../features/categories/screens/add-category.screen';
import {CategoriesScreen} from '../../features/categories/screens/categories.screen';
import {colors} from '../theme/colors';
import {useSelector} from 'react-redux';

const CategoryStack = createStackNavigator();

export const CategoriesNavigator = () => {
  const theme = useTheme();

  const appState = useSelector(state => state.service.appState);

  let headerShown = appState === 'active' ? true : false;

  return (
    <CategoryStack.Navigator
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
      <CategoryStack.Screen name=" " component={CategoriesScreen} />
      <CategoryStack.Screen
        options={{headerShown: headerShown}}
        name="AddCategory"
        component={AddCategoryScreen}
      />
    </CategoryStack.Navigator>
  );
};
