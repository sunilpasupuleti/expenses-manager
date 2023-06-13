import React from 'react';
import {Platform, StatusBar} from 'react-native';
import styled from 'styled-components/native';

export const SafeAreaStyled = styled.SafeAreaView`
  flex: 1;
  ${props =>
    Platform.OS === 'android' &&
    props.main &&
    StatusBar.currentHeight &&
    `margin-top : ${StatusBar.currentHeight}px`};
  background-color: ${props => props.theme.colors.ui.body};
`;
// ${Platform.OS === "android" &&
// StatusBar.currentHeight &&
// `margin-top : ${StatusBar.currentHeight}px`};

export const SafeArea = props => {
  return <SafeAreaStyled {...props}>{props.children}</SafeAreaStyled>;
};
