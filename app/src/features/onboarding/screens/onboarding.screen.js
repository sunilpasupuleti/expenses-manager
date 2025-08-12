/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/react-in-jsx-scope */
import { Image, Platform, TouchableOpacity, View } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import styled, { useTheme } from 'styled-components/native';
import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { setOnBoarding } from '../../../store/service-slice';
import { FlexRow } from '../../../components/styles';
import { Spacer } from '../../../components/spacer/spacer.component';
import { Text } from '../../../components/typography/text.component';

const GetStartedButton = styled(TouchableOpacity)`
  background-color: #fff;
  border-radius: 50px;
  width: 180px;
  padding: 10px 20px;
  margin-right: 10px;
`;

export const OnBoarding = ({ navigation, navigate }) => {
  let theme = useTheme();

  const onBoardingRef = useRef();

  const dispatch = useDispatch();

  const AndroidPages = [
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{ height: 350, width: 350, resizeMode: 'contain' }}
          source={require('../../../../assets/onboarding/1.png')}
        />
      ),
      title: 'Welcome to Expenses Aura. Track your Expenses.',
      subtitle:
        'Effortlessly manage finances with our simple tool for tracking expenses and staying on budget',
    },
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{ height: 350, width: 350, resizeMode: 'contain' }}
          source={require('../../../../assets/onboarding/2.png')}
        />
      ),
      title: 'Data Encryption 🔐',
      subtitle:
        'No worries, your data is encrypted with utmost safety and can only be accessed by you.',
    },
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{ height: 350, width: 350, resizeMode: 'contain' }}
          source={require('../../../../assets/onboarding/3.png')}
        />
      ),
      title: 'SMS Expense Tracker',
      subtitle:
        'Automatically fetches, categorizes, and logs transactions from SMS notifications instantly',
    },
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{ height: 350, width: 350, resizeMode: 'contain' }}
          source={require('../../../../assets/onboarding/4.png')}
        />
      ),
      title: 'Export Options',
      subtitle:
        'Effortlessly export account data - Pdf, Excel, Json - with date filters for seamless analysis.',
    },
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{ height: 350, width: 350, resizeMode: 'contain' }}
          source={require('../../../../assets/onboarding/5.png')}
        />
      ),
      title: 'Daily Reminder & Backup Alerts',
      subtitle:
        'Stay informed with daily reminders and backups alerts, ensuring you never miss important updates.',
    },
  ];

  const IOSPages = [
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{ height: 350, width: 350, resizeMode: 'contain' }}
          source={require('../../../../assets/onboarding/1.png')}
        />
      ),
      title: 'Welcome to Expenses Aura. Track your Expenses.',
      subtitle:
        'Effortlessly manage finances with our simple tool for tracking expenses and staying on budget',
    },
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{ height: 350, width: 350, resizeMode: 'contain' }}
          source={require('../../../../assets/onboarding/2.png')}
        />
      ),
      title: 'Data Encryption 🔐',
      subtitle:
        'No worries, your data is encrypted with utmost safety and can only be accessed by you.',
    },
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{ height: 350, width: 350, resizeMode: 'contain' }}
          source={require('../../../../assets/onboarding/4.png')}
        />
      ),
      title: 'Export Options',
      subtitle:
        'Effortlessly export account data - Pdf, Excel, Json - with date filters for seamless analysis.',
    },
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{ height: 350, width: 350, resizeMode: 'contain' }}
          source={require('../../../../assets/onboarding/5.png')}
        />
      ),
      title: 'Daily Reminder & Backup Alerts',
      subtitle:
        'Stay informed with daily reminders and backups alerts, ensuring you never miss important updates.',
    },
  ];

  let pages = Platform.OS === 'android' ? AndroidPages : IOSPages;

  const onDone = () => {
    dispatch(setOnBoarding(true));
  };

  const Next = ({ isLight, ...props }) => {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#fff',
          padding: 10,
          borderRadius: 50,
          marginRight: 10,
        }}
        {...props}
      >
        <MaterialCommunityIcons
          name={'arrow-right'}
          size={20}
          color={theme.colors.brand.primary}
        />
      </TouchableOpacity>
    );
  };

  const Dot = ({ selected, ...props }) => {
    return (
      <View
        style={{
          left: -100,
          height: 10,
          width: 10,
          borderColor: selected ? theme.colors.brand.primary : '#6570a4',
          margin: 7,
          backgroundColor: selected ? '#fff' : '#aaa',
          borderWidth: 1,
          borderRadius: 50,
        }}
      />
    );
  };

  const Done = ({ isLight, ...props }) => {
    return (
      <GetStartedButton onPress={onDone}>
        <FlexRow justifyContent="center">
          <Text fontsize="18px" color={theme.colors.brand.primary}>
            Get Started
          </Text>
          <Spacer position="left" size="large">
            <MaterialCommunityIcons
              name={'arrow-right'}
              size={20}
              color={theme.colors.brand.primary}
            />
          </Spacer>
        </FlexRow>
      </GetStartedButton>
    );
  };

  return (
    <Onboarding
      controlStatusBar={false}
      NextButtonComponent={Next}
      DoneButtonComponent={Done}
      bottomBarColor={theme.colors.brand.primary}
      showSkip={false}
      DotComponent={Dot}
      skipToPage={pages.length - 1}
      onDone={onDone}
      ref={onBoardingRef}
      pages={pages}
    />
  );
};
