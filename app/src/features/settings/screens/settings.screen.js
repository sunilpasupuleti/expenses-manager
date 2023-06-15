/* eslint-disable react-hooks/exhaustive-deps */
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import React, {useContext, useEffect, useState} from 'react';
import {
  FlexColumn,
  FlexRow,
  MainWrapper,
  ToggleSwitch,
} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ProfilePicture,
  ProfileText,
  ProfileWrapper,
  Setting,
  SettingHint,
  SettingIconWrapper,
  SettingsCard,
  SettingTitle,
} from '../components/settings.styles';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {Spacer} from '../../../components/spacer/spacer.component';
import {useTheme} from 'styled-components/native';
import {SettingsCardContent} from '../components/settings.styles';
import {Text} from '../../../components/typography/text.component';
import {useDispatch, useSelector} from 'react-redux';
import {Alert, Platform, ScrollView, TouchableOpacity} from 'react-native';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {fetchExchangeRates} from '../../../store/service-slice';
import TouchID from 'react-native-touch-id';
import moment from 'moment';
import {Button, Dialog, Portal, TextInput} from 'react-native-paper';
import {notificationActions} from '../../../store/notification-slice';
import {
  resetPinCodeInternalStates,
  deleteUserPinCode,
} from '@haskkor/react-native-pincode';
import {applockActions} from '../../../store/applock-slice';
import {colors} from '../../../infrastructure/theme/colors';

