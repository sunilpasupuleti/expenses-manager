import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {FlatList, Platform, ScrollView} from 'react-native';
import {Card, Divider} from 'react-native-paper';
import {Spacer} from '../../../components/spacer/spacer.component';
import {TouchableHighlightWithColor} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {CategoryColor, CategoryItem} from './categories.styles';
import {useTheme} from 'styled-components/native';
import {CategoriesContext} from '../../../services/categories/categories.context';

export const CategoriesDetails = ({
  navigation,
  deleteMode,
  activeType,
  categories,
  onGetCategories,
}) => {
  const theme = useTheme();
  const {onDeleteCategory} = useContext(CategoriesContext);

  const deleteCategory = category => {
    onDeleteCategory(category, () => {
      onGetCategories(activeType);
    });
  };
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Spacer size={'large'}></Spacer>
      <Card
        theme={{roundness: 5}}
        style={{
          paddingBottom: 20,
          backgroundColor: theme.colors.bg.card,
          margin: 1,
        }}>
        {categories &&
          categories.map(c => {
            return (
              <TouchableHighlightWithColor
                key={c.id}
                onPress={() => {
                  if (!c.isDefault && !deleteMode) {
                    navigation.navigate('AddCategory', {
                      category: c,
                      type: activeType,
                      edit: true,
                    });
                  }
                }}>
                <Card.Content key={c.id}>
                  <CategoryItem>
                    {deleteMode && !c.isDefault && (
                      <>
                        <Ionicons
                          name="remove-circle-outline"
                          size={25}
                          color="red"
                          onPress={() => deleteCategory(c)}
                        />
                        <Spacer position={'left'} size={'large'} />
                      </>
                    )}

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
                  <Spacer size={'small'} />
                </Card.Content>
              </TouchableHighlightWithColor>
            );
          })}
      </Card>
    </ScrollView>
  );
};
