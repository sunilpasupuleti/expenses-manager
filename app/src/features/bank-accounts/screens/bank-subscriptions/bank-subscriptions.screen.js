import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  FlatList,
  TouchableOpacity,
  Alert,
  View,
  ScrollView,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import {MotiView} from 'moti';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  Container,
  Header,
  Title,
  StatsCard,
  StatsContent,
  StatsIcon,
  StatsText,
  StatsSubtext,
  LogoContainer,
  Logo,
  ServiceName,
  ServiceDetails,
  TabsContainer,
  TabButton,
  TabButtonText,
  Chip,
  ChipText,
  InstitutionContainer,
  InstitutionLogoImage,
  InstitutionNameText,
} from '../../components/bank-subscriptions/bank-subscriptions.styles';
import {FlexRow} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {useTheme} from 'styled-components/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Collapsible from 'react-native-collapsible';
import {useIsFocused} from '@react-navigation/native';
import {BankAccountContext} from '../../../../services/bank-account/bank-account.context';
import moment from 'moment';
import {GetCurrencySymbol} from '../../../../components/symbol.currency';
import {Spacer} from '../../../../components/spacer/spacer.component';

const testsubscriptionsData = [
  {
    id: '1',
    name: 'Spotify',
    price: '$10.99',
    frequency: 'Monthly',
    logo: require('../../../../../assets/bot.png'),
    type: 'Subscriptions',
  },
  {
    id: '2',
    name: 'Netflix',
    price: '$15.99',
    frequency: 'Monthly',
    logo: require('../../../../../assets/bot.png'),
    type: 'Subscriptions',
  },
  {
    id: '3',
    name: 'Patreon Income',
    price: '$45.00',
    frequency: 'Monthly',
    logo: require('../../../../../assets/bot.png'),
    type: 'Deposits',
  },
];

