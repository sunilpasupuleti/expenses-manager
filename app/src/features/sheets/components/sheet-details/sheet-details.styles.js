import React from 'react';
import {ActivityIndicator, TextInput} from 'react-native-paper';
import styled from 'styled-components/native';
import {Text} from '../../../../components/typography/text.component';
import {colors} from '../../../../infrastructure/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const SheetDetailsTotalBalance = styled(Text)`
  margin-top: 20px;
  text-align: center;
`;

export const SheetDetailsUnderline = styled.View`
  border-bottom-color: ${({theme}) => theme.colors.brand.primary};
  border-bottom-width: 5px;
  width: 50px;
  align-self: center;
`;

export const SheetDetailInput = styled(TextInput).attrs({
  activeOutlineColor: 'transparent',
  outlineColor: 'transparent',
  selectionColor: colors.brand.primary,
})`
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

export const SheetDetailDate = styled(Text).attrs({
  fontfamily: 'bodyBold',
})`
  font-size: 20px;
  color: ${({theme}) => theme.colors.brand.primary};
`;

export const SheetDetailDateAmount = styled.View`
  color: ${({theme}) => theme.colors.brand.primary};
  background-color: ${({theme}) => theme.colors.brand.secondary};
  padding: 2px 10px 2px 10px;
  border-radius: 6px;
`;

export const SheetDetailCategory = styled(Text).attrs({
  fontfamily: 'heading',
})`
  font-size: 17px;
`;

export const SheetDetailAmount = styled(Text).attrs({
  fontfamily: 'headingSemiBold',
})`
  font-size: 17px;
  padding: 0px 16px 0px 16px;
  ${props => props.type && props.type === 'income' && `color : #42cb66;`}
`;

export const SheetDetailCategoryColor = styled.View`
  position: absolute;
  left: 0px;
  height: 100%;
  width: 5px;
  border-radius: 10px;
  ${props => props.color && `background-color : ${props.color};`}
`;

export const SheetDetailNotes = styled(Text).attrs({
  fontfamily: 'heading',
  fontsize: '13px',
})`
  color: #8a8a8d;
  margin-top: 2px;
`;

export const SheetDetailInfo = styled.View`
  margin-left: 15px;
`;

export const BottomIconsContainer = styled.View`
  position: absolute;
  width: 100%;
  bottom: 0%;
  background-color: ${({theme}) => theme.colors.bg.primary};
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px;
`;

export const SheetDetailsAddIcon = styled.View`
  background-color: ${({theme}) => theme.colors.brand.primary};
  border-radius: 50px;
  padding: 12px;
`;

export const CameraButton = styled.TouchableOpacity`
  background-color: ${colors.brand.primary};
  border-radius: 50px;
  top: 4px;
  padding: 12px;
`;

export const CameraIcon = styled(Ionicons)`
  margin-right: 3px;
`;

export const SheetDetailAvatarWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

export const SheetDetailAvatarActivityIndicator = styled(ActivityIndicator)`
  position: absolute;
`;

export const SheetDetailImageWrapper = styled.View`
  height: 400px;
  align-items: center;
  justify-content: center;
`;

export const SheetDetailImageActivityIndicator = styled(ActivityIndicator)`
  position: absolute;
`;

export const SheetDetailImage = styled.Image`
  height: 100%;
  width: 100%;
  object-fit: contain;
`;
