import React from 'react';
import {Input} from '../../../../components/styles';

export const AddSheetInput = ({
  value,
  onChangeText,
  placeholder,
  label,
  onBlur,
  keyboardType = 'default',
  maxLength = 50,
  style = {},
  setButtonDisabled, // optional
}) => {
  const handleChange = text => {
    if (setButtonDisabled) {
      setButtonDisabled(text === '');
    }
    onChangeText(text);
  };

  return (
    <Input
      label={label}
      style={style}
      mode="outlined"
      onBlur={onBlur}
      value={value}
      onChangeText={handleChange}
      placeholder={placeholder || label}
      keyboardType={keyboardType}
      maxLength={maxLength}
      clearButtonMode="while-editing"
    />
  );
};
