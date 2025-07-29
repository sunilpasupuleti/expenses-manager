import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import {Text as BaseText} from '../../../../components/typography/text.component';

export const Container = styled(LinearGradient).attrs({
  colors: ['#8B5CF6', '#A855F7', '#9333EA'],
  start: {x: 0, y: 0},
  end: {x: 1, y: 1},
})`
  flex: 1;
`;

export const Header = styled.View`
  padding: 10px 20px 5px 20px;
`;

export const InstitutionHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 10px;
`;

export const InstitutionInfo = styled.View`
  flex: 1;
  align-items: flex-end;
`;

export const InstitutionName = styled(BaseText)`
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-align: right;
  margin-bottom: 2px;
`;

export const AccountDetails = styled(BaseText)`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
`;

export const InstitutionLogo = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  margin-left: 10px;
  background-color: rgba(255, 255, 255, 0.1);
`;

export const ControlsCard = styled.View`
  margin: 0 20px 15px 20px;
  padding: 0;
`;

export const SearchContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;

export const SearchInput = styled.TextInput`
  flex: 1;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 25px;
  padding: 15px 20px;
  font-size: 16px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

export const FilterButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 15px;
  margin-left: 12px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

export const RefreshButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 10px 20px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  align-self: flex-end;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

export const RefreshButtonText = styled(BaseText)`
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-left: 6px;
`;

export const DateRangeText = styled(BaseText)`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-top: 5px;
`;

export const TransactionCard = styled.View`
  background-color: transparent;
  padding: 16px 20px;
  margin: 0;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.1);
`;

export const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const TransactionLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

export const TransactionRight = styled.View`
  align-items: flex-end;
`;

export const Logo = styled.Image`
  width: 28px;
  height: 28px;
  margin-right: 12px;
  border-radius: 6px;
`;

export const TransactionInfo = styled.View`
  flex: 1;
  margin-right: 10px;
`;

export const TransactionTitle = styled(BaseText)`
  font-weight: 600;
  color: white;
  font-size: 15px;
`;

export const TransactionSubText = styled(BaseText)`
  margin-top: 3px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

export const TransactionAmount = styled(BaseText)`
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.color || 'white'};
`;

export const SectionHeader = styled.View`
  background-color: rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.1);
`;

export const SectionTitle = styled(BaseText)`
  font-weight: bold;
  color: white;
  font-size: 14px;
`;

export const SectionBalance = styled(BaseText)`
  font-weight: bold;
  font-size: 14px;
  color: ${props => props.color || 'white'};
`;

export const EmptyStateContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

export const EmptyStateImage = styled.Image`
  width: 150px;
  height: 150px;
  resize-mode: contain;
  margin-bottom: 15px;
`;

export const EmptyStateText = styled(BaseText)`
  font-size: 16px;
  color: white;
  text-align: center;
`;

export const LoadingFooter = styled.View`
  padding: 10px;
  align-items: center;
`;

export const LoadingText = styled(BaseText)`
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
`;

export const PendingBadge = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`;

export const PendingText = styled(BaseText)`
  font-size: 10px;
  color: #ffd700;
  margin-left: 4px;
  font-weight: 600;
`;

export const BackButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-left: 10px;
  margin-top: 5px;
  margin-bottom: 5px;
`;

export const BackButtonText = styled(BaseText)`
  color: white;
  font-size: 16px;
  margin-left: 8px;
`;
