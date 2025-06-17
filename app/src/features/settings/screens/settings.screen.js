/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-hooks/exhaustive-deps */
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {FlexRow, MainWrapper, ToggleSwitch} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ManageProfileTitle,
  ProfilePicture,
  ProfilePictureActivityIndicator,
  ProfileText,
  ProfileWrapper,
  Setting,
  SettingHint,
  SettingIconWrapper,
  SettingsCard,
  SettingSubTitle,
  SettingTitle,
} from '../components/settings.styles';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {Spacer} from '../../../components/spacer/spacer.component';
import {useTheme} from 'styled-components/native';
import {SettingsCardContent} from '../components/settings.styles';
import {Text} from '../../../components/typography/text.component';
import {useDispatch, useSelector} from 'react-redux';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import {fetchExchangeRates} from '../../../store/service-slice';
import moment from 'moment';
import {notificationActions} from '../../../store/notification-slice';
import {
  resetPinCodeInternalStates,
  deleteUserPinCode,
} from '@haskkor/react-native-pincode';
import {applockActions} from '../../../store/applock-slice';
import {View} from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';
import {Button} from 'react-native-paper';
import Share from 'react-native-share';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GetCurrencySymbol} from '../../../components/symbol.currency';
import Clipboard from '@react-native-clipboard/clipboard';
import {getFirebaseAccessUrl} from '../../../components/utility/helper';
import {SettingsContext} from '../../../services/settings/settings.context';
import {SheetDetailsContext} from '../../../services/sheetDetails/sheetDetails.context';
import _ from 'lodash';

import {useIsFocused} from '@react-navigation/native';
import {WatermelonDBContext} from '../../../services/watermelondb/watermelondb.context';

