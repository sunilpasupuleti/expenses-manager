import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {Button} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {
  ButtonText,
  FlexRow,
  Input,
  MainWrapper,
} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {CategoriesDetails} from '../components/categories-details.component';
import {AddNewCategoryIcon, NewCategory} from '../components/categories.styles';
import {CategoryTabs} from '../components/category-tabs.component';
import _ from 'lodash';

export const CategoriesScreen = ({navigation}) => {
  const theme = useTheme();
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeType, setActiveType] = useState('expense');

  const {categories, onDeleteCategory} = useContext(SheetsContext);

  const [allCategories, setAllCategories] = useState(null);

  useEffect(() => {
    if (categories) {
      let sorted = _.orderBy(categories[activeType], ['name'], ['asc']);
      setAllCategories(sorted);
    }
  }, [activeType, categories]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Categories',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FlexRow>
            <Ionicons
              name="chevron-back-outline"
              size={25}
              color={theme.colors.brand.primary}></Ionicons>
            <Text color={theme.colors.brand.primary}>Settings</Text>
          </FlexRow>
        </TouchableOpacity>
      ),

      headerRight: () => {
        return (
          <>
            {!deleteMode && (
              <Button uppercase={false} onPress={() => setDeleteMode(true)}>
                <ButtonText>Edit</ButtonText>
              </Button>
            )}
            {deleteMode && (
              <Button uppercase={false} onPress={() => setDeleteMode(false)}>
                <ButtonText>Done</ButtonText>
              </Button>
            )}
          </>
        );
      },
    });
  }, [deleteMode]);

  useEffect(() => {
    let sorted = _.orderBy(categories[activeType], ['name'], ['asc']);
    setAllCategories(sorted);
    if (searchKeyword !== '') {
      let filtered = allCategories.filter(c => {
        return c.name
          .toLowerCase()
          .includes(searchKeyword.trim().toLowerCase());
      });
      let filterWithSorted = _.orderBy(filtered, ['name'], ['asc']);
      setAllCategories(filterWithSorted);
    }
  }, [searchKeyword]);

  const onSetActiveType = type => {
    setActiveType(type);
  };

  const onClickDeleteCategory = c => {
    onDeleteCategory(c, activeType);
  };

  return (
    <SafeArea>
      <MainWrapper>
        <Input
          value={searchKeyword}
          placeholder="Search"
          clearButtonMode="while-editing"
          onChangeText={k => setSearchKeyword(k)}
        />
        <Spacer size={'large'} />
        <CategoryTabs activeType={activeType} setActiveType={onSetActiveType} />
        <CategoriesDetails
          navigation={navigation}
          activeType={activeType}
          deleteMode={deleteMode}
          onDeleteCategory={onClickDeleteCategory}
          details={allCategories}
        />

        <NewCategory
          onPress={() =>
            navigation.navigate('AddCategory', {type: activeType})
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
