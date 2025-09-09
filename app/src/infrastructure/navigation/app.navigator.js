import React, { useCallback } from 'react';

import {
  CardStyleInterpolators,
  createStackNavigator,
  TransitionPresets,
  TransitionSpecs,
} from '@react-navigation/stack';
import { Dimensions, Platform } from 'react-native';
import { SheetsContextProvider } from '../../services/sheets/sheets.context';
import { SyncContextProvider } from '../../services/sync/sync.context';
import { SettingsNavigator } from './settings.navigator';
import { SheetsNavigator } from './sheets.navigator';
import { AppLockScreen } from '../../features/applock/screens/applock.screen';
import { ProfileContextProvider } from '../../services/profile/profile.context';
import { SmsTransactions } from '../../components/utility/SmsTransactions';
import { SelectBaseCurrency } from '../../components/utility/SelectBaseCurrency';
import { SettingsContextProvider } from '../../services/settings/settings.context';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components/native';
import { CategoriesContextProvider } from '../../services/categories/categories.context';
import { SheetDetailsContextProvider } from '../../services/sheetDetails/sheetDetails.context';
import { BankAccountContextProvider } from '../../services/bank-account/bank-account.context';
import { BankAccountNavigator } from './bank-account.navigator';
import { PlaidOAuthRedirectScreen } from '../../features/bank-accounts/components/plaid-oauth-redirect.screen';
import { ChatBotContextProvider } from '../../services/chat-bot/chat-bot.context';
import ChatBotScreen from '../../features/chat-bot/screens/chat-bot.screen';
import VoiceChatScreen from '../../features/chat-bot/screens/voice-chat/voice-chat.screen';

export const Stack = createStackNavigator();

export const ModalPresets = Platform.select({
  ios: {
    presentation: 'modal',
    ...TransitionPresets.ModalSlideFromBottomIOS,
  },
  android: {
    presentation: 'modal',
    ...TransitionPresets.ModalSlideFromBottomIOS,
  },
});

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
            <ChatBotContextProvider>
              <SheetDetailsContextProvider>
                <SettingsContextProvider>
                  <SyncContextProvider>
                    <ProfileContextProvider>
                      <SmsTransactions />

                      <SelectBaseCurrency />

                      <Stack.Navigator
                        screenOptions={{
                          headerShown: false,
                        }}
                      >
                        <Stack.Screen
                          name="Sheets"
                          component={SheetsNavigator}
                        />

                        {/* Used just for Plaid OAUthRedirection */}
                        <Stack.Screen
                          name="PlaidOAuthRedirect"
                          component={PlaidOAuthRedirectScreen}
                        />
                        <Stack.Screen
                          name="ChatBot"
                          options={{
                            cardStyleInterpolator:
                              CardStyleInterpolators.forHorizontalIOS,
                            presentation: 'transparentModal',
                            transitionSpec: {
                              open: TransitionSpecs.TransitionIOSSpec,
                              close: TransitionSpecs.TransitionIOSSpec,
                            },
                          }}
                          component={ChatBotScreen}
                        />
                        <Stack.Screen
                          name="VoiceChat"
                          options={{
                            cardStyleInterpolator:
                              CardStyleInterpolators.forHorizontalIOS,
                            presentation: 'transparentModal',
                            transitionSpec: {
                              open: TransitionSpecs.TransitionIOSSpec,
                              close: TransitionSpecs.TransitionIOSSpec,
                            },
                          }}
                          component={VoiceChatScreen}
                        />

                        <Stack.Screen
                          options={{
                            gestureResponseDistance:
                              Dimensions.get('window').height - 200,
                            headerMode: 'screen',
                            ...ModalPresets,
                          }}
                          name="Settings"
                          component={SettingsNavigator}
                        />

                        <Stack.Screen
                          name="BankAccounts"
                          options={{
                            gestureResponseDistance:
                              Dimensions.get('window').height - 200,
                            headerMode: 'screen',
                            ...ModalPresets,
                          }}
                          component={BankAccountNavigator}
                        />

                        <Stack.Screen
                          name="Applock"
                          component={AppLockScreen}
                        />
                      </Stack.Navigator>
                    </ProfileContextProvider>
                  </SyncContextProvider>
                </SettingsContextProvider>
              </SheetDetailsContextProvider>
            </ChatBotContextProvider>
          </SheetsContextProvider>
        </CategoriesContextProvider>
      </BankAccountContextProvider>
    </>
  );
};
