import React, {useContext, useEffect, useState} from 'react';
import {Button, Card, Dialog, Divider, Portal} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {
  ButtonText,
  FlexRow,
  MainWrapper,
  ToggleSwitch,
} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {
  SheetDetailInput,
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../components/sheet-details/sheet-details.styles';
import {Spacer} from '../../../components/spacer/spacer.component';
import {
  CategoryColor,
  CategoryItem,
} from '../../categories/components/categories.styles';
import {Text} from '../../../components/typography/text.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {CategoryTabs} from '../../categories/components/category-tabs.component';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Platform, TouchableOpacity} from 'react-native';
import moment from 'moment';
import {GetCurrencySymbol} from '../../../components/symbol.currency';
import Haptics from 'react-native-haptic-feedback';
import {ScrollView} from 'react-native';

export const AddSheetDetailScreen = ({navigation, route}) => {
  const theme = useTheme();
  const [disabled, setDisabled] = useState(true);
  const [activeType, setActiveType] = useState('expense');
  const [sheet, setSheet] = useState(route.params.sheet);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  const [showPicker, setShowPicker] = useState({
    date: Platform.OS === 'ios' ? true : false,
    time: Platform.OS === 'ios' ? true : false,
  });

  // contexts
  const {categories, onSaveSheetDetails, onEditSheetDetails, onSaveCategory} =
    useContext(SheetsContext);

  // inputs states
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [gcpVisionMode, setGcpVisionMode] = useState(false);
  const [newCategoryIdentified, setNewCategoryIdentified] = useState({
    showDialog: false,
    category: null,
  });
  const [showTime, setShowTime] = useState(false);
  function setCategories(fromRoute = null) {
    let selectedCategories =
      activeType === 'expense' ? categories.expense : categories.income;
    let result;
    if (fromRoute) {
      result = selectedCategories.filter(c => c.id === fromRoute.id)[0];
    } else {
      result = selectedCategories.filter(c => c.default)[0];
    }
    setSelectedCategory(result);
  }

  useEffect(() => {
    if (!amount) {
      setAmount(0);
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [amount]);

  useEffect(() => {
    if (!editMode) {
      navigation.setOptions({
        headerTitle: activeType === 'expense' ? 'New Expense' : 'New Income',
      });
      setCategories();
    }
  }, [activeType]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => {
        return (
          <Button uppercase={false} onPress={onCancel}>
            <ButtonText>Cancel</ButtonText>
          </Button>
        );
      },
      headerTitle: 'New Expense',
    });
    setCategories();
  }, []);

  useEffect(() => {
    if (route.params.selectedCategory) {
      setCategories(route.params.selectedCategory);
    }
    if (route.params && route.params.gcpVision) {
      let sheetDetail = route.params.sheetDetail;
      if (sheetDetail) {
        setGcpVisionMode(true);
        setAmount(sheetDetail.amount);
        setNotes(sheetDetail.notes);
        setActiveType(sheetDetail.type);
        let dateIsValid = moment(sheetDetail.date).isValid();
        let date = new Date();
        console.log(moment(sheetDetail.date).format('DD MMM YYYY'));
        if (dateIsValid) {
          date = new Date(sheetDetail.date);
        }
        setDate(date);
        let categoryAlreadyExists = categories['expense'].filter(c =>
          c.name.toLowerCase().includes(sheetDetail.category.toLowerCase()),
        )[0];
        if (categoryAlreadyExists) {
          setSelectedCategory(categoryAlreadyExists);
        } else {
          setNewCategoryIdentified({
            showDialog: true,
            category: {name: sheetDetail.category},
          });
        }
      }
    }
    if (route.params.edit) {
      setEditMode(true);
      let sheetDetail = route.params.sheetDetail;
      if (sheetDetail) {
        setAmount(sheetDetail.amount);
        setNotes(sheetDetail.notes);
        setActiveType(sheetDetail.type);
        setDate(new Date(sheetDetail.date));
        setShowTime(sheetDetail.showTime);
        if (sheetDetail.showTime) {
          setTime(new Date(sheetDetail.time));
        }
        setSelectedCategory(sheetDetail.category);
        navigation.setOptions({
          headerTitle:
            'Edit ' +
            sheetDetail.type.charAt(0).toUpperCase() +
            sheetDetail.type.slice(1),
        });
      }
    }
  }, [route.params]);

  const onCancel = () => {
    navigation.goBack();
  };

  const onSave = () => {
    let sheetDetail = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      amount: amount,
      notes: notes ? notes.trim() : notes,
      type: activeType,
      category: selectedCategory,
      date: date.toString(),
      showTime: showTime,
      createdAt: Date.now(),
    };
    if (showTime) sheetDetail.time = time.toString();
    onSaveSheetDetails(sheet, sheetDetail, updatedSheet => {
      navigation.navigate('SheetDetails', {sheet: updatedSheet});
    });
  };

  const passPresentEditedDetailsToSelectCategory = () => {
    if (editMode) {
      return {
        ...route.params.sheetDetail,
        amount,
        notes: notes ? notes.trim() : notes,
        date: date.toString(),
        time: time.toString(),
        showTime,
        selectedCategory,
      };
    }
    return null;
  };
  const onEdit = () => {
    let sheetDetail = {
      id: route.params.sheetDetail.id,
      amount: amount,
      notes: notes.trim(),
      type: activeType,
      category: selectedCategory,
      date: date.toString(),
      showTime: showTime,
      createdAt: Date.now(),
    };
    if (showTime) sheetDetail.time = time.toString();
    onEditSheetDetails(sheet, sheetDetail, updatedSheet => {
      navigation.navigate('SheetDetails', {sheet: updatedSheet});
    });
  };

  const onSetActiveType = type => {
    setActiveType(type);
  };

  // when new category identified
  const onAddNewCategory = () => {
    let categoryName = newCategoryIdentified.category.name;
    let n = (Math.random() * 0xfffff * 1000000).toString(16);
    let categoryColor = '#' + n.slice(0, 6);
    let category = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      color: categoryColor,
    };
    onSaveCategory(category, 'expense', () => {
      setSelectedCategory(category);
      setNewCategoryIdentified(p => ({
        ...p,
        showDialog: false,
      }));
    });
  };
  return (
    <SafeArea>
      <MainWrapper>
        {!editMode && !gcpVisionMode && (
          <CategoryTabs
            setActiveType={onSetActiveType}
            activeType={activeType}
          />
        )}

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <SheetDetailsTotalBalance fontsize={'30px'} fontfamily="bodySemiBold">
            {activeType === 'expense' && '-'}
            {GetCurrencySymbol(sheet.currency)}{' '}
            {amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </SheetDetailsTotalBalance>
          <SheetDetailsUnderline />

          <Spacer size={'medium'}></Spacer>

          <SheetDetailInput
            theme={{roundness: 10}}
            mode="outlined"
            value={amount === 0 ? '' : amount.toString()}
            returnKeyType="done"
            onChangeText={n => {
              setAmount(parseFloat(n));
            }}
            placeholder="How much?"
            keyboardType="decimal-pad"
            right={
              <SheetDetailInput.Icon
                name="close-circle"
                color="#bbb"
                onPress={() => setAmount(0)}
              />
            }
            maxLength={10}
          />
          <Spacer size={'large'}></Spacer>
          <SheetDetailInput
            theme={{roundness: 10}}
            mode="outlined"
            multiline
            value={notes}
            onChangeText={n => (!notes ? setNotes(n.trim()) : setNotes(n))}
            placeholder="Notes / Description"
            right={
              notes && (
                <SheetDetailInput.Icon
                  name="close-circle"
                  color="#bbb"
                  onPress={() => setNotes(null)}
                />
              )
            }
            maxLength={80}
          />
          <Spacer size={'large'}></Spacer>
          <Card
            theme={{roundness: 10}}
            onPress={() => {
              let paramsObject = passPresentEditedDetailsToSelectCategory();
              navigation.navigate('SelectCategory', {
                type: activeType,
                selectedCategory,
                editMode,
                editModeParams: paramsObject,
              });
            }}>
            <Card.Content>
              <CategoryItem>
                <CategoryColor
                  color={selectedCategory ? selectedCategory.color : '#fff'}
                />
                <Spacer position={'left'} size={'medium'} />
                <Text fontfamily="heading">{selectedCategory?.name}</Text>
              </CategoryItem>
              <Spacer size={'small'} />
            </Card.Content>
          </Card>

          <Spacer size={'large'} />

          <Card theme={{roundness: 15}}>
            <Card.Content>
              <FlexRow justifyContent="space-between">
                <FlexRow>
                  <Ionicons
                    name="calendar-outline"
                    size={25}
                    color={theme.colors.brand.primary}>
                    <Spacer position={'left'} />
                  </Ionicons>
                  <Text fontfamily="heading">Date</Text>
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
                        date: true,
                      }))
                    }>
                    <Text fontfamily="bodySemiBold" fontsize="14px">
                      {moment(date).format('DD MMM YYYY')}
                    </Text>
                  </TouchableOpacity>
                )}

                {showPicker.date && (
                  <DateTimePicker
                    style={{width: '100%', position: 'absolute', right: 0}}
                    mode="date"
                    value={date}
                    maximumDate={new Date()}
                    onChange={(e, d) => {
                      if (e.type === 'dismissed') {
                        setShowPicker(prev => ({
                          ...prev,
                          date: false,
                        }));
                      }
                      if (d) {
                        if (Platform.OS === 'android') {
                          setShowPicker(prevState => {
                            return {
                              ...prevState,
                              date: false,
                            };
                          });
                        }
                        setDate(d);
                      }
                    }}></DateTimePicker>
                )}
              </FlexRow>
            </Card.Content>
            <Spacer />
            <Divider />
            <Spacer size={'large'} />

            <Card.Content>
              <FlexRow justifyContent="space-between">
                <Text>Show Time</Text>
                <ToggleSwitch
                  value={showTime}
                  onValueChange={() => setShowTime(!showTime)}
                />
              </FlexRow>
            </Card.Content>

            <Spacer />
            <Divider />
            <Spacer size={'large'} />

            {showTime && (
              <>
                <Card.Content>
                  <FlexRow justifyContent="space-between">
                    <FlexRow>
                      <Ionicons
                        name="time-outline"
                        size={25}
                        color={theme.colors.brand.primary}>
                        <Spacer position={'left'} />
                      </Ionicons>
                      <Text fontfamily="heading">Time</Text>
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
                            time: true,
                          }))
                        }>
                        <Text fontfamily="bodySemiBold" fontsize="14px">
                          {moment(time).format('hh:mm A')}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {showPicker.time && (
                      <DateTimePicker
                        style={{width: '100%', position: 'absolute', right: 0}}
                        mode="time"
                        value={time}
                        onChange={(e, t) => {
                          if (e.type === 'dismissed') {
                            setShowPicker(prev => ({
                              ...prev,
                              time: false,
                            }));
                          }
                          if (t) {
                            if (Platform.OS === 'android') {
                              setShowPicker(prevState => {
                                return {
                                  ...prevState,
                                  time: false,
                                };
                              });
                            }
                            setTime(t);
                          }
                        }}
                      />
                    )}
                  </FlexRow>
                </Card.Content>
                <Spacer />
                <Divider />
                <Spacer size={'large'} />
              </>
            )}
          </Card>

          <Spacer size={'large'} />
          <Button
            uppercase={false}
            onPress={() => {
              Haptics.trigger('impactMedium', {
                ignoreAndroidSystemSettings: true,
              });
              editMode ? onEdit() : onSave();
            }}
            mode="contained"
            color={theme.colors.brand.primary}
            disabled={disabled}>
            <ButtonText disabled={disabled} color="#fff">
              Done
            </ButtonText>
          </Button>
        </ScrollView>

        {/* for dialog to add new category */}
        {newCategoryIdentified.showDialog && (
          <Portal>
            <Dialog
              visible={newCategoryIdentified.showDialog}
              // onDismiss={() =>
              //   setNewCategoryIdentified(p => ({...p, showDialog: false}))
              // }
            >
              <Dialog.Title style={{textAlign: 'center'}}>
                <Ionicons
                  name="ios-alert-circle-outline"
                  size={30}
                  color="tomato"
                />
              </Dialog.Title>
              <Dialog.Content>
                <Text fontfamily="heading">
                  We have identified that your expense may fall under
                  the&nbsp;&nbsp;&nbsp;
                  <Text
                    fontfamily="headingBold"
                    style={{textTransform: 'uppercase'}}>
                    {newCategoryIdentified.category?.name}
                  </Text>
                  &nbsp;&nbsp; category? Do you want to proceed by adding this
                  to your existing categories list?
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button
                  onPress={() =>
                    setNewCategoryIdentified(p => ({...p, showDialog: false}))
                  }
                  color="#aaa">
                  Cancel
                </Button>
                <Spacer position={'left'} size="large" />
                <Button
                  uppercase={false}
                  icon={'plus'}
                  mode="outlined"
                  onPress={onAddNewCategory}
                  color={theme.colors.brand.primary}>
                  Add and Continue
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        )}
      </MainWrapper>
    </SafeArea>
  );
};
