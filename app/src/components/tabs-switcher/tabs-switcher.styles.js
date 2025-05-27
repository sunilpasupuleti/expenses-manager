import styled from 'styled-components/native';
import {Text} from '../typography/text.component';
import {Animated} from 'react-native';

export const TabWrapper = styled.View`
  flex-direction: row;
  background-color: #ddd;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

export const Indicator = styled(Animated.View)`
  position: absolute;
  top: 0;
  bottom: 0;
  background-color: #605fd7;
  border-radius: 10px;
`;

export const TabButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px 0;
  align-items: center;
  justify-content: center;
`;

export const TabLabel = styled(Text).attrs({
  fontfamily: 'heading',
})`
  color: ${({active}) => (active ? '#fff' : '#333')};
`;
