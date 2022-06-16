import React, {useContext, useEffect, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {Button, Card} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {ButtonText, FlexRow, MainWrapper} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {
  CategoryColor,
  CategoryNameInput,
} from '../components/categories.styles';
import {CategoryTabs} from '../components/category-tabs.component';

export const AddCategoryScreen = ({navigation, route}) => {
  const theme = useTheme();
  const [disabled, setDisabled] = useState(true);
  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState(null);
  const [categoryType, setCategoryType] = useState('expense');
  const [categoryColor, setCategoryColor] = useState('#8e8e92');
  const {onSaveCategory, onEditCategory} = useContext(SheetsContext);

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (route.params) {
      if (route.params.edit) {
        setEditMode(true);
        setDisabled(false);
        let category = route.params.category;
        setCategoryId(category.id);
        setCategoryName(category.name);
        setCategoryColor(category.color);
        setCategoryType(route.params.type);
      }
      if (route.params.type) {
        setCategoryType(route.params.type);
      }
    }
  }, [route.params]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle:
        route.params && route.params.edit ? 'Edit Category' : 'Add Category',
      headerLeft: () => (
        <Button uppercase={false} onPress={onCancel}>
          <ButtonText>Cancel</ButtonText>
        </Button>
      ),
      headerRight: () => {
        return (
          <Button
            disabled={disabled}
            uppercase={false}
            onPress={editMode ? onEdit : onSave}>
            <ButtonText disabled={disabled}>Done</ButtonText>
          </Button>
        );
      },
    });
  }, [categoryName, categoryColor, categoryType, disabled]);

  useEffect(() => {
    if (categoryName === '' || !categoryName) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [categoryName]);

  const onSave = () => {
    categoryName.trim();
    let category = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      color: categoryColor,
    };
    onSaveCategory(category, categoryType, navigation);
  };

  const onEdit = () => {
    categoryName.trim();
    const editedCategory = {
      id: categoryId,
      name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      color: categoryColor,
    };
    onEditCategory(editedCategory, categoryType, navigation);
  };

  const onCancel = () => {
    navigation.goBack();
  };

  const onSetCategoryType = type => {
    setCategoryType(type);
  };

  const colors = [
    '#ff3a30',
    '#ff5722',
    '#fe9500',
    '#ffcc00',
    '#cddc39',
    '#35c759',
    '#00acc1',
    '#2fb0c7',
    '#007aff',
    '#5756d5',
    '#fe2c54',
    '#af52de',
    '#8a7250',
    '#8e8e92',
    '#aeaeb1',
    '#c7c7cb',
    '#d1d1d5',
    '#ce948e',
  ];

  return (
    <SafeArea>
      <MainWrapper>
        <Spacer size="xlarge">
          {!editMode && (
            <>
              <CategoryTabs
                setActiveType={onSetCategoryType}
                activeType={categoryType}
              />
              <Spacer size={'large'} />
            </>
          )}
        </Spacer>

        <CategoryNameInput
          autoFocus
          autoCapitalize="sentences"
          theme={{roundness: 10}}
          mode="outlined"
          value={categoryName}
          onChangeText={n => setCategoryName(n)}
          placeholder="Enter the category name"
          left={<CategoryNameInput.Icon name="circle" color={categoryColor} />}
          right={
            <CategoryNameInput.Icon
              name="close-circle"
              color="#bbb"
              onPress={() => setCategoryName('')}
            />
          }
          maxLength={50}
        />
        <Spacer size={'xlarge'} />
        <Card theme={{roundness: 15}} style={{paddingBottom: 20}}>
          <FlexRow style={{flexWrap: 'wrap'}}>
            {colors.map(color => (
              <TouchableOpacity
                key={color}
                onPress={() => setCategoryColor(color)}>
                <CategoryColor
                  color={color}
                  style={{
                    marginTop: 15,
                    marginLeft: 15,
                    height: 40,
                    width: 40,
                  }}
                />
              </TouchableOpacity>
            ))}
          </FlexRow>
        </Card>
        <Spacer size={'large'} />
        {/* 
        <Button
          uppercase={false}
          onPress={editMode ? onEdit : onSave}
          mode="contained"
          color={theme.colors.brand.primary}
          disabled={disabled}
        >
          <ButtonText disabled={disabled} color="#fff">
            Done
          </ButtonText>
        </Button> */}
      </MainWrapper>
    </SafeArea>
  );
};
