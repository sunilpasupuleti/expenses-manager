/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';

import React, {useContext, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {useTheme} from 'styled-components/native';
import {SheetsInfo} from '../components/sheet-info/sheet-info.component';
import {
  AddSheetIcon,
  IconsContainer,
  NewSheet,
  UpperIcon,
} from '../components/sheets.styles';
import {Spacer} from '../../../components/spacer/spacer.component';
import {Input, MainWrapper} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';

export const SheetsScreen = ({navigation}) => {
  const theme = useTheme();
  const {sheets} = useContext(SheetsContext);
  const [searchKeyword, setSearchKeyword] = useState('');

  return (
    <SafeArea main={false}>
      <MainWrapper>
        <IconsContainer>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings', {screen: 'Sync'})}>
            <UpperIcon
              name="cloud-offline-outline"
              size={25}
              color={theme.colors.brand.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <UpperIcon
              name="cog-outline"
              size={30}
              color={theme.colors.brand.primary}
            />
          </TouchableOpacity>
        </IconsContainer>
        <Text fontfamily="bodyBold" fontsize="30px">
          Accounts
        </Text>

        <Spacer size={'large'} />
        {sheets && sheets.length > 0 && (
          <Input
            value={searchKeyword}
            theme={{roundness: 10}}
            style={{elevation: 2, marginBottom: 20}}
            placeholder="Search"
            onChangeText={k => setSearchKeyword(k)}
            clearButtonMode="while-editing"
          />
        )}

        <SheetsInfo navigation={navigation} searchKeyword={searchKeyword} />

        <NewSheet onPress={() => navigation.navigate('AddSheet')}>
          <AddSheetIcon name="add-outline" size={25} color="#fff" />
        </NewSheet>
      </MainWrapper>
    </SafeArea>
  );
};
