import React, {useEffect, useState} from 'react';
import {Text} from '../../../../components/typography/text.component';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {TouchableOpacity} from 'react-native';
import {FlexColumn, FlexRow, MainWrapper} from '../../../../components/styles';
import {useTheme} from 'styled-components/native';
import {useIsFocused} from '@react-navigation/native';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {
  InEx,
  InExAmount,
  InExIcon,
  SheetSummaryTotalBalance,
} from './sheet-details-dashboard.styles';
import LinearGradient from 'react-native-linear-gradient';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {GetCurrencySymbol} from '../../../../components/symbol.currency';

export const SheetDetailsDashboard = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const [sheet, setSheet] = useState(route.params.sheet);

  const getTotalIncome = () => {
    let sheetDetails = sheet.details;
    let totalIncome = 0;
    sheetDetails.forEach(d => {
      if (d.type === 'income') {
        totalIncome += d.amount;
      }
    });
    totalIncome = totalIncome.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return totalIncome;
  };

  const getTotalExpense = () => {
    let sheetDetails = sheet.details;
    let totalExpense = 0;
    sheetDetails.forEach(d => {
      if (d.type === 'expense') {
        totalExpense += d.amount;
      }
    });
    totalExpense = totalExpense.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return totalExpense;
  };

  useEffect(() => {
    if (routeIsFocused) {
      navigation.setOptions({
        headerTitle: '',
        headerStyle: {
          backgroundColor: theme.colors.bg.primary,
        },
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FlexRow>
              <Ionicons
                name="chevron-back-outline"
                size={25}
                color={theme.colors.brand.primary}></Ionicons>
              <Text color={theme.colors.brand.primary}>Back</Text>
            </FlexRow>
          </TouchableOpacity>
        ),
        headerRight: () => null,
      });
    }
  }, [routeIsFocused]);

  return (
    <SafeArea
      style={{
        backgroundColor: theme.colors.bg.primary,
      }}>
      <MainWrapper>
        <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          colors={['#4D9DE9', '#D06AF0', '#F9907D']}
          style={{borderRadius: 15, padding: 20}}>
          <SheetSummaryTotalBalance>
            <Text color="#fff" fontfamily="headingSemiBold" fontsize="16px">
              Total Balance
            </Text>
            <Spacer size={'large'} />
            <Text color="#fff" fontfamily="headingBold" fontsize="38px">
              {GetCurrencySymbol(sheet.currency)}{' '}
              {sheet.totalBalance?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </SheetSummaryTotalBalance>
          <Spacer size={'large'} />
          <FlexRow justifyContent="space-between">
            <InEx>
              <InExIcon>
                <Ionicons name="arrow-down-outline" size={20} color="#32B896" />
              </InExIcon>
              <InExAmount>
                <Text color="#fff" fontfamily="heading" fontsize="16px">
                  Income
                </Text>
                <Spacer />
                <Text color="#fff" fontfamily="headingBold" fontsize="16px">
                  {getTotalIncome()}
                </Text>
              </InExAmount>
            </InEx>

            <InEx>
              <InExIcon>
                <Ionicons name="arrow-up-outline" size={20} color={'tomato'} />
              </InExIcon>
              <InExAmount>
                <Text color="#fff" fontfamily="heading" fontsize="16px">
                  Expenses
                </Text>
                <Spacer />
                <Text color="#fff" fontfamily="headingBold" fontsize="16px">
                  {getTotalExpense()}
                </Text>
              </InExAmount>
            </InEx>
          </FlexRow>
        </LinearGradient>
      </MainWrapper>
    </SafeArea>
  );
};
