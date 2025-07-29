/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { SheetsInfo } from '../components/sheet-info/sheet-info.component';
import {
  AiButton,
  HeaderIcon,
  HeaderIconContainer,
  HeaderRow,
  LastSyncedContainer,
  NavIconButton,
  NavIconCircle,
  NavigationBar,
  NavLabel,
  NoSheets,
  TopContainer,
} from '../components/sheets.styles';
import { Spacer } from '../../../components/spacer/spacer.component';
import { FlexRow, Input, MainWrapper } from '../../../components/styles';
import { Text } from '../../../components/typography/text.component';
import { SafeArea } from '../../../components/utility/safe-area.component';
import _ from 'lodash';
import { getNextEmiAcrossAccounts } from '../../../components/utility/helper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import plaidCategories from '../../../components/utility/plaidCategories.json';
import { AuthenticationContext } from '../../../services/authentication/authentication.context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import moment from 'moment';
import { DailyStoryCard } from '../../story/components/dailyStory.component';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Image, View } from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import SheetCardSkeleton from '../components/sheet-card-skeleton.component';
import aiIcon from '../../../../assets/ai_icon.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetCurrencySymbol } from '../../../components/symbol.currency';
import { useIsFocused } from '@react-navigation/native';

const CarouselInfoCards = ({ cardsData = [], theme }) => {
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);

  return (
    <>
      <Carousel
        width={width - 30}
        height={130}
        onProgressChange={progress}
        loop
        autoPlay
        autoPlayInterval={6000}
        data={cardsData}
        scrollAnimationDuration={600}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => {
          const subscriptionCard = item.cardType === 'subscription';

          return (
            <TouchableOpacity onPress={item.onPress}>
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  marginHorizontal: 8,
                  height: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={item.image}
                  style={{
                    width: !subscriptionCard ? 100 : 60,
                    height: !subscriptionCard ? 100 : 60,
                    borderRadius: !subscriptionCard ? 0 : 100,
                    marginRight: 12,
                    marginLeft: 10,
                  }}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text
                    fontfamily="headingBold"
                    color={'#fcfdfe'}
                    fontsize="16px"
                    style={{ marginBottom: 4 }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    fontsize="13px"
                    color={'#fdf3ff'}
                    style={{ paddingRight: 5 }}
                  >
                    {item.subtitle}
                  </Text>
                  <Spacer size="medium" />
                  <Text
                    fontsize="13px"
                    style={{
                      color: '#ffffff',
                      textDecorationLine: 'underline',
                      fontWeight: '500',
                      paddingBottom: 5,
                    }}
                  >
                    {item.cta}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
      />
      <Pagination.Basic
        progress={progress}
        data={cardsData}
        dotStyle={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.colors.brand.secondary,
        }}
        activeDotStyle={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: theme.colors.brand.primary,
        }}
        containerStyle={{
          marginTop: 12,
          alignSelf: 'center',
          flexDirection: 'row',
          gap: 6,
        }}
      />
    </>
  );
};

