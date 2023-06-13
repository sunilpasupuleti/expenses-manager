import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  AvailableBalance,
  BorderLine,
  SheetInfoWrapper,
  SheetName,
  TotalBalance,
  TransactionsCount,
  UpdatedTime,
} from './sheet-info-card.styles';
import moment from 'moment';
import React, {useContext} from 'react';
import {View} from 'react-native';
import {FlexRow} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {Spacer} from '../../../../components/spacer/spacer.component';
export const SheetInfoCard = ({sheet = {}, currentLength, index}) => {
  const {sheets} = useContext(SheetsContext);
  return (
    <>
      <FlexRow justifyContent="space-between">
        <SheetInfoWrapper>
          <FlexRow>
            <SheetName archived={sheet.archived} fontsize="16px">
              {sheet.name}
            </SheetName>

            <TransactionsCount>
              ({sheet.details ? sheet.details.length : '0'})
            </TransactionsCount>
          </FlexRow>

          <Spacer size={'medium'}>
            <UpdatedTime
              archived={sheet.archived}
              showTotalBalance={sheet.showTotalBalance}>
              Last Updated : {moment(sheet.updatedAt).calendar()}
            </UpdatedTime>
          </Spacer>
        </SheetInfoWrapper>
        <View style={{marginRight: 10}}>
          <FlexRow>
            {sheet.showTotalBalance && (
              <View style={{marginRight: 10}}>
                <Spacer>
                  <AvailableBalance>Avl Bal </AvailableBalance>
                  <Spacer size={'medium'} />
                  <TotalBalance archived={sheet.archived}>
                    {GetCurrencySymbol(sheet.currency)}{' '}
                    {GetCurrencyLocalString(sheet.totalBalance)}
                  </TotalBalance>
                </Spacer>
              </View>
            )}

            <Ionicons name="chevron-forward-outline" size={30} color="#ccc" />
          </FlexRow>

          {/* <FlexRow>
            <Text fontsize="12px" color="#aaa">
              {sheet.details ? sheet.details.length : '0'}
            </Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
          </FlexRow> */}
        </View>

        {/* <FlexRow>
          <Text fontsize="12px" color="#aaa">
            {sheet.details ? sheet.details.length : '0'}
          </Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
        </FlexRow> */}
      </FlexRow>
      {currentLength > 0 && currentLength - 1 !== index && <BorderLine />}
    </>
  );
};
