import React from 'react';
import getSymbolFromCurrency from 'currency-symbol-map';

export const GetCurrencySymbol = currency => {
  return getSymbolFromCurrency(currency);
};
