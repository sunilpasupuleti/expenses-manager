/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  Portal,
} from 'react-native-paper';
import { useTheme } from 'styled-components/native';
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
import {
  Alert,
  Platform,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import moment from 'moment';
import Haptics from 'react-native-haptic-feedback';
import { ScrollView } from 'react-native';
import {
  ButtonText,
  FlexRow,
  Input,
  MainWrapper,
  SelectListInput,
  ToggleSwitch,
} from '../../../../components/styles';
import { Text } from '../../../../components/typography/text.component';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import { SheetsContext } from '../../../../services/sheets/sheets.context';

import { Spacer } from '../../../../components/spacer/spacer.component';
import { SafeArea } from '../../../../components/utility/safe-area.component';
import { useDispatch, useSelector } from 'react-redux';
import { notificationActions } from '../../../../store/notification-slice';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';
import { loaderActions } from '../../../../store/loader-slice';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import {
  formatDate,
  getEmiDates,
  getFirebaseAccessUrl,
  getLinkedDbRecord,
} from '../../../../components/utility/helper';
import { SheetDetailsContext } from '../../../../services/sheetDetails/sheetDetails.context';
import { CategoriesContext } from '../../../../services/categories/categories.context';
import _ from 'lodash';
import { AuthenticationContext } from '../../../../services/authentication/authentication.context';
import { useNetInfo } from '@react-native-community/netinfo';
import { TabsSwitcher } from '../../../../components/tabs-switcher/tabs-switcher.component';

export const AddSheetDetailScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const [disabled, setDisabled] = useState(true);
  const [activeType, setActiveType] = useState('expense');
  const [date, setDate] = useState(new Date());
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [sheetDetail, setSheetDetail] = useState(null);
  const [amountWidth, setAmountWidth] = useState(0);

  let d = new Date();

  d.setMonth(date.getMonth());
  d.setDate(date.getDate());
  const [time, setTime] = useState(d);
  const dispatch = useDispatch();
  const { onSaveSheetDetail, onEditSheetDetail } =
    useContext(SheetDetailsContext);

  const [showPicker, setShowPicker] = useState({
    date: Platform.OS === 'ios' ? true : false,
    time: Platform.OS === 'ios' ? true : false,
  });
  const [sheet, setSheet] = useState(null);

  const { onSaveCategory } = useContext(CategoriesContext);
  const { userData } = useContext(AuthenticationContext);

  // inputs states
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState(null);
  const [sheetDetailModel, setSheetDetailModel] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [smartScanMode, setSmartScanMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState({
    url: null,
  });
  const { isConnected } = useNetInfo();
  const [imageChanged, setImageChanged] = useState(false);
  const [open, setOpen] = useState(false);

  const [newCategoryIdentified, setNewCategoryIdentified] = useState({
    showDialog: false,
    category: null,
  });
  const [showTime, setShowTime] = useState(false);
  const amountInputRef = useRef(null);
  const themeType = useColorScheme();
  const appTheme = useSelector(state => state.service.theme);
  let darkMode =
    appTheme === 'automatic'
      ? themeType === 'light'
        ? false
        : true
      : appTheme === 'light'
      ? false
      : true;
  const [isLoanAccount, setIsLoanAccount] = useState(false);
  const [isEmiPayment, setIsEmiPayment] = useState(true);
  const [isPrepayment, setIsPrepayment] = useState(false);
  const [selectedEmiDate, setSelectedEmiDate] = useState(null);
  const [emiDates, setEmiDates] = useState([]);

  function setCategories(fromRoute = null) {
    if (fromRoute) {
      setSelectedCategory(fromRoute);
    }
  }

  useEffect(() => {
    if (!sheet) return;

    const onSetLoanAccountEmiDates = async () => {
      setIsLoanAccount(true);
      setActiveType('expense');

      const { allEmis } = getEmiDates(
        sheet.loanStartDate,
        sheet.repaymentFrequency,
        sheet.loanYears,
        sheet.loanMonths,
        sheet.totalPayments,
      );

      const transactions = await getLinkedDbRecord(sheet, 'transactions');
      // Get list of emiDate strings from transactions where isEmiPayment is true
      const paidEmiDates = (transactions || [])
        .filter(tx => tx.isEmiPayment && tx.emiDate)
        .map(tx => moment(tx.emiDate).format('YYYY-MM-DD'));

      // Filter out already paid dates
      const unpaidEmis = allEmis.filter(
        dt => !paidEmiDates.includes(moment(dt).format('YYYY-MM-DD')),
      );

      setEmiDates(unpaidEmis);
    };
    if (sheet?.isLoanAccount) {
      onSetLoanAccountEmiDates();
    }
  }, [sheet]);

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
      // setCategories();
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
  }, []);

  useEffect(() => {
    if (
      route.params?.smartScan &&
      route?.params?.sheetDetail &&
      route?.params?.sheet
    ) {
      setSmartScanMode(true);

      const {
        newCategoryIdentified: newCat,
        date: dt,
        notes: nts,
        image,
        type,
        amount: amnt,
      } = route.params.sheetDetail;
      delete route.params.sheetDetail.image;
      if (newCat) {
        setNewCategoryIdentified({
          showDialog: true,
          category: { name: route.params.sheetDetail.category },
        });
      }
      if (dt) {
        setDate(new Date(dt));
      }
      setAmount(amnt);
      setNotes(nts);
      setSelectedImage(image);
      setActiveType(route?.params?.sheet?.isLoanAccount ? 'expense' : type);
    }
  }, [route.params]);

  useEffect(() => {
    if (route?.params?.selectedCategory) {
      setCategories(route.params.selectedCategory);
    }
  }, [route.params]);

  useEffect(() => {
    const onSetData = async () => {
      setEditMode(true);
      let { sheetDetail: sd, sheetDetailModel: sdModel } = route.params;

      setSheetDetailModel(sdModel || sd);

      if (sd) {
        setSheetDetail(sd);
        setAmount(sd.amount);
        setNotes(sd.notes);

        setActiveType(sd.type);

        const formattedDate = moment(sd.date).format('YYYY-MM-DD').toString();
        const localDate = new Date(`${formattedDate}T00:00:00`);

        setDate(localDate);

        let imageUrl = null;
        if (sd.imageUrl) {
          imageUrl = getFirebaseAccessUrl(sd.imageUrl);
        }
        setSelectedImage({
          type: sd.imageType,
          extension: sd.imageExtension,
          url: imageUrl,
          originalUrl: sd.imageUrl,
        });

        setIsEmiPayment(sd.isEmiPayment ? true : false);

        setSelectedEmiDate(sd.isEmiPayment && sd.emiDate ? sd.emiDate : null);
        setShowTime(sd.showTime ? true : false);
        if (sd.showTime && sd.time) {
          setTime(new Date(sd.time));
        }

        const cgry = sd.category?.name
          ? sd.category
          : await getLinkedDbRecord(sd, 'category');

        setSelectedCategory(cgry);

        navigation.setOptions({
          headerTitle: 'Edit ' + _.capitalize(_.trim(sd.type)),
        });
      }
    };
    if (route.params.edit) {
      onSetData();
    }
  }, [route.params]);
  useEffect(() => {
    const onSetData = async () => {
      if (!route.params?.sheet) return;
      if (route.params.sheet) {
        setSheet(route.params.sheet);
      }
      if (route.params.activeType) {
        setActiveType(route.params.activeType);
      }
    };

    onSetData();
  }, [route.params]);

  const onCancel = () => {
    navigation.goBack();
  };

  const showNotification = (status, message) => {
    dispatch(
      notificationActions.showToast({
        status: status,
        message: message,
      }),
    );
  };

  const checkLoanAccountErrors = () => {
    let hadErrors = false;

    if (isEmiPayment && isLoanAccount) {
      if (!selectedEmiDate) {
        showNotification('error', `Please Select EMI Date`);
        hadErrors = true;
      }
      const expectedEMI = sheet.emi;
      const tolerance = 5;
      if (Math.abs(amount - expectedEMI) > tolerance) {
        showNotification(
          'error',
          `Amount should Match EMI : ${GetCurrencySymbol(
            sheet.currency,
          )}${expectedEMI}`,
        );
        hadErrors = true;
      }
    }
    return hadErrors;
  };

  const onSave = async () => {
    if (!selectedCategory) {
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: 'Please select category',
        }),
      );
      return;
    }

    if (checkLoanAccountErrors()) return;

    let sd = {
      amount: parseFloat(amount),
      notes: notes ? notes.trim() : notes,
      type: activeType,
      categoryId: selectedCategory.id,
      showTime: !!showTime,
      image: selectedImage,
      accountId: sheet.id,
      isEmiPayment: !!isEmiPayment,
      emiDate: isEmiPayment ? selectedEmiDate : null,
    };

    if (showTime) {
      sd.time = formatDate(time);
      let minutes = moment(sd.time).minutes();
      let hours = moment(sd.time).hours();
      let dte = date;
      dte.setMinutes(minutes);
      dte.setHours(hours);
      dte.setSeconds(0);
      sd.date = formatDate(dte);
    } else {
      let dte = date;
      dte.setMinutes(0);
      dte.setHours(0);
      dte.setSeconds(0);
      sd.date = formatDate(dte);
    }

    onSaveSheetDetail(sheet, sd, () => {
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
        isEmiPayment,
        emiDate: isEmiPayment ? selectedEmiDate : null,
        showTime,
        selectedCategory,
      };
    }
    return null;
  };

  const onEdit = () => {
    let selImage = _.cloneDeep(selectedImage);
    if (checkLoanAccountErrors()) return;

    let sd = {
      id: sheetDetail.id,
      amount: parseFloat(amount),
      notes: notes ? notes.trim() : notes,
      type: activeType,
      categoryId: selectedCategory.id,
      showTime: !!showTime,
      image: selImage,
      imageChanged: imageChanged,
      isEmiPayment: !!isEmiPayment,
      emiDate: isEmiPayment ? selectedEmiDate : null,
    };

    if (selectedImage.originalUrl && !selImage.url) {
      sd.imageDeleted = true;
    }
    if (selImage && selImage.originalUrl) {
      let image = selImage;
      image.url = image.originalUrl;
      delete image.originalUrl;
      sheetDetail.image = image;
    }

    if (showTime) {
      sd.time = formatDate(time);
      let minutes = moment(sd.time).minutes();
      let hours = moment(sd.time).hours();
      let dte = date;
      dte.setMinutes(minutes);
      dte.setHours(hours);
      dte.setSeconds(0);
      sd.date = formatDate(dte);
    } else {
      let dte = date;
      dte.setMinutes(0);
      dte.setHours(0);
      dte.setSeconds(0);
      sd.date = formatDate(dte);
    }

    onEditSheetDetail(sheet, sheetDetailModel, sd, () => {
      navigation.goBack();
    });
  };

  const onSetActiveType = type => {
    if (sheet?.isLoanAccount && type === 'income') {
      return; // prevent switching to income
    }

    if (activeType !== type) {
      setActiveType(type);
      setSelectedCategory(null);
    }
  };

  // when new category identified
  const onAddNewCategory = () => {
    let n = (Math.random() * 0xfffff * 1000000).toString(16);
    let categoryColor = '#' + n.slice(0, 6);
    let category = {
      name: _.capitalize(_.trim(newCategoryIdentified.category.name)),
      color: categoryColor,
      icon: '',
      userId: userData.id,
      type: 'expense',
      isLoanRelated: !!sheet.isLoanAccount,
    };
    onSaveCategory(category, insertedCat => {
      setSelectedCategory(insertedCat);
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
        setSelectedImage(p => ({
          ...p,
          type: pictureType,
          uri: uri,
          url: base64,
          extension: pictureExtension,
        }));
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
    try {
      if (!image || !image.url) {
        throw 'No Image Found';
      }
      if (!isConnected) {
        throw 'No Internet Connection';
      }
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
      const res = await RNFetchBlob.config({
        fileCache: true,
        appendExt: image.extension,
      }).fetch('GET', imageURL);

      await CameraRoll.saveToCameraRoll(res.data);

      dispatch(
        notificationActions.showToast({
          status: 'success',
          message: 'Image saved to your Camera Roll/ Photos',
        }),
      );
      dispatch(loaderActions.hideLoader());
      setOpen(false);
    } catch (e) {
      setOpen(false);
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: e.toString(),
        }),
      );
    }
  };

  const onClickDeleteImage = () => {
    if (!isConnected) {
      showNotification('error', 'No Internet Connection');
      setOpen(false);
      return;
    }
    setSelectedImage(p => ({
      ...p,
      url: null,
    }));
    setOpen(false);
  };

  if (!sheet) return null;
  return (
    <SafeArea child={true}>
      <MainWrapper>
        {!editMode && !smartScanMode && !isLoanAccount && (
          <TabsSwitcher
            tabs={[
              { key: 'expense', label: 'Expense' },
              { key: 'income', label: 'Income' },
            ]}
            setActiveKey={onSetActiveType}
            activeKey={activeType}
          />
        )}

        <ScrollView
          keyboardShouldPersistTaps="never"
          showsVerticalScrollIndicator={false}
        >
          <AddAmountContainer>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => amountInputRef.current?.focus()}
            >
              <AddAmountInputTextContainer>
                <View
                  onLayout={e => setAmountWidth(e.nativeEvent.layout.width)}
                >
                  <AddAmountInputText fontsize={'30px'}>
                    {activeType === 'expense' && '-'}
                    {GetCurrencySymbol(sheet?.currency)}{' '}
                    {GetCurrencyLocalString(amount)}
                  </AddAmountInputText>
                  <AddAmountInputTextBlinkingCursor />
                </View>
              </AddAmountInputTextContainer>

              <AddAmountInput
                ref={amountInputRef}
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
            </TouchableOpacity>
          </AddAmountContainer>

          <SheetDetailsUnderline width={amountWidth} />

          <Spacer size={'medium'} />

          <Spacer size={'large'} />
          <Input
            mode="outlined"
            returnKeyType="done"
            blurOnSubmit
            multiline
            style={{
              paddingTop: 20,
            }}
            value={notes}
            onChangeText={n => (!notes ? setNotes(n.trim()) : setNotes(n))}
            placeholder="Notes / Description"
            clearButtonMode="while-editing"
            maxLength={80}
          />
          <Spacer size={'large'}></Spacer>

          {isLoanAccount && (
            <Card
              style={{
                backgroundColor: theme.colors.bg.card,
                margin: 0.5,
                marginBottom: 20,
              }}
            >
              <Card.Content>
                <FlexRow justifyContent="space-between">
                  <Text fontfamily="heading">Is this an EMI Payment?</Text>
                  <ToggleSwitch
                    value={isEmiPayment}
                    onValueChange={value => {
                      setIsEmiPayment(value);
                      if (value) {
                        setIsPrepayment(false); // mutually exclusive
                      } else {
                        setIsPrepayment(true);
                      }
                    }}
                  />
                </FlexRow>
                {isEmiPayment && (
                  <>
                    <Spacer size="medium" />
                    <Text variantType="caption">
                      Uncheck the button if you want to make a pre-payment
                    </Text>
                  </>
                )}
                {!isEmiPayment && (
                  <>
                    <Spacer size="medium" />
                    <Text variantType="caption">
                      (This will be treated as a prepayment)
                    </Text>
                  </>
                )}
                <Spacer size="large" />
                {isEmiPayment && emiDates.length > 0 && (
                  <>
                    <Spacer size="medium" />
                    <Text>Select EMI Date</Text>
                    <Spacer size="medium" />
                    <SelectListInput
                      setSelected={d => {
                        setSelectedEmiDate(d);
                        setDate(new Date(`${d}T00:00:00`));
                      }}
                      defaultOption={{
                        key: selectedEmiDate,
                        value:
                          moment(selectedEmiDate).format('DD MMM YYYY - dddd'),
                      }}
                      data={emiDates.map(date => ({
                        key: date,
                        value: moment(date).format('DD MMM YYYY - dddd'),
                      }))}
                      save="key"
                      placeholder="Choose EMI Date"
                    />
                  </>
                )}
              </Card.Content>
            </Card>
          )}

          <Card
            style={{
              backgroundColor: theme.colors.bg.card,
              margin: 0.5,
            }}
            theme={{ roundness: 5 }}
            onPress={() => {
              let paramsObject = passPresentEditedDetailsToSelectCategory();
              navigation.navigate('SelectCategory', {
                type: activeType,
                selectedCategory,
                isLoanAccount: isLoanAccount,
                editMode,
                sheet: sheet,
                editModeParams: paramsObject,
                sheetDetailModel: sheetDetailModel,
              });
            }}
          >
            <Card.Title
              title={
                selectedCategory ? selectedCategory?.name : 'Select Category'
              }
              titleVariant="titleMedium"
              subtitle={
                selectedCategory ? 'Change category' : 'click here to change'
              }
              subtitleVariant="bodySmall"
              left={props => (
                <Avatar.Icon
                  style={{
                    backgroundColor: selectedCategory
                      ? selectedCategory.color
                      : theme.colors.brand.primary,
                  }}
                  {...(selectedCategory &&
                    selectedCategory.icon && {
                      icon: selectedCategory.icon,
                    })}
                  {...(!selectedCategory && {
                    icon: 'format-list-bulleted',
                  })}
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
          </Card>

          <Spacer size={'large'} />

          <Card
            theme={{ roundness: 5 }}
            style={{
              backgroundColor: theme.colors.bg.card,
              margin: 1,
            }}
          >
            <Spacer size="large" />

            {(!isLoanAccount ||
              (isLoanAccount && !isEmiPayment) ||
              (isLoanAccount && isPrepayment)) && (
              <>
                {/* date picker */}
                <Divider />
                <Spacer size={'large'} />
                <Card.Content>
                  <View>
                    <FlexRow justifyContent="space-between">
                      <FlexRow gap="5px">
                        <Ionicons
                          name="calendar-outline"
                          size={25}
                          color={theme.colors.brand.primary}
                        >
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
                            }
                          >
                            <Text fontfamily="bodySemiBold" fontsize="14px">
                              {moment(date).format('DD MMM YYYY')}
                            </Text>
                          </TouchableOpacity>
                          {showPicker.date && (
                            <DateTimePicker
                              mode="date"
                              value={date}
                              timeZoneName="America/Toronto"
                              themeVariant={darkMode ? 'dark' : 'light'}
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
                          themeVariant={darkMode ? 'dark' : 'light'}
                          dateFormat="dayofweek day month"
                          // maximumDate={new Date()}
                          onChange={(e, d) => {
                            if (e.type === 'dismissed') {
                              setShowPicker(prev => ({
                                ...prev,
                                date: false,
                              }));
                            }
                            if (d) {
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
                {/* time */}
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
                {/* showing time */}
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
                              color={theme.colors.brand.primary}
                            >
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
                                }
                              >
                                <Text fontfamily="bodySemiBold" fontsize="14px">
                                  {moment(time).format('hh:mm A')}
                                </Text>
                              </TouchableOpacity>
                              {showPicker.time && (
                                <DateTimePicker
                                  mode="time"
                                  value={time}
                                  themeVariant={darkMode ? 'dark' : 'light'}
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
                              themeVariant={darkMode ? 'dark' : 'light'}
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
              </>
            )}
            {/* image */}
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
                    }}
                  >
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
            disabled={disabled}
          >
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
              <Dialog.Title style={{ textAlign: 'center' }}>
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
                    style={{ textTransform: 'uppercase' }}
                  >
                    {newCategoryIdentified.category?.name}
                  </Text>
                  &nbsp;&nbsp; category? Do you want to proceed by adding this
                  to your existing categories list?
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button
                  onPress={() =>
                    setNewCategoryIdentified(p => ({ ...p, showDialog: false }))
                  }
                  textColor="#aaa"
                >
                  Cancel
                </Button>
                <Spacer position={'left'} size="large" />
                <Button
                  uppercase={false}
                  icon={'plus'}
                  mode="outlined"
                  onPress={onAddNewCategory}
                  textColor={theme.colors.brand.primary}
                >
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
                <Spacer position={'left'} size="xlarge" />
                <Button onPress={() => onClickDeleteImage()}>
                  <FontAwesome name="trash" size={20} color={'tomato'} />
                </Button>
                {editMode && !imageChanged && (
                  <>
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
