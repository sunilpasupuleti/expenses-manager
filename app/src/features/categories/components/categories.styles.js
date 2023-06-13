import React from 'react';

import Ionicons from 'react-native-vector-icons/Ionicons';
import {Button, TextInput} from 'react-native-paper';
import styled from 'styled-components/native';
import {Text} from '../../../components/typography/text.component';
import {colors} from '../../../infrastructure/theme/colors';
export const TabBarLabel = styled(Text)`
  color: #fff;
  width: auto;
  ${props => props.focused && `background-color: #605fd7;`}
`;

export const CategoryColor = styled.View`
  width: 33px;
  height: 33px;
  border-radius: 50px;
  align-items: center;
  justify-content: center;
  ${props => props.color && `background-color : ${props.color};`}
`;

export const ColorPickerView = styled.View`
  height: 20px;
  width: 20px;
  border-radius: 50px;
  align-items: center;
  justify-content: center;
  ${props => props.color && `border :1px solid ${props.color};`}
`;

export const IconView = styled.View`
  border-radius: 50px;
  padding: 14px;
  margin-left: 10px;
  margin-bottom: 10px;
  align-items: center;
  justify-content: center;
  ${props => props.color && `border :1px solid ${props.color};`}
`;
// ${props => props.color && `background-color : ${props.color}`}

export const CategoryItem = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const NewCategory = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  position: absolute;
  bottom: 20px;
  right: 20px;
`;

export const AddNewCategoryIcon = styled(Ionicons)`
  margin-right: 3px;
`;
export const CategoryNameInput = styled(TextInput).attrs({
  activeOutlineColor: 'transparent',
  outlineColor: 'transparent',
  selectionColor: colors.brand.primary,
})`
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;
