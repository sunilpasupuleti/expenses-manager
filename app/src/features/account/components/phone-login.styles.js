import React from 'react';
import {TextInput} from 'react-native-paper';
import styled from 'styled-components/native';
import {colors} from '../../../infrastructure/theme/colors';

export const OTPContainer = styled.Pressable`
  align-items: center;
  justify-content: center;
`;

export const OTPinputContainer = styled.View`
  justify-content: center;
  align-items: center;
`;

export const TextInputHidden = styled(TextInput)`
  position: absolute;
  opacity: 0;
  width: 100%;
  background-color: transparent;
`;

export const SplitOTPBoxesContainer = styled.Pressable`
  width: 100%;
  flex-direction: row;
  justify-content: space-evenly;
`;

export const SplitBoxes = styled.View`
  border-color: ${colors.brand.secondary};
  border-width: 2px;
  border-radius: 5px;
  padding: 10px;
  min-width: 45px;
`;

export const SplitBoxText = styled.Text`
  font-size: 20px;
  text-align: center;
`;

export const SplitBoxesFocused = styled(SplitBoxes)`
  border-color: ${colors.brand.primary};
`;
