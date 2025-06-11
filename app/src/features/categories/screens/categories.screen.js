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
import {AddNewCategoryIcon, NewCategory} from '../components/categories.styles';
import {useIsFocused} from '@react-navigation/native';
import {TabsSwitcher} from '../../../components/tabs-switcher/tabs-switcher.component';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {ObservedCategoriesDetails} from '../components/categories-details.observed';

export const CategoriesScreen = ({navigation}) => {
  const theme = useTheme();
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(null);
  const [activeType, setActiveType] = useState('expense');
  const routeIsFocused = useIsFocused();
  const {userData} = useContext(AuthenticationContext);

  useEffect(() => {
    if (!routeIsFocused) {
      setSearchKeyword(null);
    }
  }, [routeIsFocused]);

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

  const onSetActiveType = type => {
    setSearchKeyword(null);
    setActiveType(type);
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

        <TabsSwitcher
          tabs={[
            {key: 'expense', label: 'Expense'},
            {key: 'income', label: 'Income'},
          ]}
          setActiveKey={onSetActiveType}
          activeKey={activeType}
        />

        <ObservedCategoriesDetails
          navigation={navigation}
          userId={userData.id}
          activeType={activeType}
          deleteMode={deleteMode}
          searchKeyword={searchKeyword || ''}
          isLoanRelated={false}
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
