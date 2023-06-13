import {Card, TextInput} from 'react-native-paper';
import styled from 'styled-components/native';
import {Switch} from 'react-native-paper';
import React from 'react';
import {colors} from '../../../../infrastructure/theme/colors';
export const TopNavigationContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const SheetNameInput = styled(TextInput).attrs({
  activeOutlineColor: 'transparent',
  outlineColor: 'transparent',
  selectionColor: colors.brand.primary,
})`
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

export const AdvancedSettingsContainer = styled.View`
  margin: 50px 0px 0px 0px;
`;

export const AdvancedSettings = styled(Card).attrs({})`
  margin-top: 10px;
`;
