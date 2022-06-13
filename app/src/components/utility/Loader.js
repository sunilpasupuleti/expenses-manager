import React, {useEffect, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import styled from 'styled-components/native';

const LoaderContainer = styled.View`
  position: absolute;
  left: 0px;
  right: 0px;
  top: ${props => (props.backdrop ? '0px' : '0px')};
  bottom: ${props => (props.backdrop ? '0px' : '0px')};
  align-items: center;
  justify-content: center;
  background-color: ${props =>
    props.backdrop ? props.theme.colors.loader.backdrop : '#fff'};
`;

const LoaderMain = styled(Animated.View)`
  border-radius: 50px;
  width: 70px;
  height: 70px;
  border-top-color: ${props => props.theme.colors.loader.primary};
  border-bottom-color: ${props => props.theme.colors.loader.primary};
  border-width: 8px;
  border-color: ${props => props.theme.colors.loader.borderColor};
`;

export const Loader = () => {
  const isLoading = useSelector(state => state.loader.isLoading);
  const backdrop = useSelector(state => state.loader.backdrop);
  const [rotationAnimation, setRotationAnimation] = useState(
    new Animated.Value(0),
  );

  useEffect(() => {
    if (isLoading) {
      runAnimation();
    } else {
      rotationAnimation.setValue(0);
    }
  }, [isLoading]);

  const interPolateRotating = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyles = {
    upper: {
      transform: [
        {
          rotate: interPolateRotating,
        },
      ],
    },
  };

  function runAnimation() {
    Animated.loop(
      Animated.timing(rotationAnimation, {
        toValue: 1,
        useNativeDriver: true,
        duration: 1300,
      }),
      {
        // iterations: 9999,
      },
    ).start(() => rotationAnimation.setValue(1));
  }
  return isLoading ? (
    <LoaderContainer backdrop={backdrop}>
      <LoaderMain style={animatedStyles.upper} />
    </LoaderContainer>
  ) : null;
};
