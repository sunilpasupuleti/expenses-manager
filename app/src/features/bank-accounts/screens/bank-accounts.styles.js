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
`;

export const Title = styled.Text`
  font-size: 27px;
  font-weight: bold;
  color: white;
`;

export const StyledFlatList = styled.FlatList`
  padding: 10px 20px;
`;

export const InstitutionCard = styled.TouchableOpacity`
  background-color: white;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  padding: 15px;
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

export const InstitutionLogo = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  margin-right: 12px;
`;

export const InstitutionInfo = styled.View`
  flex: 1;
`;

export const InstitutionName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

export const InstitutionAccounts = styled.Text`
  font-size: 13px;
  color: #6b7280;
`;

export const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
`;

export const EmptyImage = styled.Image`
  width: 150px;
  height: 150px;
  margin-bottom: 20px;
`;

export const EmptyTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  margin-bottom: 8px;
`;

export const EmptySubtext = styled.Text`
  font-size: 14px;
  color: #444;
  text-align: center;
  margin-bottom: 20px;
`;

export const RefreshButton = styled.TouchableOpacity`
  background-color: #4f46e5;
  padding: 12px 30px;
  border-radius: 25px;
  align-items: center;
`;

export const RefreshButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;
