import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import React, {useContext, useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {Divider, Modal, Portal} from 'react-native-paper';
import {useSelector} from 'react-redux';
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

export const SyncScreen = ({navigation, route}) => {
  const theme = useTheme();
  const {backUpData, restoreData, backUpAndRestore, onGetRestoreDates} =
    useContext(SyncContext);
  const {onLogout} = useContext(AuthenticationContext);
  const [restoreDates, setRestoreDates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const changesMade = useSelector(state => state.service.changesMade.status);

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
          await backUpData();
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
    onGetRestoreDates().then(dates => {
      setRestoreDates(dates);
      setShowModal(true);
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
          <Text style={styles.hintHeading}> RESTORE :</Text> Your last backed up
          data will be restored. Please backup if you have any new changes made
          inorder to prevent data loss,
        </Text>

        <Text variant="caption" style={styles.hint}>
          <Text style={styles.hintHeading}>RESTORE FROM SPECIFIC DATE :</Text>{' '}
          You have the ability to restore your data , from last 10 previous
          backups.
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
                {restoreDates.map(d => {
                  return (
                    <TouchableHighlightWithColor
                      key={d}
                      onPress={() => {
                        setShowModal(false);
                        restoreData(d);
                      }}>
                      <View>
                        <FlexRow justifyContent="space-between">
                          <Text style={{padding: 5}}>
                            {moment(d).format('DD MMM YYYY')}
                          </Text>
                          <Text style={{padding: 5}}>
                            {moment(d).format('hh:mm:ss A')}
                          </Text>
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