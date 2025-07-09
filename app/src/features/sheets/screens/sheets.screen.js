/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {useTheme} from 'styled-components/native';
import {SheetsInfo} from '../components/sheet-info/sheet-info.component';
import {
  AiButton,
  HeaderRow,
  LastSyncedContainer,
  NavIconButton,
  NavIconCircle,
  NavigationBar,
  NavLabel,
  NoSheets,
  Search,
  SearchIcon,
  TopContainer,
} from '../components/sheets.styles';
import {Spacer} from '../../../components/spacer/spacer.component';
import {Input, MainWrapper} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import _ from 'lodash';
import {getNextEmiAcrossAccounts} from '../../../components/utility/helper';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import moment from 'moment';
import {DailyStoryCard} from '../../story/components/dailyStory.component';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {Image, View} from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Carousel, {Pagination} from 'react-native-reanimated-carousel';
import SheetCardSkeleton from '../components/sheet-card-skeleton.component';
import aiIcon from '../../../../assets/ai_icon.png';
import Svg, {Path} from 'react-native-svg';

const CarouselInfoCards = ({cardsData = [], theme}) => {
  const {width} = useWindowDimensions();
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
        style={{marginTop: 20}}
        renderItem={({item}) => (
          <TouchableOpacity onPress={item.onPress}>
            <LinearGradient
              colors={item.gradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{
                borderRadius: 20,
                marginHorizontal: 8,
                height: '100%',
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Image
                source={item.image}
                style={{
                  width: 100,
                  height: 100,
                  marginRight: 12,
                  marginLeft: 10,
                }}
                resizeMode="contain"
              />
              <View style={{flex: 1}}>
                <Text
                  fontfamily="headingBold"
                  color={'#fcfdfe'}
                  fontsize="16px"
                  style={{marginBottom: 4}}>
                  {item.title}
                </Text>
                <Text fontsize="13px" color={'#fdf3ff'}>
                  {item.subtitle}
                </Text>
                <Spacer size="medium" />
                <Text
                  fontsize="13px"
                  style={{
                    color: '#ffffff',
                    textDecorationLine: 'underline',
                    fontWeight: '500',
                  }}>
                  {item.cta}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
  const {userAdditionalDetails, userData} = useContext(AuthenticationContext);
  const [showSearch, setShowSearch] = useState(false);
  const [forceShowRecap, setForceShowRecap] = useState(false);
  const [carouselCards, setCarouselCards] = useState(carouselCardsData);

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

  const aiGlow = useSharedValue(1);

  useEffect(() => {
    aiGlow.value = withRepeat(withTiming(1.1, {duration: 1000}), -1, true);
  }, []);

  const aiButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: aiGlow.value}],
      shadowColor: '#fff',
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 10,
    };
  });

  useEffect(() => {
    if (loanSheets && loanSheets.length > 0) {
      const upcomingDues = getNextEmiAcrossAccounts(loanSheets);

      let cards = _.cloneDeep(carouselCardsData);

      upcomingDues.forEach(due => {
        cards.push({
          title: `${due.name} - Upcoming EMI`,
          subtitle: `Scheduled for ${moment(due.date).format(
            'dddd (MMM DD, YYYY)',
          )}`,
          cta: 'View Loan Details →',
          gradient: ['#f77062', '#fe5196', '#ff758c'],
          image: require('../../../../assets/emi-due.png'),
          onPress: () => {
            onClickSheet(due.sheet);
          },
        });
      });

      setCarouselCards(cards);
    } else {
      setCarouselCards(carouselCardsData);
    }
  }, [loanSheets]);

  return (
    <SafeArea>
      <MainWrapper>
        {/* <AnimatedInfoCard onPress={() => setForceShowRecap(true)} /> */}
        <CarouselInfoCards cardsData={carouselCards} theme={theme} />
        <TopContainer
          lastSynced={userAdditionalDetails?.lastSynced ? true : false}>
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
              }>
              <NavIconCircle style={{backgroundColor: '#F59E0B'}}>
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
              }>
              <NavIconCircle style={{backgroundColor: '#3b82f6'}}>
                <MaterialCommunityIcons name="bank" size={20} color="white" />
              </NavIconCircle>
              <NavLabel>Bank</NavLabel>
            </NavIconButton>

            <NavIconButton
              onPress={() => navigation.navigate('Settings', {screen: 'Sync'})}>
              <NavIconCircle style={{backgroundColor: '#607D8B'}}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={20}
                  color="white"
                />
              </NavIconCircle>
              <NavLabel>Sync</NavLabel>
            </NavIconButton>

            <NavIconButton onPress={() => navigation.navigate('Settings')}>
              <NavIconCircle style={{backgroundColor: '#4682B4'}}>
                <Ionicons name="cog-outline" size={18} color="white" />
              </NavIconCircle>
              <NavLabel>Settings</NavLabel>
            </NavIconButton>

            <NavIconButton
              onPress={() => {
                navigation.navigate('AddSheet');
              }}>
              <NavIconCircle
                style={{backgroundColor: theme.colors.brand.primary}}>
                <Ionicons name="add" size={18} color="white" />
              </NavIconCircle>
              <NavLabel>Add </NavLabel>
            </NavIconButton>
          </NavigationBar>
        </TopContainer>
        <Spacer size="medium" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{borderRadius: 15}}>
          {showSearch && (
            <Animated.View entering={FadeInDown.duration(300).springify()}>
              <Spacer size="medium">
                <Input
                  value={searchKeyword}
                  theme={{roundness: 10}}
                  style={{elevation: 2, marginBottom: 20}}
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
              <Search
                onPress={() => {
                  setShowSearch(prev => !prev);
                }}>
                <SearchIcon name="search" size={15} color="#fff" />
              </Search>
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
              <Text style={{textAlign: 'center'}}>
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
          underlayColor={'#aaa'}
          onPress={() => navigation.navigate('ChatBot')}>
          <Animated.View style={aiButtonAnimatedStyle}>
            <View style={{alignItems: 'flex-end'}}>
              <AiButton>
                <Image
                  source={aiIcon}
                  style={{width: 25, height: 25, marginRight: 5}}
                  resizeMode="contain"
                />
                <Text fontsize="14px" fontfamily="bodyBold" color="black">
                  Ask Aura
                </Text>
              </AiButton>
              <Svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                style={{
                  position: 'absolute',
                  bottom: 10, // adjust as needed
                  right: 11, // align flush to the bubble edge
                }}>
                <Path
                  d="M0,0 C5,0 10,8 15,15 C17,17 18,18 20,20 L0,20 Z"
                  fill="#ffffff"
                />
              </Svg>
            </View>
          </Animated.View>
        </TouchableHighlight>
      </MainWrapper>
    </SafeArea>
  );
};
