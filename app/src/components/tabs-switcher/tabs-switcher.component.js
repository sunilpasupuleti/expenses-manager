import React, {useEffect, useRef} from 'react';
import {Animated, Dimensions} from 'react-native';
import {
  Indicator,
  TabButton,
  TabLabel,
  TabWrapper,
} from './tabs-switcher.styles';

const screenWidth = Dimensions.get('window').width;

export const TabsSwitcher = ({
  tabs = [],
  activeKey,
  setActiveKey,
  tabReverse = false,
}) => {
  const reversedTabs = tabReverse ? [...tabs].reverse() : tabs;
  const tabWidth = screenWidth / reversedTabs.length;

  function getInitialPosition(tabsParam, key, width) {
    const index = tabsParam.findIndex(tab => tab.key === key);
    return index * width;
  }

  const indicatorPosition = useRef(
    new Animated.Value(getInitialPosition(reversedTabs, activeKey, tabWidth)),
  ).current;

  function runAnimation() {
    const index = reversedTabs.findIndex(tab => tab.key === activeKey);
    Animated.timing(indicatorPosition, {
      toValue: index * tabWidth,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }

  useEffect(() => {
    if (activeKey) {
      runAnimation();
    }
  }, [activeKey, tabReverse]);

  return (
    <TabWrapper>
      <Indicator
        style={{transform: [{translateX: indicatorPosition}], width: tabWidth}}
      />
      {reversedTabs.map(tab => (
        <TabButton key={tab.key} onPress={() => setActiveKey(tab.key)}>
          <TabLabel active={activeKey === tab.key}>{tab.label}</TabLabel>
        </TabButton>
      ))}
    </TabWrapper>
  );
};
