/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/self-closing-comp */
import React, {useContext, useEffect, useRef, useState} from 'react';

import {useIsFocused} from '@react-navigation/native';
import {AuthenticationContext} from '../../../../services/authentication/authentication.context';
import {ObservedSheetDetails} from './sheet-details.observed';
import {FlexRow} from '../../../../components/styles';
import {TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Text} from '../../../../components/typography/text.component';
import {useTheme} from 'styled-components/native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {fetchExchangeRates} from '../../../../store/service-slice';
import {Spacer} from '../../../../components/spacer/spacer.component';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {useDispatch} from 'react-redux';

const menuOptionStyles = {
  optionWrapper: {padding: 15, paddingTop: 10},
  OptionTouchableComponent: TouchableOpacity,
};

const SheetDetailsHome = ({navigation, route, sheet}) => {
  const {userData} = useContext(AuthenticationContext);
  const [searchKeyword, setSearchKeyword] = useState('');
  const routeIsFocused = useIsFocused();
  const [filterParams, setFilterParams] = useState({
    status: false,
    fromDate: null,
    toDate: null,
  });
  const dispatch = useDispatch();
  let menuRef = useRef();
  const theme = useTheme();

  useEffect(() => {
    if (!routeIsFocused) {
      setSearchKeyword('');
    } else {
      setNavigationOptions();
      let filterBy = null;
      if (route.params?.filter) {
        filterBy = route.params.filter;

        setFilterParams(filterBy);
      }
      // checkUpcomingDetails(filterBy);
    }
  }, [routeIsFocused]);

  useEffect(() => {
    if (routeIsFocused && sheet) {
      setNavigationOptions();
    }
  }, [sheet, routeIsFocused]);

  const setNavigationOptions = () => {
    navigation.setOptions({
      headerTitle:
        sheet?.name?.length > 25
          ? sheet.name.substring(0, 25) + '...'
          : sheet.name,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FlexRow>
            <Ionicons
              name="chevron-back-outline"
              size={25}
              color={theme.colors.brand.primary}></Ionicons>
            <Text color={theme.colors.brand.primary}>Back</Text>
          </FlexRow>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <Menu
          style={{marginRight: 20}}
          onBackdropPress={() => menuRef.current.close()}
          ref={element => (menuRef.current = element)}>
          <MenuTrigger
            customStyles={{
              triggerTouchable: {
                underlayColor: '#eee',
                onPress: () => {
                  menuRef.current.open();
                },
              },
              TriggerTouchableComponent: TouchableOpacity,
            }}>
            <MaterialCommunityIcons
              name="dots-horizontal-circle-outline"
              size={25}
              color={theme.colors.brand.primary}
            />
          </MenuTrigger>
          <MenuOptions
            optionsContainerStyle={{
              marginRight: 10,
              marginTop: 35,
              borderRadius: 10,
              minWidth: 250,
            }}>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                navigation.navigate('SheetStats');
                menuRef.current.close();
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Analytics
                </Text>
                <Ionicons
                  style={{paddingBottom: 8}}
                  name="pie-chart-outline"
                  size={20}
                  color={'#000'}
                />
              </FlexRow>
            </MenuOption>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                navigation.navigate('SheetTrends', {sheet: sheet});
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Trends
                </Text>
                <Ionicons
                  style={{paddingBottom: 8}}
                  name="trending-up-outline"
                  size={20}
                  color={'#000'}
                />
              </FlexRow>
            </MenuOption>
            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                navigation.navigate('CurrencyRates', {
                  display: true,
                  selectedCurrency: sheet.currency,
                });
                dispatch(
                  fetchExchangeRates({
                    showAlert: false,
                    BASE_CURRENCY: sheet.currency,
                    dispatch: dispatch,
                  }),
                );
                menuRef.current.close();
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Curreny Rates
                </Text>
                <FontAwesome
                  style={{paddingBottom: 8}}
                  name="money"
                  size={20}
                  color={'#000'}
                />
              </FlexRow>
            </MenuOption>

            <MenuOption
              customStyles={menuOptionStyles}
              onSelect={() => {
                menuRef.current.close();
                navigation.navigate('SheetExport', {
                  sheet: sheet,
                });
                // onClickExportData();
              }}>
              <FlexRow justifyContent="space-between">
                <Text color="#2f2f2f" fontfamily="heading">
                  Export Account
                </Text>
                <FontAwesome5
                  style={{paddingBottom: 8}}
                  name="file-export"
                  size={18}
                  color={theme.colors.brand.primary}
                />
              </FlexRow>
            </MenuOption>
          </MenuOptions>
          <Spacer size={'medium'} />
        </Menu>
      ),
    });
  };

  if (!userData || !sheet) return null;

  return (
    <ObservedSheetDetails
      accountId={sheet.id}
      sheet={sheet}
      filterParams={filterParams}
      setFilterParams={setFilterParams}
      navigation={navigation}
      route={route}
      searchKeyword={searchKeyword}
      setSearchKeyword={setSearchKeyword}
    />
  );
};

export default SheetDetailsHome;
