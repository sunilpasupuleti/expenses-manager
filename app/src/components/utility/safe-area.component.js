import {BlurView} from '@react-native-community/blur';
import React from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import {Image} from 'react-native';
import {Platform, StatusBar} from 'react-native';
import {Text} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import styled, {useTheme} from 'styled-components/native';

export const SafeAreaStyled = styled(SafeAreaView)`
  flex: 1;
  ${props =>
    Platform.OS === 'android' &&
    props.main &&
    StatusBar.currentHeight &&
    `margin-top : ${StatusBar.currentHeight}px`};
  ${props =>
    !props.mdBackground &&
    ` background-color: ${props.theme.colors.bg.primary};`}
`;

export const MainContainer = styled.View`
  flex: 1;
  background-color: ${props => props.theme.colors.bg.primary};
  padding: 0px;
`;

export const RenderBlurView = () => {
  const appState = useSelector(state => state.service.appState);
  const {width: viewportWidth, height: viewportHeight} =
    Dimensions.get('window');
  const theme = useTheme();
  const defaultStyleSheetProps = {
    theme,
    viewportHeight,
    viewportWidth,
  };

  return (
    (appState === 'inactive' || appState === 'background') && (
      <BlurView
        blurType="extraDark"
        blurAmount={7}
        style={styles(defaultStyleSheetProps).blurView}
      />
    )
  );
};

export const SafeArea = props => {
  const appState = useSelector(state => state.service.appState);
  const {width: viewportWidth, height: viewportHeight} =
    Dimensions.get('window');
  const theme = useTheme();
  const defaultStyleSheetProps = {
    theme,
    viewportHeight,
    viewportWidth,
  };
  const insets = useSafeAreaInsets();

  return (
    <>
      {!props.child && (
        <SafeAreaStyled {...props} insets={insets}>
          {props.children}
        </SafeAreaStyled>
      )}

      {props.child && (
        <MainContainer {...props} insets={insets}>
          {props.children}
        </MainContainer>
      )}
      {(appState === 'inactive' || appState === 'background') && (
        <BlurView
          blurType="extraDark"
          blurAmount={7}
          style={styles(defaultStyleSheetProps).blurView}
        />
      )}
    </>
  );

  //  to dispaly the app icon insted of blurring content

  // return appState === 'active' ? (
  //   <SafeAreaStyled {...props}>{props.children}</SafeAreaStyled>
  // ) : (
  //   <>
  //     <View style={styles(defaultStyleSheetProps).backgroundContainer}>
  //       <Image
  //         source={require('../../../assets/splash_icon.png')}
  //         style={styles(defaultStyleSheetProps).image}
  //       />
  //     </View>

  //     <BlurView
  //       blurType="ultraThinMaterial"
  //       blurAmount={15}
  //       style={styles(defaultStyleSheetProps).blurView}
  //     />
  //   </>
  // );
};

const styles = ({theme, viewportWidth, viewportHeight}) =>
  StyleSheet.create({
    backgroundContainer: {
      backgroundColor: theme.colors.brand.primary,
    },
    image: {
      width: viewportWidth,
      height: viewportHeight,
      resizeMode: 'center',
    },
    blurView: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      width: viewportWidth,
      height: viewportHeight,
    },
  });
