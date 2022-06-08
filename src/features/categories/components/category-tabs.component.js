import {Tab, Tabs, TabText, TabView} from '../../../components/styles';
import Haptics from 'react-native-haptic-feedback';
import React, {useEffect, useState} from 'react';
import {Animated} from 'react-native';

export const CategoryTabs = ({setActiveType, activeType}) => {
  const [slideAnimation, setSlideAnimation] = useState(new Animated.Value(0));

  let interPolateRotating = slideAnimation.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [150, 0, -150],
  });

  const animatedStyles = {
    x: {
      transform: [
        {
          translateX: interPolateRotating,
        },
      ],
    },
  };

  function runAnimation() {
    if (activeType === 'expense') {
      slideAnimation.setValue(0);
      Animated.timing(slideAnimation, {
        toValue: 1,
        useNativeDriver: true,
        duration: 700,
      }).start(() => slideAnimation.setValue(1));
    } else {
      slideAnimation.setValue(2);
      Animated.timing(slideAnimation, {
        toValue: 1,
        useNativeDriver: true,
        duration: 700,
      }).start(() => slideAnimation.setValue(1));
    }
  }

  useEffect(() => {
    Haptics.trigger('impactMedium', {
      ignoreAndroidSystemSettings: true,
    });
    runAnimation();
  }, [activeType]);

  return (
    <Tabs>
      <Tab onPress={() => setActiveType('expense')}>
        <TabView
          active={activeType === 'expense'}
          style={activeType === 'expense' && animatedStyles.x}>
          <TabText>Expense</TabText>
        </TabView>
      </Tab>

      <Tab onPress={() => setActiveType('income')}>
        <TabView
          active={activeType === 'income'}
          style={activeType === 'income' && animatedStyles.x}>
          <TabText>Income</TabText>
        </TabView>
      </Tab>
    </Tabs>
  );
};
