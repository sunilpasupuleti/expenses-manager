import {Button, Card} from 'react-native-paper';
import {ButtonText, FlexRow, MainWrapper} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {Platform, useColorScheme, View} from 'react-native';
import {TouchableOpacity} from 'react-native';
import {useContext, useEffect, useState} from 'react';
import {Spacer} from '../../../../components/spacer/spacer.component';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useTheme} from 'styled-components/native';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {formatDate} from '../../../../components/utility/helper';
import {useSelector} from 'react-redux';

const subtractMonths = numOfMonths => {
  let date = new Date();
  date.setMonth(date.getMonth() - numOfMonths);
  return date;
};

export const SheetDetailsFilter = ({navigation, route}) => {
  const theme = useTheme();
  const appTheme = useSelector(state => state.service.theme);
  const themeType = useColorScheme();

  let darkMode =
    appTheme === 'automatic'
      ? themeType === 'light'
        ? false
        : true
      : appTheme === 'light'
      ? false
      : true;

  // for custom date range
  const [customFilter, setCustomFilter] = useState({
    filtered: false,
    fromDate: {
      value: subtractMonths(1),
      showPicker: false,
    },
    toDate: {
      value: new Date(),
      showPicker: false,
    },
    type: 'all',
  });
  // end of custom filter

  useEffect(() => {
    if (route.params && route.params.filter) {
      let fromDate = route.params.filter.fromDate;
      let toDate = route.params.filter.toDate;
      let type = route.params.filter.type;

      if (fromDate) {
        setCustomFilter(p => ({
          ...p,
          fromDate: {
            ...p.fromDate,
            value: new Date(fromDate),
          },
        }));
      }
      if (toDate) {
        setCustomFilter(p => ({
          ...p,
          toDate: {
            ...p.toDate,
            value: new Date(toDate),
          },
        }));
        if (type) {
          setCustomFilter(p => ({
            ...p,
            type: type,
          }));
        }
      }
    }
    navigation.setOptions({
      headerTitle: 'Filter Transactions',
      headerLeft: () => (
        <Button uppercase={false} onPress={() => navigation.goBack()}>
          <ButtonText>Back</ButtonText>
        </Button>
      ),
      headerRight: () => {},
    });
  }, [route.params]);

  const onCustomFilter = () => {
    let fromDate = customFilter.fromDate.value;
    let toDate = customFilter.toDate.value;
    let type = customFilter.type;

    fromDate = moment(fromDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    toDate = moment(toDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    navigation.navigate('SheetDetailsHome', {
      screen: 'Transactions',
      filter: {
        status: true,
        fromDate: fromDate,
        toDate: toDate,
        type: type,
      },
    });
  };

  const onResetCustomFilter = () => {
    navigation.navigate('SheetDetailsHome', {
      screen: 'Transactions',
      filter: {
        status: false,
        fromDate: null,
        toDate: null,
        type: 'all',
      },
    });
  };

  const onCloseFilter = () => {
    navigation.goBack();
  };

  return (
    <SafeArea child={true}>
      <View style={{flex: 1, alignContent: 'center', justifyContent: 'center'}}>
        <Card style={{backgroundColor: theme.colors.bg.card, margin: 1}}>
          <Card.Content>
            <FlexRow justifyContent="space-between">
              <Text>From Date : </Text>
              {Platform.OS === 'android' && (
                <>
                  <TouchableOpacity
                    style={{
                      backgroundColor: theme.colors.brand.secondary,
                      padding: 15,
                      paddingTop: 10,
                      paddingBottom: 10,
                      borderRadius: 10,
                    }}
                    onPress={() =>
                      setCustomFilter(prevState => ({
                        ...prevState,
                        fromDate: {
                          ...prevState.fromDate,
                          showPicker: true,
                        },
                      }))
                    }>
                    <Text fontfamily="bodySemiBold" fontsize="14px">
                      {moment(customFilter.fromDate.value).format(
                        'MMM DD, YYYY',
                      )}
                    </Text>
                  </TouchableOpacity>
                  {customFilter.fromDate.showPicker && (
                    <DateTimePicker
                      mode="date"
                      value={customFilter.fromDate.value}
                      maximumDate={new Date()}
                      onChange={(e, d) => {
                        if (e.type === 'dismissed') {
                          setCustomFilter(p => ({
                            ...p,
                            fromDate: {
                              ...p.fromDate,
                              showPicker: false,
                            },
                          }));
                        }
                        if (d) {
                          if (Platform.OS === 'android') {
                            setCustomFilter(prevState => {
                              return {
                                ...prevState,
                                fromDate: {
                                  ...prevState.fromDate,
                                  showPicker: false,
                                },
                              };
                            });
                          }
                          setCustomFilter(prevState => {
                            return {
                              ...prevState,
                              fromDate: {
                                ...prevState.fromDate,
                                value: d,
                              },
                            };
                          });
                        }
                      }}
                    />
                  )}
                </>
              )}

              {Platform.OS === 'ios' && (
                <DateTimePicker
                  mode="date"
                  themeVariant={darkMode ? 'dark' : 'light'}
                  value={customFilter.fromDate.value}
                  maximumDate={new Date()}
                  onChange={(e, d) => {
                    if (e.type === 'dismissed') {
                      setCustomFilter(p => ({
                        ...p,
                        fromDate: {
                          ...p.fromDate,
                          showPicker: false,
                        },
                      }));
                    }
                    if (d) {
                      if (Platform.OS === 'android') {
                        setCustomFilter(prevState => {
                          return {
                            ...prevState,
                            fromDate: {
                              ...prevState.fromDate,
                              showPicker: false,
                            },
                          };
                        });
                      }
                      setCustomFilter(prevState => {
                        return {
                          ...prevState,
                          fromDate: {
                            ...prevState.fromDate,
                            value: d,
                          },
                        };
                      });
                    }
                  }}
                />
              )}
            </FlexRow>
            <Spacer size={'xlarge'} />
            <FlexRow justifyContent="space-between">
              <Text>To Date : </Text>
              {Platform.OS === 'android' && (
                <>
                  <TouchableOpacity
                    style={{
                      backgroundColor: theme.colors.brand.secondary,
                      padding: 15,
                      paddingTop: 10,
                      paddingBottom: 10,
                      borderRadius: 10,
                    }}
                    onPress={() =>
                      setCustomFilter(prevState => ({
                        ...prevState,
                        toDate: {
                          ...prevState.toDate,
                          showPicker: true,
                        },
                      }))
                    }>
                    <Text fontfamily="bodySemiBold" fontsize="14px">
                      {moment(customFilter.toDate.value).format('MMM DD, YYYY')}
                    </Text>
                  </TouchableOpacity>
                  {customFilter.toDate.showPicker && (
                    <DateTimePicker
                      mode="date"
                      value={customFilter.toDate.value}
                      maximumDate={new Date()}
                      onChange={(e, d) => {
                        if (e.type === 'dismissed') {
                          setCustomFilter(p => ({
                            ...p,
                            toDate: {
                              ...p.toDate,
                              showPicker: false,
                            },
                          }));
                        }
                        if (d) {
                          if (Platform.OS === 'android') {
                            setCustomFilter(prevState => {
                              return {
                                ...prevState,
                                toDate: {
                                  ...prevState.toDate,
                                  showPicker: false,
                                },
                              };
                            });
                          }
                          setCustomFilter(prevState => {
                            return {
                              ...prevState,
                              toDate: {
                                ...prevState.toDate,
                                value: d,
                              },
                            };
                          });
                        }
                      }}
                    />
                  )}
                </>
              )}

              {Platform.OS === 'ios' && (
                <DateTimePicker
                  mode="date"
                  themeVariant={darkMode ? 'dark' : 'light'}
                  value={customFilter.toDate.value}
                  maximumDate={new Date()}
                  onChange={(e, d) => {
                    if (e.type === 'dismissed') {
                      setCustomFilter(p => ({
                        ...p,
                        toDate: {
                          ...p.toDate,
                          showPicker: false,
                        },
                      }));
                    }
                    if (d) {
                      if (Platform.OS === 'android') {
                        setCustomFilter(prevState => {
                          return {
                            ...prevState,
                            toDate: {
                              ...prevState.toDate,
                              showPicker: false,
                            },
                          };
                        });
                      }
                      setCustomFilter(prevState => {
                        return {
                          ...prevState,
                          toDate: {
                            ...prevState.toDate,
                            value: d,
                          },
                        };
                      });
                    }
                  }}
                />
              )}
            </FlexRow>

            <Spacer size={'large'} />
            <FlexRow justifyContent="space-between">
              <Text>Transaction Type: </Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity
                  onPress={() =>
                    setCustomFilter(prev => ({...prev, type: 'all'}))
                  }>
                  <Text
                    fontfamily="bodySemiBold"
                    color={
                      customFilter.type === 'all'
                        ? theme.colors.brand.primary
                        : theme.colors.text.secondary
                    }>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setCustomFilter(prev => ({...prev, type: 'income'}))
                  }>
                  <Text
                    fontfamily="bodySemiBold"
                    color={
                      customFilter.type === 'income'
                        ? theme.colors.brand.primary
                        : theme.colors.text.secondary
                    }>
                    Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setCustomFilter(prev => ({...prev, type: 'expense'}))
                  }>
                  <Text
                    fontfamily="bodySemiBold"
                    color={
                      customFilter.type === 'expense'
                        ? theme.colors.brand.primary
                        : theme.colors.text.secondary
                    }>
                    Expense
                  </Text>
                </TouchableOpacity>
              </View>
            </FlexRow>
          </Card.Content>
          <Card.Actions style={{marginTop: 40}}>
            <Button
              onPress={onCloseFilter}
              contentStyle={{width: 80}}
              mode="text"
              textColor="#aaa">
              Close
            </Button>
            <Spacer position={'right'} size="large" />
            <Button
              onPress={onResetCustomFilter}
              mode="contained"
              buttonColor="tomato"
              textColor="#fff">
              Clear Filter
            </Button>
            <Spacer position={'right'} size="large" />
            <Button onPress={onCustomFilter} mode="contained" textColor="#fff">
              Filter
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </SafeArea>
  );
};
