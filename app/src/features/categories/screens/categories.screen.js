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
import {CategoriesDetails} from '../components/categories-details.component';
import {AddNewCategoryIcon, NewCategory} from '../components/categories.styles';
import {CategoryTabs} from '../components/category-tabs.component';
import _ from 'lodash';
import {CategoriesContext} from '../../../services/categories/categories.context';
import {searchKeywordRegex} from '../../../components/utility/helper';
import {useIsFocused} from '@react-navigation/native';

export const CategoriesScreen = ({navigation}) => {
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(null);
  const [activeType, setActiveType] = useState('expense');
  const routeIsFocused = useIsFocused();
  const {getCategories, onSearchCategories} = useContext(CategoriesContext);

  useEffect(() => {
    if (routeIsFocused) {
      onGetCategories(activeType);
    } else {
      setSearchKeyword(null);
    }
  }, [routeIsFocused]);

  const onGetCategories = async type => {
    if (type) {
      let data = await getCategories(type);
      setCategories(data);
    }
  };

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
    if (searchKeyword === '') {
      onGetCategories();
    } else if (
      searchKeyword !== null &&
      searchKeywordRegex.test(searchKeyword)
    ) {
      onSearch();
    }
  }, [searchKeyword]);

  const onSearch = async () => {
    let result = await onSearchCategories(_.toLower(searchKeyword), activeType);
    setCategories(result);
  };

  const onSetActiveType = type => {
    setSearchKeyword(null);
    setActiveType(type);
    onGetCategories(type);
  };

  return (
    <SafeArea child={true}>
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
          categories={categories}
          onGetCategories={onGetCategories}
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
