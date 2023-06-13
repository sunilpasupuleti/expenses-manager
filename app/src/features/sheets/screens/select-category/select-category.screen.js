import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {ScrollView, TouchableOpacity} from 'react-native';
import {Card, Divider, Searchbar} from 'react-native-paper';
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
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
import _ from 'lodash';
import {Spacer} from '../../../../components/spacer/spacer.component';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

export const SelectCategoryScreen = ({navigation, route}) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const {categories: allCategories} = useContext(SheetsContext);
  const theme = useTheme();
  useEffect(() => {
    if (route.params.type) {
      if (route.params.type === 'expense') {
        const sortedExpenses = _.orderBy(
          allCategories.expense,
          ['name'],
          ['asc'],
        );
        setCategories(sortedExpenses);
      } else {
        const sortedIncome = _.orderBy(allCategories.income, ['name'], ['asc']);
        setCategories(sortedIncome);
      }
    }
    if (route.params.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
    }
  }, [route.params]);

  useEffect(() => {
    const sortedExpenses = _.orderBy(allCategories.expense, ['name'], ['asc']);
    const sortedIncome = _.orderBy(allCategories.income, ['name'], ['asc']);

    setCategories(
      route.params.type === 'expense' ? sortedExpenses : sortedIncome,
    );
    if (searchKeyword !== '') {
      let filtered = categories.filter(c => {
        return c.name
          .toLowerCase()
          .includes(searchKeyword.trim().toLowerCase());
      });
      const sortedFiltered = _.orderBy(filtered, ['name'], ['asc']);

      setCategories(sortedFiltered);
    }
  }, [searchKeyword]);

  useEffect(() => {
    const sortedExpenses = _.orderBy(allCategories.expense, ['name'], ['asc']);
    const sortedIncome = _.orderBy(allCategories.income, ['name'], ['asc']);

    setCategories(
      route.params.type === 'expense' ? sortedExpenses : sortedIncome,
    );
  }, [allCategories]);

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
    <SafeArea>
      <MainWrapper>
        <Searchbar
          value={searchKeyword}
          theme={{roundness: 10}}
          style={{elevation: 2}}
          placeholder="Search"
          clearIcon={() =>
            searchKeyword !== '' && (
              <Ionicons
                onPress={() => setSearchKeyword('')}
                name="close-circle-outline"
                size={25}
                color={theme.colors.brand.primary}
              />
            )
          }
          onChangeText={k => setSearchKeyword(k)}
        />
        <Spacer size={'xlarge'}></Spacer>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Card theme={{roundness: 20}} style={{marginBottom: 100}}>
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
                    <Divider />
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
                params: {type: route.params.type},
              },
            })
          }>
          <AddNewCategoryIcon
            name="md-add-circle-outline"
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
