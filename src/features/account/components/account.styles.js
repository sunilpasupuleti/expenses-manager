import React from 'react';
import {Button} from 'react-native-paper';
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

export const AccountCover = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.4);
`;

export const Title = styled(Text)`
  font-size: 30px;
`;

export const AccountContainer = styled.View`
  padding: ${props => props.theme.space[4]};
  margin-top: ${props => props.theme.space[2]};
  background-color: rgba(0, 0, 0, 0.03);
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
  height: 100%;
  width : 50px
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
