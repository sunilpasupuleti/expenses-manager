import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import {Text} from '../../../../components/typography/text.component';
import {Button} from 'react-native-paper';

export const Container = styled(LinearGradient).attrs({
  colors: ['#8B5CF6', '#A855F7', '#9333EA'],
  start: {x: 0, y: 0},
  end: {x: 1, y: 1},
})`
  flex: 1;
`;

export const ScrollContainer = styled.ScrollView`
  flex: 1;
  padding: 20px;
  margin-bottom: 70px;
`;

export const SuccessCard = styled.View`
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  margin: 20px 0;
  shadow-color: #000;
  shadow-offset: 0px 5px;
  shadow-opacity: 0.15;
  shadow-radius: 10px;
  elevation: 8;
  align-items: center;
`;

export const LottieContainer = styled.View`
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
`;

export const Title = styled(Text)`
  font-size: 24px;
  text-align: center;
  font-weight: bold;
  margin-bottom: 25px;
  color: #1f2937;
`;

export const InstitutionHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
`;

export const InstitutionLogo = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  margin-right: 12px;
  resize-mode: contain;
`;

export const InstitutionTitle = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
`;

export const AccountSubtitle = styled(Text)`
  font-size: 16px;
  color: #6b7280;
  text-align: center;
  margin-bottom: 30px;
`;

export const BalanceSection = styled.View`
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  margin: 10px 20px;
  shadow-color: #000;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.1;
  shadow-radius: 6px;
  elevation: 4;
`;

export const SectionTitle = styled(Text)`
  font-size: 14px;
  color: ${({color}) => color || '#9ca3af'};
  margin-bottom: 8px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

export const BalanceText = styled(Text)`
  font-size: 28px;
  font-weight: bold;
  color: ${({color}) => color || '#1f2937'};
  text-align: left;
`;

export const BalanceRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const DoneButtonWrapper = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.95);
  padding: 20px;
  padding-bottom: ${({insets}) => (insets?.bottom ? insets.bottom + 20 : 30)}px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  shadow-color: #000;
  shadow-offset: 0px -2px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 8;
`;

export const DoneButton = styled.TouchableOpacity`
  background-color: #8b5cf6;
  border-radius: 15px;
  padding: 18px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  shadow-color: #8b5cf6;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 6;
`;

export const DoneButtonText = styled(Text)`
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin-left: 8px;
`;

export const BalanceIcon = styled.View`
  width: 45px;
  height: 45px;
  border-radius: 12px;
  background-color: ${({bgColor}) => bgColor || '#f3f4f6'};
  align-items: center;
  justify-content: center;
  margin-right: 15px;
`;

export const BalanceContent = styled.View`
  flex: 1;
`;

export const BackButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-left: 10px;
  margin-top: 10px;
  margin-bottom: 10px;
`;

export const BackButtonText = styled(Text)`
  color: white;
  font-size: 18px;
  margin-left: 8px;
`;
