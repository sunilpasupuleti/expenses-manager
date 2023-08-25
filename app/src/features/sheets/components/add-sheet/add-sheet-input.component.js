import React from 'react';
import {Input} from '../../../../components/styles';

export const AddSheetInput = ({
  setButtonDisabled,
  onSetSheetName,
  sheetName,
}) => {
  //   const [sheetName, setSheetName] = useState(null);

  const onChangeSheetName = name => {
    onSetSheetName(name);
    if (name === '') {
      setButtonDisabled(true);
      return;
    }
    setButtonDisabled(false);
  };

  return (
    <Input
      mode="outlined"
      value={sheetName}
      onChangeText={n => onChangeSheetName(n)}
      placeholder="Enter the account name"
      clearButtonMode="while-editing"
      maxLength={50}
    />
  );
};
