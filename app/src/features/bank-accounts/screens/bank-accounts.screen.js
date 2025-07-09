/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {FlexColumn, FlexRow, MainWrapper} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {BankAccountContext} from '../../../services/bank-account/bank-account.context';
import {open, create, usePlaidEmitter} from 'react-native-plaid-link-sdk';
import {Button, Card, Divider, List} from 'react-native-paper';
import {Text} from '../../../components/typography/text.component';
import {useDispatch} from 'react-redux';
import {notificationActions} from '../../../store/notification-slice';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {SocketContext} from '../../../services/socket/socket.context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {loaderActions} from '../../../store/loader-slice';

export const BankAccountsScreen = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const [institutions, setInstitutions] = useState([]);
  const {userData} = useContext(AuthenticationContext);
  const {fetchLinkToken, getLinkedBankAccounts} =
    useContext(BankAccountContext);
  const {plaidSocket} = useContext(SocketContext);
  const [showRefresh, setShowRefresh] = useState(false);
  const dispatch = useDispatch();
  const timeoutRef = useRef(null);
  const {reRender, updateAccountMode} = route.params || {};

  useEffect(() => {
    if (reRender) {
      onGetLinkedAccounts();
      navigation.setParams({reRender: false});
    }
  }, [reRender]);

  useFocusEffect(
    useCallback(() => {
      const shouldResume = route.params?.updateAccountMode;
      if (shouldResume) {
        handleOpenPlaid(true);
        navigation.setParams({updateAccountMode: false, institution: null});
      }
    }, [route.params?.updateAccountMode]),
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Bank Accounts',
    });
  }, []);

  useEffect(() => {
    if (routeIsFocused) {
      onGetLinkedAccounts();
    }
    return () => {
      clearFallbackTimeout();
    };
  }, [routeIsFocused]);

  useEffect(() => {
    console.log(
      'Current Socket:',
      plaidSocket ? 'plaid socket initialized' : 'no',
    );

    if (!plaidSocket) return;

    const unsubscribe = plaidSocket.on(
      `plaid_linked_${userData?.uid}`,
      async data => {
        if (data.success) {
          clearFallbackTimeout();
          showNotification('success', data.message);
          await onGetLinkedAccounts();
        } else {
          clearFallbackTimeout();
          dispatch(loaderActions.hideLoader());
          showNotification(
            'error',
            data.message || 'Error occured in linking bank account',
          );
        }
        console.log('Received Event:', data);
      },
    );

    return () => {
      plaidSocket.off(`plaid_linked_${userData?.uid}`, unsubscribe);
    };
  }, [plaidSocket]);

  usePlaidEmitter(event => {
    if (event?.eventName === 'EXIT') {
      dispatch(loaderActions.hideLoader());
      showNotification('warning', 'Process cancelled by user');
    }
  });

  const onGetLinkedAccounts = async (institution = {}) => {
    await getLinkedBankAccounts(data => {
      if (data.institutions) {
        // in update mode redirect to page
        if (
          updateAccountMode &&
          institution?.id &&
          data?.institutions?.length > 0
        ) {
          const institutionFound = data.institutions.find(
            inst => inst.institutionId === institution.id,
          );
          navigation.setParams({updateAccountMode: false, institution: null});
          navigation.navigate('BankDetails', {
            institution: institutionFound,
          });
        }
        setShowRefresh(false);
        setInstitutions(data.institutions);
      }
    });
  };

  const getLinkToken = async (updateMode = false) => {
    return new Promise(async (resolve, reject) => {
      let data = {
        platform: Platform.OS,
      };
      const accessToken = route.params?.institution?.accessToken || null;
      if (updateMode && accessToken) {
        data.accessToken = accessToken;
        data.updateMode = true;
      }

      fetchLinkToken(
        data,
        res => {
          resolve(res.linkToken);
        },
        err => {
          reject(err);
        },
      );
    });
  };

  const showNotification = (status = 'error', message) => {
    dispatch(
      notificationActions.showToast({
        status: status,
        message: message,
      }),
    );
  };

  const plaidLinkTimeoutFallback = () => {
    timeoutRef.current = setTimeout(() => {
      dispatch(loaderActions.hideLoader());
      showNotification(
        'info',
        "Bank linking is taking longer than expected. If completed, tap 'Refresh' to see your accounts.",
      );
      setShowRefresh(true); // optional button
    }, 10000);
  };

  const clearFallbackTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePlaidSuccess = async success => {
    try {
      console.log(success);

      if (success?.metadata?.institution && updateAccountMode) {
        onGetLinkedAccounts(success.metadata.institution);
      } else {
        // If socket doesnot work fallback and not in update mode
        plaidLinkTimeoutFallback();
      }
    } catch (err) {}
  };

  const handleOpenPlaid = async (updateMode = false) => {
    try {
      const linkToken = await getLinkToken(updateMode);
      await create({
        token: linkToken,
      });
      dispatch(
        loaderActions.showLoader({
          loaderType: 'linkBank',
          backdrop: true,
        }),
      );
      await open({
        onSuccess: handlePlaidSuccess,
        onExit: exit => {
          navigation.setParams({updateAccountMode: false, institution: null});
          clearFallbackTimeout();
          if (exit?.error?.displayMessage || exit?.error?.errorCode) {
            showNotification(
              'error',
              exit.error.displayMessage || exit.error.errorCode,
            );
          }
        },
      });
    } catch (error) {
      console.error('Error handling Plaid:', error);
      showNotification('error', error.toString());
    }
  };

  const onNavigateToBankDetails = item => {
    navigation.navigate('BankDetails', {institution: item});
  };

  const renderInstitution = ({item}) => {
    const showFixButton = item.needsUpdate;
    return (
      <View style={{marginBottom: 10}}>
        <TouchableOpacity onPress={() => onNavigateToBankDetails(item)}>
          <List.Item
            titleStyle={{
              fontWeight: '500',
            }}
            title={item.institutionName}
            description={item.accounts.length + ' accounts'}
            left={() => (
              <Image
                source={
                  item.institutionLogo
                    ? {
                        uri: `data:image/png;base64,${item.institutionLogo}`,
                      }
                    : require('../../../../assets/bank.png')
                }
                style={{
                  width: 35,
                  height: 35,
                  marginLeft: 10,
                  resizeMode: 'contain',
                }}
              />
            )}
            right={() =>
              showFixButton ? (
                <Button
                  icon="alert-circle"
                  mode="outlined"
                  buttonColor="#fff"
                  textColor="tomato"
                  style={{
                    borderColor: 'tomato',
                    borderWidth: 1,
                    borderRadius: 8,
                  }}
                  onPress={() => {
                    navigation.setParams({
                      updateAccountMode: true,
                      institution: item,
                    });
                  }}>
                  Action Required
                </Button>
              ) : (
                <MaterialCommunityIcons
                  name={'chevron-right'}
                  size={20}
                  color="#aaa"
                />
              )
            }
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeArea child={true}>
      <MainWrapper>
        <Button
          icon={'link'}
          mode="contained"
          style={{
            borderRadius: 5,
          }}
          textColor="#fff"
          uppercase
          onPress={handleOpenPlaid}
          buttonColor="#426F42">
          Link NEW Bank Account
        </Button>
        <View style={{marginTop: 10, paddingHorizontal: 10}}>
          <FlexRow style={{alignItems: 'flex-start'}}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color={theme.colors.text.secondary}
              style={{marginTop: 2}}
            />
            <Text
              style={{
                marginLeft: 6,
                marginBottom: 20,
                color: theme.colors.text.secondary,
                fontSize: 13,
                lineHeight: 18,
              }}>
              Your transaction data may not be up to date. It will be updated
              periodically based on your bank's refresh schedule. {'\n\n'}
              🔧 This feature is currently in development mode. More
              functionality is coming soon! {'\n\n'}
              💳 Currently supports limited banks. To view supported banks or
              add an account, tap **"Add Account"** on the main screen.
            </Text>
          </FlexRow>
        </View>

        {institutions && institutions.length > 0 ? (
          <>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={institutions}
              renderItem={renderInstitution}
              keyExtractor={institution => institution.institutionId}
              ItemSeparatorComponent={Divider}
            />
          </>
        ) : (
          <FlexColumn style={{marginBottom: 250}}>
            <Image
              source={require('../../../../assets/no_accounts.png')}
              style={{
                width: '80%',
                height: '80%',
                resizeMode: 'contain',
              }}
            />
            <Text fontsize="20px">No Accounts Found</Text>
          </FlexColumn>
        )}
        {showRefresh && (
          <Button
            mode="outlined"
            onPress={onGetLinkedAccounts}
            style={{marginBottom: 16}}
            icon="refresh">
            Refresh Accounts
          </Button>
        )}
      </MainWrapper>
    </SafeArea>
  );
};
