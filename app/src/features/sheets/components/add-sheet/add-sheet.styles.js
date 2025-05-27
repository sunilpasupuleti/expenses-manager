import {Card} from 'react-native-paper';
import styled from 'styled-components/native';
export const TopNavigationContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const AdvancedSettingsContainer = styled.View`
  margin: 50px 0px 0px 0px;
`;

export const AdvancedSettings = styled(Card).attrs({})`
  margin-top: 10px;
`;
