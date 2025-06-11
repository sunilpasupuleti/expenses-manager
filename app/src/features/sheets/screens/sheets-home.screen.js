import React, {useContext, useEffect, useState} from 'react';
import {AuthenticationContext} from '../../../services/authentication/authentication.context';
import {ObservedSheets} from './sheets-observed';
import {useIsFocused} from '@react-navigation/native';

const SheetsHomeScreen = ({navigation, route}) => {
  const {userData} = useContext(AuthenticationContext);
  const [searchKeyword, setSearchKeyword] = useState('');
  const routeIsFocused = useIsFocused();

  useEffect(() => {
    if (!routeIsFocused) {
      setSearchKeyword('');
    }
  }, [routeIsFocused]);
  if (!userData) return null;

  return (
    <ObservedSheets
      userId={userData.id}
      navigation={navigation}
      route={route}
      searchKeyword={searchKeyword}
      setSearchKeyword={setSearchKeyword}
    />
  );
};

export default SheetsHomeScreen;
