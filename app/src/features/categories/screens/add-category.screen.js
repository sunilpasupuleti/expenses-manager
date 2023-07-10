import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  TouchableOpacity,
  VirtualizedList,
} from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Modal,
  Portal,
  Searchbar,
} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {ButtonText, FlexRow, MainWrapper} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {
  CategoryColor,
  CategoryNameInput,
  ColorPickerView,
  IconView,
} from '../components/categories.styles';
import {CategoryTabs} from '../components/category-tabs.component';
import {ColorPicker, fromHsv} from 'react-native-color-picker';
import Iconicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import MaterialCommunityIcons from '../../../components/utility/materialCommunityIcons.json';
import {Text} from '../../../components/typography/text.component';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../../store/loader-slice';
import {notificationActions} from '../../../store/notification-slice';
const colors = [
  '#ff3a30',
  '#ff5722',
  '#fe9500',
  '#ffcc00',
  // '#cddc39',
  '#35c759',
  '#00acc1',
  '#2fb0c7',
  '#007aff',
  '#5756d5',
  '#fe2c54',
  '#af52de',
  '#8a7250',
  '#8e8e92',
  '#aeaeb1',
  '#c7c7cb',
  // '#d1d1d5',
  '#ce948e',
];

export const AddCategoryScreen = ({navigation, route}) => {
  const theme = useTheme();
  const [disabled, setDisabled] = useState(true);
  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState(null);
  const [categoryType, setCategoryType] = useState('expense');
  const [categoryColor, setCategoryColor] = useState(
    colors[Math.floor(Math.random() * colors.length)],
  );
  const {onSaveCategory, onEditCategory} = useContext(SheetsContext);

  const [icons, setIcons] = useState(
    Object.keys(MaterialCommunityIcons).slice(0, 40),
  );
  const [icon, setIcon] = useState(null);
  const [search, setSearch] = useState('');

  // if focused from sheet details screen
  const [fromSheetDetailScreen, setFromSheetDetailScreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const dispatch = useDispatch();

  let scrollViewRef = useRef(null);

  useEffect(() => {
    if (route.params) {
      if (route.params.edit) {
        setEditMode(true);
        setDisabled(false);
        let category = route.params.category;
        setCategoryId(category.id);
        setCategoryName(category.name);
        setCategoryColor(category.color);
        setIcon(category.icon ? category.icon : null);
        setCategoryType(route.params.type);
      }
      if (route.params.type) {
        setCategoryType(route.params.type);
      }
      if (route.params.fromSheetDetailScreen) {
        setFromSheetDetailScreen(true);
      }
    }
  }, [route.params]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle:
        route.params && route.params.edit ? 'Edit Category' : 'Add Category',
      headerLeft: () => (
        <Button uppercase={false} onPress={onCancel}>
          <ButtonText>Cancel</ButtonText>
        </Button>
      ),
      headerRight: () => {
        return (
          <Button
            disabled={disabled}
            uppercase={false}
            onPress={editMode ? onEdit : onSave}>
            <ButtonText disabled={disabled}>Done</ButtonText>
          </Button>
        );
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName, categoryColor, categoryType, icon, disabled]);

  useEffect(() => {
    if (categoryName === '' || !categoryName) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [categoryName]);

  const onSearch = () => {
    setIcons(Object.keys(MaterialCommunityIcons).slice(0, 40));
    if (search !== '') {
      dispatch(loaderActions.showLoader({backdrop: true}));
      let filtered = Object.keys(MaterialCommunityIcons).filter(s => {
        return s.toLowerCase().includes(search.trim().toLowerCase());
      });
      setIcons(filtered);
      dispatch(loaderActions.hideLoader());
    }
  };

  const onClearSearch = () => {
    setSearch('');
    setIcons(Object.keys(MaterialCommunityIcons).slice(0, 40));
  };

  const onSave = () => {
    categoryName.trim();
    let name = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    // if (!icon) {
    //   dispatch(
    //     notificationActions.showToast({
    //       status: 'warning',
    //       message: 'Please select Icon',
    //     }),
    //   );
    //   return;
    // }
    let category = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name: name.trim(),
      color: categoryColor,
      icon: icon,
    };
    onSaveCategory(category, categoryType, () => {
      if (fromSheetDetailScreen) {
        navigation.navigate('SelectCategory', {
          selectedCategory: category,
          type: route.params.type,
        });
        return;
      }
      navigation.goBack();
    });
  };

  const onEdit = () => {
    // if (!icon) {
    //   dispatch(
    //     notificationActions.showToast({
    //       status: 'warning',
    //       message: 'Please select Icon',
    //     }),
    //   );
    //   return;
    // }
    const editedCategory = {
      id: categoryId,
      name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      color: categoryColor,
      icon: icon,
    };
    onEditCategory(editedCategory, categoryType, () => {
      navigation.goBack();
    });
  };

  const onCancel = () => {
    navigation.goBack();
  };

  const onSetCategoryType = type => {
    setCategoryType(type);
  };

  const containerStyle = {backgroundColor: 'white', height: 350, padding: 20};
  return (
    <SafeArea>
      {/* for color picker */}
      <Portal>
        <Modal
          visible={showColorPicker}
          onDismiss={() => setShowColorPicker(false)}
          contentContainerStyle={containerStyle}>
          <ColorPicker
            sliderComponent={Slider}
            onColorChange={color => {
              let hsvToHex = fromHsv(color);
              setCategoryColor(hsvToHex);
            }}
            onColorSelected={color => {
              setCategoryColor(color);
            }}
            style={{flex: 1}}
          />
          {/* <Dialog.Actions> */}
          <Spacer size={'large'}>
            <FlexRow justifyContent="space-between">
              <Button
                mode="text"
                buttonColor="#aaa"
                onPress={() => {
                  setShowColorPicker(false);
                }}>
                Cancel
              </Button>
              <Button
                mode="text"
                buttonColor={categoryColor}
                onPress={() => {
                  setShowColorPicker(false);
                }}>
                Done
              </Button>
            </FlexRow>
          </Spacer>
          {/* </Dialog.Actions> */}
        </Modal>
      </Portal>
      <ScrollView
        ref={el => (scrollViewRef.current = el)}
        keyboardShouldPersistTaps="never">
        <MainWrapper>
          <Spacer size="xlarge">
            {!editMode && (
              <>
                <CategoryTabs
                  setActiveType={onSetCategoryType}
                  activeType={categoryType}
                />
                <Spacer size={'large'} />
              </>
            )}
          </Spacer>

          <CategoryNameInput
            autoCapitalize="sentences"
            theme={{roundness: 10}}
            mode="outlined"
            value={categoryName}
            onChangeText={n => setCategoryName(n)}
            placeholder="Enter the category name * "
            left={
              <CategoryNameInput.Icon icon="circle" iconColor={categoryColor} />
            }
            right={
              <CategoryNameInput.Icon
                name="close-circle"
                color="#bbb"
                onPress={() => setCategoryName('')}
              />
            }
            maxLength={50}
          />
          <Spacer size={'xlarge'} />
          <Card theme={{roundness: 5}} style={{paddingBottom: 20}}>
            <FlexRow style={{flexWrap: 'wrap'}}>
              <TouchableOpacity onPress={() => setShowColorPicker(true)}>
                <ColorPickerView
                  color={categoryColor}
                  style={{
                    marginTop: 15,
                    marginLeft: 15,
                    height: 40,
                    width: 40,
                  }}>
                  <Iconicons
                    name="ios-color-palette"
                    size={25}
                    color={categoryColor}
                  />
                </ColorPickerView>
              </TouchableOpacity>

              {colors.map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setCategoryColor(color)}>
                  <CategoryColor
                    color={color}
                    style={{
                      marginTop: 15,
                      marginLeft: 15,
                      height: 40,
                      width: 40,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </FlexRow>
          </Card>
          <Spacer size={'large'} />

          <Searchbar
            value={search}
            onFocus={() => {
              let height = Dimensions.get('screen').height;
              scrollViewRef.current?.scrollTo({
                y: 300,
                animated: true,
              });
            }}
            theme={{roundness: 10}}
            style={{elevation: 2}}
            placeholder="Search for more Icons"
            onChangeText={k => setSearch(k)}
            onSubmitEditing={onSearch}
            clearIcon={() =>
              search !== '' && (
                <Iconicons
                  onPress={onClearSearch}
                  name="close-circle-outline"
                  size={25}
                  color={theme.colors.brand.primary}
                />
              )
            }
          />
          <Spacer size={'large'} />
          <Card
            theme={{roundness: 5}}
            style={{paddingBottom: 20, paddingTop: 20, marginBottom: 150}}>
            <Card.Title
              title="Select the category icon"
              subtitle={
                icons.length === 0 ? 'No Icons Found' : 'It is a optional field'
              }
            />
            <FlexRow style={{flexWrap: 'wrap'}}>
              {/* <Text>hey</Text> */}
              {icon && (
                <IconView style={{backgroundColor: categoryColor}}>
                  <MaterialCommunityIcon name={icon} size={18} color="#fff" />
                </IconView>
              )}

              {icons.map(item => {
                return (
                  <TouchableOpacity key={item} onPress={() => setIcon(item)}>
                    <IconView color={categoryColor}>
                      <MaterialCommunityIcon
                        name={item}
                        size={18}
                        // color="#fff"
                        color={categoryColor}
                      />
                    </IconView>
                  </TouchableOpacity>
                );
              })}
            </FlexRow>
          </Card>
        </MainWrapper>
      </ScrollView>
    </SafeArea>
  );
};