export const SettingsScreen = ({navigation}) => {
  const {onLogout, userData, userAdditionalDetails} = useContext(
    AuthenticationContext,
  );
  const isAppLockEnabled = useSelector(state => state.applock.enabled);

  const [isDailyBackUpEnabled, setIsDailyBackUpEnabled] = useState(
    userAdditionalDetails?.dailyBackup
      ? userAdditionalDetails.dailyBackup
      : null,
  );

  let date = new Date();
  if (userAdditionalDetails?.dailyReminder?.enabled) {
    let time = userAdditionalDetails.dailyReminder.time;
    let splited = time.split(':');
    let hr = splited[0];
    let min = splited[1];
    date.setHours(Number(hr));
    date.setMinutes(Number(min));
  }
  const [isDailyReminderEnabled, setIsDailyReminderEnabled] = useState({
    enabled: userAdditionalDetails?.dailyReminder?.enabled
      ? userAdditionalDetails.dailyReminder.enabled
      : false,
    time: date,
  });
  const [showPicker, setShowPicker] = useState(false);

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    onExportData,
    onImportData,
    onExportAllSheetsToExcel,
    onExportAllDataToPdf,
    onUpdateDailyReminder,
    onUpdateDailyBackup,
  } = useContext(SheetsContext);
  const changesMade = useSelector(state => state.service.changesMade.status);
  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Settings',
      headerRight: () => (
        <Ionicons
          onPress={() => navigation.goBack()}
          style={{marginRight: 10}}
          name="close-circle-outline"
          size={30}
          color={theme.colors.brand.primary}
        />
      ),
      headerLeft: () => null,
    });
  }, []);

  const onSetScreenLock = async () => {
    if (isAppLockEnabled) {
      await deleteUserPinCode('@expenses-manager-app-lock');
      await resetPinCodeInternalStates();
      dispatch(
        applockActions.setEnabledStatus({
          enabled: false,
        }),
      );
      dispatch(
        notificationActions.showToast({
          status: 'success',
          message: 'App Lock Disabled',
        }),
      );
    } else {
      dispatch(applockActions.showChoosePinLock({type: 'choose'}));
      navigation.navigate('Applock', {
        purpose: 'setpin',
      });
    }
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
  return (
    <SafeArea>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MainWrapper>
          <Spacer size={'medium'} />
          {/* display profile and email */}
          <ProfileWrapper>
            {userData && userData.photoURL && (
              <ProfilePicture source={{uri: userData?.photoURL}} />
            )}
            {userData && userData.email && (
              <ProfileText fontfamily="heading">{userData?.email}</ProfileText>
            )}
            {userData && !userData.email && userData.displayName && (
              <ProfileText fontfamily="heading">
                {userData.displayName}
              </ProfileText>
            )}
          </ProfileWrapper>

          {/* for sync card */}
          <SettingsCard>
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
                            disable: true,
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
                                  backgroundColor: theme.colors.brand.secondary,
                                  padding: 15,
                                  paddingTop: 10,
                                  paddingBottom: 10,
                                  borderRadius: 10,
                                }}
                                onPress={() => setShowPicker(true)}>
                                <Text fontfamily="bodySemiBold" fontsize="14px">
                                  {moment(isDailyReminderEnabled.time).format(
                                    'hh:mm A',
                                  )}
                                </Text>
                              </TouchableOpacity>

                              {showPicker && (
                                <DateTimePicker
                                  mode="time"
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
                        buttonColor={theme.colors.brand.primary}
                        textColor={'#fff'}
                        onPress={() => {
                          if (userAdditionalDetails?.dailyReminder?.enabled) {
                            onUpdateDailyReminder({
                              time: isDailyReminderEnabled.time,
                              update: true,
                            });
                          } else {
                            onUpdateDailyReminder({
                              enable: true,
                              time: isDailyReminderEnabled.time,
                            });
                          }
                        }}>
                        {userAdditionalDetails?.dailyReminder?.enabled
                          ? 'Update Reminder'
                          : 'Set Reminder'}
                      </Button>
                    </FlexRow>
                  </Spacer>
                )}

                <Spacer size={'large'}>
                  <SettingHint marginLeft="0px">
                    You will get the daily notification to remind you to record
                    your daily transactions.
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
                        onUpdateDailyBackup(false, () =>
                          setIsDailyBackUpEnabled(false),
                        );
                      }
                      if (!isDailyBackUpEnabled) {
                        onUpdateDailyBackup(true, () =>
                          setIsDailyBackUpEnabled(true),
                        );
                      }
                    }}
                  />
                </Setting>

                <Spacer size={'large'}>
                  <SettingHint marginLeft="0px">
                    Your data will be backed up daily at 12:00 AM automatically.
                  </SettingHint>
                </Spacer>
              </>
            </SettingsCardContent>
          </SettingsCard>

          <Spacer size={'xlarge'}>
            <SettingsCard>
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
                      <Ionicons name="ios-moon" size={20} color="#fefefe" />
                    </SettingIconWrapper>

                    <SettingTitle>Appearance</SettingTitle>
                  </FlexRow>
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
            <SettingsCard>
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
            </SettingsCard>
          </Spacer>

          {/* another card for json imports */}
          <Spacer size={'large'}>
            <SettingsCard>
              <Spacer size={'large'}>
                <SettingHint marginLeft="10px">
                  If you have this exported JSON file, you can easily import all
                  the data from it in the future. You may transfer this file to
                  a user who is also using this app or use it to read the data
                  on another device.
                </SettingHint>
              </Spacer>
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
            </SettingsCard>
          </Spacer>

          {/* another card for logout */}
          <Spacer size={'xlarge'}>
            <SettingsCard>
              <SettingsCardContent>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#167ef5">
                      <Ionicons
                        name="md-finger-print-outline"
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

              <SettingsCardContent onPress={onRevealSecretKey}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#F47C7C">
                      <Ionicons name="ios-key-outline" size={20} color="#fff" />
                    </SettingIconWrapper>

                    <SettingTitle>Reveal your account key</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent
                onPress={() =>
                  changesMade
                    ? navigation.navigate('Sync', {backupAndSignOut: true})
                    : onLogout()
                }
                padding={'15px'}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#8c8f90">
                      <Ionicons name="log-out-outline" size={20} color="#fff" />
                    </SettingIconWrapper>

                    <SettingTitle>Sign Out</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>
              <SettingHint>
                When you sign out, your data will be immediately backed up.
              </SettingHint>
            </SettingsCard>
          </Spacer>

          <Spacer size={'large'}>
            <SettingsCard>
              <SettingsCardContent>
                <SettingHint>
                  <Text fontsize="12px" color="red">
                    CURRENCY RATES :
                  </Text>{' '}
                  The most recent currency exchange rates are only available
                  every two hours. The most recent exchange rates will be
                  displayed if you click the fetch latest button between now and
                  then.
                </SettingHint>
              </SettingsCardContent>
            </SettingsCard>
          </Spacer>
        </MainWrapper>
      </ScrollView>
    </SafeArea>
  );
};
