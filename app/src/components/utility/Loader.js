import React, {useEffect, useState} from 'react';
import {Animated} from 'react-native';
import {useSelector} from 'react-redux';
import styled from 'styled-components/native';
import Lottie from 'lottie-react-native';

import backup from '../../../assets/lottie/backup.json';
import excel from '../../../assets/lottie/excel.json';
import image_upload from '../../../assets/lottie/image_upload.json';
import loader from '../../../assets/lottie/loader.json';
import pdf from '../../../assets/lottie/pdf.json';
import restore from '../../../assets/lottie/restore.json';
import app from '../../../assets/lottie/app.json';
import scanning from '../../../assets/lottie/scanning.json';
import security from '../../../assets/lottie/security.json';
import {Text} from '../typography/text.component';

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

const LoaderTextView = styled.View`
  position: absolute;
  bottom: 15%;
  padding: 10px;
`;

const LoaderText = styled(Text)`
  text-align: center;
`;

export const Loader = () => {
  const isLoading = useSelector(state => state.loader.isLoading);
  const backdrop = useSelector(state => state.loader.backdrop);
  const loaderType = useSelector(state => state.loader.loaderType);
  const loaderText = useSelector(state => state.loader.loaderText);

  const [rotationAnimation, setRotationAnimation] = useState(
    new Animated.Value(0),
  );

  const [animatedJson, setAnimatedJson] = useState(loader);

  useEffect(() => {
    if (isLoading) {
      if (loaderType === 'spinner') {
        runAnimation();
      }

      if (loaderType === 'backup') {
        setAnimatedJson(backup);
      }
      if (loaderType === 'app') {
        setAnimatedJson(app);
      }

      if (loaderType === 'restore') {
        setAnimatedJson(restore);
      }
      if (loaderType === 'security') {
        setAnimatedJson(security);
      }

      if (loaderType === 'scanning') {
        setAnimatedJson(scanning);
      }

      if (loaderType === 'pdf') {
        setAnimatedJson(pdf);
      }

      if (loaderType === 'excel') {
        setAnimatedJson(excel);
      }

      if (loaderType === 'image_upload') {
        setAnimatedJson(image_upload);
      }
    } else {
      if (loaderType === 'spinner') {
        rotationAnimation.setValue(0);
      } else {
        setAnimatedJson(loader);
      }
    }
  }, [isLoading, loaderType]);

  const interPolateRotating = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  //  if you want to use custome spinng loader
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
      {loaderType !== 'spinner' && (
        <Lottie
          source={animatedJson}
          autoPlay
          loop
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      )}
      {loaderType === 'spinner' && <LoaderMain style={animatedStyles.upper} />}
      {/* if you want to use spinner loader uncomment this and use */}
      {loaderText && (
        <LoaderTextView>
          <LoaderText fontsize="20px" color={'#fff'}>
            {loaderText}
          </LoaderText>
        </LoaderTextView>
      )}
    </LoaderContainer>
  ) : null;
};
