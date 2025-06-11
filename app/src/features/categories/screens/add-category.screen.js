import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ScrollView, TouchableOpacity} from 'react-native';
import {Button, Card, Modal, Portal, Switch} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {
  ButtonText,
  FlexRow,
  Input,
  MainWrapper,
} from '../../../components/styles';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {
  CategoryColor,
  ColorPickerView,
  IconView,
} from '../components/categories.styles';
import _, {debounce} from 'lodash';
import {ColorPicker, fromHsv} from 'react-native-color-picker';
import Iconicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import {Text} from '../../../components/typography/text.component';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../../../store/loader-slice';
import {notificationActions} from '../../../store/notification-slice';
import {CategoriesContext} from '../../../services/categories/categories.context';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {View} from 'react-native';
import {TabsSwitcher} from '../../../components/tabs-switcher/tabs-switcher.component';
import Fuse from 'fuse.js';
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
  const [isLoanRelated, setIsLoanRelated] = useState(false);

  const {onSaveCategory, onEditCategory} = useContext(CategoriesContext);
  const {userData} = useContext(AuthenticationContext);

  const [icons, setIcons] = useState([]);
  const [icon, setIcon] = useState(null);
  const [search, setSearch] = useState('');
  const [MaterialCommunityIcons, setMaterialCommunityIcons] = useState([]);

  // if focused from sheet details screen
  const [fromSheetDetailScreen, setFromSheetDetailScreen] = useState(false);
  const [
    fromSheetDetailScreenLoanAccount,
    setFromSheetDetailScreenLoanAccount,
  ] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const fuseRef = useRef(null);

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
        setIsLoanRelated(category.isLoanRelated ? true : false);
        setIcon(category.icon ? category.icon : null);
        setCategoryType(route.params.type);
      }
      if (route.params.type) {
        setCategoryType(route.params.type);
      }
      if (route.params.fromSheetDetailScreen) {
        setFromSheetDetailScreen(true);
      }
      if (route.params.isLoanAccount) {
        setFromSheetDetailScreenLoanAccount(true);
        setIsLoanRelated(true);
      }
    }
  }, [route.params]);

  useEffect(() => {
    const loadIcons = async () => {
      const icons = await import(
        '../../../components/utility/materialCommunityIcons.json'
      );
      fuseRef.current = new Fuse(icons.default, {
        keys: ['name', 'aliases', 'tags'],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: true,
        useExtendedSearch: false,
        isCaseSensitive: false,
        findAllMatches: true,
      });
      setMaterialCommunityIcons(icons.default);
      setIcons(icons.default.slice(0, 40));
    };
    loadIcons();
  }, []);

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
  }, [
    categoryName,
    categoryColor,
    categoryType,
    icon,
    disabled,
    isLoanRelated,
  ]);

  useEffect(() => {
    if (categoryName === '' || !categoryName) {
      setDisabled(true);
      return;
    }
    setDisabled(false);
    const results = fuseRef.current?.search(categoryName.trim()) || [];
    const matchedIcons = results.map(result => result.item);

    setIcons(matchedIcons.slice(0, 40));
  }, [categoryName]);

  const onSearchDebounced = useRef();

  useEffect(() => {
    onSearchDebounced.current = debounce(keyword => {
      if (!keyword.trim()) {
        setIcons(MaterialCommunityIcons.slice(0, 40));
        return;
      }

      const results = fuseRef.current?.search(keyword.trim()) || [];
      setIcons(results.map(r => r.item).slice(0, 40));
    }, 300);

    return () => {
      onSearchDebounced.current?.cancel();
    };
  }, [MaterialCommunityIcons]);

  const isValidIcon = name => MaterialCommunityIcon.hasIcon(name);

  const renderedIcons = useMemo(() => {
    return icons
      .filter(item => isValidIcon(item.name))
      .slice(0, 40)
      .map(item => (
        <TouchableOpacity
          key={item.id || item.name}
          onPress={() => setIcon(item.name)}>
          <IconView color={categoryColor}>
            <MaterialCommunityIcon
              name={item.name}
              size={18}
              color={categoryColor}
            />
          </IconView>
        </TouchableOpacity>
      ));
  }, [icons, categoryColor]);

  const onSave = () => {
    categoryName.trim();
    let category = {
      name: _.capitalize(_.trim(categoryName)),
      color: categoryColor,
      icon: icon,
      userId: userData.id,
      type: categoryType,
      isLoanRelated: isLoanRelated,
    };
    onSaveCategory(category, insertedCat => {
      if (fromSheetDetailScreen) {
        navigation.navigate('SelectCategory', {
          type: route.params.type,
          isLoanAccount: route.params.isLoanAccount,
          addedNewCategoryAndSelected: true,
        });
        return;
      }
      navigation.goBack();
    });
  };

  const onEdit = () => {
    const editedCategory = {
      id: categoryId,
      name: _.capitalize(_.trim(categoryName)),
      color: categoryColor,
      icon: icon,
      type: categoryType,
      isLoanRelated: isLoanRelated,
    };
    onEditCategory(route.params.category, editedCategory, () => {
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
    <SafeArea child={true}>
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
            {!editMode &&
              !fromSheetDetailScreenLoanAccount &&
              !fromSheetDetailScreen && (
                <>
                  <TabsSwitcher
                    tabs={[
                      {key: 'expense', label: 'Expense'},
                      {key: 'income', label: 'Income'},
                    ]}
                    setActiveKey={onSetCategoryType}
                    activeKey={categoryType}
                  />
                  <Spacer size={'large'} />
                </>
              )}
          </Spacer>

          <Input
            autoCapitalize="sentences"
            mode="outlined"
            value={categoryName}
            onChangeText={n => setCategoryName(n)}
            placeholder="Enter your category name * "
            left={
              <Input.Icon
                icon={icon ? icon : 'circle'}
                style={icon ? {backgroundColor: categoryColor} : {}}
                iconColor={icon ? '#fff' : categoryColor}
              />
            }
            clearButtonMode="while-editing"
            maxLength={50}
          />
          <Spacer size={'xlarge'} />
          <Card
            theme={{roundness: 5}}
            style={{paddingBottom: 20, backgroundColor: theme.colors.bg.card}}>
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
                    name="color-palette"
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

          <Spacer size="large" />
          {categoryType === 'expense' && (
            <>
              <FlexRow
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  backgroundColor: theme.colors.bg.card,
                  borderRadius: 5,
                }}>
                <Text variant="label">Mark as Loan Related Category</Text>
                <Switch
                  disabled={fromSheetDetailScreenLoanAccount}
                  value={isLoanRelated}
                  onValueChange={() => setIsLoanRelated(!isLoanRelated)}
                  color={categoryColor}
                />
              </FlexRow>
              <Spacer size={'large'} />
            </>
          )}

          <Input
            value={search}
            placeholder="Search for more Icons"
            onChangeText={k => {
              setSearch(k);
              onSearchDebounced.current?.(k);
            }}
            clearButtonMode="while-editing"
          />
          <Spacer size={'large'} />
          <Card
            theme={{roundness: 5}}
            style={{
              paddingBottom: 20,
              paddingTop: 20,
              marginBottom: 150,
              backgroundColor: theme.colors.bg.card,
            }}>
            <Card.Title
              title="Select the category icon"
              subtitle={
                icons.length === 0 ? 'No Icons Found' : 'It is a optional field'
              }
            />
            <FlexRow style={{flexWrap: 'wrap'}}>
              {/* <Text>hey</Text> */}
              {icon && (
                <TouchableOpacity
                  onPress={() => {
                    if (icon) {
                      setIcon(null);
                    }
                  }}>
                  <IconView style={{backgroundColor: categoryColor}}>
                    <MaterialCommunityIcon name={icon} size={18} color="#fff" />
                  </IconView>
                </TouchableOpacity>
              )}
              {renderedIcons}
            </FlexRow>
          </Card>
        </MainWrapper>
      </ScrollView>
    </SafeArea>
  );
};