export const SettingsScreen = ({navigation}) => {
  const {onLogout, userData} = useContext(AuthenticationContext);
  const {onGetSheetsAndTransactions} = useContext(SheetDetailsContext);
  const {deleteAllRecords} = useContext(WatermelonDBContext);
  const ACCOUNT_DELETION_URL = remoteConfig()
    .getValue('ACCOUNT_DELETION_URL')
    .asString();

  const PRIVACY_POLICY_URL = remoteConfig()
    .getValue('PRIVACY_POLICY_URL')
    .asString();

  const APP_STORE_URL = remoteConfig().getValue('APP_STORE_URL').asString();

  const PLAY_STORE_URL = remoteConfig().getValue('PLAY_STORE_URL').asString();

  const isAppLockEnabled = useSelector(state => state.applock.enabled);

  const [isDailyBackUpEnabled, setIsDailyBackUpEnabled] = useState(false);

  const [isAutoFetchTransactionsEnabled, setIsAutoFetchTransactionsEnabled] =
    useState(false);

  const [isDailyReminderEnabled, setIsDailyReminderEnabled] = useState({
    enabled: false,
  });
  const [showPicker, setShowPicker] = useState(false);

  const {
    onExportData,
    onImportData,
    onExportAllSheetsToExcel,
    onExportAllDataToPdf,
    onUpdateDailyReminder,
    onUpdateDailyBackup,
    onUpdateAutoFetchTransactions,
    setBaseCurrency,
  } = useContext(SettingsContext);

  const [profilePictureLoading, setProfilePictureLoading] = useState(false);
  const dispatch = useDispatch();
  const theme = useTheme();

  const [reloadImageKey, setReloadImageKey] = useState('rendomid');

  const appTheme = useSelector(state => state.service.theme);
  const themeType = useColorScheme();
  const routeIsFocused = useIsFocused();

  let darkMode =
    appTheme === 'automatic'
      ? themeType === 'light'
        ? false
        : true
      : appTheme === 'light'
      ? false
      : true;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Settings',
      headerRight: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{marginRight: 10}}>
          <Ionicons
            name="close-circle-outline"
            size={30}
            color={theme.colors.brand.primary}
          />
        </Pressable>
      ),
      headerLeft: () => null,
    });
  }, []);

  useEffect(() => {
    if (userData) {
      setReloadImageKey(Date.now());
    }
  }, [userData]);

  useEffect(() => {
    if (userData) {
      let dailyBackup = !!userData.dailyBackupEnabled;

      setIsDailyBackUpEnabled(dailyBackup);
      let autoFetch = !!userData.autoFetchTransactions;

      setIsAutoFetchTransactionsEnabled(autoFetch);
      let date = new Date();

      if (userData.dailyReminderEnabled) {
        let time = userData.dailyReminderTime;
        let splited = time.split(':');
        let hr = splited[0];
        let min = splited[1];
        date.setHours(Number(hr));
        date.setMinutes(Number(min));
      }

      let dailyReminder = {
        enabled: userData.dailyReminderEnabled ? true : false,
        time: date,
      };
      setIsDailyReminderEnabled(dailyReminder);
    }
  }, [userData]);

  const showNotification = (status = 'error', message) => {
    dispatch(
      notificationActions.showToast({
        status: status,
        message: message,
      }),
    );
  };

  const onSetScreenLock = async () => {
    if (isAppLockEnabled) {
      await deleteUserPinCode('@expenses-manager-app-lock');
      await resetPinCodeInternalStates();
      dispatch(
        applockActions.setEnabledStatus({
          enabled: false,
        }),
      );
      showNotification('success', 'App lock disabled successfully');
    } else {
      dispatch(applockActions.showChoosePinLock({type: 'choose'}));
      navigation.navigate('Applock', {
        purpose: 'setpin',
      });
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  const onRevealSecretKey = async () => {
    if (isAppLockEnabled) {
      dispatch(applockActions.showChoosePinLock({type: 'enter'}));
      navigation.navigate('Applock', {
        purpose: 'secretKey',
      });
    } else {
      Alert.alert(
        userData.uid,
        `This is the secrey key of your account in order to contact with admin in case of any issues with your account. Please, do Not share this ID with anyone.`,
        [
          {
            text: 'OK',
            style: 'cancel',
          },

          {
            text: 'COPY TO CLIPBOARD',
            style: 'cancel',
            onPress: () => {
              Clipboard.setString(userData.uid);
            },
          },
        ],
      );
    }
  };

  const onFetchExchangeRates = () => {
    dispatch(fetchExchangeRates({showAlert: true, dispatch: dispatch}));
  };

  const toggleSwithStyles = {
    backgroundColor: Platform.OS !== 'ios' && theme.colors.switchBg,
    padding: 3,
  };
  const onClickOpenAccountDeletion = () => {
    let url = '';
    if (userData && userData.uid) {
      url = ACCOUNT_DELETION_URL + `?accountKey=${userData.uid}`;
    } else {
      url = ACCOUNT_DELETION_URL;
    }

    Linking.openURL(url);
  };

  const onClickChangeBaseCurrency = () => {
    setBaseCurrency({
      dialog: true,
      currency: userData.baseCurrency,
    });
  };

  const onShareApp = async () => {
    let url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Share.open({
      title: 'Expenses Manager by Webwizard',
      message:
        'Take control of your budget! Install Expenses Manager today for easy tracking of your income and expenses ',
      url: url,
    }).catch(err => {
      console.log(err, 'error while sharing the app ');
    });
  };

  const onReviewApp = async () => {
    const openStore = () => {
      if (Platform.OS !== 'ios') {
        Linking.openURL(PLAY_STORE_URL)
          .then(() => {
            AsyncStorage.setItem(`@expenses-manager-review`, 'reviewed');
          })
          .catch(err => Alert.alert('Please check for Google Play Store'));
      } else {
        Linking.openURL(APP_STORE_URL)
          .then(() => {
            AsyncStorage.removeItem(`@expenses-manager-first-launch-date`);
          })
          .catch(err => Alert.alert('Please check for the App Store'));
      }
    };
    Alert.alert(
      'Rate us ⭐️',
      'Are you enjoying Expenses Manager? Would you like to share your review with us? This will help and motivate us a lot.',
      [
        {
          text: 'No Thanks!',
          onPress: () => console.log('No Thanks Pressed'),
          style: 'cancel',
        },
        {text: 'Sure', onPress: openStore},
      ],
      {cancelable: false},
    );
  };

  const onClickLogout = async () => {
    const proceedLogout = (transactionsExists = false) => {
      const alertOptions = [
        {
          text: 'Logout',
          onPress: async () => {
            onLogout();
          },
          style: 'default',
        },
        {
          text: 'Backup & Logout',
          onPress: async () => {
            navigation.navigate('Sync', {
              backupAndSignOut: true,
            });
          },
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'destructive',
        },
      ];
      if (!transactionsExists) {
        _.remove(alertOptions, option => option.text === 'Backup & Logout');
      }
      Alert.alert(
        'Warning : Logout Confirmation',
        'Are you sure you want to logout? All your local data will be wiped out. Please ensure you back up your data before proceeding.',
        alertOptions,
        {cancelable: false},
      );
    };
    try {
      let transactions = await onGetSheetsAndTransactions();
      const transactionExists = transactions && transactions.length > 0;
      proceedLogout(transactionExists);
    } catch (e) {
      proceedLogout();
    }
  };

  const onPressClearData = async () => {
    const onClear = async () => {
      try {
        await deleteAllRecords(false, false);
        showNotification(
          'success',
          'All accounts and transactions have been cleared.',
        );
      } catch (err) {
        console.log('Error in clearing the data', err);
        showNotification('error', err.toString());
      }
    };
    Alert.alert(
      'Clear All Data?',
      'This will delete all your accounts, transactions, and related data from the app. This action cannot be undone',
      [
        {
          text: 'Cancel',
          style: 'destructive',
        },
        {
          text: 'Clear',
          onPress: async () => {
            await onClear();
          },
          style: 'default',
        },
      ],
      {cancelable: false},
    );
  };
  return (
    <SafeArea child={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MainWrapper>
          <Spacer size={'medium'} />
          {/* display profile and email */}

          <SettingsCard style={{backgroundColor: theme.colors.bg.card}}>
            {/* Profile Card */}
            <SettingsCardContent onPress={() => navigation.navigate('Profile')}>
              <Setting justifyContent="space-between">
                <FlexRow>
                  <ProfileWrapper>
                    <>
                      {userData && userData.photoURL && (
                        <ProfilePicture
                          onLoadStart={() => setProfilePictureLoading(true)}
                          onLoad={() => setProfilePictureLoading(false)}
                          source={{
                            uri: userData.photoURL.startsWith('users/')
                              ? `${getFirebaseAccessUrl(
                                  userData.photoURL,
                                )}&time=${reloadImageKey}`
                              : userData.photoURL,
                          }}
                        />
                      )}

                      {userData && !userData.photoURL && (
                        <ProfilePicture
                          onLoadStart={() => setProfilePictureLoading(true)}
                          onLoad={() => setProfilePictureLoading(false)}
                          source={require('../../../../assets/user.png')}
                        />
                      )}
                    </>
                    {profilePictureLoading && (
                      <ProfilePictureActivityIndicator
                        animating={true}
                        color={theme.colors.brand.primary}
                      />
                    )}
                  </ProfileWrapper>
                  <View>
                    <SettingTitle>
                      {userData && userData.displayName && (
                        <ProfileText fontfamily="heading">
                          {userData.displayName}
                        </ProfileText>
                      )}

                      {userData && !userData.displayName && userData.email && (
                        <ProfileText fontfamily="heading">
                          {userData?.email}
                        </ProfileText>
                      )}
                      {userData &&
                        !userData.email &&
                        !userData.displayName &&
                        userData.phoneNumber && (
                          <ProfileText fontfamily="heading">
                            {userData.phoneNumber}
                          </ProfileText>
                        )}
                    </SettingTitle>
                    <ManageProfileTitle>Manage Profile</ManageProfileTitle>
                  </View>
                </FlexRow>
              </Setting>
            </SettingsCardContent>
          </SettingsCard>

          <Spacer size="large">
            <SettingsCard style={{backgroundColor: theme.colors.bg.card}}>
              <SettingsCardContent
                onPress={() =>
                  navigation.navigate('BankAccounts', {
                    screen: 'BankAccountsHome',
                  })
                }>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#00897B">
                      <MaterialCommunityIcons
                        name="bank-plus"
                        size={20}
                        color="#fff"
                      />
                    </SettingIconWrapper>

                    <View>
                      <SettingTitle>Manage Your Bank Accounts</SettingTitle>
                      <SettingSubTitle>
                        Securely link your accounts for auto transactions
                      </SettingSubTitle>
                    </View>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>
            </SettingsCard>
          </Spacer>
          <Spacer size={'large'}>
            <SettingsCard style={{backgroundColor: theme.colors.bg.card}}>
              {/* Sync card */}
              <SettingsCardContent onPress={() => navigation.navigate('Sync')}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#467df7">
                      <Ionicons name="sync-outline" size={20} color="#fff" />
                    </SettingIconWrapper>

                    <SettingTitle>Sync</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent>
                <>
                  <Setting justifyContent="space-between">
                    <FlexRow>
                      <SettingIconWrapper color="#F47C7C">
                        <Ionicons name="alarm-outline" size={20} color="#fff" />
                      </SettingIconWrapper>

                      <SettingTitle>Daily Reminder </SettingTitle>
                    </FlexRow>

                    <ToggleSwitch
                      style={toggleSwithStyles}
                      value={isDailyReminderEnabled.enabled}
                      onValueChange={() => {
                        if (isDailyReminderEnabled.enabled) {
                          onUpdateDailyReminder(
                            {
                              time: isDailyReminderEnabled.time,
                              enable: false,
                            },
                            // callback
                            () =>
                              setIsDailyReminderEnabled(p => ({
                                ...p,
                                enabled: false,
                              })),
                          );
                        } else {
                          setIsDailyReminderEnabled(p => ({
                            ...p,
                            enabled: !isDailyReminderEnabled.enabled,
                          }));
                        }
                      }}
                    />
                  </Setting>

                  {isDailyReminderEnabled.enabled && (
                    <Spacer size={'large'}>
                      <FlexRow justifyContent="space-between">
                        <>
                          <FlexRow justifyContent="space-between">
                            {Platform.OS === 'android' && (
                              <>
                                <TouchableOpacity
                                  style={{
                                    backgroundColor:
                                      theme.colors.brand.secondary,
                                    padding: 15,
                                    paddingTop: 10,
                                    paddingBottom: 10,
                                    borderRadius: 10,
                                  }}
                                  onPress={() => setShowPicker(true)}>
                                  <Text
                                    fontfamily="bodySemiBold"
                                    fontsize="14px">
                                    {moment(isDailyReminderEnabled.time).format(
                                      'hh:mm A',
                                    )}
                                  </Text>
                                </TouchableOpacity>

                                {showPicker && (
                                  <DateTimePicker
                                    mode="time"
                                    themeVariant={darkMode ? 'dark' : 'light'}
                                    value={isDailyReminderEnabled.time}
                                    onChange={(e, t) => {
                                      if (e.type === 'dismissed') {
                                        setShowPicker(false);
                                      }
                                      if (t) {
                                        if (Platform.OS === 'android') {
                                          setShowPicker(false);
                                        }
                                        setIsDailyReminderEnabled(p => ({
                                          ...p,
                                          time: t,
                                        }));
                                      }
                                    }}
                                  />
                                )}
                              </>
                            )}

                            {Platform.OS === 'ios' && (
                              <DateTimePicker
                                mode="time"
                                accentColor={theme.colors.brand.primary}
                                themeVariant={darkMode ? 'dark' : 'light'}
                                value={isDailyReminderEnabled.time}
                                onChange={(e, t) => {
                                  if (e.type === 'dismissed') {
                                    setShowPicker(false);
                                  }
                                  if (t) {
                                    if (Platform.OS === 'android') {
                                      setShowPicker(false);
                                    }
                                    setIsDailyReminderEnabled(p => ({
                                      ...p,
                                      time: t,
                                    }));
                                  }
                                }}
                              />
                            )}
                          </FlexRow>
                          <Spacer />
                          <Spacer size={'large'} />
                        </>

                        <Button
                          mode="contained"
                          textColor={'#fff'}
                          onPress={() => {
                            if (userData?.dailyReminderEnabled) {
                              onUpdateDailyReminder({
                                time: isDailyReminderEnabled.time,
                                enable: true,
                                update: true,
                              });
                            } else {
                              onUpdateDailyReminder({
                                enable: true,
                                time: isDailyReminderEnabled.time,
                              });
                            }
                          }}>
                          {userData?.dailyReminderEnabled
                            ? 'Update Reminder'
                            : 'Set Reminder'}
                        </Button>
                      </FlexRow>
                    </Spacer>
                  )}

                  <Spacer size={'large'}>
                    <SettingHint marginLeft="0px">
                      You'll receive a daily reminder to help you stay on top of
                      recording your transactions.
                    </SettingHint>
                  </Spacer>
                </>
              </SettingsCardContent>

              <SettingsCardContent>
                <>
                  <Setting justifyContent="space-between">
                    <FlexRow>
                      <SettingIconWrapper color="#47B5FF">
                        <MaterialCommunityIcons
                          name="backup-restore"
                          size={20}
                          color="#fff"
                        />
                      </SettingIconWrapper>

                      <SettingTitle>Daily Backup</SettingTitle>
                    </FlexRow>

                    <ToggleSwitch
                      style={toggleSwithStyles}
                      value={isDailyBackUpEnabled}
                      onValueChange={() => {
                        if (isDailyBackUpEnabled) {
                          onUpdateDailyBackup(false, () => {
                            setIsDailyBackUpEnabled(false);
                          });
                        }
                        if (!isDailyBackUpEnabled) {
                          onUpdateDailyBackup(true, () => {
                            setIsDailyBackUpEnabled(true);
                          });
                        }
                      }}
                    />
                  </Setting>
                </>
              </SettingsCardContent>
            </SettingsCard>
          </Spacer>

          <Spacer size={'xlarge'}>
            <SettingsCard style={{backgroundColor: theme.colors.bg.card}}>
              {/* categories card */}
              <SettingsCardContent
                onPress={() => navigation.navigate('Categories')}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#8c8f90">
                      <Ionicons name="list-outline" size={20} color="#fefefe" />
                    </SettingIconWrapper>

                    <SettingTitle>Manage Categories</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              {/* Appearance card */}
              <SettingsCardContent
                onPress={() => navigation.navigate('Appearance')}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="rgba(84,91,206,0.9)">
                      <Ionicons name="moon-outline" size={20} color="#fefefe" />
                    </SettingIconWrapper>

                    <SettingTitle>Appearance</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={onClickChangeBaseCurrency}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color={theme.colors.brand.secondary}>
                      <MaterialCommunityIcons
                        name="cash"
                        size={20}
                        color="#fefefe"
                      />
                    </SettingIconWrapper>

                    <SettingTitle>Change Base Currency</SettingTitle>
                  </FlexRow>

                  <Spacer position={'right'}>
                    <SettingTitle
                      style={{fontWeight: 'bold'}}
                      color={theme.colors.brand.primary}>
                      {userData && userData.baseCurrency
                        ? `${userData.baseCurrency} (${GetCurrencySymbol(
                            userData.baseCurrency,
                          )})`
                        : '-'}
                    </SettingTitle>
                  </Spacer>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={onFetchExchangeRates}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#08A405">
                      <MaterialCommunityIcons
                        name="currency-eur"
                        size={20}
                        color="#fefefe"
                      />
                    </SettingIconWrapper>

                    <SettingTitle>Fetch Latest Currency Rates</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>
            </SettingsCard>
          </Spacer>

          <Spacer size={'xlarge'}>
            <SettingsCard style={{backgroundColor: theme.colors.bg.card}}>
              <SettingsCardContent onPress={onExportAllDataToPdf}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="red">
                      <FontAwesome
                        name="file-pdf-o"
                        size={20}
                        color="#fefefe"
                      />
                    </SettingIconWrapper>

                    <SettingTitle>Export data to Pdf</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={onExportAllSheetsToExcel}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#239F61">
                      <FontAwesome
                        name="file-excel-o"
                        size={20}
                        color="#fefefe"
                      />
                    </SettingIconWrapper>

                    <SettingTitle>Export data to Excel</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={onExportData}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#F24C4C">
                      <AntDesign name="download" size={20} color="#fefefe" />
                    </SettingIconWrapper>

                    <SettingTitle>Export data to JSON file</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={onImportData}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#EC994B">
                      <AntDesign name="upload" size={20} color="#fefefe" />
                    </SettingIconWrapper>

                    <SettingTitle>Import data from JSON file</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={onPressClearData}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="red">
                      <AntDesign name="delete" size={20} color="#fefefe" />
                    </SettingIconWrapper>

                    <SettingTitle>Clear All Data</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <Spacer size={'large'}>
                <SettingHint marginLeft="10px">
                  You can quickly import all the data from this exported JSON
                  file in the future if you have it. You can use this file to
                  read the data on another device or to send it to a user who is
                  also using this app.
                </SettingHint>
              </Spacer>
            </SettingsCard>
          </Spacer>

          <Spacer size={'xlarge'}>
            <SettingsCard style={{backgroundColor: theme.colors.bg.card}}>
              <SettingsCardContent onPress={onRevealSecretKey}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#F47C7C">
                      <Ionicons name="key-outline" size={20} color="#fff" />
                    </SettingIconWrapper>

                    <SettingTitle>Reveal your account key</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={onShareApp}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color={theme.colors.brand.primary}>
                      <Ionicons
                        name="share-social-outline"
                        size={20}
                        color="#fff"
                      />
                    </SettingIconWrapper>

                    <SettingTitle>Share the App</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={onReviewApp}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color={'gold'}>
                      <MaterialCommunityIcons
                        name="star-check"
                        size={20}
                        color="#fff"
                      />
                    </SettingIconWrapper>

                    <SettingTitle>Review the App</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={openPrivacyPolicy}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color={'#757575'}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={20}
                        color="#fff"
                      />
                    </SettingIconWrapper>

                    <SettingTitle>Privacy Policy</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent
                onPress={onClickOpenAccountDeletion}
                padding={'15px'}>
                <>
                  <Setting justifyContent="space-between">
                    <FlexRow>
                      <SettingIconWrapper color="red">
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                      </SettingIconWrapper>

                      <SettingTitle>Account Deletion</SettingTitle>
                    </FlexRow>
                  </Setting>

                  <Spacer size={'large'}>
                    <SettingHint marginLeft="0px">
                      Your account and all of your data from our services will
                      be permanently destroyed. You can submit a request and
                      check the status to see if your information has been
                      deleted, but it might take some time.
                    </SettingHint>
                  </Spacer>
                </>
              </SettingsCardContent>
            </SettingsCard>
          </Spacer>

          <Spacer size={'large'}>
            <SettingsCard style={{backgroundColor: theme.colors.bg.card}}>
              <SettingsCardContent>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#167ef5">
                      <Ionicons
                        name="finger-print-outline"
                        size={20}
                        color="#fff"
                      />
                    </SettingIconWrapper>

                    <SettingTitle>Enable app lock</SettingTitle>
                  </FlexRow>

                  <ToggleSwitch
                    style={toggleSwithStyles}
                    value={isAppLockEnabled}
                    onValueChange={() => onSetScreenLock()}
                  />
                </Setting>
              </SettingsCardContent>

              {Platform.OS === 'android' && (
                <SettingsCardContent>
                  <>
                    <Setting justifyContent="space-between">
                      <FlexRow>
                        <SettingIconWrapper color="#489456">
                          <MaterialCommunityIcons
                            name="message"
                            size={20}
                            color="#fff"
                          />
                        </SettingIconWrapper>

                        <SettingTitle>Auto-Fetch Transactions</SettingTitle>
                      </FlexRow>

                      <ToggleSwitch
                        style={toggleSwithStyles}
                        value={isAutoFetchTransactionsEnabled}
                        onValueChange={() => {
                          if (isAutoFetchTransactionsEnabled) {
                            onUpdateAutoFetchTransactions(false, () =>
                              setIsAutoFetchTransactionsEnabled(false),
                            );
                          }
                          if (!isAutoFetchTransactionsEnabled) {
                            onUpdateAutoFetchTransactions(true, () => {
                              setIsAutoFetchTransactionsEnabled(true);
                            });
                          }
                        }}
                      />
                    </Setting>

                    <Spacer size={'large'}>
                      <SettingHint marginLeft="0px">
                        Transactions will automatically be retrieved from SMS,
                        and a dialogue box to add or delete them will be
                        displayed.
                      </SettingHint>
                    </Spacer>
                  </>
                </SettingsCardContent>
              )}

              <SettingsCardContent
                onPress={() => onClickLogout()}
                padding={'15px'}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#8c8f90">
                      <Ionicons name="log-out-outline" size={20} color="#fff" />
                    </SettingIconWrapper>

                    <SettingTitle>Log Out</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>
            </SettingsCard>
          </Spacer>
          <Spacer size={'xlarge'} position="bottom" />
        </MainWrapper>
      </ScrollView>
    </SafeArea>
  );
};
