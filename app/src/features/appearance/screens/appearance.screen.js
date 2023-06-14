import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useEffect} from 'react';
import {Platform, TouchableOpacity} from 'react-native';
import {Card, Divider} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {
  FlexRow,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {setTheme} from '../../../store/service-slice';
const modes = [
  {key: 'automatic', value: 'Automatic'},
  {key: 'dark', value: 'Dark'},
  {key: 'light', value: 'Light'},
];
export const AppearanceScreen = ({navigation}) => {
  const theme = useTheme();
  const appTheme = useSelector(state => state.service.theme);
  const dispatch = useDispatch();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FlexRow>
            <Ionicons
              name="chevron-back-outline"
              size={25}
              color={theme.colors.brand.primary}></Ionicons>
            <Text color={theme.colors.brand.primary}>Settings</Text>
          </FlexRow>
        </TouchableOpacity>
      ),
    });
  }, []);

  return (
    <SafeArea>
      <MainWrapper>
        <Card theme={{roundness: 5}}>
          {modes.map(m => {
            return (
              <TouchableHighlightWithColor
                key={m.key}
                onPress={() => {
                  dispatch(setTheme({theme: m.key}));
                }}>
                <Card.Content>
                  <FlexRow justifyContent="space-between">
                    <Text fontfamily="heading">{m.value}</Text>
                    {appTheme === m.key && (
                      <Ionicons
                        name="checkmark-outline"
                        size={25}
                        color={theme.colors.brand.primary}
                      />
                    )}
                  </FlexRow>
                </Card.Content>
              </TouchableHighlightWithColor>
            );
          })}
        </Card>
      </MainWrapper>
    </SafeArea>
  );
};