export const BankSubscriptionsScreen = ({navigation}) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [deposits, setDeposits] = useState([]);

  const [activeTab, setActiveTab] = useState('Subscriptions');
  const theme = useTheme();
  const {getRecurringTransactions} = useContext(BankAccountContext);
  const routeIsFocused = useIsFocused();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = id => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCancelSubscription = id => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setSubscriptions(prev => prev.filter(sub => sub.id !== id));
          },
        },
      ],
    );
  };

  const handleRecurringData = recurring => {
    const subscriptionsList = [];
    const depositsList = [];

    // 🔁 Process outflow active subscriptions
    recurring.outflow.active.forEach((service, index) => {
      subscriptionsList.push({
        id:
          'sub-' +
          service.institutionId +
          '-' +
          (service.streamId || service.serviceName || 'unknown') +
          '-' +
          index,
        name: service.serviceName,
        averageAmount: service.averageAmount
          ? '$' + parseFloat(service.averageAmount).toFixed(2)
          : '$0.00',
        price: service.lastAmount
          ? '$' + parseFloat(service.lastAmount).toFixed(2)
          : '$0.00',
        frequency: service.frequency || 'Unknown',
        predictedNextDate: service.predictedNextDate || null,
        logo: {uri: service.merchantLogo},
        type: 'Subscriptions',
        currencyCode: service.currencyCode,
        transactions: service.transactions,
        institutionName: service.institutionName,
        institutionLogo: service.institutionLogo,
      });
    });

    // 🔁 Process inflow active deposits
    recurring.inflow.active.forEach((service, index) => {
      depositsList.push({
        id:
          'dep-' +
          service.institutionId +
          '-' +
          (service.streamId || service.serviceName || 'unknown') +
          '-' +
          index,
        name: service.serviceName,
        averageAmount: service.averageAmount
          ? '$' + parseFloat(service.averageAmount).toFixed(2)
          : '$0.00',
        price: service.lastAmount
          ? '$' + parseFloat(service.lastAmount).toFixed(2)
          : '$0.00',
        frequency: service.frequency || 'Unknown',
        predictedNextDate: service.predictedNextDate || null,
        logo:
          {uri: service.merchantLogo} ||
          require('../../../../../assets/bot.png'),
        type: 'Deposits',
        transactions: service.transactions,
        institutionName: service.institutionName,
        institutionLogo: service.institutionLogo,
        currencyCode: service.currencyCode,
      });
    });

    // 🔁 Update state
    setSubscriptions(subscriptionsList);
    setDeposits(depositsList);
  };

  const onGetRecurringTransactions = async () => {
    getRecurringTransactions(
      {},
      data => {
        handleRecurringData(data.recurring);
      },
      () => {},
      true,
    );
  };

  useEffect(() => {
    if (routeIsFocused) {
      onGetRecurringTransactions();
    }
  }, [routeIsFocused]);

  const calculateTotalMonthlySpend = () => {
    const list = activeTab === 'Subscriptions' ? subscriptions : deposits;
    return list.reduce((sum, sub) => {
      const amount = parseFloat(sub.price.replace('$', '')) || 0;
      return sum + amount;
    }, 0);
  };
  const rotateAnimations = useRef({});

  useEffect(() => {
    Object.keys(rotateAnimations.current).forEach(id => {
      Animated.timing(rotateAnimations.current[id], {
        toValue: expandedId === id ? 1 : 0,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });
  }, [expandedId]);

  const renderSubscriptionItem = ({item, index}) => {
    const isExpanded = expandedId === item.id;
    if (!rotateAnimations.current[item.id]) {
      rotateAnimations.current[item.id] = new Animated.Value(
        expandedId === item.id ? 1 : 0,
      );
    }

    const rotateAnim = rotateAnimations.current[item.id];

    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <MotiView
        from={{opacity: 0, translateY: 20, scale: 0.95}}
        animate={{opacity: 1, translateY: 0, scale: 1}}
        transition={{
          delay: index * 100,
          type: 'timing',
          duration: 400,
        }}>
        <View
          style={{
            marginBottom: 15,
            borderRadius: 16,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            overflow: 'hidden',
          }}>
          <TouchableOpacity
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 15,
              justifyContent: 'space-between',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <LogoContainer>
                {typeof item.logo === 'object' && item.logo.uri ? (
                  <Logo source={{uri: item.logo.uri}} />
                ) : (
                  <Logo source={item.logo} />
                )}
              </LogoContainer>

              <View style={{marginLeft: 12, flex: 1}}>
                <ServiceName>{item.name}</ServiceName>
                <ServiceDetails>
                  {item.frequency} • Next:{' '}
                  {item.predictedNextDate
                    ? moment(item.predictedNextDate).format('MMM DD, YYYY')
                    : 'N/A'}
                </ServiceDetails>

                <FlexRow style={{marginTop: 4}}>
                  <Chip>
                    <ChipText>
                      Next Debit: {GetCurrencySymbol(item.currencyCode)}
                      {parseFloat(item.averageAmount.replace('$', '')).toFixed(
                        2,
                      )}
                    </ChipText>
                  </Chip>
                </FlexRow>
                <Spacer />
                <Chip>
                  <InstitutionContainer>
                    {item.institutionLogo && (
                      <InstitutionLogoImage
                        source={{
                          uri: `data:image/png;base64,${item.institutionLogo}`,
                        }}
                      />
                    )}
                    <InstitutionNameText>
                      {item.institutionName}
                    </InstitutionNameText>
                  </InstitutionContainer>
                </Chip>
              </View>
            </View>

            <Animated.View style={{transform: [{rotate}]}}>
              <Ionicons name="chevron-down" size={22} color="#888" />
            </Animated.View>
          </TouchableOpacity>

          <Collapsible collapsed={!isExpanded} align="center">
            <View
              style={{
                backgroundColor: '#f9f9f9',
                paddingHorizontal: 15,
                paddingVertical: 10,
                borderTopWidth: 1,
                borderTopColor: '#eee',
              }}>
              <Text
                style={{
                  fontWeight: '600',
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#444',
                }}>
                Recent Payments
              </Text>
              {item.transactions && item.transactions.length > 0 ? (
                item.transactions.slice(0, 5).map((tx, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#8B5CF6"
                      style={{marginRight: 8}}
                    />
                    <Text style={{color: '#555', fontSize: 13}}>
                      {moment(tx.date).format('MMM DD, YYYY')} -{' '}
                      {GetCurrencySymbol(item.currencyCode)}
                      {parseFloat(tx.amount).toFixed(2)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{color: '#555', fontSize: 13}}>
                  No recent payments
                </Text>
              )}
            </View>
          </Collapsible>
        </View>
      </MotiView>
    );
  };

  if (subscriptions.length === 0 && deposits.length === 0) return;
  return (
    <Container>
      <StatusBar
        barStyle="light-content"
        translucent={true}
        backgroundColor="#8B5CF6"
      />

      <SafeAreaView edges={['top']}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Ionicons
            name="chevron-back-outline"
            size={25}
            color="white"
            style={{marginRight: 10}}
          />
          <Text
            style={{
              color: 'white',
              fontSize: 20,
              fontWeight: 'bold',
            }}>
            Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
      <Header>
        <Title>Manage{'\n'}Subscriptions</Title>
      </Header>

      <TabsContainer>
        {['Subscriptions', 'Deposits'].map(tab => (
          <TabButton
            key={tab}
            onPress={() => {
              setActiveTab(tab);
              setExpandedId(null);
            }}>
            <View
              style={{
                backgroundColor: activeTab === tab ? 'white' : 'transparent',
                borderRadius: 20,
                paddingVertical: 8,
                paddingHorizontal: 8,
              }}>
              <TabButtonText active={activeTab === tab}>{tab}</TabButtonText>
            </View>
          </TabButton>
        ))}
      </TabsContainer>

      <ScrollView showsVerticalScrollIndicator={false}>
        <MotiView
          from={{opacity: 0, translateY: -10}}
          animate={{opacity: 1, translateY: 0}}
          transition={{type: 'timing', duration: 500}}>
          <StatsCard>
            <StatsIcon>
              <MotiView
                from={{scale: 0}}
                animate={{scale: 1}}
                transition={{type: 'spring', damping: 10}}>
                <StatsText>💳</StatsText>
              </MotiView>
            </StatsIcon>

            <StatsContent>
              <StatsText>
                {activeTab === 'Subscriptions'
                  ? subscriptions.length
                  : deposits.length}{' '}
                Active Subscriptions
              </StatsText>
              <StatsSubtext>
                Total: ${calculateTotalMonthlySpend().toFixed(2)}/month
              </StatsSubtext>
            </StatsContent>
          </StatsCard>
        </MotiView>

        <FlatList
          scrollEnabled={false}
          data={activeTab === 'Subscriptions' ? subscriptions : deposits}
          keyExtractor={item => item.id}
          renderItem={renderSubscriptionItem}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>
    </Container>
  );
};
