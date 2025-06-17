/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useMemo, useState} from 'react';
import {Text} from '../../../../components/typography/text.component';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {
  FlatList,
  ScrollView,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  FlexRow,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'styled-components/native';
import {useIsFocused} from '@react-navigation/native';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {
  InEx,
  InExAmount,
  InExIcon,
  LoanProgressBar,
  LoanProgressContainer,
  LoanProgressLabel,
  SheetSummaryTotalBalance,
} from './sheet-details-dashboard.styles';
import LinearGradient from 'react-native-linear-gradient';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {Card} from 'react-native-paper';
import {CategoryColor} from '../../../categories/components/categories.styles';
import _ from 'lodash';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {DashboardAddButton} from './sheet-details.styles';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
import {
  calculateInterestFromAmortizationSchedule,
  compoundingOptions,
  generateAmortizationSchedule,
  getEmiDates,
  getLinkedDbRecord,
  repaymentFrequencyOptions,
} from '../../../../components/utility/helper';
import {SheetDetailsLoanSummary} from './sheet-details-loan-summary.component';
import {TabsSwitcher} from '../../../../components/tabs-switcher/tabs-switcher.component';
import {SheetDetailsEmiList} from './sheet-details-emilist.component';
import {SheetDetailsAmortizationList} from './sheet-details-amortizationlist.component';
import {ObservedSheetDetailsDashboard} from './sheet-details-dashboard.observed';
import moment from 'moment';

export const SheetDetailsDashboard = ({navigation, route, sheet}) => {
  const [activeType, setActiveType] = useState('expense');
  const [loanTab, setLoanTab] = useState('transactions');

  const theme = useTheme();
  const routeIsFocused = useIsFocused();

  const onSetNavigationOptions = () => {
    navigation.setOptions({
      headerTitle:
        sheet?.name.length > 20
          ? sheet.name.substring(0, 14) + '...'
          : sheet.name,
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
      headerRight: !sheet.isLoanAccount
        ? () => (
            <Spacer position={'right'} size="large">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('SheetExport', {
                    sheet: sheet,
                  })
                }>
                <FlexRow>
                  <FontAwesome5
                    name="file-export"
                    size={16}
                    color={theme.colors.brand.primary}
                  />
                  <Spacer position={'right'} size="medium" />
                  <Text color={theme.colors.brand.primary}>Export</Text>
                </FlexRow>
              </TouchableOpacity>
            </Spacer>
          )
        : null,
    });
  };

  useEffect(() => {
    if (routeIsFocused && sheet) {
      onSetNavigationOptions();
    }
  }, [routeIsFocused, sheet]);

  if (!sheet) return;

  return (
    <ObservedSheetDetailsDashboard
      navigation={navigation}
      route={route}
      activeType={activeType}
      setActiveType={setActiveType}
      loanTab={loanTab}
      setLoanTab={setLoanTab}
      sheet={sheet}
      accountId={route.params.sheet.id}
    />
  );
};

