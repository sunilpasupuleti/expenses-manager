import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import React, {useContext, useEffect, useState} from 'react';
import {FlexRow, MainWrapper, ToggleSwitch} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import {
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {fetchExchangeRates} from '../../../store/service-slice';
import TouchID from 'react-native-touch-id';
import moment from 'moment';
import {Button} from 'react-native-paper';
import {notificationActions} from '../../../store/notification-slice';

export const SettingsScreen = ({navigation}) => {
  const {onLogout, userData, userAdditionalDetails, onUpdateUserDetails} =
    useContext(AuthenticationContext);

  const [isAppLockEnabled, setIsAppLockEnabled] = useState(
    userAdditionalDetails?.applock ? userAdditionalDetails.applock : null,
  );

  const [isDailyBackUpEnabled, setIsDailyBackUpEnabled] = useState(
    userAdditionalDetails?.dailyBackup
      ? userAdditionalDetails.dailyBackup
      : null,
  );
  const [isDailyReminderEnabled, setIsDailyReminderEnabled] = useState(
    userAdditionalDetails?.dailyReminder
      ? userAdditionalDetails.dailyReminder.enabled
      : null,
  );

  let dM = userAdditionalDetails.dailyReminder;
  const presentDate = new Date(Date.now());
  presentDate.setHours('21');
  presentDate.setMinutes('0');
  if (dM && dM.enabled) {
    let split = dM.at.split(':');
    presentDate.setHours(split[0]);
    presentDate.setMinutes(split[1]);
  }

  const [time, setTime] = useState(presentDate);
  const [showPicker, setShowPicker] = useState(false);

  const {onExportData, onImportData} = useContext(SheetsContext);
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

  useEffect(() => {
    if (isDailyReminderEnabled && Platform.OS === 'ios') {
      setShowPicker(true);
    }
    if (isDailyReminderEnabled === false) {
      onClickSetButton(null);
    }
  }, [isDailyReminderEnabled]);

  const onSetScreenLock = async () => {
    TouchID.authenticate('Authenticate to enable / disable app lock.', {})
      .then(async success => {
        // Success code
        onUpdateUserDetails({
          applock: !isAppLockEnabled ? true : null,
        });
        setIsAppLockEnabled(!isAppLockEnabled);
      })
      .catch(error => {
        Alert.alert('Sorry, error in enabling app lock');
        console.log(error, 'error in biometric settings screen');
        // Failure code
      });
  };

  const onClickSetButton = async status => {
    onUpdateUserDetails({
      dailyReminder: {
        enabled: status,
        at: moment(time).format('HH:mm'),
      },
    });
  };

  const onEnableDailyBackup = async () => {
    onUpdateUserDetails({
      dailyBackup: !isDailyBackUpEnabled,
    });
    setIsDailyBackUpEnabled(!isDailyBackUpEnabled);
  };

  const onRevealSecretKey = async () => {
    let result = false;
    await TouchID.isSupported()
      .then(r => {
        result = true;
      })
      .catch(err => {});
    if (result && isAppLockEnabled) {
      TouchID.authenticate(
        'Authenticate to reveal your account secret key.',
        {},
      )
        .then(async success => {
          Alert.alert(
            userData.uid,
            `This is the secrey key of your account in order to contact with admin in case of any issues with your account. Please, do Not share this ID with anyone.`,
          );
        })
        .catch(error => {
          console.log(
            error,
            'from settings screen reveal secret key - ',
            userData.uid,
          );
          // Failure code
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

                    <SettingTitle>Daily Reminder</SettingTitle>
                  </FlexRow>

                  <ToggleSwitch
                    value={isDailyReminderEnabled}
                    onValueChange={() => {
                      if (!isDailyReminderEnabled) {
                        onClickSetButton(true);
                      }
                      setIsDailyReminderEnabled(!isDailyReminderEnabled);
                    }}
                  />
                </Setting>

                {isDailyReminderEnabled && (
                  <Spacer size={'large'}>
                    <FlexRow justifyContent="space-between">
                      {showPicker && (
                        <DateTimePicker
                          style={{
                            width: '100%',
                            position: 'absolute',
                            right: 0,
                          }}
                          mode="time"
                          value={time}
                          onChange={(e, t) => {
                            if (e.type === 'dismissed') {
                              setShowPicker(false);
                            }
                            if (t) {
                              if (Platform.OS === 'android') {
                                setShowPicker(false);
                              }
                              setTime(t);
                            }
                          }}
                        />
                      )}

                      {Platform.OS === 'android' && (
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
                            {moment(time).format('hh:mm A')}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <Button onPress={() => onClickSetButton(true)}>
                        UPDATE REMINDER TIME
                      </Button>
                    </FlexRow>
                    <Spacer position={'bottom'} />
                  </Spacer>
                )}

                <Spacer size={'large'}>
                  <SettingHint marginLeft="0px">
                    You will get the scheduled notification to remind you to
                    record your daily transactions.
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
                    value={isDailyBackUpEnabled}
                    onValueChange={onEnableDailyBackup}
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
            </SettingsCard>
          </Spacer>

          <Spacer size={'xlarge'}>
            <SettingsCard>
              <SettingsCardContent onPress={onExportData}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#F24C4C">
                      <AntDesign name="download" size={20} color="#fefefe" />
                    </SettingIconWrapper>

                    <SettingTitle>Export data</SettingTitle>
                  </FlexRow>
                </Setting>
              </SettingsCardContent>

              <SettingsCardContent onPress={onImportData}>
                <Setting justifyContent="space-between">
                  <FlexRow>
                    <SettingIconWrapper color="#EC994B">
                      <AntDesign name="upload" size={20} color="#fefefe" />
                    </SettingIconWrapper>

                    <SettingTitle>Import data</SettingTitle>
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

                    <SettingTitle>Reveal you account key</SettingTitle>
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
                Your data will be automatically backed up during sign out.
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
                  You can get the latest updated currency rates only every two
                  hours. If you click on the fetch latest button in between this
                  time, it will show you the last fetch currency rates.
                </SettingHint>
              </SettingsCardContent>
            </SettingsCard>
          </Spacer>
        </MainWrapper>
      </ScrollView>
    </SafeArea>
  );
};
