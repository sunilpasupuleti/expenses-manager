import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import React, {useContext, useEffect, useState} from 'react';
import {FlexRow, MainWrapper, ToggleSwitch} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import {Alert, ScrollView, View} from 'react-native';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {fetchExchangeRates} from '../../../store/service-slice';
import TouchID from 'react-native-touch-id';

export const SettingsScreen = ({navigation}) => {
  const [isScreenLockEnabled, setIsScreenLockEnabled] = useState(false);
  const {onLogout, userData} = useContext(AuthenticationContext);
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
    (async () => {
      try {
        const result = await AsyncStorage.getItem(
          `@expenses-manager-screenlock`,
        ).then(d => {
          return JSON.parse(d);
        });
        if (result) {
          setIsScreenLockEnabled(result);
        }
      } catch (e) {
        console.log('error in fetching screen lock - ', e);
      }
    })();
  }, []);

  const onSetScreenLock = async () => {
    TouchID.authenticate('Authenticate to enable / disable app lock.', {})
      .then(async success => {
        await AsyncStorage.setItem(
          `@expenses-manager-screenlock`,
          JSON.stringify(!isScreenLockEnabled),
        );
        setIsScreenLockEnabled(!isScreenLockEnabled);
        // Success code
      })
      .catch(error => {
        Alert.alert('Sorry, error in enabling app lock');
        console.log(error, 'error in biometric settings screen');
        // Failure code
      });
  };

  const onRevealSecretKey = async () => {
    let result = await TouchID.isSupported();
    if (result) {
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
          console.log(error, 'from settings screen reveal secret key');
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
                    value={isScreenLockEnabled}
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
