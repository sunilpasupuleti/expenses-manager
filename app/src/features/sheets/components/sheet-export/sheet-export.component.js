import {useState} from 'react';
import {Button, Card, Divider, RadioButton, Switch} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Text} from '../../../../components/typography/text.component';
import React from 'react';
import {Platform, ScrollView, TouchableOpacity, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ButtonText, FlexRow, MainWrapper} from '../../../../components/styles';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {useContext} from 'react';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import _ from 'lodash';
import {useEffect} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {useDispatch} from 'react-redux';
import {notificationActions} from '../../../../store/notification-slice';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {MultipleSelectList} from 'react-native-dropdown-select-list';
import {CategoriesContext} from '../../../../services/categories/categories.context';

const onSetFromDate = () => {
  let date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setDate(date.getDate() - 1);

  return date;
};

export const SheetExport = ({navigation, route}) => {
  const {currentSheet} = useContext(SheetsContext);
  const [type, setType] = useState(null);
  const [categoryType, setCategoryType] = useState(null);
  const dispatch = useDispatch();
  const [categories, setCategories] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateFilter, setDateFilter] = useState(false);

  const [showPicker, setShowPicker] = useState({
    from: false,
    to: false,
  });

  const [fromDate, setFromDate] = useState(onSetFromDate());
  const [toDate, setToDate] = useState(new Date());

  const [items, setItems] = useState([]);

  const {onExportSheetDataToExcel, onExportSheetDataToPdf} =
    useContext(SheetsContext);
  const {getCategories} = useContext(CategoriesContext);

  const theme = useTheme();

  const onCompleteExporting = () => {
    navigation.goBack();
  };

  const onResetFilters = () => {
    setCategories([]);
    setSelectedCategories([]);
    setDateFilter(false);
    setFromDate(onSetFromDate());
    setToDate(new Date());
    setCategoryType(null);
    setType(null);
  };

  useEffect(() => {
    if (categoryType) {
      onGetCategories(categoryType);
    }
  }, [categoryType]);

  const onGetCategories = async catType => {
    let data = await getCategories(catType);
    let values = [];
    let colors = [];
    data.map(d => {
      let {name, id, color} = d;
      let obj = {
        value: _.capitalize(name),
        key: id,
      };
      values.push(obj);
      colors.push(color);
    });
    setItems(values);
  };

  const onFilter = config => {
    if (!type) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Please select the format (Pdf or Excel)',
        }),
      );
      return;
    }

    if (dateFilter) {
      config.from = moment(fromDate).format('YYYY-MM-DD');
      config.to = moment(toDate).format('YYYY-MM-DD');
    }

    if (categoryType) {
      config.categoryType = categoryType;
    }
    if (categoryType && selectedCategories.length > 0) {
      config.selectedCategories = selectedCategories;
    }

    config.id = currentSheet.id;
    onCompleteExporting();

    if (type === 'pdf') {
      onExportSheetDataToPdf(config);
    }
    if (type === 'excel') {
      onExportSheetDataToExcel(config);
    }
  };

  const toggleSwithStyles = {
    backgroundColor: Platform.OS !== 'ios' && theme.colors.switchBg,
    padding: 3,
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Export ' + currentSheet?.name,
      headerLeft: () => (
        <Button uppercase={false} onPress={() => navigation.goBack()}>
          <ButtonText>Back</ButtonText>
        </Button>
      ),
      headerRight: () => {},
    });
  }, [currentSheet]);

  return (
    <SafeArea child={true}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card
          style={{
            marginBottom: 100,
            marginTop: 50,
            backgroundColor: theme.colors.bg.card,
            margin: 1,
          }}>
          <Card.Content>
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

                <MultipleSelectList
                  searchicon={
                    <MaterialCommunityIcon
                      name="magnify"
                      size={20}
                      style={{marginRight: 10}}
                      color={theme.colors.text.primary}
                    />
                  }
                  closeicon={
                    <MaterialCommunityIcon
                      name="close"
                      size={20}
                      color={theme.colors.text.primary}
                    />
                  }
                  setSelected={val => setSelectedCategories(val)}
                  data={items}
                  label="Categories"
                  placeholder="Select categories (optional)"
                  notFoundText="No Categories Found"
                  checkBoxStyles={{
                    borderColor: theme.colors.brand.primary,
                  }}
                  labelStyles={{color: theme.colors.text.primary}}
                  dropdownTextStyles={{color: theme.colors.text.primary}}
                  badgeStyles={{
                    backgroundColor: theme.colors.brand.primary,
                    color: theme.colors.text.primary,
                  }}
                  inputStyles={{
                    color: theme.colors.text.primary,
                  }}
                  searchPlaceholder="Search Category"
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
            <Button
              onPress={onResetFilters}
              buttonColor={'#aaa'}
              textColor="#fff">
              Reset
            </Button>
            <Spacer size={'medium'} position="right" />
            <Button
              mode="contained"
              onPress={() => onFilter({sharing: true})}
              buttonColor="#01AFDB"
              textColor="#fff"
              icon="share">
              SHARE
            </Button>
            <Spacer size={'medium'} position="right" />
            <Button
              onPress={() => onFilter({})}
              mode="contained"
              buttonColor="#32B997"
              textColor="#fff"
              icon="download">
              Export
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </SafeArea>
  );
};
