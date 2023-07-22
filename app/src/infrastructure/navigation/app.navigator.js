import React from 'react';

import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import {Dimensions} from 'react-native';
import {Notification} from '../../components/utility/Notification';
import {SheetsContextProvider} from '../../services/sheets/sheets.context';
import {SyncContextProvider} from '../../services/sync/sync.context';
import {SettingsNavigator} from './settings.navigator';
import {SheetsNavigator} from './sheets.navigator';
import {AppLockScreen} from '../../features/applock/screens/applock.screen';
import {ProfileContextProvider} from '../../services/profile/profile.context';
import {SmsTransactions} from '../../components/utility/SmsTransactions';
import {useTheme} from 'react-native-paper';
import {SelectBaseCurrency} from '../../components/utility/SelectBaseCurrency';
const Stack = createStackNavigator();

export const AppNavigator = () => {
  const theme = useTheme();
  return (
    <>
      <SheetsContextProvider>
        <SyncContextProvider>
          <ProfileContextProvider>
            <SmsTransactions />

            <SelectBaseCurrency />

            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}>
              <Stack.Screen name="Sheets" component={SheetsNavigator} />
              <Stack.Screen
                options={{
                  headerMode: 'screen',
                  gestureResponseDistance:
                    Dimensions.get('window').height - 200,
                  ...TransitionPresets.ModalPresentationIOS,
                }}
                name="Settings"
                component={SettingsNavigator}
              />

              <Stack.Screen name="Applock" component={AppLockScreen} />
            </Stack.Navigator>
          </ProfileContextProvider>
        </SyncContextProvider>
      </SheetsContextProvider>

      <Notification />
    </>
  );
};
