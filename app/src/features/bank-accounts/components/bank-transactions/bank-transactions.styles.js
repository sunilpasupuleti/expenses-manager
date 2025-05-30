// bank-transactions.styles.js
import styled from 'styled-components/native';
import {Text as BaseText} from '../../../../components/typography/text.component';

export const TransactionCard = styled.View`
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 10px;
`;

export const SearchContainer = styled.View`
  width: 85%;
  margin-top: 10px;
  margin-bottom: 5px;
`;

export const SearchInput = styled.TextInput`
  border-bottom-width: 1px;
  border-color: ${props => props.theme.colors.brand.primary};
  padding-vertical: 6px;
  font-size: 16px;
  color: ${props => props.theme.colors.text.primary};
`;

export const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const TransactionTitle = styled(BaseText)`
  font-weight: bold;
  color: ${props => props.theme.colors.text.primary};
`;

export const TransactionSubText = styled(BaseText)`
  margin-top: 3px;
  font-size: 12px;
  color: #888;
`;

export const TransactionAmount = styled(BaseText)`
  margin-top: 5px;
  font-size: 16px;
  font-weight: 600;
`;

export const Logo = styled.Image`
  width: 35px;
  height: 35px;
  margin-right: 12px;
  border-radius: 8px;
`;
