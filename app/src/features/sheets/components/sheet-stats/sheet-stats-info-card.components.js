import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext} from 'react';
import {View} from 'react-native';
import {ProgressBar} from 'react-native-paper';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {FlexRow} from '../../../../components/styles';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {Text} from '../../../../components/typography/text.component';
import {SheetDetailCategory} from '../sheet-details/sheet-details.styles';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  SheetStatsCategoryColor,
  SheetStatsProgressBar,
} from './sheet-stats.styles';
import * as Progress from 'react-native-progress';

const isValidIcon = icon => icon && icon !== 'unknown' && icon.trim() !== '';

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
        <SheetStatsCategoryColor color={category.color}>
          {isValidIcon(category.icon) && (
            <MaterialCommunityIcon
              name={category.icon}
              size={16}
              color="#fff"
            />
          )}
        </SheetStatsCategoryColor>
        <Spacer position={'left'} size={'xlarge'}>
          <Spacer position={'left'} size={'large'}>
            <FlexRow justifyContent="space-between">
              <SheetDetailCategory>{category.name} </SheetDetailCategory>
              <FlexRow>
                <Text color="#8a8a8d" fontfamily="bodyBold">
                  {percentage + '%'}{' '}
                </Text>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color="#8a8a8d"
                />
              </FlexRow>
            </FlexRow>
          </Spacer>
        </Spacer>

        <Spacer position={'left'} size={'large'}>
          <Spacer position={'left'} size={'xlarge'}>
            <Spacer />
            <Text fontsize="14px" color="#8a8a8d" fontfamily="bodyBold">
              {GetCurrencySymbol(currency)} {activeType === 'expense' && '-'}
              {GetCurrencyLocalString(totalBalance)}{' '}
            </Text>

            {!category.total && (
              <SheetStatsProgressBar
                progress={(percentage || 0) / 100}
                color={category.color}
              />
            )}
          </Spacer>
        </Spacer>

        <Spacer size={'large'} />
      </View>
      <Spacer size={'large'} />
    </>
  );
};
