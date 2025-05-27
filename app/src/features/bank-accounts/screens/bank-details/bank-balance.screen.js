/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {Alert, FlatList, Image, TouchableOpacity, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useIsFocused} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {FlexColumn, FlexRow, MainWrapper} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import _ from 'lodash';
import {
  BalanceText,
  DoneButton,
  DoneButtonWrapper,
  InstitutionLogo,
  InstitutionTitle,
  SectionTitle,
  Subtitle,
  Title,
} from '../../components/bank-details/bank-balance.styles';
import Lottie from 'lottie-react-native';
import successCheckJson from '../../../../../assets/lottie/success_check.json';
import {Button} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export const BankBalanceScreen = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const {account, institution} = route.params;
  const insets = useSafeAreaInsets();

  const dispatch = useDispatch();

  useEffect(() => {
    if (routeIsFocused) {
    } else {
    }
  }, [routeIsFocused]);

  return (
    <SafeArea child={false}>
      <MainWrapper>
        <FlexColumn gap={5}>
          <Lottie
            source={successCheckJson}
            autoPlay
            loop={false}
            style={{
              width: '40%',
              height: '40%',
            }}
          />

          <Title>Available Balances fetched successfully</Title>
          <FlexRow>
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
          </FlexRow>
          <Subtitle>
            {_.capitalize(account.subtype)} - {account.mask}
          </Subtitle>
          <Spacer />
          <SectionTitle color={'#aaa'} fontsize="14px">
            Available Balance
          </SectionTitle>
          <BalanceText>
            {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
            {GetCurrencyLocalString(account.balances.available)}
          </BalanceText>
          {account.type === 'credit' && (
            <>
              <Spacer />
              <SectionTitle>Total Limit</SectionTitle>
              <BalanceText>
                {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
                {GetCurrencyLocalString(account.balances.limit)}
              </BalanceText>

              <Spacer />
              <SectionTitle color={'tomato'}>Outstanding Due</SectionTitle>
              <BalanceText>
                {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
                {GetCurrencyLocalString(account.balances.current)}
              </BalanceText>
            </>
          )}
          {account.type === 'loan' && (
            <>
              <Spacer />
              <SectionTitle color={'tomato'}>Loan Balance</SectionTitle>
              <BalanceText>
                {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
                {GetCurrencyLocalString(account.balances.current)}
              </BalanceText>
            </>
          )}
          {account.type === 'investment' && (
            <>
              <Spacer />
              <SectionTitle color={'green'}>Total Value</SectionTitle>
              <BalanceText>
                {GetCurrencySymbol(account.balances.iso_currency_code)}{' '}
                {GetCurrencyLocalString(account.balances.current)}
              </BalanceText>
            </>
          )}
        </FlexColumn>
        <DoneButtonWrapper insets={insets}>
          <DoneButton onPress={() => navigation.goBack()}>Done</DoneButton>
        </DoneButtonWrapper>
      </MainWrapper>
    </SafeArea>
  );
};
