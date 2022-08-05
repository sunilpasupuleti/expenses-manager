import React, {useContext, useEffect, useState, useRef} from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  FlatList,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from 'styled-components/native';
import {FlexRow, MainWrapper} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {
  BottomIconsContainer,
  CameraButton,
  CameraIcon,
  SheetDetailsAddIcon,
  SheetDetailsTotalBalance,
  SheetDetailsUnderline,
} from '../components/sheet-details/sheet-details.styles';
import moment from 'moment';
import _ from 'lodash';
import {SheetDetailsInfo} from '../components/sheet-details/sheet-details-info.component';
import {Spacer} from '../../../components/spacer/spacer.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {Searchbar} from 'react-native-paper';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import {GetCurrencySymbol} from '../../../components/symbol.currency';
import {useDispatch} from 'react-redux';
import {Button, Dialog, Portal} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Platform} from 'react-native';
import {fetchExchangeRates} from '../../../store/service-slice';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {PermissionsAndroid} from 'react-native';

const subtractMonths = numOfMonths => {
  let date = new Date();
  date.setMonth(date.getMonth() - numOfMonths);
  return date;
};

export const SheetDetailsScreen = ({navigation, route}) => {
  const [sheet, setSheet] = useState(route.params.sheet);
  const [filteredSheet, setFilteredSheet] = useState(route.params.sheet);
  const [customFilteredSheet, setCustomFilteredSheet] = useState(
    route.params.sheet,
  );

  const [groupedSheetDetails, setGroupedSheetDetails] = useState({});
  let date = new Date();
  // for custom date range
  const [customFilter, setCustomFilter] = useState({
    modalVisible: false,
    filtered: false,
    fromDate: {
      value: subtractMonths(1),
      showPicker: Platform.OS === 'ios' ? true : false,
    },
    toDate: {
      value: new Date(),
      showPicker: Platform.OS === 'ios' ? true : false,
    },
  });
  // end of custom filter
  const theme = useTheme();
  const [searchKeyword, setSearchKeyword] = useState('');

  const {getSheetById, calculateBalance, onGoogleCloudVision} =
    useContext(SheetsContext);
  let menuRef = useRef();
  let cameraRef = useRef();
  const dispatch = useDispatch();

  const menuOptionStyles = {
    optionWrapper: {padding: 15, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };

  useEffect(() => {
    if (route.params.sheet) {
      setSheet(route.params.sheet);
      setFilteredSheet(route.params.sheet);
      onGroupSheetDetails(getSheetById(route.params.sheet.id));
    }
  }, [route.params]);

  const onGroupSheetDetails = s => {
    let sheetDetails = s.details;
    const groupByDate = item => moment(item.date).format('YYYY-MM-DD');

    if (sheetDetails) {
      let grouped = _(sheetDetails).groupBy(groupByDate).value();
      let keys = [];
      for (let key in grouped) {
        keys.push(key);
      }
      keys.sort();
      let groupedDetails = {};
      keys.reverse().forEach(key => {
        groupedDetails[key] = grouped[key];
      });
      setGroupedSheetDetails(groupedDetails);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerStyle: {
        backgroundColor: theme.colors.bg.primary,
      },
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
        <Menu
          style={{marginRight: 10}}
          onBackdropPress={() => menuRef.current.close()}
          ref={element => (menuRef.current = element)}>
          <MenuTrigger
            customStyles={{
              triggerTouchable: {
                underlayColor: '#eee',
                onPress: () => {
                  menuRef.current.open();
                },
              },
              TriggerTouchableComponent: TouchableOpacity,
            }}>
            <MaterialCommunityIcons
              name="dots-horizontal-circle-outline"
              size={25}
              color={theme.colors.brand.primary}
            />
          </MenuTrigger>

          <MenuOptions
            optionsContainerStyle={{
              marginRight: 10,
              marginTop: 35,
              borderRadius: 10,
              minWidth: 250,
            }}>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                navigation.navigate('SheetStats', {sheet});
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Stats
                </Text>
                <Ionicons name="pie-chart-outline" size={22} />
              </FlexRow>
            </MenuOption>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                navigation.navigate('SheetTrends', {sheet});
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Trends
                </Text>
                <Ionicons name="trending-up-outline" size={22} />
              </FlexRow>
            </MenuOption>

            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                dispatch(
                  fetchExchangeRates({
                    showAlert: false,
                    BASE_CURRENCY: sheet.currency,
                    dispatch: dispatch,
                  }),
                );
                menuRef.current.close();
                navigation.navigate('CurrencyRates', {
                  display: true,
                  selectedCurrency: sheet.currency,
                });
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Curreny Rate
                </Text>
                <FontAwesome name="money" size={20} />
              </FlexRow>
            </MenuOption>

            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                navigation.navigate('AddSheet', {
                  sheet,
                  edit: true,
                  callback: sheet =>
                    navigation.navigate('SheetDetails', {sheet}),
                });
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Edit Sheet
                </Text>
                <Ionicons name="pencil-outline" size={22} />
              </FlexRow>
            </MenuOption>
          </MenuOptions>
          <Spacer size={'medium'} />
        </Menu>
      ),
    });
  }, [navigation, sheet]);

  useEffect(() => {
    let fsheet;
    if (customFilter.filtered) {
      fsheet = {...customFilteredSheet};
    } else {
      fsheet = {...filteredSheet};
    }
    if (searchKeyword !== '' && fsheet.details) {
      let filteredDetails = fsheet.details.filter(sd => {
        let notesMatched = sd.notes
          ? sd.notes.toLowerCase().includes(searchKeyword.trim().toLowerCase())
          : false;
        return (
          sd.category.name
            .toLowerCase()
            .includes(searchKeyword.trim().toLowerCase()) ||
          sd.amount.toString().includes(searchKeyword.trim().toLowerCase()) ||
          sd.type.toLowerCase().includes(searchKeyword.trim().toLowerCase()) ||
          notesMatched
        );
      });
      fsheet.details = filteredDetails;
      fsheet.totalBalance = calculateBalance(fsheet);
    }
    setSheet(fsheet);
    onGroupSheetDetails(fsheet);
  }, [searchKeyword]);

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
    onGroupSheetDetails(fsheet);
    setCustomFilter(p => ({
      ...p,
      filtered: true,
      modalVisible: false,
    }));
  };

  const onCloseCustomFilter = () => {
    setCustomFilter(p => ({
      ...p,
      modalVisible: false,
    }));
  };

  const onResetCustomFilter = () => {
    setCustomFilter({
      modalVisible: false,
      filtered: false,
      fromDate: {
        value: subtractMonths(1),
        showPicker: Platform.OS === 'ios' ? true : false,
      },
      toDate: {
        value: new Date(),
        showPicker: Platform.OS === 'ios' ? true : false,
      },
    });
    let fsheet = {...filteredSheet};
    setSheet(fsheet);
    setCustomFilteredSheet(fsheet);
    onGroupSheetDetails(fsheet);
  };

  const onClickScanButton = async mode => {
    let options = {
      mediaType: 'photo',
      cameraType: 'back',
      includeBase64: true,
      presentationStyle: 'popover',
    };
    let callback = response => {
      if (
        response &&
        response.assets &&
        response.assets[0] &&
        response.assets[0].base64
      ) {
        let base64Data = response.assets[0].base64;
        onGoogleCloudVision(base64Data, fetchedData => {
          navigation.navigate('AddSheetDetail', {
            gcpVision: true,
            sheetDetail: fetchedData,
            sheet: sheet,
          });
        });
      }
    };
    if (mode === 'camera') {
      // if (Platform.OS === 'android') {
      //   try {
      //     const granted = await PermissionsAndroid.request(
      //       PermissionsAndroid.PERMISSIONS.CAMERA,
      //       {
      //         title: 'Camera Permission',
      //         message: 'App needs camera permission',
      //       },
      //     );
      //     console.log(granted === PermissionsAndroid.RESULTS.GRANTED);
      //     // If CAMERA Permission is granted
      //     return granted === PermissionsAndroid.RESULTS.GRANTED;
      //   } catch (err) {
      //     console.warn('Please enable camera permission ');
      //     return false;
      //   }
      // }
      await launchCamera(options, response => {
        callback(response);
      });
    } else {
      // if (Platform.OS === 'android') {
      //   try {
      //     const granted = await PermissionsAndroid.request(
      //       PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      //       {
      //         title: 'External Storage Write Permission',
      //         message: 'App needs write permission',
      //       },
      //     );
      //     // If WRITE_EXTERNAL_STORAGE Permission is granted
      //     return granted === PermissionsAndroid.RESULTS.GRANTED;
      //   } catch (err) {
      //     console.warn('Please enable permission ');
      //   }
      //   return false;
      // }
      await launchImageLibrary(options, response => {
        callback(response);
      });
    }
  };

  return (
    <SafeArea
      style={{
        backgroundColor: theme.colors.bg.primary,
      }}>
      <FlexRow justifyContent="space-between">
        <Text fontsize={'30px'} fontfamily="headingBold" style={{padding: 10}}>
          {sheet.name}
        </Text>
        <Spacer position={'right'} size="medium">
          <MaterialCommunityIcons
            onPress={() =>
              setCustomFilter(p => ({
                ...p,
                modalVisible: true,
              }))
            }
            name={
              customFilter.filtered ? 'filter-remove-outline' : 'filter-outline'
            }
            size={30}
            color={theme.colors.brand.primary}
          />
        </Spacer>
      </FlexRow>
      <Searchbar
        value={searchKeyword}
        theme={{roundness: 10}}
        style={{elevation: 2, margin: 10, marginBottom: 0}}
        placeholder="Search"
        onChangeText={k => setSearchKeyword(k)}
        clearIcon={() =>
          searchKeyword !== '' && (
            <Ionicons
              onPress={() => setSearchKeyword('')}
              name="close-circle-outline"
              size={25}
              color={theme.colors.brand.primary}
            />
          )
        }
      />

      <SheetDetailsTotalBalance fontsize={'30px'} fontfamily="bodySemiBold">
        {GetCurrencySymbol(sheet.currency)}{' '}
        {sheet.totalBalance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </SheetDetailsTotalBalance>

      <SheetDetailsUnderline />

      <Spacer size={'xlarge'} />
      {sheet.details && sheet.details.length > 0 && (
        <FlatList
          data={Object.keys(groupedSheetDetails)}
          showsVerticalScrollIndicator={false}
          renderItem={({item, index}) => {
            let sheetDetails = groupedSheetDetails[item];
            var totalExpenseAmount = 0;
            var totalIncomeAmount = 0;
            sheetDetails.filter(d => {
              if (d.type === 'expense') {
                totalExpenseAmount += d.amount;
              } else if (d.type === 'income') {
                totalIncomeAmount += d.amount;
              }
            });
            let totalBalance = totalIncomeAmount - totalExpenseAmount;

            let sortedSheetDetails = _(sheetDetails)
              .sortBy(item => item.createdAt)
              .reverse()
              .value();
            return (
              <SheetDetailsInfo
                totalBalance={totalBalance}
                date={item}
                sheetDetails={sortedSheetDetails}
                navigation={navigation}
                sheet={sheet}
              />
            );
          }}
          keyExtractor={item => item}
          contentContainerStyle={{paddingBottom: 50}}
        />
      )}

      {sheet.details && sheet.details.length === 0 && (
        <View>
          <Text style={{textAlign: 'center', fontStyle: 'italic'}}>
            Tap the plus button to create a new expense.
          </Text>
        </View>
      )}

      <BottomIconsContainer>
        {/*  for camera option */}
        <Menu
          onBackdropPress={() => cameraRef.current.close()}
          ref={element => (cameraRef.current = element)}>
          <MenuTrigger
            customStyles={{
              triggerTouchable: {
                underlayColor: '#eee',
                // onPress: () => {
                //   console.log('pressed');
                //   menuRef.current.open();
                // },
              },
              TriggerTouchableComponent: TouchableOpacity,
            }}>
            <CameraButton onPress={() => cameraRef.current.open()}>
              <CameraIcon
                name="camera-outline"
                size={25}
                color="#fff"
                // color={theme.colors.brand.primary}
              />
            </CameraButton>
          </MenuTrigger>

          <MenuOptions
            optionsContainerStyle={{
              marginLeft: 15,
              marginTop: -40,
              borderRadius: 10,
              minWidth: 250,
            }}>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                cameraRef.current.close();
                onClickScanButton('camera');
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Take a Photo
                </Text>
                <Ionicons name="camera-outline" size={25} color="#000" />
              </FlexRow>
            </MenuOption>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                cameraRef.current.close();
                onClickScanButton('gallery');
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Choose a Photo
                </Text>
                <FontAwesome name="photo" size={20} color="#000" />
              </FlexRow>
            </MenuOption>
          </MenuOptions>
          <Spacer size={'medium'} />
        </Menu>
        <SheetDetailsAddIcon>
          <TouchableNativeFeedback
            onPress={() => {
              navigation.navigate('AddSheetDetail', {
                sheet: sheet,
              });
            }}>
            <AntDesign name="plus" size={40} color={'#fff'} />
          </TouchableNativeFeedback>
        </SheetDetailsAddIcon>
      </BottomIconsContainer>

      {/* dialog for custom filter */}
      <Portal>
        <Dialog
          visible={customFilter.modalVisible}
          onDismiss={onCloseCustomFilter}>
          <Dialog.Content>
            <FlexRow justifyContent="space-between">
              <Text>From Date : </Text>
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
              )}

              {customFilter.fromDate.showPicker && (
                <DateTimePicker
                  style={{
                    width: '100%',
                    position: 'absolute',
                    right: 10,
                  }}
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
                  }}></DateTimePicker>
              )}
            </FlexRow>
            <Spacer size={'xlarge'} />
            <FlexRow justifyContent="space-between">
              <Text>To Date : </Text>
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
              )}

              {customFilter.toDate.showPicker && (
                <DateTimePicker
                  style={{
                    width: '100%',
                    position: 'absolute',
                    right: 10,
                  }}
                  mode="date"
                  value={customFilter.toDate.value}
                  maximumDate={new Date()}
                  onChange={(e, d) => {
                    if (e.type === 'dismissed') {
                      setCustomFilter(p => ({
                        ...p,
                        fromDate: {
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
                  }}></DateTimePicker>
              )}
            </FlexRow>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onCloseCustomFilter} color="#aaa">
              Close
            </Button>
            <Spacer position={'right'} size="large" />
            <Button onPress={onResetCustomFilter} color="tomato">
              Reset
            </Button>
            <Spacer position={'right'} size="large" />
            <Button onPress={onCustomFilter}>Filter</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeArea>
  );
};
