import Ionicons from 'react-native-vector-icons/Ionicons';
import React from 'react';
import styled from 'styled-components/native';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {colors} from '../../../infrastructure/theme/colors';

export const IconsContainer = styled.View`
  flex-direction: row;
  align-items : center
  justify-content: flex-end;
`;

export const UpperIcon = styled(Ionicons)`
  margin-left: 40px;
  margin-top: 20px;
`;

// flex-direction: row;
// align-items: center;
// position: absolute;
// bottom: 20px;
// right: 20px;
export const NewSheet = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  position: absolute;
  background-color: ${colors.brand.primary};
  bottom: 20px;
  border-radius: 100px;
  padding: 10px;
  right: 20px;
`;

export const AddSheetIcon = styled(Ionicons)`
  margin-right: 3px;
`;

export const SheetsList = styled.FlatList.attrs({
  contentContainerStyle: {},
})``;

export const NoSheets = styled(SafeArea)`
  align-items: center;
  justify-content: center;
`;
