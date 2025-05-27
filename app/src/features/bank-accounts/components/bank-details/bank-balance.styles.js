import styled from 'styled-components/native';
import {Text} from '../../../../components/typography/text.component';
import {Button} from 'react-native-paper';

export const Title = styled(Text).attrs({})`
  font-size: 23px;
  text-align: center;
  font-weight: bold;
  margin-bottom: 25px;
  color: ${({theme}) => theme.colors.text.primary};
`;

export const InstitutionTitle = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: ${({theme}) => theme.colors.text.primary};
  margin-left: 5px;
`;

export const Subtitle = styled(Text)`
  font-size: 15px;
  color: ${({theme}) => theme.colors.text.secondary};
`;

export const BalanceText = styled(Text)`
  font-size: 22px;
  font-weight: 600;
`;

export const SectionTitle = styled(Text)`
  font-size: 14px;
  color: ${({color}) => color || '#aaa'};
`;

export const InstitutionLogo = styled.Image`
  width: 45px;
  height: 45px;
  margin-left: 10px;
  resize-mode: contain;
`;

export const DoneButtonWrapper = styled.View`
  position: absolute;
  bottom: ${({insets}) => insets.bottom - 20}px;
  left: 20px;
  right: 20px;
`;

export const DoneButton = styled(Button).attrs(({theme}) => ({
  mode: 'elevated',
  buttonColor: theme.colors.brand.primary,
  textColor: '#fff',
}))`
  border-radius: 10px;
  padding-vertical: 8px;
`;
