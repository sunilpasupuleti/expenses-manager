import React from 'react';
import styled from 'styled-components/native';
import * as Progress from 'react-native-progress';
import {Dimensions} from 'react-native';

const screenWidth = Dimensions.get('window').width;

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

export const SheetStatsCategoryColor = styled.View`
  position: absolute;
  left: 0px;
  width: 30px;
  height: 30px;
  border-radius: 50px;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
  ${props => props.color && `background-color : ${props.color};`}
`;

export const SheetStatsProgressBar = styled(Progress.Bar).attrs(props => ({
  height: 7,
  width: screenWidth - 40,
  borderRadius: 4,

  borderWidth: 0,
  animated: true,
  unfilledColor: '#ddd',
}))`
  margin-top: 10px;
`;
