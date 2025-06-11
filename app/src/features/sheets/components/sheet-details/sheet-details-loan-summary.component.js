import React from 'react';
import {View} from 'react-native';
import moment from 'moment';
import {FlexRow} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import _ from 'lodash';

export const SheetDetailsLoanSummary = ({
  currentSheet,
  getCompoundingLabel,
  getRepaymentLabel,
  emiDates,
}) => {
  const {
    loanStartDate,
    loanYears,
    loanMonths,
    loanEndDate,
    useEndDate,
    useReducingBalance,
    interestRateMode,
  } = currentSheet;

  const start = moment(loanStartDate).format('MMM D, YYYY');
  const end = useEndDate
    ? moment(loanEndDate).format('MMM D, YYYY')
    : moment(loanStartDate)
        .add(loanYears, 'years')
        .add(loanMonths, 'months')
        .format('MMM D, YYYY');

  const durationString = `${loanYears}y ${loanMonths}m`;
  const nextEmiString = `Next EMI on ${moment(emiDates[0]).format(
    'dddd (MMM DD, YYYY)',
  )}`;

  return (
    <View style={{rowGap: 20}}>
      {/* Row 1 */}
      <LoanRow
        label1="Loan Amount"
        value1={currentSheet.loanAmount}
        subLabel1={
          useReducingBalance
            ? 'Reducing Balance Method\n(Interest on remaining principal)'
            : 'Standard EMI Method\n(Fixed equal payments)'
        }
        label2="Remaining Balance"
        value2={currentSheet.totalBalance}
        currency={currentSheet.currency}
      />

      {/* Row 2 */}
      <LoanRow
        label1="Interest Rate"
        value1={`${currentSheet.interestRate}%`}
        subLabel1={`${getCompoundingLabel(
          _.upperFirst(interestRateMode),
        )} basis`}
        label2="Loan Tenure"
        value2={
          <Text color="#fff" fontfamily="bodyBold" fontsize="15px">
            {`${start} – ${end}`}
          </Text>
        }
        subLabel2={durationString}
        currency={currentSheet.currency}
      />

      {/* Row 3 */}
      <LoanRow
        label1="Total Repayable"
        value1={currentSheet.totalRepayable}
        label2="Total Interest"
        value2={currentSheet.totalInterest}
        currency={currentSheet.currency}
      />

      {/* Row 4 */}
      <LoanRow
        label2="Total Payments"
        value2={`${currentSheet.totalPayments} payments`}
        label1={`EMI - ${getRepaymentLabel(currentSheet.repaymentFrequency)}`}
        value1={currentSheet.emi}
        subLabel1={nextEmiString}
        currency={currentSheet.currency}
      />
    </View>
  );
};

const LoanRow = ({
  label1,
  value1,
  label2,
  value2,
  subLabel1,
  subLabel2,
  currency,
}) => {
  return (
    <FlexRow justifyContent="space-between" style={{columnGap: 12}}>
      <View style={{flex: 1}}>
        <Text color="#fff" fontfamily="headingSemiBold" fontsize="14px">
          {label1}
        </Text>
        <Spacer size="small" />
        <Text color="#fff" fontfamily="bodyBold" fontsize="18px">
          {typeof value1 === 'number'
            ? `${GetCurrencySymbol(currency)} ${GetCurrencyLocalString(value1)}`
            : value1}
        </Text>
        {subLabel1 && (
          <Text
            color="#fff"
            fontfamily="caption"
            fontsize="12px"
            style={{opacity: 0.9}}>
            {subLabel1}
          </Text>
        )}
      </View>

      {label2 ? (
        <View style={{flex: 1}}>
          <Text color="#fff" fontfamily="headingSemiBold" fontsize="14px">
            {label2}
          </Text>
          <Spacer size="small" />
          <Text color="#fff" fontfamily="bodyBold" fontsize="18px">
            {typeof value2 === 'number'
              ? `${GetCurrencySymbol(currency)} ${GetCurrencyLocalString(
                  value2,
                )}`
              : React.isValidElement(value2)
              ? value2
              : value2}
          </Text>
          {subLabel2 && (
            <Text
              color="#fff"
              fontfamily="caption"
              fontsize="12px"
              style={{opacity: 0.9}}>
              {subLabel2}
            </Text>
          )}
        </View>
      ) : null}
    </FlexRow>
  );
};
