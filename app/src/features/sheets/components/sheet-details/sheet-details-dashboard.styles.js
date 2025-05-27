import Ionicons from 'react-native-vector-icons/Ionicons';
import styled from 'styled-components/native';
import {Text} from '../../../../components/typography/text.component';
import {colors} from '../../../../infrastructure/theme/colors';
import * as Progress from 'react-native-progress';
import {Dimensions} from 'react-native';
const screenWidth = Dimensions.get('window').width;
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
  margin-right: 13px;
  padding: 2px;
`;

export const InExAmount = styled.View`
  display: flex;
`;

export const LoanProgressContainer = styled.View`
  margin-top: 20px;
  align-items: center;
  width: 100%;
`;

export const LoanProgressLabel = styled(Text)`
  font-size: 14px;
  margin-bottom: 8px;
`;

export const LoanProgressBar = styled(Progress.Bar).attrs(props => ({
  height: 15,
  width: screenWidth - 40,
  borderRadius: 5,
  borderWidth: 0,
  animated: true,
  color: props.theme.colors.text.success,
  unfilledColor: '#ddd',
}))``;
