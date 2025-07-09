import styled from 'styled-components/native';
import {MotiView, MotiText} from 'moti';
import {Bubble, InputToolbar, Send} from 'react-native-gifted-chat';
import {Dimensions, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

// Main Container using LinearGradient with enhanced colors
export const Container = styled(LinearGradient).attrs({
  colors: ['#667eea', '#764ba2', '#667eea'],
  start: {x: 0, y: 0},
  end: {x: 1, y: 1},
})`
  flex: 1;
`;

// Header Components using LinearGradient with glassmorphism effect
export const Header = styled(LinearGradient).attrs({
  colors: ['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)'],
  start: {x: 0, y: 0},
  end: {x: 1, y: 1},
})`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${Platform.OS === 'ios'
    ? '60px 20px 35px 20px'
    : '60px 20px 35px 20px'};
  elevation: 8;
  backdrop-filter: blur(20px);
`;

export const HeaderTitle = styled.Text`
  font-size: 25px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 1px;
  font-family: ${Platform.OS === 'ios' ? 'System' : 'Roboto'};
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.3);
`;

export const OnlineIndicator = styled(MotiView)`
  width: 16px;
  height: 16px;
  margin-left: 10px;
  border-radius: 8px;
  background-color: ${props => (props.isOnline ? '#4CAF50' : '#FF5722')};
  shadow-color: ${props => (props.isOnline ? '#4CAF50' : '#FF5722')};
  shadow-offset: 0px 0px;
  shadow-opacity: 1;
  shadow-radius: 8px;
  elevation: 6;
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(20px);
`;

// Message Container with improved styling
export const MessageContainer = styled.View`
  flex: 1;
  background-color: rgba(255, 255, 255, 0.6);
  border-top-left-radius: 35px;
  border-top-right-radius: 35px;
  margin-top: -25px;
  padding-top: 30px;
  overflow: hidden;
  elevation: 12;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
`;

// Animated Message Wrapper
export const AnimatedMessageWrapper = styled(MotiView)`
  margin-vertical: 2px;
`;

// Custom Bubble Styles
export const CustomBubble = styled(Bubble).attrs(props => ({
  wrapperStyle: {
    right: {
      backgroundColor: '#667eea',
      borderRadius: 20,
      borderBottomRightRadius: 5,
      marginRight: 8,
      marginBottom: 8,
    },
    left: {
      backgroundColor: '#ffffff',
      borderRadius: 20,
      borderBottomLeftRadius: 5,
      marginLeft: 8,
      marginBottom: 8,
      elevation: 2,
    },
  },
  textStyle: {
    right: {
      color: '#ffffff',
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '400',
    },
    left: {
      color: '#333333',
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '400',
    },
  },
}))``;

// Input Toolbar
export const CustomInputToolbar = styled(InputToolbar).attrs({
  containerStyle: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    elevation: 4,
  },
  primaryStyle: {
    alignItems: 'center',
  },
})``;

// Send Button
export const CustomSend = styled(Send).attrs({
  containerStyle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginBottom: 15,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
})``;

// Enhanced Typing Indicator
export const TypingIndicator = styled(MotiView)`
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
  margin-left: 12px;
  margin-bottom: 8px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  border-bottom-left-radius: 8px;
  max-width: 120px;
  elevation: 4;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 4px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(102, 126, 234, 0.1);
`;

export const TypingDots = styled(MotiView)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 50px;
`;

export const TypingDot = styled(MotiView)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #667eea;
  margin-horizontal: 2px;
`;

// Floating Action Button
// Floating Action Button using LinearGradient
export const FloatingActionButton = styled(LinearGradient).attrs({
  colors: ['#667eea', '#764ba2'],
  start: {x: 0, y: 0},
  end: {x: 1, y: 1},
})`
  position: absolute;
  bottom: 100px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  align-items: center;
  justify-content: center;
  elevation: 8;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 4.65px;
`;

// Background Particles
export const ParticleContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
`;

export const Particle = styled(MotiView)`
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  opacity: 0.3;
`;

// Enhanced Message Input with modern styling
export const MessageInput = styled.TextInput.attrs({
  placeholderTextColor: '#9ca3af',
  multiline: true,
  textAlignVertical: 'center',
})`
  flex: 1;
  background-color: rgba(248, 249, 250, 0.9);
  border-radius: 24px;
  padding: 12px 20px;
  margin-horizontal: 8px;
  font-size: 16px;
  color: #1f2937;
  max-height: 120px;
  min-height: 44px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  backdrop-filter: blur(10px);
