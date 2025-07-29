/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import { SwipeableView } from './sheet-info-card.styles';

import Ionicons from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import React, { useContext, useEffect, useState } from 'react';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Alert, SectionList, TouchableOpacity, View } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import Haptics from 'react-native-haptic-feedback';
import { useTheme } from 'styled-components/native';
import { Spacer } from '../../../../components/spacer/spacer.component';
import { SheetsContext } from '../../../../services/sheets/sheets.context';
import { SheetInfoCard } from './sheet-info-card.component';
import { Text } from '../../../../components/typography/text.component';
import _ from 'lodash';
import {
  FlexRow,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
import Animated, { FadeInRight } from 'react-native-reanimated';

export const SheetsInfo = ({
  navigation,
  pinnedSheets,
  archivedSheets,
  regularSheets,
  loanSheets,
}) => {
  const { onDeleteSheet, onArchiveSheet, onPinSheet } =
    useContext(SheetsContext);
  const theme = useTheme();
  const [showArchived, setShowArchived] = useState(false);
  const [showPinned, setShowPinned] = useState(true);
  const [showAccounts, setShowAccounts] = useState(true);
  const [showLoanAccounts, setShowLoanAccounts] = useState(true);
  const { showActionSheetWithOptions } = useActionSheet();

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
    let icons = [
      <Ionicons name="close-outline" size={25} color="#aaa" />,
      <Ionicons name="create-outline" size={25} color="#aaa" />,

      <Ionicons name="trash-outline" color="#aaa" size={25} />,
    ];
    let options = ['Cancel', 'Edit ', 'Delete '];
    if (!sheet.isLoanAccount) {
      options.splice(
        2,
        0,
        sheet.pinned ? 'Unpin' : 'Pin',
        sheet.archived ? 'Unarchive' : 'Archive',
      );
      icons.splice(
        2,
        0,
        <MaterialCommunityIcons
          color="#aaa"
          name={sheet.pinned ? 'pin-off-outline' : 'pin-outline'}
          size={25}
        />,
        <EvilIcons name="archive" color="#aaa" size={30} />,
      );
    }
    showActionSheetWithOptions(
      {
        options: options,
        cancelButtonIndex: 0,
        destructiveButtonIndex: 4,
        showSeparators: true,

        message: 'Select an action to perform',
        icons: icons,
      },
      buttonIndex => {
        const isLoanAccount = sheet.isLoanAccount;

        if (buttonIndex === 0) {
          // cancel button
        } else if (buttonIndex === 1) {
          onPressEditButton(sheet);
        } else if (buttonIndex === 2) {
          isLoanAccount ? onPressDeleteButton(sheet) : onPressPinButton(sheet);
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
            onDeleteSheet(sheet, sheet._raw);
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
    onArchiveSheet(sheet, sheet._raw);
  };

  const onPressPinButton = sheet => {
    onPinSheet(sheet, sheet._raw);
  };

  const rightSwipeActions = (progress, dragX, sheet) => {
    return (
      <>
        <TouchableOpacity onPress={() => onPressDeleteButton(sheet)}>
          <SwipeableView style={{ backgroundColor: '#fe3c30' }}>
            <Ionicons name="trash-outline" color={'#fff'} size={25} />
          </SwipeableView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onPressEditButton(sheet)}>
          <SwipeableView style={{ backgroundColor: '#babac1' }}>
            <Ionicons name="create-outline" color={'#fff'} size={25} />
          </SwipeableView>
        </TouchableOpacity>
      </>
    );
  };

  const leftSwipeActions = (progress, dragX, sheet) => {
    return !sheet.isLoanAccount ? (
      <>
        <TouchableOpacity onPress={() => onPressArchiveButton(sheet)}>
          <SwipeableView style={{ backgroundColor: '#babac1' }}>
            {sheet.archived ? (
              <MaterialIcons name="unarchive" color={'#fff'} size={30} />
            ) : (
              <EvilIcons name="archive" color={'#fff'} size={30} />
            )}
          </SwipeableView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onPressPinButton(sheet)}>
          <SwipeableView style={{ backgroundColor: '#ed9938' }}>
            <MaterialCommunityIcons
              name={sheet.pinned ? 'pin-off-outline' : 'pin-outline'}
              color={'#fff'}
              size={25}
            />
          </SwipeableView>
        </TouchableOpacity>
      </>
    ) : null;
  };

  const onClickSheet = sheet => {
    navigation.navigate('SheetDetailsHome', {
      screen: 'Transactions',
      sheet: sheet,
    });
  };

  return (
    <SectionList
      scrollEnabled={false}
      style={{
        marginBottom: 100,
      }}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      sections={[
        {
          title: `Pinned (${pinnedSheets.length})`,
          data: showPinned ? pinnedSheets : [],
          key: 'pinned',
          visible: pinnedSheets.length > 0,
          toggle: () => setShowPinned(!showPinned),
        },
        {
          title: `Accounts (${regularSheets.length})`,
          data: showAccounts ? regularSheets : [],
          key: 'regular',
          visible: regularSheets.length > 0,
          toggle: () => setShowAccounts(!showAccounts),
        },
        {
          title: `Loan Accounts (${loanSheets.length})`,
          data: showLoanAccounts ? loanSheets : [],
          key: 'loan',
          visible: loanSheets.length > 0,
          toggle: () => setShowLoanAccounts(!showLoanAccounts),
        },
        {
          title: `Archived (${archivedSheets.length})`,
          data: showArchived ? archivedSheets : [],
          key: 'archived',
          visible: archivedSheets.length > 0,
          toggle: () => setShowArchived(!showArchived),
        },
      ].filter(section => section.visible)}
      keyExtractor={(item, index) => item.id || index.toString()}
      renderSectionHeader={({ section }) => (
        <Spacer size="large">
          <FlexRow justifyContent="space-between" style={{ marginBottom: 10 }}>
            <Text fontfamily="bodyMedium">{section.title}</Text>
            <Ionicons
              onPress={section.toggle}
              name={
                {
                  pinned: showPinned,
                  regular: showAccounts,
                  loan: showLoanAccounts,
                  archived: showArchived,
                }[section.key]
                  ? 'chevron-up-outline'
                  : 'chevron-down-outline'
              }
              size={25}
              color={theme.colors.brand.primary}
            />
          </FlexRow>
        </Spacer>
      )}
      renderItem={({ item, index, section }) => (
        <Animated.View
          key={item.id || index}
          entering={FadeInRight.delay(index * 70).springify()}
        >
          <Swipeable
            renderRightActions={({ progress, dragX }) =>
              rightSwipeActions(progress, dragX, item)
            }
            renderLeftActions={({ progress, dragX }) =>
              leftSwipeActions(progress, dragX, item)
            }
            friction={2}
            ref={ref => {
              if (ref && !swipeableRefs.get(item.id)) {
                swipeableRefs.set(item.id, ref);
              }
            }}
            onSwipeableWillOpen={() => {
              [...swipeableRefs.entries()].forEach(([key, ref]) => {
                if (key !== item.id && ref) ref.close();
              });
            }}
          >
            <TouchableHighlightWithColor
              style={{
                backgroundColor: theme.colors.bg.card,
                borderTopLeftRadius:
                  index === 0 &&
                  (section.data.length === 1 || section.data.length > 1)
                    ? 15
                    : 0,
                borderTopRightRadius:
                  index === 0 &&
                  (section.data.length === 1 || section.data.length > 1)
                    ? 15
                    : 0,
                borderBottomLeftRadius:
                  (index === 0 && section.data.length === 1) ||
                  (section.data.length - 1 === index && section.data.length > 0)
                    ? 15
                    : 0,
                borderBottomRightRadius:
                  (index === 0 && section.data.length === 1) ||
                  (section.data.length - 1 === index && section.data.length > 0)
                    ? 15
                    : 0,
                // borderTopLeftRadius:
                //   section.data.length - 1 === index && section.data.length > 1
                //     ? 12
                //     : 12,
              }}
              onLongPress={() => onLongPressActions(item)}
              padding={'0px'}
              onPress={() => onClickSheet(item)}
            >
              <SheetInfoCard
                sheet={item}
                index={index}
                currentLength={section.data.length}
              />
            </TouchableHighlightWithColor>
          </Swipeable>
        </Animated.View>
      )}
    />
  );
};
