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
import {Button, Dialog, Portal, TextInput} from 'react-native-paper';
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
      ? userAdditionalDetails.dailyReminder
      : false,
  );

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [encrypted, setEncrypted] = useState(false);

  const {
    onExportData,
    onImportData,
    onExportAllSheetsToExcel,
    onExportAllDataToPdf,
    sheets,
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

  const onUpdateDailyReminder = async status => {
    onUpdateUserDetails({
      dailyReminder: status,
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

  const onClickExportDataToExcel = () => {
    let config = {
      encrypted: encrypted,
      password: password,
    };

    if (encrypted && (!password || password.trim() === '')) {
      dispatch(
        notificationActions.showToast({
          status: 'warning',
          message: 'Enter the password to protect the file continue',
        }),
      );
      return;
    }
    onExportAllSheetsToExcel(config);
    setOpen(false);
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
                      onUpdateDailyReminder(!isDailyReminderEnabled);
                      setIsDailyReminderEnabled(!isDailyReminderEnabled);
                    }}
                  />
                </Setting>

                <Spacer size={'large'}>
                  <SettingHint marginLeft="0px">
                    You will get the daily notification at 21:00 to remind you
                    to record your daily transactions.
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
                  If you have this exported JSON file, in the future simply you
                  can import all the data from the exported JSON File. You can
                  use this file inorder to read the data in another device or
                  you can send the file to other user who are using this app
                  also
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

      <Portal>
        <Dialog
          visible={open}
          onDismiss={() => {
            setOpen(false);
            setEncrypted(false);
            setPassword(false);
          }}>
          {encrypted && (
            <Dialog.Content>
              <TextInput
                secureTextEntry={!showPassword}
                theme={{roundness: 10}}
                mode="outlined"
                value={password}
                returnKeyType="done"
                onChangeText={n => {
                  // console.log(n.match(/\./).length);
                  setPassword(n.trim());
                }}
                placeholder="Enter password to protect file"
                right={
                  password && (
                    <TextInput.Icon
                      name={!showPassword ? 'eye-outline' : 'eye-off-outline'}
                      color="#bbb"
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  )
                }
                maxLength={20}
              />
            </Dialog.Content>
          )}

          {encrypted && (
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setEncrypted(false);
                  setPassword('');
                }}
                mode="outlined"
                icon={'chevron-left'}>
                Back
              </Button>
              <Spacer size={'large'} position="left" />
              <Button
                mode="contained"
                disabled={!password || password.trim() === ''}
                onPress={onClickExportDataToExcel}>
                Export
              </Button>
              <Spacer size={'large'} position="right" />
            </Dialog.Actions>
          )}

          {!encrypted && (
            <Dialog.Content>
              <FlexColumn justifyContent="center">
                <Button
                  onPress={() => setEncrypted(true)}
                  mode="contained"
                  icon={'lock'}
                  style={{backgroundColor: '#3AA75F'}}>
                  With Encryption
                </Button>
                <Spacer size={'large'} position="top">
                  <Button
                    mode="outlined"
                    onPress={onClickExportDataToExcel}
                    icon={() => (
                      <MaterialCommunityIcons
                        name="lock-open-variant"
                        color={theme.colors.brand.primary}
                        size={18}
                      />
                    )}>
                    Without Encryption
                  </Button>
                </Spacer>
              </FlexColumn>
            </Dialog.Content>
          )}
        </Dialog>
      </Portal>
    </SafeArea>
  );
};
