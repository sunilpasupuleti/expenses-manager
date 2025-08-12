import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Alert,
  View,
  ScrollView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { Easing } from 'react-native-reanimated';
import { MotiView } from 'moti';
import Ionicons from 'react-native-vector-icons/Ionicons';
import plaidCategories from '../../../../components/utility/plaidCategories.json';

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
  InactiveToggleContainer,
  InactiveToggleText,
  SubscriptionIllustration,
} from '../../components/bank-subscriptions/bank-subscriptions.styles';
import { FlexRow } from '../../../../components/styles';
import { Text } from '../../../../components/typography/text.component';
import { useTheme } from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Collapsible from 'react-native-collapsible';
import { useIsFocused } from '@react-navigation/native';
import { BankAccountContext } from '../../../../services/bank-account/bank-account.context';
import moment from 'moment';
import { GetCurrencySymbol } from '../../../../components/symbol.currency';
import { Spacer } from '../../../../components/spacer/spacer.component';
import { Checkbox } from 'react-native-paper';
import { Image } from 'react-native';
import _ from 'lodash';
import LinearGradient from 'react-native-linear-gradient';
import { loaderActions } from '../../../../store/loader-slice';
import { useDispatch, useSelector } from 'react-redux';
import { RenderBlurView } from '../../../../components/utility/safe-area.component';

const screenWidth = Dimensions.get('window').width;
const icons = [
  require('../../../../../assets/subscriptions_brands/xbox.jpeg'),
  require('../../../../../assets/subscriptions_brands/linkedin.png'),
  require('../../../../../assets/subscriptions_brands/audible.png'),
  require('../../../../../assets/subscriptions_brands/icloud.png'),
  require('../../../../../assets/subscriptions_brands/peloton.jpeg'),
  require('../../../../../assets/subscriptions_brands/youtubemusic.jpeg'),
  require('../../../../../assets/subscriptions_brands/applemusic.png'),
  require('../../../../../assets/subscriptions_brands/spotify.png'),
  require('../../../../../assets/subscriptions_brands/appletv.jpeg'),
  require('../../../../../assets/subscriptions_brands/youtube.png'),
  require('../../../../../assets/subscriptions_brands/hbomax.jpeg'),
  require('../../../../../assets/subscriptions_brands/prime.jpeg'),
  require('../../../../../assets/subscriptions_brands/hulu.jpeg'),
  require('../../../../../assets/subscriptions_brands/disney.jpeg'),
  require('../../../../../assets/subscriptions_brands/netflix.png'),
];

