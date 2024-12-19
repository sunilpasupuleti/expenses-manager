import React, {useContext, useEffect, useState} from 'react';
import {Dialog, Divider, Portal} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text} from '../typography/text.component';
import {GetCurrencySymbol} from '../symbol.currency';
import {getCurrencies} from 'react-native-localize';
import {Spacer} from '../spacer/spacer.component';
import {useTheme} from 'styled-components/native';
import {FlexRow, Input, TouchableHighlightWithColor} from '../styles';
import {FlatList, TouchableOpacity, View} from 'react-native';
import currenciesData from './currencies.json';
import {SettingsContext} from '../../services/settings/settings.context';

export const SelectBaseCurrency = () => {
  const theme = useTheme();
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const {baseCurrency, setBaseCurrency, onUpdateBaseCurrency} =
    useContext(SettingsContext);

  const onClickAddAndContinue = currency => {
    if (currency) {
      onUpdateBaseCurrency(
        currency,
        () => {
          onHideDialog();
        },
        () => {
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
          style={{alignSelf: 'center', fontWeight: 'bold', paddingTop: 0}}>
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
        <View
          style={{
            padding: 5,
          }}>
          <Input
            value={searchKeyword}
            placeholder="Search currencies"
            clearButtonMode="while-editing"
            onChangeText={k => setSearchKeyword(k)}
          />
        </View>

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
                    onClickAddAndContinue(c);
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
