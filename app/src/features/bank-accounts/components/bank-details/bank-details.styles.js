import styled from 'styled-components/native';

export const StickyButtonContainer = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({theme}) => theme.colors.brand.primary};
  padding: 10px;
  padding-bottom: ${({insets}) => insets.bottom + 10}px;
  flex-direction: row;
  justify-content: space-between;
  border-top-width: 1px;
  border-color: ${({theme}) => theme.colors.brand.primary};
  z-index: 10;
`;
