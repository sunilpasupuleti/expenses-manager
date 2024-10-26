import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import React, {useContext} from 'react';
import {View} from 'react-native';
import {FlexRow} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {useTheme} from 'styled-components/native';
import {Card, Divider} from 'react-native-paper';
export const SheetInfoCard = ({sheet = {}, currentLength, index}) => {
  const theme = useTheme();
  return (
    <>
      <View
        style={{
          paddingTop: 5,
          paddingBottom: 10,
        }}>
        <Card.Title
          title={`${sheet.name}`}
          titleVariant="titleMedium"
          subtitle={`updated at: ${moment(sheet.updatedAt).calendar()}`}
          subtitleVariant="labelMedium"
          subtitleNumberOfLines={2}
          right={props => (
            <Ionicons name="chevron-forward-outline" size={30} color="#ccc" />
          )}
        />
        {sheet.showSummary ? (
          <Card.Content>
            <FlexRow justifyContent="space-evenly">
              <View>
                <Text fontsize="14px" color={theme.colors.text.disabled}>
                  Income
                </Text>
                <Spacer>
                  <Text fontsize="14px" color={theme.colors.text.success}>
                    {GetCurrencySymbol(sheet.currency)}{' '}
                    {GetCurrencyLocalString(sheet.totalIncome)}
                  </Text>
                </Spacer>
              </View>

              <Spacer position="left" size="large">
                <View>
                  <Text fontsize="14px" color={theme.colors.text.disabled}>
                    Expense
                  </Text>
                  <Spacer>
                    <Text fontsize="14px" color={theme.colors.text.error}>
                      {GetCurrencySymbol(sheet.currency)}{' '}
                      {GetCurrencyLocalString(sheet.totalExpense)}
                    </Text>
                  </Spacer>
                </View>
              </Spacer>
              <Spacer position="left" size="large">
                <View>
                  <Text fontsize="14px" color={theme.colors.text.disabled}>
                    Avl Bal
                  </Text>
                  <Spacer>
                    <Text fontsize="14px">
                      {GetCurrencySymbol(sheet.currency)}{' '}
                      {GetCurrencyLocalString(sheet.totalBalance)}
                    </Text>
                  </Spacer>
                </View>
              </Spacer>
            </FlexRow>
          </Card.Content>
        ) : null}
      </View>

      {index < currentLength - 1 && <Divider />}
    </>
  );
};
