import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import {Platform} from 'react-native';

export const Container = styled(LinearGradient).attrs({
  colors: ['#8B5CF6', '#A855F7', '#9333EA'],
  start: {x: 0, y: 0},
  end: {x: 1, y: 1},
})`
  flex: 1;
`;

export const Header = styled.View`
  padding: 20px;
  padding-bottom: 10px;
`;

export const Title = styled.Text`
  font-size: 27px;
  font-weight: bold;
  color: white;
`;

export const InstitutionHeader = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 20px;
  padding-top: 10px;
`;

export const InstitutionLogo = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.1);
`;

export const InstitutionInfo = styled.View`
  flex: 1;
  align-items: flex-end;
`;

export const InstitutionName = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: white;
  margin-bottom: 4px;
`;

export const InstitutionAccounts = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
`;

export const AccountCard = styled.TouchableOpacity`
  background-color: white;
  border-radius: 16px;
  margin: 8px 20px;
  shadow-color: #000;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.15;
  shadow-radius: 6px;
  elevation: 5;
  overflow: hidden;
`;

export const AccountContent = styled.View`
  padding: 20px;
`;

export const AccountHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 15px;
`;

export const AccountIcon = styled.Image`
  width: 40px;
  height: 40px;
  margin-right: 15px;
  border-radius: 8px;
`;

export const AccountInfo = styled.View`
  flex: 1;
`;

export const AccountName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
`;

export const AccountType = styled.Text`
  font-size: 13px;
  color: #6b7280;
  text-transform: capitalize;
`;

export const AccountMask = styled.Text`
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
`;

export const ActionButtonsContainer = styled.View`
  flex-direction: row;
  gap: 10px;
  margin-top: 15px;
`;

export const ActionButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${props => (props.primary ? '#4CAF50' : 'transparent')};
  border: 1px solid ${props => (props.primary ? '#4CAF50' : '#8B5CF6')};
  border-radius: 12px;
  padding: 12px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

export const ActionButtonText = styled.Text`
  color: ${props => (props.primary ? 'white' : '#8B5CF6')};
  font-weight: 600;
  font-size: 14px;
  margin-left: 6px;
`;

export const StickyButtonContainer = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  padding: 15px 20px;
  padding-bottom: ${props =>
    props.insets?.bottom ? props.insets.bottom + 15 : 25}px;
  flex-direction: row;
  gap: 10px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  shadow-color: #000;
  shadow-offset: 0px -2px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 8;
`;

export const BottomButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${props => (props.danger ? '#ef4444' : '#8B5CF6')};
  border-radius: 12px;
  padding: 15px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  margin: 0 5px;
`;

export const BottomButtonText = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 16px;
  margin-left: 8px;
`;

export const ScrollContainer = styled.ScrollView`
  flex: 1;
  padding-bottom: 100px;
`;

export const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
`;

export const EmptyStateText = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
`;
