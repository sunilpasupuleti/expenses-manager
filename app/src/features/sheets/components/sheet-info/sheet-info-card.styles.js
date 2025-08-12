import React from 'react';
import styled from 'styled-components/native';
import { Text } from '../../../../components/typography/text.component';
import { Platform } from 'react-native';
export const SheetName = styled(Text)`
  ${props => props.archived && `color : #aaa;`}
`;

const isIos = Platform.OS === 'ios';

export const BorderLine = styled.View`
  border-bottom-color: #ccc;
  border-bottom-width: 0.7px;
  border-radius: 10px;
`;

export const TotalBalance = styled(Text).attrs({
  fontfamily: 'headingBold',
  // font-family: ${props => props.theme.fonts.bodyBold};
})`
  ${props => (props.archived ? `color : #aaa;` : ` color: #ccc;`)}
  letter-spacing: 1px;
  font-size: 13px;
`;

export const AvailableBalance = styled(Text).attrs({
  fontfamily: 'headingBold',
  // font-family: ${props => props.theme.fonts.bodyBold};
})`
  color: #8a8a8d;
  letter-spacing: 1px;
  font-size: 13px;
`;

export const UpdatedTime = styled(Text).attrs({
  fontfamily: 'heading',
  fontsize: '13px',
})`
  ${props => (props.archived ? `color : #aaa;` : ` color: #8a8a8d;`)}
`;

export const TransactionsCount = styled(Text).attrs({
  fontfamily: 'heading',
  fontsize: '13px',
})`
  margin-left: 8px;
  ${props => (props.archived ? `color : #aaa;` : ` color: #8a8a8d;`)}
`;

export const SwipeableView = styled.View`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 75px;
  height: 100%;
  padding: 5px;
`;

export const SwipeTouchableView = styled.TouchableOpacity`
  flex: 1;
  justify-content: center;
  padding-left: 20;
`;

export const SheetInfoWrapper = styled.View`
  max-width: 60%;
  margin: 16px 0px 16px 16px;
`;

export const SummaryRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
`;

export const ValueBox = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.bg.listSubCard};
  padding: 8px 6px;
  margin: 0 4px;
  border-radius: 8px;
  elevation: ${isIos ? 1 : 0};
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 2px;
  shadow-offset: 0px 1px;
`;

export const ValueBoxRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 2px;
`;

export const AvlBalanceRow = styled.View`
  background-color: ${({ theme }) => theme.colors.bg.listSubCard};
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 4px;
  margin-top: 7px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  elevation: ${isIos ? 1 : 0};
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 2px;
  shadow-offset: 0px 1px;
`;
