import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  Menu,
  Portal,
} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {
  SheetDetailInput,
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../../components/sheet-details/sheet-details.styles';
import storage from '@react-native-firebase/storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import {utils} from '@react-native-firebase/app';
import moment from 'moment';
import Haptics from 'react-native-haptic-feedback';
import {ScrollView} from 'react-native';
import {
  ButtonText,
  FlexRow,
  MainWrapper,
  ToggleSwitch,
} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {CategoryTabs} from '../../../categories/components/category-tabs.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {
  CategoryColor,
  CategoryItem,
} from '../../../categories/components/categories.styles';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {useDispatch} from 'react-redux';
import {notificationActions} from '../../../../store/notification-slice';
import {launchImageLibrary} from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';
import {loaderActions} from '../../../../store/loader-slice';

export const AddSheetDetailScreen = ({navigation, route}) => {
  const theme = useTheme();
  const [disabled, setDisabled] = useState(true);
  const [activeType, setActiveType] = useState('expense');
  const [sheet, setSheet] = useState(route.params.sheet);
  const [date, setDate] = useState(new Date());
  let d = new Date();
  d.setMonth(date.getMonth());
  d.setDate(date.getDate());
  const [time, setTime] = useState(d);
  const dispatch = useDispatch();

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
  const [selectedImage, setSelectedImage] = useState({
    url: null,
  });

  const [imageChanged, setImageChanged] = useState(false);

  // let imageChanged = false
  const [open, setOpen] = useState(false);

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
    }
    // else {
    //   result = selectedCategories.filter(c => c.default)[0];
    // }
    setSelectedCategory(result);
  }

  useEffect(() => {
    if (!amount) {
      setAmount(0);
      setDisabled(true);
    } else {
      if (selectedCategory) setDisabled(false);
    }
  }, [amount]);

  useEffect(() => {
    if (!selectedCategory) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [selectedCategory]);

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
        setSelectedImage({
          url: sheetDetail?.image,
        });
        setActiveType(sheetDetail.type);
        let dateIsValid = moment(sheetDetail.date).isValid();
        let date = new Date();
        if (dateIsValid) {
          date = new Date(sheetDetail.date);
        }
        setDate(date);
        let categoryAlreadyExists = categories['expense'].filter(c => {
          return c.name
            .toLowerCase()
            .includes(sheetDetail.category.toLowerCase());
        })[0];
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
        setSelectedImage(sheetDetail?.image);
        setShowTime(sheetDetail.showTime);
        if (sheetDetail.showTime && sheetDetail.time) {
          setTime(new Date(sheetDetail.time));
        }
        let category = categories[sheetDetail.type].filter(
          c => c.id === sheetDetail.category.id,
        )[0];
        if (!category) {
          category = sheetDetail.category;
        }
        setSelectedCategory(category);
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
    if (!selectedCategory) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Please select category',
        }),
      );
      return;
    }
    let sheetDetail = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      amount: parseFloat(amount),
      notes: notes ? notes.trim() : notes,
      type: activeType,
      category: selectedCategory,
      date: date.toString(),
      showTime: showTime,
      createdAt: Date.now(),
      image: selectedImage,
    };
    if (showTime) {
      sheetDetail.time = time.toString();
    }
    onSaveSheetDetails(sheet, sheetDetail, updatedSheet => {
      navigation.navigate('SheetDetailsHome', {
        screen: 'Transactions',
        sheet: updatedSheet,
      });
      // navigation.navigate('SheetDetails', {sheet: updatedSheet});
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
  const onEdit = (deleteImage = false) => {
    let sheetDetail = {
      id: route.params.sheetDetail.id,
      amount: parseFloat(amount),
      notes: notes ? notes.trim() : notes,
      type: activeType,
      category: selectedCategory,
      date: date.toString(),
      showTime: showTime,
      createdAt: Date.now(),
      image: selectedImage,
      imageChanged: imageChanged,
      imageDeleted: deleteImage,
    };
    if (showTime) sheetDetail.time = time.toString();
    setOpen(false);
    onEditSheetDetails(sheet, sheetDetail, updatedSheet => {
      // if (!deleteImage) {
      navigation.navigate('SheetDetailsHome', {
        screen: 'Transactions',
        sheet: updatedSheet,
      });
      // } else {
      //   setOpen(false);
      //   setSelectedImage({
      //     url: null,
      //   });
      // }
      // navigation.navigate('SheetDetails', {sheet: updatedSheet});
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

  const onAddImage = async () => {
    let options = {
      mediaType: 'photo',
      cameraType: 'back',
      includeBase64: true,
      presentationStyle: 'popover',
    };

    await launchImageLibrary(options, response => {
      if (
        response &&
        response.assets &&
        response.assets[0] &&
        response.assets[0].base64
      ) {
        let base64 = 'data:' + response.assets[0].type + ';base64,';
        let base64Data = base64 + response.assets[0].base64;
        if (editMode) {
          setImageChanged(true);
        }
        setSelectedImage({
          url: base64Data,
        });
      }
    });
  };

  const onDownloadImage = async () => {
    if (selectedImage) {
      if (Platform.OS === 'ios') {
        // write code
      } else {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission Required',
              message: 'App needs access to your storage to download Photos',
            },
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            downloadImage(selectedImage);
          } else {
            Alert.alert('Storage Permission not granted');
          }
        } catch (err) {
          console.warn(err, 'error occured storage');
        }
      }
    }
  };

  const downloadImage = async image => {
    if (image && image.url) {
      // Getting the extention of the file
      // get bytes

      let {config, fs} = RNFetchBlob;

      let ext = image.extension;
      const dirs = fs.dirs;
      var path = dirs.DownloadDir + `/transaction-image-${moment()}.${ext}`;
      const reference = storage().ref(image.path);
      setOpen(false);
      dispatch(
        loaderActions.showLoader({backdrop: true, loaderType: 'restore'}),
      );
      await reference
        .writeToFile(path)
        .then(r => {
          dispatch(loaderActions.hideLoader());
          dispatch(
            notificationActions.showToast({
              status: 'success',
              message: 'Image downloaded! Please check your Downloads folder.',
            }),
          );
        })
        .catch(err => {
          dispatch(loaderActions.hideLoader());
          console.log('Error occured in downloading image ', err);
          Alert.alert('Error occured in downloading the file');
        });
    } else {
      dispatch(loaderActions.hideLoader());
      Alert.alert('No Image Found');
    }
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
            {GetCurrencySymbol(sheet?.currency)}{' '}
            {GetCurrencyLocalString(amount)}
          </SheetDetailsTotalBalance>
          <SheetDetailsUnderline />

          <Spacer size={'medium'}></Spacer>

          <SheetDetailInput
            theme={{roundness: 10}}
            mode="outlined"
            value={amount === 0 ? '' : amount.toString()}
            returnKeyType="done"
            onChangeText={n => {
              // console.log(n.match(/\./).length);
              if (/\./.test(n) && n.match(/\./g).length === 1) {
                setAmount(n);
              } else {
                setAmount(parseFloat(n));
              }
            }}
            placeholder="How much?"
            keyboardType="decimal-pad"
            right={
              <SheetDetailInput.Icon
                icon="close-circle"
                iconColor="#bbb"
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
                  icon="close-circle"
                  iconColor="#bbb"
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
              {selectedCategory ? (
                <CategoryItem>
                  <CategoryColor
                    color={selectedCategory ? selectedCategory.color : '#fff'}>
                    {selectedCategory && selectedCategory.icon && (
                      <MaterialCommunityIcon
                        name={selectedCategory.icon}
                        size={16}
                        color="#fff"
                      />
                    )}
                  </CategoryColor>

                  <Spacer position={'left'} size={'medium'} />
                  <Text fontfamily="heading">{selectedCategory?.name}</Text>
                </CategoryItem>
              ) : (
                <CategoryItem>
                  <CategoryColor color={'#aaa'}>
                    {/* {selectedCategory && selectedCategory.icon && (
                    <MaterialCommunityIcon
                      name={selectedCategory.icon}
                      size={16}
                      color="#fff"
                    />
                  )} */}
                  </CategoryColor>

                  <Spacer position={'left'} size={'medium'} />
                  <Text fontfamily="heading">
                    {'Select category from here'}
                  </Text>
                </CategoryItem>
              )}
              <Spacer size={'small'} />
            </Card.Content>
          </Card>

          <Spacer size={'large'} />

          <Card theme={{roundness: 5}}>
            {/* date picker */}
            <Card.Content>
              <View>
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
                            date: true,
                          }))
                        }>
                        <Text fontfamily="bodySemiBold" fontsize="14px">
                          {moment(date).format('DD MMM YYYY')}
                        </Text>
                      </TouchableOpacity>
                      {showPicker.date && (
                        <DateTimePicker
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
                              time.setMonth(d.getMonth());
                              time.setDate(d.getDate());
                            }
                          }}
                        />
                      )}
                    </>
                  )}

                  {Platform.OS === 'ios' && (
                    <DateTimePicker
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
                          time.setMonth(d.getMonth());
                          time.setDate(d.getDate());
                        }
                      }}
                    />
                  )}
                </FlexRow>
              </View>
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
                {/* time picker */}
                <Card.Content>
                  <View>
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
                                time: true,
                              }))
                            }>
                            <Text fontfamily="bodySemiBold" fontsize="14px">
                              {moment(time).format('hh:mm A')}
                            </Text>
                          </TouchableOpacity>
                          {showPicker.time && (
                            <DateTimePicker
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
                        </>
                      )}

                      {Platform.OS === 'ios' && (
                        <DateTimePicker
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
                  </View>
                </Card.Content>

                <Spacer />
                <Divider />
                <Spacer size={'large'} />
              </>
            )}

            <Card.Content>
              {!selectedImage?.url && (
                <TouchableOpacity onPress={onAddImage}>
                  <FlexRow justifyContent="space-between">
                    <Text>Add Image</Text>

                    <FontAwesome
                      name="photo"
                      size={20}
                      color={theme.colors.brand.primary}
                    />
                  </FlexRow>
                </TouchableOpacity>
              )}

              {selectedImage?.url && (
                <FlexRow justifyContent="space-between">
                  <TouchableOpacity
                    onPress={() => {
                      onAddImage();
                    }}>
                    <Text>Change Image</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setOpen(true)}>
                    <Avatar.Image
                      size={70}
                      source={{
                        uri: selectedImage.url,
                      }}
                    />
                  </TouchableOpacity>
                </FlexRow>
              )}
            </Card.Content>
            <Spacer position={'bottom'} size="large" />
            <Divider />
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
            buttonColor={theme.colors.brand.primary}
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
                  textColor="#aaa">
                  Cancel
                </Button>
                <Spacer position={'left'} size="large" />
                <Button
                  uppercase={false}
                  icon={'plus'}
                  mode="outlined"
                  onPress={onAddNewCategory}
                  textColor="#fff"
                  buttonColor={theme.colors.brand.primary}>
                  Add and Continue
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        )}

        {/* for dialog to show image */}
        {open && (
          <Portal>
            <Dialog visible={open} onDismiss={() => setOpen(false)}>
              <Image style={{height: 400}} source={{uri: selectedImage?.url}} />
              <Dialog.Actions>
                <Button onPress={() => setOpen(false)} color="#aaa">
                  Cancel
                </Button>
                {editMode && !imageChanged && (
                  <>
                    <Spacer position={'left'} size="xlarge" />
                    <Button
                      onPress={() => {
                        onEdit(true);
                      }}>
                      <FontAwesome name="trash" size={20} color={'tomato'} />
                    </Button>
                    <Spacer position={'left'} size="xlarge" />
                    <Button onPress={onDownloadImage} mode="contained">
                      <FontAwesome name="download" size={20} color={'#fff'} />
                    </Button>
                  </>
                )}

                <Spacer position={'left'} size="large" />
              </Dialog.Actions>
            </Dialog>
          </Portal>
        )}
      </MainWrapper>
    </SafeArea>
  );
};
