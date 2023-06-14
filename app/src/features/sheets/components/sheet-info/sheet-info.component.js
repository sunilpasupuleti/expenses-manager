import {Swipeable, TouchableOpacity} from 'react-native-gesture-handler';
import {SwipeableView} from './sheet-info-card.styles';

import Ionicons from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import React, {useContext, useEffect, useState} from 'react';
import {Card} from 'react-native-paper';

import {Alert, Platform, ScrollView, View} from 'react-native';
import {useActionSheet} from '@expo/react-native-action-sheet';
import Haptics from 'react-native-haptic-feedback';
import {useTheme} from 'styled-components/native';
import {FadeInView} from '../../../../components/animations/fade.animation';
import {Spacer} from '../../../../components/spacer/spacer.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {SheetInfoCard} from './sheet-info-card.component';
import {Text} from '../../../../components/typography/text.component';
import {NoSheets, SheetsList} from '../sheets.styles';
import {
  FlexRow,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
export const SheetsInfo = ({navigation, searchKeyword}) => {
  const {sheets, onDeleteSheet, onArchiveSheet, onPinSheet} =
    useContext(SheetsContext);
  const theme = useTheme();
  const [dupSheets, setDupSheets] = useState(null);

  const [showArchived, setShowArchived] = useState(false);
  const [showPinned, setShowPinned] = useState(true);

  const [pinnedSheets, setPinnedSheets] = useState([null]);
  const [archivedSheets, setArchivedSheets] = useState(null);

  useEffect(() => {
    if (sheets) {
      onGroupSheets(sheets);
    }
  }, [sheets]);

  useEffect(() => {
    onGroupSheets(sheets);
    if (searchKeyword !== '') {
      let filtered = sheets.filter(s => {
        return s.name
          .toLowerCase()
          .includes(searchKeyword.trim().toLowerCase());
      });
      onGroupSheets(filtered);
    }
  }, [searchKeyword]);

  const onGroupSheets = sheets => {
    let pinned = sheets.filter(s => s.pinned);
    let archived = sheets.filter(s => s.archived);
    let normalSheets = sheets.filter(s => !s.pinned && !s.archived);

    setPinnedSheets(pinned);
    setDupSheets(normalSheets);
    setArchivedSheets(archived);
  };

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
          onPinSheet(sheet);
        } else if (buttonIndex === 3) {
          onArchiveSheet(sheet);
        } else if (buttonIndex === 4) {
          onPressDeleteButton(sheet);
        }
      },
    );
  };

  const onPressDeleteButton = sheet => {
    return Alert.alert(
      'Confirm?',
      `Are you sure you want to delete "${sheet.name.toUpperCase()}" account? You won't be able to revert this back?`,
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
            onDeleteSheet(sheet);
          },
        },
      ],
    );
  };
  const onPressEditButton = sheet => {
    navigation.navigate('AddSheet', {
      sheet,
      edit: true,
      callback: (sheet = null) => navigation.goBack(),
    });
    onCloseSwipebles();
  };

  const rightSwipeActions = (progress, dragX, sheet) => {
    return (
      <>
        <TouchableOpacity onPress={() => onPressDeleteButton(sheet)}>
          <SwipeableView style={{backgroundColor: '#fe3c30'}}>
            <Ionicons name="trash-outline" color={'#fff'} size={25} />
          </SwipeableView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onArchiveSheet(sheet)}>
          <SwipeableView style={{backgroundColor: '#babac1'}}>
            <EvilIcons name="archive" color={'#fff'} size={30} />
          </SwipeableView>
        </TouchableOpacity>
      </>
    );
  };

  const leftSwipeActions = (progress, dragX, sheet) => {
    return (
      <>
        <TouchableOpacity onPress={() => onPressEditButton(sheet)}>
          <SwipeableView style={{backgroundColor: '#babac1'}}>
            <Ionicons name="create-outline" color={'#fff'} size={25} />
          </SwipeableView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onPinSheet(sheet)}>
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

  return (
    <>
      {sheets && sheets.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 1,
          }}>
          <View style={{marginBottom: 20}}>
            {/* for pinned */}
            {pinnedSheets && pinnedSheets.length > 0 && (
              <Spacer size={'xlarge'}>
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
                                  onLongPress={() => onLongPressActions(item)}
                                  padding={'0px'}
                                  onPress={
                                    () =>
                                      navigation.navigate('SheetDetailsHome', {
                                        sheet: item,
                                      })

                                    // navigation.navigate('SheetDetails', {
                                    //   sheet: item,
                                    // })
                                  }>
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
            {dupSheets && dupSheets.length > 0 ? (
              <Spacer size="xlarge">
                {dupSheets.length > 0 &&
                (sheets.filter(s => s.pinned).length > 0 ||
                  sheets.filter(s => s.archived).length > 0) ? (
                  <Spacer position={'bottom'} size="medium">
                    <Text fontfamily="bodyMedium">
                      Accounts ({dupSheets?.length})
                    </Text>
                  </Spacer>
                ) : null}
                <Card theme={{roundness: 5}}>
                  <FadeInView>
                    {dupSheets.map((item, index) => {
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
                            onLongPress={() => onLongPressActions(item)}
                            padding={'0px'}
                            onPress={
                              () =>
                                navigation.navigate('SheetDetailsHome', {
                                  sheet: item,
                                })
                              // navigation.navigate('SheetDetails', {
                              //   sheet: item,
                              // })
                            }>
                            <SheetInfoCard
                              sheet={item}
                              index={index}
                              currentLength={dupSheets.length}
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
            {archivedSheets && archivedSheets.length > 0 && (
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
                  <Card theme={{roundness: 5}}>
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
                              onLongPress={() => onLongPressActions(item)}
                              padding={'0px'}
                              onPress={
                                () =>
                                  navigation.navigate('SheetDetailsHome', {
                                    sheet: item,
                                  })
                                // navigation.navigate('SheetDetails', {
                                //   sheet: item,
                                // })
                              }>
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
