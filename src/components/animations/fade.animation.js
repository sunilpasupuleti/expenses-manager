import React, {useEffect, useRef} from 'react';
import {Animated} from 'react-native';

export const FadeInView = ({duration = 1500, ...props}) => {
  const fadeanim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeanim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: true,
    }).start();
  }, [fadeanim, duration]);

  return (
    <Animated.View style={{...props.style, opacity: fadeanim}}>
      {props.children}
    </Animated.View>
  );
};