`;

// Avatar with enhanced styling
export const AvatarContainer = styled(MotiView)`
  position: relative;
  margin-horizontal: 8px;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  elevation: 4;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 4px;
  overflow: hidden;
`;

export const AvatarGradient = styled(LinearGradient).attrs({
  colors: ['#667eea', '#764ba2'],
  start: {x: 0, y: 0},
  end: {x: 1, y: 1},
})`
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
`;

// Message status with modern design
export const MessageStatus = styled(MotiView)`
  position: absolute;
  bottom: 8px;
  right: 12px;
  width: 20px;
  height: 12px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const MessageStatusDot = styled(MotiView)`
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background-color: ${props =>
    props.status === 'sent'
      ? '#4CAF50'
      : props.status === 'delivered'
      ? '#2196F3'
      : props.status === 'read'
      ? '#FF9800'
      : '#9E9E9E'};
`;

// Enhanced Day separator
export const DayContainer = styled(MotiView)`
  align-items: center;
  margin-vertical: 16px;
`;

export const DayText = styled.Text`
  background-color: rgba(255, 255, 255, 0.9);
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 16px;
  overflow: hidden;
  text-align: center;
  backdrop-filter: blur(10px);
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
`;

// Connection indicator
export const ConnectionIndicator = styled(MotiView)`
  position: absolute;
  top: ${Platform.OS === 'ios' ? '100px' : '70px'};
  left: 20px;
  right: 20px;
  background-color: ${props =>
    props.connected ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
  border-radius: 12px;
  padding: 12px 16px;
  z-index: 1000;
  elevation: 8;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  backdrop-filter: blur(20px);
`;

export const ConnectionText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
`;

// Quick Reply Container
export const QuickReplyContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border-top-width: 1px;
  border-top-color: #e0e0e0;
`;

export const QuickReplyButton = styled.TouchableOpacity`
  background-color: #ffffff;
  border: 1px solid #667eea;
  border-radius: 20px;
  padding: 8px 16px;
  margin: 4px;
  elevation: 1;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.15;
  shadow-radius: 1.5px;
`;

export const QuickReplyText = styled.Text`
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
`;

// System Message Container
export const SystemMessageContainer = styled.View`
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 8px 16px;
  margin: 8px 20px;
  align-items: center;
  backdrop-filter: blur(10px);
  elevation: 1;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
`;

export const SystemMessageText = styled.Text`
  color: #666666;
  font-size: 12px;
  font-weight: 400;
  text-align: center;
`;

// Loading Animation Container
export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
`;

export const LoadingText = styled.Text`
  color: #667eea;
  font-size: 16px;
  font-weight: 500;
  margin-top: 16px;
`;

// Error Container
export const ErrorContainer = styled.View`
  background-color: #ffebee;
  border-left-width: 4px;
  border-left-color: #f44336;
  padding: 16px;
  margin: 8px 16px;
  border-radius: 8px;
`;

export const ErrorText = styled.Text`
  color: #c62828;
  font-size: 14px;
  font-weight: 500;
`;

// Voice Message Button
export const VoiceMessageButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${props => (props.isRecording ? '#f44336' : '#667eea')};
  align-items: center;
  justify-content: center;
  margin-horizontal: 8px;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.22;
  shadow-radius: 2.22px;
`;

// Attachment Button
export const AttachmentButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #f0f0f0;
  align-items: center;
  justify-content: center;
  margin-horizontal: 4px;
  elevation: 1;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.18;
  shadow-radius: 1.5px;
`;

// Message Reactions Container
export const MessageReactionsContainer = styled.View`
  flex-direction: row;
  position: absolute;
  bottom: -12px;
  right: 16px;
  background-color: #ffffff;
  border-radius: 20px;
  padding: 4px 8px;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.22;
  shadow-radius: 2.22px;
`;

export const MessageReaction = styled.Text`
  font-size: 12px;
  margin-horizontal: 2px;
`;

// Chat Header Actions
export const ChatHeaderActions = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const ChatHeaderAction = styled.TouchableOpacity`
  padding: 8px;
  margin-left: 8px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
`;

// Connection Status Banner
export const ConnectionStatusBanner = styled(MotiView)`
  position: absolute;
  top: ${Platform.OS === 'ios' ? 60 : 20}px;
  left: 20px;
  right: 20px;
  background-color: ${props => (props.isConnected ? '#4CAF50' : '#FF5722')};
  border-radius: 8px;
  padding: 8px 16px;
  z-index: 1000;
  elevation: 5;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 3.84px;
`;

export const ConnectionStatusText = styled.Text`
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
`;
