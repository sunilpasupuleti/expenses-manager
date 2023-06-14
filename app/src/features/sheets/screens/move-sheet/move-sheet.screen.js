import React, {useContext, useEffect, useState} from 'react';
import {View} from 'react-native';
import {Button, Card} from 'react-native-paper';
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
import {Platform} from 'react-native';
export const MoveSheetScreen = ({navigation, route}) => {
  const [sheet, setSheet] = useState(null);
  const [sheetDetail, setSheetDetail] = useState(null);
  const {sheets, onMoveSheets} = useContext(SheetsContext);
  const [dupSheets, setDupSheets] = useState([]);

  const [moveToSheet, setMoveToSheet] = useState(null);
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
            onPress={() => onMove(sheet, moveToSheet, sheetDetail)}>
            <ButtonText disabled={!moveToSheet}>Done</ButtonText>
          </Button>
        );
        // } else {
        //   return null;
        // }
      },
      headerTitle: 'Move to account',
    });
  }, [navigation, sheet, moveToSheet, sheetDetail]);

  useEffect(() => {
    if (route.params.sheet && route.params.sheetDetail) {
      setSheet(route.params.sheet);
      setSheetDetail(route.params.sheetDetail);
    }
  }, [route.params]);

  useEffect(() => {
    if (sheets && sheet) {
      let filtered = sheets.filter(s => s.id !== sheet.id);
      setDupSheets(filtered);
    }
  }, [sheets, sheet]);

  const onMove = (sheet, moveToSheet, sheetDetail) => {
    onMoveSheets(sheet, moveToSheet, sheetDetail, moveFromSheet => {
      navigation.navigate('SheetDetailsHome', {
        screen: 'Transactions',
        sheet: moveFromSheet,
      });
      // navigation.navigate('SheetDetails', {sheet: moveFromSheet});
    });
  };

  return (
    <SafeArea>
      <MainWrapper>
        <Card theme={{roundness: 5}}>
          {sheet && sheetDetail && (
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
