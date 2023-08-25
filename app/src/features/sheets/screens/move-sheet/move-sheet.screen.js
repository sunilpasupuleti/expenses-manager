/* eslint-disable react/no-unstable-nested-components */
import React, {useContext, useEffect, useState} from 'react';
import {View} from 'react-native';
import {Button, Card, Divider} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {FadeInView} from '../../../../components/animations/fade.animation';
import {
  ButtonText,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../../components/styles';
import {Text} from '../../../../components/typography/text.component';
import {SafeArea} from '../../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../../services/sheets/sheets.context';
import {SheetInfoCard} from '../../components/sheet-info/sheet-info-card.component';
import {SheetsList} from '../../components/sheets.styles';
export const MoveSheetScreen = ({navigation, route}) => {
  const [sheetDetail, setSheetDetail] = useState(null);
  const {sheets, onMoveSheetDetail, currentSheet} = useContext(SheetsContext);
  const [dupSheets, setDupSheets] = useState([]);
  const [moveToSheet, setMoveToSheet] = useState(null);
  const [editFromUpcomingScreen, setEditFromUpcomingScreen] = useState(false);
  const theme = useTheme();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => {
        return (
          <Button uppercase={false} onPress={() => navigation.goBack()}>
            <ButtonText>Cancel</ButtonText>
          </Button>
        );
      },
      headerRight: () => {
        // if (!dupSheets || dupSheets.length === 0) {
        return (
          <Button
            uppercase={false}
            disabled={!moveToSheet}
            onPress={() => onMove(moveToSheet, sheetDetail)}>
            <ButtonText disabled={!moveToSheet}>Done</ButtonText>
          </Button>
        );
        // } else {
        //   return null;
        // }
      },
      headerTitle: 'Move to account',
    });
  }, [navigation, moveToSheet, sheetDetail]);

  useEffect(() => {
    if (route.params && currentSheet && route.params.sheetDetail) {
      let {editFromUpcomingScreen: eus} = route.params;
      setEditFromUpcomingScreen(eus);
      setSheetDetail(route.params.sheetDetail);
    }
  }, [route.params]);

  useEffect(() => {
    if (sheets && currentSheet) {
      let filtered = sheets.filter(s => s.id !== currentSheet.id);
      setDupSheets(filtered);
    }
  }, [sheets, currentSheet]);

  const onMove = (moveToSheet, sheetDetail) => {
    onMoveSheetDetail(
      moveToSheet,
      sheetDetail,
      editFromUpcomingScreen,
      moveFromSheet => {
        navigation.navigate('Transactions');
      },
    );
  };

  return (
    <SafeArea>
      <MainWrapper>
        <Card
          theme={{roundness: 5}}
          style={{
            backgroundColor: theme.colors.bg.card,
            margin: 1,
          }}>
          {currentSheet && sheetDetail && (
            <FadeInView>
              <SheetsList
                data={dupSheets}
                renderItem={({item, index}) => {
                  return (
                    <TouchableHighlightWithColor
                      padding={'0px'}
                      onPress={() => setMoveToSheet(item)}>
                      <View
                        style={
                          moveToSheet &&
                          item.id === moveToSheet.id && {
                            backgroundColor: theme.colors.brand.secondary,
                          }
                        }>
                        <SheetInfoCard sheet={item} index={index} />
                      </View>
                    </TouchableHighlightWithColor>
                  );
                }}
                keyExtractor={item => item.id}
              />
            </FadeInView>
          )}
        </Card>
      </MainWrapper>

      {!dupSheets ||
        (dupSheets.length === 0 && (
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
            }}>
            {' '}
            There are no accounts to move.
          </Text>
        ))}
    </SafeArea>
  );
};
