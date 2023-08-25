import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  Portal,
} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  AddAmountContainer,
  AddAmountInput,
  AddAmountInputText,
  AddAmountInputTextBlinkingCursor,
  AddAmountInputTextContainer,
  SheetDetailAvatarActivityIndicator,
  SheetDetailAvatarWrapper,
  SheetDetailImage,
  SheetDetailImageActivityIndicator,
  SheetDetailImageWrapper,
  SheetDetailsUnderline,
} from '../../components/sheet-details/sheet-details.styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Alert, Platform, TouchableOpacity, View} from 'react-native';
import moment from 'moment';
import Haptics from 'react-native-haptic-feedback';
import {ScrollView} from 'react-native';
import {
  ButtonText,
  FlexRow,
  Input,
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
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {getFirebaseAccessUrl} from '../../../../components/utility/helper';

export const AddSheetDetailScreen = ({navigation, route}) => {
  const theme = useTheme();
  const [disabled, setDisabled] = useState(true);
  const [activeType, setActiveType] = useState('expense');
  const [date, setDate] = useState(new Date());
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
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
  const {
    categories,
    onSaveSheetDetails,
    onEditSheetDetails,
    onSaveCategory,
    currentSheet,
  } = useContext(SheetsContext);

  // inputs states
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFromUpcomingScreen, setEditUpcomingScreen] = useState(false);
  const [smartScanMode, setSmartScanMode] = useState(false);
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
    if (route.params.activeType) {
      setActiveType(route.params.activeType);
    }
    if (route.params.selectedCategory) {
      setCategories(route.params.selectedCategory);
    }
    if (route.params && route.params.smartScan) {
      let sheetDetail = route.params.sheetDetail;
      if (sheetDetail) {
        setSmartScanMode(true);
        setAmount(sheetDetail.amount);
        setNotes(sheetDetail.notes);
        setSelectedImage(sheetDetail.image);
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
      let {sheetDetail, editFromUpcomingScreen: eus} = route.params;
      setEditUpcomingScreen(eus);
      if (sheetDetail) {
        setAmount(sheetDetail.amount);
        setNotes(sheetDetail.notes);
        setActiveType(sheetDetail.type);
        setDate(new Date(sheetDetail.date));
        let imageUrl = null;
        if (sheetDetail.image && sheetDetail.image.url) {
          imageUrl = getFirebaseAccessUrl(sheetDetail.image.url);
        }
        setSelectedImage({
          ...sheetDetail?.image,
          url: imageUrl,
          originalUrl: sheetDetail.image.url,
        });
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
      showTime: showTime,
      createdAt: Date.now(),
      image: selectedImage,
    };
    if (showTime) {
      sheetDetail.time = time.toString();
      let minutes = moment(sheetDetail.time).minutes();
      let hours = moment(sheetDetail.time).hours();
      let dte = date;
      dte.setMinutes(minutes);
      dte.setHours(hours);
      dte.setSeconds(0);
      sheetDetail.date = dte.toString();
    } else {
      let dte = date;
      dte.setMinutes(0);
      dte.setHours(0);
      dte.setSeconds(0);
      sheetDetail.date = dte.toString();
    }

    onSaveSheetDetails(sheetDetail, updatedSheet => {
      navigation.goBack();
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
      showTime: showTime,
      createdAt: Date.now(),
      image: selectedImage,
      imageChanged: imageChanged,
      imageDeleted: deleteImage,
    };

    if (selectedImage && selectedImage.originalUrl) {
      let image = selectedImage;
      image.url = image.originalUrl;
      delete image.originalUrl;
      sheetDetail.image = image;
    }

    if (showTime) {
      sheetDetail.time = time.toString();
      let minutes = moment(sheetDetail.time).minutes();
      let hours = moment(sheetDetail.time).hours();
      let dte = date;
      dte.setMinutes(minutes);
      dte.setHours(hours);
      dte.setSeconds(0);
      sheetDetail.date = dte.toString();
    } else {
      let dte = date;
      dte.setMinutes(0);
      dte.setHours(0);
      dte.setSeconds(0);
      sheetDetail.date = dte.toString();
    }

    setOpen(false);
    onEditSheetDetails(sheetDetail, editFromUpcomingScreen, updatedSheet => {
      if (editFromUpcomingScreen) {
        navigation.navigate('Transactions');
      } else {
        navigation.goBack();
      }
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
        let onlyBase64 = response.assets[0].base64;
        let pictureType = response.assets[0].type;
        let pictureExtension = pictureType.split('/')[1];
        let base64 = 'data:' + pictureType + ';base64,' + onlyBase64;
        let uri = response.assets[0].uri;
        if (editMode) {
          setImageChanged(true);
        }
        setSelectedImage({
          type: pictureType,
          uri: uri,
          url: base64,
          extension: pictureExtension,
        });
      }
    });
  };

  const onDownloadImage = async () => {
    if (selectedImage) {
      if (Platform.OS === 'ios') {
        // write code
        downloadImage(selectedImage);
      }
      if (Platform.OS === 'android') {
        downloadImage(selectedImage);
      }
    }
  };

  const downloadImage = async image => {
    if (image && image.url) {
      // Getting the extention of the file
      // get bytes
      setOpen(false);
      dispatch(
        loaderActions.showLoader({
          backdrop: true,
          loaderType: 'image_upload',
        }),
      );
      let imageURL = image.url;
      RNFetchBlob.config({
        fileCache: true,
        appendExt: image.extension,
      })
        .fetch('GET', imageURL)
        .then(res => {
          saveToCameraRoll(res.data);
        })
        .catch(err => {
          dispatch(
            notificationActions.showToast({
              status: 'error',
              message: err,
            }),
          );
          dispatch(loaderActions.hideLoader());
        });

      const saveToCameraRoll = url => {
        CameraRoll.save(url)
          .then(() => {
            dispatch(
              notificationActions.showToast({
                status: 'success',
                message: 'Image saved to your Camera Roll/ Photos',
              }),
            );
            dispatch(loaderActions.hideLoader());
          })
          .catch(err => {
            dispatch(
              notificationActions.showToast({
                status: 'error',
                message:
                  err?.message + '. Please enable permission from settings',
              }),
            );
            dispatch(loaderActions.hideLoader());
          });
      };
    } else {
      dispatch(loaderActions.hideLoader());
      Alert.alert('No Image Found');
    }
  };

  return (
    <SafeArea>
      <MainWrapper>
        {!editMode && !smartScanMode && (
          <CategoryTabs
            setActiveType={onSetActiveType}
            activeType={activeType}
          />
        )}

        <ScrollView
          keyboardShouldPersistTaps="never"
          showsVerticalScrollIndicator={false}>
          <AddAmountContainer>
            <AddAmountInputTextContainer>
              <View>
                <AddAmountInputText fontsize={'30px'}>
                  {activeType === 'expense' && '-'}
                  {GetCurrencySymbol(currentSheet?.currency)}{' '}
                  {GetCurrencyLocalString(amount)}
                </AddAmountInputText>
                <AddAmountInputTextBlinkingCursor />
              </View>
            </AddAmountInputTextContainer>

            <AddAmountInput
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
              maxLength={10}
            />
          </AddAmountContainer>

          <SheetDetailsUnderline amount={amount.toString().length} />

          <Spacer size={'medium'} />

          <Spacer size={'large'} />
          <Input
            mode="outlined"
            returnKeyType="done"
            blurOnSubmit
            multiline
            value={notes}
            onChangeText={n => (!notes ? setNotes(n.trim()) : setNotes(n))}
            placeholder="Notes / Description"
            clearButtonMode="while-editing"
            maxLength={80}
          />
          <Spacer size={'large'}></Spacer>
          <Card
            style={{
              backgroundColor: theme.colors.bg.card,
              margin: 0.5,
            }}
            theme={{roundness: 5}}
            onPress={() => {
              let paramsObject = passPresentEditedDetailsToSelectCategory();
              navigation.navigate('SelectCategory', {
                type: activeType,
                selectedCategory,
                editMode,
                editModeParams: paramsObject,
              });
            }}>
            {selectedCategory ? (
              <Card.Title
                title={selectedCategory?.name}
                titleVariant="titleMedium"
                subtitle="Change category"
                subtitleVariant="bodySmall"
                left={props => (
                  <Avatar.Icon
                    style={{
                      backgroundColor: selectedCategory
                        ? selectedCategory.color
                        : '#fff',
                    }}
                    icon={selectedCategory.icon}
                    {...props}
                    color="#fff"
                  />
                )}
                right={props => (
                  <MaterialCommunityIcon
                    name="chevron-right"
                    {...props}
                    size={40}
                    color={theme.colors.brand.primary}
                  />
                )}
                rightStyle={{
                  marginRight: 10,
                }}
              />
            ) : (
              <Card.Title
                title={`Select category`}
                titleVariant="titleMedium"
                subtitle="click here to change"
                subtitleVariant="bodySmall"
                left={props => (
                  <Avatar.Icon
                    style={{backgroundColor: theme.colors.brand.primary}}
                    icon={'format-list-bulleted'}
                    {...props}
                    color="#fff"
                  />
                )}
                right={props => (
                  <MaterialCommunityIcon
                    name="chevron-right"
                    {...props}
                    size={40}
                    color={theme.colors.brand.primary}
                  />
                )}
                rightStyle={{
                  marginRight: 10,
                }}
              />
              // <CategoryItem>
              //   <CategoryColor color={'#aaa'} />

              //   <Spacer position={'left'} size={'medium'} />
              //   <Text fontfamily="heading">
              //     {'Select category from here'}
              //   </Text>
              // </CategoryItem>
            )}
          </Card>

          <Spacer size={'large'} />

          <Card
            theme={{roundness: 5}}
            style={{
              backgroundColor: theme.colors.bg.card,
              margin: 1,
            }}>
            {/* date picker */}
            <Card.Content>
              <View>
                <FlexRow justifyContent="space-between">
                  <FlexRow gap="5px">
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
                          // maximumDate={new Date()}
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
                      // maximumDate={new Date()}
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
              <FlexRow justifyContent="space-between" gap="5px">
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
                              // maximumDate={new Date()}
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
                          // maximumDate={new Date()}
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
                    <SheetDetailAvatarWrapper>
                      <Avatar.Image
                        onLoadStart={() => setAvatarLoading(true)}
                        onLoad={() => setAvatarLoading(false)}
                        size={70}
                        source={{
                          uri: selectedImage?.url,
                        }}
                      />
                      {avatarLoading && (
                        <SheetDetailAvatarActivityIndicator
                          color={theme.colors.brand.primary}
                          animating
                        />
                      )}
                    </SheetDetailAvatarWrapper>
                  </TouchableOpacity>
                </FlexRow>
              )}
            </Card.Content>
            <Spacer position={'bottom'} size="large" />
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
                  name="alert-circle-outline"
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
                  textColor="#fff">
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
              <SheetDetailImageWrapper>
                <SheetDetailImage
                  onLoadStart={() => setImageLoading(true)}
                  onLoad={() => setImageLoading(false)}
                  source={{
                    uri: selectedImage?.url,
                  }}
                />
                {imageLoading && (
                  <SheetDetailImageActivityIndicator
                    color={theme.colors.brand.primary}
                    animating
                  />
                )}
              </SheetDetailImageWrapper>
              <Spacer size="medium" />
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
