import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import React, {useContext, useEffect, useState} from 'react';
import {Button} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {
  ButtonText,
  FlexRow,
  MainWrapper,
  ToggleSwitch,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
import {AddSheetInput} from '../../components/add-sheet/add-sheet-input.component';
import {GetCurrencySymbol} from '../../../../components/symbol.currency';
import {
  AdvancedSettings,
  AdvancedSettingsContainer,
} from '../../components/add-sheet/add-sheet.styles';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {Text} from '../../../../components/typography/text.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {getCurrencies} from 'react-native-localize';
import {AuthenticationContext} from '../../../../services/authentication/authentication.context';

export const AddSheetScreen = ({navigation, route}) => {
  const theme = useTheme();
  const [disabled, setDisabled] = useState(true);
  const [sheetName, setSheetName] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editSheet, setEditSheet] = useState(null);

  const [showTotalBalance, setShowTotalBalance] = useState(true);

  const {userAdditionalDetails} = useContext(AuthenticationContext);

  const {onSaveSheet, onEditSheet} = useContext(SheetsContext);

  const [selectedCurrency, setSelectedCurrency] = useState(
    userAdditionalDetails && userAdditionalDetails.baseCurrency
      ? userAdditionalDetails.baseCurrency
      : getCurrencies()[0]
      ? getCurrencies()[0]
      : 'INR',
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: editMode ? 'Edit Account' : 'New Account',
      headerLeft: () => (
        <Button uppercase={false} onPress={onCancel}>
          <ButtonText>Cancel</ButtonText>
        </Button>
      ),
      headerRight: () => {
        return (
          <Button
            disabled={disabled}
            uppercase={false}
            onPress={editMode ? onEdit : onSave}>
            <ButtonText disabled={disabled}>Done</ButtonText>
          </Button>
        );
      },
    });
  }, [sheetName, showTotalBalance, disabled, editMode, selectedCurrency]);

  useEffect(() => {
    if (route.params && route.params.edit) {
      let sheet = route.params.sheet;
      setEditSheet(sheet);
      setSheetName(sheet.name);
      setEditMode(true);
      setDisabled(false);
      setShowTotalBalance(sheet.showTotalBalance);
      setSelectedCurrency(sheet.currency);
    }
    if (route.params && route.params.selectedCurrency) {
      setSelectedCurrency(route.params.selectedCurrency);
    }
  }, [route.params]);

  const onSetSheetName = name => {
    setSheetName(name);
  };

  const onSetButtonDisabled = condition => {
    setDisabled(condition);
  };

  const onCancel = () => {
    navigation.goBack();
  };

  const onSave = () => {
    const sheet = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: (sheetName.charAt(0).toUpperCase() + sheetName.slice(1)).trim(),
      showTotalBalance: showTotalBalance,
      totalBalance: 0,
      updatedAt: Date.now(),
      details: [],
      currency: selectedCurrency,
    };
    onSaveSheet(sheet, () => {
      navigation.goBack();
      // navigation.navigate('SheetDetailsHome', {
      //   screen: 'Transactions',
      //   sheet: sheet,
      // });
    });
  };

  const onEdit = () => {
    const sheet = {
      id: editSheet.id,
      name: (sheetName.charAt(0).toUpperCase() + sheetName.slice(1)).trim(),
      showTotalBalance: showTotalBalance,
      totalBalance: editSheet.totalBalance,
      updatedAt: Date.now(),
    };
    onEditSheet(sheet, route.params.callback);
  };

  return (
    <SafeArea>
      <MainWrapper>
        <Spacer size="xlarge">
          <AddSheetInput
            setButtonDisabled={onSetButtonDisabled}
            onSetSheetName={onSetSheetName}
            sheetName={sheetName}
          />
        </Spacer>

        <AdvancedSettingsContainer>
          <Text variantType="caption" color="#aaa" fontsize="14px">
            ADVANCED SETTINGS
          </Text>
          <AdvancedSettings theme={{roundness: 5}}>
            <AdvancedSettings.Content>
              <FlexRow justifyContent="space-between">
                <Text>Show Total Balance</Text>
                <ToggleSwitch
                  value={showTotalBalance}
                  onValueChange={() => setShowTotalBalance(!showTotalBalance)}
                />
              </FlexRow>
            </AdvancedSettings.Content>
            <Spacer size={'xlarge'} />
            <TouchableHighlightWithColor
              onPress={() =>
                !editMode
                  ? navigation.navigate('SelectCurrency', {
                      selectedCurrency: selectedCurrency,
                    })
                  : null
              }
              padding="15px">
              <FlexRow justifyContent="space-between">
                <FlexRow>
                  <FontAwesome
                    name="money"
                    size={20}
                    color={editMode ? '#ccc' : '#aaa'}
                  />
                  <Spacer position={'left'} size={'large'}>
                    <Text style={editMode && {color: '#bbb'}}>
                      Select{editMode && 'ed'} Currency
                    </Text>
                  </Spacer>
                </FlexRow>
                <FlexRow>
                  <Text
                    fontfamily="bodySemiBold"
                    style={editMode && {color: '#bbb'}}>
                    {selectedCurrency +
                      `  (${GetCurrencySymbol(selectedCurrency)})`}
                  </Text>
                  <Spacer position={'left'} size={'medium'}>
                    <Ionicons
                      name="chevron-forward-outline"
                      color="#aaa"
                      size={24}
                    />
                  </Spacer>
                </FlexRow>
              </FlexRow>
            </TouchableHighlightWithColor>
          </AdvancedSettings>
        </AdvancedSettingsContainer>

        <Spacer size={'xlarge'} />
      </MainWrapper>
    </SafeArea>
  );
};
