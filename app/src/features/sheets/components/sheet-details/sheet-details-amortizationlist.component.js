/* eslint-disable react/react-in-jsx-scope */
import {Card} from 'react-native-paper';
import {SectionList, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text} from '../../../../components/typography/text.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import moment from 'moment';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {useTheme} from 'styled-components/native';
import _ from 'lodash';
import {useState} from 'react';
import Collapsible from 'react-native-collapsible';
import {FlexRow} from '../../../../components/styles';

export const SheetDetailsAmortizationList = ({
  amortizationData = [],
  currency,
  currentSheet,
  icon = 'calendar-month',
  color = '#8056d5',
}) => {
  const theme = useTheme();
  const today = moment().startOf('day');
  const paidColor = '#32B896';
  const upcomingColor = color;

  const sortedList = amortizationData.map((item, index) => {
    const date = moment(item.date);
    return {
      index,
      rawDate: date,
      formattedDate: date.format('ddd, MMM DD, YYYY'),
      isPast: date.isBefore(today),
      principal: item.principal,
      interest: item.interest,
      emiPaid: item.emiPaid,
      total: item.totalPayment,
    };
  });

  const groupedByYear = _.groupBy(sortedList, item => item.rawDate.year());

  let cumulativePrincipal = 0;
  const sectionData = Object.entries(groupedByYear).map(([year, data]) => {
    const totalPrincipal = _.sumBy(data, 'principal');
    const totalInterest = _.sumBy(data, 'interest');
    cumulativePrincipal += totalPrincipal;
    const endingBalance = currentSheet.loanAmount - cumulativePrincipal;

    return {
      title: year,
      data,
      totalPrincipal,
      totalInterest,
      endingBalance,
    };
  });

  const [expandedYears, setExpandedYears] = useState(() => {
    const defaultState = {};
    const currentYear = moment().year().toString();
    sectionData.forEach(section => {
      defaultState[section.title] = section.title === currentYear;
    });
    return defaultState;
  });

  const toggleYear = year => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const renderItem = ({item, section}) => {
    if (!expandedYears[section.title]) return null;

    const borderColor = item.emiPaid ? paidColor : upcomingColor;
    const textColor = item.emiPaid ? paidColor : theme.colors.text.primary;

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
          style={{flexDirection: 'row', justifyContent: 'space-between'}}>
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
              </Text>
              <Spacer size="small" />
              <Text fontfamily="heading" fontsize="14px" color={textColor}>
                {item.formattedDate}
              </Text>
              <Spacer size="small" />
              <Text fontfamily="heading" fontsize="13px" color={textColor}>
                Principal: {GetCurrencySymbol(currency)}{' '}
                {GetCurrencyLocalString(item.principal)}
              </Text>
              <Spacer />
              <Text style={{textAlign: 'center'}}>+</Text>
              <Spacer />
              <Text fontfamily="heading" fontsize="13px" color={textColor}>
                Interest: {GetCurrencySymbol(currency)}{' '}
                {GetCurrencyLocalString(item.interest)}
              </Text>
            </View>
          </View>

          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 30,
              marginTop: 20,
            }}>
            <Text fontsize="15px" color={textColor}>
              =
            </Text>
            <Text fontfamily="headingBold" fontsize="15px" color={textColor}>
              {GetCurrencySymbol(currency)} {GetCurrencyLocalString(item.total)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SectionList
      sections={sectionData}
      keyExtractor={(item, idx) => `${item.rawDate}-${idx}`}
      renderItem={renderItem}
      renderSectionHeader={({section}) => {
        const {title, totalPrincipal, totalInterest, endingBalance} = section;
        return (
          <>
            <TouchableOpacity onPress={() => toggleYear(title)}>
              <View
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: theme.colors.bg.card,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.bg.highlight,
                }}>
                <FlexRow justifyContent="space-between" alignItems="center">
                  <Text fontfamily="headingBold" fontsize="16px">
                    📅 &nbsp;&nbsp;{title}
                  </Text>
                  <MaterialCommunityIcon
                    name={expandedYears[title] ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={theme.colors.text.primary}
                  />
                </FlexRow>
                <Spacer size="small" />
                <FlexRow
                  justifyContent="space-between"
                  style={{marginBottom: 6}}>
                  <Text
                    fontfamily="heading"
                    fontsize="13px"
                    style={{color: paidColor}}>
                    Principal: {GetCurrencySymbol(currency)}{' '}
                    {GetCurrencyLocalString(totalPrincipal)}
                  </Text>
                  <Text
                    fontfamily="heading"
                    fontsize="13px"
                    style={{color: 'tomato'}}>
                    Interest: {GetCurrencySymbol(currency)}{' '}
                    {GetCurrencyLocalString(totalInterest)}
                  </Text>
                </FlexRow>
                <FlexRow justifyContent="space-between">
                  <Text
                    fontfamily="heading"
                    fontsize="13px"
                    style={{color: '#4D9DE9'}}>
                    Total Paid: {GetCurrencySymbol(currency)}{' '}
                    {GetCurrencyLocalString(totalPrincipal + totalInterest)}
                  </Text>
                  <Text
                    fontfamily="heading"
                    fontsize="13px"
                    style={{color: theme.colors.text.secondary}}>
                    Balance: {GetCurrencySymbol(currency)}{' '}
                    {GetCurrencyLocalString(endingBalance)}
                  </Text>
                </FlexRow>
              </View>
            </TouchableOpacity>
            <Collapsible
              easing={'easeInOutCubic'}
              collapsed={!expandedYears[title]}
              duration={300}>
              {/* renderItem already handles filtering based on collapse */}
            </Collapsible>
          </>
        );
      }}
      ListHeaderComponent={
        <View style={{alignItems: 'center', marginTop: 16, marginBottom: 10}}>
          <Text fontfamily="headingBold" fontsize="16px">
            Amortization Schedule
          </Text>
          <Spacer size="small" />
          <Text fontfamily="heading" fontsize="15px">
            Principal + Interest shown for each payment
          </Text>
        </View>
      }
      contentContainerStyle={{paddingBottom: 100}}
    />
  );
};
