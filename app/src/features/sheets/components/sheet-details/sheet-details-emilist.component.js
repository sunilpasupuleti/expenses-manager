/* eslint-disable react/react-in-jsx-scope */
import {Card} from 'react-native-paper';
import {FlatList, View} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text} from '../../../../components/typography/text.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import moment from 'moment';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {useTheme} from 'styled-components/native';

export const SheetDetailsEmiList = ({
  allEmiDates = [],
  totalPayments,
  emi,
  totalRepayable,
  currency,
  icon = 'calendar-month',
  color = '#8056d5',
}) => {
  const theme = useTheme();
  const today = moment().startOf('day');
  const paidColor = '#32B896';
  const upcomingColor = color;

  const upcoming = [];
  const past = [];

  allEmiDates.forEach((date, index) => {
    const momentDate = moment(date);
    const formattedDate = momentDate.format('ddd, MMM DD, YYYY');

    const card = {
      index,
      formattedDate,
      rawDate: momentDate,
      isPast: momentDate.isBefore(today),
    };

    card.isPast ? past.push(card) : upcoming.push(card);
  });

  const sortedList = [...upcoming, ...past];

  const renderItem = ({item}) => {
    const isPartial =
      item.index + 1 === Math.ceil(totalPayments) && totalPayments % 1 !== 0;
    const fullEmiCount = Math.floor(totalPayments);
    const partialAmount = totalRepayable - emi * fullEmiCount;
    const amount = isPartial ? partialAmount : emi;

    const displayAmount = `${GetCurrencySymbol(
      currency,
    )} ${GetCurrencyLocalString(amount)}`;
    const borderColor = item.isPast ? paidColor : upcomingColor;
    const textColor = item.isPast ? paidColor : theme.colors.text.primary;
    const subTextColor = item.isPast ? paidColor : theme.colors.text.primary;

    return (
      <Card
        elevation={2}
        style={{
          borderLeftWidth: 4,
          borderLeftColor: borderColor,
          borderRadius: 10,
          marginVertical: 8,
          backgroundColor: theme.colors.bg.card,
        }}>
        <Card.Content
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: borderColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <MaterialCommunityIcon name={icon} size={20} color="#fff" />
            </View>

            <Spacer position="left" size="large" />
            <View>
              <Text fontfamily="headingBold" fontsize="15px" color={textColor}>
                EMI {item.index + 1}
                {isPartial ? ' (Partial)' : ''}
              </Text>
              <Spacer size="small" />
              <Text fontfamily="heading" fontsize="14px" color={subTextColor}>
                {item.formattedDate}
              </Text>
            </View>
          </View>

          <Text fontfamily="headingBold" fontsize="15px" color={textColor}>
            {displayAmount}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <FlatList
      data={sortedList}
      keyExtractor={(item, idx) => `${item.rawDate}-${idx}`}
      renderItem={renderItem}
      ListHeaderComponent={
        <View style={{alignItems: 'center', marginTop: 16, marginBottom: 10}}>
          <Text fontfamily="headingBold" fontsize="16px">
            Total Payments
          </Text>
          <Spacer size="small" />
          <Text fontfamily="heading" fontsize="15px">
            {GetCurrencySymbol(currency)} {GetCurrencyLocalString(emi)} ×{' '}
            {Math.floor(totalPayments)}
            {totalPayments % 1 !== 0 ? ' + 1 (partial)' : ''} ={' '}
            {GetCurrencySymbol(currency)}{' '}
            {GetCurrencyLocalString(totalRepayable)}
          </Text>
        </View>
      }
      contentContainerStyle={{paddingBottom: 100}}
    />
  );
};
