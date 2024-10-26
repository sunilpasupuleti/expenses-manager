/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import {Swipeable, TouchableOpacity} from 'react-native-gesture-handler';
import {SwipeableView} from './sheet-info-card.styles';

import Ionicons from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import React, {useContext, useEffect, useState} from 'react';
import {Avatar, Card} from 'react-native-paper';

import {Alert, Platform, ScrollView, View} from 'react-native';
import {useActionSheet} from '@expo/react-native-action-sheet';
import Haptics from 'react-native-haptic-feedback';
import {useTheme} from 'styled-components/native';
import {FadeInView} from '../../../../components/animations/fade.animation';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {SheetInfoCard} from './sheet-info-card.component';
import {Text} from '../../../../components/typography/text.component';
import {NoSheets} from '../sheets.styles';
import _ from 'lodash';
import {
  FlexRow,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
export const SheetsInfo = ({
  navigation,
  pinnedSheets,
  archivedSheets,
  regularSheets,
  onGetSheets,
  totalCount,
}) => {
  const {onDeleteSheet, onArchiveSheet, onPinSheet, setCurrentSheet} =
    useContext(SheetsContext);
  const theme = useTheme();
  const [showArchived, setShowArchived] = useState(false);
  const [showPinned, setShowPinned] = useState(true);

  const {showActionSheetWithOptions} = useActionSheet();

  let swipeableRefs = new Map();

  const onCloseSwipebles = () => {
    [...swipeableRefs.entries()].forEach(([key, ref]) => {
      ref.close();
    });
  };

  const onLongPressActions = sheet => {
    Haptics.trigger('impactMedium', {
      ignoreAndroidSystemSettings: true,
    });
    showActionSheetWithOptions(
      {
        options: [
          'Cancel',
          'Edit ',
          sheet.pinned ? 'Unpin' : 'Pin',
          sheet.archived ? 'Unarchive' : 'Archive',
          'Delete ',
        ],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 4,
        showSeparators: true,

        message: 'Select an action to perform',
        icons: [
          <Ionicons name="close-outline" size={25} color="#aaa" />,
          <Ionicons name="create-outline" size={25} color="#aaa" />,
          <MaterialCommunityIcons
            color="#aaa"
            name={sheet.pinned ? 'pin-off-outline' : 'pin-outline'}
            size={25}
          />,
          <EvilIcons name="archive" color="#aaa" size={30} />,
          <Ionicons name="trash-outline" color="#aaa" size={25} />,
        ],
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          // cancel button
        } else if (buttonIndex === 1) {
          onPressEditButton(sheet);
        } else if (buttonIndex === 2) {
          onPressPinButton(sheet);
        } else if (buttonIndex === 3) {
          onPressArchiveButton(sheet);
        } else if (buttonIndex === 4) {
          onPressDeleteButton(sheet);
        }
      },
    );
  };

  const onPressDeleteButton = sheet => {
    return Alert.alert(
      'Confirm?',
      `Are you sure you want to delete "${_.toUpper(
        sheet.name,
      )}" account? You won't be able to revert this back?`,
      [
        // No buton to dismiss the alert
        {
          text: 'Cancel',
          onPress: () => {
            onCloseSwipebles();
          },
        },
        //yes button
        {
          text: 'Delete',
          onPress: () => {
            onDeleteSheet(sheet, onGetSheets);
          },
        },
      ],
    );
  };
  const onPressEditButton = sheet => {
    navigation.navigate('AddSheet', {
      sheet,
      edit: true,
    });
    onCloseSwipebles();
  };

  const onPressArchiveButton = sheet => {
    onArchiveSheet(sheet, onGetSheets);
  };

  const onPressPinButton = sheet => {
    onPinSheet(sheet, onGetSheets);
  };

  const rightSwipeActions = (progress, dragX, sheet) => {
    return (
      <>
        <TouchableOpacity onPress={() => onPressDeleteButton(sheet)}>
          <SwipeableView style={{backgroundColor: '#fe3c30'}}>
            <Ionicons name="trash-outline" color={'#fff'} size={25} />
          </SwipeableView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onPressEditButton(sheet)}>
          <SwipeableView style={{backgroundColor: '#babac1'}}>
            <Ionicons name="create-outline" color={'#fff'} size={25} />
          </SwipeableView>
        </TouchableOpacity>
      </>
    );
  };

  const leftSwipeActions = (progress, dragX, sheet) => {
    return (
      <>
        <TouchableOpacity onPress={() => onPressArchiveButton(sheet)}>
          <SwipeableView style={{backgroundColor: '#babac1'}}>
            {sheet.archived ? (
              <MaterialIcons name="unarchive" color={'#fff'} size={30} />
            ) : (
              <EvilIcons name="archive" color={'#fff'} size={30} />
            )}
          </SwipeableView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onPressPinButton(sheet)}>
          <SwipeableView style={{backgroundColor: '#ed9938'}}>
            <MaterialCommunityIcons
              name={sheet.pinned ? 'pin-off-outline' : 'pin-outline'}
              color={'#fff'}
              size={25}
            />
          </SwipeableView>
        </TouchableOpacity>
      </>
    );
  };

  const onClickSheet = sheet => {
    setCurrentSheet(sheet);
    navigation.navigate('SheetDetailsHome', {
      screen: 'Transactions',
    });
  };

  return (
    <>
      {totalCount > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{}}>
          <View style={{marginBottom: 120}}>
            <Spacer size="large" />

            {/* for pinned */}
            {pinnedSheets.length > 0 && (
              <Spacer size={'medium'}>
                <FlexRow justifyContent="space-between">
                  <Text fontfamily="bodyMedium">
                    Pinned ({pinnedSheets.length})
                  </Text>
                  <Ionicons
                    onPress={() => {
                      Haptics.trigger('impactMedium', {
                        ignoreAndroidSystemSettings: true,
                      });
                      setShowPinned(!showPinned);
                    }}
                    color={theme.colors.brand.primary}
                    name={
                      showPinned
                        ? 'chevron-down-outline'
                        : 'chevron-forward-outline'
                    }
                    size={25}
                  />
                </FlexRow>
                {showPinned && (
                  <Spacer size={'medium'}>
                    <Card
                      theme={{
                        roundness: 5,
                      }}
                      style={{
                        backgroundColor: theme.colors.bg.card,
                        margin: 1,
                      }}>
                      <FadeInView>
                        {pinnedSheets.map((item, index) => {
                          if (item)
                            return (
                              <Swipeable
                                key={item.id}
                                renderRightActions={({progress, dragX}) =>
                                  rightSwipeActions(progress, dragX, item)
                                }
                                renderLeftActions={({progress, dragX}) =>
                                  leftSwipeActions(progress, dragX, item)
                                }
                                friction={2}
                                ref={ref => {
                                  if (ref && !swipeableRefs.get(item.id)) {
                                    swipeableRefs.set(item.id, ref);
                                  }
                                }}
                                onSwipeableWillOpen={() => {
                                  [...swipeableRefs.entries()].forEach(
                                    ([key, ref]) => {
                                      if (key !== item.id && ref) ref.close();
                                    },
                                  );
                                }}>
                                <TouchableHighlightWithColor
                                  style={{
                                    backgroundColor: theme.colors.bg.card,
                                    borderRadius: 10,
                                  }}
                                  onLongPress={() => onLongPressActions(item)}
                                  padding={'0px'}
                                  onPress={() => onClickSheet(item)}>
                                  <SheetInfoCard
                                    sheet={item}
                                    currentLength={pinnedSheets.length}
                                    index={index}
                                  />
                                </TouchableHighlightWithColor>
                              </Swipeable>
                            );
                        })}
                      </FadeInView>
                    </Card>
                  </Spacer>
                )}
              </Spacer>
            )}

            {/* normal sheets */}
            {regularSheets.length > 0 ? (
              <Spacer size={pinnedSheets.length > 0 ? 'xlarge' : 'small'}>
                <Spacer position={'bottom'} size="medium">
                  <Text fontfamily="bodyMedium">
                    Accounts ({regularSheets?.length})
                  </Text>
                </Spacer>
                <Card
                  theme={{roundness: 5}}
                  style={{
                    backgroundColor: theme.colors.bg.card,
                    margin: 1,
                  }}>
                  <FadeInView>
                    {regularSheets.map((item, index) => {
                      return (
                        <Swipeable
                          key={item.id}
                          renderRightActions={({progress, dragX}) =>
                            rightSwipeActions(progress, dragX, item)
                          }
                          renderLeftActions={({progress, dragX}) =>
                            leftSwipeActions(progress, dragX, item)
                          }
                          friction={2}
                          ref={ref => {
                            if (ref && !swipeableRefs.get(item.id)) {
                              swipeableRefs.set(item.id, ref);
                            }
                          }}
                          onSwipeableWillOpen={() => {
                            [...swipeableRefs.entries()].forEach(
                              ([key, ref]) => {
                                if (key !== item.id && ref) ref.close();
                              },
                            );
                          }}>
                          <TouchableHighlightWithColor
                            style={{
                              backgroundColor: theme.colors.bg.card,
                              borderRadius: 10,
                            }}
                            onLongPress={() => onLongPressActions(item)}
                            padding={'0px'}
                            onPress={() => onClickSheet(item)}>
                            <SheetInfoCard
                              sheet={item}
                              index={index}
                              currentLength={regularSheets.length}
                            />
                          </TouchableHighlightWithColor>
                        </Swipeable>
                      );
                    })}
                  </FadeInView>
                </Card>
              </Spacer>
            ) : null}

            {/* for archived */}
            {archivedSheets.length > 0 && (
              <Spacer size={'xlarge'}>
                <FlexRow justifyContent="space-between">
                  <Text fontfamily="bodyMedium">
                    Archived ({archivedSheets.length})
                  </Text>
                  <Ionicons
                    onPress={() => {
                      Haptics.trigger('impactMedium', {
                        ignoreAndroidSystemSettings: true,
                      });
                      setShowArchived(!showArchived);
                    }}
                    color={theme.colors.brand.primary}
                    name={
                      showArchived
                        ? 'chevron-down-outline'
                        : 'chevron-forward-outline'
                    }
                    size={25}
                  />
                </FlexRow>
                <Spacer size={'medium'} />
                {showArchived && (
                  <Card
                    theme={{roundness: 5}}
                    style={{
                      backgroundColor: theme.colors.bg.card,
                      margin: 1,
                    }}>
                    <FadeInView>
                      {archivedSheets.map((item, index) => {
                        return (
                          <Swipeable
                            key={item.id}
                            renderRightActions={({progress, dragX}) =>
                              rightSwipeActions(progress, dragX, item)
                            }
                            renderLeftActions={({progress, dragX}) =>
                              leftSwipeActions(progress, dragX, item)
                            }
                            friction={2}
                            ref={ref => {
                              if (ref && !swipeableRefs.get(item.id)) {
                                swipeableRefs.set(item.id, ref);
                              }
                            }}
                            onSwipeableWillOpen={() => {
                              [...swipeableRefs.entries()].forEach(
                                ([key, ref]) => {
                                  if (key !== item.id && ref) ref.close();
                                },
                              );
                            }}>
                            <TouchableHighlightWithColor
                              style={{
                                backgroundColor: theme.colors.bg.card,
                                borderRadius: 10,
                              }}
                              onLongPress={() => onLongPressActions(item)}
                              padding={'0px'}
                              onPress={() => onClickSheet(item)}>
                              <SheetInfoCard
                                sheet={item}
                                currentLength={archivedSheets.length}
                                index={index}
                              />
                            </TouchableHighlightWithColor>
                          </Swipeable>
                        );
                      })}
                    </FadeInView>
                  </Card>
                )}
              </Spacer>
            )}
          </View>
        </ScrollView>
      ) : (
        <NoSheets>
          <Text style={{textAlign: 'center'}}>
            There are no accounts yet. Create a new account by clicking on plus
            icon.
          </Text>
        </NoSheets>
      )}
    </>
  );
};
