import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useEffect, useState} from 'react';
import {ScrollView} from 'react-native';
import {Card, Divider} from 'react-native-paper';
import {Spacer} from '../../../components/spacer/spacer.component';
import {TouchableHighlightWithColor} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';

import {CategoryColor, CategoryItem} from './categories.styles';

export const CategoriesDetails = ({deleteMode, details, onDeleteCategory}) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Spacer size={'large'}></Spacer>
      <Card theme={{roundness: 20}}>
        {details &&
          details.map(c => {
            return (
              <TouchableHighlightWithColor
                key={c.id}
                onPress={() => {
                  if (!c.default && !deleteMode) {
                    navigation.navigate('AddCategory', {
                      category: expense,
                      type: 'expense',
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

                    <CategoryColor color={c.color} />
                    <Spacer position={'left'} size={'medium'} />
                    <Text variant="label">{c.name}</Text>
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
