/* eslint-disable react/no-unstable-nested-components */
import Ionicons from 'react-native-vector-icons/Ionicons';

import React, {useContext, useEffect, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import {useTheme} from 'styled-components/native';
import {SheetsInfo} from '../components/sheet-info/sheet-info.component';
import {
  AddSheetIcon,
  IconsContainer,
  LastSyncedContainer,
  NewSheet,
  TopContainer,
  UpperIcon,
} from '../components/sheets.styles';
import {Spacer} from '../../../components/spacer/spacer.component';
import {Input, MainWrapper} from '../../../components/styles';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {SheetsContext} from '../../../services/sheets/sheets.context';
import _ from 'lodash';
import {searchKeywordRegex} from '../../../components/utility/helper';
import {useIsFocused} from '@react-navigation/native';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import moment from 'moment';

export const SheetsScreen = ({navigation, route}) => {
  const theme = useTheme();
  const {getSheets} = useContext(SheetsContext);
  const {userAdditionalDetails, userData} = useContext(AuthenticationContext);

  const [searchKeyword, setSearchKeyword] = useState(null);
  const [sheets, setSheets] = useState({
    regular: [],
    pinned: [],
    archived: [],
    totalCount: 0,
  });
  const routeIsFocused = useIsFocused();
  const {reRender} = route.params || {};

  useEffect(() => {
    if (routeIsFocused && userData) {
      onGetSheets();
    } else {
      setSearchKeyword(null);
    }
  }, [routeIsFocused, userData]);

  useEffect(() => {
    if (reRender) {
      navigation.setParams({reRender: false});
      onGetSheets();
    } else {
      setSearchKeyword(null);
    }
  }, [reRender]);

  useEffect(() => {
    if (searchKeyword !== null && searchKeywordRegex.test(searchKeyword)) {
      onSearch();
    } else if (searchKeyword === '') {
      onGetSheets();
    }
  }, [searchKeyword]);

  const onGetSheets = async (keyword = null) => {
    let data = await getSheets(keyword);
    if (data) {
      setSheets(data);
    }
  };

  const onSearch = async () => {
    onGetSheets(_.toLower(searchKeyword));
  };

  return (
    <SafeArea>
      <MainWrapper>
        <TopContainer
          lastSynced={userAdditionalDetails?.lastSynced ? true : false}>
          {userAdditionalDetails?.lastSynced && (
            <LastSyncedContainer>
              <Text color={'green'} fontfamily="bodyBold" fontsize="12px">
                Last Synced :{' '}
                {moment(userAdditionalDetails.lastSynced).calendar()}
              </Text>
            </LastSyncedContainer>
          )}

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
        </TopContainer>

        <Text fontfamily="bodyBold" fontsize="30px">
          Accounts
        </Text>

        <Spacer size={'large'} />
        {sheets.totalCount > 0 && (
          <Input
            value={searchKeyword}
            theme={{roundness: 10}}
            style={{elevation: 2, marginBottom: 20}}
            placeholder="Search"
            onChangeText={k => setSearchKeyword(k)}
            clearButtonMode="while-editing"
          />
        )}

        <SheetsInfo
          navigation={navigation}
          totalCount={sheets.totalCount}
          regularSheets={sheets.regular}
          pinnedSheets={sheets.pinned}
          archivedSheets={sheets.archived}
          onGetSheets={onGetSheets}
        />

        <NewSheet onPress={() => navigation.navigate('AddSheet')}>
          <AddSheetIcon name="add-outline" size={25} color="#fff" />
        </NewSheet>
      </MainWrapper>
    </SafeArea>
  );
};
