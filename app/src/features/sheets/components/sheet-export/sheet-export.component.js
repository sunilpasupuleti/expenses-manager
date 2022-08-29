import {useState} from 'react';
import {
  Button,
  Card,
  Divider,
  Modal,
  Portal,
  RadioButton,
  Switch,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Text} from '../../../../components/typography/text.component';
import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {FlexColumn, FlexRow} from '../../../../components/styles';
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

const subtractYears = numOfYears => {
  let date = new Date();
  date.setFullYear(date.getFullYear() - numOfYears);
  return date;
};

export const SheetExport = ({sheet, modalOpen, setModalOpen}) => {
  const [type, setType] = useState(null);
  const [categoryType, setCategoryType] = useState(null);
  const dispatch = useDispatch();
  const [categories, setCategories] = useState(null);
  const [openDropdownPicker, setOpenDropdownPicker] = useState(false);
  const [dateFilter, setDateFilter] = useState(false);

  const [showPicker, setShowPicker] = useState({
    from: Platform.OS === 'ios' ? true : false,
    to: Platform.OS === 'ios' ? true : false,
  });

  const [fromDate, setFromDate] = useState(subtractYears(1));
  const [toDate, setToDate] = useState(new Date());

  const [value, setValue] = useState(null);

  const [items, setItems] = useState([]);
  const [itemsColors, setItemColors] = useState([]);

  const {
    categories: allCategories,
    onExportDataToExcel,
    onExportDataToPdf,
  } = useContext(SheetsContext);
  const theme = useTheme();
  const onHideModal = () => {
    setModalOpen(false);
    onResetFilters();
  };

  const onResetFilters = () => {
    setCategories([]);
    setDateFilter(false);
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

  const onFilter = () => {
    let finalData = [];
    let sheetDetails = sheet.details;
    if (categoryType && categories.length && categories.length > 0) {
      sheetDetails = sheetDetails.filter(
        s => categories.includes(s.category.id) && s.type === categoryType,
      );
    }
    if (categoryType && !categories.length) {
      sheetDetails = sheetDetails.filter(s => s.type === categoryType);
    }

    if (dateFilter) {
      let date = new Date();
      //   for exact filter between dates
      let from = new Date(); //minus one day
      let to = new Date(); //plus one day

      from.setDate(fromDate.getDate() - 1);
      from.setMonth(fromDate.getMonth());
      from.setFullYear(fromDate.getFullYear());

      to.setDate(toDate.getDate() + 1);
      to.setMonth(toDate.getMonth());
      to.setFullYear(toDate.getFullYear());

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
      exportPdf(sortedSheetDetails);
    }
    if (type === 'excel') {
      exportExcel(sortedSheetDetails);
    }
  };

  const exportExcel = sheetDetails => {
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
    };
    onHideModal();
    onExportDataToExcel(config, structuredDetails);
  };

  const exportPdf = sheetDetails => {
    onHideModal();
    let finalSheet = {...sheet};
    finalSheet.details = sheetDetails;

    onExportDataToPdf(finalSheet, sheetDetails);
  };

  return (
    <Portal>
      <Modal visible={modalOpen} onDismiss={onHideModal}>
        <Card>
          {/* <Card.Title title="Export options"></Card.Title> */}
          <Card.Content>
            <RadioButton.Group
              onValueChange={newValue => setType(newValue)}
              value={type}>
              <FlexRow justifyContent="space-between">
                <Text fontfamily="heading">Select Format * </Text>

                <>
                  <FlexRow>
                    <RadioButton
                      color={theme.colors.brand.primary}
                      value="pdf"
                    />
                    <Text>Pdf</Text>
                  </FlexRow>
                  <FlexRow>
                    <RadioButton
                      color={theme.colors.brand.primary}
                      value="excel"
                    />
                    <Text>Excel</Text>
                  </FlexRow>
                </>
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
                  <RadioButton
                    color={theme.colors.brand.primary}
                    value="expense"
                  />
                  <Text>Expense</Text>
                </FlexRow>
                <FlexRow>
                  <RadioButton
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
                  textStyle={{color: theme.colors.text.primary}}
                  badgeDotColors={itemsColors}
                />
              </>
            )}
            <Spacer size={'large'} />
            <FlexRow justifyContent="space-between">
              <Text fontfamily="heading">Date Filter (optional)</Text>
              <View
                style={{
                  backgroundColor: '#eee',
                  padding: 2,
                  borderColor: '#ddd',
                  borderWidth: 1,
                }}>
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
                      color={theme.colors.brand.primary}>
                      <Spacer position={'left'} />
                    </Ionicons>
                    <Text fontfamily="heading">From </Text>
                  </FlexRow>

                  {Platform.OS === 'android' && (
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
                  )}

                  {showPicker.from && (
                    <DateTimePicker
                      style={{width: '100%', position: 'absolute', right: 0}}
                      mode="date"
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
                      }}></DateTimePicker>
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
                      color={theme.colors.brand.primary}>
                      <Spacer position={'left'} />
                    </Ionicons>
                    <Text fontfamily="heading">To</Text>
                  </FlexRow>

                  {Platform.OS === 'android' && (
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
                  )}

                  {showPicker.to && (
                    <DateTimePicker
                      style={{
                        width: '100%',
                        position: 'absolute',
                        right: 0,
                      }}
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
            <Button onPress={onResetFilters} color="#111">
              Reset
            </Button>
            <Spacer size={'medium'} position="right" />
            <Button
              mode="contained"
              style={{backgroundColor: '#01AFDB'}}
              icon="share">
              SHARE
            </Button>
            <Spacer size={'medium'} position="right" />
            <Button
              onPress={onFilter}
              mode="contained"
              style={{backgroundColor: '#32B997'}}
              icon="download">
              Export
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};
