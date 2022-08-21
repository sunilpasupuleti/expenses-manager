import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  BorderLine,
  SheetInfoWrapper,
  SheetName,
  TotalBalance,
  UpdatedTime,
} from './sheet-info-card.styles';
import moment from 'moment';
import React, {useContext} from 'react';
import {View} from 'react-native';
import {FlexRow} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {GetCurrencySymbol} from '../../../../components/symbol.currency';
import {Spacer} from '../../../../components/spacer/spacer.component';
export const SheetInfoCard = ({sheet = {}, index}) => {
  const {sheets} = useContext(SheetsContext);

  return (
    <>
      <FlexRow justifyContent="space-between">
        <SheetInfoWrapper>
          <SheetName archived={sheet.archived}>{sheet.name}</SheetName>
          <Spacer size={'medium'}>
            <FlexRow>
              {sheet.showTotalBalance && (
                <TotalBalance archived={sheet.archived}>
                  {GetCurrencySymbol(sheet.currency)}{' '}
                  {sheet.totalBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TotalBalance>
              )}

              <UpdatedTime
                archived={sheet.archived}
                showTotalBalance={sheet.showTotalBalance}>
                {moment(sheet.updatedAt).calendar()}
              </UpdatedTime>
            </FlexRow>
          </Spacer>
        </SheetInfoWrapper>
        <View>
          <FlexRow>
            <Text fontsize="12px" color="#aaa">
              {sheet.details ? sheet.details.length : '0'}
            </Text>
            <Ionicons name="chevron-forward-outline" size={30} color="#ccc" />
          </FlexRow>
        </View>
      </FlexRow>
      {sheets.length - 1 != index && <BorderLine />}
    </>
  );
};
