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
import {SheetDetailsContext} from '../../../../services/sheetDetails/sheetDetails.context';
export const MoveSheetScreen = ({navigation, route}) => {
  const [sheetDetail, setSheetDetail] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [sheets, setSheets] = useState([]);

  const {onMoveSheetDetail} = useContext(SheetDetailsContext);
  const {getAllSheets} = useContext(SheetsContext);

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
            onPress={() => onMove()}>
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
    if (route.params && route.params.sheet && route.params.sheetDetail) {
      setSheetDetail(route.params.sheetDetail);
      setSheet(route.params.sheet);
    }
  }, [route.params]);

  useEffect(() => {
    if (sheet) {
      onGetAllSheets();
    }
  }, [sheet]);

  const onGetAllSheets = async () => {
    const sheetsData = await getAllSheets('', sheet.id);
    setSheets(sheetsData);
  };

  const onMove = () => {
    onMoveSheetDetail(sheet, moveToSheet, sheetDetail, () => {
      navigation.goBack();
    });
  };

  if (!sheet || !sheetDetail) return;
  return (
    <SafeArea child={true}>
      {sheets?.length > 0 && (
        <MainWrapper>
          <Card
            theme={{roundness: 5}}
            style={{
              backgroundColor: theme.colors.bg.card,
              margin: 1,
            }}>
            <FadeInView>
              <SheetsList
                data={sheets}
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
          </Card>
        </MainWrapper>
      )}
      {sheets?.length === 0 && (
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
          }}>
          {' '}
          There are no accounts to move.
        </Text>
      )}
    </SafeArea>
  );
};
