/* eslint-disable react/self-closing-comp */
/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
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
  compoundingOptions,
  getUpcomingEmiDates,
  repaymentFrequencyOptions,
} from '../../../../components/utility/helper';
import {SheetDetailsLoanSummary} from './sheet-details-loan-summary.component';
import {TabsSwitcher} from '../../../../components/tabs-switcher/tabs-switcher.component';
import {SheetDetailsEmiList} from './sheet-details-emilist.component';

export const SheetDetailsDashboard = ({navigation, route}) => {
  const theme = useTheme();
  const routeIsFocused = useIsFocused();
  const {currentSheet} = useContext(SheetsContext);
  const {onCheckUpcomingSheetDetails, getSheetDetailsDashboard} =
    useContext(SheetDetailsContext);
  const [sheetDetails, setSheetDetails] = useState({
    transactions: [],
    totalCount: 0,
  });

  const [activeType, setActiveType] = useState('expense');
  const [loanTab, setLoanTab] = useState('transactions');
  const {reRender} = route.params || {};
  const [emiDates, setEmiDates] = useState([]);
  const [allEmiDates, setAllEmiDates] = useState([]);
  const [displayAmount, setDisplayAmount] = useState('');
  const [displayPercent, setDisplayPercent] = useState('');
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (currentSheet?.isLoanAccount) {
      const repaid = currentSheet.totalRepayable - currentSheet.totalBalance;

      const repaidPercent =
        currentSheet.totalRepayable > 0
          ? (repaid / currentSheet.totalRepayable) * 100
          : 0;

      const {upcomingEmis, allEmis} = getUpcomingEmiDates(
        currentSheet.loanStartDate,
        currentSheet.repaymentFrequency,
        currentSheet.loanYears,
        currentSheet.loanMonths,
        currentSheet.totalPayments || 100,
      );
      setEmiDates(upcomingEmis);
      setAllEmiDates(allEmis);
      onSetActiveType('expense');
      setDisplayAmount(
        `${GetCurrencySymbol(currentSheet.currency)} ${GetCurrencyLocalString(
          repaid,
        )}`,
      );
      let repaidProgress = repaidPercent.toFixed(2);
      repaidProgress = repaidProgress / 100;
      setDisplayPercent(`(${repaidPercent.toFixed(2)}%)`);

      setDisplayProgress(repaidProgress);
    } else {
      setDisplayAmount('');
      setDisplayPercent('');
    }
  }, [currentSheet]);

  useEffect(() => {
    if (routeIsFocused) {
      onSetNavigationOptions();
      checkUpcomingDetails();
      onGetSheetDetailsDashboard(currentSheet, activeType);
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (reRender) {
      onGetSheetDetailsDashboard(currentSheet, activeType);
      navigation.setParams({reRender: false});
    }
  }, [reRender]);

  const getRepaymentFrequencyLabel = key => {
    const option = repaymentFrequencyOptions.find(opt => opt.key === key);
    return option ? option.value : key;
  };

  const getCompoudingFrequencyLabel = key => {
    const option = compoundingOptions.find(opt => opt.key === key);
    return option ? option.value : key;
  };

  const onSetNavigationOptions = () => {
    navigation.setOptions({
      headerTitle:
        currentSheet?.name.length > 20
          ? currentSheet.name.substring(0, 14) + '...'
          : currentSheet.name,
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
      headerRight: () => (
        <Spacer position={'right'} size="large">
          <TouchableOpacity onPress={() => navigation.navigate('SheetExport')}>
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
      ),
    });
  };

  const checkUpcomingDetails = () => {
    onCheckUpcomingSheetDetails(currentSheet, transactionExists => {
      if (transactionExists) {
        onGetSheetDetailsDashboard(currentSheet, activeType);
      }
    });
  };

  const onSetActiveType = type => {
    setActiveType(type);
    onGetSheetDetailsDashboard(currentSheet, type);
  };

  const onGetSheetDetailsDashboard = async (sheet, type) => {
    let data = await getSheetDetailsDashboard(sheet, type);
    if (data) {
      setSheetDetails(data);
    }
  };

  return (
    <SafeArea child={true}>
      {currentSheet && (
        <FlatList
          ListHeaderComponent={
            <MainWrapper>
              <LinearGradient
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                colors={['#4D9DE9', '#D06AF0', '#F9907D']}
                style={{borderRadius: 15, padding: 20}}>
                {currentSheet.isLoanAccount ? (
                  <SheetDetailsLoanSummary
                    currentSheet={currentSheet}
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
                      <Text
                        color="#fff"
                        fontfamily="headingBold"
                        fontsize="38px">
                        {GetCurrencySymbol(currentSheet.currency)}{' '}
                        {GetCurrencyLocalString(currentSheet.totalBalance)}
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
                          <Text
                            color="#fff"
                            fontfamily="heading"
                            fontsize="16px">
                            Income
                          </Text>
                          <Spacer />
                          <Text
                            color="#fff"
                            fontfamily="headingBold"
                            fontsize="16px">
                            {GetCurrencyLocalString(currentSheet.totalIncome)}
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
                          <Text
                            color="#fff"
                            fontfamily="heading"
                            fontsize="16px">
                            Expenses
                          </Text>
                          <Spacer />
                          <Text
                            color="#fff"
                            fontfamily="headingBold"
                            fontsize="16px">
                            {GetCurrencyLocalString(currentSheet.totalExpense)}
                          </Text>
                        </InExAmount>
                      </InEx>
                    </FlexRow>
                  </>
                )}
              </LinearGradient>
              {currentSheet.isLoanAccount ? (
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
              {currentSheet.isLoanAccount ? (
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
                <>
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
                            onPress={() =>
                              navigation.navigate('SheetStatsDetails', {
                                category,
                                sheetDetails: transactions,
                              })
                            }>
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
                                      {GetCurrencySymbol(currentSheet.currency)}{' '}
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
                </>
              )}

              {loanTab === 'emi_schedule' && (
                <View style={{marginTop: 20}}>
                  {allEmiDates.length > 0 ? (
                    <SheetDetailsEmiList
                      allEmiDates={allEmiDates}
                      emi={currentSheet.emi}
                      totalRepayable={currentSheet.totalRepayable}
                      currency={currentSheet.currency}
                      totalPayments={currentSheet.totalPayments}
                    />
                  ) : (
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
                    }}>
                    There are no {_.capitalize(activeType)}s to display. Create
                    one from Transactions tab or Below.
                  </Text>
                </View>
              )}
            </MainWrapper>
          }
        />
      )}

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
