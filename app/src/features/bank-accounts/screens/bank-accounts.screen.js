/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Image,
  Platform,
  TouchableOpacity,
  View,
  StatusBar,
  Easing,
} from 'react-native';
import { useTheme } from 'styled-components/native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { BankAccountContext } from '../../../services/bank-account/bank-account.context';
import { open, create, usePlaidEmitter } from 'react-native-plaid-link-sdk';
import { useDispatch, useSelector } from 'react-redux';
import { loaderActions } from '../../../store/loader-slice';
import { notificationActions } from '../../../store/notification-slice';
import { AuthenticationContext } from '../../../services/authentication/authentication.context';
import { SocketContext } from '../../../services/socket/socket.context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import LinearGradient from 'react-native-linear-gradient';

import {
  Container,
  Header,
  Title,
  StyledFlatList,
  InstitutionCard,
  InstitutionLogo,
  InstitutionInfo,
  InstitutionName,
  InstitutionAccounts,
} from './bank-accounts.styles';
import { Text } from '../../../components/typography/text.component';
import { Animated } from 'react-native';
import { ScrollView } from 'react-native';
import { FlexRow } from '../../../components/styles';
import { Button } from 'react-native-paper';
import { RenderBlurView } from '../../../components/utility/safe-area.component';

// Bank icons - you can replace these with your actual bank icon assets
const bankIcons = [
  require('../../../../assets/banks/chase.png'), // JPMorgan Chase
  require('../../../../assets/banks/bankofamerica.png'), // Bank of America
  require('../../../../assets/banks/wellsfargo.png'), // Wells Fargo
  require('../../../../assets/banks/citibank.png'), // Citibank
  require('../../../../assets/banks/capitalone.png'), // Capital One
  require('../../../../assets/banks/amex.png'), // American Express
  require('../../../../assets/banks/pnc.png'), // PNC Bank

  require('../../../../assets/banks/td.png'), // TD Bank
  require('../../../../assets/banks/rbc.png'), // Royal Bank of Canada
  require('../../../../assets/banks/bmo.png'), // Bank of Montreal (BMO)
  require('../../../../assets/banks/cibc.png'), // CIBC
  require('../../../../assets/banks/scotiabank.png'), // Scotiabank

  require('../../../../assets/banks/hsbc.png'), // HSBC
  require('../../../../assets/banks/barclays.png'), // Barclays
  require('../../../../assets/banks/santander.png'), // Santander

  require('../../../../assets/banks/ally.png'), // Ally Bank
];
const BankAccountsEmptyState = ({
  onConnectPress,
  hasExistingAccounts = false,
}) => {
  const scrollAnim1 = useRef(new Animated.Value(0)).current;
  const scrollAnim2 = useRef(new Animated.Value(0)).current;

  const firstRowIcons = bankIcons.slice(0, bankIcons.length / 2);
  const secondRowIcons = bankIcons.slice(bankIcons.length / 2);

  useEffect(() => {
    const totalWidth = bankIcons.length * 60; // icon width + margin

    const loopScroll = (anim, reverse = false) => {
      anim.setValue(reverse ? -totalWidth / 2 : 0);
      Animated.timing(anim, {
        toValue: reverse ? 0 : -totalWidth / 2,
        duration: 12000, // Slightly slower for better visibility
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(() => loopScroll(anim, reverse));
    };

    loopScroll(scrollAnim1, false);
    loopScroll(scrollAnim2, true);
  }, [scrollAnim1, scrollAnim2]);

  return (
    <View
      style={{
        marginTop: hasExistingAccounts ? 0 : 50,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 800,
        }}
        style={{
          width: '100%',
          maxWidth: 380,
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.6)']}
          style={{
            borderRadius: 20,
            width: '100%',
            maxWidth: 380,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View
            style={{
              padding: 25,
              alignItems: 'center',
            }}
          >
            {/* Row 1 - Scrolling Bank Icons */}
            <View
              style={{
                height: 60,
                overflow: 'hidden',
                width: '100%',
                marginBottom: 10,
              }}
            >
              <Animated.View
                style={{
                  flexDirection: 'row',
                  transform: [{ translateX: scrollAnim1 }],
                }}
              >
                {firstRowIcons.concat(firstRowIcons).map((icon, index) => (
                  <View
                    key={`row1-${index}`}
                    style={{
                      width: 50,
                      height: 50,
                      marginHorizontal: 5,
                      borderRadius: 10,
                      backgroundColor: 'white',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={icon}
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 8,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </Animated.View>
            </View>

            {/* Row 2 - Scrolling Bank Icons (Reverse Direction) */}
            <View
              style={{
                height: 60,
                overflow: 'hidden',
                width: '100%',
                marginBottom: 25,
              }}
            >
              <Animated.View
                style={{
                  flexDirection: 'row',
                  transform: [{ translateX: scrollAnim2 }],
                }}
              >
                {secondRowIcons.concat(secondRowIcons).map((icon, index) => (
                  <View
                    key={`row2-${index}`}
                    style={{
                      width: 50,
                      height: 50,
                      marginHorizontal: 5,
                      borderRadius: 10,
                      backgroundColor: 'white',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={icon}
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 8,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </Animated.View>
            </View>

            {!hasExistingAccounts && (
              <>
                <Text
                  style={{
                    color: '#111',
                    fontSize: 24,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  Connect Your Banks
                </Text>
                <Text
                  style={{
                    color: '#444',
                    fontSize: 15,
                    textAlign: 'center',
                    marginBottom: 25,
                    lineHeight: 22,
                  }}
                >
                  Link your bank accounts to get a complete view of your
                  finances and manage everything in one place
                </Text>
              </>
            )}

            <TouchableOpacity onPress={onConnectPress} activeOpacity={0.85}>
              <LinearGradient
                colors={['#7b2ff7', '#f107a3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 25,
                  shadowColor: '#7b2ff7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: 16,
                    textAlign: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 45,
                  }}
                >
                  {hasExistingAccounts
                    ? 'Add New Bank Account'
                    : 'Connect Your Bank'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </MotiView>
    </View>
  );
};

export const BankAccountsScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const appState = useSelector(state => state.service.appState);

  const routeIsFocused = useIsFocused();
  const [institutions, setInstitutions] = useState([]);
  const { userData } = useContext(AuthenticationContext);
  const { fetchLinkToken, getLinkedBankAccounts, unlinkAccount } =
    useContext(BankAccountContext);
  const { plaidSocket } = useContext(SocketContext);
  const dispatch = useDispatch();
  const timeoutRef = useRef(null);
  const [updateAccountMode, setUpdateAccountMode] = useState(false);
  const [updateAccountModeInstitution, setUpdateAccountModeInstitution] =
    useState(false);

  const showNotification = (status = 'error', message) => {
    dispatch(notificationActions.showToast({ status, message }));
  };

  useFocusEffect(
    useCallback(() => {
      if (route.params?.updateAccountMode && route?.params?.institution) {
        setUpdateAccountMode(true);
        setUpdateAccountModeInstitution(route.params.institution);
      }
    }, [route.params?.updateAccountMode]),
  );

  const onUnlinkAccount = institution => {
    unlinkAccount(
      {
        accessToken: institution.accessToken,
      },
      () => {
        onGetLinkedAccounts();
      },
    );
  };

  useEffect(() => {
    if (updateAccountMode && updateAccountModeInstitution) {
      handleOpenPlaid(true);
    }
  }, [updateAccountMode]);

  useEffect(() => {
    if (routeIsFocused) onGetLinkedAccounts();
    return () => clearTimeout(timeoutRef.current);
  }, [routeIsFocused]);

  useEffect(() => {
    if (!plaidSocket) return;
    const unsubscribe = plaidSocket.on(
      `plaid_linked_${userData?.uid}`,
      async data => {
        clearTimeout(timeoutRef.current);
        if (data.success) {
          showNotification('success', data.message);
          await onGetLinkedAccounts();
        } else {
          showNotification(
            'error',
            data.message || 'Error linking bank account',
          );
        }
      },
    );
    return () => plaidSocket.off(`plaid_linked_${userData?.uid}`, unsubscribe);
  }, [plaidSocket]);

  usePlaidEmitter(event => {
    if (event?.eventName === 'EXIT') {
      setUpdateAccountMode(false);
      dispatch(loaderActions.hideLoader());
      showNotification('warning', 'Process cancelled by user');
    }
  });

  const onGetLinkedAccounts = async () => {
    await getLinkedBankAccounts(data => {
      setInstitutions(data.institutions || []);
    });
  };

  const getLinkToken = async (updateMode = false) => {
    let data = { platform: Platform.OS };
    const accessToken = updateAccountModeInstitution?.accessToken;
    if (updateMode && accessToken) {
      data.accessToken = accessToken;
      data.updateMode = true;
    }
    return new Promise((resolve, reject) => {
      fetchLinkToken(
        data,
        res => resolve(res.linkToken),
        err => reject(err),
      );
    });
  };

  const handleOpenPlaid = async (updateMode = false) => {
    try {
      const linkToken = await getLinkToken(updateMode);
      setUpdateAccountMode(false);
      setUpdateAccountModeInstitution(null);
      await create({ token: linkToken });
      dispatch(
        loaderActions.showLoader({ loaderType: 'linkBank', backdrop: true }),
      );
      await open({ onSuccess: onGetLinkedAccounts, onExit: () => {} });
    } catch (error) {
      showNotification('error', error.toString());
    }
  };

  const renderInstitution = ({ item }) => {
    const showFixButton = item.needsUpdate;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <InstitutionCard
          onPress={() =>
            showFixButton
              ? null
              : navigation.navigate('BankDetails', { institution: item })
          }
        >
          <InstitutionLogo
            source={
              item.institutionLogo
                ? { uri: `data:image/png;base64,${item.institutionLogo}` }
                : require('../../../../assets/bank.png')
            }
          />
          <InstitutionInfo>
            <InstitutionName>{item.institutionName}</InstitutionName>
            <InstitutionAccounts>
              {item.accounts.length} accounts linked
            </InstitutionAccounts>
            {showFixButton && (
              <View style={{ marginTop: 10, gap: 8 }}>
                <Button
                  icon="refresh-circle"
                  mode="outlined"
                  buttonColor="#fff"
                  textColor="#FF6B35"
                  style={{
                    borderColor: '#FF6B35',
                    borderWidth: 1,
                    borderRadius: 8,
                  }}
                  onPress={() => {
                    setUpdateAccountMode(true);
                    setUpdateAccountModeInstitution(item);
                  }}
                >
                  Re-authentication Required
                </Button>

                <Button
                  icon="trash-can"
                  mode="outlined"
                  buttonColor="#fff"
                  textColor="#EF4444"
                  style={{
                    borderColor: '#EF4444',
                    borderWidth: 1,
                    borderRadius: 8,
                  }}
                  onPress={() => onUnlinkAccount(item)}
                >
                  Unlink Bank
                </Button>
              </View>
            )}
          </InstitutionInfo>

          {!showFixButton && (
            <Ionicons name="chevron-forward" size={20} color="#888" />
          )}
        </InstitutionCard>
      </MotiView>
    );
  };

  return (
    <>
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
              }}
            >
              <Ionicons
                name="chevron-back-outline"
                size={25}
                color="white"
                style={{ marginRight: 10 }}
              />
              <Text color={'#fff'} fontsize="20px">
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onGetLinkedAccounts}
              style={{
                padding: 8,
                borderRadius: 20,
                marginRight: 20,
                top: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={20} color="white" />
            </TouchableOpacity>
          </FlexRow>
        </SafeAreaView>

        {institutions.length > 0 ? (
          <ScrollView>
            <BankAccountsEmptyState
              onConnectPress={handleOpenPlaid}
              hasExistingAccounts={true}
            />
            <StyledFlatList
              data={institutions}
              scrollEnabled={false}
              keyExtractor={item => item.institutionId}
              renderItem={renderInstitution}
            />
          </ScrollView>
        ) : (
          <>
            <Header>
              <Title>Manage{'\n'}Bank Accounts</Title>
            </Header>
            <BankAccountsEmptyState onConnectPress={handleOpenPlaid} />
          </>
        )}
      </Container>
      <RenderBlurView />
    </>
  );
};