const BankSubscriptionsEmptyState = ({ onConnectPress }) => {
  const scrollAnim1 = useRef(new Animated.Value(0)).current;
  const scrollAnim2 = useRef(new Animated.Value(0)).current;

  const firstRowIcons = icons.slice(0, icons.length / 2);
  const secondRowIcons = icons.slice(icons.length / 2);

  useEffect(() => {
    const totalWidth = icons.length * 60; // icon width + margin

    const loopScroll = (anim, reverse = false) => {
      anim.setValue(reverse ? -totalWidth / 2 : 0);
      Animated.timing(anim, {
        toValue: reverse ? 0 : -totalWidth / 2,
        duration: 12000, // Slightly slower for better visibility
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(() => loopScroll(anim, reverse));
    };

    loopScroll(scrollAnim1, false);
    loopScroll(scrollAnim2, true);
  }, [scrollAnim1, scrollAnim2]);

  return (
    <View
      style={{
        marginTop: 50,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 800,
        }}
        style={{
          width: '100%',
          maxWidth: 380,
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.6)']}
          style={{
            borderRadius: 20,
            width: '100%',
            maxWidth: 380,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View style={{ padding: 25, alignItems: 'center' }}>
            {/* Row 1 - Scrolling Subscription Icons */}
            <View
              style={{
                height: 60,
                overflow: 'hidden',
                width: '100%',
                marginBottom: 10,
              }}
            >
              <Animated.View
                style={{
                  flexDirection: 'row',
                  transform: [{ translateX: scrollAnim1 }],
                }}
              >
                {firstRowIcons.concat(firstRowIcons).map((icon, index) => (
                  <View
                    key={`row1-${index}`}
                    style={{
                      width: 50,
                      height: 50,
                      marginHorizontal: 5,
                      borderRadius: 10,
                      backgroundColor: 'white',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={icon}
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 8,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </Animated.View>
            </View>

            {/* Row 2 - Scrolling Subscription Icons (Reverse Direction) */}
            <View
              style={{
                height: 60,
                overflow: 'hidden',
                width: '100%',
                marginBottom: 25,
              }}
            >
              <Animated.View
                style={{
                  flexDirection: 'row',
                  transform: [{ translateX: scrollAnim2 }],
                }}
              >
                {secondRowIcons.concat(secondRowIcons).map((icon, index) => (
                  <View
                    key={`row2-${index}`}
                    style={{
                      width: 50,
                      height: 50,
                      marginHorizontal: 5,
                      borderRadius: 10,
                      backgroundColor: 'white',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={icon}
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 8,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </Animated.View>
            </View>

            <Text
              style={{
                color: '#111',
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Manage Subscriptions
            </Text>
            <Text
              style={{
                color: '#444',
                fontSize: 15,
                textAlign: 'center',
                marginBottom: 25,
                lineHeight: 22,
              }}
            >
              Don't miss out on payment delays or know your unwanted
              subscriptions and automatic deposits which are still active
            </Text>

            <TouchableOpacity onPress={onConnectPress} activeOpacity={0.85}>
              <LinearGradient
                colors={['#7b2ff7', '#f107a3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 25,
                  shadowColor: '#7b2ff7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 45,
                    textAlign: 'center',
                  }}
                >
                  Connect Your Bank
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </MotiView>
    </View>
  );
};

export const BankSubscriptionsScreen = ({ navigation }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [inactiveSubscriptions, setInactiveSubscriptions] = useState([]);
  const [inactiveDeposits, setInactiveDeposits] = useState([]);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('Subscriptions');
  const theme = useTheme();
  const { getRecurringTransactions } = useContext(BankAccountContext);
  const routeIsFocused = useIsFocused();
  const [expandedId, setExpandedId] = useState(null);
  const appState = useSelector(state => state.service.appState);

  const toggleExpand = id => {
    setExpandedId(expandedId === id ? null : id);
  };

  const buildServiceData = (service, index, inactive, type) => ({
    id:
      (inactive ? 'inactive-' : '') +
      type.toLowerCase() +
      '-' +
      service.institutionId +
      '-' +
      (service.streamId || service.serviceName || 'unknown') +
      '-' +
      index,
    name: service.serviceName,
    primaryCategory: service.primaryCategory,
    detailedCategory: service.detailedCategory,
    averageAmount: service.averageAmount
      ? '$' + parseFloat(service.averageAmount).toFixed(2)
      : '$0.00',
    price: service.lastAmount
      ? '$' + parseFloat(service.lastAmount).toFixed(2)
      : '$0.00',
    frequency: service.frequency || 'Unknown',
    predictedNextDate: service.predictedNextDate || null,
    logo: { uri: service.merchantLogo },
    type,
    inactive,
    currencyCode: service.currencyCode,
    transactions: service.transactions,
    institutionName: service.institutionName,
    institutionLogo: service.institutionLogo,
  });

  const handleRecurringData = recurring => {
    const subscriptionsList = [];
    const depositsList = [];
    const inactiveSubsList = [];
    const inactiveDepsList = [];

    // Active outflow subscriptions
    recurring.outflow.active.forEach((service, index) => {
      subscriptionsList.push(
        buildServiceData(service, index, false, 'Subscriptions'),
      );
    });

    // Inactive outflow subscriptions
    recurring.outflow.inactive.forEach((service, index) => {
      inactiveSubsList.push(
        buildServiceData(service, index, true, 'Subscriptions'),
      );
    });

    // Active inflow deposits
    recurring.inflow.active.forEach((service, index) => {
      depositsList.push(buildServiceData(service, index, false, 'Deposits'));
    });

    // Inactive inflow deposits
    recurring.inflow.inactive.forEach((service, index) => {
      inactiveDepsList.push(buildServiceData(service, index, true, 'Deposits'));
    });
    // 🔁 Update state
    setSubscriptions(subscriptionsList);
    setInactiveSubscriptions(inactiveSubsList);
    setDeposits(depositsList);
    setInactiveDeposits(inactiveDepsList);
    dispatch(loaderActions.hideLoader());
  };

  const onGetRecurringTransactions = async () => {
    getRecurringTransactions(
      {},
      data => {
        handleRecurringData(data);
      },
      () => {},
      true,
    );
  };

  useEffect(() => {
    if (routeIsFocused && appState === 'active') {
      onGetRecurringTransactions();
    }
  }, [routeIsFocused]);

  const calculateTotalMonthlySpend = () => {
    let list = [];

    if (activeTab === 'Subscriptions') {
      list = showInactive ? inactiveSubscriptions : subscriptions;
    } else if (activeTab === 'Deposits') {
      list = showInactive ? inactiveDeposits : deposits;
    }

    return list.reduce((sum, sub) => {
      const amount = Math.abs(parseFloat(sub.price.replace('$', '')) || 0);
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

  const getShortDescription = detailedCategory => {
    const match = plaidCategories.find(
      cat => cat.detailed === detailedCategory,
    );
    return match ? match.shortDescription : '';
  };

  const renderSubscriptionItem = ({ item, index }) => {
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
        from={{ opacity: 0, translateY: 20, scale: 0.95 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{
          delay: index * 100,
          type: 'timing',
          duration: 400,
        }}
      >
        <View
          style={{
            marginBottom: 15,
            borderRadius: 16,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            overflow: 'hidden',
            opacity: item.inactive ? 0.8 : 1,
          }}
        >
          <TouchableOpacity
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 15,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              <LogoContainer>
                {typeof item.logo === 'object' && item.logo.uri ? (
                  <Logo source={{ uri: item.logo.uri }} />
                ) : (
                  <Logo source={item.logo} />
                )}
              </LogoContainer>

              <View style={{ marginLeft: 12, flex: 1 }}>
                <ServiceName>{item.name}</ServiceName>
                <ServiceDetails>
                  {_.capitalize(item.frequency)}
                  {item.predictedNextDate
                    ? `, Due on ${moment(item.predictedNextDate).format(
                        'MMM DD, YYYY',
                      )}`
                    : ''}
                </ServiceDetails>

                <Spacer />
                <Chip>
                  <ChipText>
                    {getShortDescription(item.detailedCategory)}
                  </ChipText>
                </Chip>
                {item.predictedNextDate && (
                  <FlexRow style={{ marginTop: 4 }}>
                    <Chip activeTab={activeTab} chipType={'amount'}>
                      <ChipText activeTab={activeTab}>
                        Next{' '}
                        {activeTab === 'Subscriptions' ? 'Debit' : 'Credit'}{' '}
                        {GetCurrencySymbol(item.currencyCode)}
                        {Math.abs(
                          parseFloat(item.averageAmount.replace('$', '')),
                        ).toFixed(2)}{' '}
                        {(() => {
                          const diffDays = moment(item.predictedNextDate).diff(
                            moment().startOf('day'),
                            'days',
                          );
                          if (diffDays < 0) {
                            const daysPast = Math.abs(diffDays);
                            return `(${daysPast} day${
                              daysPast === 1 ? '' : 's'
                            } overdue)`;
                          }
                          if (diffDays === 0) return 'today';
                          if (diffDays === 1) return 'tomorrow';
                          return `in ${diffDays} days`;
                        })()}
                      </ChipText>
                    </Chip>
                  </FlexRow>
                )}

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

            <Animated.View style={{ transform: [{ rotate }] }}>
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
              }}
            >
              <Text
                style={{
                  fontWeight: '600',
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#444',
                }}
              >
                Recent 5 Payments
              </Text>
              {item.transactions && item.transactions.length > 0 ? (
                _.orderBy(item.transactions, ['date'], ['desc'])
                  .slice(0, 5)
                  .map((tx, idx) => {
                    return (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="#8B5CF6"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={{ color: '#555', fontSize: 13 }}>
                          {moment(tx.date).format('MMM DD, YYYY')} -{' '}
                          {GetCurrencySymbol(item.currencyCode)}
                          {Math.abs(parseFloat(tx.amount)).toFixed(2)}
                        </Text>
                      </View>
                    );
                  })
              ) : (
                <Text style={{ color: '#555', fontSize: 13 }}>
                  No recent payments
                </Text>
              )}
            </View>
          </Collapsible>
        </View>
      </MotiView>
    );
  };

  return (
    <>
      <Container>
        <StatusBar
          barStyle="light-content"
          translucent={true}
          backgroundColor="#8B5CF6"
        />

        <SafeAreaView edges={['top']}>
          <FlexRow justifyContent="space-between" alignItems="center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name="chevron-back-outline"
                size={25}
                color="white"
                style={{ marginRight: 10 }}
              />
              <Text
                style={{
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 'bold',
                }}
              >
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onGetRecurringTransactions}
              style={{
                padding: 8,
                borderRadius: 20,
                marginRight: 20,
                top: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={20} color="white" />
            </TouchableOpacity>
          </FlexRow>
        </SafeAreaView>
        {subscriptions.length === 0 &&
        deposits.length === 0 &&
        inactiveDeposits.length === 0 &&
        inactiveSubscriptions.length === 0 ? (
          <View
            style={{
              position: 'relative',
              overflow: 'visible',
              zIndex: 999,
            }}
          >
            <Header>
              <Title>Manage{'\n'}Subscriptions</Title>
            </Header>

            <BankSubscriptionsEmptyState
              onConnectPress={() =>
                navigation.navigate('BankAccounts', {
                  screen: 'BankAccountsHome',
                  params: {
                    screen: 'Accounts',
                  },
                })
              }
            />
          </View>
        ) : (
          <>
            <View
              style={{
                position: 'relative',
                overflow: 'visible',
                zIndex: 999,
              }}
            >
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
                    }}
                  >
                    <View
                      style={{
                        backgroundColor:
                          activeTab === tab ? 'white' : 'transparent',
                        borderRadius: 20,
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                      }}
                    >
                      <TabButtonText active={activeTab === tab}>
                        {tab}
                      </TabButtonText>
                    </View>
                  </TabButton>
                ))}
              </TabsContainer>
              <MotiView
                from={{ opacity: 0, translateX: 50 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'timing',
                  duration: 1600,
                  easing: Easing.out(Easing.exp),
                }}
                style={{
                  position: 'absolute', // ✅ make MotiView itself absolute
                  top: 0,
                  right: 5,
                }}
              >
                <SubscriptionIllustration
                  source={require('../../../../../assets/subscriptions_illustration.png')}
                />
              </MotiView>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <InactiveToggleContainer>
                <InactiveToggleText>
                  Show Inactive Subscriptions
                </InactiveToggleText>

                <View
                  style={{
                    borderRadius: 50,
                    borderWidth: Platform.OS === 'ios' ? 2 : 0,
                    borderColor: Platform.OS === 'ios' ? '#fff' : 'transparent',
                    backgroundColor:
                      Platform.OS === 'ios' && showInactive
                        ? '#fff'
                        : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [{ scale: Platform.OS == 'ios' ? 0.6 : 1 }],
                  }}
                >
                  <Checkbox
                    status={showInactive ? 'checked' : 'unchecked'}
                    onPress={() => setShowInactive(!showInactive)}
                    color={
                      Platform.OS === 'ios'
                        ? theme.colors.brand.primary
                        : '#fff'
                    }
                    uncheckedColor="#eee"
                  />
                </View>
              </InactiveToggleContainer>

              <MotiView
                from={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
              >
                <StatsCard>
                  <StatsIcon>
                    <MotiView
                      from={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10 }}
                    >
                      <StatsText>💳</StatsText>
                    </MotiView>
                  </StatsIcon>

                  <StatsContent>
                    <StatsText>
                      {showInactive
                        ? activeTab === 'Subscriptions'
                          ? inactiveSubscriptions.length
                          : inactiveDeposits.length
                        : activeTab === 'Subscriptions'
                        ? subscriptions.length
                        : deposits.length}{' '}
                      {showInactive ? 'InActive' : 'Active'}{' '}
                      {activeTab === 'Subscriptions'
                        ? 'Subscriptions'
                        : 'Deposits'}
                    </StatsText>
                    <StatsSubtext>
                      Apprx Total: ${calculateTotalMonthlySpend().toFixed(2)}
                      /month
                    </StatsSubtext>
                  </StatsContent>
                </StatsCard>
              </MotiView>

              <FlatList
                scrollEnabled={false}
                data={
                  showInactive
                    ? activeTab === 'Subscriptions'
                      ? inactiveSubscriptions
                      : inactiveDeposits
                    : activeTab === 'Subscriptions'
                    ? subscriptions
                    : deposits
                }
                ListEmptyComponent={
                  <View
                    style={{
                      alignItems: 'center',
                      textAlign: 'center',
                      justifyContent: 'center',
                      marginTop: -50,
                    }}
                  >
                    <Image
                      source={require('../../../../../assets/no_subscriptions.png')}
                      style={{
                        width: 300,
                        height: 300,
                      }}
                      resizeMode="cover"
                    />
                    <Text
                      fontsize="16px"
                      style={{
                        color: '#fff',
                        marginLeft: 50,
                        marginTop: -20,
                      }}
                    >
                      No subscriptions found
                    </Text>
                  </View>
                }
                extraData={showInactive}
                keyExtractor={item => item.id}
                renderItem={renderSubscriptionItem}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 100,
                }}
                showsVerticalScrollIndicator={false}
              />
            </ScrollView>
          </>
        )}
      </Container>
      <RenderBlurView />
    </>
  );
};
