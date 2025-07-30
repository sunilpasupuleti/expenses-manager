/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useContext } from 'react';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AVLinearPCMBitDepthKeyIOSType,
} from 'react-native-audio-recorder-player';
import {
  Alert,
  Platform,
  Vibration,
  StatusBar,
  View,
  TouchableOpacity,
  Text,
  Image,
  Linking,
} from 'react-native';
import { MotiView, MotiText } from 'moti';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import {
  Container,
  Header,
  HeaderTitle,
  HeaderSubtitle,
  ConversationArea,
  ConversationContent,
  WelcomeContainer,
  WelcomeIcon,
  WelcomeTitle,
  WelcomeText,
  ExampleContainer,
  ExampleTitle,
  ExampleText,
  ConversationItem,
  UserMessage,
  UserText,
  Timestamp,
  AIMessage,
  AuraIcon,
  AuraIconGradient,
  AITextContainer,
  AIText,
  OperationTag,
  OperationText,
  VoiceInputArea,
  StatusContainer,
  RecordingStatus,
  RecordingText,
  ProcessingStatus,
  MicrophoneContainer,
  PulseRing,
  MicrophoneButton,
  MicrophoneGradient,
  InstructionText,
  SiriEdgeAnimation,
  HeaderView,
} from '../../components/voice-chat/voice-chat.styles';
import { ChatBotContext } from '../../../../services/chat-bot/chat-bot.context';
import botImage from '../../../../../assets/bot.png';
import userImage from '../../../../../assets/user_bot.png';
import { AuthenticationContext } from '../../../../services/authentication/authentication.context';
import { getFirebaseAccessUrl } from '../../../../components/utility/helper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import RNFS from 'react-native-fs';
import TrackPlayer, {
  Capability,
  State,
  Event,
} from 'react-native-track-player';

const VOICE_CHAT_HISTORY_KEY = '@expenses-manager-voice-chat-history';

const VoiceChatScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [processingText, setProcessingText] = useState(
    'Processing your voice...',
  );
  const [isError, setIsError] = useState(false);

  const [hasPermission, setHasPermission] = useState(
    Platform.OS === 'android' ? false : true,
  );
  const [conversationHistory, setConversationHistory] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);

  // ADD this line after other useRef declarations:
  const audioRecorderPlayer = new AudioRecorderPlayer();
  const [recordingPath, setRecordingPath] = useState(null);

  const recordingInterval = useRef(null);
  const conversationScrollRef = useRef(null);
  const siriGlow = useSharedValue(0);
  const siriOpacity = useSharedValue(0);

  const { onVoiceChat } = useContext(ChatBotContext);
  const { userData } = useContext(AuthenticationContext);

  const saveConversationHistory = async conversations => {
    try {
      await AsyncStorage.setItem(
        VOICE_CHAT_HISTORY_KEY,
        JSON.stringify(conversations),
      );
    } catch (error) {
      console.log('Error saving voice chat history:', error);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(VOICE_CHAT_HISTORY_KEY);
      return history ? JSON.parse(history) : null;
    } catch (error) {
      console.log('Error loading voice chat history:', error);
      return null;
    }
  };

  const clearConversationHistory = async () => {
    try {
      await AsyncStorage.removeItem(VOICE_CHAT_HISTORY_KEY);
      setConversationHistory([]);
    } catch (error) {
      console.log('Error clearing voice chat history:', error);
    }
  };

  useEffect(() => {
    let processingInterval;

    if (isProcessing) {
      const messages = [
        'Processing your voice...',
        'Understanding your request...',
        'Almost there...',
        'Getting your result...',
        'Just a moment more...',
      ];

      let messageIndex = 0;

      processingInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setProcessingText(messages[messageIndex]);
      }, 2000); // Change text every 2 seconds
    } else {
      setProcessingText('Processing your voice...');
    }

    return () => {
      if (processingInterval) {
        clearInterval(processingInterval);
      }
    };
  }, [isProcessing]);

  useEffect(() => {
    if (isRecording) {
      siriOpacity.value = withTiming(1, { duration: 300 });
      siriGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 }),
        ),
        -1,
        false,
      );

      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      siriOpacity.value = withTiming(0, { duration: 300 });
      siriGlow.value = 0;

      clearInterval(recordingInterval.current);
      setRecordingTime(0);
    }

    return () => {
      clearInterval(recordingInterval.current);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.removePlayBackListener();
    };
  }, []);

  useEffect(() => {
    return () => {
      TrackPlayer.stop();
    };
  }, []);

  useEffect(() => {
    setupTrackPlayer();
    const fetchConversationHistory = async () => {
      const history = await loadConversationHistory();
      if (history && history.length > 0) {
        setConversationHistory(history);
      }
    };
    fetchConversationHistory();
  }, []);

  useEffect(() => {
    if (conversationHistory.length > 0) {
      saveConversationHistory(conversationHistory);
    }
  }, [conversationHistory]);

  const setupTrackPlayer = async () => {
    try {
      await TrackPlayer.setupPlayer({
        waitForBuffer: true,
      });

      await TrackPlayer.updateOptions({
        stopWithApp: true,
        capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
        compactCapabilities: [Capability.Play, Capability.Pause],
      });

      console.log('✅ TrackPlayer setup complete');
      return true;
    } catch (error) {
      console.error('❌ TrackPlayer setup error:', error);
      return false;
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      let permission;

      if (Platform.OS === 'android') {
        permission = PERMISSIONS.ANDROID.RECORD_AUDIO;
      } else {
        setHasPermission(true);
        return true;
      }

      const result = await request(permission);

      switch (result) {
        case RESULTS.GRANTED:
          console.log('✅ Microphone permission granted');
          setHasPermission(true);
          return true;
        case RESULTS.DENIED:
          console.log('❌ Microphone permission denied');
          Alert.alert(
            'Permission Required',
            'Microphone access is needed for voice commands. Please grant permission to continue.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Try Again', onPress: requestMicrophonePermission },
            ],
          );
          return false;
        case RESULTS.BLOCKED:
          console.log('🚫 Microphone permission blocked');
          Alert.alert(
            'Permission Blocked',
            'Microphone permission is blocked. Please enable it in your device settings.',
            [
              { text: 'OK', style: 'default' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
          return false;
        case RESULTS.UNAVAILABLE:
          console.log('❓ Microphone not available');
          Alert.alert('Error', 'Microphone is not available on this device.');
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request microphone permission.');
      return false;
    }
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        const permissionGranted = await requestMicrophonePermission();
        if (!permissionGranted) {
          return;
        }
      }

      const state = await TrackPlayer.getState();
      if (state === State.Playing || state === State.Paused) {
        await TrackPlayer.stop();
        await TrackPlayer.reset();
        setIsSpeaking(false);
      }

      setIsError(false);

      const result = await audioRecorderPlayer.startRecorder(undefined, {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        OutputFormatAndroid: 'wav',
        AVNumberOfChannelsKeyIOS: 2, // Try 2 channels
        AVFormatIDKeyIOS: AVEncodingOption.lpcm,
        AVLinearPCMBitDepthKeyIOSType: 16,
        AVEncoderAudioQualityIOSType: AVEncoderAudioQualityIOSType.high,
      });

      setRecordingPath(result);
      if (Platform.OS === 'ios') {
        Vibration.vibrate(50);
      }
      setIsRecording(true);
      console.log('🎤 Recording started...');
    } catch (error) {
      console.error('Start recording error:', error);

      Alert.alert(
        'Error',
        'Failed to start recording. Please try again.' + error.toString(),
      );
    }
  };

  const stopRecording = async () => {
    try {
      console.log('🛑 Stopping recording...');

      await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      if (recordingPath) {
        processVoiceInput(recordingPath);
        setRecordingPath(null);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const cleanUpFile = async filePath => {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        console.log('🗑️ Cleaned up audio file ' + filePath);
      } else {
        console.log(
          '🗑️ Tried to clean the file but file not exists ' + filePath,
        );
      }
    } catch (cleanupError) {
      console.log('Cleanup warning:', cleanupError);
    }
  };

  const scrollListToBottom = () => {
    // Add this line:
    setTimeout(() => {
      conversationScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const processVoiceInput = async audioFilePath => {
    try {
      setIsProcessing(true);
      // const audioBase64 = await RNFS.readFile(audioFilePath, 'base64');
      // const extension = audioFilePath.split('.').pop();
      // const audio = {
      //   base64: audioBase64,
      //   extension: extension,
      // };
      onVoiceChat(
        audioFilePath,
        res => {
          const {
            transcription,
            operation,
            response_text,
            audioData,
            audioMimeType,
          } = res;

          const newConversation = {
            id: Date.now(),
            userInput: transcription,
            aiResponse: response_text,
            operation: operation,
            timestamp: moment().format('hh:mm A'),
            fullDate: new Date().toISOString(),
            success: res.status !== false,
          };

          setConversationHistory(prev => [...prev, newConversation]);
          setIsProcessing(false);
          // Play audio response
          if (audioData && audioMimeType) {
            playAudioFromBase64(audioData, audioMimeType);
          } else {
            console.log('✅ Processing completed');
          }

          cleanUpFile(audioFilePath);
        },
        err => {
          cleanUpFile(audioFilePath);
          onSetError('Processing Error', err);
        },
      );
    } catch (error) {
      console.error('Voice processing error:', error);
      cleanUpFile(audioFilePath);
      onSetError('Audio Input Error', error);
    }
  };

  const onSetError = (voiceText, error) => {
    const errorConversation = {
      id: Date.now(),
      userInput: voiceText,
      aiResponse: error.toString(),
      operation: 'error',
      timestamp: moment().format('hh:mm A'),

      fullDate: new Date().toISOString(),
      success: false,
    };

    setConversationHistory(prev => [errorConversation, ...prev]);
    setIsProcessing(false);
    setIsError(true);
  };

  const playAudioFromBase64 = async (audioData, mimeType) => {
    const tempDir = RNFS.TemporaryDirectoryPath;
    const fileExtension = mimeType === 'audio/mpeg' ? 'mp3' : 'wav';
    const tempFilePath = `${tempDir}temp_tts_${Date.now()}.${fileExtension}`;

    try {
      // Stop any current audio
      const state = await TrackPlayer.getState();
      if (state === State.Playing || state === State.Paused) {
        await TrackPlayer.stop();
      }
      // Create temporary file from base64
      await RNFS.writeFile(tempFilePath, audioData, 'base64');
      await TrackPlayer.reset();

      await TrackPlayer.add({
        id: `tts-${Date.now()}`,
        url: Platform.OS === 'ios' ? tempFilePath : `file:///${tempFilePath}`,
        title: 'Aura Response',
        artist: 'AI Assistant',
      });

      await TrackPlayer.play();
      setIsSpeaking(true);

      console.log('🔊 Audio playing...');

      // Listen for completion
      const unsubscribe = TrackPlayer.addEventListener(
        Event.PlaybackState,
        async data => {
          if (data.state === State.Error) {
            unsubscribe.remove();
            throw data.error.message;
          }
          if (data.state === State.Ended || data.state === State.Stopped) {
            setIsSpeaking(false);
            cleanUpFile(tempFilePath);
            unsubscribe.remove();
          }
        },
      );
    } catch (error) {
      console.error('Audio playback error:', error);
      cleanUpFile(tempFilePath);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
    try {
      await TrackPlayer.stop();
      setIsSpeaking(false);
      console.log('🛑 Audio stopped');
    } catch (error) {
      console.error('Stop audio error:', error);
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const siriAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: siriOpacity.value,
      borderColor: `rgba(87, 86, 213, ${siriGlow.value})`,
      shadowColor: '#667eea',
      shadowOpacity: siriGlow.value * 0.8,
      shadowRadius: 30,
      elevation: Platform.OS === 'ios' ? siriGlow.value * 15 : 0,
    };
  });

  const renderConversationsWithDays = () => {
    // Sort conversations by fullDate first (earliest to latest)
    const sortedConversations = conversationHistory.sort((a, b) => {
      return new Date(a.fullDate) - new Date(b.fullDate);
    });

    const groupedByDay = sortedConversations.reduce((groups, item) => {
      const day = moment(item.fullDate).format('YYYY-MM-DD');
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
      return groups;
    }, {});

    // Sort days chronologically (earliest to latest)
    const sortedDays = Object.entries(groupedByDay).sort(([dayA], [dayB]) => {
      return new Date(dayA) - new Date(dayB);
    });

    return sortedDays.map(([day, dayConversations]) => {
      // Sort conversations within the day by time (earliest to latest)
      const sortedDayConversations = dayConversations.sort((a, b) => {
        return new Date(a.fullDate) - new Date(b.fullDate);
      });

      const dayLabel = moment(day).calendar(null, {
        sameDay: '[Today]',
        lastDay: '[Yesterday]',
        lastWeek: 'dddd',
        sameElse: 'MMMM Do',
      });

      return (
        <View key={day}>
          <View
            style={{
              alignItems: 'center',
              marginVertical: 16,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: '#95a5a6',
                backgroundColor: 'rgba(149, 165, 166, 0.1)',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                fontWeight: '500',
              }}
            >
              {dayLabel}
            </Text>
          </View>
          {sortedDayConversations.map((item, index) =>
            renderConversationItem(item, index),
          )}
        </View>
      );
    });
  };

  const renderConversationItem = (item, index) => (
    <MotiView
      key={item.id}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: index * 100,
      }}
      onDidAnimate={(key, finished) => {
        if (
          finished &&
          item.id === conversationHistory[conversationHistory.length - 1]?.id
        ) {
          scrollListToBottom();
        }
      }}
    >
      <ConversationItem>
        <UserMessage>
          <Image
            source={{
              uri: userData?.photoURL
                ? userData.photoURL.startsWith('users/')
                  ? `${getFirebaseAccessUrl(
                      userData.photoURL,
                    )}&time=${Date.now()}`
                  : userData.photoURL
                : Image.resolveAssetSource(userImage).uri,
            }}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              marginRight: 4,
            }}
          />
          <UserText>{item.userInput}</UserText>
          <Timestamp>{item.timestamp}</Timestamp>
        </UserMessage>

        <AIMessage>
          <AuraIcon>
            <AuraIconGradient>
              <Image
                source={botImage}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                }}
              />
            </AuraIconGradient>
          </AuraIcon>
          <AITextContainer>
            <AIText>{item.aiResponse}</AIText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <OperationTag
                style={{
                  marginLeft: 8,
                  backgroundColor: item.success
                    ? 'rgba(39, 174, 96, 0.1)'
                    : 'rgba(231, 76, 60, 0.1)',
                }}
              >
                <OperationText
                  style={{
                    color: item.success ? '#27ae60' : '#e74c3c',
                  }}
                >
                  {item.success ? 'SUCCESS' : 'ERROR'}
                </OperationText>
              </OperationTag>
            </View>
          </AITextContainer>
        </AIMessage>
      </ConversationItem>
    </MotiView>
  );

  return (
    <Container>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <SiriEdgeAnimation style={siriAnimatedStyle} />
      <Header>
        <HeaderView>
          <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            style={{ flex: 1 }}
          >
            <HeaderTitle>Aura</HeaderTitle>
            <HeaderSubtitle>Your AI Expense Assistant</HeaderSubtitle>
          </MotiView>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={clearConversationHistory}
              style={{
                marginRight: 12,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="clear-all" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                stopSpeaking();
                navigation.navigate('ChatBot'); // or whatever your text chat route is
              }}
              style={{
                marginRight: 12,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="message" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                stopSpeaking();
                navigation.goBack();
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </HeaderView>
      </Header>

      <ConversationArea
        ref={conversationScrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <ConversationContent>
          {conversationHistory.length === 0 ? (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 800, delay: 300 }}
            >
              <WelcomeContainer>
                <WelcomeIcon>
                  <Icon name="mic" size={40} color="#667eea" />
                </WelcomeIcon>
                <WelcomeTitle>
                  {' '}
                  {userData?.displayName
                    ? `Hi ${userData.displayName}! I'm Aura 👋`
                    : "Hi! I'm Aura 👋"}
                </WelcomeTitle>
                <WelcomeText>
                  Share your weekly spending story! Describe what you bought,
                  how much, and where. I'll add transactions automatically.
                </WelcomeText>

                <ExampleContainer>
                  <ExampleTitle>Try saying:</ExampleTitle>
                  <ExampleText>
                    "Log my expense coffee 5 dollars HDFC"
                  </ExampleText>
                  <ExampleText>"Add income salary 3000 from Chase"</ExampleText>
                  <ExampleText>"Create new account Emergency Fund"</ExampleText>
                </ExampleContainer>
              </WelcomeContainer>
            </MotiView>
          ) : (
            renderConversationsWithDays()
            // conversationHistory.map((item, index) =>
            //   renderConversationsWithDays(item, index),
            // )
          )}
        </ConversationContent>
      </ConversationArea>

      <VoiceInputArea>
        {(isRecording || isProcessing || isSpeaking) && (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <StatusContainer>
              {isRecording && (
                <RecordingStatus>
                  <MotiView
                    from={{ scale: 1 }}
                    animate={{ scale: 1.2 }}
                    transition={{
                      type: 'timing',
                      duration: 1000,
                      loop: true,
                      repeatReverse: true,
                    }}
                  >
                    <Icon
                      name="fiber-manual-record"
                      size={12}
                      color="#ff4757"
                    />
                  </MotiView>
                  <RecordingText>
                    Listening... {formatTime(recordingTime)}
                  </RecordingText>
                </RecordingStatus>
              )}

              {isProcessing && (
                <MotiView
                  from={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 600,
                    loop: true,
                    repeatReverse: true,
                  }}
                >
                  <ProcessingStatus>
                    <MotiView
                      from={{ rotate: '0deg' }}
                      animate={{ rotate: '360deg' }}
                      transition={{
                        type: 'timing',
                        duration: 1000,
                        loop: true,
                      }}
                    >
                      <Icon name="autorenew" size={16} color="#667eea" />
                    </MotiView>
                    <MotiText
                      from={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        type: 'timing',
                        duration: 800,
                        loop: true,
                        repeatReverse: true,
                      }}
                      style={{
                        fontSize: 14,
                        color: '#667eea',
                        fontWeight: '600',
                        marginLeft: 8,
                      }}
                    >
                      {processingText}
                    </MotiText>
                  </ProcessingStatus>
                </MotiView>
              )}

              {isSpeaking && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isError
                      ? 'rgba(231, 76, 60, 0.1)'
                      : 'rgba(39, 174, 96, 0.1)',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <MotiView
                    from={{ scale: 1 }}
                    animate={{ scale: 1.2 }}
                    transition={{
                      type: 'timing',
                      duration: 800,
                      loop: true,
                      repeatReverse: true,
                    }}
                  >
                    <Icon
                      name="volume-up"
                      size={16}
                      color={isError ? '#e74c3c' : '#27ae60'}
                    />
                  </MotiView>
                  <Text
                    style={{
                      fontSize: 14,
                      color: isError ? '#e74c3c' : '#27ae60',
                      fontWeight: '600',
                      marginLeft: 8,
                    }}
                  >
                    Aura is speaking...
                  </Text>
                  <TouchableOpacity
                    onPress={stopSpeaking}
                    style={{ marginLeft: 10, padding: 4 }}
                  >
                    <Icon
                      name="volume-off"
                      size={14}
                      color={isError ? '#e74c3c' : '#27ae60'}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </StatusContainer>
          </MotiView>
        )}

        <MotiView
          from={{ scale: 1 }}
          animate={{
            scale: isRecording ? 1.1 : isProcessing ? 1.05 : 1,
            rotate: isProcessing ? '360deg' : '0deg',
          }}
          transition={{
            type: 'timing',
            duration: isProcessing ? 2000 : 200,
            loop: isProcessing ? true : false,
          }}
        >
          <MicrophoneContainer>
            {isRecording && (
              <MotiView
                from={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  type: 'timing',
                  duration: 1500,
                  loop: true,
                }}
              >
                <PulseRing />
              </MotiView>
            )}

            {isSpeaking && (
              <MotiView
                from={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.3, opacity: 0.2 }}
                transition={{
                  type: 'timing',
                  duration: 1000,
                  loop: true,
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: 'rgba(39, 174, 96, 0.3)',
                  }}
                />
              </MotiView>
            )}

            <MicrophoneButton
              onPress={async () => {
                if (isSpeaking) {
                  await stopSpeaking();
                } else if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              activeOpacity={0.8}
              disabled={isProcessing}
            >
              <MicrophoneGradient
                colors={
                  isRecording
                    ? ['#ff4757', '#ff3742']
                    : isError
                    ? ['#e74c3c', '#c0392b']
                    : isSpeaking
                    ? ['#27ae60', '#2ecc71']
                    : ['#667eea', '#764ba2']
                }
              >
                <MotiView
                  from={{ scale: 1 }}
                  animate={{ scale: isRecording ? 1.1 : 1 }}
                  transition={{
                    type: 'timing',
                    duration: 200,
                  }}
                >
                  <Icon
                    name={
                      isProcessing
                        ? 'autorenew'
                        : isSpeaking
                        ? 'volume-up'
                        : 'mic'
                    }
                    size={32}
                    color="white"
                  />
                </MotiView>
              </MicrophoneGradient>
            </MicrophoneButton>
          </MicrophoneContainer>
        </MotiView>

        <MotiText
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 500 }}
        >
          <InstructionText>
            {isRecording
              ? 'Tap to stop listening'
              : isSpeaking
              ? 'Tap mic to interrupt Aura'
              : 'Tap to speak'}
          </InstructionText>
        </MotiText>
      </VoiceInputArea>
    </Container>
  );
};

export default VoiceChatScreen;
