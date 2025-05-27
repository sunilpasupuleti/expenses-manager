/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useIsFocused} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AuthenticationContext} from '../../../../services/authentication/authentication.context';
import {BankAccountContext} from '../../../../services/bank-account/bank-account.context';
import {FlexRow, MainWrapper} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {notificationActions} from '../../../../store/notification-slice';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {Button, Divider, List} from 'react-native-paper';
import {View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Spacer} from '../../../../components/spacer/spacer.component';
import moment from 'moment';
import {loaderActions} from '../../../../store/loader-slice';
import {StickyButtonContainer} from '../../components/bank-details/bank-details.styles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export const BankDetailsScreen = ({navigation, route}) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const routeIsFocused = useIsFocused();
  const {institution} = route.params;

  const {userData} = useContext(AuthenticationContext);
  const insets = useSafeAreaInsets();

  const {getAccountBalance, unlinkAccount} = useContext(BankAccountContext);

  const dispatch = useDispatch();

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
          params: {reRender: true},
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

  const renderAccountItem = ({item}) => (
    <List.Item
      title={`${item.name}`}
      titleStyle={styles.accountTitle}
      titleNumberOfLines={2}
      descriptionStyle={{
        color: '#aaa',
        fontSize: 12,
      }}
      description={() => (
        <View>
          <Text color={'#aaa'} variantType="caption">
            {item.subtype}
          </Text>

          <FlexRow gap={5}>
            <Button
              icon={'wallet-outline'}
              mode="elevated"
              buttonColor="#4CAF50"
              textColor="#fff"
              onPress={() => onCheckBalance(item)}
              contentStyle={{
                paddingHorizontal: 8,
              }}
              style={styles.actionBtn}>
              Balance
            </Button>
            <Button
              icon="swap-horizontal"
              mode="outlined"
              style={[styles.actionBtn, styles.transactionBtn]}
              onPress={() => onNavigateToTransactions(item)}>
              Transactions
            </Button>
          </FlexRow>
        </View>
      )}
      right={() => (
        <Text fontsize="12px" style={{marginLeft: 1}}>
          XXXX- {item.mask}
        </Text>
      )}
      left={() => (
        <Image
          source={getAccountIcon(item.subtype)}
          style={styles.accountIcon}
        />
      )}
    />
  );

  return (
    <SafeArea child={true}>
      <MainWrapper>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={institution.accounts}
          renderItem={renderAccountItem}
          keyExtractor={account => account.account_id}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
          }}
        />
        <StickyButtonContainer insets={insets}>
          <Button
            icon={'bank-outline'}
            mode="contained"
            style={styles.bottomBtn}
            buttonColor={theme.colors.brand.primary}
            textColor="#fff"
            onPress={onManageAccount}>
            Manage Accounts
          </Button>
          <Button
            icon={'trash-can'}
            mode="contained"
            buttonColor="tomato"
            textColor="#fff"
            onPress={onUnlinkAccount}
            style={styles.bottomBtn}>
            Remove Bank
          </Button>
        </StickyButtonContainer>
      </MainWrapper>
    </SafeArea>
  );
};

const makeStyles = theme =>
  StyleSheet.create({
    logo: {
      width: 30,
      height: 30,
      marginRight: 10,
      resizeMode: 'contain',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    accountTitle: {
      fontWeight: '500',
    },
    accountIcon: {
      width: 30,
      height: 30,
      marginLeft: 10,
      resizeMode: 'contain',
    },
    actionBtn: {
      borderRadius: 10,
      marginTop: 10,
    },
    transactionBtn: {
      marginLeft: 5,
      borderColor: theme.colors.brand.primary,
    },
    bottomBtn: {
      flex: 1,
      marginHorizontal: 5,
      borderRadius: 10,
      height: 50,
      justifyContent: 'center',
    },
  });
