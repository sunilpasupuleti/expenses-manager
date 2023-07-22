/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/react-in-jsx-scope */
import {Image, Platform} from 'react-native';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import Onboarding from 'react-native-onboarding-swiper';
import {useTheme} from 'styled-components/native';
import {useRef} from 'react';
import {useDispatch} from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {setOnBoarding} from '../../../store/service-slice';

export const OnBoarding = ({navigation, navigate}) => {
  let theme = useTheme();

  const onBoardingRef = useRef();

  const dispatch = useDispatch();

  const AndroidPages = [
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{height: 350, width: 350, resizeMode: 'contain'}}
          source={require('../../../../assets/onboarding/1.png')}
        />
      ),
      title: 'Welcome to Expenses Manager. Track your Expenses.',
      subtitle:
        'Effortlessly manage finances with our simple tool for tracking expenses and staying on budget',
    },
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{height: 350, width: 350, resizeMode: 'contain'}}
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
          style={{height: 350, width: 350, resizeMode: 'contain'}}
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
          style={{height: 350, width: 350, resizeMode: 'contain'}}
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
          style={{height: 350, width: 350, resizeMode: 'contain'}}
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
          style={{height: 350, width: 350, resizeMode: 'contain'}}
          source={require('../../../../assets/onboarding/1.png')}
        />
      ),
      title: 'Welcome to Expenses Manager. Track your Expenses.',
      subtitle:
        'Effortlessly manage finances with our simple tool for tracking expenses and staying on budget',
    },
    {
      backgroundColor: theme.colors.brand.primary,
      image: (
        <Image
          style={{height: 350, width: 350, resizeMode: 'contain'}}
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
          style={{height: 350, width: 350, resizeMode: 'contain'}}
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
          style={{height: 350, width: 350, resizeMode: 'contain'}}
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

  const Next = ({isLight, ...props}) => {
    return (
      <MaterialCommunityIcons
        name={'arrow-right'}
        size={20}
        style={{
          backgroundColor: '#fff',
          padding: 10,
          borderRadius: 50,
          marginRight: 10,
        }}
        color={theme.colors.brand.primary}
        {...props}
      />
    );
  };

  const Done = ({isLight, ...props}) => {
    return (
      <MaterialCommunityIcons
        name={'check-all'}
        size={20}
        style={{
          backgroundColor: '#fff',
          padding: 10,
          borderRadius: 50,
          marginRight: 10,
        }}
        color={theme.colors.brand.primary}
        {...props}
      />
    );
  };

  return (
    <Onboarding
      controlStatusBar={false}
      NextButtonComponent={Next}
      DoneButtonComponent={Done}
      skipToPage={pages.length - 1}
      onDone={onDone}
      ref={onBoardingRef}
      pages={pages}
    />
  );
};
