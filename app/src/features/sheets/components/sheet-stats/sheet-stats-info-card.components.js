import Ionicons from 'react-native-vector-icons/Ionicons';
import React from 'react';
import {View} from 'react-native';
import {ProgressBar} from 'react-native-paper';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlexRow} from '../../../../components/styles';
import {GetCurrencySymbol} from '../../../../components/symbol.currency';
import {Text} from '../../../../components/typography/text.component';
import {
  SheetDetailCategory,
  SheetDetailCategoryColor,
} from '../sheet-details/sheet-details.styles';

export const StatsInfoCard = ({
  category,
  percentage,
  activeType,
  totalBalance,
  currency,
}) => {
  return (
    <>
      <View style={{marginRight: 10}}>
        <SheetDetailCategoryColor color={category.color} />
        <FlexRow justifyContent="space-between">
          <Spacer position={'left'} size={'large'}>
            <SheetDetailCategory>{category.name} </SheetDetailCategory>
          </Spacer>
          <FlexRow>
            <Text color="#8a8a8d" fontfamily="bodyBold">
              {Math.round(percentage * 100).toString() + '%'}{' '}
            </Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#8a8a8d"
            />
          </FlexRow>
        </FlexRow>
        <Spacer position={'left'} size={'large'}>
          <Spacer />
          <Text fontsize="14px" color="#8a8a8d" fontfamily="bodyBold">
            {activeType === 'expense' && '-'}
            {GetCurrencySymbol(currency)}{' '}
            {totalBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
          </Text>
          {!category.total && (
            <Spacer>
              <ProgressBar
                style={{backgroundColor: '#ccc'}}
                color={category.color}
                progress={percentage}
              />
            </Spacer>
          )}
        </Spacer>

        <Spacer size={'large'} />
      </View>
      <Spacer size={'large'} />
    </>
  );
};