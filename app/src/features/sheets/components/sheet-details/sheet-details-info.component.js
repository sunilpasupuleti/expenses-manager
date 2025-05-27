import React, {useRef, useContext} from 'react';
import {TouchableOpacity, Alert, View} from 'react-native';
import moment from 'moment';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {FadeInUp, FadeOutUp} from 'react-native-reanimated';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
import {
  SheetDetailAmount,
  SheetDetailCategory,
  SheetDetailCategoryColor,
  SheetDetailInfo,
  SheetDetailInfoContainer,
  SheetDetailNotes,
} from './sheet-details.styles';
import {FlexRow} from '../../../../components/styles';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {Text} from '../../../../components/typography/text.component';
import {Spacer} from '../../../../components/spacer/spacer.component';
import _ from 'lodash';

const menuOptionStyles = {
  optionWrapper: {padding: 15, paddingTop: 10},
  OptionTouchableComponent: TouchableOpacity,
};

export const SheetDetailsInfo = ({
  transaction,
  sheet,
  navigation,
  onGetSheetDetails,
  index,
}) => {
  const {onDeleteSheetDetail, onDuplicateSheetDetail, onChangeSheetDetailType} =
    useContext(SheetDetailsContext);
  const menuRef = useRef(null);

  const {category = {}, type, amount, notes, showTime, time} = transaction;
  const {icon, color, name: categoryName} = category;

  const handleDelete = () => {
    Alert.alert(
      'Confirm?',
      `Delete this "${type.toUpperCase()}" transaction?`,
      [
        {text: 'Cancel'},
        {
          text: 'Delete',
          onPress: () =>
            onDeleteSheetDetail(sheet, transaction, () =>
              onGetSheetDetails(sheet, null),
            ),
        },
      ],
    );
  };

  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp}>
      <Menu
        onBackdropPress={() => menuRef.current?.close()}
        ref={ref => (menuRef.current = ref)}>
        <MenuTrigger
          customStyles={{
            triggerTouchable: {
              onLongPress: () => menuRef.current?.open(),
              onPress: () => {
                menuRef.current?.close();
                navigation.navigate('AddSheetDetail', {
                  sheetDetail: transaction,
                  edit: true,
                });
              },
              underlayColor: '#eee',
            },
            TriggerTouchableComponent: TouchableOpacity,
          }}>
          <SheetDetailInfoContainer>
            <SheetDetailInfo>
              <SheetDetailCategoryColor color={color}>
                {icon && (
                  <MaterialCommunityIcon name={icon} size={16} color="#fff" />
                )}
              </SheetDetailCategoryColor>
              <View>
                <SheetDetailCategory>{categoryName}</SheetDetailCategory>
                {showTime || notes ? (
                  <SheetDetailNotes>
                    {_.truncate(notes, {length: 25, omission: '...'})}
                    {showTime ? ` at ${moment(time).format('hh:mm A')}` : ''}
                  </SheetDetailNotes>
                ) : null}
              </View>
            </SheetDetailInfo>
            <SheetDetailAmount type={type}>
              {GetCurrencySymbol(sheet.currency)}{' '}
              {type === 'expense' ? '-' : ''}
              {GetCurrencyLocalString(amount)}
            </SheetDetailAmount>
          </SheetDetailInfoContainer>
        </MenuTrigger>

        <MenuOptions
          optionsContainerStyle={{
            marginLeft: 10,
            marginTop: 0,
            borderRadius: 10,
            minWidth: 250,
          }}>
          <MenuOption
            customStyles={menuOptionStyles}
            onSelect={() =>
              onChangeSheetDetailType(sheet, transaction, () =>
                onGetSheetDetails(sheet, null),
              )
            }>
            <FlexRow justifyContent="space-between">
              <Text fontfamily="heading">
                Change type to {type === 'expense' ? 'income' : 'expense'}
              </Text>
              <Ionicons name="camera-reverse-outline" size={20} />
            </FlexRow>
          </MenuOption>

          <MenuOption
            customStyles={menuOptionStyles}
            onSelect={() =>
              navigation.navigate('MoveSheet', {
                sheetDetail: transaction,
                sheet,
              })
            }>
            <FlexRow justifyContent="space-between">
              <Text fontfamily="heading">Move {type}</Text>
              <Ionicons name="folder-outline" size={20} />
            </FlexRow>
          </MenuOption>

          <MenuOption
            customStyles={menuOptionStyles}
            onSelect={() =>
              onDuplicateSheetDetail(sheet, transaction, () =>
                onGetSheetDetails(sheet, null),
              )
            }>
            <FlexRow justifyContent="space-between">
              <Text fontfamily="heading">Duplicate {type}</Text>
              <Ionicons name="duplicate-outline" size={20} />
            </FlexRow>
          </MenuOption>

          <MenuOption customStyles={menuOptionStyles} onSelect={handleDelete}>
            <FlexRow justifyContent="space-between">
              <Text fontfamily="heading" color="red">
                Delete {type}
              </Text>
              <Ionicons name="trash-outline" size={20} color="red" />
            </FlexRow>
          </MenuOption>
        </MenuOptions>

        <Spacer size="medium" />
      </Menu>
    </Animated.View>
  );
};
