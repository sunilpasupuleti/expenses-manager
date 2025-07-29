/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useIsFocused} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {MotiView} from 'moti';
import {SafeAreaView} from 'react-native-safe-area-context';
import Lottie from 'lottie-react-native';

import {FlexColumn, FlexRow, MainWrapper} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import _ from 'lodash';
import successCheckJson from '../../../../../assets/lottie/success_check.json';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// Import new styled components
import {
  Container,
  ScrollContainer,
  SuccessCard,
  LottieContainer,
  Title,
  InstitutionHeader,
  InstitutionLogo,
  InstitutionTitle,
  AccountSubtitle,
  BalanceSection,
  SectionTitle,
  BalanceText,
  BalanceRow,
  BalanceIcon,
  BalanceContent,
  DoneButtonWrapper,
  DoneButton,
  DoneButtonText,
  BackButton,
  BackButtonText,
} from '../../components/bank-details/bank-balance.styles';

export const BankBalanceScreen = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const {account, institution} = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  // Preserve all existing useEffect hooks exactly as they were
  useEffect(() => {
    if (routeIsFocused) {
    } else {
    }
  }, [routeIsFocused]);

  // Helper function to get balance icon and color
  const getBalanceIcon = (type, section) => {
    switch (section) {
      case 'available':
        return {icon: 'wallet', color: '#10b981', bgColor: '#d1fae5'};
      case 'limit':
        return {icon: 'card-outline', color: '#3b82f6', bgColor: '#dbeafe'};
      case 'current':
        return type === 'credit'
          ? {icon: 'alert-circle', color: '#ef4444', bgColor: '#fee2e2'}
          : {icon: 'trending-up', color: '#10b981', bgColor: '#d1fae5'};
      case 'loan':
        return {icon: 'home', color: '#f59e0b', bgColor: '#fef3c7'};
      case 'investment':
        return {icon: 'trending-up', color: '#10b981', bgColor: '#d1fae5'};
      default:
        return {icon: 'wallet', color: '#6b7280', bgColor: '#f3f4f6'};
    }
  };

  return (
    <Container>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="#8B5CF6"
      />

      <SafeAreaView edges={['top']}>
        <BackButton onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="white" />
          <BackButtonText>Back</BackButtonText>
        </BackButton>
      </SafeAreaView>

      <ScrollContainer
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}>
        <MotiView
          from={{opacity: 0, scale: 0.8}}
          animate={{opacity: 1, scale: 1}}
          transition={{type: 'timing', duration: 800}}>
          <SuccessCard>
            <LottieContainer>
              <Lottie
                source={successCheckJson}
                autoPlay
                loop={false}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            </LottieContainer>

            <Title>Balance Fetched Successfully</Title>

            <InstitutionHeader>
              <InstitutionLogo
                source={
                  institution.institutionLogo
                    ? {
                        uri: `data:image/png;base64,${institution.institutionLogo}`,
                      }
                    : require('../../../../../assets/bank.png')
                }
              />
              <InstitutionTitle>{institution.institutionName}</InstitutionTitle>
            </InstitutionHeader>

            <AccountSubtitle>
              {_.capitalize(account.subtype)} - XXXX-{account.mask}
            </AccountSubtitle>
          </SuccessCard>
        </MotiView>

        {/* Available Balance */}
        <MotiView
          from={{opacity: 0, translateY: 20}}
          animate={{opacity: 1, translateY: 0}}
          transition={{delay: 200, type: 'timing', duration: 600}}>
          <BalanceSection>
            <BalanceRow>
              <BalanceIcon
                bgColor={getBalanceIcon(account.type, 'available').bgColor}>
                <Ionicons
                  name={getBalanceIcon(account.type, 'available').icon}
                  size={24}
                  color={getBalanceIcon(account.type, 'available').color}
                />
              </BalanceIcon>
              <BalanceContent>
                <SectionTitle>Available Balance</SectionTitle>
                <BalanceText
                  color={getBalanceIcon(account.type, 'available').color}>
                  {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
                  {GetCurrencyLocalString(account.balances.available)}
                </BalanceText>
              </BalanceContent>
            </BalanceRow>
          </BalanceSection>
        </MotiView>

        {/* Credit Card Specific Balances */}
        {account.type === 'credit' && (
          <>
            <MotiView
              from={{opacity: 0, translateY: 20}}
              animate={{opacity: 1, translateY: 0}}
              transition={{delay: 400, type: 'timing', duration: 600}}>
              <BalanceSection>
                <BalanceRow>
                  <BalanceIcon
                    bgColor={getBalanceIcon(account.type, 'limit').bgColor}>
                    <Ionicons
                      name={getBalanceIcon(account.type, 'limit').icon}
                      size={24}
                      color={getBalanceIcon(account.type, 'limit').color}
                    />
                  </BalanceIcon>
                  <BalanceContent>
                    <SectionTitle>Total Credit Limit</SectionTitle>
                    <BalanceText
                      color={getBalanceIcon(account.type, 'limit').color}>
                      {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
                      {GetCurrencyLocalString(account.balances.limit)}
                    </BalanceText>
                  </BalanceContent>
                </BalanceRow>
              </BalanceSection>
            </MotiView>

            <MotiView
              from={{opacity: 0, translateY: 20}}
              animate={{opacity: 1, translateY: 0}}
              transition={{delay: 600, type: 'timing', duration: 600}}>
              <BalanceSection>
                <BalanceRow>
                  <BalanceIcon
                    bgColor={getBalanceIcon(account.type, 'current').bgColor}>
                    <Ionicons
                      name={getBalanceIcon(account.type, 'current').icon}
                      size={24}
                      color={getBalanceIcon(account.type, 'current').color}
                    />
                  </BalanceIcon>
                  <BalanceContent>
                    <SectionTitle
                      color={getBalanceIcon(account.type, 'current').color}>
                      Outstanding Due
                    </SectionTitle>
                    <BalanceText
                      color={getBalanceIcon(account.type, 'current').color}>
                      {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
                      {GetCurrencyLocalString(account.balances.current)}
                    </BalanceText>
                  </BalanceContent>
                </BalanceRow>
              </BalanceSection>
            </MotiView>
          </>
        )}

        {/* Loan Specific Balance */}
        {account.type === 'loan' && (
          <MotiView
            from={{opacity: 0, translateY: 20}}
            animate={{opacity: 1, translateY: 0}}
            transition={{delay: 400, type: 'timing', duration: 600}}>
            <BalanceSection>
              <BalanceRow>
                <BalanceIcon
                  bgColor={getBalanceIcon(account.type, 'loan').bgColor}>
                  <Ionicons
                    name={getBalanceIcon(account.type, 'loan').icon}
                    size={24}
                    color={getBalanceIcon(account.type, 'loan').color}
                  />
                </BalanceIcon>
                <BalanceContent>
                  <SectionTitle
                    color={getBalanceIcon(account.type, 'loan').color}>
                    Loan Balance
                  </SectionTitle>
                  <BalanceText
                    color={getBalanceIcon(account.type, 'loan').color}>
                    {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
                    {GetCurrencyLocalString(account.balances.current)}
                  </BalanceText>
                </BalanceContent>
              </BalanceRow>
            </BalanceSection>
          </MotiView>
        )}

        {/* Investment Specific Balance */}
        {account.type === 'investment' && (
          <MotiView
            from={{opacity: 0, translateY: 20}}
            animate={{opacity: 1, translateY: 0}}
            transition={{delay: 400, type: 'timing', duration: 600}}>
            <BalanceSection>
              <BalanceRow>
                <BalanceIcon
                  bgColor={getBalanceIcon(account.type, 'investment').bgColor}>
                  <Ionicons
                    name={getBalanceIcon(account.type, 'investment').icon}
                    size={24}
                    color={getBalanceIcon(account.type, 'investment').color}
                  />
                </BalanceIcon>
                <BalanceContent>
                  <SectionTitle
                    color={getBalanceIcon(account.type, 'investment').color}>
                    Total Investment Value
                  </SectionTitle>
                  <BalanceText
                    color={getBalanceIcon(account.type, 'investment').color}>
                    {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
                    {GetCurrencyLocalString(account.balances.current)}
                  </BalanceText>
                </BalanceContent>
              </BalanceRow>
            </BalanceSection>
          </MotiView>
        )}
      </ScrollContainer>

      <MotiView
        from={{opacity: 0, translateY: 50}}
        animate={{opacity: 1, translateY: 0}}
        transition={{delay: 800, type: 'timing', duration: 600}}>
        <DoneButtonWrapper insets={insets}>
          <DoneButton activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <DoneButtonText>Done</DoneButtonText>
          </DoneButton>
        </DoneButtonWrapper>
      </MotiView>
    </Container>
  );
};
