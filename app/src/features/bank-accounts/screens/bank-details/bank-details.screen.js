/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  View,
} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useIsFocused} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {MotiView} from 'moti';
import {SafeAreaView} from 'react-native-safe-area-context';

import {AuthenticationContext} from '../../../../services/authentication/authentication.context';
import {BankAccountContext} from '../../../../services/bank-account/bank-account.context';
import {FlexRow} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {notificationActions} from '../../../../store/notification-slice';
import {Spacer} from '../../../../components/spacer/spacer.component';
import moment from 'moment';
import {loaderActions} from '../../../../store/loader-slice';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// Import the new styled components
import {
  Container,
  Header,
  Title,
  InstitutionHeader,
  InstitutionLogo,
  InstitutionInfo,
  InstitutionName,
  InstitutionAccounts,
  AccountCard,
  AccountContent,
  AccountHeader,
  AccountIcon,
  AccountInfo,
  AccountName,
  AccountType,
  AccountMask,
  ActionButtonsContainer,
  ActionButton,
  ActionButtonText,
  StickyButtonContainer,
  BottomButton,
  BottomButtonText,
  ScrollContainer,
  EmptyStateContainer,
  EmptyStateText,
} from '../../components/bank-details/bank-details.styles';

export const BankDetailsScreen = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const {institution} = route.params;

  const {userData} = useContext(AuthenticationContext);
  const insets = useSafeAreaInsets();

  const {getAccountBalance, unlinkAccount} = useContext(BankAccountContext);

  const dispatch = useDispatch();

  // Preserve all existing useEffect hooks exactly as they were
  useEffect(() => {
    if (routeIsFocused) {
    } else {
    }
  }, [routeIsFocused]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <FlexRow>
          {route.params?.institution?.institutionLogo && (
            <Image
              source={{
                uri: `data:image/png;base64,${route.params.institution.institutionLogo}`,
              }}
              style={{
                width: 30,
                height: 30,
                marginRight: 10,
                resizeMode: 'contain',
              }}
            />
          )}
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.colors.text.primary,
            }}>
            {route.params?.institution?.institutionName || 'Bank Details'}
          </Text>
        </FlexRow>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FlexRow>
            <Ionicons
              name="chevron-back-outline"
              size={25}
              color={theme.colors.brand.primary}></Ionicons>
            <Text color={theme.colors.brand.primary}>Back</Text>
          </FlexRow>
        </TouchableOpacity>
      ),
    });
  }, [route.params]);

  // Preserve all existing business logic functions exactly as they were
  const showNotification = (status = 'error', message) => {
    dispatch(
      notificationActions.showToast({
        status: status,
        message: message,
      }),
    );
  };

  const getAccountIcon = subtype => {
    switch (subtype) {
      case 'credit card':
        return require('../../../../../assets/credit_card.png');
      case 'savings':
        return require('../../../../../assets/savings.png');
      default:
        return require('../../../../../assets/bank.png'); // Default icon
    }
  };

  const onCheckBalance = account => {
    const data = {
      accessToken: institution.accessToken,
      accountId: account.account_id,
    };
    getAccountBalance(
      data,
      res => {
        if (res.account) {
          navigation.navigate('BankBalance', {
            account: res.account,
            institution: institution,
          });
        }
      },
      err => {
        console.log(err);
      },
    );
  };

  const onNavigateToTransactions = account => {
    navigation.navigate('BankTransactions', {
      account: account,
      institution: institution,
    });
  };

  const onUnlinkAccount = () => {
    unlinkAccount(
      {
        accessToken: institution.accessToken,
      },
      () => {
        navigation.navigate('BankAccounts', {
          screen: 'BankAccountsHome',
        });
      },
    );
  };

  const onManageAccount = () => {
    navigation.navigate('BankAccounts', {
      screen: 'BankAccountsHome',
      params: {updateAccountMode: true, institution: institution},
    });
  };

  // Redesigned renderAccountItem with new styling but same functionality
  const renderAccountItem = ({item, index}) => (
    <MotiView
      from={{opacity: 0, translateY: 20, scale: 0.95}}
      animate={{opacity: 1, translateY: 0, scale: 1}}
      transition={{
        delay: index * 100,
        type: 'timing',
        duration: 400,
      }}>
      <AccountCard activeOpacity={0.8}>
        <AccountContent>
          <AccountHeader>
            <AccountIcon source={getAccountIcon(item.subtype)} />
            <AccountInfo>
              <AccountName numberOfLines={2}>{item.name}</AccountName>
              <AccountType>{item.subtype}</AccountType>
            </AccountInfo>
            <AccountMask>XXXX-{item.mask}</AccountMask>
          </AccountHeader>

          <ActionButtonsContainer>
            <ActionButton
              primary
              activeOpacity={0.8}
              onPress={() => onCheckBalance(item)}>
              <Ionicons name="wallet-outline" size={16} color="white" />
              <ActionButtonText primary>Balance</ActionButtonText>
            </ActionButton>

            <ActionButton
              activeOpacity={0.8}
              onPress={() => onNavigateToTransactions(item)}>
              <Ionicons name="swap-horizontal" size={16} color="#8B5CF6" />
              <ActionButtonText>Transactions</ActionButtonText>
            </ActionButton>
          </ActionButtonsContainer>
        </AccountContent>
      </AccountCard>
    </MotiView>
  );

  return (
    <Container>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="#8B5CF6"
      />

      <SafeAreaView edges={['top']}>
        <FlexRow justifyContent="space-between" alignItems="center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 10,
              marginTop: 10,
            }}>
            <Ionicons
              name="chevron-back-outline"
              size={25}
              color="white"
              style={{marginRight: 10}}
            />
            <Text style={{color: '#fff', fontSize: 20}}>Back</Text>
          </TouchableOpacity>
        </FlexRow>
      </SafeAreaView>

      <MotiView
        from={{opacity: 0, translateY: 50}}
        animate={{opacity: 1, translateY: 0}}
        transition={{type: 'timing', duration: 600}}>
        <InstitutionHeader>
          <InstitutionInfo>
            <InstitutionName>{institution.institutionName}</InstitutionName>
            <InstitutionAccounts>
              {institution.accounts.length} accounts linked
            </InstitutionAccounts>
          </InstitutionInfo>
          <Spacer size="large" position="left">
            <InstitutionLogo
              source={
                institution.institutionLogo
                  ? {
                      uri: `data:image/png;base64,${institution.institutionLogo}`,
                    }
                  : require('../../../../../assets/bank.png')
              }
            />
          </Spacer>
        </InstitutionHeader>
      </MotiView>

      <ScrollContainer
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}>
        <FlatList
          scrollEnabled={false}
          data={institution.accounts}
          renderItem={renderAccountItem}
          keyExtractor={account => account.account_id}
          showsVerticalScrollIndicator={false}
        />
      </ScrollContainer>

      <StickyButtonContainer insets={insets}>
        <BottomButton activeOpacity={0.8} onPress={onManageAccount}>
          <Ionicons name="settings-outline" size={20} color="white" />
          <BottomButtonText>Manage</BottomButtonText>
        </BottomButton>

        <BottomButton danger activeOpacity={0.8} onPress={onUnlinkAccount}>
          <Ionicons name="trash-outline" size={20} color="white" />
          <BottomButtonText>Unlink Bank</BottomButtonText>
        </BottomButton>
      </StickyButtonContainer>
    </Container>
  );
};