export const SheetsScreen = ({
  navigation,
  route,
  regularSheets,
  pinnedSheets,
  archivedSheets,
  searchKeyword,
  setSearchKeyword,
  loanSheets,
}) => {
  let carouselCardsData = [
    {
      title: 'Track Your Savings!',
      subtitle: 'Review income and expenses from yesterday.',
      cta: ' Click here to view your recap →',
      image: require('../../../../assets/bird.png'),
      gradient: ['#74D6F2', '#A794F2', '#F2A7DE'],
      onPress: () => setForceShowRecap(true), // e.g., setForceShowRecap(true)
    },
  ];

  const theme = useTheme();
  const { userAdditionalDetails, userData } = useContext(AuthenticationContext);
  const [showSearch, setShowSearch] = useState(false);
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState([]);
  const [forceShowRecap, setForceShowRecap] = useState(false);
  const [carouselCards, setCarouselCards] = useState(carouselCardsData);

  const navAuraGlow = useSharedValue(1);

  const ringAnimation1 = useSharedValue(1);
  const microphoneBreath = useSharedValue(1);

  useEffect(() => {
    navAuraGlow.value = withRepeat(
      withTiming(1.15, { duration: 2000 }),
      -1,
      true,
    );
  }, []);

  const onClickSheet = async sheet => {
    navigation.navigate('SheetDetailsHome', {
      screen: 'Dashboard',
      sheet: sheet,
    });
  };

  const isLoading =
    regularSheets === undefined ||
    pinnedSheets === undefined ||
    loanSheets === undefined ||
    archivedSheets === undefined;

  const hasNoSheets =
    !isLoading &&
    regularSheets.length === 0 &&
    pinnedSheets.length === 0 &&
    loanSheets.length === 0 &&
    archivedSheets.length === 0;
  const routeIsFocused = useIsFocused();

  const navAuraAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: navAuraGlow.value }],
      shadowColor: '#667eea',
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 5,
    };
  });
  const ring1AnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringAnimation1.value }],
      opacity: 0.6 - (ringAnimation1.value - 1) * 2,
    };
  });

  const microphoneAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: microphoneBreath.value }],
    };
  });

  useEffect(() => {
    // Single subtle pulse ring
    ringAnimation1.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      false,
    );

    // Gentle button breathing
    microphoneBreath.value = withRepeat(
      withTiming(1.02, { duration: 2500 }),
      -1,
      true,
    );
  }, []);

  const getUpcomingSubscriptions = async () => {
    try {
      const data = await AsyncStorage.getItem(
        '@expenses-manager-subscriptions',
      );

      if (data) {
        const services = JSON.parse(data);

        if (services?.length > 0) {
          const today = moment().startOf('day');

          const validSubscriptions = services.filter(s => {
            const subscriptionDate = s.date || s.predictedNextDate;

            if (!subscriptionDate) {
              return false; // Remove if no date found
            }

            // Convert YYYY-MM-DD format to moment and compare with today
            const subscriptionMoment = moment(subscriptionDate, 'YYYY-MM-DD');

            // Keep only subscriptions that are today or in the future
            return subscriptionMoment.isSameOrAfter(today);
          });

          // Update AsyncStorage with filtered results
          if (validSubscriptions.length !== services.length) {
            // Only update if there were changes
            await AsyncStorage.setItem(
              '@expenses-manager-subscriptions',
              JSON.stringify(validSubscriptions),
            );
          }

          setUpcomingSubscriptions(validSubscriptions);
        }
      }
    } catch (error) {
      console.error(
        'Error getting upcoming subscriptions from AsyncStorage:',
        error,
      );
    }
  };

  const getShortDescription = detailedCategory => {
    const match = plaidCategories.find(
      cat => cat.detailed === detailedCategory,
    );
    return match ? match.shortDescription : '';
  };

  useEffect(() => {
    if (routeIsFocused) {
      getUpcomingSubscriptions();
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (
      (loanSheets?.length > 0 || upcomingSubscriptions?.length > 0) &&
      routeIsFocused
    ) {
      let cards = _.cloneDeep(carouselCardsData);

      if (loanSheets.length > 0) {
        const upcomingDues = getNextEmiAcrossAccounts(loanSheets);

        upcomingDues.forEach(due => {
          cards.push({
            title: `${due.name} - Upcoming EMI`,
            subtitle: `Scheduled for ${moment(due.date).format(
              'dddd (MMM DD, YYYY)',
            )}`,
            date: due.date,
            cta: 'View Loan Details →',
            gradient: ['#f77062', '#fe5196', '#ff758c'],
            image: require('../../../../assets/emi-due.png'),
            onPress: () => {
              onClickSheet(due.sheet);
            },
          });
        });
      }
      if (upcomingSubscriptions.length > 0) {
        upcomingSubscriptions.forEach(service => {
          const isInflow = service.type === 'inflow';

          const shortDescription = getShortDescription(
            service.detailedCategory,
          );
          const fullServiceName =
            `${shortDescription} (${service.serviceName})` ||
            service.serviceName ||
            service.merchantName ||
            'Unknown Service';

          const serviceName = _.truncate(fullServiceName, {
            length: 25,
            omission: '...',
          });

          const predictedNextDate = moment(service.predictedNextDate)
            .format('YYYY-MM-DD')
            .toString();

          if (!predictedNextDate) return;

          const nextDate = moment(predictedNextDate);
          const today = moment().startOf('day');
          const daysUntilNext = nextDate.diff(today, 'days');
          const amount =
            Math.abs(service.averageAmount || service.lastAmount) || 0;
          const isBase64 = !service?.originalMerchantLogo?.startsWith('http');
          const image = {
            uri: isBase64
              ? `data:image/png;base64,${
                  service.originalMerchantLogo || service.institutionLogo
                }`
              : service.originalMerchantLogo || service.institutionLogo,
          };

          cards.push({
            title: serviceName,
            subtitle: `${GetCurrencySymbol(
              service.currencyCode,
            )}${amount.toFixed(2)} ${isInflow ? 'expected to' : 'due from'} ${
              service.institutionName || 'your account'
            } ${
              daysUntilNext === 0
                ? 'today'
                : daysUntilNext === 1
                ? 'tomorrow'
                : `in ${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''}`
            } (${moment(service.predictedNextDate).format('MMM DD, YYYY')})`,
            cta: 'Check Subscription Details →',
            gradient: isInflow
              ? ['#2dd4bf', '#10b981', '#059669']
              : ['#ff9a56', '#ffad56', '#ff6b56'], // Orange for outgoing
            image: image,
            isBase64: isBase64,
            cardType: 'subscription',
            date: service.predictedNextDate || null,
            onPress: () => {
              // Navigate to subscriptions or bank details
              navigation.navigate('BankAccounts', {
                screen: 'BankAccountsHome',
                params: { screen: 'Subscriptions' },
              });
            },
          });
        });
      }

      setCarouselCards(
        _.orderBy(
          cards,
          [card => (card.date ? moment(card.date).valueOf() : Infinity)],
          ['asc'], // ascending - earliest dates first, null dates last
        ),
      );
    } else {
      setCarouselCards(carouselCardsData);
    }
  }, [loanSheets, upcomingSubscriptions]);

  return (
    <SafeArea>
      <MainWrapper>
        {/* <AnimatedInfoCard onPress={() => setForceShowRecap(true)} /> */}
        <CarouselInfoCards cardsData={carouselCards} theme={theme} />
        <TopContainer
          lastSynced={userAdditionalDetails?.lastSynced ? true : false}
        >
          <View></View>
          <NavigationBar>
            <NavIconButton
              onPress={() =>
                navigation.navigate('BankAccounts', {
                  screen: 'BankAccountsHome',
                  params: {
                    screen: 'Subscriptions',
                  },
                })
              }
            >
              <NavIconCircle style={{ backgroundColor: '#F59E0B' }}>
                <MaterialCommunityIcons
                  name="calendar-sync"
                  size={20}
                  color="white"
                />
              </NavIconCircle>
              <NavLabel>Renewals</NavLabel>
            </NavIconButton>

            <NavIconButton
              onPress={() =>
                navigation.navigate('BankAccounts', {
                  screen: 'BankAccountsHome',
                })
              }
            >
              <NavIconCircle style={{ backgroundColor: '#3b82f6' }}>
                <MaterialCommunityIcons name="bank" size={20} color="white" />
              </NavIconCircle>
              <NavLabel>Bank</NavLabel>
            </NavIconButton>

            <NavIconButton
              onPress={() =>
                navigation.navigate('Settings', { screen: 'Sync' })
              }
            >
              <NavIconCircle style={{ backgroundColor: '#607D8B' }}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={20}
                  color="white"
                />
              </NavIconCircle>
              <NavLabel>Sync</NavLabel>
            </NavIconButton>

            <NavIconButton onPress={() => navigation.navigate('Settings')}>
              <NavIconCircle style={{ backgroundColor: '#4682B4' }}>
                <Ionicons name="cog-outline" size={18} color="white" />
              </NavIconCircle>
              <NavLabel>Settings</NavLabel>
            </NavIconButton>

            <NavIconButton
              onPress={() => {
                navigation.navigate('ChatBot');
              }}
            >
              <Animated.View style={navAuraAnimatedStyle}>
                <NavIconCircle style={{ backgroundColor: '#ffffff' }}>
                  <Image
                    source={aiIcon}
                    style={{ width: 25, height: 25, marginRight: 5 }}
                    resizeMode="contain"
                  />
                </NavIconCircle>
              </Animated.View>
              <NavLabel>Aura Chat </NavLabel>
            </NavIconButton>
          </NavigationBar>
        </TopContainer>
        <Spacer size="medium" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ borderRadius: 15 }}
        >
          {showSearch && (
            <Animated.View entering={FadeInDown.duration(300).springify()}>
              <Spacer size="medium">
                <Input
                  value={searchKeyword}
                  theme={{ roundness: 10 }}
                  style={{ elevation: 2, marginBottom: 20 }}
                  placeholder="Search"
                  onChangeText={k => setSearchKeyword(k)}
                  clearButtonMode="while-editing"
                />
              </Spacer>
            </Animated.View>
          )}

          <HeaderRow>
            <View>
              <Text fontfamily="bodyBold" fontsize="30px">
                Accounts
              </Text>
              {userData?.lastSynced && (
                <LastSyncedContainer>
                  <Text color={'green'} fontfamily="bodyBold" fontsize="12px">
                    Last Synced :{' '}
                    {moment(userAdditionalDetails?.lastSynced).calendar()}
                  </Text>
                </LastSyncedContainer>
              )}
            </View>
            {!isLoading && (
              <FlexRow>
                <HeaderIconContainer
                  onPress={() => {
                    setShowSearch(prev => !prev);
                  }}
                >
                  <HeaderIcon name="search" size={15} color="#fff" />
                </HeaderIconContainer>
                <Spacer position="left" size="medium" />
                <HeaderIconContainer
                  onPress={() => {
                    navigation.navigate('AddSheet');
                  }}
                  style={{
                    backgroundColor: theme.colors.brand.primary,
                  }}
                >
                  <HeaderIcon name="add" size={15} color="#fff" />
                </HeaderIconContainer>
              </FlexRow>
            )}
          </HeaderRow>

          <Spacer size="medium" />

          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <SheetCardSkeleton key={i} colorMode="dark" />
              ))}
            </>
          ) : hasNoSheets ? (
            <NoSheets>
              <Text style={{ textAlign: 'center' }}>
                You don't have any accounts yet. Tap the add button above to
                create your first account.
              </Text>
            </NoSheets>
          ) : (
            <SheetsInfo
              navigation={navigation}
              totalCount={
                regularSheets.length +
                pinnedSheets.length +
                archivedSheets.length +
                loanSheets.length
              }
              regularSheets={regularSheets}
              pinnedSheets={pinnedSheets}
              archivedSheets={archivedSheets}
              loanSheets={loanSheets}
            />
          )}
        </ScrollView>

        <DailyStoryCard
          forceShowRecap={forceShowRecap}
          setForceShowRecap={setForceShowRecap}
        />

        <TouchableHighlight
          underlayColor={'transparent'}
          onPress={() => navigation.navigate('VoiceChat')}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            borderRadius: 50,
          }}
        >
          {/* Main Container with Subtle Glow */}
          <Animated.View
            style={[
              microphoneAnimatedStyle,
              {
                position: 'relative',
              },
            ]}
          >
            {/* Subtle Pulse Ring - Only ONE */}
            <Animated.View
              style={[
                ring1AnimatedStyle,
                {
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  borderRadius: 50,
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(102, 126, 234, 0.15)',
                },
              ]}
            />

            {/* Perfect Modern Button */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 50,
                paddingVertical: 14,
                paddingHorizontal: 18,
                minWidth: 140,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                shadowColor: '#667eea',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 12,
              }}
            >
              {/* Minimal Mic Icon */}
              <View
                style={{
                  backgroundColor: '#667eea',
                  borderRadius: 20,
                  width: 32,
                  height: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons name="mic" size={16} color="white" />
              </View>

              {/* Clean Typography */}
              <Text
                fontsize="15px"
                fontfamily="headingBold"
                color="#1a1a1a"
                style={{ letterSpacing: -0.3 }}
              >
                Talk to Aura
              </Text>
            </View>
          </Animated.View>
        </TouchableHighlight>
      </MainWrapper>
    </SafeArea>
  );
};
