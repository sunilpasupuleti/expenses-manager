import Ionicons from 'react-native-vector-icons/Ionicons';
import momentTz from 'moment-timezone';
import React, {useContext, useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {Divider, Modal, Portal} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {
  FlexRow,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {SyncContext} from '../../../services/sync/sync.context';
import {
  Setting,
  SettingIconWrapper,
  SettingsCard,
  SettingTitle,
} from '../../settings/components/settings.styles';
import {SettingsCardContent} from '../../settings/components/settings.styles';
import {loaderActions} from '../../../store/loader-slice';
import {notificationActions} from '../../../store/notification-slice';

export const SyncScreen = ({navigation, route}) => {
  const theme = useTheme();
  const {backUpData, restoreData, onGetRestoreDates} = useContext(SyncContext);
  const {onLogout, userData} = useContext(AuthenticationContext);
  const [restoreDates, setRestoreDates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const changesMade = useSelector(state => state.service.changesMade.status);
  const dispatch = useDispatch();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Back up and Restore',
      headerRight: () => (
        <Ionicons
          onPress={() => navigation.goBack()}
          style={{marginRight: 20}}
          name="close-circle-outline"
          size={30}
          color={theme.colors.brand.primary}
        />
      ),
      headerLeft: () => null,
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (route.params && route.params.backupAndSignOut) {
        if (changesMade) {
          await backUpData(false);
        }
        onLogout();
      }
    })();
  }, [route.params]);

  const onPressBackupButton = () => {
    return Alert.alert('Are you sure you want to backup the data?', '', [
      // No buton to dismiss the alert
      {
        text: 'Cancel',
        onPress: () => {},
      },
      //yes button
      {
        text: 'Backup',
        onPress: () => {
          backUpData();
        },
      },
    ]);
  };

  const onPressRestoreButton = () => {
    return Alert.alert(
      'Are you sure you want to continue ?',
      'Your data will be restored from the latest backup file. Please backup your data if you have made any changes to prevent data loss.',
      [
        // No buton to dismiss the alert
        {
          text: 'Cancel',
          onPress: () => {},
        },
        //restore button
        {
          text: 'Restore',
          onPress: () => {
            restoreData();
          },
        },
      ],
    );
  };

  const onPressGetRestoreDates = async () => {
    onGetRestoreDates(async result => {
      let backups = result.backups;
      dispatch(loaderActions.hideLoader());
      if (backups && backups.length > 0) {
        setRestoreDates(result.backups);
        setShowModal(true);
      } else {
        dispatch(
          notificationActions.showToast({
            status: 'info',
            message: 'There were no backups found to restore',
          }),
        );
      }
    });
  };

  return (
    <SafeArea>
      <MainWrapper>
        <Spacer size={'large'}>
          <SettingsCard>
            <SettingsCardContent onPress={onPressBackupButton}>
              <Setting justifyContent="space-between">
                <FlexRow>
                  <SettingIconWrapper color="#13ACFB">
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color="#fff"
                    />
                  </SettingIconWrapper>
                  <SettingTitle>Backup current data</SettingTitle>
                </FlexRow>
                <Ionicons name="chevron-forward" size={25} color="#aaa" />
              </Setting>
            </SettingsCardContent>

            <SettingsCardContent onPress={onPressRestoreButton}>
              <Setting justifyContent="space-between">
                <FlexRow>
                  <SettingIconWrapper color="#4FBA97">
                    <Ionicons name="ios-sync-outline" size={20} color="#fff" />
                  </SettingIconWrapper>
                  <SettingTitle>Restore latest data</SettingTitle>
                </FlexRow>
                <Ionicons name="chevron-forward" size={25} color="#aaa" />
              </Setting>
            </SettingsCardContent>

            <SettingsCardContent onPress={onPressGetRestoreDates}>
              <Setting justifyContent="space-between">
                <FlexRow>
                  <SettingIconWrapper color="#fb8003">
                    <Ionicons name="time-outline" size={20} color="#fff" />
                  </SettingIconWrapper>
                  <SettingTitle>Restore from specific date</SettingTitle>
                </FlexRow>
                <Ionicons name="chevron-forward" size={25} color="#aaa" />
              </Setting>
            </SettingsCardContent>
          </SettingsCard>
        </Spacer>

        <Text variant="caption" style={styles.hint}>
          <Text style={styles.hintHeading}> BACKUP : </Text> Your data will be
          backed up.
        </Text>
        <Text variant="caption" style={styles.hint}>
          <Text style={styles.hintHeading}> RESTORE :</Text> Data from your most
          recent backup will be recovered. If you make any new changes, please
          create a backup in order to prevent data loss.
        </Text>

        <Text variant="caption" style={styles.hint}>
          <Text style={styles.hintHeading}>RESTORE FROM SPECIFIC DATE :</Text>{' '}
          You have the option to recover your data from the past 10 backups.
        </Text>
        {restoreDates && restoreDates.length > 0 && (
          <Portal>
            <Modal
              visible={showModal}
              onDismiss={() => setShowModal(false)}
              contentContainerStyle={{
                backgroundColor: theme.colors.ui.body,
                minHeight: '40%',
                maxHeight: '80%',
              }}>
              <ScrollView>
                {restoreDates.map((backup, i) => {
                  let timeZone =
                    Intl.DateTimeFormat().resolvedOptions().timeZone;

                  let date = momentTz(backup.date)
                    .tz(timeZone)
                    .format('DD MMM YYYY');

                  let time = momentTz(backup.time)
                    .tz(timeZone)
                    .format('hh:mm:ss A');

                  return (
                    <TouchableHighlightWithColor
                      key={i}
                      onPress={() => {
                        setShowModal(false);
                        restoreData(backup._id);
                      }}>
                      <View>
                        <FlexRow justifyContent="space-between">
                          <Text style={{padding: 5}}>{date}</Text>
                          <Text style={{padding: 5}}>{time}</Text>
                        </FlexRow>
                        <Divider />
                      </View>
                    </TouchableHighlightWithColor>
                  );
                })}
              </ScrollView>
            </Modal>
          </Portal>
        )}
      </MainWrapper>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  hint: {marginTop: 20, fontSize: 14, color: '#aaa'},
  hintHeading: {fontSize: 14, color: '#555'},
});
