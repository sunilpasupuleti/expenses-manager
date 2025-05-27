import React, {useCallback} from 'react';

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
import {SelectBaseCurrency} from '../../components/utility/SelectBaseCurrency';
import {SettingsContextProvider} from '../../services/settings/settings.context';
import {AvoidSoftInput} from 'react-native-avoid-softinput';
import {useFocusEffect} from '@react-navigation/native';
import {useTheme} from 'styled-components/native';
import {CategoriesContextProvider} from '../../services/categories/categories.context';
import {SheetDetailsContextProvider} from '../../services/sheetDetails/sheetDetails.context';
import {BankAccountContextProvider} from '../../services/bank-account/bank-account.context';
import {BankAccountNavigator} from './bank-account.navigator';
import {navigate} from './rootnavigation';
import {PlaidOAuthRedirectScreen} from '../../features/bank-accounts/components/plaid-oauth-redirect.screen';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const theme = useTheme();

  const onFocusEffect = useCallback(() => {
    // This should be run when screen gains focus - enable the module where it's needed
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    AvoidSoftInput.setEnabled(true);
    return () => {
      // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
      AvoidSoftInput.setEnabled(false);
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, []);

  useFocusEffect(onFocusEffect);

  return (
    <>
      <BankAccountContextProvider>
        <CategoriesContextProvider>
          <SheetsContextProvider>
            <SheetDetailsContextProvider>
              <SettingsContextProvider>
                <SyncContextProvider>
                  <ProfileContextProvider>
                    <SmsTransactions />

                    <SelectBaseCurrency />

                    <Stack.Navigator
                      screenOptions={{
                        headerShown: false,
                      }}>
                      <Stack.Screen name="Sheets" component={SheetsNavigator} />

                      {/* Used just for Plaid OAUthRedirection */}
                      <Stack.Screen
                        name="PlaidOAuthRedirect"
                        component={PlaidOAuthRedirectScreen}
                      />

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

                      <Stack.Screen
                        options={{headerShown: false, headerMode: 'screen'}}
                        name="BankAccounts"
                        component={BankAccountNavigator}
                      />
                      <Stack.Screen name="Applock" component={AppLockScreen} />
                    </Stack.Navigator>
                  </ProfileContextProvider>
                </SyncContextProvider>
              </SettingsContextProvider>
            </SheetDetailsContextProvider>
          </SheetsContextProvider>
        </CategoriesContextProvider>
      </BankAccountContextProvider>
    </>
  );
};
