import React from 'react';
import getSymbolFromCurrency from 'currency-symbol-map';

export const GetCurrencySymbol = currency => {
  return getSymbolFromCurrency(currency);
};

export const GetCurrencyLocalString = number => {
  return number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
