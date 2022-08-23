import React, {useEffect, useState} from 'react';
import {SheetNameInput} from './add-sheet.styles';

export const AddSheetInput = ({
  setButtonDisabled,
  onSetSheetName,
  sheetName,
}) => {
  //   const [sheetName, setSheetName] = useState(null);

  const onChangeSheetName = name => {
    onSetSheetName(name.trim());
    if (name === '') {
      setButtonDisabled(true);
      return;
    }
    setButtonDisabled(false);
  };

  const onClearSheetName = () => {
    onSetSheetName(null);
    setButtonDisabled(true);
  };

  return (
    <SheetNameInput
      autoFocus
      theme={{roundness: 10}}
      mode="outlined"
      value={sheetName}
      onChangeText={n => onChangeSheetName(n)}
      placeholder="Enter the account name"
      right={
        <SheetNameInput.Icon
          name="close-circle"
          color="#bbb"
          onPress={onClearSheetName}
        />
      }
      maxLength={50}
    />
  );
};
