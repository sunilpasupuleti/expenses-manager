import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, Card, Divider } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useTheme } from 'styled-components/native';
import { Spacer } from '../../../components/spacer/spacer.component';
import {
  ButtonText,
  FlexRow,
  Input,
  MainWrapper,
  TouchableHighlightWithColor,
} from '../../../components/styles';
import { GetCurrencySymbol } from '../../../components/symbol.currency';
import { Text } from '../../../components/typography/text.component';
import { SafeArea } from '../../../components/utility/safe-area.component';

export const CurrenciesScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const exchangeRates = useSelector(state => state.service.exchangeRates);
  const [currencies, setCurrencies] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [displayMode, setDisplayMode] = useState(false);
  useEffect(() => {
    if (exchangeRates) {
      setCurrencies(exchangeRates);
    }
  }, [exchangeRates]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: displayMode ? 'Curreny Rates' : 'Select Currency',
      headerLeft: () =>
        !displayMode ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FlexRow>
              <Ionicons
                name="chevron-back-outline"
                size={25}
                color={theme.colors.brand.primary}
              ></Ionicons>
              <Text color={theme.colors.brand.primary}>New Account</Text>
            </FlexRow>
          </TouchableOpacity>
        ) : null,
      headerRight: () =>
        !displayMode ? (
          <Button
            uppercase={false}
            onPress={() =>
              navigation.navigate(
                'AddSheet',
                {
                  selectedCurrency: selectedCurrency,
                },
                {
                  pop: true,
                },
              )
            }
          >
            <ButtonText>Done</ButtonText>
          </Button>
        ) : (
          <Ionicons
            onPress={() => navigation.goBack()}
            style={{ marginRight: 10 }}
            name="close-circle-outline"
            size={30}
            color={theme.colors.brand.primary}
          />
        ),
    });
  }, [selectedCurrency, displayMode]);

  useEffect(() => {
    setCurrencies({ ...exchangeRates });
    if (searchKeyword !== '') {
      let filtered = {};
      Object.keys(exchangeRates).filter(key => {
        let c = exchangeRates[key];
        if (key.toLowerCase().includes(searchKeyword.trim().toLowerCase())) {
          filtered[key] = c;
        }
      });
      setCurrencies(filtered);
    }
  }, [searchKeyword]);

  useEffect(() => {
    if (route.params && route.params.selectedCurrency) {
      setSelectedCurrency(route.params.selectedCurrency);
    }
    if (route.params && route.params.display) {
      setDisplayMode(true);
    }
  }, [route.params]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg.primary,
      }}
    >
      <MainWrapper>
        <Input
          value={searchKeyword}
          placeholder="Search currencies"
          clearButtonMode="while-editing"
          onChangeText={k => setSearchKeyword(k)}
        />
        <Spacer size={'xlarge'}></Spacer>

        {(currencies && selectedCurrency) || displayMode ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card
              theme={{ roundness: 10 }}
              style={{ margin: 0.5, backgroundColor: theme.colors.bg.card }}
            >
              {Object.keys(currencies).map(key => {
                let c = currencies[key];
                let currency = GetCurrencySymbol(key);
                return (
                  <TouchableHighlightWithColor
                    key={key}
                    onPress={() => {
                      if (!displayMode) {
                        setSelectedCurrency(key);
                      }
                    }}
                    style={
                      selectedCurrency === key && {
                        backgroundColor: theme.colors.brand.secondary,
                      }
                    }
                  >
                    <Card.Content>
                      {!displayMode && (
                        <FlexRow justifyContent="space-between">
                          <Text fontfamily="heading">{key}</Text>
                          <Text fontfamily="headingSemiBold">{currency}</Text>
                        </FlexRow>
                      )}

                      {displayMode && (
                        <FlexRow justifyContent="space-between">
                          <View style={{ flexBasis: '30%' }}>
                            <Text fontfamily="heading">
                              {c} {' ( '}
                              <Text fontfamily="headingSemiBold">
                                {currency}
                              </Text>
                              {' ) '}
                            </Text>
                            <Spacer size={'medium'} />
                            <Text fontsize="11px" color="#aaa">
                              {key}
                            </Text>
                          </View>
                          <Text> =</Text>
                          <Text fontfamily="heading">
                            1 {selectedCurrency}
                            {' ( '}
                            {GetCurrencySymbol(selectedCurrency)} {')'}
                          </Text>
                        </FlexRow>
                      )}

                      <Spacer size={'small'} />
                      <Divider />
                    </Card.Content>
                  </TouchableHighlightWithColor>
                );
              })}
            </Card>
          </ScrollView>
        ) : (
          <View
            style={{
              flex: 1,
              alignContent: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ textAlign: 'center' }} fontfamily="heading">
              No Currency Selection available for now! Try again later or
              contact admin
            </Text>
          </View>
        )}
      </MainWrapper>
    </View>
  );
};
