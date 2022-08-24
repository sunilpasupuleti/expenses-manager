import React from 'react';
import {Button, TextInput} from 'react-native-paper';
import styled from 'styled-components/native';
import {Text} from '../../../components/typography/text.component';
import {colors} from '../../../infrastructure/theme/colors';

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
  flex: 1;
`;

export const AuthButton = styled(Button).attrs({})`
  padding: ${props => props.theme.space[2]};
  border-radius: 12px;
`;

export const GoogleButton = styled.TouchableOpacity`
  border-radius: 12px;
  background-color: #4185f4;
  border : 1px solid #4185f4
  flex-direction: row;
  display: flex;
  align-items: center;
  height: 45px;
`;

export const GoogleButtonImageWrapper = styled.View`
  background-color: #fff;
  padding: 3px;
  height: 110%;
  left: -1px;
  width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const GoogleButtonText = styled(Text)`
  color: #fff;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: 1.3px;
  margin-left: 15px;
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
    colors: {
      text: colors.brand.primary,
    },
  },
})`
  font-size: 20px;
  height: 60px;
  width: 45px;
  background-color: ${colors.brand.secondary};
  margin-left: 10px;
  margin-top: 20px;
  text-align: center;
`;
