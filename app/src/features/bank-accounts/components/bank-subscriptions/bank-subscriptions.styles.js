import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import {MotiView, MotiText} from 'moti';
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
  font-size: 36px;
  font-weight: 800;
  color: white;
  line-height: 42px;
  margin-bottom: 0px;
`;

export const StatsCard = styled.View`
  background-color: rgba(139, 92, 246, 0.4);
  border-radius: 20px;
  padding: 24px;
  margin: 0 20px 30px 20px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-radius: 8px;
  elevation: ${Platform.OS === 'android' ? 0 : 4};
  shadow-opacity: ${Platform.OS === 'android' ? 0.2 : 0.2};
`;

export const StatsIcon = styled.View`
  margin-right: 20px;
  position: relative;
`;

export const StatsContent = styled.View`
  flex: 1;
`;

export const StatsText = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`;

export const StatsSubtext = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
`;

export const SubscriptionCard = styled.View`
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

export const LogoContainer = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  overflow: hidden;
  margin-right: 16px;
`;

export const Logo = styled.Image`
  width: 100%;
  height: 100%;
  border-radius: 12px;
`;

export const SubscriptionInfo = styled.View`
  flex: 1;
`;

export const ServiceName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
`;

export const ServiceDetails = styled.Text`
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
`;

export const CancelButton = styled(MotiView)`
  background-color: #8b5cf6;
  padding: 12px 20px;
  border-radius: 25px;
  shadow-color: #8b5cf6;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`;

export const CancelButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: white;
`;

// Additional components for enhanced animations
export const FloatingElement = styled(MotiView)`
  position: absolute;
`;

export const SparkleIcon = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
`;

// Backdrop for modals/overlays
export const Backdrop = styled(MotiView)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

export const ModalCard = styled(MotiView)`
  background-color: white;
  border-radius: 20px;
  padding: 24px;
  margin: 20px;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 16px;
  elevation: 8;
`;

export const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 8px;
`;

export const ModalMessage = styled.Text`
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
  line-height: 22px;
  margin-bottom: 24px;
`;

export const ModalButtonContainer = styled.View`
  flex-direction: row;
  gap: 12px;
`;

export const ModalButton = styled(MotiView)`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  align-items: center;
`;

export const ModalButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
`;

// Loading states
export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const LoadingText = styled.Text`
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 16px;
`;

// Success states
export const SuccessIcon = styled(MotiView)`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #10b981;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

export const SuccessText = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 8px;
`;

export const SuccessSubtext = styled.Text`
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 22px;
`;

export const TabsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  margin: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  padding: 6px;
`;

export const TabButton = styled.TouchableOpacity`
  flex: 1;
  padding-vertical: 10px;
  border-radius: 20px;
  align-items: center;
`;

export const TabButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: ${({active}) => (active ? '#8B5CF6' : '#fff')};
  text-align: center;
  padding: 5px;
`;
export const SubscriptionDetailText = styled.Text`
  color: #666;
  font-size: 13px;
  margin-top: 2px;
`;

export const SubscriptionAmountText = styled.Text`
  color: #444;
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
`;
export const FlexRowBetween = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const Chip = styled.View`
  background-color: #f1f5f9;
  border-radius: 12px;
  padding: 4px 10px;
  margin-right: 8px;
`;

export const ChipText = styled.Text`
  font-size: 12px;
  color: #334155;
`;

export const InstitutionContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 6px;
`;

export const InstitutionLogoImage = styled.Image`
  width: 20px;
  height: 20px;
  border-radius: 4px;
`;

export const InstitutionNameText = styled.Text`
  font-size: 12px;
  color: #64748b;
  margin-left: 6px;
`;
