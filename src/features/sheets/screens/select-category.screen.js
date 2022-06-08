import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {ScrollView, TouchableOpacity} from 'react-native';
import {Card, Divider, Searchbar} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {
  FlexRow,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {
  AddNewCategoryIcon,
  CategoryColor,
  CategoryItem,
  NewCategory,
} from '../../categories/components/categories.styles';
export const SelectCategoryScreen = ({navigation, route}) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const {categories: allCategories} = useContext(SheetsContext);
  const theme = useTheme();
  useEffect(() => {
    if (route.params.type) {
      if (route.params.type === 'expense') {
        setCategories(allCategories.expense);
      } else {
        setCategories(allCategories.income);
      }
    }
    if (route.params.selectedCategory) {
      setSelectedCategory(route.params.selectedCategory);
    }
  }, [route.params]);

  useEffect(() => {
    setCategories(
      route.params.type === 'expense'
        ? allCategories.expense
        : allCategories.income,
    );
    if (searchKeyword !== '') {
      let filtered = categories.filter(c => {
        return c.name.toLowerCase().includes(searchKeyword.toLowerCase());
      });
      setCategories(filtered);
    }
  }, [searchKeyword]);

  useEffect(() => {
    setCategories(
      route.params.type === 'expense'
        ? allCategories.expense
        : allCategories.income,
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
          onChangeText={k => setSearchKeyword(k.trim())}
        />
        <Spacer size={'xlarge'}></Spacer>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Card theme={{roundness: 20}}>
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
                        <CategoryColor color={c.color} />
                        <Spacer position={'left'} size={'medium'} />
                        <Text variant="label">{c.name}</Text>
                      </CategoryItem>
                      {selectedCategory.id === c.id && (
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
          <Text variant="label" color={theme.colors.brand.primary}>
            New Category
          </Text>
        </NewCategory>
      </MainWrapper>
    </SafeArea>
  );
};
