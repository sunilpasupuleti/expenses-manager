import React from 'react';
import styled from 'styled-components/native';
import {Text} from '../../../components/typography/text.component';
export const SheetName = styled(Text)`
  ${props => props.archived && `color : #aaa`}
`;

export const BorderLine = styled.View`
  border-bottom-color: #ccc;
  border-bottom-width: 0.5px;
`;

export const TotalBalance = styled(Text).attrs({
  fontfamily: 'headingBold',
  // font-family: ${props => props.theme.fonts.bodyBold};
})`
  ${props => (props.archived ? `color : #aaa` : ` color: #7a8a8d`)}
  letter-spacing: 1px;
  font-size: 13px;
`;

export const UpdatedTime = styled(Text).attrs({
  fontfamily: 'heading',
  fontsize: '13px',
})`
  ${props => props.showTotalBalance && `margin-left : 20px`};
  ${props => (props.archived ? `color : #aaa` : ` color: #8a8a8d`)}
`;

export const SwipeableView = styled.View`
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 100%;
  padding: 5px;
`;

export const SheetInfoWrapper = styled.View`
  max-width: 80%;
  margin: 16px 0px 16px 16px;
`;