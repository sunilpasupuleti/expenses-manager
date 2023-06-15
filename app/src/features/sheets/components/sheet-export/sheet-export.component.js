import {useState} from 'react';
import {Button, Card, Divider, RadioButton, Switch} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Text} from '../../../../components/typography/text.component';
import React from 'react';
import {Platform, TouchableOpacity, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {ButtonText, FlexRow} from '../../../../components/styles';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {useContext} from 'react';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import _ from 'lodash';
import {useEffect} from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {useDispatch} from 'react-redux';
import {notificationActions} from '../../../../store/notification-slice';

const onSetFromDate = () => {
  let date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setDate(date.getDate() - 1);

  return date;
};

export const SheetExport = ({navigation, route}) => {
  const [sheet, setSheet] = useState(null);
  const [type, setType] = useState(null);
  const [categoryType, setCategoryType] = useState(null);
  const dispatch = useDispatch();
  const [categories, setCategories] = useState(null);
  const [openDropdownPicker, setOpenDropdownPicker] = useState(false);
  const [dateFilter, setDateFilter] = useState(false);

  const [showPicker, setShowPicker] = useState({
    from: false,
    to: false,
  });

  const [fromDate, setFromDate] = useState(onSetFromDate());
  const [toDate, setToDate] = useState(new Date());

  const [items, setItems] = useState([]);
  const [itemsColors, setItemColors] = useState([]);

  const {
    categories: allCategories,
    onExportDataToExcel,
    onExportDataToPdf,
  } = useContext(SheetsContext);
  const theme = useTheme();

  const onCompleteExporting = () => {
    navigation.goBack();
  };

  const onResetFilters = () => {
    setCategories([]);
    setDateFilter(false);
    setFromDate(onSetFromDate());
    setToDate(new Date());
    setCategoryType(null);
    setType(null);
    setOpenDropdownPicker(false);
  };

  useEffect(() => {
    if (categoryType) {
      let cat = allCategories[categoryType];
      let values = [];
      let colors = [];
      cat.forEach(item => {
        let obj = {
          label: _.capitalize(item.name),
          value: item.id,
        };
        values.push(obj);
        let categoryObj = cat.filter(c => c.id === item.id)[0];
        if (!categoryObj) {
          colors.push(item.color);
        } else {
          colors.push(categoryObj.color);
        }
      });
      setItems(values);
      setItemColors(colors);
      setCategories([]);
    }
  }, [categoryType]);

  const onFilter = config => {
    let sheetDetails = sheet.details;

    if (!type) {
      setModalOpen(false);
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Please select the format (Pdf or Excel)',
        }),
      );
      return;
    }

    if (categoryType && categories.length && categories.length > 0) {
      sheetDetails = sheetDetails.filter(
        s => categories.includes(s.category.id) && s.type === categoryType,
      );
    }
    if (categoryType && !categories.length) {
      sheetDetails = sheetDetails.filter(s => s.type === categoryType);
    }

    if (dateFilter) {
      //   for exact filter between dates
      // let from = new Date(fromDate); //minus one day
      // let to = new Date(toDate); //plus one day

      // const fromDateMonth = moment(fromDate).format('M');
      // const fromDateDay = moment(fromDate).format('D');

      // const toDateDaysInMonth = moment(toDate).daysInMonth();
      // const toDateMonth = moment(toDate).format('M');
      // const toDateDay = moment(toDate).format('D');

      // from.setDate(Number(fromDateDay) - 1);
      // Number(fromDateDay) === 1
      //   ? from.setMonth(fromDate.getMonth() - 1)
      //   : from.setMonth(fromDate.getMonth());

      // Number(fromDateMonth) === 1 && Number(fromDateDay) === 1
      //   ? from.setFullYear(fromDate.getFullYear() - 1)
      //   : from.setFullYear(fromDate.getFullYear());

      let from = moment(fromDate).format('YYYY-MM-DD');

      // to.setDate(Number(toDateDay) + 1);

      // Number(toDateDay) >= Number(toDateDaysInMonth)
      //   ? to.setMonth(toDate.getMonth() + 1)
      //   : to.setMonth(toDate.getMonth());

      // Number(toDateMonth) === 12 &&
      // Number(toDateDay) >= Number(toDateDaysInMonth)
      //   ? to.setFullYear(toDate.getFullYear() + 1)
      //   : to.setFullYear(toDate.getFullYear());

      let to = moment(toDate).format('YYYY-MM-DD');

      let filteredDetails = [];
      sheetDetails.map(sd => {
        let createdDate = moment(sd.date).format('YYYY-MM-DD');
        let isBetweenFilteredDates = moment(createdDate).isBetween(
          from,
          to,
          null,
          '[]',
        );

        if (isBetweenFilteredDates) {
          filteredDetails.push(sd);
        }
      });
      sheetDetails = filteredDetails;
    }

    let sortedSheetDetails = _(sheetDetails)
      .sortBy(item => moment(item.date).format('YYYY-MM-DD'))
      .value();

    if (!sortedSheetDetails || sortedSheetDetails.length === 0) {
      setModalOpen(false);
      dispatch(
        notificationActions.showToast({
          status: 'warning',
          message: 'There were no transactions found with selected filters.',
        }),
      );
      return;
    }

    if (type === 'pdf') {
      exportPdf(config, sortedSheetDetails);
    }
    if (type === 'excel') {
      exportExcel(config, sortedSheetDetails);
    }
  };

  const exportExcel = (configData, sheetDetails) => {
    let totalIncome = 0;
    let totalExpense = 0;
    let structuredDetails = [];
    sheetDetails.forEach((d, i) => {
      let date = moment(d.date).format('MMM DD, YYYY ');
      if (d.showTime) {
        let time = moment(d.time).format('hh:mm A');
        date += time;
      }
      if (d.type === 'expense') {
        totalExpense += d.amount;
      } else {
        totalIncome += d.amount;
      }

      let amount = `AMOUNT ( ${GetCurrencySymbol(sheet.currency)} )`;
      let detail = {
        'S.NO': i + 1,
        TITLE: d.notes,
        CATEGORY: d.category.name,
        DATE: date,
        [amount]: d.type === 'expense' ? -d.amount : d.amount,
      };
      structuredDetails.push(detail);
    });

    let extraCells = [
      ['', '', '', '', '', ''],
      [
        '',
        '',
        '',
        'TOTAL INCOME ',
        GetCurrencySymbol(sheet.currency) +
          ' ' +
          GetCurrencyLocalString(totalIncome),
      ],
      [
        '',
        '',
        '',
        'TOTAL EXPENSES ',
        GetCurrencySymbol(sheet.currency) +
          ' ' +
          GetCurrencyLocalString(totalExpense),
      ],
      [
        '',
        '',
        '',
        'BALANCE',
        GetCurrencySymbol(sheet.currency) +
          ' ' +
          GetCurrencyLocalString(totalIncome - totalExpense),
      ],
    ];
    let config = {
      title: sheet.name.toUpperCase(),
      extraCells,
      sheet: {...sheet},
      wscols: [{wch: 5}, {wch: 40}, {wch: 40}, {wch: 25}, {wch: 25}],
      ...configData,
    };
    onCompleteExporting();
    onExportDataToExcel(config, structuredDetails);
  };

  const exportPdf = (configData, sheetDetails) => {
    onCompleteExporting();
    let finalSheet = {...sheet};
    finalSheet.details = sheetDetails;
    let config = {
      ...configData,
    };
    onExportDataToPdf(config, finalSheet);
  };

  const toggleSwithStyles = {
    backgroundColor: Platform.OS !== 'ios' && theme.colors.switchBg,
    padding: 3,
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Export ' + sheet?.name,
      headerLeft: () => (
        <Button uppercase={false} onPress={() => navigation.goBack()}>
          <ButtonText>Back</ButtonText>
        </Button>
      ),
      headerRight: () => {},
    });
  }, [sheet]);

  useEffect(() => {
    if (route.params && route.params.sheet) {
      let sh = route.params.sheet;
      console.log(sh);

      setSheet(sh);
    }
  }, [route.params]);

  return (
    <Card style={{flex: 1}}>
      <Card.Content
        style={{
          paddingTop: 50,
        }}>
        <RadioButton.Group
          onValueChange={newValue => setType(newValue)}
          value={type}>
          <Text fontfamily="heading">Select Format *</Text>
          <Spacer />
          <FlexRow justifyContent="space-between">
            <FlexRow>
              <RadioButton.Android
                color={theme.colors.brand.primary}
                value="pdf"
              />
              <Text>Pdf</Text>
            </FlexRow>
            <FlexRow>
              <RadioButton.Android
                color={theme.colors.brand.primary}
                value="excel"
              />
              <Text>Excel</Text>
            </FlexRow>
          </FlexRow>
        </RadioButton.Group>

        <Spacer size={'large'} />
        <RadioButton.Group
          onValueChange={newValue => setCategoryType(newValue)}
          value={categoryType}>
          <Text fontfamily="heading">Category Type (optional)</Text>
          <Spacer />
          <FlexRow justifyContent="space-between">
            <FlexRow>
              <RadioButton.Android
                color={theme.colors.brand.primary}
                value="expense"
              />
              <Text>Expense</Text>
            </FlexRow>
            <FlexRow>
              <RadioButton.Android
                color={theme.colors.brand.primary}
                value="income"
              />
              <Text>Income</Text>
            </FlexRow>
          </FlexRow>
        </RadioButton.Group>

        {categoryType && (
          <>
            <Spacer size={'large'} />
            <DropDownPicker
              placeholder="Select categories (optional)"
              style={{
                borderWidth: 0.2,
              }}
              open={openDropdownPicker}
              value={categories}
              items={items}
              setOpen={setOpenDropdownPicker}
              setValue={setCategories}
              setItems={setItems}
              multiple={true}
              mode="BADGE"
              textStyle={{
                color: theme.colors.text.primary,
              }}
              stickyHeader
              badgeDotColors={itemsColors}
              dropDownDirection="TOP"
              dropDownContainerStyle={{
                backgroundColor: 'whitesmoke',
                borderWidth: 0.2,
                overflow: 'scroll',
              }}
            />
          </>
        )}
        <Spacer size={'large'} />
        <FlexRow justifyContent="space-between">
          <Text fontfamily="heading">Date Filter (optional)</Text>
          <View style={toggleSwithStyles}>
            <Switch
              value={dateFilter}
              color={theme.colors.brand.primary}
              onValueChange={() => setDateFilter(!dateFilter)}
            />
          </View>
        </FlexRow>
        <Spacer size={'xlarge'} />
        {dateFilter && (
          <>
            <FlexRow justifyContent="space-between">
              <FlexRow>
                <Ionicons
                  name="calendar-outline"
                  size={25}
                  color={theme.colors.brand.primary}></Ionicons>
                <Spacer position={'left'} />
                <Text fontfamily="heading">From </Text>
              </FlexRow>

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
                      setShowPicker(prevState => ({
                        ...prevState,
                        from: true,
                      }))
                    }>
                    <Text fontfamily="bodySemiBold" fontsize="14px">
                      {moment(fromDate).format('DD MMM YYYY')}
                    </Text>
                  </TouchableOpacity>
                  {showPicker.from && (
                    <DateTimePicker
                      mode="date"
                      value={fromDate}
                      maximumDate={new Date()}
                      onChange={(e, d) => {
                        console.log(e);
                        if (e.type === 'dismissed') {
                          setShowPicker(prev => ({
                            ...prev,
                            from: false,
                          }));
                        }
                        if (d) {
                          if (Platform.OS === 'android') {
                            setShowPicker(prevState => {
                              return {
                                ...prevState,
                                from: false,
                              };
                            });
                          }
                          setFromDate(d);
                        }
                      }}
                    />
                  )}
                </>
              )}

              {Platform.OS === 'ios' && (
                <DateTimePicker
                  mode="date"
                  maximumDate={new Date(toDate)}
                  value={fromDate}
                  onChange={(e, d) => {
                    if (e.type === 'dismissed') {
                      setShowPicker(prev => ({
                        ...prev,
                        from: false,
                      }));
                    }
                    if (d) {
                      if (Platform.OS === 'android') {
                        setShowPicker(prevState => {
                          return {
                            ...prevState,
                            from: false,
                          };
                        });
                      }
                      setFromDate(d);
                    }
                  }}
                />
              )}
            </FlexRow>
            <Spacer />
            <Divider />
            <Spacer size={'large'} />

            <FlexRow justifyContent="space-between">
              <FlexRow>
                <Ionicons
                  name="time-outline"
                  size={25}
                  color={theme.colors.brand.primary}></Ionicons>
                <Spacer position={'left'} />
                <Text fontfamily="heading">To</Text>
              </FlexRow>

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
                      setShowPicker(prevState => ({
                        ...prevState,
                        to: true,
                      }))
                    }>
                    <Text fontfamily="bodySemiBold" fontsize="14px">
                      {moment(toDate).format('DD MMM YYYY')}
                    </Text>
                  </TouchableOpacity>
                  {showPicker.to && (
                    <DateTimePicker
                      maximumDate={new Date()}
                      mode="date"
                      value={toDate}
                      onChange={(e, t) => {
                        if (e.type === 'dismissed') {
                          setShowPicker(prev => ({
                            ...prev,
                            to: false,
                          }));
                        }
                        if (t) {
                          if (Platform.OS === 'android') {
                            setShowPicker(prevState => {
                              return {
                                ...prevState,
                                to: false,
                              };
                            });
                          }
                          setToDate(t);
                        }
                      }}
                    />
                  )}
                </>
              )}

              {Platform.OS === 'ios' && (
                <DateTimePicker
                  maximumDate={new Date()}
                  mode="date"
                  value={toDate}
                  onChange={(e, t) => {
                    if (e.type === 'dismissed') {
                      setShowPicker(prev => ({
                        ...prev,
                        to: false,
                      }));
                    }
                    if (t) {
                      if (Platform.OS === 'android') {
                        setShowPicker(prevState => {
                          return {
                            ...prevState,
                            to: false,
                          };
                        });
                      }
                      setToDate(t);
                    }
                  }}
                />
              )}
            </FlexRow>
            <Spacer />
            <Divider />
            <Spacer size={'large'} />

            <Spacer position={'bottom'} size="large" />
          </>
        )}

        <Spacer size={'large'} />
      </Card.Content>
      <Card.Actions
        style={{
          alignSelf: 'flex-end',
          marginRight: 10,
        }}>
        <Button onPress={onResetFilters} buttonColor={'#aaa'} textColor="#fff">
          Reset
        </Button>
        <Spacer size={'medium'} position="right" />
        <Button
          mode="contained"
          onPress={() => onFilter({sharing: true})}
          style={{
            backgroundColor: '#01AFDB',
          }}
          icon="share">
          SHARE
        </Button>
        <Spacer size={'medium'} position="right" />
        <Button
          onPress={() => onFilter({})}
          mode="contained"
          style={{
            backgroundColor: '#32B997',
          }}
          icon="download">
          Export
        </Button>
      </Card.Actions>
    </Card>
  );
};
