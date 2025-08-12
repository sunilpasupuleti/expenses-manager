/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { useTheme } from 'styled-components/native';
import {
  CategoryColor,
  AddNewCategoryIcon,
  CategoryItem,
  NewCategory,
} from '../../../categories/components/categories.styles';
import { SheetsContext } from '../../../../services/sheets/sheets.context';
import { SafeArea } from '../../../../components/utility/safe-area.component';
import { Text } from '../../../../components/typography/text.component';
import {
  FlexRow,
  Input,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
import _ from 'lodash';
import { Spacer } from '../../../../components/spacer/spacer.component';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CategoriesContext } from '../../../../services/categories/categories.context';
import { searchKeywordRegex } from '../../../../components/utility/helper';
import { StackActions, useIsFocused } from '@react-navigation/native';
import { View } from 'react-native';
import { AuthenticationContext } from '../../../../services/authentication/authentication.context';
import { ObservedSelectCategoryScreen } from './select-category.observed';

export const SelectCategoryScreen = ({ navigation, route }) => {
  const { userData } = useContext(AuthenticationContext);
  const [searchKeyword, setSearchKeyword] = useState('');
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  useEffect(() => {
    navigation.setOptions({
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
    });
  }, []);

  useEffect(() => {
    if (!routeIsFocused) {
      setSearchKeyword('');
    }
  }, [routeIsFocused]);

  return (
    <ObservedSelectCategoryScreen
      navigation={navigation}
      route={route}
      userId={userData.id}
      type={route.params?.type}
      searchKeyword={searchKeyword}
      setSearchKeyword={setSearchKeyword}
      isLoanRelated={route.params?.isLoanAccount || false}
    />
  );
};

export const BaseSelectCategoryScreen = ({
  navigation,
  route,
  categories = [],
  searchKeyword,
  setSearchKeyword,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const theme = useTheme();
  useEffect(() => {
    if (route.params.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
      if (route.params.addedNewCategoryAndSelected) {
        // navigation.navigate('AddSheetDetail', {
        //   selectedCategory: route.params.selectedCategory,
        // });
      }
    }
  }, [route.params]);

  return (
    <SafeArea child={true}>
      <MainWrapper>
        <Input
          value={searchKeyword}
          placeholder="Search"
          clearButtonMode="while-editing"
          onChangeText={k => setSearchKeyword(k)}
        />
        <Spacer size={'xlarge'}></Spacer>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Card
            theme={{ roundness: 5 }}
            style={{
              marginBottom: 100,
              backgroundColor: theme.colors.bg.card,
              margin: 1,
            }}
          >
            {categories.map(c => {
              return (
                <TouchableHighlightWithColor
                  key={c.id}
                  onPress={() => {
                    console.log(route.params);

                    const routes = navigation.getState().routes;
                    const previousRouteKey = routes[routes.length - 2]?.key;
                    console.log(previousRouteKey);

                    if (route.params.editMode) {
                      // send back category
                      route.params.editModeParams.category = c;
                      route.params.editModeParams.type = c.type;
                      navigation.navigate(
                        'AddSheetDetail',
                        {
                          edit: true,
                          sheet: route.params.sheet,
                          sheetDetail: route.params.editModeParams,
                          sheetDetailModel: route.params?.sheetDetailModel,
                        },
                        {
                          pop: true,
                        },
                      );
                    } else {
                      navigation.navigate(
                        'AddSheetDetail',
                        {
                          selectedCategory: c,
                          sheet: route.params.sheet,
                        },
                        {
                          pop: true,
                        },
                      );
                    }
                  }}
                >
                  <Card.Content key={c.id}>
                    <FlexRow justifyContent="space-between">
                      <CategoryItem>
                        <CategoryColor color={c.color}>
                          {c.icon && (
                            <MaterialCommunityIcon
                              name={c.icon}
                              size={16}
                              color="#fff"
                            />
                          )}
                        </CategoryColor>
                        <Spacer position={'left'} size={'medium'} />
                        <Text fontfamily="heading">{c.name}</Text>
                      </CategoryItem>
                      {selectedCategory && selectedCategory.id === c.id && (
                        <Ionicons
                          name="checkmark-outline"
                          size={25}
                          color={theme.colors.brand.primary}
                        />
                      )}
                    </FlexRow>

                    <Spacer size={'small'} />
                  </Card.Content>
                </TouchableHighlightWithColor>
              );
            })}
          </Card>
        </ScrollView>

        <NewCategory
          onPress={() =>
            navigation.navigate('Settings', {
              screen: 'Categories',
              params: {
                screen: 'AddCategory',
                params: {
                  type: route.params.type,
                  fromSheetDetailScreen: true,
                  isLoanAccount: route.params.isLoanAccount,
                },
              },
            })
          }
        >
          <AddNewCategoryIcon
            name="add-circle-outline"
            size={25}
            color={theme.colors.brand.primary}
          />
          <Text fontfamily="heading" color={theme.colors.brand.primary}>
            New Category
          </Text>
        </NewCategory>
      </MainWrapper>
    </SafeArea>
  );
};
