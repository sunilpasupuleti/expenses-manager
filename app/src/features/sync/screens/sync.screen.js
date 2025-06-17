import Ionicons from 'react-native-vector-icons/Ionicons';
import momentTz from 'moment-timezone';
import React, {useContext, useEffect, useState} from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
import {getTimeZone} from 'react-native-localize';
import _ from 'lodash';
import {LastSyncedContainer} from '../../sheets/components/sheets.styles';
import moment from 'moment';

export const SyncScreen = ({navigation, route}) => {
  const theme = useTheme();
  const {
    backUpData,
    restoreData,
    onGetRestoreDates,
    onGetRestoresFromiCloud,
    onRestoreFromiCloud,
    onBackupToiCloud,
    onDeleteBackupFromiCloud,
  } = useContext(SyncContext);
  const {onLogout} = useContext(AuthenticationContext);

  const [showModal, setShowModal] = useState(false);
  const [showiCloudModal, setShowiCloudModal] = useState(false);
  const [showiCloudDeleteModal, setShowiCloudDeleteModal] = useState(false);

  const [restoreDates, setRestoreDates] = useState([]);
  const [iCloudRestoreDates, setiCloudRestoreDates] = useState([]);
  const {userAdditionalDetails} = useContext(AuthenticationContext);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Back up and Restore',
      headerRight: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{marginRight: 20}}>
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
    (async () => {
      if (route.params && route.params.backupAndSignOut) {
        let result = await backUpData();
        if (result) {
          onLogout();
        }
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
    restoreData();
  };

  const onPressGetRestoreDates = async () => {
    const result = await onGetRestoreDates();
    if (result) {
      setRestoreDates(result);
      setShowModal(true);
    }
  };

  const getRestoreDatesFromiCloud = async type => {
    const files = await onGetRestoresFromiCloud();
    setiCloudRestoreDates(files);
    if (type && type === 'delete') {
      setShowiCloudDeleteModal(true);
    } else {
      setShowiCloudModal(true);
    }
  };

  const showDeleteConfirmDialog = backup => {
    return Alert.alert(
      'Are your sure?',
      'Are you sure you want to remove this backup file from your iCloud?',
      [
        // The "No" button
        // Does nothing but dismiss the dialog when tapped
        {
          text: 'No',
        },

        // The "Yes" button
        {
          text: 'Yes',
          onPress: () => {
            setShowiCloudDeleteModal(false);
            onDeleteBackupFromiCloud(backup);
          },
        },
      ],
    );
  };

  return (
    <SafeArea child={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MainWrapper>
          {Platform.OS === 'ios' && (
            <Spacer size={'large'}>
              <SettingsCard
                style={{backgroundColor: theme.colors.bg.card, margin: 1}}>
                <SettingsCardContent onPress={onBackupToiCloud}>
                  <Setting justifyContent="space-between">
                    <FlexRow>
                      <SettingIconWrapper color="#3171A8">
                        <Ionicons name="cloud-outline" size={20} color="#fff" />
                      </SettingIconWrapper>
                      <SettingTitle>Backup to iCloud</SettingTitle>
                    </FlexRow>
                    <Ionicons name="chevron-forward" size={25} color="#aaa" />
                  </Setting>
                </SettingsCardContent>
                <SettingsCardContent onPress={getRestoreDatesFromiCloud}>
                  <Setting justifyContent="space-between">
                    <FlexRow>
                      <SettingIconWrapper color="#4FBA97">
                        <Ionicons
                          name="refresh-circle-outline"
                          size={20}
                          color="#fff"
                        />
                      </SettingIconWrapper>
                      <SettingTitle>Restore from iCloud</SettingTitle>
                    </FlexRow>
                    <Ionicons name="chevron-forward" size={25} color="#aaa" />
                  </Setting>
                </SettingsCardContent>
                <SettingsCardContent
                  onPress={() => getRestoreDatesFromiCloud('delete')}>
                  <Setting justifyContent="space-between">
                    <FlexRow>
                      <SettingIconWrapper color="tomato">
                        <Ionicons
                          name="close-circle-outline"
                          size={20}
                          color="#fff"
                        />
                      </SettingIconWrapper>
                      <SettingTitle>Delete backup from iCloud</SettingTitle>
                    </FlexRow>
                    <Ionicons name="chevron-forward" size={25} color="#aaa" />
                  </Setting>
                </SettingsCardContent>
              </SettingsCard>
            </Spacer>
          )}

          <Spacer size={'xlarge'}>
            <SettingsCard
              style={{backgroundColor: theme.colors.bg.card, margin: 1}}>
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
                      <Ionicons name="sync-outline" size={20} color="#fff" />
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
                    <SettingTitle>Restore from previous Backups</SettingTitle>
                  </FlexRow>
                  <Ionicons name="chevron-forward" size={25} color="#aaa" />
                </Setting>
              </SettingsCardContent>
            </SettingsCard>
          </Spacer>

          <Spacer size="xlarge" />
          {userAdditionalDetails?.lastSynced && (
            <LastSyncedContainer>
              <Text color={'green'} fontfamily="bodyBold" fontsize="14px">
                Last Synced :{' '}
                {moment(userAdditionalDetails.lastSynced).calendar()}
              </Text>
            </LastSyncedContainer>
          )}

          <Text variantType="caption" style={styles.hint}>
            <Text style={styles.hintHeading}> BACKUP : </Text> Your data will be
            backed up.
          </Text>
          <Text variantType="caption" style={styles.hint}>
            <Text style={styles.hintHeading}> RESTORE :</Text> Data from your
            most recent backup will be recovered. If you make any new changes,
            please create a backup in order to prevent data loss.
          </Text>

          <Text variantType="caption" style={styles.hint}>
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
                  maxHeight: '100%',
                }}>
                <ScrollView>
                  {restoreDates.map((backup, i) => {
                    const {date, time} = backup;
                    return (
                      <TouchableHighlightWithColor
                        key={i}
                        onPress={() => {
                          setShowModal(false);
                          restoreData(backup);
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

          {iCloudRestoreDates &&
            iCloudRestoreDates.length > 0 &&
            showiCloudModal && (
              <Portal>
                <Modal
                  visible={showiCloudModal}
                  onDismiss={() => setShowiCloudModal(false)}
                  contentContainerStyle={{
                    backgroundColor: theme.colors.ui.body,
                    minHeight: '40%',
                    maxHeight: '100%',
                  }}>
                  <ScrollView>
                    {iCloudRestoreDates.map((backup, i) => {
                      const {date, time} = backup;

                      return (
                        <TouchableHighlightWithColor
                          key={i}
                          onPress={() => {
                            setShowiCloudModal(false);
                            onRestoreFromiCloud(backup);
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

          {iCloudRestoreDates &&
            iCloudRestoreDates.length > 0 &&
            showiCloudDeleteModal && (
              <Portal>
                <Modal
                  visible={showiCloudDeleteModal}
                  onDismiss={() => setShowiCloudDeleteModal(false)}
                  contentContainerStyle={{
                    backgroundColor: theme.colors.ui.body,
                    minHeight: '40%',
                    maxHeight: '100%',
                  }}>
                  <ScrollView>
                    {iCloudRestoreDates.map((backup, i) => {
                      const {date, time, fileName} = backup;

                      return (
                        <View style={{padding: 15}} key={i}>
                          <FlexRow justifyContent="space-between">
                            <View>
                              <Text style={{padding: 5}}>
                                {date}, {time}
                              </Text>
                            </View>

                            <Ionicons
                              onPress={() => showDeleteConfirmDialog(backup)}
                              name="trash-outline"
                              size={28}
                              color="tomato"
                            />
                          </FlexRow>
                          <Divider />
                        </View>
                      );
                    })}
                  </ScrollView>
                </Modal>
              </Portal>
            )}
        </MainWrapper>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  hint: {marginTop: 20, fontSize: 14, color: '#aaa'},
  hintHeading: {fontSize: 14, color: '#555'},
});
