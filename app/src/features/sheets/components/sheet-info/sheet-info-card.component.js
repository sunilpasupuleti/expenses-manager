import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import React from 'react';
import {View} from 'react-native';
import {Text} from '../../../../components/typography/text.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {useTheme} from 'styled-components/native';
import {Card, Divider} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AvlBalanceRow,
  SummaryRow,
  ValueBox,
  ValueBoxRow,
} from './sheet-info-card.styles';

const GradientAvatar = ({name, size = 40}) => {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <LinearGradient
      colors={['#c2d3ff', '#d8b8ff']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
      }}>
      <Text style={{color: '#fff', fontWeight: '600', fontSize: size * 0.5}}>
        {initial}
      </Text>
    </LinearGradient>
  );
};

export const SheetInfoCard = ({sheet = {}, currentLength, index}) => {
  const theme = useTheme();

  const renderSummary = () => {
    if (!sheet.showSummary) return null;

    const buildValueBox = (label, value, iconName, iconColor) => (
      <ValueBox>
        <ValueBoxRow>
          <MaterialCommunityIcons name={iconName} size={16} color={iconColor} />
          <Text style={{fontSize: 12, color: '#666', marginLeft: 4}}>
            {label}
          </Text>
        </ValueBoxRow>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: iconColor,
          }}>
          {GetCurrencySymbol(sheet.currency)} {GetCurrencyLocalString(value)}
        </Text>
      </ValueBox>
    );

    if (sheet.isLoanAccount) {
      return (
        <Card.Content>
          <SummaryRow>
            <ValueBox style={{backgroundColor: '#fff3f3'}}>
              <ValueBoxRow>
                <MaterialCommunityIcons
                  name="bank-outline"
                  size={16}
                  color="#D32F2F" // red tone for debt
                />
                <Text style={{fontSize: 12, color: '#D32F2F', marginLeft: 4}}>
                  Loan Balance
                </Text>
              </ValueBoxRow>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#D32F2F',
                }}>
                {GetCurrencySymbol(sheet.currency)}{' '}
                {GetCurrencyLocalString(sheet.totalBalance)}
              </Text>
            </ValueBox>

            <ValueBox style={{backgroundColor: '#fffbe6'}}>
              <ValueBoxRow>
                <MaterialCommunityIcons
                  name="percent-outline"
                  size={16}
                  color="#F57C00" // amber
                />
                <Text style={{fontSize: 12, color: '#F57C00', marginLeft: 4}}>
                  Interest
                </Text>
              </ValueBoxRow>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#F57C00',
                }}>
                {sheet.interestRate || 0}%
                {sheet.compoundInterest ? ' (Compd)' : ''}
              </Text>
            </ValueBox>
          </SummaryRow>

          <AvlBalanceRow style={{backgroundColor: theme.colors.bg.listSubCard}}>
            <ValueBoxRow>
              <MaterialCommunityIcons
                name="calendar-range"
                size={16}
                color={theme.colors.text.primary}
              />
              <Text style={{fontSize: 12, marginLeft: 6}}>Start Date</Text>
            </ValueBoxRow>
            <Text style={{fontSize: 14, fontWeight: '600'}}>
              {sheet.loanStartDate
                ? moment(sheet.loanStartDate).format('MMM D, YYYY')
                : '-'}
            </Text>
          </AvlBalanceRow>
        </Card.Content>
      );
    }
    return (
      <Card.Content>
        <SummaryRow>
          {buildValueBox(
            'Income',
            sheet.totalIncome,
            'arrow-up-bold',
            theme.colors.text.success,
          )}
          {buildValueBox(
            'Expense',
            sheet.totalExpense,
            'arrow-down-bold',
            theme.colors.text.error,
          )}
        </SummaryRow>

        <AvlBalanceRow>
          <ValueBoxRow>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={16}
              color={theme.colors.text.primary}
            />
            <Text style={{fontSize: 12, marginLeft: 6}}>Avl Bal</Text>
          </ValueBoxRow>
          <Text style={{fontSize: 14, fontWeight: '600'}}>
            {GetCurrencySymbol(sheet.currency)}{' '}
            {GetCurrencyLocalString(sheet.totalBalance)}
          </Text>
        </AvlBalanceRow>
      </Card.Content>
    );
  };

  return (
    <>
      <View style={{paddingTop: 5, paddingBottom: 10}}>
        <Card.Title
          title={sheet.name}
          titleVariant="titleMedium"
          subtitle={`updated at: ${moment(sheet.updatedAt).calendar()}`}
          subtitleVariant="labelMedium"
          subtitleNumberOfLines={2}
          left={() => <GradientAvatar name={sheet.name} size={40} />}
          right={() => (
            <Ionicons name="chevron-forward-outline" size={30} color="#ccc" />
          )}
        />
        {renderSummary()}
      </View>
      {index < currentLength - 1 && <Divider />}
    </>
  );
};
