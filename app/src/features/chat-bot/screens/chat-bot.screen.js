import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useContext,
} from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import {GiftedChat, SystemMessage, Day, Avatar} from 'react-native-gifted-chat';
import {MotiView, AnimatePresence} from 'moti';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RenderHTML from 'react-native-render-html';
import {Dimensions} from 'react-native';
const {width} = Dimensions.get('window');

import {
  Container,
  Header,
  HeaderTitle,
  OnlineIndicator,
  TypingDots,
  TypingDot,
  CustomBubble,
  CustomInputToolbar,
  CustomSend,
  MessageContainer,
  AnimatedMessageWrapper,
  FloatingActionButton,
  ParticleContainer,
  Particle,
} from '../components/chat-bot.styles';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {getFirebaseAccessUrl} from '../../../components/utility/helper';
import botImage from '../../../../assets/bot.png';
import userImage from '../../../../assets/user_bot.png';
import {ChatBotContext} from '../../../services/chat-bot/chat-bot.context';
import {Text} from '../../../components/typography/text.component';
import AsyncStorage from '@react-native-async-storage/async-storage';
const CHAT_HISTORY_KEY = '@expenses-manager-chat-history';
const ChatBotScreen = ({navigation}) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const {userData} = useContext(AuthenticationContext);
  const {onQueryChatBot} = useContext(ChatBotContext);

  const chatRef = useRef(null);

  const saveChatHistory = async msgs => {
    try {
      // Filter out suggestions messages
      const filteredMsgs = msgs.filter(m => m.type !== 'suggestions');
      await AsyncStorage.setItem(
        CHAT_HISTORY_KEY,
        JSON.stringify(filteredMsgs),
      );
    } catch (error) {
      console.log('Error saving chat history:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      return history ? JSON.parse(history) : null;
    } catch (error) {
      console.log('Error loading chat history:', error);
      return null;
    }
  };

  const clearChatHistory = async () => {
    console.log('clicking');

    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
      setMessages([]);
    } catch (error) {
      console.log('Error clearing chat history:', error);
    }
  };

  const [suggestions, setSuggestions] = useState([
    'Show my recent transactions',
    'How much did I spend today?',
    'How much did I spend this week?',
    'How much did I spend last month?',
    'What is my highest expense category?',
    'What is my average daily spending?',
    'Show account balances',
    'How much did I save this month?',
    'What was my largest expense last month?',
    'Summarize my income and expenses this month',
  ]);

  const showSuggestions = () => {
    setTimeout(() => {
      setMessages(prev =>
        GiftedChat.append(prev, [
          {
            _id: Math.round(Math.random() * 1000000),
            type: 'suggestions',
            suggestions: suggestions,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'Aura AI Assistant',
              avatar: Image.resolveAssetSource(botImage).uri,
            },
          },
        ]),
      );
    }, 100);
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      const history = await loadChatHistory();

      if (history && history?.length > 0) {
        setMessages(history);
        showSuggestions();
      } else {
        // If no history, show welcome message
        const userName = userData?.displayName || 'there';
        const baseTime = Date.now();
        setMessages([
          {
            _id: 1,
            text: `Hello ${userName}! I'm Aura, your AI assistant. How can I help you today?`,
            createdAt: new Date(baseTime),
            user: {
              _id: 2,
              name: 'Aura AI Assistant',
              avatar: Image.resolveAssetSource(botImage).uri,
            },
            system: false,
          },
        ]);
        showSuggestions();
      }
    };
    fetchChatHistory();
  }, [userData]);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  const handleSuggestionPress = suggestion => {
    setInputText(suggestion);
    onSend([
      {
        _id: Math.round(Math.random() * 1000000),
        text: suggestion,
        createdAt: new Date(),
        user: {
          _id: 1,
          name: 'User',
          avatar: userData?.photoURL
            ? userData.photoURL.startsWith('users/')
              ? `${getFirebaseAccessUrl(userData.photoURL)}&time=${Date.now()}`
              : userData.photoURL
            : Image.resolveAssetSource(userImage).uri,
        },
      },
    ]);
    // Scroll to bottom after slight delay for GiftedChat to render new message
    setTimeout(() => {
      if (chatRef.current && chatRef.current.scrollToBottom) {
        chatRef.current.scrollToBottom();
      }
    }, 300);
  };

  const onSend = useCallback((newMessages = []) => {
    setMessages(prev => GiftedChat.append(prev, newMessages));
    setInputText('');
    setIsTyping(true);
    const botResponse = generateBotResponse(newMessages[0].text);
    setMessages(prev => GiftedChat.append(prev, [botResponse]));
  }, []);

  const generateBotResponse = userMessage => {
    setIsTyping(true);
    setInputText('');
    // Return a temporary 'thinking' message immediately
    const tempResponse = {
      _id: Math.round(Math.random() * 1000000),
      text: 'Just a moment, I’m working on it. Please be patient...',
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Aura AI Assistant',
        avatar: Image.resolveAssetSource(botImage).uri,
      },
    };

    // Call the backend-based AI logic
    onQueryChatBot(
      userMessage,
      data => {
        if (data.formatting) {
          const formattingMessage = {
            _id: Math.round(Math.random() * 1000000),
            text: 'Almost done! Organizing your results for better readability...',
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'Aura AI Assistant',
              avatar: Image.resolveAssetSource(botImage).uri,
            },
          };
          setMessages(prev => GiftedChat.append(prev, [formattingMessage]));
          //   setIsTyping(true); // ✅ Show typing indicator while formatting
          return;
        }

        // 📝 Once records are fetched, replace temp response with real data
        const aiMessage = {
          _id: Math.round(Math.random() * 1000000),
          text: data.text,
          html: data.html,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'Aura AI Assistant',
            avatar: Image.resolveAssetSource(botImage).uri,
          },
        };
        setMessages(prev => GiftedChat.append(prev, [aiMessage]));
        setIsTyping(false);
        Vibration.vibrate(50);
      },
      err => {
        // Handle error with a fallback AI message
        const errorMessage = {
          _id: Math.round(Math.random() * 1000000),
          text: `Sorry, something went wrong: ${err}`,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'Aura AI Assistant',
            avatar: Image.resolveAssetSource(botImage).uri,
          },
        };
        setMessages(prev => GiftedChat.append(prev, [errorMessage]));
        setIsTyping(false);

        Vibration.vibrate([0, 100, 50, 100]);
      },
    );

    return tempResponse;
  };

  const renderSuggestions = () => {
    const rows = [];
    const itemsPerRow = 3; // Number of suggestions per row

    for (let i = 0; i < suggestions.length; i += itemsPerRow) {
      rows.push(suggestions.slice(i, i + itemsPerRow));
    }

    return (
      <MotiView
        from={{opacity: 0, translateY: 20}}
        animate={{opacity: 1, translateY: 0}}
        exit={{opacity: 0, translateY: -20}}
        transition={{type: 'spring', damping: 15}}
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)', // very subtle transparent bg
          paddingVertical: 8,
          paddingHorizontal: 10,
          marginBottom: 4,
        }}>
        {rows.map((rowItems, rowIndex) => (
          <ScrollView
            key={rowIndex}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{marginBottom: 8}}>
            {rowItems.map((s, index) => (
              <MotiView
                key={index}
                from={{scale: 0.9, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                transition={{
                  type: 'timing',
                  duration: 300,
                  delay: index * 80,
                }}
                style={{
                  backgroundColor: '#667eea',
                  borderRadius: 20,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  marginRight: 10,
                }}>
                <TouchableOpacity onPress={() => handleSuggestionPress(s)}>
                  <Text style={{color: 'white', fontSize: 14}}>{s}</Text>
                </TouchableOpacity>
              </MotiView>
            ))}
          </ScrollView>
        ))}
      </MotiView>
    );
  };

  const renderBubble = props => {
    const {currentMessage} = props;

    if (currentMessage.type === 'suggestions') {
      return renderSuggestions();
    }

    if (currentMessage.html) {
      return (
        <AnimatePresence>
          <AnimatedMessageWrapper
            from={{opacity: 0, translateY: 20, scale: 0.8}}
            animate={{opacity: 1, translateY: 0, scale: 1}}
            exit={{opacity: 0, translateY: -20, scale: 0.8}}
            transition={{type: 'timing', duration: 400}}>
            <MotiView
              style={{
                backgroundColor: '#ffffff', // match CustomBubble bg
                borderRadius: 15, // match CustomBubble radius
                padding: 10,
                marginVertical: 4,
                maxWidth: width * 0.8, // match normal bubble width
              }}>
              <RenderHTML
                contentWidth={width * 0.7}
                source={{html: currentMessage.html}}
              />
            </MotiView>
          </AnimatedMessageWrapper>
        </AnimatePresence>
      );
    }

    return (
      <AnimatePresence>
        <AnimatedMessageWrapper
          from={{opacity: 0, translateY: 20, scale: 0.8}}
          animate={{opacity: 1, translateY: 0, scale: 1}}
          exit={{opacity: 0, translateY: -20, scale: 0.8}}
          transition={{type: 'timing', duration: 400}}>
          <CustomBubble
            {...props}
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.22,
              shadowRadius: 2.22,
              elevation: 3,
            }}
          />
        </AnimatedMessageWrapper>
      </AnimatePresence>
    );
  };

  const renderInputToolbar = props => (
    <MotiView
      from={{opacity: 0, translateY: 50}}
      animate={{opacity: 1, translateY: 0}}
      transition={{type: 'timing', duration: 300}}>
      <CustomInputToolbar
        {...props}
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      />
    </MotiView>
  );

  const renderSend = props => {
    const disabled = isTyping || !props.text?.trim();

    return (
      <MotiView
        animate={{scale: !disabled ? 1.1 : 0.9}}
        transition={{type: 'spring', damping: 15, mass: 1}}>
        <CustomSend {...props} disabled={disabled} style={{}}>
          <Icon
            name="send"
            size={20}
            color={disabled ? '#ccc' : '#667eea'}
            style={{opacity: disabled ? 0.5 : 1}}
          />
        </CustomSend>
      </MotiView>
    );
  };

  const renderSystemMessage = props => (
    <MotiView
      from={{opacity: 0, scale: 0.8}}
      animate={{opacity: 1, scale: 1}}
      transition={{type: 'timing', duration: 300}}>
      <SystemMessage {...props} />
    </MotiView>
  );

  const renderDay = props => (
    <MotiView
      from={{opacity: 0, translateY: -10}}
      animate={{opacity: 1, translateY: 0}}
      transition={{type: 'timing', duration: 400}}>
      <Day {...props} />
    </MotiView>
  );

  const renderAvatar = props => (
    <MotiView
      from={{scale: 0}}
      animate={{scale: 1}}
      transition={{type: 'spring', damping: 15, mass: 1}}>
      <Avatar {...props} />
    </MotiView>
  );

  // Custom typing indicator that integrates with the chat
  const renderCustomTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <MotiView
        from={{opacity: 0, translateY: 20}}
        animate={{opacity: 1, translateY: 0}}
        exit={{opacity: 0, translateY: -20}}
        transition={{type: 'spring', damping: 15}}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
          marginLeft: 0, // Align with bot messages
          marginRight: 60,
          marginBottom: 8,
        }}>
        <MotiView
          style={{
            backgroundColor: '#f0f0f0',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}>
          <TypingDots>
            {[0, 1, 2].map(index => (
              <TypingDot
                key={index}
                from={{scale: 1, opacity: 0.5, translateY: 0}}
                animate={{scale: 1.4, opacity: 1, translateY: -2}}
                transition={{
                  type: 'timing',
                  duration: 500,
                  loop: true,
                  delay: index * 150,
                  repeatReverse: true,
                }}
              />
            ))}
          </TypingDots>
        </MotiView>
      </MotiView>
    );
  };

  return (
    <Container>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ParticleContainer>
        {[...Array(6)].map((_, i) => (
          <Particle
            key={i}
            animate={{
              translateX: [0, 100, -50, 0],
              translateY: [0, -100, 50, 0],
              opacity: [0.1, 0.3, 0.1, 0.1],
            }}
            transition={{
              type: 'timing',
              duration: 8000 + i * 1000,
              repeat: -1,
              delay: i * 1000,
            }}
          />
        ))}
      </ParticleContainer>

      <Header>
        <MotiView
          from={{opacity: 0, translateX: -20}}
          animate={{opacity: 1, translateX: 0}}
          transition={{type: 'timing', duration: 500}}>
          <HeaderTitle>Aura – AI Assistant</HeaderTitle>
        </MotiView>

        <MotiView
          from={{scale: 0}}
          animate={{scale: 1}}
          transition={{type: 'spring', damping: 10, delay: 200}}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'space-between',
          }}>
          <OnlineIndicator isOnline={isOnline} />

          <Icon
            name="close"
            size={24}
            color="#fff"
            onPress={() => navigation.goBack()}
            style={{
              marginLeft: 12,
              backgroundColor: '#667eea',
              borderRadius: 20,
              padding: 4,
            }}
          />
        </MotiView>
      </Header>

      <MessageContainer>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
          <GiftedChat
            ref={chatRef}
            messages={messages}
            onSend={onSend}
            text={inputText}
            onInputTextChanged={setInputText}
            user={{
              _id: 1,
              name: 'User',
              avatar: userData?.photoURL
                ? userData.photoURL.startsWith('users/')
                  ? `${getFirebaseAccessUrl(
                      userData.photoURL,
                    )}&time=${Date.now()}`
                  : userData.photoURL
                : Image.resolveAssetSource(userImage).uri,
            }}
            renderBubble={renderBubble}
            // renderMessage={renderMessage}
            renderInputToolbar={renderInputToolbar}
            renderSend={renderSend}
            renderSystemMessage={renderSystemMessage}
            renderDay={renderDay}
            renderAvatar={renderAvatar}
            placeholder="Type your message..."
            alwaysShowSend
            showUserAvatar
            scrollToBottom
            infiniteScroll
            keyboardShouldPersistTaps="handled"
            messagesContainerStyle={{paddingBottom: 10}}
            textInputStyle={{
              backgroundColor: 'rgba(248, 249, 250, 0.95)',
              borderRadius: 25,
              borderWidth: 1,
              borderColor: 'rgba(102, 126, 234, 0.2)',
              paddingLeft: 24,
              paddingRight: 20,
              paddingVertical: 12,
              marginHorizontal: 12,
              marginBottom: 18,
              minHeight: 50,
              maxHeight: 120,
            }}
            multiline
            maxInputLength={500}
            timeTextStyle={{
              left: {color: '#999'},
              right: {color: '#999'},
            }}
            renderTime={() => null}
            showAvatarForEveryMessage={false}
            renderFooter={renderCustomTypingIndicator}
          />
        </KeyboardAvoidingView>
      </MessageContainer>

      <Pressable onPress={clearChatHistory}>
        <MotiView
          from={{scale: 0, rotate: '0deg'}}
          animate={{
            scale: messages.length > 0 ? 1 : 0.8,
            rotate: messages.length > 0 ? '0deg' : '180deg',
          }}
          transition={{type: 'spring', damping: 15}}>
          <FloatingActionButton>
            <Icon
              name={messages.length > 0 ? 'clear-all' : 'refresh'}
              size={24}
              color="#fff"
            />
          </FloatingActionButton>
        </MotiView>
      </Pressable>
    </Container>
  );
};

export default ChatBotScreen;
