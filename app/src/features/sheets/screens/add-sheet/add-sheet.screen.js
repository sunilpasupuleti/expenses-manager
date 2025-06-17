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
  SelectListInput,
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
  const [sheetModel, setSheetModel] = useState(null);
  const [sheetName, setSheetName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editSheet, setEditSheet] = useState(null);
  // Loan Features
  const [isLoanAccount, setIsLoanAccount] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanYears, setLoanYears] = useState('');
  const [loanMonths, setLoanMonths] = useState('0');
  const [interestRate, setInterestRate] = useState('');
  const [repaymentFrequency, setRepaymentFrequency] = useState('monthly');
  const [loanStartDate, setLoanStartDate] = useState(moment().toDate());
  const [useReducingBalance, setUseReducingBalance] = useState(false);

  const [interestRateMode, setInterestRateMode] = useState('yearly');
  const [useEndDate, setUseEndDate] = useState(false);
  const [loanEndDate, setLoanEndDate] = useState(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSummary, setShowSheetSummary] = useState(true);

  const {userData} = useContext(AuthenticationContext);
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
    userData && userData.baseCurrency
      ? userData.baseCurrency
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
    loanStartDate,
    loanEndDate,
    useReducingBalance,
    useEndDate,
    repaymentFrequency,
    interestRateMode,
  ]);

  useEffect(() => {
    if (useReducingBalance) {
      setUseEndDate(true);
    } else {
      setUseEndDate(false);
    }
  }, [useReducingBalance]);

  useEffect(() => {
    if (useEndDate && loanEndDate) {
      const start = moment(loanStartDate);
      const end = moment(loanEndDate);
      const totalMonths = end.diff(start, 'months');
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;

      setLoanYears(String(years));
      setLoanMonths(String(months));
    }
  }, [loanEndDate, loanStartDate, useEndDate]);

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
      setSheetModel(sheet);
      setEditSheet(sheet);
      setSheetName(sheet.name);
      setEditMode(true);
      setDisabled(false);
      setShowSheetSummary(sheet.showSummary ? true : false);
      setSelectedCurrency(sheet.currency);
      if (sheet.isLoanAccount) {
        const endDate = sheet.useEndDate ? true : false;
        const reducingBalance = sheet.useReducingBalance ? true : false;

        setIsLoanAccount(true);
        setLoanAmount(String(sheet.loanAmount));
        setInterestRate(String(sheet.interestRate));
        setInterestRateMode(sheet.interestRateMode);
        setLoanYears(String(sheet.loanYears));
        setLoanMonths(String(sheet.loanMonths));
        setRepaymentFrequency(sheet.repaymentFrequency || 'monthly');
        setLoanStartDate(
          sheet.loanStartDate
            ? new Date(`${sheet.loanStartDate}T00:00:00`)
            : new Date(),
        );
        setUseEndDate(endDate);
        setUseReducingBalance(reducingBalance);
        if (endDate) {
          setLoanEndDate(
            sheet.loanEndDate
              ? new Date(`${sheet.loanEndDate}T00:00:00`)
              : new Date(),
          );
        }
      } else {
        setIsLoanAccount(false);
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
        return 365; // or 360 for some banks
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

  function calculateReducingBalanceEMI({
    principal,
    interestRatePerMonth,
    months,
    frequency = 'monthly', // default monthly
  }) {
    const baseMonthlyRate = interestRatePerMonth / 100;
    const annualRate = baseMonthlyRate * 12;

    // Step 1: Always calculate monthly EMI first (this becomes the base)
    const monthlyEMICount = Math.round(months);
    const monthlyCompoundFactor = Math.pow(
      1 + baseMonthlyRate,
      monthlyEMICount,
    );
    const baseMonthlyEMI =
      (principal * baseMonthlyRate * monthlyCompoundFactor) /
      (monthlyCompoundFactor - 1);
    const roundedMonthlyEMI = Math.round(baseMonthlyEMI * 100) / 100;

    // Step 2: Convert monthly EMI into frequency-based EMI using bank logic
    let emi = roundedMonthlyEMI;
    let paymentsPerYear = getFrequencyPerYear(frequency);
    let totalPayments = Math.round((months / 12) * paymentsPerYear);

    if (frequency === 'weekly') {
      emi = (roundedMonthlyEMI * 12) / 52;
    } else if (frequency === 'biweekly') {
      emi = (roundedMonthlyEMI * 12) / 26;
    } else if (frequency === 'daily') {
      emi = (roundedMonthlyEMI * 12) / 365;
      totalPayments = Math.round(months * 30.4375); // avg days per month
    }

    emi = Math.round(emi * 100) / 100;

    // Step 3: Use EMI to calculate amortization
    const periodicRate = annualRate / paymentsPerYear;
    let balance = principal;
    let totalInterest = 0;
    let totalRepayable = 0;
    let actualPayments = 0;
    while (balance > 0.01 && actualPayments < totalPayments) {
      const interestPayment = balance * periodicRate;
      let principalPayment = emi - interestPayment;

      if (principalPayment <= 0 || actualPayments + 1 === totalPayments) {
        principalPayment = balance;
        const finalInterest = balance * periodicRate;
        const actualEMI = finalInterest + principalPayment;

        totalInterest += finalInterest;
        totalRepayable += actualEMI;
        actualPayments++;
        break;
      }

      const actualEMI = interestPayment + principalPayment;

      balance -= principalPayment;
      totalInterest += interestPayment;
      totalRepayable += actualEMI;

      actualPayments++;
    }

    return {
      emi,
      totalPayments: actualPayments,
      totalRepayable: Math.round(totalRepayable * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    };
  }

  const calculateLoanDetails = () => {
    const principal = parseFloat(loanAmount || 0);
    const reducingBalanceMode =
      useReducingBalance && loanEndDate ? true : false;
    let annualRate = parseFloat(interestRate || 0) / 100;

    let totalMonths = 0;
    let totalPayments = 0;

    if (reducingBalanceMode) {
      const totalMonthsCalc = moment(loanEndDate)
        .startOf('day')
        .diff(moment(loanStartDate).startOf('day'), 'months');
      let monthlyRate =
        interestRateMode === 'monthly'
          ? parseFloat(interestRate)
          : (annualRate * 100) / 12;

      const calculatedValues = calculateReducingBalanceEMI({
        principal: principal,
        interestRatePerMonth: monthlyRate,
        months: totalMonthsCalc,
        frequency: repaymentFrequency,
      });
      return calculatedValues;
    } else {
      const years = parseInt(loanYears || 0);
      const months = parseInt(loanMonths || 0);
      totalMonths = years * 12 + months;

      const paymentsPerYear = getFrequencyPerYear(repaymentFrequency);
      totalPayments = Math.round((totalMonths / 12) * paymentsPerYear);
    }

    if (interestRateMode === 'monthly') {
      annualRate *= 12;
    }

    // Handle zero interest case
    if (annualRate === 0) {
      const emi = principal / totalPayments;
      return {
        emi: Math.round(emi * 100) / 100,
        totalPayments: totalPayments,
        totalRepayable: Math.round(principal * 100) / 100,
        totalInterest: 0,
      };
    }

    // BANKS USE DIFFERENT METHODS FOR DIFFERENT FREQUENCIES
    if (repaymentFrequency === 'monthly') {
      // Standard monthly calculation
      const monthlyRate = annualRate / 12;
      totalPayments = totalMonths;
      const compoundFactor = Math.pow(1 + monthlyRate, totalPayments);
      const emi =
        (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
      const roundedEmi = Math.round(emi * 100) / 100;
      const totalRepayable = roundedEmi * totalPayments;
      const totalInterest = totalRepayable - principal;

      return {
        emi: roundedEmi,
        totalPayments: totalPayments,
        totalRepayable: Math.round(totalRepayable * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
      };
    } else if (repaymentFrequency === 'weekly') {
      // Banks calculate weekly as: (Monthly Payment × 12) ÷ 52
      // First get monthly payment
      const monthlyRate = annualRate / 12;
      const monthlyCompoundFactor = Math.pow(1 + monthlyRate, totalMonths);
      const monthlyPayment =
        (principal * monthlyRate * monthlyCompoundFactor) /
        (monthlyCompoundFactor - 1);

      // Convert to weekly
      const weeklyPayment = (monthlyPayment * 12) / 52;
      const roundedEmi = Math.round(weeklyPayment * 100) / 100;

      // Calculate how many payments needed to pay off loan
      const weeklyRate = annualRate / 52;
      let balance = principal;
      let payments = 0;
      let totalInterestPaid = 0;

      while (balance > 0.01 && payments < 1000) {
        // safety limit
        const interestPayment = balance * weeklyRate;
        const principalPayment = Math.min(
          roundedEmi - interestPayment,
          balance,
        );
        totalInterestPaid += interestPayment;
        balance -= principalPayment;
        payments++;
      }

      const totalRepayable = roundedEmi * payments;

      return {
        emi: roundedEmi,
        totalPayments: payments,
        totalRepayable: Math.round(totalRepayable * 100) / 100,
        totalInterest: Math.round(totalInterestPaid * 100) / 100,
      };
    } else if (repaymentFrequency === 'biweekly') {
      // Banks calculate biweekly as: (Monthly Payment × 12) ÷ 26
      // First get monthly payment
      const monthlyRate = annualRate / 12;
      const monthlyCompoundFactor = Math.pow(1 + monthlyRate, totalMonths);
      const monthlyPayment =
        (principal * monthlyRate * monthlyCompoundFactor) /
        (monthlyCompoundFactor - 1);

      // Convert to biweekly
      const biweeklyPayment = (monthlyPayment * 12) / 26;
      const roundedEmi = Math.round(biweeklyPayment * 100) / 100;

      // Calculate how many payments needed to pay off loan
      const biweeklyRate = annualRate / 26;
      let balance = principal;
      let payments = 0;
      let totalInterestPaid = 0;

      while (balance > 0.01 && payments < 500) {
        // safety limit
        const interestPayment = balance * biweeklyRate;
        const principalPayment = Math.min(
          roundedEmi - interestPayment,
          balance,
        );
        totalInterestPaid += interestPayment;
        balance -= principalPayment;
        payments++;
      }

      const totalRepayable = roundedEmi * payments;

      return {
        emi: roundedEmi,
        totalPayments: payments,
        totalRepayable: Math.round(totalRepayable * 100) / 100,
        totalInterest: Math.round(totalInterestPaid * 100) / 100,
      };
    } else {
      // For other frequencies, use standard calculation
      const paymentsPerYear = getFrequencyPerYear(repaymentFrequency);
      const periodicRate = annualRate / paymentsPerYear;
      const compoundFactor = Math.pow(1 + periodicRate, totalPayments);
      const emi =
        (principal * periodicRate * compoundFactor) / (compoundFactor - 1);
      const roundedEmi = Math.round(emi * 100) / 100;
      const totalRepayable = roundedEmi * totalPayments;
      const totalInterest = totalRepayable - principal;

      return {
        emi: roundedEmi,
        totalPayments: totalPayments,
        totalRepayable: Math.round(totalRepayable * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
      };
    }
  };

  const onSave = () => {
    const loanDetails = calculateLoanDetails();

    const sheet = {
      userId: userData.id,
      name: _.capitalize(_.trim(sheetName)),
      showSummary: !!showSummary,
      currency: selectedCurrency,
      totalBalance: isLoanAccount
        ? parseFloat(loanDetails.totalRepayable) || 0
        : 0,
      totalExpense: 0,
      totalIncome: 0,
      archived: false,
      pinned: false,
      // Optional, with defaults
      isLoanAccount: !!isLoanAccount,
      loanAmount: isLoanAccount ? parseFloat(loanAmount) || 0 : 0,
      useReducingBalance: !!(useReducingBalance && isLoanAccount),
      useEndDate: !!(useEndDate && isLoanAccount),
      interestRate: isLoanAccount ? parseFloat(interestRate) || 0 : 0,
      interestRateMode: isLoanAccount ? interestRateMode || null : null,
      loanStartDate: isLoanAccount
        ? moment(loanStartDate).format('YYYY-MM-DD').toString()
        : null,
      loanEndDate:
        isLoanAccount && useEndDate
          ? moment(loanEndDate).format('YYYY-MM-DD').toString()
          : null,
      repaymentFrequency: isLoanAccount ? repaymentFrequency || null : null,
      loanYears: isLoanAccount ? parseInt(loanYears) || 0 : 0,
      loanMonths: isLoanAccount ? parseInt(loanMonths) || 0 : 0,
      emi: isLoanAccount ? loanDetails.emi || 0 : 0,
      totalRepayable: isLoanAccount ? loanDetails.totalRepayable || 0 : 0,
      totalInterest: isLoanAccount ? loanDetails.totalInterest || 0 : 0,
      totalPayments: isLoanAccount ? loanDetails.totalPayments || 0 : 0,
      totalPaid: 0,
    };

    onSaveSheet(sheet, () => {
      navigation.goBack();
    });
  };

  const onEdit = () => {
    const sheet = {
      id: editSheet.id,
      name: _.capitalize(_.trim(sheetName)),
      showSummary: !!showSummary,

      archived: false,
      pinned: false,
      ...(isLoanAccount
        ? {
            isLoanAccount: true,
            loanAmount: parseFloat(loanAmount) || 0,
            interestRate: parseFloat(interestRate) || 0,
            loanYears: parseInt(loanYears) || 0,
            loanMonths: parseInt(loanMonths) || 0,
            interestRateMode,
            repaymentFrequency,
            loanStartDate: moment(loanStartDate)
              .format('YYYY-MM-DD')
              .toString(),

            loanEndDate: useEndDate
              ? moment(loanEndDate).format('YYYY-MM-DD').toString()
              : null,
            useReducingBalance: !!useReducingBalance,
            useEndDate: !!useEndDate,
            ...calculateLoanDetails(),
          }
        : {
            isLoanAccount: false,
            loanAmount: 0,
            loanYears: 0,
            loanMonths: 0,
            interestRate: 0,
            interestRateMode: null,
            loanStartDate: null,
            loanEndDate: null,
            useReducingBalance: false,
            useEndDate: false,
            emi: 0,
            totalPayments: 0,
            totalRepayable: 0,
            totalInterest: 0,
            totalInterestPaid: 0,
          }),
    };

    onEditSheet(sheetModel, sheet, () => {
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

          <AdvancedSettingsContainer style={{marginTop: 30}}>
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
                  <Spacer size="large">
                    <FlexRow justifyContent="space-between">
                      <Text>Use Reducing Balance Interest?</Text>
                      <ToggleSwitch
                        value={useReducingBalance}
                        onValueChange={val => {
                          setUseReducingBalance(!useReducingBalance);
                        }}
                      />
                    </FlexRow>
                  </Spacer>
                )}
              </AdvancedSettings.Content>
            </AdvancedSettings>
          </AdvancedSettingsContainer>

          {isLoanAccount && (
            <>
              <AdvancedSettingsContainer style={{marginTop: 30}}>
                <Text variantType="caption" color="#aaa" fontsize="14px">
                  LOAN Details
                </Text>
                <AdvancedSettings>
                  <AdvancedSettings.Content
                    style={{
                      marginTop: -10,
                    }}>
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
                    <Spacer size="medium" />
                    <FlexRow justifyContent="space-between">
                      <Text>Enter Loan End Date?</Text>
                      <ToggleSwitch
                        value={useEndDate}
                        disabled={useReducingBalance ? true : false}
                        onValueChange={() => setUseEndDate(!useEndDate)}
                      />
                    </FlexRow>
                    <Spacer size="medium" />
                    {useEndDate && (
                      <>
                        <FlexRow justifyContent="space-between">
                          <Text>End Date</Text>
                          <TouchableHighlightWithColor
                            onPress={() =>
                              setShowEndDatePicker(!showEndDatePicker)
                            }
                            padding="10px">
                            <Text fontfamily="bodySemiBold">
                              {loanEndDate
                                ? moment(loanEndDate).format('YYYY-MM-DD')
                                : 'Select date'}
                            </Text>
                          </TouchableHighlightWithColor>
                        </FlexRow>
                        {showEndDatePicker && (
                          <DateTimePicker
                            value={loanEndDate || new Date()}
                            mode="date"
                            minimumDate={loanStartDate}
                            themeVariant={darkMode ? 'dark' : 'light'}
                            display={
                              Platform.OS === 'ios' ? 'spinner' : 'default'
                            }
                            onChange={(event, selectedDate) => {
                              if (Platform.OS === 'android')
                                setShowEndDatePicker(false);
                              if (selectedDate) setLoanEndDate(selectedDate);
                            }}
                          />
                        )}
                      </>
                    )}

                    <>
                      <AddSheetInput
                        label="Loan Duration (Years)"
                        placeholder="Enter loan period years"
                        keyboardType="numeric"
                        value={loanYears}
                        disabled={useEndDate ? true : false}
                        onChangeText={text => {
                          const numeric = text.replace(/[^0-9]/g, '');
                          setLoanYears(numeric);
                        }}
                      />
                      <Spacer size="medium" />
                      <AddSheetInput
                        label="Additional Months"
                        disabled={useEndDate ? true : false}
                        placeholder="Enter loan period months"
                        keyboardType="numeric"
                        value={loanMonths}
                        onChangeText={text => {
                          const numeric = text.replace(/[^0-9]/g, '');
                          setLoanMonths(numeric);
                        }}
                      />
                    </>

                    <Spacer size="medium" />
                    <FlexRow justifyContent="space-between">
                      <Text>Repayment Schedule</Text>
                      <SelectListInput
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
                        search={false} // hide unnecessary search bar
                      />
                    </FlexRow>
                  </AdvancedSettings.Content>
                </AdvancedSettings>
              </AdvancedSettingsContainer>

              <AdvancedSettingsContainer style={{marginTop: 30}}>
                <Text variantType="caption" color="#aaa" fontsize="14px">
                  INTEREST RATES
                </Text>
                <AdvancedSettings>
                  <AdvancedSettings.Content
                    style={{
                      marginTop: -10,
                    }}>
                    <FlexRow justifyContent="space-between">
                      <Text>Interest Rate Type</Text>
                      <SelectList
                        setSelected={val => setInterestRateMode(val)}
                        data={[
                          {key: 'yearly', value: 'Per Year (%)'},
                          {key: 'monthly', value: 'Per Month (%)'},
                        ]}
                        save="key"
                        defaultOption={{
                          key: interestRateMode,
                          value:
                            interestRateMode === 'yearly'
                              ? 'Per Year (%)'
                              : 'Per Month (%)',
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
                        search={false}
                      />
                    </FlexRow>
                    <Spacer size="medium" />
                    <AddSheetInput
                      label={`Rate of Interest (${
                        interestRateMode === 'yearly' ? 'Yearly' : 'Monthly'
                      })`}
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
                  </AdvancedSettings.Content>
                </AdvancedSettings>
              </AdvancedSettingsContainer>
            </>
          )}

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
