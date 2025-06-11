import React from 'react';
import {Animated} from 'react-native';
import {Switch, TextInput} from 'react-native-paper';
import styled from 'styled-components/native';
import {Text} from '../components/typography/text.component';
import {colors} from '../infrastructure/theme/colors';
import {SafeArea} from './utility/safe-area.component';
import {SelectList} from 'react-native-dropdown-select-list';

export const SelectListInput = styled(SelectList).attrs(({theme}) => ({
  boxStyles: {
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: theme.colors.bg.input,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 5,
    shadowColor: 'transparent',
  },
  inputStyles: {
    color: theme.colors.text.primary,
    fontSize: 16,
    paddingLeft: 0,
  },
  dropdownStyles: {
    backgroundColor: theme.colors.bg.input,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: 4,
  },
  dropdownTextStyles: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
}))``;

export const MainWrapper = styled.View`
  flex: 1;
  background-color: ${props => props.theme.colors.bg.primary};
  padding: ${props => (props.disablePadding ? '0px' : props.theme.space[3])};
`;

export const Input = styled(TextInput).attrs(props => ({
  mode: 'outlined',
  outlineColor: '#ccc',
  activeOutlineColor: colors.brand.primary,
  selectionColor: colors.brand.primary,
  theme: {
    roundness: 15,
  },
  ...props.custom,
}))``;

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
  ${props => props.gap && `gap : ${props.gap}px;`}
  ${props =>
    props.justifyContent && `justify-content : ${props.justifyContent};`}
`;

export const FlexColumn = styled.View`
  flex-direction: column;
  align-items: center;
  ${props => props.gap && `gap : ${props.gap}px;`}
  ${props =>
    props.justifyContent && `justify-content : ${props.justifyContent};`};
`;

export const NotLoggedInContainer = styled(SafeArea)`
  align-items: center;
  justify-content: center;
`;

export const NotFoundContainer = styled(SafeArea)`
  align-items: center;
  justify-content: center;
`;

export const ToggleSwitch = styled(Switch).attrs({
  color: colors.brand.primary,
})``;

export const TouchableHighlightWithColor = styled.TouchableHighlight.attrs({
  underlayColor: colors.touchable.highlight,
})`
  ${props =>
    props.padding ? `padding : ${props.padding};` : 'padding : 15px;'}

  ${props => props.gap && `margin-bottom : ${props.gap}px;`}
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

export const TabWrapper = styled.View`
  flex-direction: row;
  background-color: #ddd;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

export const Indicator = styled(Animated.View)`
  position: absolute;
  top: 0;
  bottom: 0;
  background-color: #605fd7;
  border-radius: 10px;
`;

export const TabButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px 0;
  align-items: center;
  justify-content: center;
`;

export const TabLabel = styled(Text).attrs({
  fontfamily: 'heading',
})`
  color: ${({active}) => (active ? '#fff' : '#333')};
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
  padding-left: 10px;
`;
