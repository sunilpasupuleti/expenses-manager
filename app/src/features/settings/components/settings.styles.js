import React from 'react';
import {Card} from 'react-native-paper';
import styled from 'styled-components/native';
import {FlexRow} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {colors} from '../../../infrastructure/theme/colors';
import {Platform} from 'react-native';
export const Setting = styled(FlexRow)`
  ${props => props.gap && `margin-bottom : 25px`}
`;

export const SettingIconWrapper = styled.View`
  padding: 7px;
  border-radius: 10px;
  background-color: ${props => props.color};
`;

export const SettingTitle = styled(Text).attrs({})`
  margin-left: 12px;
`;

export const SettingsCard = styled(Card).attrs({
  theme: {
    roundness: Platform.OS === 'ios' ? 5 : 15,
  },
})``;

export const SettingsCardContent = styled.TouchableHighlight.attrs({
  underlayColor: colors.touchable.highlight,
})`
  ${props =>
    props.padding ? `padding : ${props.padding};` : 'padding : 15px;'}

  ${props => props.gap && `margin-bottom : ${props.gap}px;`}
`;

export const ProfileWrapper = styled.View`
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

export const ProfilePicture = styled.Image`
  height: 150px;
  width: 150px;
  border-radius: 100px;
`;

export const ProfileText = styled(Text)`
  padding: 10px;
`;

export const SettingHint = styled(Text).attrs({
  fontfamily: 'heading',
})`
  font-size: 12px;
  ${props =>
    props.marginLeft
      ? `margin-left : ${props.marginLeft};`
      : 'margin-left : 12px;'}
  padding-bottom: 10px;
  color: #aaa;
`;
