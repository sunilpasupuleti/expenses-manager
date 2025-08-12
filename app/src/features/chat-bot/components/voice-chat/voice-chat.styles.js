import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { Platform, Dimensions } from 'react-native';
import Animated from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const isIos = Platform.OS === 'ios' ? true : false;

export const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`;

export const Header = styled(LinearGradient).attrs({
  colors: ['#667eea', '#764ba2'],
})`
  border-bottom-left-radius: 25px;
  border-bottom-right-radius: 25px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  elevation: 10;
`;
export const HeaderView = styled.View`
  padding-top: ${Platform.OS === 'ios' ? '60px' : '40px'};
  padding-bottom: 30px;
  padding-horizontal: 20px;

  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const HeaderTitle = styled.Text`
  font-size: 32px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
`;

export const HeaderSubtitle = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 5px;
  font-weight: 400;
`;

export const ConversationArea = styled.ScrollView`
  flex: 1;
  background-color: #f8f9fa;
`;

export const ConversationContent = styled.View`
  padding-horizontal: 20px;
  padding-vertical: 20px;
  min-height: ${height * 0.3}px;
`;

export const WelcomeContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding-vertical: 10px;
  padding-horizontal: 20px;
`;

export const WelcomeIcon = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: rgba(102, 126, 234, 0.1);
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

export const WelcomeTitle = styled.Text`
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 16px;
  text-align: center;
`;

export const WelcomeText = styled.Text`
  font-size: 16px;
  color: #7f8c8d;
  text-align: center;
  line-height: 24px;
  margin-bottom: 32px;
  padding-horizontal: 10px;
`;

export const ExampleContainer = styled.View`
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  elevation: ${isIos ? 5 : 0};
`;

export const ExampleTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  text-align: center;
`;

export const ExampleText = styled.Text`
  font-size: 14px;
  color: #667eea;
  background-color: rgba(102, 126, 234, 0.08);
  padding-vertical: 8px;
  padding-horizontal: 12px;
  border-radius: 8px;
  margin-vertical: 4px;
  font-style: italic;
  text-align: center;
`;

export const ConversationItem = styled.View`
  margin-bottom: 24px;
`;

export const UserMessage = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: white;
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 12px;
  margin-left: 40px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 6px;
  elevation: ${isIos ? 3 : 0};
`;

export const UserText = styled.Text`
  flex: 1;
  font-size: 15px;
  color: #2c3e50;
  margin-left: 10px;
  font-weight: 500;
`;

export const Timestamp = styled.Text`
  font-size: 11px;
  color: #95a5a6;
  margin-left: 8px;
`;

export const AIMessage = styled.View`
  flex-direction: row;
  align-items: flex-start;
  margin-right: 40px;
`;

export const AuraIcon = styled.View`
  margin-right: 12px;
  margin-top: 2px;
`;

export const AuraIconGradient = styled(LinearGradient).attrs({
  colors: ['#667eea', '#764ba2'],
})`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  align-items: center;
  justify-content: center;
  shadow-color: #667eea;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: ${isIos ? 5 : 0};
`;

export const AuraIconText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: white;
`;

export const AITextContainer = styled.View`
  flex: 1;
  background-color: white;
  padding: 16px;
  border-radius: 16px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: ${isIos ? 4 : 0};
`;

export const AIText = styled.Text`
  font-size: 15px;
  color: #2c3e50;
  line-height: 22px;
  font-weight: 400;
`;

export const OperationTag = styled.View`
  background-color: rgba(102, 126, 234, 0.1);
  padding-horizontal: 8px;
  padding-vertical: 4px;
  border-radius: 8px;
  align-self: flex-start;
`;

export const OperationText = styled.Text`
  font-size: 11px;
  color: #667eea;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const VoiceInputArea = styled.View`
  background-color: white;
  padding-vertical: 30px;
  padding-horizontal: 20px;
  border-top-left-radius: 25px;
  border-top-right-radius: 25px;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.1;
  shadow-radius: 12px;
  elevation: 15;
  min-height: 160px;
  justify-content: center;
`;

export const StatusContainer = styled.View`
  margin-bottom: 20px;
  align-items: center;
`;

export const RecordingStatus = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 71, 87, 0.1);
  padding-horizontal: 16px;
  padding-vertical: 8px;
  border-radius: 20px;
  max-width: ${width - 40}px;
`;

export const RecordingText = styled.Text`
  font-size: 14px;
  color: #ff4757;
  font-weight: 600;
  margin-left: 8px;
`;

export const ProcessingStatus = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(102, 126, 234, 0.1);
  padding-horizontal: 16px;
  padding-vertical: 8px;
  border-radius: 20px;
`;

export const ProcessingText = styled.Text`
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
  margin-left: 8px;
`;

export const MicrophoneContainer = styled.View`
  align-items: center;
  justify-content: center;
  position: relative;
`;

export const PulseRing = styled.View`
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: rgba(102, 126, 234, 0.3);
`;

export const MicrophoneButton = styled.TouchableOpacity`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  shadow-color: #667eea;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
  elevation: 10;
  margin-bottom: 10px;
`;

export const MicrophoneGradient = styled(LinearGradient)`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  align-items: center;
  justify-content: center;
`;

export const InstructionText = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 16px;
  font-weight: 500;
  text-align: center;
  max-width: ${width - 40}px;
`;

export const SiriEdgeAnimation = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-width: 7px;
  border-radius: ${Math.min(width, height) * 0.13}px;
  pointer-events: none;
  z-index: 1000;
`;
