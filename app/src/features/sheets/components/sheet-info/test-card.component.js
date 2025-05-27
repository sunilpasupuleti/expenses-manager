import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {Card, ProgressBar} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Text} from '../../../../components/typography/text.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlexRow} from '../../../../components/styles';
import {
  GetCurrencySymbol,
  GetCurrencyLocalString,
} from '../../../../components/symbol.currency';
import moment from 'moment';

export const DailyRecapCard = ({sheet, onPress}) => {
  const theme = useTheme();

  const income = sheet.totalIncome || 0;
  const expense = sheet.totalExpense || 0;
  const savings = Math.max(income - expense, 0);
  const savingsRate = income > 0 ? savings / income : 0;

  const currency = GetCurrencySymbol(sheet.currency);
  const updated = moment(sheet.updatedAt).fromNow();

  const insightText =
    savingsRate >= 0.5
      ? '⭐ Great savings! Keep up the momentum!'
      : savings > 0
      ? '👏 You saved some, aim higher today!'
      : '⚡ Expenses overtook income yesterday. Reset today!';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card
        elevation={4}
        style={{
          borderRadius: 20,
          padding: 20,
          marginVertical: 10,
          backgroundColor: theme.colors.bg.card,
        }}>
        <Text variant="label" style={{fontSize: 18, marginBottom: 8}}>
          {sheet.name}
        </Text>

        <FlexRow justifyContent="space-between">
          <View>
            <Text color="text.disabled" style={{fontSize: 12}}>
              Income
            </Text>
            <Text
              variant="bodyMedium"
              color="text.success"
              style={{fontSize: 16}}>
              {currency} {GetCurrencyLocalString(income)}
            </Text>
          </View>
          <View>
            <Text color="text.disabled" style={{fontSize: 12}}>
              Expense
            </Text>
            <Text
              variant="bodyMedium"
              color="text.error"
              style={{fontSize: 16}}>
              {currency} {GetCurrencyLocalString(expense)}
            </Text>
          </View>
          <View>
            <Text color="text.disabled" style={{fontSize: 12}}>
              Savings
            </Text>
            <Text variant="bodyMedium" style={{fontSize: 16}}>
              {currency} {GetCurrencyLocalString(savings)}
            </Text>
          </View>
        </FlexRow>

        <Spacer size="medium" />

        <ProgressBar
          progress={savingsRate}
          color={
            savingsRate > 0.5
              ? theme.colors.text.success
              : theme.colors.text.warning
          }
          style={{height: 8, borderRadius: 5}}
        />

        <Spacer size="small" />

        <Text style={{fontSize: 12, color: theme.colors.text.disabled}}>
          Savings Rate: {Math.round(savingsRate * 100)}% • Updated {updated}
        </Text>

        <Spacer size="small" />

        <Text
          style={{fontSize: 13}}
          color={savings > 0 ? 'text.success' : 'text.warning'}>
          {insightText}
        </Text>
      </Card>
    </TouchableOpacity>
  );
};