export const BaseSheetDetailsDashboard = ({
  navigation,
  route,
  sheet,
  activeType,
  setActiveType,
  loanTab,
  setLoanTab,
  transactions,
}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const {onCheckUpcomingSheetDetails} = useContext(SheetDetailsContext);
  const [sheetDetails, setSheetDetails] = useState({
    transactions: [],
    totalCount: 0,
  });

  const [emiDates, setEmiDates] = useState([]);
  const [allEmiDates, setAllEmiDates] = useState([]);
  const [totalInterest, setTotalInterest] = useState(null);
  const [totalPrincipal, setTotalPrincipal] = useState(null);
  const [payOff, setPayOff] = useState(null);

  const [displayAmount, setDisplayAmount] = useState('');
  const [displayPercent, setDisplayPercent] = useState('');
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    (async () => {
      if (sheet?.isLoanAccount) {
        let repaid = 0;
        let repaidPercent = 0;

        const {
          schedule,
          loanPayoffDuration,
          totalInterest: tInterest,
          totalPrincipal: tPricinpal,
          totalPaid,
          totalInterestPaid,
          totalPrincipalPaid,
        } = calculateInterestFromAmortizationSchedule({
          interestRate: sheet.interestRate,
          loanAmount: sheet.loanAmount,
          repaymentFrequency: sheet.repaymentFrequency,
          startDate: sheet.loanStartDate,
          totalPayments: sheet.totalPayments,
          transactions: transactions,
        });

        const totalExpected = tInterest + tPricinpal;
        repaid = totalPaid;
        repaidPercent =
          totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

        const {upcomingEmis} = getEmiDates(
          sheet.loanStartDate,
          sheet.repaymentFrequency,
          sheet.loanYears,
          sheet.loanMonths,
          sheet.totalPayments || 100,
        );
        setEmiDates(upcomingEmis);

        setTotalInterest(tInterest || 0);
        setTotalPrincipal(tPricinpal || 0);
        setPayOff(loanPayoffDuration);
        setAllEmiDates(schedule);

        onSetActiveType('expense');
        setDisplayAmount(
          `${GetCurrencySymbol(sheet.currency)} ${GetCurrencyLocalString(
            repaid,
          )}`,
        );
        const repaidProgress = +(repaidPercent / 100).toFixed(4);
        setDisplayPercent(`(${repaidPercent.toFixed(2)}%)`);
        setDisplayProgress(repaidProgress);
      } else {
        setDisplayAmount('');
        setDisplayPercent('');
      }
    })();
  }, [sheet]);

  useEffect(() => {
    if (routeIsFocused) {
      checkUpcomingDetails();
    }
  }, [routeIsFocused]);

  const processTransactions = async () => {
    const grouped = _.groupBy(transactions, t => t.category?.id);
    const totalBalance = _.sumBy(transactions, t => t.amount);

    const categoryWiseData = await Promise.all(
      Object.keys(grouped).map(async key => {
        const entries = grouped[key];
        const category = await getLinkedDbRecord(entries[0], 'category');

        const totalAmount = _.sumBy(entries, t => t.amount);
        const totalPercentage =
          totalBalance === 0
            ? 0
            : parseFloat(((totalAmount / totalBalance) * 100).toFixed(2));

        return {
          category,
          transactions: entries,
          totalAmount,
          totalPercentage,
        };
      }),
    );

    // Sort descending by percentage
    categoryWiseData.sort((a, b) => b.totalPercentage - a.totalPercentage);

    setSheetDetails({
      totalCount: transactions.length,
      transactions: categoryWiseData,
      finalAmount: totalBalance,
    });
  };

  useEffect(() => {
    if (transactions?.length > 0) {
      processTransactions();
    } else {
      setSheetDetails({totalCount: 0, transactions: [], finalAmount: 0});
    }
  }, [transactions]);

  const getRepaymentFrequencyLabel = key => {
    const option = repaymentFrequencyOptions.find(opt => opt.key === key);
    return option ? option.value : key;
  };

  const getCompoudingFrequencyLabel = key => {
    const option = compoundingOptions.find(opt => opt.key === key);
    return option ? option.value : key;
  };

  const checkUpcomingDetails = () => {
    onCheckUpcomingSheetDetails(sheet, transactionExists => {});
  };

  const onSetActiveType = type => {
    setActiveType(type);
  };

  return (
    <SafeArea child={true}>
      <FlatList
        ListHeaderComponent={
          <MainWrapper>
            <LinearGradient
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              colors={['#4D9DE9', '#D06AF0', '#F9907D']}
              style={{borderRadius: 15, padding: 20}}>
              {sheet.isLoanAccount ? (
                <SheetDetailsLoanSummary
                  currentSheet={sheet}
                  emiDates={emiDates}
                  getCompoundingLabel={getCompoudingFrequencyLabel}
                  getRepaymentLabel={getRepaymentFrequencyLabel}
                />
              ) : (
                <>
                  <SheetSummaryTotalBalance>
                    <Text
                      color="#fff"
                      fontfamily="headingSemiBold"
                      fontsize="16px">
                      Total Balance
                    </Text>
                    <Spacer size={'large'} />
                    <Text color="#fff" fontfamily="headingBold" fontsize="38px">
                      {GetCurrencySymbol(sheet.currency)}{' '}
                      {GetCurrencyLocalString(sheet.totalBalance)}
                    </Text>
                  </SheetSummaryTotalBalance>
                  <Spacer size={'large'} />
                  <FlexRow justifyContent="space-between">
                    <InEx>
                      <InExIcon>
                        <Ionicons
                          name="arrow-down-outline"
                          size={20}
                          color="#32B896"
                        />
                      </InExIcon>
                      <InExAmount>
                        <Text color="#fff" fontfamily="heading" fontsize="16px">
                          Income
                        </Text>
                        <Spacer />
                        <Text
                          color="#fff"
                          fontfamily="headingBold"
                          fontsize="16px">
                          {GetCurrencyLocalString(sheet.totalIncome)}
                        </Text>
                      </InExAmount>
                    </InEx>
                    <InEx>
                      <InExIcon>
                        <Ionicons
                          name="arrow-up-outline"
                          size={20}
                          color="tomato"
                        />
                      </InExIcon>
                      <InExAmount>
                        <Text color="#fff" fontfamily="heading" fontsize="16px">
                          Expenses
                        </Text>
                        <Spacer />
                        <Text
                          color="#fff"
                          fontfamily="headingBold"
                          fontsize="16px">
                          {GetCurrencyLocalString(sheet.totalExpense)}
                        </Text>
                      </InExAmount>
                    </InEx>
                  </FlexRow>
                </>
              )}
            </LinearGradient>
            {sheet.isLoanAccount ? (
              <LoanProgressContainer>
                <LoanProgressLabel>
                  Loan Repaid : {`${displayAmount} ${displayPercent}`}
                </LoanProgressLabel>
                <LoanProgressBar progress={displayProgress} />
              </LoanProgressContainer>
            ) : (
              <></>
            )}

            <Spacer size={'large'} />
            {sheet.isLoanAccount ? (
              <TabsSwitcher
                tabs={[
                  {key: 'transactions', label: 'Transactions'},
                  {key: 'emi_schedule', label: 'EMI Schedule'},
                ]}
                activeKey={loanTab}
                setActiveKey={setLoanTab}
              />
            ) : (
              <TabsSwitcher
                tabs={[
                  {key: 'expense', label: 'Expense'},
                  {key: 'income', label: 'Income'},
                ]}
                activeKey={activeType}
                setActiveKey={onSetActiveType}
                tabReverse={true}
              />
            )}

            {loanTab === 'transactions' && sheetDetails.totalCount > 0 && (
              <View style={{marginBottom: 100}}>
                {sheetDetails.transactions.map((sd, index) => {
                  let {category, transactions, totalAmount, totalPercentage} =
                    sd;
                  let {icon, name, color} = category;
                  return (
                    <Spacer size={'large'} key={index}>
                      <Card
                        theme={{roundness: 0}}
                        elevation={2}
                        style={{
                          position: 'relative',
                          borderTopLeftRadius: 10,
                          borderTopRightRadius: 10,
                          backgroundColor: theme.colors.bg.card,
                          margin: 1,
                        }}>
                        <TouchableHighlightWithColor
                          style={{
                            paddingTop: 12,
                            paddingBottom: 12,
                            paddingLeft: 0,
                            paddingRight: 0,
                          }}
                          onPress={() => {
                            navigation.navigate('SheetStatsDetails', {
                              category,
                              sheet: sheet,
                            });
                          }}>
                          <>
                            <View
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                height: 2,
                                width: totalPercentage + '%',
                                backgroundColor: color,
                              }}
                            />
                            <Card.Content>
                              <FlexRow justifyContent="space-between">
                                <FlexRow>
                                  <CategoryColor
                                    color={category.color}
                                    style={{width: 50, height: 50}}>
                                    {icon && (
                                      <MaterialCommunityIcon
                                        name={icon}
                                        size={22}
                                        color="#fff"
                                      />
                                    )}
                                  </CategoryColor>
                                  <Spacer size={'large'} position="left" />
                                  <Text fontsize="16px" fontfamily="heading">
                                    {name}
                                  </Text>
                                </FlexRow>
                                <View>
                                  <Text fontsize="14px" fontfamily="heading">
                                    {GetCurrencySymbol(sheet.currency)}{' '}
                                    {activeType === 'expense' && '-'}{' '}
                                    {GetCurrencyLocalString(totalAmount)}
                                    {/* -40,000.23 */}
                                  </Text>
                                  <Spacer size={'medium'} />
                                  <FlexRow justifyContent="flex-end">
                                    <Text
                                      fontsize="16px"
                                      fontfamily="heading"
                                      color="grey">
                                      {totalPercentage}%
                                    </Text>
                                  </FlexRow>
                                </View>
                              </FlexRow>
                            </Card.Content>
                          </>
                        </TouchableHighlightWithColor>
                      </Card>
                    </Spacer>
                  );
                })}
              </View>
            )}

            {loanTab === 'emi_schedule' && (
              <View style={{marginTop: 20}}>
                {allEmiDates.length > 0 ? (
                  // sheet.useReducingBalance ? (
                  <SheetDetailsAmortizationList
                    totalInterest={totalInterest}
                    totalPrincipal={totalPrincipal}
                    payOff={payOff}
                    amortizationData={allEmiDates}
                    currentSheet={sheet}
                    currency={sheet.currency}
                  />
                ) : (
                  // ) : (
                  //   <SheetDetailsEmiList
                  //     allEmiDates={allEmiDates}
                  //     emi={sheet.emi}
                  //     totalRepayable={sheet.totalRepayable}
                  //     currency={sheet.currency}
                  //     totalPayments={sheet.totalPayments}
                  //   />
                  // )
                  <Text style={{textAlign: 'center'}}>
                    No EMI schedule found.
                  </Text>
                )}
              </View>
            )}

            {loanTab === 'transactions' && sheetDetails.totalCount === 0 && (
              <View
                style={{
                  marginTop: 100,
                }}>
                <Text
                  fontfamily="heading"
                  style={{
                    textAlign: 'center',
                    letterSpacing: 1,
                    lineHeight: 30,
                    marginBottom: 100,
                  }}>
                  There are no {_.capitalize(activeType)}s to display. Create
                  one from Transactions tab or Below.
                </Text>
              </View>
            )}
          </MainWrapper>
        }
      />

      <DashboardAddButton>
        <TouchableNativeFeedback
          onPress={() => {
            navigation.navigate('AddSheetDetail', {
              activeType: activeType,
            });
          }}>
          <FlexRow>
            <AntDesign name="plus" size={20} color={'#fff'} />
          </FlexRow>
        </TouchableNativeFeedback>
      </DashboardAddButton>
    </SafeArea>
  );
};
