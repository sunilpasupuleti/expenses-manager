import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {Platform, ScrollView} from 'react-native';
import {Card, Divider} from 'react-native-paper';
import {Spacer} from '../../../components/spacer/spacer.component';
import {TouchableHighlightWithColor} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {CategoryColor, CategoryItem} from './categories.styles';

export const CategoriesDetails = ({
  navigation,
  deleteMode,
  activeType,
  details,
  onDeleteCategory,
}) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Spacer size={'large'}></Spacer>
      <Card theme={{roundness: 5}}>
        {details &&
          details.map(c => {
            return (
              <TouchableHighlightWithColor
                key={c.id}
                onPress={() => {
                  if (!c.default && !deleteMode) {
                    navigation.navigate('AddCategory', {
                      category: c,
                      type: activeType,
                      edit: true,
                    });
                  }
                }}>
                <Card.Content key={c.id}>
                  <CategoryItem>
                    {deleteMode && !c.default && (
                      <>
                        <Ionicons
                          name="remove-circle-outline"
                          size={25}
                          color="red"
                          onPress={() => onDeleteCategory(c)}
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
                  <Divider />
                </Card.Content>
              </TouchableHighlightWithColor>
            );
          })}
      </Card>
    </ScrollView>
  );
};
