import React from 'react';
import { Button, TextInput } from 'react-native-paper';
import styled from 'styled-components/native';
import { Text } from '../../../components/typography/text.component';
import { colors } from '../../../infrastructure/theme/colors';

export const AccountBackground = styled.ImageBackground.attrs({
  source: require('../../../../assets/expenses.jpg'),
})`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const Title = styled(Text)`
  font-size: 30px;
`;

export const AccountContainer = styled.ScrollView`
  padding: ${props => props.theme.space[4]};
  margin-top: 10px;
  flex: 1;
`;

export const AuthButton = styled.TouchableOpacity`
  border-radius: 20px;
  background-color: ${props =>
    props.color ? props.color : props.theme.colors.brand.primary};
  border: 1px solid
    ${props => (props.color ? props.color : props.theme.colors.brand.primary)};

  flex-direction: row;
  display: flex;
  align-items: center;
  height: 40px;
`;

export const AuthButtonImageWrapper = styled.View`
  background-color: #fff;
  padding: 0px;
  height: 105%;
  left: -1px;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const AuthButtonText = styled(Text)`
  color: #fff;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: 1.3px;
  margin-left: 25px;
`;

export const LoginInput = styled(TextInput).attrs({
  activeOutlineColor: 'transparent',
  outlineColor: 'transparent',
  selectionColor: colors.brand.primary,
})`
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

export const OtherLoginButtonsContainer = styled.View`
  margin-top: 30px;
`;

export const Hyperlink = styled(Text).attrs({
  fontfamily: 'heading',
})`
  color: #3a62b6;
  ${props => props.underline && 'text-decoration-line: underline;'}
  text-align: center;
`;

export const OtpStrips = styled.View`
  margin-top: 20px;
  flex-direction: row;
  justify-content: center;
  flex-wrap: wrap;
`;

export const OtpStripInput = styled(TextInput).attrs({
  mode: 'outlined',
  returnKeyType: 'done',
  placeholder: '-',
  keyboardType: 'phone-pad',
  maxLength: 1,
  placeholderTextColor: colors.brand.primary,
  outlineColor: colors.brand.primary,
  activeOutlineColor: colors.brand.primary,
  theme: {
    roundness: 10,
  },
})`
  font-size: 20px;
  width: 45px;
  margin-left: 10px;
  margin-top: 20px;
  text-align: center;
`;
