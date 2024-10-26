import {Text} from '../../../../components/typography/text.component';
import moment from 'moment';
import {
  SheetDetailAmount,
  SheetDetailCategory,
  SheetDetailCategoryColor,
  SheetDetailDate,
  SheetDetailDateAmount,
  SheetDetailInfo,
  SheetDetailNotes,
} from './sheet-details.styles';
import {FlexRow} from '../../../../components/styles';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {Alert, FlatList, TouchableOpacity} from 'react-native';
import React, {useContext, useRef} from 'react';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import _ from 'lodash';

import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  GetCurrencyLocalString,
  GetCurrencySymbol,
} from '../../../../components/symbol.currency';
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
moment.suppressDeprecationWarnings = true;

export const SheetDetailsInfo = ({
  date,
  sheetDetails,
  navigation,
  sheet,
  totalBalance,
  editFromUpcomingScreen = false,
  onGetSheetDetails,
  analyticsScreenReportKey,
}) => {
  const theme = useTheme();

  const {onDeleteSheetDetail, onDuplicateSheetDetail, onChangeSheetDetailType} =
    useContext(SheetDetailsContext);

  const onPressEditButton = sheetDetail => {
    navigation.navigate('AddSheetDetail', {
      sheetDetail,
      edit: true,
      editFromUpcomingScreen: editFromUpcomingScreen,
    });
  };

  const onPressDeleteButton = sheetDetail => {
    return Alert.alert(
      'Confirm?',
      `Are you sure you want to delete this "${_.toUpper(
        sheetDetail.type,
      )}" ? You won't be able to revert this back?`,
      [
        // No buton to dismiss the alert
        {
          text: 'Cancel',
          onPress: () => {
            // onCloseSwipebles();
          },
        },
        //yes button
        {
          text: 'Delete',
          onPress: () => {
            onDeleteSheetDetail(sheet, sheetDetail, () => {
              onGetSheetDetails(sheet, null, analyticsScreenReportKey);
            });
          },
        },
      ],
    );
  };

  const onDuplicateButton = sheetDetail => {
    onDuplicateSheetDetail(sheet, sheetDetail, () => {
      onGetSheetDetails(sheet, null, analyticsScreenReportKey);
    });
  };

  const onPressChangeSheetType = sheetDetail => {
    onChangeSheetDetailType(sheet, sheetDetail, () => {
      onGetSheetDetails(sheet, null, analyticsScreenReportKey);
    });
  };

  const menuOptionStyles = {
    optionWrapper: {padding: 15, paddingTop: 10},
    OptionTouchableComponent: TouchableOpacity,
  };

  let menuRefs = useRef(new Array(false));
  return (
    <>
      {sheetDetails && (
        <>
          <FlexRow
            justifyContent="space-between"
            style={{paddingLeft: 16, paddingRight: 16}}>
            <SheetDetailDate>
              {moment(date).calendar(null, {
                lastDay: '[Yesterday]',
                sameDay: '[Today]',
                nextDay: '[Tommorow]',
                lastWeek: 'DD MMM YYYY',
                nextWeek: 'DD MMM YYYY',
                sameElse: 'DD MMM YYYY',
              })}
            </SheetDetailDate>
            <SheetDetailDateAmount>
              <Text
                fontsize={'20px'}
                fontfamily="bodyMedium"
                color={theme.colors.brand.primary}>
                {GetCurrencySymbol(sheet.currency)}{' '}
                {GetCurrencyLocalString(totalBalance)}
              </Text>
            </SheetDetailDateAmount>
          </FlexRow>
          <Spacer size={'large'} />

          <FlatList
            data={sheetDetails}
            renderItem={({item: sd, index}) => {
              let {
                category = {icon: null, name: null},
                type,
                amount,
                notes,
                showTime,
                time,
                id,
              } = sd;

              // console.log(id, amount, '--', totalBalance);
              let {icon, color, name: categoryName} = category;
              return (
                <Menu
                  onBackdropPress={() => menuRefs.current[index].close()}
                  ref={element => (menuRefs.current[index] = element)}>
                  <MenuTrigger
                    customStyles={{
                      triggerTouchable: {
                        underlayColor: '#eee',
                        onLongPress: () => {
                          menuRefs.current[index].open();
                          // Haptics.trigger('impactMedium', {
                          //   ignoreAndroidSystemSettings: true,
                          // });
                        },
                        onPress: () => {
                          menuRefs.current[index].close();
                          onPressEditButton(sd);
                        },
                      },
                      TriggerTouchableComponent: TouchableOpacity,
                    }}>
                    <SheetDetailCategoryColor color={color}>
                      {icon && (
                        <MaterialCommunityIcon
                          name={icon}
                          size={16}
                          color="#fff"
                        />
                      )}
                    </SheetDetailCategoryColor>
                    <SheetDetailInfo>
                      <FlexRow justifyContent="space-between">
                        <SheetDetailCategory>
                          {categoryName}{' '}
                        </SheetDetailCategory>
                        <SheetDetailAmount type={type}>
                          {type === 'expense' && '-'}
                          {GetCurrencySymbol(sheet.currency)}{' '}
                          {GetCurrencyLocalString(amount)}
                        </SheetDetailAmount>
                      </FlexRow>
                      <SheetDetailNotes>
                        {notes}
                        {showTime
                          ? ' at ' + moment(time).format('hh:mm A')
                          : null}
                      </SheetDetailNotes>
                    </SheetDetailInfo>
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
                      onSelect={() => {
                        menuRefs.current[index].close();
                        onPressChangeSheetType(sd);
                      }}>
                      <FlexRow justifyContent="space-between">
                        <Text color="#2f2f2f" fontfamily="heading">
                          Change type to{' '}
                          {type === 'expense' ? 'income' : 'expense'}
                        </Text>
                        <Ionicons name="camera-reverse-outline" size={20} />
                      </FlexRow>
                    </MenuOption>

                    <MenuOption
                      customStyles={menuOptionStyles}
                      onSelect={() => {
                        menuRefs.current[index].close();
                        navigation.navigate('MoveSheet', {
                          sheetDetail: sd,
                          sheet: sheet,
                        });
                      }}>
                      <FlexRow justifyContent="space-between">
                        <Text color="#2f2f2f" fontfamily="heading">
                          Move {type}
                        </Text>
                        <Ionicons name="folder-outline" size={20} />
                      </FlexRow>
                    </MenuOption>

                    <MenuOption
                      customStyles={menuOptionStyles}
                      onSelect={() => {
                        menuRefs.current[index].close();
                        onDuplicateButton(sd);
                      }}>
                      <FlexRow justifyContent="space-between">
                        <Text color="#2f2f2f" fontfamily="heading">
                          Duplicate {type}
                        </Text>
                        <Ionicons name="duplicate-outline" size={20} />
                      </FlexRow>
                    </MenuOption>

                    <MenuOption
                      customStyles={menuOptionStyles}
                      onSelect={() => {
                        menuRefs.current[index].close();
                        onPressDeleteButton(sd);
                      }}>
                      <FlexRow justifyContent="space-between">
                        <Text color="red" fontfamily="heading">
                          Delete {type}
                        </Text>
                        <Ionicons name="trash-outline" size={20} color="red" />
                      </FlexRow>
                    </MenuOption>
                  </MenuOptions>
                  <Spacer size={'medium'} />
                </Menu>
              );
            }}
            keyExtractor={item => item.id + Math.random()}
          />
        </>
      )}
    </>
  );
};
