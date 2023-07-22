import styled from 'styled-components/native';
import {Text} from '../typography/text.component';

export const TransactionCategory = styled.View`
  width: 20px;
  height: 20px;
  border-radius: 50px;
  justify-content: center;
  align-items: center;
  ${props => props.color && `background-color : ${props.color};`}
`;

export const TransactionCategoryName = styled(Text).attrs({
  fontfamily: 'heading',
})`
  font-size: 17px;
`;
