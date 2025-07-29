import Ionicons from 'react-native-vector-icons/Ionicons';
import React from 'react';
import styled from 'styled-components/native';
import {Text} from '../../../components/typography/text.component';
import {SafeArea} from '../../../components/utility/safe-area.component';
import {colors} from '../../../infrastructure/theme/colors';

export const TopContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 10px;
`;

export const LastSyncedContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 5px;
`;

export const NavigationBar = styled.View`
  background-color: ${({theme}) => theme.colors.bg.card};
  border-radius: 25px;
  padding: 15px 20px;
  margin-right: 8px;
  border-width: 0.5px;
  border-color: ${({theme}) => theme.colors.bg.card};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  min-width: 100%;
`;

export const NavIconButton = styled.TouchableOpacity`
  align-items: center;
  flex: 1;
`;

export const NavIconCircle = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
`;

export const NavLabel = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  text-align: center;
`;

// flex-direction: row;
// align-items: center;
// position: absolute;
// bottom: 20px;
// right: 20px;
export const HeaderIconContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #10b981;
  border-radius: 100px;
  padding: 8px;
`;

export const HeaderRow = styled.View`
  flex-direction: row;
  margin-top: 10px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

export const AiButton = styled.View`
  flex-direction: row;
  align-items: center;
  position: absolute;
  background-color: rgba(255, 255, 255, 0.9);
  bottom: 20px;
  right: 20px;
  border-radius: 50px;
  padding-vertical: 14px;
  padding-horizontal: 18px;
  min-width: 140px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.3);
  shadow-color: #667eea;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 20px;
  elevation: 12;
`;

export const HeaderIcon = styled(Ionicons)`
  margin-right: 3px;
`;

export const SheetsList = styled.FlatList.attrs({
  contentContainerStyle: {},
  showsVerticalScrollIndicator: false,
})``;

export const NoSheets = styled(SafeArea)`
  align-items: center;
  justify-content: center;
  padding: 24px;
`;
