import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Dialog, Divider, Portal, Searchbar} from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text} from '../typography/text.component';
import {GetCurrencySymbol} from '../symbol.currency';
import {getCurrencies} from 'react-native-localize';
import {Spacer} from '../spacer/spacer.component';
import {useTheme} from 'styled-components/native';
import {FlexRow, TouchableHighlightWithColor} from '../styles';
import {FlatList, ScrollView, TouchableOpacity, View} from 'react-native';
import currenciesData from './currencies.json';
import {SettingsContext} from '../../services/settings/settings.context';

export const SelectBaseCurrency = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const {baseCurrency, setBaseCurrency, onUpdateBaseCurrency} =
    useContext(SettingsContext);

  const onClickAddAndContinue = () => {
    if (selectedCurrency) {
      setLoading(true);
      onUpdateBaseCurrency(
        selectedCurrency,
        () => {
          setLoading(false);
          onHideDialog();
        },
        () => {
          setLoading(false);
          onHideDialog();
        },
      );
    }
  };

  const onHideDialog = () => {
    setBaseCurrency({
      dialog: false,
      currency: null,
    });
  };

  useEffect(() => {
    checkIfBaseCurrencyExists();
  }, [baseCurrency]);

  const checkIfBaseCurrencyExists = () => {
    if (baseCurrency.dialog && baseCurrency.currency) {
      let crncies = [...currenciesData];
      // replace to the first item selected item
      let fromIndex = crncies.findIndex(c => c === baseCurrency.currency);
      let toIndex = 0;
      const element = crncies.splice(fromIndex, 1)[0];
      setSelectedCurrency(element);
      crncies.splice(toIndex, 0, element);
      setCurrencies(crncies);
    } else {
      let crncies = [...currenciesData];
      let crncy = getCurrencies()[0] ? getCurrencies()[0] : 'INR';
      let fromIndex = crncies.findIndex(c => c === crncy);
      let toIndex = 0;
      const element = crncies.splice(fromIndex, 1)[0];
      crncies.splice(toIndex, 0, element);
      setCurrencies(crncies);
    }
  };

  useEffect(() => {
    // setCurrencies(currenciesData);
    checkIfBaseCurrencyExists();
    if (searchKeyword !== '') {
      let filtered = currencies.filter(currency => {
        return currency
          .toLowerCase()
          .includes(searchKeyword.trim().toLowerCase());
      });
      setCurrencies(filtered);
    }
  }, [searchKeyword]);

  return (
    <Portal>
      <Dialog
        visible={baseCurrency.dialog}
        dismissable={baseCurrency.currency ? true : false}
        onDismiss={onHideDialog}
        style={{
          height: '85%',
        }}
        theme={{
          colors: {
            backdrop: 'rgba(0, 0, 0, 0.5)',
          },
        }}>
        <Dialog.Title
          style={{alignSelf: 'center', fontWeight: 'bold', paddingTop: 20}}>
          Select Your Base Currency
        </Dialog.Title>
        {selectedCurrency && (
          <>
            <Text style={{textAlign: 'center'}}>
              Selected -{' '}
              <Text
                style={{fontWeight: 'bold'}}
                fontsize="20px"
                color={theme.colors.brand.primary}>
                {selectedCurrency.toUpperCase()} (
                {GetCurrencySymbol(selectedCurrency)})
              </Text>
            </Text>
            <Spacer size="medium" />
          </>
        )}
        <Searchbar
          value={searchKeyword}
          theme={{roundness: 10}}
          style={{elevation: 2}}
          placeholder="Search currencies"
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
          onChangeText={k => setSearchKeyword(k)}
        />

        <TouchableOpacity
          onPress={onClickAddAndContinue}
          style={{
            position: 'absolute',
            right: -10,
            top: -20,
            backgroundColor:
              !selectedCurrency || loading
                ? '#aaa'
                : theme.colors.brand.primary,
            padding: 10,
            paddingLeft: 20,
            paddingRight: 20,
            borderRadius: 20,
          }}>
          <MaterialCommunityIcons name={'check-bold'} size={20} color={'#fff'}>
            {loading ? 'Updating' : 'Continue'}
          </MaterialCommunityIcons>
        </TouchableOpacity>

        <Spacer size="large" />
        {currencies && currencies.length > 0 ? (
          <FlatList
            data={currencies}
            ItemSeparatorComponent={<Divider />}
            renderItem={({item, index}) => {
              let c = item;
              let currency = GetCurrencySymbol(c);
              return (
                <TouchableHighlightWithColor
                  key={c}
                  onPress={() => {
                    setSelectedCurrency(c);
                  }}
                  style={
                    selectedCurrency === c && {
                      backgroundColor: theme.colors.brand.secondary,
                    }
                  }>
                  <>
                    <FlexRow justifyContent="space-between">
                      <View style={{flexBasis: '30%'}}>
                        <Text fontsize="20px">{c}</Text>
                      </View>
                      <Text fontfamily="heading" fontsize="20px">
                        {currency}
                      </Text>
                    </FlexRow>

                    <Spacer size={'medium'} />
                  </>
                </TouchableHighlightWithColor>
              );
            }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignContent: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{textAlign: 'center'}} fontfamily="heading">
              No Currency Selection available for now! Try again later or
              contact admin
            </Text>
          </View>
        )}
      </Dialog>
    </Portal>
  );
};
