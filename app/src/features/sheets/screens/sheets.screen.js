import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useContext, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {Searchbar} from 'react-native-paper';
import {useTheme} from 'styled-components/native';
import {Spacer} from '../../../components/spacer/spacer.component';
import {MainWrapper} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import {SheetsInfo} from '../components/sheet-info.component';
import {
  AddSheetIcon,
  IconsContainer,
  NewSheet,
  Title,
  UpperIcon,
} from '../components/sheets.styles';

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
              name="md-cog-outline"
              size={30}
              color={theme.colors.brand.primary}
            />
          </TouchableOpacity>
        </IconsContainer>
        <Text fontfamily="bodyBold" fontsize="30px">
          Sheets
        </Text>

        <Spacer size={'large'} />
        {sheets && sheets.length > 0 && (
          <Searchbar
            value={searchKeyword}
            theme={{roundness: 10}}
            style={{elevation: 2}}
            placeholder="Search"
            onChangeText={k => setSearchKeyword(k)}
            clearIcon={() =>
              searchKeyword !== '' && (
                <Ionicons
                  onPress={() => setSearchKeyword('')}
                  name="close-circle-outline"
                  size={25}
                  color={theme.colors.brand.primary}
                />
              )
            }
          />
        )}

        <SheetsInfo navigation={navigation} searchKeyword={searchKeyword} />

        <NewSheet onPress={() => navigation.navigate('AddSheet')}>
          <AddSheetIcon
            name="md-add-circle-outline"
            size={25}
            color={theme.colors.brand.primary}
          />
          <Text fontfamily="heading" color={theme.colors.brand.primary}>
            New Sheet
          </Text>
        </NewSheet>
      </MainWrapper>
    </SafeArea>
  );
};
