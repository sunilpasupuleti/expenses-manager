import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {Button, Searchbar} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {ButtonText, FlexRow, MainWrapper} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {CategoriesDetails} from '../components/categories-details.component';
import {AddNewCategoryIcon, NewCategory} from '../components/categories.styles';
import {CategoryTabs} from '../components/category-tabs.component';

export const CategoriesScreen = ({navigation}) => {
  const theme = useTheme();
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeType, setActiveType] = useState('expense');

  const {categories, onDeleteCategory} = useContext(SheetsContext);

  const [allCategories, setAllCategories] = useState(null);

  useEffect(() => {
    if (categories) {
      setAllCategories(categories[activeType]);
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
    setAllCategories(categories[activeType]);
    if (searchKeyword !== '') {
      let filtered = allCategories.filter(c => {
        return c.name
          .toLowerCase()
          .includes(searchKeyword.trim().toLowerCase());
      });
      setAllCategories(filtered);
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
        <Spacer size={'large'}></Spacer>
        <CategoryTabs activeType={activeType} setActiveType={onSetActiveType} />
        <CategoriesDetails
          deleteMode={deleteMode}
          onDeleteCategory={onClickDeleteCategory}
          details={allCategories}
        />

        <NewCategory
          onPress={() =>
            navigation.navigate('AddCategory', {type: activeType})
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