import React from 'react';
import {Animated} from 'react-native';
import {Switch} from 'react-native-paper';
import styled from 'styled-components/native';
import {Text} from '../components/typography/text.component';
import {colors} from '../infrastructure/theme/colors';
import {SafeArea} from './utility/safe-area.component';
export const MainWrapper = styled.View`
  flex: 1;
  padding: ${props => props.theme.space[3]};
`;

export const ButtonText = styled(Text).attrs({
  fontfamily: 'heading',
})`
  color: ${props =>
    props.disabled
      ? '#bbb'
      : props.color
      ? props.color
      : props.theme.colors.brand.primary};
`;

export const FlexRow = styled.View`
  flex-direction: row;
  align-items: center;
  ${props =>
    props.justifyContent && `justify-content : ${props.justifyContent}`}
`;

export const FlexColumn = styled.View`
  flex-direction: column;
  align-items: center;
`;

export const NotLoggedInContainer = styled(SafeArea)`
  align-items: center;
  justify-content: center;
`;

export const ToggleSwitch = styled(Switch).attrs({
  color: colors.brand.primary,
})``;

export const TouchableHighlightWithColor = styled.TouchableHighlight.attrs({
  underlayColor: colors.touchable.highlight,
})`
  ${props => (props.padding ? `padding : ${props.padding}` : 'padding : 15px')}

  ${props => props.gap && `margin-bottom : ${props.gap}px`}
`;

export const TopNavigationTitle = styled(Text)`
  text-align: center;
  padding-top: 15px;
`;

export const TopNavigationCloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 25px;
  right: 20px;
`;

export const Tabs = styled(FlexRow)`
  background-color: ${({theme}) => theme.colors.brand.secondary};
  border-radius: 10px;
`;

export const Tab = styled.TouchableOpacity`
  width: 50%;
`;

export const TabView = styled(Animated.View)`
  padding: 8px;
  border-radius: 10px;
  ${props => props.active && `background-color : #605fd7`}
`;

export const TabText = styled(Text).attrs({
  fontfamily: 'heading',
})`
  color: #fff;
  text-align: center;
`;

export const ErrorMessage = styled(Text)`
  color: red;
  text-align: center;
  margin-top: 10px;
  margin-bottom: 10px;
`;

export const SuccessMessage = styled(Text)`
  color: ${colors.brand.primary};
  text-align: center;
  margin-top: 10px;
  margin-bottom: 10px;
`;
