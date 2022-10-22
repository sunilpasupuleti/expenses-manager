import Ionicons from 'react-native-vector-icons/Ionicons';
import styled from 'styled-components/native';
import {Text} from '../../../../components/typography/text.component';
import {colors} from '../../../../infrastructure/theme/colors';

export const SheetSummaryTotalBalance = styled.View`
  align-items: center;
  justify-content: center;
`;

export const InEx = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

export const InExIcon = styled.View`
  background-color: #fff;
  border-radius: 20px;
  margin-right : 13px
  padding:2px;
`;

export const InExAmount = styled.View`
  display: flex;
`;
