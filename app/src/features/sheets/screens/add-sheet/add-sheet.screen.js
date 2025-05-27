/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
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
import _ from 'lodash';
import {
  compoundingOptions,
  getCurrentDate,
  repaymentFrequencyOptions,
} from '../../../../components/utility/helper';
import {Platform, ScrollView, useColorScheme, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import {SelectList} from 'react-native-dropdown-select-list';
import {useSelector} from 'react-redux';

export const AddSheetScreen = ({navigation, route}) => {
  const theme = useTheme();
  const [disabled, setDisabled] = useState(true);
  const [sheetName, setSheetName] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editSheet, setEditSheet] = useState(null);
  // Loan Features
  const [isLoanAccount, setIsLoanAccount] = useState(false);
  const [loanAmount, setLoanAmount] = useState('500000');
  const [loanYears, setLoanYears] = useState('5');
  const [loanMonths, setLoanMonths] = useState('6');
  const [interestRate, setInterestRate] = useState('9.5');
  const [repaymentFrequency, setRepaymentFrequency] = useState('monthly');
  const [compoundingFrequency, setCompoundingFrequency] = useState('monthly');
  const [compoundInterest, setCompoundInterest] = useState(false);
  const [loanStartDate, setLoanStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSummary, setShowSheetSummary] = useState(true);

  const {userAdditionalDetails, userData} = useContext(AuthenticationContext);
  const themeType = useColorScheme();
  const appTheme = useSelector(state => state.service.theme);
  const {onSaveSheet, onEditSheet} = useContext(SheetsContext);
  let darkMode =
    appTheme === 'automatic'
      ? themeType === 'light'
        ? false
        : true
      : appTheme === 'light'
      ? false
      : true;

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
  }, [
    sheetName,
    showSummary,
    disabled,
    editMode,
    selectedCurrency,
    isLoanAccount,
    loanAmount,
    repaymentFrequency,
    loanYears,
    loanMonths,
    interestRate,
    compoundInterest,
    compoundingFrequency,
    loanStartDate,
  ]);

  useEffect(() => {
    const isNameFilled = !!sheetName?.trim();

    if (isLoanAccount) {
      const isLoanValid =
        loanAmount.trim() !== '' &&
        !isNaN(parseFloat(loanAmount)) &&
        loanYears.trim() !== '' &&
        loanMonths.trim() !== '' &&
        !isNaN(parseInt(loanYears)) &&
        !isNaN(parseInt(loanMonths));

      setDisabled(!(isNameFilled && isLoanValid));
    } else {
      setDisabled(!isNameFilled);
    }
  }, [sheetName, isLoanAccount, loanAmount, interestRate]);

  useEffect(() => {
    if (route.params && route.params.edit) {
      let sheet = route.params.sheet;

      setEditSheet(sheet);
      setSheetName(sheet.name);
      setEditMode(true);
      setDisabled(false);
      setShowSheetSummary(sheet.showSummary ? true : false);
      setSelectedCurrency(sheet.currency);
      if (sheet.isLoanAccount) {
        setIsLoanAccount(true);
        setLoanAmount(String(sheet.loanAmount));
        setInterestRate(String(sheet.interestRate));
        setLoanYears(String(sheet.loanYears));
        setLoanMonths(String(sheet.loanMonths));
        setRepaymentFrequency(sheet.repaymentFrequency || 'monthly');
        setCompoundingFrequency(sheet.compoundingFrequency || 'monthly');

        setCompoundInterest(sheet.compoundInterest === 1);

        setLoanStartDate(
          sheet.loanStartDate
            ? new Date(`${sheet.loanStartDate}T00:00:00`)
            : new Date(),
        );
      }
    }
    if (route.params && route.params.selectedCurrency) {
      setSelectedCurrency(route.params.selectedCurrency);
    }
  }, [route.params]);

  const onSetSheetName = name => {
    setSheetName(name);
  };

  const onCancel = () => {
    navigation.goBack();
  };

  const getFrequencyPerYear = frequency => {
    switch (frequency) {
      case 'daily':
        return 365;
      case 'weekly':
        return 52;
      case 'biweekly':
        return 26;
      case 'semi_monthly':
        return 24;
      case 'monthly':
        return 12;
      case 'quarterly':
        return 4;
      case 'semi_annually':
        return 2;
      case 'yearly':
        return 1;
      default:
        return 12;
    }
  };

  const calculateLoanDetails = () => {
    const principal = parseFloat(loanAmount || 0);
    const years = parseInt(loanYears || 0);
    const months = parseInt(loanMonths || 0);
    const totalMonths = years * 12 + months;

    const repayPerYear = getFrequencyPerYear(repaymentFrequency);
    const compoundPerYear = getFrequencyPerYear(compoundingFrequency);
    const annualRate = parseFloat(interestRate || 0) / 100;

    const totalPayments = (totalMonths / 12) * repayPerYear;

    let emi = 0,
      totalRepayable = 0,
      totalInterest = 0;
    let r = 0;

    if (compoundingFrequency === 'continuously') {
      const effectiveRate = Math.exp(annualRate / repayPerYear) - 1;
      r = effectiveRate;
    } else if (compoundingFrequency === 'annually') {
      r = Math.pow(1 + annualRate, 1 / repayPerYear) - 1;
    } else if (repayPerYear === compoundPerYear) {
      r = annualRate / repayPerYear;
    } else {
      r =
        Math.pow(
          1 + annualRate / compoundPerYear,
          compoundPerYear / repayPerYear,
        ) - 1;
    }

    emi =
      (principal * r * Math.pow(1 + r, totalPayments)) /
      (Math.pow(1 + r, totalPayments) - 1);

    totalRepayable = emi * totalPayments;
    totalInterest = totalRepayable - principal;

    return {
      emi: parseFloat(emi.toFixed(2)),
      totalPayments: parseFloat(totalPayments.toFixed(2)),
      totalRepayable: parseFloat(totalRepayable.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
    };
  };

  const onSave = () => {
    const loanDetails = calculateLoanDetails();
    const sheet = {
      name: _.capitalize(_.trim(sheetName)),
      showSummary: showSummary ? 1 : 0,
      updatedAt: getCurrentDate(),
      currency: selectedCurrency,
      totalBalance: isLoanAccount
        ? parseFloat(loanDetails.totalRepayable) || 0
        : 0,
      totalExpense: 0,
      totalIncome: 0,
      uid: userData.uid,
      ...(isLoanAccount && {
        isLoanAccount: 1,
        loanAmount: parseFloat(loanAmount) || 0,
        loanYears: parseInt(loanYears) || 0,
        loanMonths: parseInt(loanMonths) || 0,
        interestRate: parseFloat(interestRate) || 0,
        repaymentFrequency,
        compoundInterest: compoundInterest ? 1 : 0,
        compoundingFrequency: compoundingFrequency,
        loanStartDate: moment(loanStartDate).format('YYYY-MM-DD'),
        ...loanDetails,
      }),
    };

    onSaveSheet(sheet, () => {
      navigation.goBack();
    });
  };

  const onEdit = () => {
    const sheet = {
      id: editSheet.id,
      name: _.capitalize(_.trim(sheetName)),
      showSummary: showSummary ? 1 : 0,
      updatedAt: getCurrentDate(),
      ...(isLoanAccount
        ? {
            isLoanAccount: 1,
            loanAmount: parseFloat(loanAmount) || 0,
            interestRate: parseFloat(interestRate) || 0,
            loanYears: parseInt(loanYears) || 0,
            loanMonths: parseInt(loanMonths) || 0,
            repaymentFrequency,
            compoundInterest: compoundInterest ? 1 : 0,
            compoundingFrequency: compoundingFrequency,
            loanStartDate: moment(loanStartDate).format('YYYY-MM-DD'),
            ...calculateLoanDetails(),
          }
        : {
            isLoanAccount: 0,
            loanAmount: 0,
            loanYears: 0,
            loanMonths: 0,
            interestRate: 0,
            interestPeriod: null,
            compoundInterest: 0,
            compoundingFrequency: null,
            loanStartDate: null,
          }),
    };

    onEditSheet(sheet, () => {
      navigation.goBack();
    });
  };

  return (
    <SafeArea child={true}>
      <MainWrapper>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Spacer size="xlarge">
            <AddSheetInput
              label={'Account Name'}
              placeholder={'Enter account name'}
              onChangeText={onSetSheetName}
              value={sheetName}
            />
          </Spacer>

          <AdvancedSettingsContainer>
            <Text variantType="caption" color="#aaa" fontsize="14px">
              LOAN ACCOUNT (optional)
            </Text>
            <AdvancedSettings
              theme={{roundness: 5}}
              style={{backgroundColor: theme.colors.bg.card, margin: 1}}>
              <AdvancedSettings.Content>
                <FlexRow justifyContent="space-between">
                  <Text>Is Loan Account?</Text>
                  <ToggleSwitch
                    value={isLoanAccount}
                    onValueChange={() => setIsLoanAccount(!isLoanAccount)}
                  />
                </FlexRow>
                {isLoanAccount && (
                  <>
                    <Spacer size="large" />
                    <AddSheetInput
                      label="Loan Amount"
                      placeholder="Enter loan amount"
                      keyboardType="numeric"
                      value={loanAmount}
                      onChangeText={text => {
                        const formatted =
                          text.match(/^\d*\.?\d{0,2}/)?.[0] || '';
                        setLoanAmount(formatted);
                      }}
                      onBlur={() => {
                        if (loanAmount && !isNaN(loanAmount)) {
                          const fixed = parseFloat(loanAmount).toFixed(2);
                          setLoanAmount(fixed);
                        }
                      }}
                    />
                    <Spacer size="medium" />
                    <FlexRow justifyContent="space-between">
                      <AddSheetInput
                        label="Loan Period (Years)"
                        placeholder="Enter loan period years"
                        keyboardType="numeric"
                        style={{width: '50%'}}
                        value={loanYears}
                        onChangeText={text => {
                          const numeric = text.replace(/[^0-9]/g, '');
                          setLoanYears(numeric);
                        }}
                      />
                      <Spacer size="medium" position="left" />
                      <AddSheetInput
                        label="Loan Period (Months)"
                        style={{width: '50%'}}
                        placeholder="Enter loan period months"
                        keyboardType="numeric"
                        value={loanMonths}
                        onChangeText={text => {
                          const numeric = text.replace(/[^0-9]/g, '');
                          setLoanMonths(numeric);
                        }}
                      />
                    </FlexRow>
                    <Spacer size="medium" />
                    <AddSheetInput
                      label="Rate of Interest (%)"
                      placeholder="Enter interest rate"
                      keyboardType="numeric"
                      value={interestRate}
                      onChangeText={text => {
                        const formatted =
                          text.match(/^\d*\.?\d{0,2}/)?.[0] || '';
                        setInterestRate(formatted);
                      }}
                      onBlur={() => {
                        if (interestRate && !isNaN(interestRate)) {
                          const fixed = parseFloat(interestRate).toFixed(2);
                          setInterestRate(fixed);
                        }
                      }}
                    />
                    {/* Compound Interest */}
                    <Spacer size="medium" />
                    <FlexRow justifyContent="space-between">
                      <Text>Compound Interest?</Text>
                      <ToggleSwitch
                        value={compoundInterest}
                        onValueChange={() =>
                          setCompoundInterest(!compoundInterest)
                        }
                      />
                    </FlexRow>
                    {compoundInterest && (
                      <FlexRow justifyContent="space-between">
                        <Text>Compnd Frequency</Text>
                        <SelectList
                          setSelected={val => {
                            setCompoundingFrequency(val);
                          }}
                          data={compoundingOptions}
                          save="key"
                          placeholder="Select Frequency"
                          defaultOption={{
                            key: compoundingFrequency,
                            value: compoundingOptions.find(
                              o => o.key === compoundingFrequency,
                            ).value,
                          }}
                          boxStyles={{
                            borderRadius: 8,
                            borderColor: '#ccc',
                            backgroundColor: theme.colors.bg.input,
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            marginTop: 5,
                            shadowColor: 'transparent',
                          }}
                          inputStyles={{
                            color: theme.colors.text.primary,
                            fontSize: 16,
                            paddingLeft: 0,
                          }}
                          dropdownStyles={{
                            backgroundColor: theme.colors.bg.input,
                            borderColor: '#ccc',
                            borderRadius: 6,
                            marginTop: 4,
                          }}
                          dropdownTextStyles={{
                            fontSize: 15,
                            color: theme.colors.text.primary,
                          }}
                          search={false} // hide unnecessary search bar
                        />
                      </FlexRow>
                    )}
                    <Spacer size="medium" />
                    <FlexRow justifyContent="space-between">
                      <Text>Repayment Schedule</Text>
                      <SelectList
                        setSelected={val => setRepaymentFrequency(val)}
                        data={repaymentFrequencyOptions}
                        save="key"
                        placeholder="Select Frequency"
                        defaultOption={{
                          key: repaymentFrequency,
                          value: repaymentFrequencyOptions.find(
                            o => o.key === repaymentFrequency,
                          ).value,
                        }}
                        boxStyles={{
                          borderRadius: 8,
                          borderColor: '#ccc',
                          backgroundColor: theme.colors.bg.input,
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          marginTop: 5,
                          shadowColor: 'transparent',
                        }}
                        inputStyles={{
                          color: theme.colors.text.primary,
                          fontSize: 16,
                          paddingLeft: 0,
                        }}
                        dropdownStyles={{
                          backgroundColor: theme.colors.bg.input,
                          borderColor: '#ccc',
                          borderRadius: 6,
                          marginTop: 4,
                        }}
                        dropdownTextStyles={{
                          fontSize: 15,
                          color: theme.colors.text.primary,
                        }}
                        search={false} // hide unnecessary search bar
                      />
                    </FlexRow>

                    <Spacer size="medium" />
                    <FlexRow justifyContent="space-between">
                      <Text>Loan Start Date</Text>
                      <TouchableHighlightWithColor
                        onPress={() => setShowDatePicker(!showDatePicker)}
                        padding="10px">
                        <Text fontfamily="bodySemiBold">
                          {moment(loanStartDate).format('YYYY-MM-DD')}
                        </Text>
                      </TouchableHighlightWithColor>
                    </FlexRow>

                    {showDatePicker && (
                      <DateTimePicker
                        value={loanStartDate}
                        mode="date"
                        maximumDate={moment()
                          .add(parseInt(loanYears || 0), 'years')
                          .add(parseInt(loanMonths || 0), 'months')
                          .toDate()}
                        themeVariant={darkMode ? 'dark' : 'light'}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === 'android') {
                            setShowDatePicker(false);
                          }
                          if (selectedDate) {
                            setLoanStartDate(selectedDate);
                          }
                        }}
                      />
                    )}
                  </>
                )}
              </AdvancedSettings.Content>
            </AdvancedSettings>
          </AdvancedSettingsContainer>

          <AdvancedSettingsContainer>
            <Text variantType="caption" color="#aaa" fontsize="14px">
              ADVANCED SETTINGS
            </Text>
            <AdvancedSettings
              theme={{roundness: 5}}
              style={{backgroundColor: theme.colors.bg.card, margin: 1}}>
              <AdvancedSettings.Content>
                <FlexRow justifyContent="space-between">
                  <Text>Show Account Summary</Text>
                  <ToggleSwitch
                    value={showSummary}
                    onValueChange={() => setShowSheetSummary(!showSummary)}
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
        </ScrollView>
      </MainWrapper>
    </SafeArea>
  );
};
