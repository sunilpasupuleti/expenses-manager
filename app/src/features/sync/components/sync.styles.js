import Ionicons from 'react-native-vector-icons/Ionicons';
import React from 'react';
import styled from 'styled-components/native';
import {Text} from '../../../components/typography/text.component';
import {colors} from '../../../infrastructure/theme/colors';
export const SyncTitle = styled(Text)`
  text-align: center;
  padding-top: 15px;
`;

export const SyncCloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 25px;
  right: 20px;
`;
