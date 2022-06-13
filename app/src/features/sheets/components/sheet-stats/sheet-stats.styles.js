import React from 'react';
import styled from 'styled-components/native';
export const StatsTitle = styled.View`
  background-color: ${({theme}) => theme.colors.brand.primary};
  padding: 4px;
  align-items: center;
  border-radius: 5px;
  width: 40%;
  margin: auto;
`;

export const ToolTip = styled.View`
  align-items: center;
  margin: auto;
  margin-top: 20px;
`;
