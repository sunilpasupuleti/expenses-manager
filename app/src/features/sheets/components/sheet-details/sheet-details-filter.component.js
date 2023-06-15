import {Button, Card} from 'react-native-paper';
import {ButtonText, FlexRow} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {Platform} from 'react-native';
import {TouchableOpacity} from 'react-native';
import {useContext, useEffect, useState} from 'react';
import {Spacer} from '../../../../components/spacer/spacer.component';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useTheme} from 'styled-components/native';
import {SheetsContext} from '../../../../services/sheets/sheets.context';

const subtractMonths = numOfMonths => {
  let date = new Date();
  date.setMonth(date.getMonth() - numOfMonths);
  return date;
};

export const SheetDetailsFilter = ({navigation, route}) => {
  const theme = useTheme();

  const [sheet, setSheet] = useState(route.params.sheet);

  const [customFilteredSheet, setCustomFilteredSheet] = useState(
    route.params.sheet,
  );

  const [filteredSheet, setFilteredSheet] = useState(route.params.sheet);

  const {calculateBalance} = useContext(SheetsContext);

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
  });
  // end of custom filter

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Filter Transactions',
      headerLeft: () => (
        <Button uppercase={false} onPress={() => navigation.goBack()}>
          <ButtonText>Back</ButtonText>
        </Button>
      ),
      headerRight: () => {},
    });

    if (route.params) {
      console.log(route.params);
    }
  }, [route.params]);

  const onCustomFilter = () => {
    let fromDate = customFilter.fromDate.value;
    let toDate = customFilter.toDate.value;
    fromDate = moment(fromDate).format('YYYY-MM-DD');
    toDate = moment(toDate).format('YYYY-MM-DD');
    let fsheet = {...filteredSheet};
    let filteredDetails = [];
    fsheet.details.map(sd => {
      let createdDate = moment(sd.date).format('YYYY-MM-DD');
      let isBetweenFilteredDates = moment(createdDate).isBetween(
        fromDate,
        toDate,
        null,
        '[]',
      );
      if (isBetweenFilteredDates) {
        filteredDetails.push(sd);
      }
    });
    fsheet.details = filteredDetails;
    fsheet.totalBalance = calculateBalance(fsheet);
    setSheet(fsheet);
    setCustomFilteredSheet(fsheet);
    // onGroupSheetDetails(fsheet);
    setCustomFilter(p => ({
      ...p,
      filtered: true,
      visible: false,
    }));
  };

  const onResetCustomFilter = () => {
    setCustomFilter({
      filtered: false,
      fromDate: {
        value: subtractMonths(1),
        showPicker: false,
      },
      toDate: {
        value: new Date(),
        showPicker: false,
      },
    });
    let fsheet = {...filteredSheet};
    setSheet(fsheet);
    setCustomFilteredSheet(fsheet);
    // onGroupSheetDetails(fsheet);
  };

  return (
    <Card style={{flex: 1, alignContent: 'center', justifyContent: 'center'}}>
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
                  {moment(customFilter.fromDate.value).format('MMM DD, YYYY')}
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
      </Card.Content>
      <Card.Actions style={{marginTop: 40}}>
        <Button
          onPress={() => navigation.goBack()}
          contentStyle={{width: 80}}
          mode="text"
          textColor="#aaa">
          Close
        </Button>
        <Spacer position={'right'} size="large" />
        <Button
          onPress={() => {
            onResetCustomFilter();
            navigation.goBack();
          }}
          mode="contained"
          buttonColor="tomato"
          textColor="#fff">
          Reset
        </Button>
        <Spacer position={'right'} size="large" />
        <Button
          onPress={onCustomFilter}
          mode="contained"
          buttonColor={theme.colors.brand.primary}
          textColor="#fff">
          Filter
        </Button>
      </Card.Actions>
    </Card>
  );
};
