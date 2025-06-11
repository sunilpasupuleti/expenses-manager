/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useCallback, useContext, useEffect, useState} from 'react';
import {TouchableOpacity, useWindowDimensions} from 'react-native';
import {useTheme} from 'styled-components/native';
import {SheetsInfo} from '../components/sheet-info/sheet-info.component';
import {
  AddSheetIcon,
  IconsContainer,
  LastSyncedContainer,
  NewSheet,
  NoSheets,
  TopContainer,
  UpperIcon,
} from '../components/sheets.styles';
import {Spacer} from '../../../components/spacer/spacer.component';
import {Input, MainWrapper} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import _ from 'lodash';
import {
  getNextEmiAcrossAccounts,
  searchKeywordRegex,
} from '../../../components/utility/helper';
import {useIsFocused} from '@react-navigation/native';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import {DailyStoryCard} from '../../story/components/dailyStory.component';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useSharedValue,
} from 'react-native-reanimated';
import {Image, View} from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Carousel, {Pagination} from 'react-native-reanimated-carousel';
import SheetCardSkeleton from '../components/sheet-card-skeleton.component';

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
        style={{marginTop: 16}}
        renderItem={({item}) => (
          <TouchableOpacity onPress={item.onPress}>
            <LinearGradient
              colors={item.gradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{
                borderRadius: 16,
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
  const {onGetAndSetCurrentSheet} = useContext(SheetsContext);
  const {userAdditionalDetails, userData} = useContext(AuthenticationContext);
  const [showSearch, setShowSearch] = useState(false);
  const [forceShowRecap, setForceShowRecap] = useState(false);
  const [carouselCards, setCarouselCards] = useState(carouselCardsData);

  const onClickSheet = async sheetId => {
    await onGetAndSetCurrentSheet(sheetId);
    navigation.navigate('SheetDetailsHome', {
      screen: 'Dashboard',
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
            onClickSheet(due.sheetId);
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
          <View />
          <IconsContainer>
            {!isLoading && (
              <>
                <TouchableOpacity onPress={() => setShowSearch(prev => !prev)}>
                  <MaterialIcons
                    style={{
                      marginTop: 20,
                      marginLeft: 20,
                    }}
                    name="search"
                    size={25}
                    color={theme.colors.brand.primary}
                  />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('BankAccounts', {
                  screen: 'BankAccountsHome',
                })
              }>
              <MaterialCommunityIcons
                style={{
                  marginTop: 20,
                  marginLeft: 20,
                }}
                name="bank"
                size={25}
                color={theme.colors.brand.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Settings', {screen: 'Sync'})}>
              <UpperIcon
                name="cloud-offline-outline"
                size={25}
                color={theme.colors.brand.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <UpperIcon
                name="cog-outline"
                size={30}
                color={theme.colors.brand.primary}
              />
            </TouchableOpacity>
          </IconsContainer>
        </TopContainer>
        {showSearch && (
          <Animated.View
            entering={FadeInDown.duration(300).springify()}
            exiting={FadeOutUp.duration(200)}>
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
        <DailyStoryCard
          forceShowRecap={forceShowRecap}
          setForceShowRecap={setForceShowRecap}
        />

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
              There are no accounts yet. Create a new account by clicking on
              plus icon.
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

        <NewSheet onPress={() => navigation.navigate('AddSheet')}>
          <AddSheetIcon name="add-outline" size={25} color="#fff" />
        </NewSheet>
      </MainWrapper>
    </SafeArea>
  );
};
