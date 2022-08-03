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
import {Alert, FlatList, TouchableOpacity, View} from 'react-native';
import _ from 'lodash';
import React, {useContext, useRef, useState} from 'react';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import Haptics from 'react-native-haptic-feedback';

import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {GetCurrencySymbol} from '../../../../components/symbol.currency';
moment.suppressDeprecationWarnings = true;

export const SheetDetailsInfo = ({
  date,
  sheetDetails,
  navigation,
  totalBalance,
  sheet,
}) => {
  const theme = useTheme();
  const {onDeleteSheetDetails, onDuplicateSheet, onChangeSheetType} =
    useContext(SheetsContext);

  const onPressEditButton = sheetDetail => {
    navigation.navigate('AddSheetDetail', {
      sheetDetail,
      edit: true,
      sheet: sheet,
    });
  };

  const onPressDeleteButton = sheetDetail => {
    return Alert.alert(
      'Confirm?',
      `Are you sure you want to delete this "${sheetDetail.type.toUpperCase()}" ? You won't be able to revert this back?`,
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
            onDeleteSheetDetails(sheet, sheetDetail, updatedSheet => {
              navigation.navigate('SheetDetails', {
                sheet: updatedSheet,
              });
            });
          },
        },
      ],
    );
  };

  const onDuplicateButton = sheetDetail => {
    onDuplicateSheet(sheet, sheetDetail, sheet => {
      navigation.navigate('SheetDetails', {sheet: sheet});
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
                lastWeek: 'DD MMM YYYY',
                sameElse: 'DD MMM YYYY',
              })}
            </SheetDetailDate>
            <SheetDetailDateAmount>
              <Text
                fontsize={'20px'}
                fontfamily="bodyMedium"
                color={theme.colors.brand.primary}>
                {GetCurrencySymbol(sheet.currency)}{' '}
                {totalBalance?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </SheetDetailDateAmount>
          </FlexRow>
          <Spacer size={'large'} />
          <FlatList
            data={sheetDetails}
            renderItem={({item: sd, index}) => {
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
                          Haptics.trigger('impactMedium', {
                            ignoreAndroidSystemSettings: true,
                          });
                        },
                        onPress: () => {
                          menuRefs.current[index].close();
                          onPressEditButton(sd);
                        },
                      },
                      TriggerTouchableComponent: TouchableOpacity,
                    }}>
                    <SheetDetailCategoryColor color={sd.category.color} />
                    <SheetDetailInfo>
                      <FlexRow justifyContent="space-between">
                        <SheetDetailCategory>
                          {sd.category.name}{' '}
                        </SheetDetailCategory>
                        <SheetDetailAmount type={sd.type}>
                          {sd.type === 'expense' && '-'}
                          {GetCurrencySymbol(sheet.currency)}{' '}
                          {sd.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </SheetDetailAmount>
                      </FlexRow>
                      <SheetDetailNotes>
                        {sd.notes}
                        {sd.showTime &&
                          ' at ' + moment(sd.time).format('hh:mm a')}
                      </SheetDetailNotes>
                    </SheetDetailInfo>
                  </MenuTrigger>

                  <MenuOptions
                    optionsContainerStyle={{
                      marginLeft: 10,
                      marginTop: 35,
                      borderRadius: 10,
                      minWidth: 250,
                    }}>
                    <MenuOption
                      customStyles={menuOptionStyles}
                      onSelect={() => {
                        menuRefs.current[index].close();
                        onChangeSheetType(sheet, sd, sheet => {
                          navigation.navigate('SheetDetails', {sheet: sheet});
                        });
                      }}>
                      <FlexRow justifyContent="space-between">
                        <Text color="#2f2f2f" fontfamily="heading">
                          Change type to{' '}
                          {sd.type === 'expense' ? 'income' : 'expense'}
                        </Text>
                        <Ionicons name="camera-reverse-outline" size={20} />
                      </FlexRow>
                    </MenuOption>

                    <MenuOption
                      customStyles={menuOptionStyles}
                      onSelect={() => {
                        menuRefs.current[index].close();
                        navigation.navigate('MoveSheet', {
                          sheet,
                          sheetDetail: sd,
                        });
                      }}>
                      <FlexRow justifyContent="space-between">
                        <Text color="#2f2f2f" fontfamily="heading">
                          Move {sd.type}
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
                          Duplicate {sd.type}
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
                          Delete {sd.type}
                        </Text>
                        <Ionicons name="trash-outline" size={20} color="red" />
                      </FlexRow>
                    </MenuOption>
                  </MenuOptions>
                  <Spacer size={'medium'} />
                </Menu>
              );
            }}
            keyExtractor={item => item.id}
          />
        </>
      )}
    </>
  );
};
