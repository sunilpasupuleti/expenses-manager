/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {ScrollView, TouchableOpacity} from 'react-native';
import {Card} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {
  CategoryColor,
  AddNewCategoryIcon,
  CategoryItem,
  NewCategory,
} from '../../../categories/components/categories.styles';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {Text} from '../../../../components/typography/text.component';
import {
  FlexRow,
  Input,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
import _ from 'lodash';
import {Spacer} from '../../../../components/spacer/spacer.component';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {CategoriesContext} from '../../../../services/categories/categories.context';
import {searchKeywordRegex} from '../../../../components/utility/helper';
import {useIsFocused} from '@react-navigation/native';
import {View} from 'react-native';

export const SelectCategoryScreen = ({navigation, route}) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const {getCategories, onSearchCategories} = useContext(CategoriesContext);
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  useEffect(() => {
    if (route.params.type) {
      onGetCategories(route.params.type);
    }
    if (route.params.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
      if (route.params.addedNewCategoryAndSelected) {
        // navigation.navigate('AddSheetDetail', {
        //   selectedCategory: route.params.selectedCategory,
        // });
      }
    }
  }, [route.params]);

  const onGetCategories = async type => {
    if (type) {
      let data = await getCategories(type, route.params?.isLoanAccount);
      setCategories(data);
    }
  };

  useEffect(() => {
    if (searchKeyword !== null && searchKeywordRegex.test(searchKeyword)) {
      onSearch(route.params.type);
    } else if (searchKeyword === '') {
      onGetCategories(route.params.type);
    }
  }, [searchKeyword]);

  const onSearch = async type => {
    let result = await onSearchCategories(_.toLower(searchKeyword), type);
    setCategories(result);
  };

  useEffect(() => {
    navigation.setOptions({
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
    });
  }, []);

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
            theme={{roundness: 5}}
            style={{
              marginBottom: 100,
              backgroundColor: theme.colors.bg.card,
              margin: 1,
            }}>
            {categories.map(c => {
              return (
                <TouchableHighlightWithColor
                  key={c.id}
                  onPress={() => {
                    if (route.params.editMode) {
                      // send back category
                      route.params.editModeParams.category = c;
                      navigation.navigate('AddSheetDetail', {
                        edit: true,
                        sheetDetail: route.params.editModeParams,
                      });
                    } else {
                      navigation.navigate('AddSheetDetail', {
                        selectedCategory: c,
                      });
                    }
                  }}>
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
          }>
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
