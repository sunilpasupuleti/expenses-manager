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
  const {getAllSheets, currentSheet} = useContext(SheetsContext);
  const {onMoveSheetDetail} = useContext(SheetDetailsContext);
  const [data, setData] = useState({
    totalCount: 0,
    sheets: [],
  });
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
    if (route.params && currentSheet && route.params.sheetDetail) {
      setSheetDetail(route.params.sheetDetail);
      onGetSheets();
    }
  }, [route.params]);

  const onGetSheets = async () => {
    let result = await getAllSheets(null, currentSheet.id);
    if (result) {
      setData(result);
    }
  };

  const onMove = () => {
    onMoveSheetDetail(moveToSheet, sheetDetail, () => {
      navigation.goBack();
    });
  };

  return (
    <SafeArea child={true}>
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
                data={data.sheets}
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

      {data.totalCount === 0 && (
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
